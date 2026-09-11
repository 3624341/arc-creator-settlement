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

type EvmNetwork = {
  chainId: number;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};

const BASE_SEPOLIA_NETWORK: EvmNetwork = {
  chainId: 84532,
  chainName: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

const ARC_NETWORK: EvmNetwork = {
  chainId: arcTestnet.id,
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: [ARC_RPC_URL],
  blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
};

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

export function isNetworkNotAddedError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === 4902 || code === "4902";
}

async function switchNetwork(provider: any, network: EvmNetwork) {
  if (!provider) throw new Error("No injected wallet found. Install a browser wallet first.");
  const chainId = `0x${network.chainId.toString(16)}`;
  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId }]
  });
}

async function addNetwork(provider: any, network: EvmNetwork) {
  if (!provider) throw new Error("No injected wallet found. Install a browser wallet first.");
  await provider.request({
    method: "wallet_addEthereumChain",
    params: [{
      chainId: `0x${network.chainId.toString(16)}`,
      chainName: network.chainName,
      nativeCurrency: network.nativeCurrency,
      rpcUrls: network.rpcUrls,
      blockExplorerUrls: network.blockExplorerUrls,
    }]
  });
}

export async function ensureArcNetwork(provider = window.ethereum) {
  return switchNetwork(provider, ARC_NETWORK);
}

export async function ensureBaseSepoliaNetwork(provider = window.ethereum) {
  return switchNetwork(provider, BASE_SEPOLIA_NETWORK);
}

export async function addArcNetwork(provider = window.ethereum) {
  return addNetwork(provider, ARC_NETWORK);
}

export async function addBaseSepoliaNetwork(provider = window.ethereum) {
  return addNetwork(provider, BASE_SEPOLIA_NETWORK);
}
