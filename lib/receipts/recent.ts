import type { Hex } from "viem";
import type { SettlementReceipt } from "./types";

export type RecentReceiptItem = {
  txHash: Hex;
  receipt?: SettlementReceipt;
};

function normalizedHash(value: string) {
  return value.toLowerCase() as Hex;
}

export function mergeRecentReceipts(localHashes: readonly Hex[], indexedReceipts: readonly SettlementReceipt[]): RecentReceiptItem[] {
  const indexed = [...indexedReceipts]
    .sort((left, right) => right.confirmedAt.localeCompare(left.confirmedAt));
  const seen = new Set<string>();
  const merged: RecentReceiptItem[] = [];

  for (const receipt of indexed) {
    const txHash = normalizedHash(receipt.txHash);
    if (seen.has(txHash)) continue;
    seen.add(txHash);
    merged.push({ txHash, receipt: { ...receipt, txHash } });
  }

  for (const value of localHashes) {
    const txHash = normalizedHash(value);
    if (seen.has(txHash)) continue;
    seen.add(txHash);
    merged.push({ txHash });
  }

  return merged.slice(0, 20);
}
