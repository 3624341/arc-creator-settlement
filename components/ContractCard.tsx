"use client";

import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { isContractSaved, saveContractForWallet, unsaveContractForWallet, type LocalContract } from "@/lib/marketplace-store";

export type { LocalContract } from "@/lib/marketplace-store";

export function ContractCard({ contract, wallet }: { contract: LocalContract; wallet?: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(Boolean(wallet && isContractSaved(wallet, contract)));
  }, [contract, wallet]);

  function toggleSaved() {
    if (!wallet) return;
    const changed = saved ? unsaveContractForWallet(wallet, contract) : saveContractForWallet(wallet, contract);
    if (changed) setSaved(!saved);
  }

  return (
    <div className="rounded-[2rem] border border-arc-line bg-white/75 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-arc-muted">USDC Escrow</p>
          <h3 className="mt-2 text-2xl font-black">{contract.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!wallet}
            aria-label={wallet ? (saved ? "Remove saved job" : "Save job") : "Connect a wallet to save this job"}
            aria-pressed={saved}
            title={wallet ? (saved ? "Remove saved job" : "Save job") : "Connect a wallet to save this job"}
            onClick={toggleSaved}
            className={`grid h-10 w-10 place-items-center rounded-full border transition-colors ${saved ? "border-amber-300 bg-amber-50 text-amber-500" : "border-arc-line text-arc-muted hover:border-amber-300 hover:text-amber-500"} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Star size={18} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
          </button>
          <span className="rounded-full bg-arc-lime px-3 py-1 text-xs font-black">{contract.status}</span>
        </div>
      </div>
      {contract.description ? <p className="mt-4 line-clamp-2 leading-6 text-arc-muted">{contract.description}</p> : null}
      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-arc-muted">Creator</dt>
          <dd className="font-semibold">{contract.creator.slice(0, 8)}...{contract.creator.slice(-4)}</dd>
        </div>
        <div>
          <dt className="text-arc-muted">Total</dt>
          <dd className="font-semibold">{contract.totalUsdc} USDC</dd>
        </div>
      </dl>
      <Link href={`/contracts/${contract.id}`} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-arc-purple">
        Open settlement <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}
