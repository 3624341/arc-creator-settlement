import Link from "next/link";
import { Shell } from "@/components/Shell";

const updates = [
  { date: "Sep 2026", title: "Public settlement demo", detail: "Added a read-only escrow walkthrough with independently verifiable Arc receipt evidence.", status: "Shipped" },
  { date: "Sep 2026", title: "Transaction recovery UX", detail: "Added actionable error messages and retry guidance for rejected or reverted writes.", status: "Shipped" },
  { date: "Sep 2026", title: "Builder integration guide", detail: "Documented Arc Testnet, Circle Wallet, contract lifecycle, and verification boundaries.", status: "Shipped" },
  { date: "Next", title: "Feedback loop", detail: "Collect builder feedback and publish the next integration improvements here.", status: "In progress" },
];

export default function UpdatesPage() {
  return (
    <Shell>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-arc-muted">Build in public</p>
          <h1 className="mt-2 text-5xl font-black tracking-tight">Updates & feedback</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-arc-muted">A transparent record of what shipped, what we learned, and what we are improving next on Arc.</p>
        </div>
        <a href="https://github.com/3624341/arc-creator-settlement/issues" target="_blank" rel="noreferrer" className="rounded-full bg-arc-ink px-5 py-3 text-sm font-black text-white hover:bg-black">Share feedback ↗</a>
      </div>

      <section className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-arc-muted">Changelog</p>
          <div className="mt-6 space-y-5">
            {updates.map((update) => (
              <article key={update.title} className="border-b border-black/10 pb-5 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-black">{update.title}</h2>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${update.status === "Shipped" ? "bg-arc-lime text-arc-ink" : "bg-arc-purple/10 text-arc-purple"}`}>{update.status}</span>
                </div>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-arc-muted">{update.date}</p>
                <p className="mt-2 text-sm leading-6 text-arc-muted">{update.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] bg-arc-ink p-6 text-white shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-arc-lime">Feedback status</p>
          <h2 className="mt-3 text-2xl font-black">Help shape the next release.</h2>
          <p className="mt-3 text-sm leading-6 text-white/65">Tell us what was clear, what felt confusing, or which Arc integration example would help you ship faster.</p>
          <a href="https://github.com/3624341/arc-creator-settlement/issues" target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-full bg-arc-lime px-4 py-2 text-sm font-black text-arc-ink">Open GitHub Issues ↗</a>
          <Link href="/dashboard" className="mt-4 block text-sm font-bold text-white/70 hover:text-white">← Back to dashboard</Link>
        </aside>
      </section>
    </Shell>
  );
}
