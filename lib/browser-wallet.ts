import { createPublicClient, createWalletClient, custom, http } from "viem";
import { arcTestnet, ARC_RPC_URL } from "./arc";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function getPublicClient() {
  return createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC_URL) });
}

export async function getWalletClient() {
  if (!window.ethereum) throw new Error("No injected wallet found. Install MetaMask, Rabby, or Coinbase Wallet.");
  const walletClient = createWalletClient({ chain: arcTestnet, transport: custom(window.ethereum) });
  const [account] = await walletClient.requestAddresses();
  return { walletClient, account };
}

export async function ensureArcNetwork() {
  if (!window.ethereum) throw new Error("No injected wallet found.");
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${arcTestnet.id.toString(16)}` }]
    });
  } catch (error: any) {
    if (error?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: `0x${arcTestnet.id.toString(16)}`,
          chainName: "Arc Testnet",
          nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
          rpcUrls: [ARC_RPC_URL],
          blockExplorerUrls: [arcTestnet.blockExplorers.default.url]
        }]
      });
    } else {
      throw error;
    }
  }
}
