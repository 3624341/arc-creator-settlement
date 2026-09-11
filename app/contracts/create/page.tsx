"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, WalletBadge } from "@/components/Shell";
import { Button } from "@/components/Button";
import { factoryAbi } from "@/lib/abi";
import { ensureArcNetwork, getPublicClient, getWalletClient, resolveBrowserProvider, type BrowserWalletName } from "@/lib/browser-wallet";
import { ESCROW_FACTORY_ADDRESS } from "@/lib/arc";
import { parseUsdc } from "@/lib/format";
import { validateContractDraft } from "@/lib/contract-validation";
import { getCircleSession, requestCircleContractExecution } from "@/lib/circle-wallet-client";
import type { LocalContract } from "@/lib/marketplace-store";
import { getEscrowAddressFromCreatedLogs } from "@/lib/escrow-deployment";
import { zeroAddress } from "viem";

const emptyMilestone = { description: "", amount: "" };
type MilestoneInput = typeof emptyMilestone;

type WalletMode = "circle" | "browser";
const BROWSER_WALLET_STORAGE = "arc-browser-wallet";
const CREATE_DRAFT_STORAGE = "arc-create-contract-draft";

export default function CreateContractPage() {
  const router = useRouter();
  const [account, setAccount] = useState<string>();
  const [walletMode, setWalletMode] = useState<WalletMode>("circle");
  const [browserWalletName, setBrowserWalletName] = useState<BrowserWalletName>();
  const [hasCircleSession, setHasCircleSession] = useState(false);
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [milestones, setMilestones] = useState<MilestoneInput[]>([]);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(CREATE_DRAFT_STORAGE) ?? "null") as { title?: string; creator?: string; milestones?: MilestoneInput[] } | null;
      if (draft) {
        setTitle(draft.title ?? "");
        setCreator(draft.creator ?? "");
        setMilestones(Array.isArray(draft.milestones) ? draft.milestones : []);
      }
    } catch { /* ignore malformed draft */ }
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    localStorage.setItem(CREATE_DRAFT_STORAGE, JSON.stringify({ title, creator, milestones }));
  }, [draftLoaded, title, creator, milestones]);

  useEffect(() => {
    const session = getCircleSession();
    setHasCircleSession(Boolean(session));
    if (session) {
      setAccount(session.address);
      return;
    }

    const stored = localStorage.getItem(BROWSER_WALLET_STORAGE);
    if (!stored) return;
    try {
      const wallet = JSON.parse(stored) as { name?: BrowserWalletName; address?: string };
      if (!wallet.name) return;
      setBrowserWalletName(wallet.name);
      const provider = resolveBrowserProvider(wallet.name);
      void provider.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        const address = accounts[0] ?? wallet.address;
        if (address) {
          setAccount(address);
          setWalletMode("browser");
        }
      }).catch(() => undefined);
    } catch {
      localStorage.removeItem(BROWSER_WALLET_STORAGE);
    }
  }, []);

  useEffect(() => {
    function handleWalletChange(event: Event) {
      const detail = (event as CustomEvent<{ address?: string; name?: BrowserWalletName; mode?: WalletMode }>).detail;
      if (detail.mode === "browser") {
        setWalletMode("browser");
        setAccount(detail.address);
        if (detail.name) setBrowserWalletName(detail.name);
      } else if (detail.mode === "circle") {
        setWalletMode("circle");
        setAccount(detail.address);
      } else if (detail.mode === "disconnected") {
        setAccount(undefined);
      }
    }
    window.addEventListener("arc-wallet-changed", handleWalletChange);
    return () => window.removeEventListener("arc-wallet-changed", handleWalletChange);
  }, []);

  const total = milestones.reduce((sum, m) => {
    const amount = Number(m.amount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  async function connectBrowser() {
    const stored = JSON.parse(localStorage.getItem(BROWSER_WALLET_STORAGE) ?? "null") as { name?: BrowserWalletName } | null;
    const name = stored?.name ?? "metamask";
    const provider = resolveBrowserProvider(name);
    const { account } = await getWalletClient(provider);
    setAccount(account);
    setBrowserWalletName(name);
    setWalletMode("browser");
    localStorage.setItem("arc-wallet-mode", "browser");
  }

  function updateMilestone(index: number, key: keyof MilestoneInput, value: string) {
    setMilestones((prev) => prev.map((m, i) => i === index ? { ...m, [key]: value } : m));
  }

  function saveLocal(escrowAddress?: string) {
    const contract: LocalContract = {
      id: escrowAddress ?? `pending-${Date.now()}`,
      title,
      creator: creator.trim() || zeroAddress,
      advertiser: account,
      owner: account,
      totalUsdc: String(total),
      status: escrowAddress ? "Created" : "Pending onchain",
      escrowAddress
    };
    const existing = JSON.parse(localStorage.getItem("arc-settlement-contracts") ?? "[]");
    localStorage.setItem("arc-settlement-contracts", JSON.stringify([contract, ...existing]));
    localStorage.removeItem(CREATE_DRAFT_STORAGE);
    return contract;
  }

  async function createOnchain() {
    try {
      if (!ESCROW_FACTORY_ADDRESS) throw new Error("Factory is not deployed yet. Circle Contracts deployment must be completed first.");
      const validationError = validateContractDraft(title, creator, milestones);
      if (validationError) throw new Error(validationError);
      const creatorAddress = (creator.trim() || zeroAddress) as `0x${string}`;

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
            creatorAddress,
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
            args: { client: session.address as `0x${string}`, creator: creatorAddress },
            fromBlock: beforeBlock > 20n ? beforeBlock - 20n : 0n,
            toBlock: "latest"
          });
          const latest = logs.at(-1) as any;
          if (latest?.args?.escrow) escrowAddress = latest.args.escrow;
        }
        saveLocal(escrowAddress);
        if (escrowAddress) {
          router.push(`/contracts/${escrowAddress}?created=1`);
          return;
        }
        setStatus(escrowAddress ? `Escrow created on Arc: ${escrowAddress}` : "Transaction approved. Arc confirmation is still indexing; check ArcScan and refresh shortly.");
        return;
      }

      setStatus("Connecting browser wallet...");
      const name = browserWalletName ?? (JSON.parse(localStorage.getItem(BROWSER_WALLET_STORAGE) ?? "null") as { name?: BrowserWalletName } | null)?.name;
      if (!name) throw new Error("Connect a browser wallet from the top-right menu first.");
      const provider = resolveBrowserProvider(name);
      await ensureArcNetwork(provider);
      const { walletClient, account } = await getWalletClient(provider);
      const gas = await getPublicClient().estimateContractGas({
        address: ESCROW_FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "createEscrow",
        args: [creatorAddress, title, milestones.map((m) => m.description), milestones.map((m) => parseUsdc(m.amount))],
        account
      });
      setAccount(account);
      const hash = await walletClient.writeContract({
        address: ESCROW_FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "createEscrow",
        args: [creatorAddress, title, milestones.map((m) => m.description), milestones.map((m) => parseUsdc(m.amount))],
        account,
        gas,
      });
      setStatus("Escrow transaction submitted. Waiting for Arc confirmation...");
      const publicClient = getPublicClient();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Escrow creation transaction reverted on Arc.");
      const createdLogs = await publicClient.getLogs({
        address: ESCROW_FACTORY_ADDRESS,
        event: factoryAbi.find((item) => item.type === "event" && item.name === "EscrowCreated") as any,
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber
      });
      const escrowAddress = getEscrowAddressFromCreatedLogs(createdLogs);
      if (!escrowAddress) throw new Error("Escrow is confirmed, but Arc has not indexed its address yet. Refresh and try again shortly.");
      saveLocal(escrowAddress);
      router.push(`/contracts/${escrowAddress}?created=1&tx=${hash}`);
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
            <button onClick={() => { setWalletMode("circle"); localStorage.setItem("arc-wallet-mode", "circle"); }} className={`rounded-xl px-4 py-2 text-sm font-black ${walletMode === "circle" ? "bg-white shadow-sm" : "text-arc-muted"}`}>Circle Wallet</button>
            <button onClick={() => { setWalletMode("browser"); localStorage.setItem("arc-wallet-mode", "browser"); }} className={`rounded-xl px-4 py-2 text-sm font-black ${walletMode === "browser" ? "bg-white shadow-sm" : "text-arc-muted"}`}>Browser Wallet</button>
            {walletMode === "circle" && !hasCircleSession ? <a href="/wallet" className="ml-auto rounded-xl px-4 py-2 text-sm font-black text-arc-purple">Set up Circle wallet →</a> : null}
          </div>

          <div className="mt-8 grid gap-5">
            <label className="grid gap-2 font-bold">Project title
              <input aria-label="Project title" required className="rounded-2xl border border-arc-line bg-white px-4 py-3 font-normal" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="grid gap-2 font-bold">Creator wallet <span className="text-sm font-normal text-arc-muted">(optional — select after applications arrive)</span>
              <input aria-label="Creator wallet address (optional)" className="rounded-2xl border border-arc-line bg-white px-4 py-3 font-normal" placeholder="Leave blank to select a creator later" value={creator} onChange={(e) => setCreator(e.target.value)} />
            </label>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">Milestones</h2>
                <button className="text-sm font-black text-arc-purple" onClick={() => setMilestones((m) => [...m, emptyMilestone])}>+ Add milestone</button>
              </div>
              {milestones.map((m, index) => (
                <div key={index} className="grid gap-3 rounded-3xl border border-arc-line bg-arc-bg p-4 md:grid-cols-[1fr_10rem_auto]">
                  <input aria-label={`Milestone ${index + 1} description`} className="rounded-2xl border border-arc-line bg-white px-4 py-3" placeholder="Milestone description" value={m.description} onChange={(e) => updateMilestone(index, "description", e.target.value)} />
                  <input aria-label={`Milestone ${index + 1} amount in USDC`} className="rounded-2xl border border-arc-line bg-white px-4 py-3" placeholder="USDC" inputMode="decimal" value={m.amount} onChange={(e) => updateMilestone(index, "amount", e.target.value)} />
                  <button type="button" className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-black text-red-600 hover:bg-red-50" onClick={() => setMilestones((current) => current.filter((_, i) => i !== index))}>Remove</button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-arc-ink p-5 text-white">
              <div>
                <p className="text-sm text-white/65">Total contract value</p>
                <p className="text-3xl font-black">{total.toLocaleString()} USDC</p>
              </div>
              <div className="flex gap-3">
                {walletMode === "browser" && !account ? <Button className="bg-white text-arc-ink" onClick={connectBrowser}>Connect wallet</Button> : null}
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
