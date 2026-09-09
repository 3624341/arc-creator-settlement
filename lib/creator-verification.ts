import type { CreatorVerification } from "./creator-profile";

type ReceiptLike = {
  status?: unknown;
  creator_address?: unknown;
  escrow_address?: unknown;
  amount_usdc?: unknown;
};

function parseMicros(value: unknown): bigint | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,6})?$/.test(text)) return undefined;
  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
}

function formatMicros(value: bigint) {
  const whole = value / 1_000_000n;
  const fraction = (value % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "").padEnd(2, "0");
  return `${whole}.${fraction}`;
}

export function summarizeCreatorSettlement(receipts: ReceiptLike[], wallet: string): CreatorVerification {
  const normalizedWallet = wallet.trim().toLowerCase();
  const matching = receipts.filter((receipt) => receipt.status === "confirmed" && typeof receipt.creator_address === "string" && receipt.creator_address.toLowerCase() === normalizedWallet);
  const escrows = new Set(matching.map((receipt) => typeof receipt.escrow_address === "string" ? receipt.escrow_address.toLowerCase() : "").filter(Boolean));
  const total = matching.reduce((sum, receipt) => sum + (parseMicros(receipt.amount_usdc) ?? 0n), 0n);
  return {
    walletSigned: true,
    arcSettlementVerified: matching.length > 0,
    completedPayouts: matching.length,
    distinctEscrows: escrows.size,
    totalPaidUsdc: formatMicros(total),
  };
}
