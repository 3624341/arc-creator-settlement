export const CONTRACTS_STORAGE_KEY = "arc-settlement-contracts";
export const APPLICATIONS_STORAGE_KEY = "arc-job-applications";
export const HIDDEN_CONTRACTS_STORAGE_KEY = "arc-hidden-contracts";
export const SAVED_CONTRACTS_STORAGE_KEY = "arc-saved-contracts";

export type ApplicationStatus = "Applied" | "Selected" | "Rejected" | "Completed";

export type JobApplication = {
  id: string;
  contractId: string;
  applicant: string;
  status: ApplicationStatus;
  appliedAt: string;
  profileVersion?: number | null;
};

export type LocalContract = {
  id: string;
  title: string;
  creator: string;
  advertiser?: string;
  owner?: string;
  client?: string;
  totalUsdc: string;
  /** Current USDC held by a deployed escrow, when read from chain. */
  escrowBalanceUsdc?: string;
  status: string;
  escrowAddress?: string;
  applications?: JobApplication[];
};

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

type SaveOptions = {
  storage?: StorageLike;
  contracts?: LocalContract[];
};

export type SaveApplicationResult =
  | { ok: true; application: JobApplication }
  | { ok: false; error: "duplicate" | "owner" | "storage" };

function defaultStorage(): StorageLike | undefined {
  if (typeof window === "undefined" || !window.localStorage) return undefined;
  return window.localStorage;
}

function readArray<T>(storage: StorageLike | undefined, key: string): T[] {
  if (!storage) return [];
  try {
    const value: unknown = JSON.parse(storage.getItem(key) ?? "null");
    return Array.isArray(value) ? value as T[] : [];
  } catch {
    return [];
  }
}

function contractStorageId(contract: Pick<LocalContract, "id" | "escrowAddress">) {
  return (contract.escrowAddress ?? contract.id).trim().toLowerCase();
}

function hiddenContractKey(wallet: string, contract: Pick<LocalContract, "id" | "escrowAddress">) {
  return `${normalizeWallet(wallet)}:${contractStorageId(contract)}`;
}

function normalizeWallet(wallet: string | undefined) {
  return typeof wallet === "string" ? wallet.trim().toLowerCase() : "";
}

function readPreferenceKeys(storage: StorageLike | undefined, key: string) {
  return readArray<unknown>(storage, key).filter((value): value is string => typeof value === "string");
}

function writePreferenceKeys(storage: StorageLike | undefined, key: string, values: string[]) {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify([...new Set(values)]));
    return true;
  } catch {
    return false;
  }
}

function normalizeApplication(value: unknown): JobApplication | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || typeof record.contractId !== "string" || typeof record.applicant !== "string" || typeof record.appliedAt !== "string") return undefined;
  const status = record.status;
  if (status !== "Applied" && status !== "Selected" && status !== "Rejected" && status !== "Completed") return undefined;
  return {
    id: record.id,
    contractId: record.contractId,
    applicant: record.applicant,
    status,
    appliedAt: record.appliedAt,
    ...(typeof record.profileVersion === "number" ? { profileVersion: record.profileVersion } : {})
  };
}

export function getApplications(storage: StorageLike | undefined = defaultStorage()): JobApplication[] {
  return readArray<unknown>(storage, APPLICATIONS_STORAGE_KEY)
    .map(normalizeApplication)
    .filter((application): application is JobApplication => Boolean(application));
}

export function getApplicationForWallet(wallet: string, contractIds: string[], storage: StorageLike | undefined = defaultStorage()) {
  const normalizedWallet = normalizeWallet(wallet);
  const normalizedIds = new Set(contractIds.filter(Boolean).map((id) => id.trim().toLowerCase()));
  if (!normalizedWallet || normalizedIds.size === 0) return undefined;
  return getApplications(storage).find((application) =>
    normalizeWallet(application.applicant) === normalizedWallet && normalizedIds.has(application.contractId.trim().toLowerCase())
  );
}

export function isWalletOwner(wallet: string, contract: Pick<LocalContract, "advertiser" | "owner" | "client" | "creator">): boolean {
  const normalizedWallet = normalizeWallet(wallet);
  if (!normalizedWallet) return false;
  return [contract.advertiser, contract.owner, contract.client].some((owner) => normalizeWallet(owner) === normalizedWallet);
}

export function isWalletCreator(wallet: string, contract: Pick<LocalContract, "creator">): boolean {
  return normalizeWallet(wallet) !== "" && normalizeWallet(contract.creator) === normalizeWallet(wallet);
}

function readContracts(storage: StorageLike | undefined): LocalContract[] {
  return readArray<unknown>(storage, CONTRACTS_STORAGE_KEY)
    .filter((contract): contract is LocalContract => Boolean(contract && typeof contract === "object" && typeof (contract as LocalContract).id === "string"));
}

