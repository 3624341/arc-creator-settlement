"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/Button";
import { erc20Abi, escrowAbi } from "@/lib/abi";
import { ensureArcNetwork, getPublicClient, getWalletClient, resolveBrowserProvider, type BrowserWalletName } from "@/lib/browser-wallet";
import { ARC_USDC_ADDRESS, txUrl } from "@/lib/arc";
import { formatUsdcExact, parseUsdc } from "@/lib/format";
import { getCircleSession, requestCircleContractExecution } from "@/lib/circle-wallet-client";
import { findCircleReleaseTransaction, requestReceiptIndex, saveRecentReceipt } from "@/lib/receipts/client";
import { getApplicationForWallet, isWalletOwner, saveApplication, type JobApplication, type LocalContract } from "@/lib/marketplace-store";
import { createRemoteApplication, listRemoteApplications, type RemoteApplication } from "@/lib/marketplace-remote";
import { getRemoteProfile, listRemoteProfiles, type RemoteCreatorProfile } from "@/lib/creator-profile-remote";
import { buildApplicationSigningMessage } from "@/lib/creator-profile-signing";
import { isProfileComplete, type CreatorProfile, type CreatorVerification } from "@/lib/creator-profile";
import { ApplicationProfilePreview } from "@/components/ApplicationProfilePreview";
import { ContractApplicants } from "@/components/ApplicantCard";
import { CrossChainFundingPanel } from "@/components/CrossChainFundingPanel";
import { readCrossChainFundingRecord, writeCrossChainFundingRecord } from "@/lib/cross-chain-funding";
import { zeroAddress } from "viem";

