"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { getCircleSession } from "@/lib/circle-wallet-client";
import { getApplications, getContractsForWallet, type JobApplication, type LocalContract } from "@/lib/marketplace-store";
import { contractsForWallet, loadPublicMarketplaceContracts } from "@/lib/marketplace-chain";

const WALLET_KEY = "arc-browser-wallet";

function short(address: string) { return `${address.slice(0, 6)}…${address.slice(-4)}`; }

export default function ProfilePage() {
  const [wallet, setWallet] = useState("");
  const [contracts, setContracts] = useState<LocalContract[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);

  useEffect(() => {
    const circle = getCircleSession();
    let address = circle?.address ?? "";
    const saved = localStorage.getItem(WALLET_KEY);
    if (!address && saved) {
      try { address = (JSON.parse(saved) as { address?: string }).address ?? ""; } catch { /* ignore malformed session */ }
    }
    setWallet(address);
    if (!address) return;

    const localContracts = getContractsForWallet(address);
    setContracts(localContracts);
    setApplications(getApplications().filter((application) => application.applicant.trim().toLowerCase() === address.trim().toLowerCase()));

    let cancelled = false;
    void loadPublicMarketplaceContracts()
      .then((publicContracts) => {
        if (!cancelled) setContracts(contractsForWallet(address, publicContracts, localContracts));
      })
      .catch(() => {
        // Keep locally-created jobs visible when the public RPC is temporarily unavailable.
      });
    return () => { cancelled = true; };
  }, []);

  const active = useMemo(() => applications.filter((application) => application.status === "Selected" || application.status === "Completed"), [applications]);
  if (!wallet) return <Shell><section className="rounded-[2rem] border border-arc-line bg-white/75 p-8 shadow-sm"><p className="text-sm font-bold uppercase tracking-[0.22em] text-arc-muted">My Page</p><h1 className="mt-2 text-4xl font-black">Connect a wallet to view your work.</h1><p className="mt-3 text-arc-muted">Your created jobs and applications will appear here.</p></section></Shell>;

  const cards = [
    ["Created jobs", contracts.length],
    ["Applications", applications.length],
    ["Active work", active.length],
    ["Wallet", short(wallet)],
  ];
  return <Shell>
    <div className="mb-8"><p className="text-sm font-bold uppercase tracking-[0.22em] text-arc-muted">My Page</p><h1 className="mt-2 text-5xl font-black tracking-tight">Your Arc workspace</h1><p className="mt-3 text-arc-muted">One wallet, two roles: advertise work and contribute as a creator.</p></div>
    <section className="grid gap-4 md:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-3xl border border-arc-line bg-white/80 p-5"><p className="text-sm text-arc-muted">{label}</p><p className="mt-2 break-all text-2xl font-black">{value}</p></div>)}</section>
    <section className="mt-8 grid gap-6 lg:grid-cols-3">
      <div className="rounded-[2rem] border border-arc-line bg-white/80 p-6 lg:col-span-2"><h2 className="text-2xl font-black">Created Jobs</h2>{contracts.length ? <div className="mt-5 grid gap-3">{contracts.map((contract) => <Link key={contract.id} href={`/contracts/${contract.escrowAddress ?? contract.id}`} className="rounded-2xl border border-arc-line p-4 hover:bg-arc-bg"><div className="flex justify-between gap-3"><span className="font-black">{contract.title}</span><span className="text-sm font-bold text-arc-muted">{contract.totalUsdc} USDC</span></div><p className="mt-2 text-sm text-arc-muted">{contract.status} · {contract.applications?.length ?? 0} applications</p></Link>)}</div> : <p className="mt-4 text-sm text-arc-muted">No jobs created yet. <Link className="font-black text-arc-purple" href="/contracts/create">Create a contract →</Link></p>}</div>
      <div className="rounded-[2rem] bg-arc-ink p-6 text-white"><h2 className="text-2xl font-black">My Applications</h2>{applications.length ? <div className="mt-5 space-y-3">{applications.map((application) => <Link key={application.id} href={`/contracts/${application.contractId}`} className="block rounded-2xl bg-white/10 p-4 hover:bg-white/15"><p className="font-black">{application.contractId.slice(0, 10)}…</p><span className="mt-2 inline-flex rounded-full bg-arc-lime px-3 py-1 text-xs font-black text-arc-ink">{application.status}</span></Link>)}</div> : <p className="mt-4 text-sm text-white/65">No applications yet. Explore a job and apply as a creator.</p>}</div>
    </section>
    <section className="mt-6 rounded-[2rem] border border-arc-line bg-white/80 p-6"><h2 className="text-2xl font-black">Active Work</h2><p className="mt-2 text-sm text-arc-muted">Selected and completed applications will show milestone progress here as the contract state is updated.</p>{active.length ? <div className="mt-4 text-sm font-bold">{active.length} active application{active.length === 1 ? "" : "s"}</div> : null}</section>
  </Shell>;
}
