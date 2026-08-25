import Link from "next/link";
import { ArrowRight, Coins, FileCheck2, Zap } from "lucide-react";
import { Shell } from "@/components/Shell";

export default function Home() {
  return (
    <Shell>
      <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="py-10">
          <p className="mb-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-arc-purple shadow-sm">Built for Circle Grants · Arc Testnet MVP</p>
          <h1 className="max-w-4xl text-6xl font-black leading-[0.95] tracking-tight md:text-7xl">
            Programmable USDC settlement for creators and marketplaces.
          </h1>
          <p className="mt-7 max-w-2xl text-xl leading-8 text-arc-muted">
            Fund project agreements in USDC, release payments by milestone, and settle creator commerce on Arc with transparent onchain transactions.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contracts/create" className="inline-flex items-center gap-2 rounded-full bg-arc-ink px-6 py-4 font-black text-white shadow-sm">
              Create a contract <ArrowRight size={18} />
            </Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 font-black text-arc-ink shadow-sm">
              View dashboard
            </Link>
          </div>
        </div>
        <div className="rounded-[3rem] border border-arc-line bg-white/75 p-7 shadow-sm">
          <div className="rounded-[2.5rem] bg-arc-ink p-7 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-arc-cyan">Settlement Contract</p>
            <h2 className="mt-4 text-4xl font-black">Tokyo Skincare Campaign</h2>
            <div className="mt-8 space-y-4">
              {[
                ["Contract accepted", "200 USDC", "Paid"],
                ["Content produced", "300 USDC", "Submitted"],
                ["Content published", "300 USDC", "Next"],
                ["Campaign completed", "200 USDC", "Queued"]
              ].map(([title, amount, status]) => (
                <div key={title} className="flex items-center justify-between rounded-3xl bg-white/10 p-4">
                  <div>
                    <p className="font-black">{title}</p>
                    <p className="text-sm text-white/65">{amount}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-arc-ink">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[{icon: Coins, title: "USDC-native", body: "Milestones are denominated and released in USDC."}, {icon: Zap, title: "Arc settlement", body: "Fast onchain release flow with transparent ArcScan links."}, {icon: FileCheck2, title: "Marketplace ready", body: "Built for creator, freelance, and casting platforms."}].map((item) => (
          <div key={item.title} className="rounded-[2rem] border border-arc-line bg-white/70 p-6 shadow-sm">
            <item.icon className="mb-4" />
            <h3 className="text-xl font-black">{item.title}</h3>
            <p className="mt-2 text-arc-muted">{item.body}</p>
          </div>
        ))}
      </section>
    </Shell>
  );
}
