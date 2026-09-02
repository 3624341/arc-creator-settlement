import { defineChain } from "viem";

export const ARC_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? 5042002);
export const ARC_RPC_URL = process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network";
export const ARC_EXPLORER_URL = process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app";
export const ARC_USDC_ADDRESS = (process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS ?? "0x3600000000000000000000000000000000000000") as `0x${string}`;
export const ESCROW_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS as `0x${string}` | undefined;

export const arcTestnet = defineChain({
  id: ARC_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "USDC",
    symbol: "USDC"
  },
  rpcUrls: {
    default: { http: [ARC_RPC_URL] }
  },
  blockExplorers: {
    default: { name: "ArcScan", url: ARC_EXPLORER_URL }
  },
  testnet: true
});

export function txUrl(hash: string) {
  return `${ARC_EXPLORER_URL}/tx/${hash}`;
}

export function addressUrl(address: string) {
  return `${ARC_EXPLORER_URL}/address/${address}`;
}
