import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CROSS_CHAIN_FUNDING_STORAGE_KEY,
  formatCrossChainUsdc,
  isReadyToFund,
  isValidCrossChainFundingRecord,
  parseCrossChainUsdc,
  readCrossChainFundingRecord,
  shouldResumeBridge,
  writeCrossChainFundingRecord,
  type CrossChainFundingRecord,
} from "../lib/cross-chain-funding";

const baseRecord: CrossChainFundingRecord = {
  id: "bridge-1",
  escrowId: "escrow-1",
  escrowAddress: "0x1111111111111111111111111111111111111111",
  walletAddress: "0x2222222222222222222222222222222222222222",
  sourceChain: "Base_Sepolia",
  destinationChain: "Arc_Testnet",
  token: "USDC",
  amountAtomic: "1234567",
  escrowAmountAtomic: "1000000",
  bridgeStatus: "awaiting-arc",
  createdAt: "2026-09-10T00:00:00.000Z",
  updatedAt: "2026-09-10T00:00:00.000Z",
};

test("cross-chain USDC amounts use integer atomic units", () => {
  assert.equal(parseCrossChainUsdc("1.234567"), 1234567n);
  assert.equal(formatCrossChainUsdc(1234567n), "1.234567");
  assert.throws(() => parseCrossChainUsdc("1.2345671"), /USDC/);
  assert.throws(() => parseCrossChainUsdc("0"), /0보다 커야/);
  assert.throws(() => parseCrossChainUsdc("1e-6"), /올바른 USDC/);
});

test("cross-chain funding local storage is validated and isolated by wallet and escrow", () => {
  const storage = new Map<string, string>();
  const fakeStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  };

  writeCrossChainFundingRecord(baseRecord, fakeStorage);
  assert.deepEqual(
    readCrossChainFundingRecord(fakeStorage, {
      walletAddress: baseRecord.walletAddress,
      escrowId: baseRecord.escrowId,
    }),
    baseRecord,
  );
  assert.equal(
    readCrossChainFundingRecord(fakeStorage, {
      walletAddress: "0x3333333333333333333333333333333333333333",
      escrowId: baseRecord.escrowId,
    }),
    null,
  );

  storage.set(CROSS_CHAIN_FUNDING_STORAGE_KEY, "{not-json");
  assert.equal(
    readCrossChainFundingRecord(fakeStorage, {
      walletAddress: baseRecord.walletAddress,
      escrowId: baseRecord.escrowId,
    }),
    null,
  );
});

test("resume never starts a second bridge after a source transaction hash exists", () => {
  assert.equal(shouldResumeBridge({ ...baseRecord, bridgeStatus: "estimating" }), true);
  assert.equal(shouldResumeBridge({ ...baseRecord, bridgeStatus: "awaiting-arc" }), false);
  assert.equal(
    shouldResumeBridge({ ...baseRecord, bridgeStatus: "bridging", sourceTxHash: "0xsource" }),
    false,
  );
  assert.equal(shouldResumeBridge({ ...baseRecord, bridgeStatus: "error" }), false);
  assert.equal(
    shouldResumeBridge({ ...baseRecord, bridgeStatus: "error", sourceTxHash: "0xsource" }),
    false,
  );
});

test("escrow funding is ready only after successful bridge and verified Arc balance", () => {
  assert.equal(isReadyToFund({ ...baseRecord, bridgeStatus: "awaiting-arc" }, 1234567n), false);
  assert.equal(isReadyToFund({ ...baseRecord, bridgeStatus: "bridge-complete" }, 999999n), false);
  assert.equal(isReadyToFund({ ...baseRecord, bridgeStatus: "bridge-complete" }, 1234567n), true);
  assert.equal(isReadyToFund({ ...baseRecord, bridgeStatus: "complete" }, 1234567n), false);
});

test("record validation rejects secret-like or malformed persisted data", () => {
  assert.equal(isValidCrossChainFundingRecord(baseRecord), true);
  assert.equal(isValidCrossChainFundingRecord({ ...baseRecord, token: "ETH" }), false);
  assert.equal(isValidCrossChainFundingRecord({ ...baseRecord, amountAtomic: "1.2" }), false);
  assert.equal(
    isValidCrossChainFundingRecord({ ...baseRecord, walletAddress: "private-key" }),
    false,
  );
});
