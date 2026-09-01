import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export type LocalContract = {
  id: string;
  title: string;
  escrowAddress?: string;
  creator: string;
  totalUsdc: string;
  status: "Draft" | "Pending onchain" | "Created" | "Funded" | "Completed";
};

export function ContractCard({ contract }: { contract: LocalContract }) {
  return (
    <div className="rounded-[2rem] border border-arc-line bg-white/75 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-arc-muted">USDC Escrow</p>
          <h3 className="mt-2 text-2xl font-black">{contract.title}</h3>
        </div>
        <span className="rounded-full bg-arc-lime px-3 py-1 text-xs font-black">{contract.status}</span>
      </div>
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

