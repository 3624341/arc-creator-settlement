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

export type BrowserWalletName = "metamask" | "okx" | "rabby" | "coinbase";

export function resolveBrowserProvider(name: BrowserWalletName) {
  const ethereum = window.ethereum;
  const providers = ethereum?.providers ?? (ethereum ? [ethereum] : []);
  if (name === "okx" && window.okxwallet) return window.okxwallet;
  const provider = providers.find((candidate: any) => {
    if (name === "metamask") return candidate.isMetaMask && !candidate.isRabby;
    if (name === "rabby") return candidate.isRabby;
    if (name === "coinbase") return candidate.isCoinbaseWallet;
    return false;
  });
  if (!provider) throw new Error(`${name === "metamask" ? "MetaMask" : name === "rabby" ? "Rabby Wallet" : name === "coinbase" ? "Coinbase Wallet" : "OKX Wallet"} was not detected. Install the extension, then try again.`);
  return provider;
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
