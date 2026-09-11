import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  bridgeResultToRecord,
  bridgeRetryNetwork,
  eventToProgress,
  explainBridgeError,
  normalizeBridgeEstimate,
} from "../lib/cross-chain-bridge";
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
  assert.match(panelSource, /ensureArcNetwork/);
  assert.match(panelSource, /Retry Arc arrival/);
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

test("a failed Arc mint resumes on Arc instead of starting another Base transfer", () => {
  const failedAtMint = {
    state: "error" as const,
    steps: [
      { name: "approve", state: "success" as const },
      { name: "burn", state: "success" as const, txHash: "0xsource" },
      { name: "attestation", state: "success" as const },
      { name: "mint", state: "error" as const },
    ],
  };

  assert.equal(bridgeRetryNetwork(failedAtMint), "destination");
  assert.equal(
    explainBridgeError(new Error("Unknown transaction while executing receiveMessage on Arc Testnet")),
    "Arc Testnet 도착 트랜잭션을 지갑에서 승인하지 못했습니다. Arc Testnet으로 전환된 지갑 팝업을 확인한 뒤 ‘Retry Arc arrival’을 눌러 도착 단계만 다시 시도하세요.",
  );
});

test("bridge estimate accepts SDK gas fees returned as decimal strings", () => {
  const normalized = normalizeBridgeEstimate({
    token: "USDC",
    amount: "1",
    source: { address: record.walletAddress, chain: "Base_Sepolia" },
    destination: { address: record.walletAddress, chain: "Arc_Testnet" },
    fees: [{ type: "provider", token: "USDC", amount: "0.000013" }],
    gasFees: [
      {
        name: "Burn",
        token: "ETH",
        blockchain: "Base_Sepolia",
        fees: { gas: 21000n, gasPrice: 45000000000n, fee: "0.000000945" },
      },
    ],
  } as never);

  assert.equal(normalized.protocolFeeUsdc, "0.000013");
  assert.equal(normalized.expectedDestinationUsdc, "0.999987");
  assert.equal(normalized.gasFees[0]?.amount, "0.000000945");
});
