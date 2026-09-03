import Link from "next/link";
import { ArrowUpRight, BookOpen, CheckCircle2, Code2, ExternalLink, Github, Network, ShieldCheck, WalletCards } from "lucide-react";
import { Shell } from "@/components/Shell";

const proof = [
  { label: "Live app", value: "arc-creator-settlement-v0-2.vercel.app", href: "https://arc-creator-settlement-v0-2.vercel.app", icon: ExternalLink },
  { label: "GitHub repository", value: "3624341/arc-creator-settlement", href: "https://github.com/3624341/arc-creator-settlement", icon: Github },
  { label: "Korean Arc build guide", value: "3624341/arc-korean-build-guide", href: "https://github.com/3624341/arc-korean-build-guide", icon: BookOpen },
  { label: "Public receipt", value: "0xdf8a7711…eb856", href: "https://arc-creator-settlement-v0-2.vercel.app/receipt/0xdf8a7711dcbe31f07bc1f61d1492d07a0b490f45dd3b0566eaddce5deb6eb856", icon: ShieldCheck },
  { label: "ArcScan verification", value: "Confirmed payment release", href: "https://testnet.arcscan.app/tx/0xdf8a7711dcbe31f07bc1f61d1492d07a0b490f45dd3b0566eaddce5deb6eb856", icon: Network }
];

const flow = [
  ["01", "Circle Wallet", "User-owned wallet authorizes the USDC operation."],
  ["02", "USDC escrow", "Client funds an isolated Arc escrow with milestone terms."],
  ["03", "Release logic", "Creator submits; client approves; the contract transfers USDC."],
  ["04", "Public receipt", "Confirmed event data becomes a readable, shareable proof page."]
];

export default function BuilderPage() {
  return (
    <Shell>
      <section className="relative overflow-hidden rounded-[2.5rem] bg-arc-ink px-7 py-12 text-white shadow-sm sm:px-12 sm:py-16">
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-arc-cyan/20 blur-3xl" />
        <div className="relative max-w-4xl">
          <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-arc-cyan">Arc builder profile</p>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.96] tracking-tight sm:text-7xl">Builder based in Korea, shipping stablecoin settlement on Arc.</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-white/70 sm:text-xl">I build reproducible Arc and Circle integrations for creator payments, then document what works so other builders can verify and extend it.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="https://arc-creator-settlement-v0-2.vercel.app" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-arc-lime px-5 py-3 font-black text-arc-ink">Open live app <ArrowUpRight size={17} /></a>
            <a href="https://github.com/3624341/arc-creator-settlement" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 font-black text-white">View source <Github size={17} /></a>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[ ["Arc Testnet", "Chain ID 5042002"], ["1 USDC", "Demo escrow funded"], ["0.25 USDC", "Milestone released onchain"] ].map(([value, label]) => <div key={label} className="rounded-[2rem] border border-arc-line bg-white/75 p-6 shadow-sm"><p className="text-3xl font-black">{value}</p><p className="mt-2 text-sm font-semibold text-arc-muted">{label}</p></div>)}
      </section>

      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-arc-purple">What I build</p><h2 className="mt-2 text-4xl font-black tracking-tight">Arc Creator Settlement</h2></div><p className="max-w-xl text-arc-muted">A programmable USDC milestone flow for creators, freelancers, and marketplaces.</p></div>
        <div className="mt-7 grid gap-4 md:grid-cols-2">{flow.map(([number,title,body]) => <div key={number} className="rounded-[2rem] border border-arc-line bg-white/70 p-6"><p className="font-mono text-sm font-black text-arc-purple">{number}</p><h3 className="mt-5 text-2xl font-black">{title}</h3><p className="mt-2 leading-7 text-arc-muted">{body}</p></div>)}</div>
      </section>

      <section className="mt-16 rounded-[2.5rem] border border-arc-line bg-white/75 p-7 sm:p-10"><div className="flex items-center gap-3"><Code2 className="text-arc-purple" /><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-arc-purple">Technical proof</p><h2 className="mt-1 text-3xl font-black">Verify the build yourself</h2></div></div><div className="mt-8 grid gap-3">{proof.map(({label,value,href,icon:Icon}) => <a key={label} href={href} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-4 rounded-2xl border border-arc-line bg-arc-bg/60 px-5 py-4 hover:border-arc-purple"><span className="flex min-w-0 items-center gap-3"><Icon size={19} className="shrink-0 text-arc-purple" /><span className="min-w-0"><span className="block text-xs font-bold uppercase tracking-[0.14em] text-arc-muted">{label}</span><span className="block truncate font-semibold">{value}</span></span></span><ArrowUpRight size={17} className="shrink-0 text-arc-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>)}</div><p className="mt-6 text-sm leading-6 text-arc-muted">Factory: <code>0x5b90cdfecf1c59596e0b6b9cae448a29c2774e32</code> · Demo escrow: <code>0x22De463e9969b8Cef07b151b9cB5D8c5A16D81Df</code></p></section>

      <section className="mt-16 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-arc-purple">Community contribution</p><h2 className="mt-2 text-4xl font-black tracking-tight">Making Arc easier to build on in Korea.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-arc-muted">The Korean guide covers Foundry setup, Arc Doctor checks, a live network monitor, verified contracts, and reproducible examples for builders starting from zero.</p><a href="https://github.com/3624341/arc-korean-build-guide" target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 font-black text-arc-purple">Read the Korean guide <ArrowUpRight size={17} /></a></div><div className="rounded-[2.5rem] bg-arc-ink p-7 text-white"><p className="text-sm font-bold uppercase tracking-[0.2em] text-arc-cyan">Next on the roadmap</p><ul className="mt-6 space-y-4">{["Deeper event observability", "Reusable marketplace APIs", "Circle Gateway exploration", "Focused security review and controlled pilot"].map((item) => <li key={item} className="flex gap-3 leading-7 text-white/80"><CheckCircle2 className="mt-1 shrink-0 text-arc-lime" size={18} />{item}</li>)}</ul></div></section>

      <section className="mt-16 rounded-[2.5rem] bg-arc-lime p-7 sm:p-10"><div className="flex items-start gap-4"><WalletCards className="mt-1 shrink-0" /><div><h2 className="text-3xl font-black">Join the Arc builder community</h2><p className="mt-3 max-w-3xl leading-7 text-arc-ink/75">I am looking for technical feedback, collaboration, and opportunities to share Korean-language Arc resources. If you are building on Arc, I would love to compare notes and learn from your work.</p><Link href="https://discord.com" className="mt-6 inline-flex items-center gap-2 rounded-full bg-arc-ink px-5 py-3 font-black text-white">Connect and compare builds <ArrowUpRight size={17} /></Link></div></div></section>
    </Shell>
  );
}
