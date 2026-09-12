import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleDot, Code2, FileSearch, ShieldCheck } from "lucide-react";
import { receiptErrorView, shortAddress } from "@/lib/receipts/presentation";
import type { ReviewerDemoView } from "@/lib/reviewer-demo";

const resources = {
  github: "https://github.com/3624341/arc-creator-settlement",
  koreanGuide: "https://github.com/3624341/arc-korean-build-guide",
  builderHub: "https://arc-builder-hub-theta.vercel.app/",
  security: "/security"
};

function ExternalResource({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-2xl border border-arc-line bg-white/80 p-5 transition hover:-translate-y-0.5 hover:border-arc-purple/40 hover:shadow-lg"
    >
      <span className="flex items-center justify-between gap-3 font-black">
        {title}
        <ArrowUpRight size={17} className="text-arc-purple" aria-hidden="true" />
      </span>
      <span className="mt-2 block text-sm leading-6 text-arc-muted">{body}</span>
    </a>
  );
}

export function ReviewerDemo({ view }: { view: ReviewerDemoView }) {
  const { copy, verification } = view;

  return (
    <article className="py-8 sm:py-12">
      <section className="relative overflow-hidden rounded-[2.5rem] bg-arc-ink p-7 text-white shadow-[0_30px_100px_rgba(22,22,22,0.18)] sm:p-10 lg:p-14">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-arc-purple/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-arc-cyan/20 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-arc-cyan sm:text-sm">{copy.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-6xl">{copy.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">{copy.introduction}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black">{copy.readOnlyLabel}</span>
            <span className="rounded-full bg-arc-lime px-4 py-2 text-sm font-black text-arc-ink">{copy.noWalletLabel}</span>
          </div>
        </div>
      </section>

      <ol className="mt-8 grid gap-5">
        {copy.steps.map((step) => (
          <li key={step.number} className="rounded-[2rem] border border-arc-line bg-white/85 p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4 sm:gap-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-arc-ink text-lg font-black text-white">{step.number}</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-arc-purple">
                  {step.number < 6 ? <CircleDot size={14} aria-hidden="true" /> : <ShieldCheck size={14} aria-hidden="true" />}
                  {step.number < 6 ? copy.recordedLabel : copy.verificationHeading}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{step.title}</h2>
                <p className="mt-2 max-w-4xl leading-7 text-arc-muted">{step.body}</p>

                {step.number === 6 && verification.status === "verified" ? (
                  <section aria-label={copy.verifiedLabel} className="mt-6 overflow-hidden rounded-2xl bg-arc-ink text-white">
                    <div className="border-b border-white/10 p-5 sm:flex sm:items-end sm:justify-between sm:gap-5 sm:p-6">
                      <div>
                        <p className="flex items-center gap-2 font-black text-arc-lime">
                          <CheckCircle2 size={18} aria-hidden="true" /> {copy.verifiedLabel}
                        </p>
                        <p className="mt-3 text-4xl font-black tracking-tight">{verification.receipt.amountUsdc} <span className="text-xl text-white/60">USDC</span></p>
                      </div>
                      <p className="mt-3 text-sm font-bold text-white/65 sm:mt-0">Arc Testnet · Chain ID {verification.receipt.chainId}</p>
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="font-black">{verification.receipt.projectTitle}</p>
                      <p className="mt-1 text-sm text-white/65">Milestone {verification.receipt.milestoneIndex + 1} · {verification.receipt.milestoneDescription}</p>

                      <details className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                        <summary className="cursor-pointer font-bold">{copy.detailsLabel}</summary>
                        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-white/50">Recipient</dt>
                            <dd title={verification.receipt.creatorAddress} className="mt-1 break-all font-mono font-bold">{shortAddress(verification.receipt.creatorAddress)}</dd>
                          </div>
                          <div>
                            <dt className="text-white/50">Released by</dt>
                            <dd title={verification.receipt.clientAddress} className="mt-1 break-all font-mono font-bold">{shortAddress(verification.receipt.clientAddress)}</dd>
                          </div>
                          <div>
                            <dt className="text-white/50">Block</dt>
                            <dd className="mt-1 font-mono font-bold">#{verification.receipt.blockNumber}</dd>
                          </div>
                          <div>
                            <dt className="text-white/50">Escrow</dt>
                            <dd title={verification.receipt.escrowAddress} className="mt-1 break-all font-mono font-bold">{shortAddress(verification.receipt.escrowAddress)}</dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-white/50">Transaction</dt>
                            <dd className="mt-1 break-all font-mono text-xs font-bold">{verification.receipt.txHash}</dd>
                          </div>
                        </dl>
                      </details>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link href={`/receipt/${verification.receipt.txHash}`} className="rounded-full bg-arc-lime px-5 py-3 text-sm font-black text-arc-ink">
                          {copy.receiptLabel}
                        </Link>
                        <a href={verification.receipt.explorerUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/20 px-5 py-3 text-sm font-black">
                          {copy.explorerLabel} ↗
                        </a>
                      </div>
                    </div>
                  </section>
                ) : null}

                {step.number === 6 && verification.status === "unavailable" ? (() => {
                  const error = receiptErrorView(verification.code);
                  return (
                    <section role="status" className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6">
                      <p className="font-black text-amber-800">{copy.unavailableLabel}</p>
                      <h3 className="mt-2 text-xl font-black">{error.title}</h3>
                      <p className="mt-2 leading-7 text-arc-muted">{error.body}</p>
                      <Link href={view.locale === "ko" ? "/demo?lang=ko" : "/demo"} className="mt-4 inline-block rounded-full bg-arc-ink px-5 py-3 text-sm font-black text-white">
                        {copy.retryLabel}
                      </Link>
                    </section>
                  );
                })() : null}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-8 rounded-[2rem] border border-arc-purple/25 bg-purple-50/85 p-6 sm:p-8">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-arc-purple"><Code2 size={16} aria-hidden="true" /> {copy.crossChainEyebrow}</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{copy.crossChainTitle}</h2>
        <p className="mt-3 max-w-4xl leading-7 text-arc-muted">{copy.crossChainBody}</p>
      </section>

      <section className="mt-10">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-arc-purple"><FileSearch size={16} aria-hidden="true" /> Evidence</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight">{copy.resourcesTitle}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ExternalResource href={resources.github} title="GitHub repository" body="Inspect the source, contracts, tests, and implementation history." />
          <ExternalResource href={resources.koreanGuide} title="Korean Arc build guide" body="Read the Korean-language guide for builders starting on Arc." />
          <ExternalResource href={resources.builderHub} title="Arc Builder Hub" body="Explore practical resources collected for the Arc builder community." />
          <Link href={resources.security} className="group rounded-2xl border border-arc-line bg-white/80 p-5 transition hover:-translate-y-0.5 hover:border-arc-purple/40 hover:shadow-lg">
            <span className="flex items-center justify-between gap-3 font-black">Security disclosure <ArrowUpRight size={17} className="text-arc-purple" aria-hidden="true" /></span>
            <span className="mt-2 block text-sm leading-6 text-arc-muted">Review wallet boundaries, testnet assumptions, and safety controls.</span>
          </Link>
        </div>
      </section>

      <p className="mt-8 rounded-2xl border border-arc-line bg-white/70 p-4 text-sm font-semibold leading-6 text-arc-muted">{copy.testnetNotice}</p>
    </article>
  );
}
