export const CONTRACTS_STORAGE_KEY = "arc-settlement-contracts";
export const APPLICATIONS_STORAGE_KEY = "arc-job-applications";

export type ApplicationStatus = "Applied" | "Selected" | "Rejected" | "Completed";

export type JobApplication = {
  id: string;
  contractId: string;
  applicant: string;
  status: ApplicationStatus;
  appliedAt: string;
};

export type LocalContract = {
  id: string;
  title: string;
  creator: string;
  advertiser?: string;
  owner?: string;
  client?: string;
  totalUsdc: string;
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

function normalizeWallet(wallet: string | undefined) {
  return typeof wallet === "string" ? wallet.trim().toLowerCase() : "";
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
    appliedAt: record.appliedAt
  };
}

export function getApplications(storage: StorageLike | undefined = defaultStorage()): JobApplication[] {
  return readArray<unknown>(storage, APPLICATIONS_STORAGE_KEY)
    .map(normalizeApplication)
    .filter((application): application is JobApplication => Boolean(application));
}

export function isWalletOwner(wallet: string, contract: Pick<LocalContract, "advertiser" | "owner" | "client" | "creator">): boolean {
  const normalizedWallet = normalizeWallet(wallet);
  if (!normalizedWallet) return false;
  return [contract.advertiser, contract.owner, contract.client].some((owner) => normalizeWallet(owner) === normalizedWallet);
}

function readContracts(storage: StorageLike | undefined): LocalContract[] {
  return readArray<unknown>(storage, CONTRACTS_STORAGE_KEY)
    .filter((contract): contract is LocalContract => Boolean(contract && typeof contract === "object" && typeof (contract as LocalContract).id === "string"));
}

export function getContractsForWallet(wallet: string, storage: StorageLike | undefined = defaultStorage()): LocalContract[] {
  return readContracts(storage).filter((contract) => isWalletOwner(wallet, contract));
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
