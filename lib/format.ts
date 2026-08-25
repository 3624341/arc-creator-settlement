import { formatUnits, parseUnits } from "viem";

export const USDC_DECIMALS = 6;

export function parseUsdc(value: string) {
  return parseUnits(value || "0", USDC_DECIMALS);
}

export function formatUsdc(value: bigint) {
  const formatted = formatUnits(value, USDC_DECIMALS);
  return Number(formatted).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function shortenAddress(address?: string) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
