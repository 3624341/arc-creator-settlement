import type { Address, Hex } from "viem";
import { decodePaymentReleasedLog, type ReceiptLog } from "./chain";

const HISTORY_KEY = "arc-settlement-receipts-v1";
const TRANSACTION_HASH = /^0x[a-f0-9]{64}$/;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function normalizeHash(value: string): Hex | null {
  const normalized = value.toLowerCase();
  return TRANSACTION_HASH.test(normalized) ? normalized as Hex : null;
}

export function readRecentReceiptHashes(storage: StorageLike): Hex[] {
  try {
    const parsed = JSON.parse(storage.getItem(HISTORY_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const unique = new Set<Hex>();
    for (const value of parsed) {
      if (typeof value !== "string") continue;
      const hash = normalizeHash(value);
      if (hash) unique.add(hash);
      if (unique.size === 20) break;
    }
    return [...unique];
  } catch {
    return [];
  }
}

export function saveRecentReceiptToStorage(storage: StorageLike, value: string): Hex[] {
  const hash = normalizeHash(value);
  if (!hash) return readRecentReceiptHashes(storage);
  const next = [hash, ...readRecentReceiptHashes(storage).filter((item) => item !== hash)].slice(0, 20);
  storage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function getRecentReceiptHashes() {
  if (typeof window === "undefined") return [];
  return readRecentReceiptHashes(window.localStorage);
}

export function saveRecentReceipt(hash: string) {
  if (typeof window === "undefined") return [];
  return saveRecentReceiptToStorage(window.localStorage, hash);
}

export async function requestReceiptIndex(txHash: string) {
  try {
    const response = await fetch("/api/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash })
    });
    return response.ok;
  } catch {
    return false;
  }
}

export type ReleaseMatch = {
  escrowAddress: Address;
  creatorAddress: Address;
  milestoneIndex: number;
};

export function selectReleaseTransaction(logs: readonly ReceiptLog[], match: ReleaseMatch): Hex | undefined {
  const escrow = match.escrowAddress.toLowerCase();
  const creator = match.creatorAddress.toLowerCase();
  for (const log of logs) {
    const release = decodePaymentReleasedLog(log);
    if (
      release &&
      release.escrowAddress.toLowerCase() === escrow &&
      release.creatorAddress.toLowerCase() === creator &&
      release.milestoneIndex === BigInt(match.milestoneIndex)
    ) {
      return release.txHash;
    }
  }
  return undefined;
}

export async function findCircleReleaseTransaction(input: ReleaseMatch & {
  loadLogs: () => Promise<readonly ReceiptLog[]>;
  attempts?: number;
  delayMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
}) {
  const attempts = input.attempts ?? 12;
  const delayMs = input.delayMs ?? 2_000;
  const sleep = input.sleep ?? ((milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds)));

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const hash = selectReleaseTransaction(await input.loadLogs(), input);
    if (hash) return hash;
    if (attempt < attempts - 1) await sleep(delayMs);
  }
  return undefined;
}
