import type { LocalContract } from "./marketplace-store";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const MIN_DESCRIPTION_LENGTH = 20;
const MAX_DESCRIPTION_LENGTH = 2_000;

export type ContractMetadata = {
  escrowAddress: string;
  advertiserWallet: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type ContractMetadataInput = {
  escrowAddress: string;
  advertiserWallet: string;
  description: string;
};

export function isContractMetadataAddress(value: unknown): value is string {
  return typeof value === "string" && ADDRESS_PATTERN.test(value);
}

export function isContractDescription(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const length = value.trim().length;
  return length >= MIN_DESCRIPTION_LENGTH && length <= MAX_DESCRIPTION_LENGTH;
}

export function normalizeContractMetadataRows(value: unknown): ContractMetadata[] {
  if (!Array.isArray(value)) return [];
  const metadata = new Map<string, ContractMetadata>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const rawEscrowAddress = row.escrow_address ?? row.escrowAddress;
    const rawAdvertiserWallet = row.advertiser_wallet ?? row.advertiserWallet;
    const rawCreatedAt = row.created_at ?? row.createdAt;
    const rawUpdatedAt = row.updated_at ?? row.updatedAt;
    if (!isContractMetadataAddress(rawEscrowAddress) || !isContractMetadataAddress(rawAdvertiserWallet) || !isContractDescription(row.description)) continue;
    if (typeof rawCreatedAt !== "string" || typeof rawUpdatedAt !== "string") continue;
    const escrowAddress = rawEscrowAddress.toLowerCase();
    if (metadata.has(escrowAddress)) continue;
    metadata.set(escrowAddress, {
      escrowAddress,
      advertiserWallet: rawAdvertiserWallet.toLowerCase(),
      description: row.description.trim(),
      createdAt: rawCreatedAt,
      updatedAt: rawUpdatedAt
    });
  }
  return [...metadata.values()];
}

export function mergeContractDescriptions(contracts: LocalContract[], metadata: ContractMetadata[]): LocalContract[] {
  const descriptions = new Map(metadata.map((item) => [item.escrowAddress.toLowerCase(), item.description]));
  return contracts.map((contract) => {
    const key = (contract.escrowAddress ?? contract.id).toLowerCase();
    const description = descriptions.get(key);
    return description ? { ...contract, description } : contract;
  });
}

export async function enrichContractDescriptions(
  contracts: LocalContract[],
  load: (escrowAddresses: string[]) => Promise<ContractMetadata[]> = fetchContractMetadata
): Promise<LocalContract[]> {
  const addresses = contracts
    .map((contract) => contract.escrowAddress ?? contract.id)
    .filter(isContractMetadataAddress);
  if (addresses.length === 0) return contracts;
  try {
    return mergeContractDescriptions(contracts, await load(addresses));
  } catch {
    return contracts;
  }
}

export async function fetchContractMetadata(escrowAddresses: string[], fetchImpl: typeof fetch = fetch): Promise<ContractMetadata[]> {
  const addresses = [...new Set(escrowAddresses.filter(isContractMetadataAddress).map((address) => address.toLowerCase()))].slice(0, 100);
  if (addresses.length === 0) return [];
  const response = await fetchImpl(`/api/contracts/metadata?escrowAddresses=${encodeURIComponent(addresses.join(","))}`, { cache: "no-store" });
  if (!response.ok) throw new Error("CONTRACT_METADATA_UNAVAILABLE");
  const body = await response.json() as { metadata?: unknown };
  return normalizeContractMetadataRows(body.metadata);
}

export async function saveContractMetadata(input: ContractMetadataInput, fetchImpl: typeof fetch = fetch): Promise<ContractMetadata> {
  const response = await fetchImpl("/api/contracts/metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const body = await response.json().catch(() => null) as { metadata?: unknown; error?: string } | null;
  if (!response.ok) throw new Error(body?.error ?? "CONTRACT_METADATA_SAVE_FAILED");
  const metadata = normalizeContractMetadataRows(body?.metadata ? [body.metadata] : [])[0];
  if (!metadata) throw new Error("CONTRACT_METADATA_SAVE_FAILED");
  return metadata;
}
