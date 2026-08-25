import Link from "next/link";
import { Wallet, ArrowUpRight } from "lucide-react";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-6">
      <header className="mb-8 flex items-center justify-between rounded-[2rem] border border-arc-line bg-white/65 px-5 py-4 shadow-sm backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-arc-ink text-white">A</span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.22em] text-arc-muted">Arc</span>
            <span className="block text-xl font-black">Creator Settlement</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-semibold">
          <Link href="/dashboard" className="rounded-full px-4 py-2 hover:bg-white">Dashboard</Link>
          <Link href="/wallet" className="rounded-full px-4 py-2 hover:bg-white">Circle Wallet</Link>
          <Link href="/contracts/create" className="rounded-full bg-arc-lime px-4 py-2 text-arc-ink">Create Contract</Link>
          <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full px-4 py-2 hover:bg-white">
            ArcScan <ArrowUpRight size={15} />
          </a>
        </nav>
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
