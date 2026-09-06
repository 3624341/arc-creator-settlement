import { createPublicClient, createWalletClient, custom, http } from "viem";
import { arcTestnet, ARC_RPC_URL } from "./arc";

declare global {
  interface Window {
    ethereum?: any;
    okxwallet?: any;
  }
}

export function getPublicClient() {
  return createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC_URL) });
}

export async function getWalletClient(provider = window.ethereum) {
  if (!provider) throw new Error("No injected wallet found. Install MetaMask, Rabby, Coinbase Wallet, or OKX Wallet.");
  const walletClient = createWalletClient({ chain: arcTestnet, transport: custom(provider) });
  const [account] = await walletClient.requestAddresses();
  return { walletClient, account };
}

export async function ensureArcNetwork(provider = window.ethereum) {
  if (!provider) throw new Error("No injected wallet found. Install a browser wallet first.");
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${arcTestnet.id.toString(16)}` }]
    });
  } catch (error: any) {
    if (error?.code === 4902) {
      await provider.request({
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
