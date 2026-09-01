"use client";

import { useEffect, useState } from "react";
import { Shell, WalletBadge } from "@/components/Shell";
import { Button } from "@/components/Button";
import { factoryAbi } from "@/lib/abi";
import { ensureArcNetwork, getPublicClient, getWalletClient } from "@/lib/browser-wallet";
import { ESCROW_FACTORY_ADDRESS } from "@/lib/arc";
import { parseUsdc } from "@/lib/format";
import { getCircleSession, requestCircleContractExecution } from "@/lib/circle-wallet-client";
import type { LocalContract } from "@/components/ContractCard";

const emptyMilestone = { description: "", amount: "" };
type MilestoneInput = typeof emptyMilestone;

type WalletMode = "circle" | "browser";

export default function CreateContractPage() {
  const [account, setAccount] = useState<string>();
  const [walletMode, setWalletMode] = useState<WalletMode>("circle");
  const [hasCircleSession, setHasCircleSession] = useState(false);
  const [title, setTitle] = useState("Tokyo Skincare Campaign");
  const [creator, setCreator] = useState("0xA3b2D9386b5DCC9A7366E9985F913D7fE827D4E0");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { description: "Contract accepted", amount: "200" },
    { description: "Content produced", amount: "300" },
    { description: "Content published", amount: "300" },
    { description: "Campaign completed", amount: "200" }
  ]);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const session = getCircleSession();
    setHasCircleSession(Boolean(session));
    if (session) setAccount(session.address);
  }, []);

  const total = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);

  async function connectBrowser() {
    await ensureArcNetwork();
    const { account } = await getWalletClient();
    setAccount(account);
    setWalletMode("browser");
  }

  function updateMilestone(index: number, key: keyof MilestoneInput, value: string) {
    setMilestones((prev) => prev.map((m, i) => i === index ? { ...m, [key]: value } : m));
  }

  function saveLocal(escrowAddress?: string) {
    const contract: LocalContract = {
      id: escrowAddress ?? `pending-${Date.now()}`,
      title,
      creator,
      totalUsdc: String(total),
      status: escrowAddress ? "Created" : "Pending onchain",
      escrowAddress
    };
    const existing = JSON.parse(localStorage.getItem("arc-settlement-contracts") ?? "[]");
    localStorage.setItem("arc-settlement-contracts", JSON.stringify([contract, ...existing]));
    return contract;
  }

  async function createOnchain() {
    try {
      if (!ESCROW_FACTORY_ADDRESS) throw new Error("Factory is not deployed yet. Circle Contracts deployment must be completed first.");
      if (!/^0x[a-fA-F0-9]{40}$/.test(creator)) throw new Error("Enter a valid creator wallet address.");
      if (milestones.some((m) => !m.description.trim() || Number(m.amount) <= 0)) throw new Error("Every milestone needs a description and positive USDC amount.");

      if (walletMode === "circle") {
        const session = getCircleSession();
        if (!session) throw new Error("Create/load your Circle wallet first from the Circle Wallet page.");
        setAccount(session.address);
        setStatus("Circle secure approval window opening...");
        const publicClient = getPublicClient();
        const beforeBlock = await publicClient.getBlockNumber();
        await requestCircleContractExecution({
          contractAddress: ESCROW_FACTORY_ADDRESS,
          abiFunctionSignature: "createEscrow(address,string,string[],uint256[])",
          abiParameters: [
            creator,
            title,
            milestones.map((m) => m.description),
            milestones.map((m) => parseUsdc(m.amount).toString())
          ],
          refId: `create-${Date.now()}`
        });
        setStatus("Circle approved the transaction. Waiting for Arc confirmation...");
        let escrowAddress: `0x${string}` | undefined;
        for (let attempt = 0; attempt < 12 && !escrowAddress; attempt++) {
          await new Promise((r) => setTimeout(r, 2000));
          const logs = await publicClient.getLogs({
            address: ESCROW_FACTORY_ADDRESS,
            event: factoryAbi.find((item) => item.type === "event" && item.name === "EscrowCreated") as any,
            args: { client: session.address as `0x${string}`, creator: creator as `0x${string}` },
            fromBlock: beforeBlock > 20n ? beforeBlock - 20n : 0n,
            toBlock: "latest"
          });
          const latest = logs.at(-1) as any;
          if (latest?.args?.escrow) escrowAddress = latest.args.escrow;
        }
        saveLocal(escrowAddress);
        setStatus(escrowAddress ? `Escrow created on Arc: ${escrowAddress}` : "Transaction approved. Arc confirmation is still indexing; check ArcScan and refresh shortly.");
        return;
      }

      setStatus("Connecting browser wallet...");
      await ensureArcNetwork();
      const { walletClient, account } = await getWalletClient();
      setAccount(account);
      const hash = await walletClient.writeContract({
        address: ESCROW_FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "createEscrow",
        args: [creator as `0x${string}`, title, milestones.map((m) => m.description), milestones.map((m) => parseUsdc(m.amount))],
        account
      });
      saveLocal();
      setStatus(`Factory transaction submitted: ${hash}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Create escrow failed");
    }
  }

  return (
    <Shell>
      <div className="grid gap-8 lg:grid-cols-[0.75fr_0.25fr]">
        <section className="rounded-[2rem] border border-arc-line bg-white/75 p-7 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-arc-muted">Create contract</p>
              <h1 className="mt-2 text-5xl font-black tracking-tight">Milestone escrow</h1>
            </div>
            <WalletBadge address={account} />
          </div>

          <div className="mt-6 flex gap-2 rounded-2xl bg-arc-bg p-2">
            <button onClick={() => setWalletMode("circle")} className={`rounded-xl px-4 py-2 text-sm font-black ${walletMode === "circle" ? "bg-white shadow-sm" : "text-arc-muted"}`}>Circle Wallet</button>
            <button onClick={() => setWalletMode("browser")} className={`rounded-xl px-4 py-2 text-sm font-black ${walletMode === "browser" ? "bg-white shadow-sm" : "text-arc-muted"}`}>Browser Wallet</button>
            {walletMode === "circle" && !hasCircleSession ? <a href="/wallet" className="ml-auto rounded-xl px-4 py-2 text-sm font-black text-arc-purple">Set up Circle wallet →</a> : null}
          </div>

          <div className="mt-8 grid gap-5">
            <label className="grid gap-2 font-bold">Project title
              <input className="rounded-2xl border border-arc-line bg-white px-4 py-3 font-normal" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="grid gap-2 font-bold">Creator wallet
              <input className="rounded-2xl border border-arc-line bg-white px-4 py-3 font-normal" value={creator} onChange={(e) => setCreator(e.target.value)} />
            </label>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">Milestones</h2>
                <button className="text-sm font-black text-arc-purple" onClick={() => setMilestones((m) => [...m, emptyMilestone])}>+ Add milestone</button>
              </div>
              {milestones.map((m, index) => (
                <div key={index} className="grid gap-3 rounded-3xl border border-arc-line bg-arc-bg p-4 md:grid-cols-[1fr_10rem]">
                  <input className="rounded-2xl border border-arc-line bg-white px-4 py-3" placeholder="Milestone description" value={m.description} onChange={(e) => updateMilestone(index, "description", e.target.value)} />
                  <input className="rounded-2xl border border-arc-line bg-white px-4 py-3" placeholder="USDC" inputMode="decimal" value={m.amount} onChange={(e) => updateMilestone(index, "amount", e.target.value)} />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-arc-ink p-5 text-white">
              <div>
                <p className="text-sm text-white/65">Total contract value</p>
                <p className="text-3xl font-black">{total.toLocaleString()} USDC</p>
              </div>
              <div className="flex gap-3">
                {walletMode === "browser" ? <Button className="bg-white text-arc-ink" onClick={connectBrowser}>Connect wallet</Button> : null}
                <Button className="bg-arc-lime text-arc-ink" onClick={createOnchain}>Create escrow</Button>
              </div>
            </div>
            {status ? <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-arc-muted">{status}</p> : null}
          </div>
        </section>
        <aside className="rounded-[2rem] border border-arc-line bg-white/75 p-6 shadow-sm">
          <h2 className="text-xl font-black">Grant demo path</h2>
          <ol className="mt-4 space-y-3 text-sm text-arc-muted">
            <li>1. Create a Circle User-Controlled Wallet on Arc.</li>
            <li>2. Create milestone escrow through Circle contract execution.</li>
            <li>3. Approve USDC allowance.</li>
            <li>4. Deposit USDC.</li>
            <li>5. Creator submits a milestone.</li>
            <li>6. Client releases USDC on approval.</li>
          </ol>
        </aside>
      </div>
    </Shell>
  );
}
