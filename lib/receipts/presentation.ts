import type { ReceiptErrorCode } from "./types";

export type ReceiptErrorView = {
  eyebrow: string;
  title: string;
  body: string;
};

const views: Record<ReceiptErrorCode, ReceiptErrorView> = {
  INVALID_TRANSACTION_HASH: {
    eyebrow: "Link check",
    title: "Invalid receipt link",
    body: "This link does not contain a valid Arc transaction hash. Copy the receipt link again from the settlement page."
  },
  TRANSACTION_NOT_FOUND: {
    eyebrow: "Arc lookup",
    title: "Transaction not found",
    body: "Arc has not returned this transaction yet. If it was just submitted, wait a moment and try again."
  },
  TRANSACTION_REVERTED: {
    eyebrow: "Onchain status",
    title: "Transaction reverted",
    body: "This transaction did not complete, so it cannot be used as proof of settlement."
  },
  PAYMENT_EVENT_NOT_FOUND: {
    eyebrow: "Receipt check",
    title: "Not a settlement receipt",
    body: "The transaction is real, but it does not contain an Arc Creator Settlement payment release."
  },
  PAYMENT_EVENT_AMBIGUOUS: {
    eyebrow: "Receipt check",
    title: "Receipt needs review",
    body: "More than one release was found in this transaction, so the app will not guess which payment to display."
  },
  CONTRACT_STATE_MISMATCH: {
    eyebrow: "Verification check",
    title: "Receipt verification failed",
    body: "The transaction event and escrow state do not agree. No payment claim is shown."
  },
  RPC_UNAVAILABLE: {
    eyebrow: "Network status",
    title: "Arc is temporarily unavailable",
    body: "The public Arc RPC could not complete verification. Your transaction is unchanged; retry shortly."
  }
};

export function receiptErrorView(code: ReceiptErrorCode): ReceiptErrorView {
  return views[code];
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
