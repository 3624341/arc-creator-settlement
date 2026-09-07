import Link from "next/link";
import { Shell } from "@/components/Shell";

const DEMO_ESCROW = "0x22De463e9969b8Cef07b151b9cB5D8c5A16D81Df";

export default function BuilderHubPage() {
  return (
    <Shell>
      <div className="mb-10">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-arc-purple">Builder Hub</p>
        <h1 className="mt-2 text-5xl font-black tracking-tight">Built in public, verified on Arc.</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-arc-muted">Technical notes, an interactive demo, and integration context for Arc reviewers and builders.</p>
      </div>

      <section className="rounded-[2rem] bg-arc-ink p-7 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-arc-lime">Public demo · read only</p>
            <h2 className="mt-2 text-3xl font-black">See a verified Arc settlement in one minute.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Follow the funded escrow, submitted milestone, released payment, and public receipt without connecting a wallet.</p>
          </div>
          <Link href={`/contracts/${DEMO_ESCROW}?demo=1`} className="rounded-full bg-arc-lime px-5 py-3 text-sm font-black text-arc-ink">Open public demo →</Link>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-arc-muted">Build Notes</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Product decisions and integration work.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-arc-muted">A transparent record for builders reviewing the settlement flow and Arc integration.</p>
          </div>
          <a href="https://github.com/3624341/arc-creator-settlement/issues" target="_blank" rel="noreferrer" className="rounded-full border border-arc-ink px-4 py-2 text-sm font-black text-arc-ink transition hover:bg-arc-ink hover:text-white">Share feedback ↗</a>
        </div>
        <Link href="/updates" className="mt-5 inline-flex text-sm font-black text-arc-purple hover:underline">View updates →</Link>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-arc-soft p-4"><p className="text-xs font-black uppercase tracking-[0.16em] text-arc-muted">Public demo</p><p className="mt-2 text-sm font-bold">Read-only escrow flow with verified receipt evidence.</p></div>
          <div className="rounded-2xl bg-arc-soft p-4"><p className="text-xs font-black uppercase tracking-[0.16em] text-arc-muted">Transaction UX</p><p className="mt-2 text-sm font-bold">Actionable errors and retry guidance for failed writes.</p></div>
          <div className="rounded-2xl bg-arc-soft p-4"><p className="text-xs font-black uppercase tracking-[0.16em] text-arc-muted">Integration guide</p><p className="mt-2 text-sm font-bold">Arc Testnet, Circle Wallet, and verification notes for builders.</p></div>
        </div>
      </section>
    </Shell>
  );
}
