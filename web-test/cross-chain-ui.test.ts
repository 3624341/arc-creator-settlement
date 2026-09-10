import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { bridgeResultToRecord, eventToProgress } from "../lib/cross-chain-bridge";
import type { CrossChainFundingRecord } from "../lib/cross-chain-funding";

const pageSource = readFileSync("app/contracts/[id]/page.tsx", "utf8");
const panelSource = readFileSync("components/CrossChainFundingPanel.tsx", "utf8");

const record: CrossChainFundingRecord = {
  id: "bridge-ui-test",
  escrowId: "0x1111111111111111111111111111111111111111",
  escrowAddress: "0x1111111111111111111111111111111111111111",
  walletAddress: "0x2222222222222222222222222222222222222222",
  sourceChain: "Base_Sepolia",
  destinationChain: "Arc_Testnet",
  token: "USDC",
  amountAtomic: "2000000",
  escrowAmountAtomic: "1900000",
  bridgeStatus: "bridging",
  createdAt: "2026-09-10T00:00:00.000Z",
  updatedAt: "2026-09-10T00:00:00.000Z",
};

test("contract detail exposes a separate Base-to-Arc funding entry point", () => {
  assert.match(pageSource, /CrossChainFundingPanel/);
  assert.match(pageSource, /Fund from another chain/);
  assert.match(pageSource, /Approve USDC/);
  assert.match(pageSource, /Deposit to escrow/);
  assert.match(pageSource, /fundingTxHash/);
  assert.match(panelSource, /Testnet only/);
  assert.match(panelSource, /Base Sepolia → Arc Testnet/);
  assert.match(panelSource, /ensureBaseSepoliaNetwork/);
  assert.match(panelSource, /await ensureBaseSepoliaNetwork\(provider\)/);
  assert.match(panelSource, /Base Sepolia ETH \(gas\)/);
  assert.match(panelSource, /do not start a duplicate bridge/i);
});

test("bridge progress events are normalized without logging provider secrets", () => {
  assert.deepEqual(
    eventToProgress({ action: "bridge.burn", values: { state: "success", txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" } }),
    {
      name: "burn",
      state: "success",
      txHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      explorerUrl: "https://sepolia.basescan.org/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      errorMessage: undefined,
      errorCategory: undefined,
    },
  );
  assert.equal(eventToProgress({ values: { state: "success", secret: "do-not-display" } }), null);
});

test("successful bridge maps source and destination hashes without marking escrow funded", () => {
  const mapped = bridgeResultToRecord(record, {
    state: "success",
    steps: [
      { name: "burn", state: "success", txHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
      { name: "mint", state: "success", txHash: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc" },
    ],
  });
  assert.equal(mapped.bridgeStatus, "bridge-complete");
  assert.equal(mapped.sourceTxHash?.startsWith("0x"), true);
  assert.equal(mapped.destinationTxHash?.startsWith("0x"), true);
  assert.equal(mapped.fundingTxHash, undefined);
});
