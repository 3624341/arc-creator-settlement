import { ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import type { SettlementReceipt } from "@/lib/receipts/types";
import { shortAddress } from "@/lib/receipts/presentation";
import { CopyReceiptButton } from "./CopyReceiptButton";

function ReceiptField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 border-t border-arc-line py-4">
      <dt className="text-xs font-bold uppercase tracking-[0.18em] text-arc-muted">{label}</dt>
      <dd className={`mt-2 break-words text-sm font-black text-arc-ink ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

export function ReceiptCard({ receipt }: { receipt: SettlementReceipt }) {
  const confirmedAt = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(new Date(receipt.confirmedAt));

  return (
    <article className="overflow-hidden rounded-[2.25rem] border border-arc-line bg-white shadow-[0_24px_80px_rgba(22,22,22,0.08)]">
      <header className="relative overflow-hidden bg-arc-ink px-6 py-8 text-white sm:px-9 sm:py-10">
        <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-arc-cyan/20 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-arc-cyan">
              <Check size={14} aria-hidden="true" /> Confirmed on Arc
            </div>
            <p className="mt-6 text-sm font-bold text-white/55">Milestone payment</p>
            <p className="mt-1 text-5xl font-black tracking-[-0.05em] sm:text-6xl">
              {receipt.amountUsdc} <span className="text-2xl tracking-normal text-white/55 sm:text-3xl">USDC</span>
            </p>
          </div>
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10">
            <ShieldCheck size={38} className="text-arc-lime" aria-hidden="true" />
          </div>
        </div>
      </header>

      <div className="px-6 py-7 sm:px-9 sm:py-9">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-arc-purple">Settlement receipt</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-arc-ink sm:text-4xl">{receipt.projectTitle}</h1>
        <p className="mt-2 text-base font-semibold text-arc-muted">Milestone {receipt.milestoneIndex + 1} · {receipt.milestoneDescription}</p>

        <dl className="mt-8 grid gap-x-8 sm:grid-cols-2">
          <ReceiptField label="Paid to creator" value={shortAddress(receipt.creatorAddress)} mono />
          <ReceiptField label="Released by client" value={shortAddress(receipt.clientAddress)} mono />
          <ReceiptField label="Confirmed at" value={`${confirmedAt} UTC`} />
          <ReceiptField label="Network" value={`Arc Testnet · Chain ID ${receipt.chainId}`} />
          <ReceiptField label="Block" value={`#${Number(receipt.blockNumber).toLocaleString("en-US")}`} mono />
          <ReceiptField label="Escrow contract" value={shortAddress(receipt.escrowAddress)} mono />
        </dl>

        <div className="mt-2 rounded-2xl bg-arc-bg p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-arc-muted">Transaction hash</p>
          <p className="mt-2 break-all font-mono text-xs font-bold leading-5 text-arc-ink">{receipt.txHash}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href={receipt.explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-arc-purple px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:shadow-lg">
            Verify on ArcScan <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <CopyReceiptButton value={`/receipt/${receipt.txHash}`} />
        </div>

        <p className="mt-7 flex items-start gap-2 text-sm leading-6 text-arc-muted">
          <ShieldCheck size={17} className="mt-1 shrink-0 text-arc-purple" aria-hidden="true" />
          Amount, recipient, milestone and status are read from the confirmed Arc transaction and escrow state—not from this page&apos;s URL or database.
        </p>
      </div>
    </article>
  );
}
