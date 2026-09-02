import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ReceiptCard } from "../components/ReceiptCard";
import { receiptErrorView } from "../lib/receipts/presentation";
import type { SettlementReceipt } from "../lib/receipts/types";

const receipt: SettlementReceipt = {
  txHash: `0x${"a".repeat(64)}`,
  status: "confirmed",
  chainId: 5042002,
  blockNumber: "9999",
  confirmedAt: "2026-09-01T00:00:00.000Z",
  escrowAddress: "0x1000000000000000000000000000000000000000",
  clientAddress: "0x3000000000000000000000000000000000000000",
  creatorAddress: "0x2000000000000000000000000000000000000000",
  milestoneIndex: 2,
  milestoneDescription: "Content published",
  amountUsdc: "425",
  projectTitle: "Tokyo Skincare Campaign",
  explorerUrl: `https://testnet.arcscan.app/tx/0x${"a".repeat(64)}`
};

test("renders a confirmed receipt with independently verifiable payment facts", () => {
  const html = renderToStaticMarkup(<ReceiptCard receipt={receipt} />);

  for (const expected of [
    "Confirmed on Arc",
    "425",
    "USDC",
    "Tokyo Skincare Campaign",
    "Content published",
    "0x3000…0000",
    "0x2000…0000",
    "5042002",
    receipt.explorerUrl
  ]) {
    assert.match(html, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("maps receipt verification failures to distinct safe guidance", () => {
  assert.equal(receiptErrorView("INVALID_TRANSACTION_HASH").title, "Invalid receipt link");
  assert.equal(receiptErrorView("PAYMENT_EVENT_NOT_FOUND").title, "Not a settlement receipt");
  assert.equal(receiptErrorView("TRANSACTION_REVERTED").title, "Transaction reverted");
  assert.equal(receiptErrorView("CONTRACT_STATE_MISMATCH").title, "Receipt verification failed");
  assert.equal(receiptErrorView("RPC_UNAVAILABLE").title, "Arc is temporarily unavailable");
});
