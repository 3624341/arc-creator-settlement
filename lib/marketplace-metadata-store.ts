import { createClient } from "@supabase/supabase-js";
import { createPublicClient, http } from "viem";
import { escrowAbi } from "./abi";
import { ARC_RPC_URL, arcTestnet } from "./arc";
import { normalizeContractMetadataRows, type ContractMetadata, type ContractMetadataInput } from "./marketplace-metadata";

export type ContractMetadataRow = {
  escrow_address: string;
  advertiser_wallet: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export interface ContractMetadataBackend {
  list(addresses: string[]): Promise<ContractMetadataRow[]>;
  find(address: string): Promise<ContractMetadataRow | undefined>;
  insert(row: ContractMetadataRow): Promise<ContractMetadataRow>;
}

type ChainClient = {
  readContract(parameters: { address: `0x${string}`; abi: typeof escrowAbi; functionName: "client" }): Promise<unknown>;
};

type StoreEnvironment = Record<string, string | undefined>;
type StoreDependencies = {
  env?: StoreEnvironment;
  backend?: ContractMetadataBackend;
  chainClient?: ChainClient;
};

export type CreateMetadataError = "METADATA_UNAVAILABLE" | "ESCROW_UNAVAILABLE" | "ADVERTISER_MISMATCH" | "METADATA_CONFLICT" | "METADATA_SAVE_FAILED";
export type CreateMetadataResult =
  | { ok: true; created: boolean; metadata: ContractMetadata }
  | { ok: false; error: CreateMetadataError };

function createSupabaseBackend(env: StoreEnvironment): ContractMetadataBackend | undefined {
  const url = env.SUPABASE_URL;
  const secret = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return undefined;
  const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const columns = "escrow_address,advertiser_wallet,description,created_at,updated_at";
  return {
    async list(addresses) {
      const { data, error } = await client.from("contract_metadata").select(columns).in("escrow_address", addresses).limit(100);
      if (error) throw error;
      return data as ContractMetadataRow[] ?? [];
    },
    async find(address) {
      const { data, error } = await client.from("contract_metadata").select(columns).eq("escrow_address", address).maybeSingle();
      if (error) throw error;
      return data as ContractMetadataRow | null ?? undefined;
    },
    async insert(row) {
      const { data, error } = await client.from("contract_metadata").insert(row).select(columns).single();
      if (error) throw error;
      return data as ContractMetadataRow;
    }
  };
}

function backend(dependencies: StoreDependencies) {
  return dependencies.backend ?? createSupabaseBackend(dependencies.env ?? process.env);
}

function chainClient(dependencies: StoreDependencies): ChainClient {
  return dependencies.chainClient ?? createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC_URL) });
}

function fromRow(row: ContractMetadataRow): ContractMetadata | undefined {
  return normalizeContractMetadataRows([row])[0];
}

export async function listContractMetadata(addresses: string[], dependencies: StoreDependencies = {}) {
  const target = backend(dependencies);
  if (!target) return { enabled: false as const, metadata: [] as ContractMetadata[] };
  try {
    return { enabled: true as const, metadata: normalizeContractMetadataRows(await target.list(addresses)) };
  } catch {
    return { enabled: false as const, metadata: [] as ContractMetadata[] };
  }
}

export async function createContractMetadata(input: ContractMetadataInput, dependencies: StoreDependencies = {}): Promise<CreateMetadataResult> {
  const target = backend(dependencies);
  if (!target) return { ok: false, error: "METADATA_UNAVAILABLE" };

  const escrowAddress = input.escrowAddress.toLowerCase() as `0x${string}`;
  const advertiserWallet = input.advertiserWallet.toLowerCase();
  const description = input.description.trim();
  let onchainAdvertiser: string;
  try {
    onchainAdvertiser = String(await chainClient(dependencies).readContract({
      address: escrowAddress,
      abi: escrowAbi,
      functionName: "client"
    })).toLowerCase();
  } catch {
    return { ok: false, error: "ESCROW_UNAVAILABLE" };
  }
  if (onchainAdvertiser !== advertiserWallet) return { ok: false, error: "ADVERTISER_MISMATCH" };

  try {
    const existing = await target.find(escrowAddress);
    if (existing) {
      const metadata = fromRow(existing);
      if (!metadata) return { ok: false, error: "METADATA_SAVE_FAILED" };
      if (metadata.advertiserWallet !== advertiserWallet || metadata.description !== description) return { ok: false, error: "METADATA_CONFLICT" };
      return { ok: true, created: false, metadata };
    }

    const timestamp = new Date().toISOString();
    const inserted = await target.insert({
      escrow_address: escrowAddress,
      advertiser_wallet: advertiserWallet,
      description,
      created_at: timestamp,
      updated_at: timestamp
    });
    const metadata = fromRow(inserted);
    return metadata ? { ok: true, created: true, metadata } : { ok: false, error: "METADATA_SAVE_FAILED" };
  } catch {
    return { ok: false, error: "METADATA_SAVE_FAILED" };
  }
}
