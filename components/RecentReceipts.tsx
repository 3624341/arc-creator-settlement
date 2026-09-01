"use client";

import Link from "next/link";
import { ArrowUpRight, FileCheck2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getRecentReceiptHashes } from "@/lib/receipts/client";
import { mergeRecentReceipts, type RecentReceiptItem } from "@/lib/receipts/recent";
import { shortAddress } from "@/lib/receipts/presentation";
import type { SettlementReceipt } from "@/lib/receipts/types";

export function RecentReceipts() {
  const [items, setItems] = useState<RecentReceiptItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const local = getRecentReceiptHashes();
    setItems(mergeRecentReceipts(local, []));
    fetch("/api/receipts?limit=20", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { receipts: [] })
      .then((data: { receipts?: SettlementReceipt[] }) => {
        setItems(mergeRecentReceipts(local, Array.isArray(data.receipts) ? data.receipts : []));
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  return (
    <section id="receipts" className="mt-10 scroll-mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-arc-purple">Public proof</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Recent receipts</h2>
          <p className="mt-2 text-arc-muted">Every receipt opens without a wallet and verifies against Arc.</p>
        </div>
        <Link href="/contracts/create" className="text-sm font-black text-arc-purple">Create settlement →</Link>
      </div>

      {items.length ? (
        <div className="mt-5 overflow-hidden rounded-[2rem] border border-arc-line bg-white/80 shadow-sm">
          {items.map(({ txHash, receipt }, index) => (
            <Link key={txHash} href={`/receipt/${txHash}`} className={`grid gap-4 p-5 transition hover:bg-white sm:grid-cols-[1fr_auto_auto] sm:items-center ${index ? "border-t border-arc-line" : ""}`}>
              <div className="min-w-0">
                <p className="truncate font-black">{receipt?.projectTitle ?? "Arc milestone settlement"}</p>
                <p className="mt-1 font-mono text-xs text-arc-muted">{shortAddress(txHash)}</p>
              </div>
              <div className="sm:text-right">
                <p className="font-black">{receipt ? `${receipt.amountUsdc} USDC` : "Verify on Arc"}</p>
                <p className="mt-1 text-xs text-arc-muted">{receipt ? new Date(receipt.confirmedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Local receipt"}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-arc-lime px-3 py-1 text-xs font-black text-arc-ink">
                Confirmed <ArrowUpRight size={13} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      ) : loaded ? (
        <div className="mt-5 flex flex-col items-start gap-4 rounded-[2rem] border border-dashed border-arc-line bg-white/55 p-7 sm:flex-row sm:items-center">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-arc-purple"><FileCheck2 aria-hidden="true" /></div>
          <div>
            <p className="font-black">No public receipts yet</p>
            <p className="mt-1 text-sm text-arc-muted">Release a submitted milestone to create the first independently verifiable receipt.</p>
          </div>
        </div>
      ) : (
        <div className="mt-5 h-28 animate-pulse rounded-[2rem] bg-white/55" aria-label="Loading recent receipts" />
      )}
    </section>
  );
}