export function getContractsForWallet(wallet: string, storage: StorageLike | undefined = defaultStorage()): LocalContract[] {
  return readContracts(storage).filter((contract) => {
    if (isWalletOwner(wallet, contract)) return true;
    // Contracts created before advertiser/owner was persisted can only be
    // recovered from the legacy creator field. Keep this fallback limited to
    // records without an explicit owner so new creator recipients are not
    // mistaken for advertisers.
    const hasExplicitOwner = Boolean(contract.advertiser || contract.owner || contract.client);
    return !hasExplicitOwner && normalizeWallet(contract.creator) === normalizeWallet(wallet);
  });
}

export function deleteLocalContract(contract: LocalContract, storage: StorageLike | undefined = defaultStorage()) {
  if (!storage) return false;
  try {
    const remaining = readContracts(storage).filter((candidate) => candidate.id !== contract.id);
    storage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(remaining));
    return true;
  } catch {
    return false;
  }
}

export function hideContractForWallet(wallet: string, contract: LocalContract, storage: StorageLike | undefined = defaultStorage()) {
  if (!storage || !normalizeWallet(wallet)) return false;
  return writePreferenceKeys(storage, HIDDEN_CONTRACTS_STORAGE_KEY, [...readPreferenceKeys(storage, HIDDEN_CONTRACTS_STORAGE_KEY), hiddenContractKey(wallet, contract)]);
}

export function isContractHidden(wallet: string, contract: LocalContract, storage: StorageLike | undefined = defaultStorage()) {
  if (!storage || !normalizeWallet(wallet)) return false;
  return readPreferenceKeys(storage, HIDDEN_CONTRACTS_STORAGE_KEY).some((value) => value === hiddenContractKey(wallet, contract));
}

export function getHiddenContractsForWallet(wallet: string, contracts: LocalContract[], storage: StorageLike | undefined = defaultStorage()) {
  return contracts.filter((contract) => isContractHidden(wallet, contract, storage));
}

export function restoreContractForWallet(wallet: string, contract: LocalContract, storage: StorageLike | undefined = defaultStorage()) {
  if (!storage || !normalizeWallet(wallet)) return false;
  const key = hiddenContractKey(wallet, contract);
  return writePreferenceKeys(storage, HIDDEN_CONTRACTS_STORAGE_KEY, readPreferenceKeys(storage, HIDDEN_CONTRACTS_STORAGE_KEY).filter((value) => value !== key));
}

export function saveContractForWallet(wallet: string, contract: LocalContract, storage: StorageLike | undefined = defaultStorage()) {
  if (!storage || !normalizeWallet(wallet)) return false;
  return writePreferenceKeys(storage, SAVED_CONTRACTS_STORAGE_KEY, [...readPreferenceKeys(storage, SAVED_CONTRACTS_STORAGE_KEY), hiddenContractKey(wallet, contract)]);
}

export function unsaveContractForWallet(wallet: string, contract: LocalContract, storage: StorageLike | undefined = defaultStorage()) {
  if (!storage || !normalizeWallet(wallet)) return false;
  const key = hiddenContractKey(wallet, contract);
  return writePreferenceKeys(storage, SAVED_CONTRACTS_STORAGE_KEY, readPreferenceKeys(storage, SAVED_CONTRACTS_STORAGE_KEY).filter((value) => value !== key));
}

export function isContractSaved(wallet: string, contract: LocalContract, storage: StorageLike | undefined = defaultStorage()) {
  if (!storage || !normalizeWallet(wallet)) return false;
  return readPreferenceKeys(storage, SAVED_CONTRACTS_STORAGE_KEY).some((value) => value === hiddenContractKey(wallet, contract));
}

export function getSavedContractsForWallet(wallet: string, contracts: LocalContract[], storage: StorageLike | undefined = defaultStorage()) {
  return contracts.filter((contract) => isContractSaved(wallet, contract, storage));
}

export function saveApplication(application: JobApplication, options: SaveOptions = {}): SaveApplicationResult {
  const storage = options.storage ?? defaultStorage();
  if (!storage) return { ok: false, error: "storage" };

  const contracts = options.contracts ?? readContracts(storage);
  const contract = contracts.find((candidate) => candidate.id === application.contractId);
  if (contract && isWalletOwner(application.applicant, contract)) return { ok: false, error: "owner" };

  const applications = getApplications(storage);
  const duplicate = applications.some((candidate) => candidate.contractId === application.contractId && normalizeWallet(candidate.applicant) === normalizeWallet(application.applicant));
  if (duplicate) return { ok: false, error: "duplicate" };

  try {
    storage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify([...applications, application]));
    return { ok: true, application };
  } catch {
    return { ok: false, error: "storage" };
  }
}
