export type ReceiptErrorCode =
  | "INVALID_TRANSACTION_HASH"
  | "TRANSACTION_NOT_FOUND"
  | "TRANSACTION_REVERTED"
  | "PAYMENT_EVENT_NOT_FOUND"
  | "PAYMENT_EVENT_AMBIGUOUS"
  | "CONTRACT_STATE_MISMATCH"
  | "RPC_UNAVAILABLE";

export class ReceiptError extends Error {
  constructor(public readonly code: ReceiptErrorCode, options?: ErrorOptions) {
    super(code, options);
    this.name = "ReceiptError";
  }
}

export type SettlementReceipt = {
  txHash: `0x${string}`;
  status: "confirmed";
  chainId: number;
  blockNumber: string;
  confirmedAt: string;
  escrowAddress: `0x${string}`;
  clientAddress: `0x${string}`;
  creatorAddress: `0x${string}`;
  milestoneIndex: number;
  milestoneDescription: string;
  amountUsdc: string;
  projectTitle: string;
  explorerUrl: string;
};
