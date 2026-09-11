import {
  AppKit,
  isRetryableError,
  type BridgeResult,
  type EstimateResult,
} from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import {
  createPublicClient,
  defineChain,
  formatUnits,
  http,
  type EIP1193Provider,
  type PublicClient,
} from "viem";
import { arcTestnet, ARC_EXPLORER_URL, ARC_RPC_URL, ARC_USDC_ADDRESS } from "./arc";
import { erc20Abi } from "./abi";
import {
  CROSS_CHAIN_DESTINATION_CHAIN,
  CROSS_CHAIN_SOURCE_CHAIN,
  formatCrossChainUsdc,
  parseCrossChainUsdc,
  type CrossChainFundingRecord,
} from "./cross-chain-funding";

export const BASE_SEPOLIA_RPC_URL =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
export const BASE_SEPOLIA_EXPLORER_URL = "https://sepolia.basescan.org";
export const BASE_SEPOLIA_USDC_ADDRESS =
  (process.env.NEXT_PUBLIC_BASE_SEPOLIA_USDC_ADDRESS ??
    "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as `0x${string}`;

export const baseSepoliaTestnet = defineChain({
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [BASE_SEPOLIA_RPC_URL] } },
  blockExplorers: { default: { name: "BaseScan", url: BASE_SEPOLIA_EXPLORER_URL } },
  testnet: true,
});

export type BridgeProgressEvent = {
  name: string;
  state: "pending" | "success" | "error" | "noop";
  txHash?: string;
  explorerUrl?: string;
  errorMessage?: string;
  errorCategory?: string;
};

export type BridgeEstimateSnapshot = {
  amountUsdc: string;
  protocolFeeUsdc: string;
  expectedDestinationUsdc: string;
  gasFees: Array<{ name: string; token: string; chain: string; amount: string }>;
};

function clientForChain(chainId: number): PublicClient {
  if (chainId === baseSepoliaTestnet.id) {
    return createPublicClient({ chain: baseSepoliaTestnet, transport: http(BASE_SEPOLIA_RPC_URL) });
  }
  return createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC_URL) });
}

async function createBrowserAdapter(provider: EIP1193Provider) {
  return createViemAdapterFromProvider({
    provider,
    getPublicClient: ({ chain }) => clientForChain(chain.id),
  });
}

export function getBaseSepoliaPublicClient() {
  return clientForChain(baseSepoliaTestnet.id);
}

export function getArcPublicClient() {
  return clientForChain(arcTestnet.id);
}

export async function readBaseSepoliaUsdcBalance(address: `0x${string}`): Promise<bigint> {
  return getBaseSepoliaPublicClient().readContract({
    address: BASE_SEPOLIA_USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });
}

export async function readBaseSepoliaNativeBalance(address: `0x${string}`): Promise<bigint> {
  return getBaseSepoliaPublicClient().getBalance({ address });
}

export async function readArcUsdcBalance(address: `0x${string}`): Promise<bigint> {
  return getArcPublicClient().readContract({
    address: ARC_USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });
}

export function explorerUrlForBridgeStep(step: BridgeProgressEvent): string | undefined {
  if (step.explorerUrl) return step.explorerUrl;
  if (!step.txHash) return undefined;
  const name = step.name.toLowerCase();
  if (name.includes("mint") || name.includes("destination") || name.includes("receive")) {
    return `${ARC_EXPLORER_URL}/tx/${step.txHash}`;
  }
  return `${BASE_SEPOLIA_EXPLORER_URL}/tx/${step.txHash}`;
}

export function normalizeBridgeEstimate(estimate: EstimateResult): BridgeEstimateSnapshot {
  const amountAtomic = parseCrossChainUsdc(estimate.amount);
  const feeAtomic = estimate.fees.reduce((total, fee) => {
    if (!fee.amount) return total;
    try {
      return total + parseCrossChainUsdc(fee.amount);
    } catch {
      return total;
    }
  }, 0n);

  const formatGasFee = (fee: string): string => {
    // App Kit 1.14.0 documents EstimatedGas.fee as atomic units, but its
    // current CCTP provider returns the EVM fee after formatUnits(). Accept
    // both representations without ever converting a decimal through JS
    // Number arithmetic.
    return fee.includes(".") ? fee : formatUnits(BigInt(fee), 18);
  };

  return {
    amountUsdc: formatCrossChainUsdc(amountAtomic),
    protocolFeeUsdc: formatCrossChainUsdc(feeAtomic),
    expectedDestinationUsdc: formatCrossChainUsdc(amountAtomic > feeAtomic ? amountAtomic - feeAtomic : 0n),
    gasFees: estimate.gasFees.map((fee) => ({
      name: fee.name,
      token: fee.token,
      chain: String(fee.blockchain),
      amount: fee.fees ? formatGasFee(fee.fees.fee) : "확인 필요",
    })),
  };
}

export function bridgeResultToRecord(
  record: CrossChainFundingRecord,
  result: Pick<BridgeResult, "state" | "steps">,
): CrossChainFundingRecord {
  const steps = result.steps;
  const burn = steps.find((step) => /burn|source/i.test(step.name) && step.txHash);
  const mint = steps.find((step) => /mint|destination|receive/i.test(step.name) && step.txHash);
  const failed = steps.find((step) => step.state === "error");

  return {
    ...record,
    sourceTxHash: burn?.txHash ?? record.sourceTxHash,
    destinationTxHash: mint?.txHash ?? record.destinationTxHash,
    bridgeStatus: result.state === "success" ? "bridge-complete" : result.state === "error" ? "error" : "awaiting-arc",
    lastError: failed?.errorMessage ?? record.lastError,
    updatedAt: new Date().toISOString(),
  };
}

