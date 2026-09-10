import { formatUnits, parseUnits } from "viem";

export const CROSS_CHAIN_FUNDING_STORAGE_KEY = "arc-cross-chain-funding";
export const CROSS_CHAIN_SOURCE_CHAIN = "Base_Sepolia" as const;
export const CROSS_CHAIN_DESTINATION_CHAIN = "Arc_Testnet" as const;
export const CROSS_CHAIN_TOKEN = "USDC" as const;
export const USDC_DECIMALS = 6;

export type CrossChainBridgeStatus =
  | "estimating"
  | "bridging"
  | "awaiting-arc"
  | "bridge-complete"
  | "funding"
  | "complete"
  | "error";

export type CrossChainFundingRecord = {
  id: string;
  escrowId: string;
  escrowAddress: string;
  walletAddress: string;
  sourceChain: typeof CROSS_CHAIN_SOURCE_CHAIN;
  destinationChain: typeof CROSS_CHAIN_DESTINATION_CHAIN;
  token: typeof CROSS_CHAIN_TOKEN;
  amountAtomic: string;
  escrowAmountAtomic: string;
  sourceTxHash?: string;
  destinationTxHash?: string;
  fundingTxHash?: string;
  bridgeStatus: CrossChainBridgeStatus;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const addressPattern = /^0x[a-fA-F0-9]{40}$/;
const hashPattern = /^0x[a-fA-F0-9]{64}$/;
const decimalPattern = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;
const atomicPattern = /^(?:0|[1-9]\d*)$/;

export function parseCrossChainUsdc(value: string): bigint {
  const normalized = value.trim();
  if (!decimalPattern.test(normalized)) {
    throw new Error("올바른 USDC 금액을 입력하세요. 소수점은 최대 6자리까지 가능합니다.");
  }

  const atomic = parseUnits(normalized, USDC_DECIMALS);
  if (atomic <= 0n) {
    throw new Error("USDC 금액은 0보다 커야 합니다.");
  }
  return atomic;
}

export function formatCrossChainUsdc(amountAtomic: bigint | string): string {
  const atomic = typeof amountAtomic === "string" ? BigInt(amountAtomic) : amountAtomic;
  return formatUnits(atomic, USDC_DECIMALS);
}

export function isValidCrossChainFundingRecord(value: unknown): value is CrossChainFundingRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<CrossChainFundingRecord>;

  if (
    typeof record.id !== "string" ||
    typeof record.escrowId !== "string" ||
    typeof record.escrowAddress !== "string" ||
    typeof record.walletAddress !== "string" ||
    !addressPattern.test(record.escrowAddress) ||
    !addressPattern.test(record.walletAddress) ||
    record.sourceChain !== CROSS_CHAIN_SOURCE_CHAIN ||
    record.destinationChain !== CROSS_CHAIN_DESTINATION_CHAIN ||
    record.token !== CROSS_CHAIN_TOKEN ||
    typeof record.amountAtomic !== "string" ||
    !atomicPattern.test(record.amountAtomic) ||
    record.amountAtomic === "0" ||
    typeof record.escrowAmountAtomic !== "string" ||
    !atomicPattern.test(record.escrowAmountAtomic) ||
    record.escrowAmountAtomic === "0" ||
    !["estimating", "bridging", "awaiting-arc", "bridge-complete", "funding", "complete", "error"].includes(
      record.bridgeStatus ?? "",
    ) ||
    typeof record.createdAt !== "string" ||
    Number.isNaN(Date.parse(record.createdAt)) ||
    typeof record.updatedAt !== "string" ||
    Number.isNaN(Date.parse(record.updatedAt))
  ) {
    return false;
  }

  for (const hash of [record.sourceTxHash, record.destinationTxHash, record.fundingTxHash]) {
    if (hash !== undefined && (typeof hash !== "string" || !hashPattern.test(hash))) return false;
  }
  if (record.lastError !== undefined && typeof record.lastError !== "string") return false;
  return true;
}

export function writeCrossChainFundingRecord(
  record: CrossChainFundingRecord,
  storage?: StorageLike,
): void {
  if (!isValidCrossChainFundingRecord(record)) {
    throw new Error("저장하려는 cross-chain funding 상태가 올바르지 않습니다.");
  }
  const target = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  if (!target) return;
  target.setItem(CROSS_CHAIN_FUNDING_STORAGE_KEY, JSON.stringify(record));
}

export function readCrossChainFundingRecord(
  storage?: StorageLike,
  scope?: { walletAddress: string; escrowId: string },
): CrossChainFundingRecord | null {
  const target = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  if (!target) return null;

  let parsed: unknown;
  try {
    const raw = target.getItem(CROSS_CHAIN_FUNDING_STORAGE_KEY);
    if (!raw) return null;
    parsed = JSON.parse(raw);
  } catch {
    target.removeItem(CROSS_CHAIN_FUNDING_STORAGE_KEY);
    return null;
  }

  if (!isValidCrossChainFundingRecord(parsed)) {
    target.removeItem(CROSS_CHAIN_FUNDING_STORAGE_KEY);
    return null;
  }
  if (
    scope &&
    (parsed.walletAddress.toLowerCase() !== scope.walletAddress.toLowerCase() ||
      parsed.escrowId !== scope.escrowId)
  ) {
    return null;
  }
  return parsed;
}

export function shouldResumeBridge(record: CrossChainFundingRecord): boolean {
  // Only a quote/estimate record is safe to start again after a refresh. An
  // error can be retried only with the in-memory SDK result via retryBridge;
  // persisted state alone cannot prove that a burn was not submitted.
  return record.bridgeStatus === "estimating" && !record.sourceTxHash;
}

export function isReadyToFund(record: CrossChainFundingRecord, verifiedArcBalanceAtomic: bigint): boolean {
  return record.bridgeStatus === "bridge-complete" && verifiedArcBalanceAtomic >= BigInt(record.escrowAmountAtomic);
}
