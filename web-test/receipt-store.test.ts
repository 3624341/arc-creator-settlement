import assert from "node:assert/strict";
import test from "node:test";
import { indexReceipt, listRecentReceipts, type ReceiptStoreBackend } from "../lib/receipts/store";
import type { SettlementReceipt } from "../lib/receipts/types";

const receipt: SettlementReceipt = {
  txHash: `0x${"b".repeat(64)}`,
  status: "confirmed",
  chainId: 5042002,
  blockNumber: "10101",
  confirmedAt: "2026-09-01T01:00:00.000Z",
  escrowAddress: "0x1000000000000000000000000000000000000000",
  clientAddress: "0x3000000000000000000000000000000000000000",
  creatorAddress: "0x2000000000000000000000000000000000000000",
  milestoneIndex: 0,
  milestoneDescription: "Contract accepted",
  amountUsdc: "200",
  projectTitle: "Tokyo Skincare Campaign",
  explorerUrl: `https://testnet.arcscan.app/tx/0x${"b".repeat(64)}`
};

test("receipt store stays disabled without server Supabase configuration", async () => {
  assert.deepEqual(await indexReceipt(receipt.txHash, { env: {} }), { enabled: false, indexed: false });
  assert.deepEqual(await listRecentReceipts(20, { env: {} }), []);
});

test("verified receipt upsert stores only the onchain loader result", async () => {
  let written: SettlementReceipt | undefined;
  const backend: ReceiptStoreBackend = {
    upsert: async (value) => { written = value; },
    list: async () => []
  };

  const result = await indexReceipt(receipt.txHash, {
    backend,
    loadReceipt: async () => receipt
  });

  assert.deepEqual(result, { enabled: true, indexed: true, receipt });
  assert.deepEqual(written, receipt);
});

test("verified receipt upsert never writes when onchain verification fails", async () => {
  let writes = 0;
  const backend: ReceiptStoreBackend = {
    upsert: async () => { writes += 1; },
    list: async () => []
  };

  await assert.rejects(indexReceipt(receipt.txHash, {
    backend,
    loadReceipt: async () => { throw new Error("not a receipt"); }
  }), /not a receipt/);
  assert.equal(writes, 0);
});
