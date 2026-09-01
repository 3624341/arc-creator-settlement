import assert from "node:assert/strict";
import test from "node:test";
import { encodeAbiParameters, encodeEventTopics } from "viem";
import { decodePaymentReleasedLog, loadSettlementReceipt, type ReceiptDataSource } from "../lib/receipts/chain";
import { ReceiptError } from "../lib/receipts/types";

const txHash = `0x${"a".repeat(64)}` as const;
const escrowAddress = "0x1000000000000000000000000000000000000000" as const;
const creatorAddress = "0x2000000000000000000000000000000000000000" as const;
const clientAddress = "0x3000000000000000000000000000000000000000" as const;

const paymentReleasedEvent = {
  type: "event",
  name: "PaymentReleased",
  inputs: [
    { indexed: true, name: "milestoneId", type: "uint256" },
    { indexed: true, name: "creator", type: "address" },
    { indexed: false, name: "amount", type: "uint256" }
  ]
} as const;

function paymentLog(overrides: Partial<{ creator: `0x${string}`; milestoneIndex: bigint; amount: bigint; hash: `0x${string}` }> = {}) {
  const creator = overrides.creator ?? creatorAddress;
  const milestoneIndex = overrides.milestoneIndex ?? 2n;
  const amount = overrides.amount ?? 425_000_000n;
  return {
    address: escrowAddress,
    transactionHash: overrides.hash ?? txHash,
    topics: encodeEventTopics({ abi: [paymentReleasedEvent], eventName: "PaymentReleased", args: { milestoneId: milestoneIndex, creator } }),
    data: encodeAbiParameters([{ type: "uint256" }], [amount])
  };
}

function source(overrides: Partial<ReceiptDataSource> = {}): ReceiptDataSource {
  return {
    getTransactionReceipt: async () => ({ status: "success", blockNumber: 9_999n, logs: [paymentLog()] }),
    getBlock: async () => ({ timestamp: 1_788_220_800n }),
    readContract: async ({ functionName }) => {
      if (functionName === "client") return clientAddress;
      if (functionName === "creator") return creatorAddress;
      if (functionName === "title") return "Tokyo Skincare Campaign";
      if (functionName === "getMilestone") return ["Content published", 425_000_000n, true, true, true] as const;
      throw new Error(`Unexpected read: ${functionName}`);
    },
    ...overrides
  };
}

test("rejects a malformed transaction hash before RPC access", async () => {
  let called = false;

  await assert.rejects(
    loadSettlementReceipt("not-a-hash", {
      getTransactionReceipt: async () => {
        called = true;
        throw new Error("unexpected RPC access");
      }
    } as never),
    (error: unknown) => error instanceof Error && error.message === "INVALID_TRANSACTION_HASH"
  );

  assert.equal(called, false);
});

test("decodes PaymentReleased fields without trusting surrounding transaction data", () => {
  assert.deepEqual(decodePaymentReleasedLog(paymentLog()), {
    escrowAddress,
    txHash,
    milestoneIndex: 2n,
    creatorAddress,
    amount: 425_000_000n
  });
});

test("receipt loader normalizes a confirmed Arc milestone release", async () => {
  const receipt = await loadSettlementReceipt(txHash, source());

  assert.deepEqual(receipt, {
    txHash,
    status: "confirmed",
    chainId: 5042002,
    blockNumber: "9999",
    confirmedAt: "2026-09-01T00:00:00.000Z",
    escrowAddress,
    clientAddress,
    creatorAddress,
    milestoneIndex: 2,
    milestoneDescription: "Content published",
    amountUsdc: "425",
    projectTitle: "Tokyo Skincare Campaign",
    explorerUrl: `https://testnet.arcscan.app/tx/${txHash}`
  });
});

for (const [name, customSource, code] of [
  ["rejects a reverted transaction", source({ getTransactionReceipt: async () => ({ status: "reverted", blockNumber: 9_999n, logs: [paymentLog()] }) }), "TRANSACTION_REVERTED"],
  ["rejects a transaction without a release event", source({ getTransactionReceipt: async () => ({ status: "success", blockNumber: 9_999n, logs: [] }) }), "PAYMENT_EVENT_NOT_FOUND"],
  ["rejects an ambiguous transaction with two releases", source({ getTransactionReceipt: async () => ({ status: "success", blockNumber: 9_999n, logs: [paymentLog(), paymentLog()] }) }), "PAYMENT_EVENT_AMBIGUOUS"],
  ["rejects a creator mismatch", source({ readContract: async ({ functionName }) => functionName === "creator" ? "0x4000000000000000000000000000000000000000" : source().readContract({ functionName, address: escrowAddress, blockNumber: 9_999n }) }), "CONTRACT_STATE_MISMATCH"],
  ["rejects an unreleased milestone", source({ readContract: async ({ functionName }) => functionName === "getMilestone" ? ["Content published", 425_000_000n, true, true, false] : source().readContract({ functionName, address: escrowAddress, blockNumber: 9_999n }) }), "CONTRACT_STATE_MISMATCH"]
] as const) {
  test(`receipt loader ${name}`, async () => {
    await assert.rejects(
      loadSettlementReceipt(txHash, customSource),
      (error: unknown) => error instanceof ReceiptError && error.code === code
    );
  });
}