export function bridgeRetryNetwork(result: Pick<BridgeResult, "steps">): "source" | "destination" {
  const failedStep = result.steps.find((step) => step.state === "error");
  return failedStep && /mint|destination|receive/i.test(failedStep.name) ? "destination" : "source";
}

export function eventToProgress(payload: unknown): BridgeProgressEvent | null {
  if (!payload || typeof payload !== "object") return null;
  const source = payload as Record<string, unknown>;
  const values = source.values && typeof source.values === "object" ? (source.values as Record<string, unknown>) : source;
  const rawName = source.action ?? source.name ?? source.type ?? values.name;
  const rawState = values.state ?? source.state;
  if (typeof rawName !== "string" || !["pending", "success", "error", "noop"].includes(String(rawState))) return null;
  const step: BridgeProgressEvent = {
    name: rawName.replace(/^bridge\./, ""),
    state: rawState as BridgeProgressEvent["state"],
    txHash: typeof values.txHash === "string" ? values.txHash : undefined,
    explorerUrl: typeof values.explorerUrl === "string" ? values.explorerUrl : undefined,
    errorMessage: typeof values.errorMessage === "string" ? values.errorMessage : undefined,
    errorCategory: typeof values.errorCategory === "string" ? values.errorCategory : undefined,
  };
  return { ...step, explorerUrl: explorerUrlForBridgeStep(step) };
}

export function explainBridgeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();
  if (normalized.includes("unknown transaction") || normalized.includes("receivemessage")) {
    return "Arc Testnet 도착 트랜잭션을 지갑에서 승인하지 못했습니다. Arc Testnet으로 전환된 지갑 팝업을 확인한 뒤 ‘Retry Arc arrival’을 눌러 도착 단계만 다시 시도하세요.";
  }
  if (normalized.includes("user rejected") || normalized.includes("rejected") || normalized.includes("4001")) {
    return "지갑 서명이 거절되었습니다. 전송을 다시 시작하려면 서명을 승인해야 합니다.";
  }
  if (normalized.includes("insufficient") || normalized.includes("balance")) {
    return "Base Sepolia USDC 또는 ETH 가스가 부족합니다. 테스트 토큰과 ETH를 먼저 준비하세요.";
  }
  if (normalized.includes("chain") || normalized.includes("network")) {
    return "지갑 네트워크를 Base Sepolia로 전환한 뒤 다시 시도하세요.";
  }
  return "브리지 처리 중 오류가 발생했습니다. 출발 트랜잭션이 생성되었는지 확인한 뒤 상태를 새로고침하세요.";
}

export async function estimateBaseToArcBridge(
  provider: EIP1193Provider,
  walletAddress: `0x${string}`,
  amountUsdc: string,
): Promise<BridgeEstimateSnapshot> {
  parseCrossChainUsdc(amountUsdc);
  const adapter = await createBrowserAdapter(provider);
  const kit = new AppKit();
  const estimate = await kit.estimateBridge({
    from: { adapter, chain: CROSS_CHAIN_SOURCE_CHAIN },
    to: { adapter, chain: CROSS_CHAIN_DESTINATION_CHAIN, recipientAddress: walletAddress },
    amount: amountUsdc,
    token: "USDC",
  });
  return normalizeBridgeEstimate(estimate);
}

export async function executeBaseToArcBridge(
  provider: EIP1193Provider,
  walletAddress: `0x${string}`,
  amountUsdc: string,
  onProgress?: (event: BridgeProgressEvent) => void,
): Promise<BridgeResult> {
  parseCrossChainUsdc(amountUsdc);
  const adapter = await createBrowserAdapter(provider);
  const kit = new AppKit();
  const handler = (payload: unknown) => {
    const event = eventToProgress(payload);
    if (event) onProgress?.(event);
  };
  kit.on("*", handler);
  try {
    return await kit.bridge({
      from: { adapter, chain: CROSS_CHAIN_SOURCE_CHAIN },
      to: { adapter, chain: CROSS_CHAIN_DESTINATION_CHAIN, recipientAddress: walletAddress },
      amount: amountUsdc,
      token: "USDC",
      config: { batchTransactions: false },
    });
  } finally {
    kit.off("*", handler);
  }
}

export async function retryBaseToArcBridge(
  provider: EIP1193Provider,
  result: BridgeResult,
  onProgress?: (event: BridgeProgressEvent) => void,
): Promise<BridgeResult> {
  if (result.state !== "error") throw new Error("완료되었거나 진행 중인 브리지는 일반 Retry로 다시 실행할 수 없습니다.");
  const failedStep = result.steps.find((step) => step.state === "error");
  if (!failedStep?.error || !isRetryableError(failedStep.error)) {
    throw new Error("이 브리지는 SDK가 자동 재개할 수 없는 상태입니다. 저장된 트랜잭션 해시를 확인하세요.");
  }
  const adapter = await createBrowserAdapter(provider);
  const kit = new AppKit();
  const handler = (payload: unknown) => {
    const event = eventToProgress(payload);
    if (event) onProgress?.(event);
  };
  kit.on("*", handler);
  try {
    return await kit.retryBridge(result, { from: adapter, to: adapter });
  } finally {
    kit.off("*", handler);
  }
}
