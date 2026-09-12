import assert from "node:assert/strict";
import test from "node:test";
import {
  getReviewerDemoCopy,
  loadReviewerDemo,
  resolveDemoLocale
} from "../lib/reviewer-demo";
import { ReceiptError, type ReceiptErrorCode, type SettlementReceipt } from "../lib/receipts/types";

function makeReceipt(): SettlementReceipt {
  return {
    txHash: `0x${"a".repeat(64)}`,
    status: "confirmed",
    chainId: 5042002,
    blockNumber: "61267146",
    confirmedAt: "2026-09-10T00:00:00.000Z",
    escrowAddress: "0x1000000000000000000000000000000000000000",
    clientAddress: "0x3000000000000000000000000000000000000000",
    creatorAddress: "0x2000000000000000000000000000000000000000",
    milestoneIndex: 0,
    milestoneDescription: "Publish Arc tutorial",
    amountUsdc: "1",
    projectTitle: "Arc creator education",
    explorerUrl: `https://testnet.arcscan.app/tx/0x${"a".repeat(64)}`
  };
}

test("reviewer demo defaults to English and accepts only Korean explicitly", () => {
  assert.equal(resolveDemoLocale(undefined), "en");
  assert.equal(resolveDemoLocale("ko"), "ko");
  assert.equal(resolveDemoLocale("en"), "en");
  assert.equal(resolveDemoLocale("ja"), "en");
  assert.equal(resolveDemoLocale(["ko", "en"]), "ko");
});

test("both locales describe six recorded settlement stages", () => {
  for (const locale of ["en", "ko"] as const) {
    const copy = getReviewerDemoCopy(locale);
    assert.equal(copy.steps.length, 6);
    assert.deepEqual(copy.steps.map((step) => step.number), [1, 2, 3, 4, 5, 6]);
    assert.ok(copy.steps.every((step) => step.kind === "recorded" || step.number === 6));
    assert.match(copy.testnetNotice, /testnet|테스트넷/i);
  }
});

test("verified state contains only the receipt returned by the chain verifier", async () => {
  const receipt = makeReceipt();
  const view = await loadReviewerDemo("en", { loadReceipt: async () => receipt });

  assert.equal(view.verification.status, "verified");
  if (view.verification.status === "verified") {
    assert.equal(view.verification.receipt, receipt);
  }
});

test("verification errors never become successful demo evidence", async () => {
  const codes: ReceiptErrorCode[] = [
    "INVALID_TRANSACTION_HASH",
    "TRANSACTION_NOT_FOUND",
    "TRANSACTION_REVERTED",
    "PAYMENT_EVENT_NOT_FOUND",
    "PAYMENT_EVENT_AMBIGUOUS",
    "CONTRACT_STATE_MISMATCH",
    "RPC_UNAVAILABLE"
  ];

  for (const code of codes) {
    const view = await loadReviewerDemo("en", {
      loadReceipt: async () => {
        throw new ReceiptError(code);
      }
    });
    assert.deepEqual(view.verification, { status: "unavailable", code });
  }
});

test("unexpected verifier failures are reported as RPC unavailable", async () => {
  const view = await loadReviewerDemo("ko", {
    loadReceipt: async () => {
      throw new Error("network transport failed");
    }
  });

  assert.deepEqual(view.verification, { status: "unavailable", code: "RPC_UNAVAILABLE" });
  assert.equal(view.locale, "ko");
});
