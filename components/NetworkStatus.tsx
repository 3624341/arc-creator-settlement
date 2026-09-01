"use client";

import { useEffect, useState } from "react";

const ARC_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? 5042002);

type NetworkResponse = {
  blockNumber?: string;
};

export function NetworkStatus() {
  const [block, setBlock] = useState<string>();
  const [online, setOnline] = useState<boolean>();

  useEffect(() => {
    fetch("/api/network", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Arc RPC unavailable")))
      .then((data: NetworkResponse) => {
        setBlock(data.blockNumber ? BigInt(data.blockNumber).toLocaleString("en-US") : undefined);
        setOnline(true);
      })
      .catch(() => setOnline(false));
  }, []);

  return (
    <div className="grid gap-3 rounded-[1.5rem] border border-arc-line bg-white/70 p-4 shadow-sm sm:grid-cols-3">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-arc-muted">Network</p><p className="mt-1 font-black">Arc Testnet</p></div>
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-arc-muted">Chain ID</p><p className="mt-1 font-black">{ARC_CHAIN_ID}</p></div>
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-arc-muted">Public RPC</p><p className="mt-1 flex items-center gap-2 font-black"><span className={`h-2 w-2 rounded-full ${online === false ? "bg-red-500" : online ? "bg-emerald-500" : "bg-amber-400"}`} />{online === false ? "Unavailable" : block ? `Online · #${block}` : "Checking…"}</p></div>
    </div>
  );
}
