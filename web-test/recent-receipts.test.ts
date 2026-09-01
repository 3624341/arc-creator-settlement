import assert from "node:assert/strict";
import test from "node:test";
import { mergeRecentReceipts } from "../lib/receipts/recent";
import type { SettlementReceipt } from "../lib/receipts/types";

const hashA = `0x${"a".repeat(64)}` as const;
const hashB = `0x${"b".repeat(64)}` as const;
const hashC = `0x${"c".repeat(64)}` as const;

function receipt(txHash: `0x${string}`, confirmedAt: string): SettlementReceipt {
  return {
    txHash,
    status: "confirmed",
    chainId: 5042002,
    blockNumber: "1",
    confirmedAt,
    escrowAddress: "0x1000000000000000000000000000000000000000",
    clientAddress: "0x3000000000000000000000000000000000000000",
    creatorAddress: "0x2000000000000000000000000000000000000000",
    milestoneIndex: 0,
    milestoneDescription: "Content published",
    amountUsdc: "425",
    projectTitle: "Tokyo Skincare Campaign",
    explorerUrl: `https://testnet.arcscan.app/tx/${txHash}`
  };
}

test("merges recent receipts by hash, keeps indexed metadata, and preserves local fallback", () => {
  const merged = mergeRecentReceipts(
    [hashA, hashB.toUpperCase() as `0x${string}`],
    [receipt(hashC, "2026-09-01T02:00:00.000Z"), receipt(hashB, "2026-09-01T01:00:00.000Z")]
  );

  assert.deepEqual(merged.map((item) => item.txHash), [hashC, hashB, hashA]);
  assert.equal(merged[1].receipt?.amountUsdc, "425");
  assert.equal(merged[2].receipt, undefined);
});

test("merges recent receipts with a hard 20-item cap", () => {
  const local = Array.from({ length: 25 }, (_, index) => `0x${index.toString(16).padStart(64, "0")}` as `0x${string}`);
  assert.equal(mergeRecentReceipts(local, []).length, 20);
});
