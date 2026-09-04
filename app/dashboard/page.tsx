"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { StatCard } from "@/components/StatCard";
import { ContractCard, LocalContract } from "@/components/ContractCard";
import { RecentReceipts } from "@/components/RecentReceipts";
import Link from "next/link";

const DEMO_ESCROW = "0x22De463e9969b8Cef07b151b9cB5D8c5A16D81Df";

const fallback: LocalContract[] = [
  { id: "demo-1", title: "Tokyo Skincare Campaign", creator: "0xA3b2D9386b5DCC9A7366E9985F913D7fE827D4E0", totalUsdc: "1000", status: "Funded" },
  { id: "demo-2", title: "Seoul Fashion Shoot", creator: "0xF44fBaa68Cf596A3050f8FCD78A314C4904D9878", totalUsdc: "750", status: "Created" }
];

export default function DashboardPage() {
  const [contracts, setContracts] = useState<LocalContract[]>(fallback);

  useEffect(() => {
    const raw = localStorage.getItem("arc-settlement-contracts");
    if (raw) setContracts(JSON.parse(raw));
  }, []);

  const total = contracts.reduce((sum, c) => sum + Number(c.totalUsdc || 0), 0);

  return (
    <Shell>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-arc-muted">Dashboard</p>
        <h1 className="mt-2 text-5xl font-black tracking-tight">Settlement overview</h1>
      </div>
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active contracts" value={String(contracts.length)} />
        <StatCard label="Total escrowed" value={`${total.toLocaleString()} USDC`} />
        <StatCard label="Circle products" value="3" caption="USDC · Wallets · Contracts" />
        <StatCard label="Network" value="Arc" caption="Testnet MVP" />
      </section>
      <section className="mt-8 rounded-[2rem] border border-arc-ink bg-arc-ink p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-arc-lime">Public demo · read only</p><h2 className="mt-2 text-2xl font-black">See a verified Arc settlement in one minute.</h2><p className="mt-2 max-w-2xl text-sm text-white/65">Follow the funded escrow, submitted milestone, released payment, and public receipt without connecting a wallet.</p></div>
          <Link href={`/contracts/${DEMO_ESCROW}?demo=1`} className="rounded-full bg-arc-lime px-5 py-3 text-sm font-black text-arc-ink">Open public demo →</Link>
        </div>
      </section>
      <section className="mt-8 grid gap-5 md:grid-cols-2">
        {contracts.map((contract) => <ContractCard key={contract.id} contract={contract} />)}
      </section>
      <RecentReceipts />
    </Shell>
  );
}
