"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getCircleSession, clearCircleSession } from "@/lib/circle-wallet-client";
import { addArcNetwork, addBaseSepoliaNetwork, getWalletClient, resolveBrowserProvider, type BrowserWalletName } from "@/lib/browser-wallet";
import { Wallet, ArrowUpRight, Menu } from "lucide-react";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/wallet", label: "Circle Wallet" },
  { href: "/profile", label: "My Page" },
];
const BROWSER_WALLET_STORAGE = "arc-browser-wallet";
const WALLET_MODE_STORAGE = "arc-wallet-mode";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [wallet, setWallet] = useState<string>();
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectError, setConnectError] = useState<string>();
  const [networkMessage, setNetworkMessage] = useState<string>();
  const [browserWalletOpen, setBrowserWalletOpen] = useState(false);
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    const circle = getCircleSession();
    if (circle) setWallet(circle.address);
    const stored = localStorage.getItem(BROWSER_WALLET_STORAGE);
    let provider: any;
    let handleAccountsChanged: ((accounts: string[]) => void) | undefined;
    if (stored) {
      try {
        const { name } = JSON.parse(stored) as { name: BrowserWalletName };
        provider = resolveBrowserProvider(name);
        void provider.request({ method: "eth_accounts" }).then((accounts: string[]) => {
          if (accounts[0]) setWallet(accounts[0]);
          else localStorage.removeItem(BROWSER_WALLET_STORAGE);
        }).catch(() => localStorage.removeItem(BROWSER_WALLET_STORAGE));
        handleAccountsChanged = (accounts) => {
          if (accounts[0]) setWallet(accounts[0]);
          else { setWallet(undefined); localStorage.removeItem(BROWSER_WALLET_STORAGE); }
        };
        provider.on?.("accountsChanged", handleAccountsChanged);
      } catch {
        localStorage.removeItem(BROWSER_WALLET_STORAGE);
      }
    }
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      if (provider && handleAccountsChanged) provider.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, []);
  async function connectBrowser(name: BrowserWalletName = "metamask") {
    setConnectError(undefined);
    try {
      const provider = resolveBrowserProvider(name);
      const { account } = await getWalletClient(provider);
      setWallet(account);
      localStorage.setItem(BROWSER_WALLET_STORAGE, JSON.stringify({ name, address: account }));
      localStorage.setItem(WALLET_MODE_STORAGE, "browser");
      window.dispatchEvent(new CustomEvent("arc-wallet-changed", { detail: { address: account, name, mode: "browser" } }));
      setConnectOpen(false);
      setBrowserWalletOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet connection failed. Try again.";
      setConnectError(message.includes("rejected") || message.includes("denied") || message.includes("4001")
        ? "Wallet connection was cancelled. Click Browser Wallet to try again."
        : message);
    }
  }
  async function addTestnetNetwork(network: "arc" | "base") {
    setNetworkMessage(undefined);
    try {
      const stored = JSON.parse(localStorage.getItem(BROWSER_WALLET_STORAGE) ?? "null") as { name?: BrowserWalletName } | null;
      if (!stored?.name) throw new Error("먼저 Browser Wallet을 연결하세요.");
      const provider = resolveBrowserProvider(stored.name);
      if (network === "arc") await addArcNetwork(provider);
      else await addBaseSepoliaNetwork(provider);
      setNetworkMessage(network === "arc" ? "Arc Testnet이 지갑에 추가되었습니다. 필요한 작업을 다시 시도하세요." : "Base Sepolia가 지갑에 추가되었습니다. 필요한 작업을 다시 시도하세요.");
    } catch (error) {
      setNetworkMessage(error instanceof Error ? error.message : "네트워크를 지갑에 추가하지 못했습니다.");
    }
  }
  const active = (href: string) => href.includes("#") ? pathname === href.split("#")[0] && hash === "#receipts" : pathname === href;
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-6">
      <header className="relative z-20 mb-8 flex items-center justify-between rounded-[2rem] border border-arc-line bg-white/75 px-4 py-3 shadow-sm backdrop-blur sm:px-5 sm:py-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-arc-ink text-white">A</span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.22em] text-arc-muted">Arc</span>
            <span className="block whitespace-nowrap text-xl font-black">Creator Settlement</span>
          </span>
        </Link>
        <nav className="ml-5 hidden shrink-0 items-center gap-2 border-l border-arc-line pl-5 text-sm font-semibold lg:flex">
          {navigation.map((item) => <Link key={item.href} href={item.href} className={`rounded-xl px-3 py-2 transition-colors ${active(item.href) ? "bg-arc-lime text-arc-ink" : "bg-arc-bg/70 text-arc-ink hover:bg-white"}`}>{item.label}</Link>)}
          <Link href="/contracts/create" className={`rounded-xl px-4 py-2 transition-colors ${active("/contracts/create") ? "bg-arc-lime text-arc-ink" : "bg-arc-bg/70 text-arc-ink hover:bg-white"}`}>Create Contract</Link>
          <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-xl px-3 py-2 hover:bg-white">
            ArcScan <ArrowUpRight size={15} />
          </a>
        </nav>
        <details className="group lg:hidden" onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.currentTarget.removeAttribute("open");
            (event.currentTarget.querySelector("summary") as HTMLElement | null)?.focus();
          }
        }}>
          <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full bg-arc-ink text-white" aria-label="Open navigation"><Menu size={19} /></summary>
          <nav className="absolute left-4 right-4 top-[4.75rem] grid gap-2 rounded-2xl border border-arc-line bg-white p-3 text-sm font-black shadow-xl">
            {navigation.map((item) => <Link key={item.href} href={item.href} className={`rounded-xl px-4 py-3 hover:bg-arc-bg ${active(item.href) ? "bg-arc-lime text-arc-ink" : ""}`}>{item.label}</Link>)}
            <Link href="/contracts/create" className={`rounded-xl px-4 py-3 ${active("/contracts/create") ? "bg-arc-lime text-arc-ink" : "text-arc-ink hover:bg-arc-bg"}`}>Create Contract</Link>
            <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-xl px-4 py-3 hover:bg-arc-bg">ArcScan <ArrowUpRight size={15} /></a>
            <div className="mt-1 border-t border-arc-line pt-2">
              <p className="px-4 py-2 text-xs font-black uppercase tracking-wider text-arc-muted">Wallet</p>
              {wallet ? <p className="px-4 py-2 text-sm font-bold text-arc-ink">{wallet.slice(0, 6)}…{wallet.slice(-4)}</p> : null}
              <button type="button" onClick={() => setBrowserWalletOpen((open) => !open)} aria-expanded={browserWalletOpen} className="w-full rounded-xl px-4 py-3 text-left font-black hover:bg-arc-bg">{wallet ? "Change browser wallet" : "Connect browser wallet"}</button>
              {browserWalletOpen ? <div className="grid gap-1 px-2 pb-2">
                {(["metamask", "okx", "rabby", "coinbase"] as BrowserWalletName[]).map((name) => <button key={name} type="button" onClick={() => void connectBrowser(name)} className="rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-arc-bg">{name === "metamask" ? "MetaMask" : name === "okx" ? "OKX Wallet" : name === "rabby" ? "Rabby Wallet" : "Coinbase Wallet"}</button>)}
                <div className="mt-2 grid gap-1 border-t border-arc-line pt-2">
                  <p className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-arc-muted">Testnet network setup</p>
                  <button type="button" onClick={() => void addTestnetNetwork("arc")} className="rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-white">Add Arc Testnet</button>
                  <button type="button" onClick={() => void addTestnetNetwork("base")} className="rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-white">Add Base Sepolia</button>
                  {networkMessage ? <p role="status" className="rounded-lg bg-white px-3 py-2 text-xs font-semibold leading-5 text-arc-muted">{networkMessage}</p> : null}
                </div>
              </div> : null}
              <Link href="/wallet" className="block rounded-xl px-4 py-3 font-black hover:bg-arc-bg">Circle Wallet</Link>
              {connectError ? <p role="alert" className="mx-4 mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-700">{connectError}</p> : null}
              {wallet ? <button type="button" onClick={() => { clearCircleSession(); localStorage.removeItem(BROWSER_WALLET_STORAGE); localStorage.removeItem(WALLET_MODE_STORAGE); setWallet(undefined); setBrowserWalletOpen(false); window.dispatchEvent(new CustomEvent("arc-wallet-changed", { detail: { address: undefined, mode: "disconnected" } })); }} className="w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50">Disconnect</button> : null}
            </div>
          </nav>
        </details>
        <div className="relative ml-auto mr-3 hidden lg:block">
          <button onClick={() => setConnectOpen((open) => !open)} className={`rounded-full px-4 py-2 text-sm font-black ${wallet ? "bg-arc-lime text-arc-ink" : "border border-arc-line bg-white"}`}>{wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "Connect Wallet"}</button>
          {connectOpen ? <div className="absolute right-0 top-12 z-30 w-64 rounded-2xl border border-arc-line bg-white p-3 shadow-xl"><p className="px-3 pb-2 text-xs font-black uppercase tracking-wider text-arc-muted">Choose wallet</p><button onClick={() => setBrowserWalletOpen((open) => !open)} aria-expanded={browserWalletOpen} className="w-full rounded-xl px-3 py-3 text-left text-sm font-bold hover:bg-arc-bg">Browser Wallet<span className="block text-xs font-normal text-arc-muted">Choose MetaMask, OKX, Rabby, or Coinbase</span></button>{browserWalletOpen ? <div className="mt-1 grid gap-1 rounded-xl bg-arc-bg/70 p-2"><button onClick={() => void connectBrowser("metamask")} className="rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-white">MetaMask</button><button onClick={() => void connectBrowser("okx")} className="rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-white">OKX Wallet</button><button onClick={() => void connectBrowser("rabby")} className="rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-white">Rabby Wallet</button><button onClick={() => void connectBrowser("coinbase")} className="rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-white">Coinbase Wallet</button><div className="mt-2 grid gap-1 border-t border-arc-line pt-2"><p className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-arc-muted">Testnet network setup</p><button type="button" onClick={() => void addTestnetNetwork("arc")} className="rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-white">Add Arc Testnet</button><button type="button" onClick={() => void addTestnetNetwork("base")} className="rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-white">Add Base Sepolia</button>{networkMessage ? <p role="status" className="rounded-lg bg-white px-3 py-2 text-xs font-semibold leading-5 text-arc-muted">{networkMessage}</p> : null}</div></div> : null}<Link href="/wallet" onClick={() => setConnectOpen(false)} className="mt-1 block rounded-xl px-3 py-3 text-sm font-bold hover:bg-arc-bg">Circle Wallet<span className="block text-xs font-normal text-arc-muted">User-owned wallet</span></Link>{connectError ? <p role="alert" className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-700">{connectError}</p> : null}{wallet ? <button onClick={() => { clearCircleSession(); localStorage.removeItem(BROWSER_WALLET_STORAGE); localStorage.removeItem(WALLET_MODE_STORAGE); setWallet(undefined); setConnectOpen(false); window.dispatchEvent(new CustomEvent("arc-wallet-changed", { detail: { address: undefined, mode: "disconnected" } })); }} className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50">Disconnect</button> : null}</div> : null}
        </div>
      </header>
      {children}
    </main>
  );
}

export function WalletBadge({ address }: { address?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-arc-line bg-white px-4 py-2 text-sm font-semibold">
      <Wallet size={16} />
      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Wallet not connected"}
    </div>
  );
}
