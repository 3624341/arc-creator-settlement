import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { ReceiptCard } from "@/components/ReceiptCard";
import { Shell } from "@/components/Shell";
import { loadSettlementReceipt } from "@/lib/receipts/chain";
import { receiptErrorView } from "@/lib/receipts/presentation";
import { ReceiptError, type ReceiptErrorCode } from "@/lib/receipts/types";

export const dynamic = "force-dynamic";

type ReceiptPageProps = { params: Promise<{ txHash: string }> };

export async function generateMetadata({ params }: ReceiptPageProps): Promise<Metadata> {
  const { txHash } = await params;
  try {
    const receipt = await loadSettlementReceipt(txHash);
    return {
      title: `${receipt.amountUsdc} USDC receipt · ${receipt.projectTitle}`,
      description: `Verified Arc milestone payment to ${receipt.creatorAddress}`
    };
  } catch {
    return { title: "Verify settlement receipt · Arc Creator Settlement" };
  }
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { txHash } = await params;
  try {
    const receipt = await loadSettlementReceipt(txHash);
    return (
      <Shell>
        <div className="mx-auto max-w-4xl py-6 sm:py-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-arc-muted hover:text-arc-ink">
              <ArrowLeft size={16} aria-hidden="true" /> Settlement dashboard
            </Link>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-arc-muted">Public · Read only</span>
          </div>
          <ReceiptCard receipt={receipt} />
        </div>
      </Shell>
    );
  } catch (error) {
    const code: ReceiptErrorCode = error instanceof ReceiptError ? error.code : "RPC_UNAVAILABLE";
    const view = receiptErrorView(code);
    return (
      <Shell>
        <section className="mx-auto my-10 max-w-2xl rounded-[2.25rem] border border-arc-line bg-white p-7 shadow-sm sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-arc-purple">{view.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">{view.title}</h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-arc-muted">{view.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-arc-ink px-5 py-3 text-sm font-black text-white">
              <ArrowLeft size={16} aria-hidden="true" /> Dashboard
            </Link>
            <a href={`/receipt/${txHash}`} className="inline-flex items-center gap-2 rounded-xl border border-arc-line bg-white px-5 py-3 text-sm font-black">
              <RotateCcw size={16} aria-hidden="true" /> Try again
            </a>
          </div>
        </section>
      </Shell>
    );
  }
}
