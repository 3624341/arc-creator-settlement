import assert from "node:assert/strict";
import test from "node:test";
import { summarizeCreatorSettlement } from "../lib/creator-verification";

test("aggregates only confirmed creator receipts without NaN", () => {
  const result = summarizeCreatorSettlement([
    { status: "confirmed", creator_address: "0xabc", escrow_address: "0xescrow1", amount_usdc: "1.25" },
    { status: "confirmed", creator_address: "0xABC", escrow_address: "0xescrow1", amount_usdc: "2.75" },
    { status: "pending", creator_address: "0xabc", escrow_address: "0xescrow2", amount_usdc: "100" },
    { status: "confirmed", creator_address: "0xother", escrow_address: "0xescrow3", amount_usdc: "not-a-number" },
  ], "0xAbC");
  assert.deepEqual(result, {
    walletSigned: true,
    arcSettlementVerified: true,
    completedPayouts: 2,
    distinctEscrows: 1,
    totalPaidUsdc: "4.00",
  });
  assert.equal(result.totalPaidUsdc.includes("NaN"), false);
});

test("returns zero-safe verification when there are no receipts", () => {
  assert.deepEqual(summarizeCreatorSettlement([], "0xabc"), {
    walletSigned: true,
    arcSettlementVerified: false,
    completedPayouts: 0,
    distinctEscrows: 0,
    totalPaidUsdc: "0.00",
  });
});
