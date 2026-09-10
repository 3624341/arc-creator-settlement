"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { StatCard } from "@/components/StatCard";
import { ContractCard, LocalContract } from "@/components/ContractCard";
import { RecentReceipts } from "@/components/RecentReceipts";
import { loadPublicMarketplaceContracts, mergeMarketplaceContracts, sumEscrowBalances } from "@/lib/marketplace-chain";
import { formatUsdcExact } from "@/lib/format";
import { getCircleSession } from "@/lib/circle-wallet-client";
import { isContractHidden } from "@/lib/marketplace-store";

const WALLET_KEY = "arc-browser-wallet";

function getActiveWallet() {
  const circle = getCircleSession();
  if (circle?.address) return circle.address;
  const saved = localStorage.getItem(WALLET_KEY);
  if (!saved) return "";
  try { return (JSON.parse(saved) as { address?: string }).address ?? ""; } catch { return ""; }
}

export default function DashboardPage() {
  const [contracts, setContracts] = useState<LocalContract[]>([]);
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadContracts() {
      const activeWallet = getActiveWallet();
      if (!cancelled) setWallet(activeWallet);
      let localContracts: LocalContract[] = [];
      try {
        const raw = localStorage.getItem("arc-settlement-contracts");
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        localContracts = Array.isArray(parsed) ? parsed as LocalContract[] : [];
      } catch {
        localContracts = [];
      }

      const visibleLocalContracts = activeWallet
        ? localContracts.filter((contract) => !isContractHidden(activeWallet, contract))
        : localContracts;
      if (visibleLocalContracts.length && !cancelled) setContracts(visibleLocalContracts);
      try {
        const publicContracts = await loadPublicMarketplaceContracts();
        if (!cancelled) {
          const merged = mergeMarketplaceContracts(publicContracts, localContracts);
          setContracts(activeWallet ? merged.filter((contract) => !isContractHidden(activeWallet, contract)) : merged);
          setLoadError(undefined);
          setStale(false);
        }
      } catch (error) {
        if (!cancelled) {
          setStale(visibleLocalContracts.length > 0);
          setLoadError(error instanceof Error ? "Arc public data is temporarily unavailable. Retry to refresh." : "Arc public data is temporarily unavailable. Retry to refresh.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadContracts();
    return () => { cancelled = true; };
  }, []);

  const balances = sumEscrowBalances(contracts);
  const totalEscrowed = balances.known > 0 ? `${formatUsdcExact(balances.value)} USDC` : "—";

  return (
    <Shell>
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-arc-muted">Dashboard</p>
        <h1 className="mt-2 text-5xl font-black tracking-tight">Settlement overview</h1>
      </div>
      {loading ? <div role="status" className="mb-6 rounded-2xl bg-arc-bg p-4 text-sm font-semibold text-arc-muted">Loading public Arc contracts…</div> : null}
      {loadError ? <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"><span>{loadError}{stale ? " Showing the last locally known records; balances may be stale." : ""}</span><button className="rounded-full bg-red-700 px-4 py-2 text-xs font-black text-white" onClick={() => window.location.reload()}>Retry</button></div> : null}
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Active contracts" value={String(contracts.length)} />
        <StatCard label="USDC held in escrow" value={totalEscrowed} caption={balances.known ? `${balances.known} deployed escrow balance${balances.known === 1 ? "" : "s"}` : "Waiting for Arc balance data"} />
        <StatCard label="Circle products" value="3" caption="USDC · Wallets · Contracts" />
        <StatCard label="Network" value="Arc" caption="Testnet MVP" />
      </section>
      <section className="mt-8 grid gap-5 md:grid-cols-2">
        {contracts.map((contract) => <ContractCard key={contract.id} contract={contract} wallet={wallet} />)}
      </section>
      {!loading && !loadError && contracts.length === 0 ? <section className="mt-8 rounded-3xl border border-arc-line bg-white p-8 text-center">
        <h2 className="text-2xl font-black">No public contracts yet</h2>
        <p className="mt-2 text-sm text-arc-muted">Create a contract to publish the first Arc settlement opportunity.</p>
      </section> : null}
      <RecentReceipts />
    </Shell>
  );
}
