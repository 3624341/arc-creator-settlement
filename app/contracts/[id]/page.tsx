"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/Button";
import { erc20Abi, escrowAbi } from "@/lib/abi";
import { ensureArcNetwork, getPublicClient, getWalletClient } from "@/lib/browser-wallet";
import { ARC_USDC_ADDRESS, txUrl } from "@/lib/arc";
import { formatUsdc, parseUsdc } from "@/lib/format";
import { getCircleSession, requestCircleContractExecution } from "@/lib/circle-wallet-client";
import { findCircleReleaseTransaction, requestReceiptIndex, saveRecentReceipt } from "@/lib/receipts/client";

type Milestone = { description: string; amount: string; status: "Pending" | "Submitted" | "Paid" };
type WalletMode = "circle" | "browser";

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const [address, setAddress] = useState<string>();
  const [title, setTitle] = useState("Settlement Contract");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [status, setStatus] = useState("");
  const [hash, setHash] = useState<string>();
  const [walletMode, setWalletMode] = useState<WalletMode>("circle");
  const [hasCircleSession, setHasCircleSession] = useState(false);
  const [creatorAddress, setCreatorAddress] = useState<string>();
  const [pendingRelease, setPendingRelease] = useState<number>();
  const [receiptHashes, setReceiptHashes] = useState<Record<number, string>>({});

  useEffect(() => {
    const circle = getCircleSession();
    setHasCircleSession(Boolean(circle));
    const raw = localStorage.getItem("arc-settlement-contracts");
    const contracts = raw ? JSON.parse(raw) : [];
    const found = contracts.find((c: any) => c.id === params.id || c.escrowAddress === params.id);
    const candidate = found?.escrowAddress || (/^0x[a-fA-F0-9]{40}$/.test(params.id) ? params.id : undefined);
    if (found?.title) setTitle(found.title);
    if (candidate) setAddress(candidate);
  }, [params.id]);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    async function load() {
      try {
        const publicClient = getPublicClient();
        const escrow = address as `0x${string}`;
        const [onchainTitle, count, onchainCreator] = await Promise.all([
          publicClient.readContract({ address: escrow, abi: escrowAbi, functionName: "title" }),
          publicClient.readContract({ address: escrow, abi: escrowAbi, functionName: "milestoneCount" }),
          publicClient.readContract({ address: escrow, abi: escrowAbi, functionName: "creator" })
        ]);
        const rows: Milestone[] = [];
        for (let i = 0n; i < count; i++) {
          const result = await publicClient.readContract({ address: escrow, abi: escrowAbi, functionName: "getMilestone", args: [i] });
          const [description, amount, submitted, , released] = result;
          rows.push({
            description,
            amount: formatUsdc(amount),
            status: released ? "Paid" : submitted ? "Submitted" : "Pending"
          });
        }
        if (!cancelled) {
          setTitle(onchainTitle);
          setCreatorAddress(onchainCreator);
          setMilestones(rows);
        }
      } catch (error) {
        if (!cancelled) setStatus(error instanceof Error ? `Could not load onchain state: ${error.message}` : "Could not load onchain state");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [address]);

  const total = useMemo(() => milestones.reduce((sum, m) => sum + Number(m.amount.replaceAll(",", "")), 0), [milestones]);

  async function browserEscrow() {
    if (!address) throw new Error("No escrow address. Create and confirm an onchain escrow first.");
    await ensureArcNetwork();
    const { walletClient, account } = await getWalletClient();
    return { walletClient, account, escrow: address as `0x${string}` };
  }

  async function circleExec(contractAddress: string, signature: string, params: Array<string | number | boolean | unknown[]> = []) {
    const session = getCircleSession();
    if (!session) throw new Error("No active Circle wallet session. Open Circle Wallet first.");
    setStatus("Circle secure approval window opening...");
    await requestCircleContractExecution({ contractAddress, abiFunctionSignature: signature, abiParameters: params, refId: `settlement-${Date.now()}` });
    setStatus("Circle Wallet approved the transaction. Arc confirmation is in progress.");
  }

  async function approveDeposit() {
    try {
      if (!address) throw new Error("Escrow address missing.");
      if (walletMode === "circle") {
        await circleExec(ARC_USDC_ADDRESS, "approve(address,uint256)", [address, parseUsdc(String(total)).toString()]);
        return;
      }
      const { walletClient, account, escrow } = await browserEscrow();
      setStatus("Approving USDC allowance...");
      const tx = await walletClient.writeContract({ address: ARC_USDC_ADDRESS, abi: erc20Abi, functionName: "approve", args: [escrow, parseUsdc(String(total))], account });
      setHash(tx);
      setStatus("USDC approval submitted.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Approval failed"); }
  }

  async function deposit() {
    try {
      if (!address) throw new Error("Escrow address missing.");
      if (walletMode === "circle") {
        await circleExec(address, "deposit()", []);
        return;
      }
      const { walletClient, account, escrow } = await browserEscrow();
      setStatus("Depositing USDC into escrow...");
      const tx = await walletClient.writeContract({ address: escrow, abi: escrowAbi, functionName: "deposit", account });
      setHash(tx);
      setStatus("Deposit submitted.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Deposit failed"); }
  }

  async function submitMilestone(index: number) {
    try {
      if (!address) throw new Error("Escrow address missing.");
      if (walletMode === "circle") {
        await circleExec(address, "submitMilestone(uint256)", [String(index)]);
      } else {
        const { walletClient, account, escrow } = await browserEscrow();
        setStatus(`Submitting milestone ${index + 1}...`);
        const tx = await walletClient.writeContract({ address: escrow, abi: escrowAbi, functionName: "submitMilestone", args: [BigInt(index)], account });
        setHash(tx);
      }
      setMilestones((prev) => prev.map((m, i) => i === index ? { ...m, status: "Submitted" } : m));
    } catch (error) { setStatus(error instanceof Error ? error.message : "Milestone submit failed"); }
  }

  async function approveRelease(index: number) {
    setPendingRelease(index);
    try {
      if (!address) throw new Error("Escrow address missing.");
      if (!creatorAddress) throw new Error("Creator address is still loading. Try again shortly.");
      const publicClient = getPublicClient();
      let transactionHash: `0x${string}` | undefined;

      if (walletMode === "circle") {
        const fromBlock = await publicClient.getBlockNumber();
        await circleExec(address, "approveAndRelease(uint256)", [String(index)]);
        setStatus("Circle approved the release. Locating the confirmed Arc transaction...");
        transactionHash = await findCircleReleaseTransaction({
          escrowAddress: address as `0x${string}`,
          creatorAddress: creatorAddress as `0x${string}`,
          milestoneIndex: index,
          loadLogs: async () => publicClient.getLogs({
            address: address as `0x${string}`,
            fromBlock,
            toBlock: "latest"
          }) as never
        });
        if (!transactionHash) {
          setStatus("Circle approved the release, but Arc is still indexing the receipt. Refresh shortly to confirm the milestone onchain.");
          return;
        }
      } else {
        const { walletClient, account, escrow } = await browserEscrow();
        setStatus(`Approving and releasing milestone ${index + 1}...`);
        transactionHash = await walletClient.writeContract({ address: escrow, abi: escrowAbi, functionName: "approveAndRelease", args: [BigInt(index)], account });
        setHash(transactionHash);
        setStatus("Release submitted. Waiting for Arc confirmation...");
        const transaction = await publicClient.waitForTransactionReceipt({ hash: transactionHash });
        if (transaction.status !== "success") throw new Error("Release transaction reverted on Arc.");
      }

      saveRecentReceipt(transactionHash);
      void requestReceiptIndex(transactionHash);
      setReceiptHashes((previous) => ({ ...previous, [index]: transactionHash as string }));
      setMilestones((prev) => prev.map((m, i) => i === index ? { ...m, status: "Paid" } : m));
      setStatus(`Milestone ${index + 1} paid. The public onchain receipt is ready.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Release failed");
    } finally {
      setPendingRelease(undefined);
    }
  }

  return (
    <Shell>
      <section className="rounded-[2rem] border border-arc-line bg-white/75 p-7 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-arc-muted">Settlement contract</p>
        <h1 className="mt-2 text-5xl font-black tracking-tight">{title}</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-arc-bg p-5"><p className="text-sm text-arc-muted">Total value</p><p className="text-3xl font-black">{total.toLocaleString()} USDC</p></div>
          <div className="rounded-3xl bg-arc-bg p-5"><p className="text-sm text-arc-muted">Escrow address</p><p className="break-all text-sm font-black">{address ?? "Waiting for deployment"}</p></div>
          <div className="rounded-3xl bg-arc-bg p-5"><p className="text-sm text-arc-muted">Network</p><p className="text-3xl font-black">Arc</p></div>
        </div>

        <div className="mt-6 flex gap-2 rounded-2xl bg-arc-bg p-2">
          <button onClick={() => setWalletMode("circle")} className={`rounded-xl px-4 py-2 text-sm font-black ${walletMode === "circle" ? "bg-white shadow-sm" : "text-arc-muted"}`}>Circle Wallet</button>
          <button onClick={() => setWalletMode("browser")} className={`rounded-xl px-4 py-2 text-sm font-black ${walletMode === "browser" ? "bg-white shadow-sm" : "text-arc-muted"}`}>Browser Wallet</button>
          {walletMode === "circle" && !hasCircleSession ? <a href="/wallet" className="ml-auto rounded-xl px-4 py-2 text-sm font-black text-arc-purple">Set up Circle wallet →</a> : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={approveDeposit}>Approve USDC</Button>
          <Button className="bg-arc-lime text-arc-ink" onClick={deposit}>Deposit to escrow</Button>
        </div>
        <div className="mt-8 space-y-4">
          {milestones.length === 0 ? <div className="rounded-3xl border border-arc-line bg-white p-5 text-arc-muted">Onchain milestones will appear after the escrow address is confirmed.</div> : null}
          {milestones.map((m, index) => (
            <div key={`${m.description}-${index}`} className="grid items-center gap-4 rounded-3xl border border-arc-line bg-white p-5 md:grid-cols-[1fr_8rem_8rem_minmax(16rem,auto)]">
              <div><p className="font-black">{index + 1}. {m.description}</p><p className="text-sm text-arc-muted">Onchain milestone release</p></div>
              <p className="font-black">{m.amount} USDC</p>
              <span className="w-fit rounded-full bg-arc-bg px-3 py-1 text-xs font-black">{m.status}</span>
              <div className="flex gap-2">
                <Button className="px-4 py-2" onClick={() => submitMilestone(index)}>Submit</Button>
                <Button disabled={pendingRelease === index} className="bg-arc-purple px-4 py-2" onClick={() => approveRelease(index)}>
                  {pendingRelease === index ? "Confirming…" : "Release"}
                </Button>
                {receiptHashes[index] ? (
                  <Link href={`/receipt/${receiptHashes[index]}`} className="inline-flex items-center gap-1 rounded-full bg-arc-lime px-4 py-2 text-sm font-black text-arc-ink">
                    Receipt <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {status ? <p className="mt-6 rounded-2xl bg-arc-bg p-4 text-sm font-semibold text-arc-muted">{status}</p> : null}
        {hash ? <a className="mt-4 block font-black text-arc-purple" href={txUrl(hash)} target="_blank" rel="noreferrer">View latest transaction on ArcScan</a> : null}
      </section>
    </Shell>
  );
}
