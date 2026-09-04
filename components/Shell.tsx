"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Wallet, ArrowUpRight, Menu } from "lucide-react";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard#receipts", label: "Receipts" },
  { href: "/wallet", label: "Circle Wallet" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  useEffect(() => { const sync = () => setHash(window.location.hash); sync(); window.addEventListener("hashchange", sync); return () => window.removeEventListener("hashchange", sync); }, []);
  const active = (href: string) => href.includes("#") ? pathname === href.split("#")[0] && hash === "#receipts" : pathname === href;
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-6">
      <header className="relative z-20 mb-8 flex items-center justify-between rounded-[2rem] border border-arc-line bg-white/75 px-4 py-3 shadow-sm backdrop-blur sm:px-5 sm:py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-arc-ink text-white">A</span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.22em] text-arc-muted">Arc</span>
            <span className="block text-xl font-black">Creator Settlement</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-2 text-sm font-semibold md:flex">
          {navigation.map((item) => <Link key={item.href} href={item.href} className={`rounded-xl px-3 py-2 hover:bg-white ${active(item.href) ? "bg-arc-lime text-arc-ink" : ""}`}>{item.label}</Link>)}
          <Link href="/contracts/create" className={`rounded-full px-4 py-2 ${active("/contracts/create") ? "bg-arc-lime text-arc-ink" : "text-arc-ink hover:bg-white"}`}>Create Contract</Link>
          <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-xl px-3 py-2 hover:bg-white">
            ArcScan <ArrowUpRight size={15} />
          </a>
        </nav>
        <details className="group md:hidden">
          <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full bg-arc-ink text-white" aria-label="Open navigation"><Menu size={19} /></summary>
          <nav className="absolute left-4 right-4 top-[4.75rem] grid gap-2 rounded-2xl border border-arc-line bg-white p-3 text-sm font-black shadow-xl">
            {navigation.map((item) => <Link key={item.href} href={item.href} className={`rounded-xl px-4 py-3 hover:bg-arc-bg ${active(item.href) ? "bg-arc-lime text-arc-ink" : ""}`}>{item.label}</Link>)}
            <Link href="/contracts/create" className={`rounded-xl px-4 py-3 ${active("/contracts/create") ? "bg-arc-lime text-arc-ink" : "text-arc-ink hover:bg-arc-bg"}`}>Create Contract</Link>
            <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-xl px-4 py-3 hover:bg-arc-bg">ArcScan <ArrowUpRight size={15} /></a>
          </nav>
        </details>
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