type Milestone = { description: string; amount: string; status: "Pending" | "Submitted" | "Paid" };
type WalletMode = "circle" | "browser";
const WALLET_MODE_STORAGE = "arc-wallet-mode";

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const demoMode = searchParams.get("demo") === "1";
  const created = searchParams.get("created") === "1";
  const [address, setAddress] = useState<string>();
  const [title, setTitle] = useState("Settlement Contract");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [status, setStatus] = useState("");
  const [hash, setHash] = useState<string>();
  const [walletMode, setWalletMode] = useState<WalletMode>("circle");
  const [hasCircleSession, setHasCircleSession] = useState(false);
  const [creatorAddress, setCreatorAddress] = useState<string>();
  const [clientAddress, setClientAddress] = useState<string>();
  const [escrowStatus, setEscrowStatus] = useState<number>();
  const [usdcAllowance, setUsdcAllowance] = useState<bigint>();
  const [pendingRelease, setPendingRelease] = useState<number>();
  const [receiptHashes, setReceiptHashes] = useState<Record<number, string>>({});
  const [errorMessage, setErrorMessage] = useState<string>();
  const [retryAction, setRetryAction] = useState<(() => void) | undefined>();
  const [walletAddress, setWalletAddress] = useState<string>();
  const [localContract, setLocalContract] = useState<LocalContract>();
  const [application, setApplication] = useState<JobApplication>();
  const [applicationFeedback, setApplicationFeedback] = useState<string>();
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile>();
  const [creatorVerification, setCreatorVerification] = useState<CreatorVerification>();
  const [showApplicationPreview, setShowApplicationPreview] = useState(false);
  const [receivedApplications, setReceivedApplications] = useState<RemoteApplication[]>([]);
  const [applicantProfiles, setApplicantProfiles] = useState<Record<string, RemoteCreatorProfile>>({});
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantsError, setApplicantsError] = useState<string>();
  const [showCrossChainFunding, setShowCrossChainFunding] = useState(false);
  const [crossChainReady, setCrossChainReady] = useState(false);

  function explainError(error: unknown, fallback: string) {
    const message = error instanceof Error ? error.message : fallback;
    const lower = message.toLowerCase();
    if (lower.includes("user rejected") || lower.includes("denied")) return "Wallet approval was cancelled. You can try the action again when ready.";
    if (lower.includes("insufficient") || lower.includes("balance")) return "There is not enough USDC or gas for this action. Fund the wallet, then retry.";
    if (lower.includes("revert") || lower.includes("already")) return `${message} Check the milestone status before retrying.`;
    if (lower.includes("network") || lower.includes("rpc")) return "Arc network could not be reached. Check your connection and retry.";
    return message;
  }

  useEffect(() => {
    const circle = getCircleSession();
    setHasCircleSession(Boolean(circle));
    const savedMode = localStorage.getItem(WALLET_MODE_STORAGE);
    const useBrowserWallet = savedMode === "browser";
    if (circle?.address && !useBrowserWallet) setWalletAddress(circle.address);
    const raw = localStorage.getItem("arc-settlement-contracts");
    let contracts: LocalContract[] = [];
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      contracts = Array.isArray(parsed) ? parsed as LocalContract[] : [];
    } catch {
      contracts = [];
    }
    const found = contracts.find((c: any) => c.id === params.id || c.escrowAddress === params.id);
    if (found) setLocalContract(found);
    if (useBrowserWallet || !circle?.address) {
      try {
        const browserWallet = JSON.parse(localStorage.getItem("arc-browser-wallet") ?? "null") as { name?: BrowserWalletName } | null;
        const provider = browserWallet?.name ? resolveBrowserProvider(browserWallet.name) : undefined;
        if (browserWallet?.name) setWalletMode("browser");
        void provider?.request({ method: "eth_accounts" }).then((accounts: string[]) => {
          if (accounts[0]) setWalletAddress(accounts[0]);
        }).catch(() => undefined);
      } catch {
        // A malformed browser-wallet preference should not block contract inspection.
      }
    }
    const candidate = found?.escrowAddress || (/^0x[a-fA-F0-9]{40}$/.test(params.id) ? params.id : undefined);
    if (found?.title) setTitle(found.title);
    if (candidate) setAddress(candidate);
  }, [params.id]);

  useEffect(() => {
    function handleWalletChange(event: Event) {
      const detail = (event as CustomEvent<{ address?: string; mode?: WalletMode }>).detail;
      setWalletAddress(detail.address);
      setWalletMode(detail.mode === "browser" ? "browser" : "circle");
      if (!detail.address) setUsdcAllowance(undefined);
    }
    window.addEventListener("arc-wallet-changed", handleWalletChange);
    return () => window.removeEventListener("arc-wallet-changed", handleWalletChange);
  }, []);

  useEffect(() => {
    if (!walletAddress) return;
    const contractIds = [params.id, localContract?.id, localContract?.escrowAddress].filter((value): value is string => Boolean(value));
    setApplication(getApplicationForWallet(walletAddress, contractIds));
    let cancelled = false;
    void listRemoteApplications({ applicant: walletAddress, contractIds })
      .then((result) => {
        if (!cancelled && result.applications[0]) setApplication(result.applications[0]);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [walletAddress, params.id, localContract?.id, localContract?.escrowAddress]);

  useEffect(() => {
    if (!walletAddress) return;
    void getRemoteProfile(walletAddress).then((result) => { setCreatorProfile(result.profile); setCreatorVerification(result.verification); }).catch(() => { setCreatorProfile(undefined); setCreatorVerification(undefined); });
  }, [walletAddress]);

  const isOwner = Boolean(walletAddress && (localContract
    ? isWalletOwner(walletAddress, localContract)
    : clientAddress && walletAddress.toLowerCase() === clientAddress.toLowerCase()));
  const isClient = Boolean(walletAddress && clientAddress && walletAddress.toLowerCase() === clientAddress.toLowerCase());

  useEffect(() => {
    if (!isClient) {
      setReceivedApplications([]);
      setApplicantProfiles({});
      setApplicantsError(undefined);
      return;
    }

    const contractIds = [...new Set([params.id, address, localContract?.id, localContract?.escrowAddress].filter((value): value is string => Boolean(value)))];
    if (!contractIds.length) return;
    let cancelled = false;
    setApplicantsLoading(true);
    setApplicantsError(undefined);

    void listRemoteApplications({ contractIds })
      .then(async (result) => {
        if (cancelled) return;
        setReceivedApplications(result.applications);
        if (!result.applications.length) {
          setApplicantProfiles({});
          return;
        }
        try {
          const profiles = await listRemoteProfiles(result.applications.map((application) => application.applicant));
          if (!cancelled) setApplicantProfiles(Object.fromEntries(profiles.map((profile) => [profile.walletAddress.toLowerCase(), profile])));
        } catch {
          if (!cancelled) setApplicantProfiles({});
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReceivedApplications([]);
          setApplicantProfiles({});
          setApplicantsError("Applications could not be loaded. Refresh this page to try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setApplicantsLoading(false);
      });

    return () => { cancelled = true; };
  }, [address, isClient, localContract?.escrowAddress, localContract?.id, params.id]);

  async function handleApply() {
    setApplicationFeedback(undefined);
    if (demoMode) {
      setApplicationFeedback("Public demo mode is read-only. Connect to a live contract to apply.");
      return;
    }
    if (!walletAddress) {
      setApplicationFeedback("Connect a wallet before applying as a creator.");
      return;
    }
    if (isOwner) {
      setApplicationFeedback("Contract owners cannot apply to their own job.");
      return;
    }
    if (application) {
      setApplicationFeedback("Application already submitted.");
      return;
    }
    if (!creatorProfile || !isProfileComplete(creatorProfile)) {
      setApplicationFeedback("Complete your Creator Passport before applying.");
      return;
    }
    if (!showApplicationPreview) {
      setShowApplicationPreview(true);
      return;
    }
    setShowApplicationPreview(false);
    const contractId = localContract?.id ?? params.id;
    const next: JobApplication = {
      id: `application-${contractId}-${walletAddress.toLowerCase()}`,
      contractId,
      applicant: walletAddress,
      status: "Applied",
      appliedAt: new Date().toISOString(),
      profileVersion: creatorProfile.profileVersion
    };
    let applicationMessage = "";
    let applicationSignature = "";
    if (walletMode === "browser") {
      try {
        const stored = JSON.parse(localStorage.getItem("arc-browser-wallet") ?? "null") as { name?: BrowserWalletName } | null;
        if (!stored?.name) throw new Error("Connect a browser wallet before applying.");
        const provider = resolveBrowserProvider(stored.name);
        applicationMessage = buildApplicationSigningMessage({ contractId, applicant: walletAddress, profileVersion: creatorProfile.profileVersion });
        applicationSignature = await provider.request({ method: "personal_sign", params: [applicationMessage, walletAddress] });
      } catch (error) {
        setApplicationFeedback(error instanceof Error ? error.message : "Wallet signature was cancelled. No application was saved.");
        return;
      }
    }
    const result = saveApplication(next, { contracts: localContract ? [localContract] : undefined });
    if (!result.ok) {
      setApplicationFeedback(result.error === "duplicate" ? "Application already submitted." : result.error === "owner" ? "Contract owners cannot apply to their own job." : "Could not save your application. Try again.");
      if (result.error === "duplicate") setApplication(next);
      return;
    }
    setApplication(result.application);
    try {
      if (!applicationSignature) throw new Error("Circle wallet applications use local fallback until a signing method is configured.");
      const remote = await createRemoteApplication({ contractId, applicant: walletAddress, escrowAddress: localContract?.escrowAddress ?? (/^0x[a-fA-F0-9]{40}$/.test(params.id) ? params.id : undefined), message: applicationMessage, signature: applicationSignature, profileVersion: creatorProfile.profileVersion });
      if (remote.application) setApplication(remote.application);
      setApplicationFeedback(remote.enabled
        ? "Application submitted. The advertiser can now review your profile."
        : "Application saved locally. Shared review is not configured yet.");
    } catch (error) {
      if (error instanceof Error && error.message === "DUPLICATE_APPLICATION") setApplicationFeedback("Application already submitted.");
      else setApplicationFeedback("Application saved locally. Shared review is temporarily unavailable.");
    }
  }

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    async function load() {
      try {
        const publicClient = getPublicClient();
        const escrow = address as `0x${string}`;
        const bytecode = await publicClient.getBytecode({ address: escrow });
        if (!bytecode || bytecode === "0x") throw new Error("ESCROW_NOT_FOUND");
        const [onchainTitle, count, onchainCreator, onchainClient, onchainStatus] = await Promise.all([
          publicClient.readContract({ address: escrow, abi: escrowAbi, functionName: "title" }),
          publicClient.readContract({ address: escrow, abi: escrowAbi, functionName: "milestoneCount" }),
          publicClient.readContract({ address: escrow, abi: escrowAbi, functionName: "creator" }),
          publicClient.readContract({ address: escrow, abi: escrowAbi, functionName: "client" }),
          publicClient.readContract({ address: escrow, abi: escrowAbi, functionName: "status" })
        ]);
        const rows: Milestone[] = [];
        for (let i = 0n; i < count; i++) {
          const result = await publicClient.readContract({ address: escrow, abi: escrowAbi, functionName: "getMilestone", args: [i] });
          const [description, amount, submitted, , released] = result;
          rows.push({
            description,
            amount: formatUsdcExact(amount),
            status: released ? "Paid" : submitted ? "Submitted" : "Pending"
          });
        }
        const discoveredReceipts: Record<number, string> = {};
        try {
          const paymentEvent = escrowAbi.find((item) => item.type === "event" && item.name === "PaymentReleased") as any;
          if (paymentEvent) {
            const paymentLogs = await publicClient.getLogs({ address: escrow, event: paymentEvent, fromBlock: 0n, toBlock: "latest" });
            for (const log of paymentLogs as any[]) {
              const milestoneId = Number(log.args?.milestoneId);
              if (Number.isInteger(milestoneId) && log.transactionHash) discoveredReceipts[milestoneId] = log.transactionHash;
            }
          }
        } catch {
          // Receipt indexing is additive; a log RPC failure must not hide contract state.
        }
        if (!cancelled) {
          setTitle(onchainTitle);
          setCreatorAddress(onchainCreator);
          setClientAddress(onchainClient);
          setEscrowStatus(Number(onchainStatus));
          setMilestones(rows);
          setReceiptHashes(discoveredReceipts);
        }
      } catch (error) {
        if (!cancelled) {
          const raw = error instanceof Error ? error.message : "";
          setStatus(raw === "ESCROW_NOT_FOUND" || raw.toLowerCase().includes("not found")
            ? "This escrow contract could not be found on Arc Testnet. Check the address and network."
            : "Could not load onchain state. Check the network and retry.");
        }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [address]);

  const totalAtomic = useMemo(() => milestones.reduce((sum, m) => sum + parseUsdc(m.amount), 0n), [milestones]);
  const paidAtomic = useMemo(() => milestones.filter((m) => m.status === "Paid").reduce((sum, m) => sum + parseUsdc(m.amount), 0n), [milestones]);
  const total = formatUsdcExact(totalAtomic);
  const paid = formatUsdcExact(paidAtomic);
  const submitted = milestones.filter((m) => m.status === "Submitted").length;
  const paidCount = milestones.filter((m) => m.status === "Paid").length;
  const pendingCount = milestones.filter((m) => m.status === "Pending").length;
  const progress = totalAtomic > 0n ? Number((paidAtomic * 100n) / totalAtomic) : 0;
  const isUnassigned = !creatorAddress || creatorAddress.toLowerCase() === zeroAddress.toLowerCase();
  const isCreator = Boolean(walletAddress && creatorAddress && !isUnassigned && walletAddress.toLowerCase() === creatorAddress.toLowerCase());
  const requiredAllowance = totalAtomic;
  const usdcApproved = requiredAllowance > 0n && usdcAllowance !== undefined && usdcAllowance >= requiredAllowance;
  const isCreated = escrowStatus === 0;
  const isFunded = escrowStatus === 1;
  const isCompleted = escrowStatus === 2;
  const canFund = isClient && isCreated && !isUnassigned;

  async function refreshUsdcAllowance() {
    if (!address || !walletAddress || totalAtomic <= 0n) return;
    const allowance = await getPublicClient().readContract({
      address: ARC_USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "allowance",
      args: [walletAddress as `0x${string}`, address as `0x${string}`]
    });
    setUsdcAllowance(allowance as bigint);
  }

  useEffect(() => {
    let cancelled = false;
    if (!address || !walletAddress || totalAtomic <= 0n) {
      setUsdcAllowance(undefined);
      return () => { cancelled = true; };
    }
    void getPublicClient().readContract({
      address: ARC_USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "allowance",
      args: [walletAddress as `0x${string}`, address as `0x${string}`]
    }).then((allowance) => {
      if (!cancelled) setUsdcAllowance(allowance as bigint);
    }).catch(() => {
      if (!cancelled) setUsdcAllowance(undefined);
    });
    return () => { cancelled = true; };
  }, [address, walletAddress, totalAtomic]);

  async function browserEscrow() {
    if (!address) throw new Error("No escrow address. Create and confirm an onchain escrow first.");
    const stored = JSON.parse(localStorage.getItem("arc-browser-wallet") ?? "null") as { name?: BrowserWalletName } | null;
    if (!stored?.name) throw new Error("Connect a browser wallet from the top-right menu first.");
    const provider = resolveBrowserProvider(stored.name);
    await ensureArcNetwork(provider);
    const { walletClient, account } = await getWalletClient(provider);
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
    setErrorMessage(undefined); setRetryAction(() => () => void approveDeposit());
    try {
      if (!address) throw new Error("Escrow address missing.");
      if (!isClient) throw new Error("Only the advertiser can approve or deposit.");
      if (!isCreated) throw new Error("This escrow is no longer accepting deposits.");
      if (usdcApproved) return;
      if (walletMode === "circle") {
        await circleExec(ARC_USDC_ADDRESS, "approve(address,uint256)", [address, totalAtomic.toString()]);
        await refreshUsdcAllowance();
        return;
      }
      const { walletClient, account, escrow } = await browserEscrow();
      setStatus("Approving USDC allowance...");
      const publicClient = getPublicClient();
      const gas = await publicClient.estimateContractGas({ address: ARC_USDC_ADDRESS, abi: erc20Abi, functionName: "approve", args: [escrow, totalAtomic], account });
      const tx = await walletClient.writeContract({ address: ARC_USDC_ADDRESS, abi: erc20Abi, functionName: "approve", args: [escrow, totalAtomic], account, gas });
      setHash(tx);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
      if (receipt.status !== "success") throw new Error("USDC approval transaction reverted on Arc.");
      await refreshUsdcAllowance();
      setStatus("Approval complete. The approval button is now disabled.");
    } catch (error) { setErrorMessage(explainError(error, "Approval failed")); setStatus("Approval failed"); }
  }

  async function deposit() {
    setErrorMessage(undefined); setRetryAction(() => () => void deposit());
    try {
      if (!address) throw new Error("Escrow address missing.");
      if (!isClient) throw new Error("Only the advertiser can approve or deposit.");
      if (!isCreated) return;
      if (walletMode === "circle") {
        await circleExec(address, "deposit()", []);
        setEscrowStatus(1);
        return;
      }
      const { walletClient, account, escrow } = await browserEscrow();
      setStatus("Depositing USDC into escrow...");
      const gas = await getPublicClient().estimateContractGas({ address: escrow, abi: escrowAbi, functionName: "deposit", account });
      const tx = await walletClient.writeContract({ address: escrow, abi: escrowAbi, functionName: "deposit", account, gas });
      setHash(tx);
      const receipt = await getPublicClient().waitForTransactionReceipt({ hash: tx });
      if (receipt.status !== "success") throw new Error("Deposit transaction reverted on Arc.");
      if (walletAddress && address) {
        const crossChain = readCrossChainFundingRecord(undefined, { walletAddress, escrowId: address });
        if (crossChain?.bridgeStatus === "bridge-complete") {
          writeCrossChainFundingRecord({ ...crossChain, bridgeStatus: "complete", fundingTxHash: tx, updatedAt: new Date().toISOString() });
        }
      }
      setEscrowStatus(1);
      setStatus("Deposit confirmed. The escrow is funded.");
    } catch (error) { setErrorMessage(explainError(error, "Deposit failed")); setStatus("Deposit failed"); }
  }

  async function submitMilestone(index: number) {
    setErrorMessage(undefined); setRetryAction(() => () => void submitMilestone(index));
    try {
      if (!address) throw new Error("Escrow address missing.");
      if (!isCreator) throw new Error("Only the assigned creator can submit.");
      if (!isFunded) throw new Error("The advertiser must deposit funds before milestones can be submitted.");
      if (walletMode === "circle") {
        await circleExec(address, "submitMilestone(uint256)", [String(index)]);
      } else {
        const { walletClient, account, escrow } = await browserEscrow();
        setStatus(`Submitting milestone ${index + 1}...`);
        const gas = await getPublicClient().estimateContractGas({ address: escrow, abi: escrowAbi, functionName: "submitMilestone", args: [BigInt(index)], account });
        const tx = await walletClient.writeContract({ address: escrow, abi: escrowAbi, functionName: "submitMilestone", args: [BigInt(index)], account, gas });
        setHash(tx);
        const receipt = await getPublicClient().waitForTransactionReceipt({ hash: tx });
        if (receipt.status !== "success") throw new Error("Milestone submission reverted on Arc.");
        setStatus(`Milestone ${index + 1} submitted and confirmed on Arc.`);
      }
      setMilestones((prev) => prev.map((m, i) => i === index ? { ...m, status: "Submitted" } : m));
    } catch (error) { setErrorMessage(explainError(error, "Milestone submit failed")); setStatus("Milestone submit failed"); }
  }

  async function approveRelease(index: number) {
    setErrorMessage(undefined); setRetryAction(() => () => void approveRelease(index));
    setPendingRelease(index);
    try {
      if (!address) throw new Error("Escrow address missing.");
      if (!isClient) throw new Error("Only the advertiser can release milestones.");
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
        const gas = await publicClient.estimateContractGas({ address: escrow, abi: escrowAbi, functionName: "approveAndRelease", args: [BigInt(index)], account });
        transactionHash = await walletClient.writeContract({ address: escrow, abi: escrowAbi, functionName: "approveAndRelease", args: [BigInt(index)], account, gas });
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
      setErrorMessage(explainError(error, "Release failed")); setStatus("Release failed");
    } finally {
      setPendingRelease(undefined);
    }
  }

  return (
    <Shell>
      <section className="rounded-[2rem] border border-arc-line bg-white/75 p-7 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-arc-muted">Settlement contract</p>
        {created ? <div role="status" className="mt-4 rounded-2xl border border-arc-lime/60 bg-arc-lime/20 p-4 text-sm font-bold text-arc-ink">Contract created successfully. Review the new escrow and continue from this page.</div> : null}
        <h1 className="mt-2 text-5xl font-black tracking-tight">{title}</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-arc-bg p-5"><p className="text-sm text-arc-muted">Total value</p><p className="text-3xl font-black">{total} USDC</p></div>
          <div className="rounded-3xl bg-arc-bg p-5"><p className="text-sm text-arc-muted">Escrow address</p><p className="break-all text-sm font-black">{address ?? "Waiting for deployment"}</p></div>
          <div className="rounded-3xl bg-arc-bg p-5"><p className="text-sm text-arc-muted">Network</p><p className="text-3xl font-black">Arc</p></div>
        </div>
        <div className="mt-4 rounded-3xl border border-arc-line bg-arc-ink p-5 text-white">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-sm text-white/60">Settlement progress</p><p className="mt-1 text-3xl font-black">{progress}% <span className="text-base font-semibold text-white/60">released</span></p></div>
            <p className="text-sm font-bold text-white/70">{paid} / {total} USDC paid</p>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-arc-lime transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-white/70"><span><b className="text-arc-lime">{paidCount}</b> Paid</span><span><b className="text-white">{submitted}</b> Submitted</span><span><b className="text-white">{pendingCount}</b> Pending</span></div>
        </div>

        <div className="mt-6 flex gap-2 rounded-2xl bg-arc-bg p-2">
          <button onClick={() => setWalletMode("circle")} className={`rounded-xl px-4 py-2 text-sm font-black ${walletMode === "circle" ? "bg-white shadow-sm" : "text-arc-muted"}`}>Circle Wallet</button>
          <button onClick={() => setWalletMode("browser")} className={`rounded-xl px-4 py-2 text-sm font-black ${walletMode === "browser" ? "bg-white shadow-sm" : "text-arc-muted"}`}>Browser Wallet</button>
          {walletMode === "circle" && !hasCircleSession ? <a href="/wallet" className="ml-auto rounded-xl px-4 py-2 text-sm font-black text-arc-purple">Set up Circle wallet →</a> : null}
        </div>
        <div role="note" aria-label="Wallet security notice" className="mt-4 rounded-2xl border border-arc-line bg-white p-4 text-sm">
          <p className="font-black">Wallet security notice</p>
          <p className="mt-1 text-arc-muted">Testnet only. Creator Settlement never asks for a seed phrase, private key, recovery phrase, or wallet password. Approve only after checking the network, amount, and contract action in your wallet.</p>
        </div>
        {demoMode ? <div className="mt-4 rounded-2xl border border-arc-lime/50 bg-arc-lime/20 p-4 text-sm font-bold text-arc-ink">Public demo mode is read-only. The milestone state and receipt below are loaded from Arc Testnet.</div> : null}
        {showApplicationPreview && creatorProfile && creatorVerification ? <div className="mt-4 rounded-3xl border border-arc-line bg-white p-5"><ApplicationProfilePreview profile={creatorProfile} verification={creatorVerification} /><div className="mt-4 flex flex-wrap gap-3"><Button type="button" onClick={handleApply}>Sign application</Button><button type="button" onClick={() => setShowApplicationPreview(false)} className="min-h-11 rounded-full border border-arc-line px-4 py-2 text-sm font-black">Cancel</button></div></div> : null}

        <div className="mt-4 rounded-3xl border border-arc-line bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-arc-muted">Creator opportunity</p>
              <p className="mt-1 font-black">{application ? `Application status: ${application.status}` : isUnassigned ? "Creator not selected yet" : "Interested in this job?"}</p>
              <p className="mt-2 text-sm text-arc-muted">Payout recipient</p>
              <p className="break-all text-sm font-black">{creatorAddress ? (isUnassigned ? "Not assigned yet" : creatorAddress) : "Loading creator address…"}</p>
              {applicationFeedback ? <p role="status" className="mt-2 text-sm font-semibold text-arc-muted">{applicationFeedback}</p> : null}
            </div>
            {!isOwner && isUnassigned && !application && !isCompleted ? <Button disabled={demoMode} onClick={handleApply}>Apply as creator</Button> : null}
            {application ? <span className="rounded-full bg-arc-lime px-4 py-2 text-sm font-black text-arc-ink">{application.status}</span> : null}
            {!isOwner && !isUnassigned && !application ? <span className="rounded-full bg-arc-bg px-4 py-2 text-sm font-black text-arc-muted">Creator selected</span> : null}
          </div>
        </div>

        {isClient ? <ContractApplicants
          applications={receivedApplications}
          profiles={applicantProfiles}
          advertiser={walletAddress!}
          selectionContractId={address ?? params.id}
          loading={applicantsLoading}
          error={applicantsError}
          onSelected={(selected) => {
            setReceivedApplications((current) => current.map((application) => application.id === selected.id ? selected : application));
            setCreatorAddress(selected.applicant);
          }}
        /> : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {isClient && isCreated && isUnassigned ? <p className="rounded-2xl bg-arc-bg px-4 py-3 text-sm font-semibold text-arc-muted">Select a creator before funding this escrow.</p> : canFund ? <>
            {walletMode === "browser" ? <Button type="button" disabled={demoMode || !address || !walletAddress} onClick={() => { setShowCrossChainFunding((visible) => !visible); setCrossChainReady(false); }}>{showCrossChainFunding ? "Use Arc balance directly" : "Fund from another chain"}</Button> : null}
            {(!showCrossChainFunding || walletMode === "circle" || crossChainReady) ? <>
              <Button disabled={demoMode || !address || usdcApproved} onClick={approveDeposit}>{usdcApproved ? "Approved" : "Approve USDC"}</Button>
              <Button disabled={demoMode || !address || isFunded} className="bg-arc-lime text-arc-ink" onClick={deposit}>{isFunded ? "Funded" : "Deposit to escrow"}</Button>
            </> : null}
            {showCrossChainFunding && walletMode === "browser" && address && walletAddress ? <div className="basis-full"><CrossChainFundingPanel walletAddress={walletAddress} escrowId={address} escrowAddress={address} requiredAmountAtomic={totalAtomic} demoMode={demoMode} onBridgeReady={setCrossChainReady} /></div> : null}
          </> : isClient && isCompleted ? <p className="rounded-2xl bg-arc-bg px-4 py-3 text-sm font-semibold text-arc-muted">This escrow is complete. No further funding actions are available.</p> : isClient && isFunded ? <p className="rounded-2xl bg-arc-bg px-4 py-3 text-sm font-semibold text-arc-muted">Escrow funded. Review submitted milestones and release approved work.</p> : <p className="rounded-2xl bg-arc-bg px-4 py-3 text-sm font-semibold text-arc-muted">Only the advertiser can approve or deposit.</p>}
          {isCreator && !isClient ? <p className="rounded-2xl bg-arc-bg px-4 py-3 text-sm font-semibold text-arc-muted">Creator wallet connected. Submit milestones after the advertiser funds the escrow.</p> : null}
          {!isClient && !isCreator ? <p className="rounded-2xl bg-arc-bg px-4 py-3 text-sm font-semibold text-arc-muted">Connect the advertiser or assigned creator wallet to manage this escrow.</p> : null}
        </div>
        {!address ? <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">Escrow address is missing. This local record was saved before deployment completed. Return to Create Contract and create the escrow again.</div> : null}
        <div className="mt-8 space-y-4">
          {milestones.length === 0 ? <div className="rounded-3xl border border-arc-line bg-white p-5 text-arc-muted">Onchain milestones will appear after the escrow address is confirmed.</div> : null}
          {milestones.map((m, index) => (
            <div key={`${m.description}-${index}`} className="grid items-center gap-4 rounded-3xl border border-arc-line bg-white p-5 md:grid-cols-[1fr_8rem_8rem_minmax(16rem,auto)]">
              <div><p className="font-black">{index + 1}. {m.description}</p><p className="text-sm text-arc-muted">Onchain milestone release</p></div>
              <p className="font-black">{m.amount} USDC</p>
              <span className="w-fit rounded-full bg-arc-bg px-3 py-1 text-xs font-black">{m.status}</span>
              <div className="flex gap-2">
                {isCreator ? <Button disabled={demoMode || !isFunded || m.status !== "Pending"} className="px-4 py-2" onClick={() => submitMilestone(index)}>Submit</Button> : null}
                {isClient ? <Button disabled={demoMode || pendingRelease === index || !isFunded || m.status !== "Submitted"} className="bg-arc-purple px-4 py-2" onClick={() => approveRelease(index)}>
                  {pendingRelease === index ? "Confirming…" : "Release"}
                </Button> : null}
                {!isCreator && !isClient ? <span className="text-sm font-semibold text-arc-muted">Role required</span> : null}
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
        {errorMessage ? <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"><span>{errorMessage}</span>{retryAction ? <button className="rounded-full bg-red-700 px-4 py-2 text-xs font-black text-white" onClick={() => retryAction()}>Retry</button> : null}</div> : null}
        {hash ? <a className="mt-4 block font-black text-arc-purple" href={txUrl(hash)} target="_blank" rel="noreferrer">View latest transaction on ArcScan</a> : null}
      </section>
    </Shell>
  );
}
