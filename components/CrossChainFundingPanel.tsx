"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "./Button";
import { addArcNetwork, addBaseSepoliaNetwork, ensureArcNetwork, ensureBaseSepoliaNetwork, isNetworkNotAddedError, resolveBrowserProvider, type BrowserWalletName } from "@/lib/browser-wallet";
import {
  BASE_SEPOLIA_EXPLORER_URL,
  bridgeRetryNetwork,
  estimateBaseToArcBridge,
  executeBaseToArcBridge,
  explainBridgeError,
  explorerUrlForBridgeStep,
  readArcUsdcBalance,
  readBaseSepoliaNativeBalance,
  readBaseSepoliaUsdcBalance,
  retryBaseToArcBridge,
  type BridgeEstimateSnapshot,
  type BridgeProgressEvent,
} from "@/lib/cross-chain-bridge";
import {
  formatCrossChainUsdc,
  isReadyToFund,
  isValidCrossChainFundingRecord,
  parseCrossChainUsdc,
  readCrossChainFundingRecord,
  shouldResumeBridge,
  writeCrossChainFundingRecord,
  type CrossChainFundingRecord,
} from "@/lib/cross-chain-funding";
import type { BridgeResult } from "@circle-fin/app-kit";
import { formatUnits } from "viem";

type Props = {
  walletAddress?: string;
  escrowId: string;
  escrowAddress: string;
  requiredAmountAtomic: bigint;
  demoMode?: boolean;
  onBridgeReady: (ready: boolean) => void;
};

function getStoredBrowserProvider() {
  const stored = JSON.parse(localStorage.getItem("arc-browser-wallet") ?? "null") as { name?: BrowserWalletName } | null;
  if (!stored?.name) throw new Error("브라우저 지갑을 먼저 연결하세요.");
  return resolveBrowserProvider(stored.name);
}

function newRecord(props: Props, amountAtomic: bigint): CrossChainFundingRecord {
  const now = new Date().toISOString();
  return {
    id: `cross-chain-${props.escrowId}-${props.walletAddress?.toLowerCase() ?? "unknown"}-${Date.now()}`,
    escrowId: props.escrowId,
    escrowAddress: props.escrowAddress,
    walletAddress: props.walletAddress!,
    sourceChain: "Base_Sepolia",
    destinationChain: "Arc_Testnet",
    token: "USDC",
    amountAtomic: amountAtomic.toString(),
    escrowAmountAtomic: props.requiredAmountAtomic.toString(),
    bridgeStatus: "estimating",
    createdAt: now,
    updatedAt: now,
  };
}

function stepLabel(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("approve")) return "Base Sepolia USDC 승인";
  if (normalized.includes("burn") || normalized.includes("source")) return "Base Sepolia 전송";
  if (normalized.includes("attestation")) return "Circle attestation 확인";
  if (normalized.includes("mint") || normalized.includes("destination") || normalized.includes("receive")) return "Arc Testnet 도착 처리";
  return name;
}

export function CrossChainFundingPanel(props: Props) {
  const [amountInput, setAmountInput] = useState(formatCrossChainUsdc(props.requiredAmountAtomic));
  const [sourceBalance, setSourceBalance] = useState<bigint>();
  const [sourceNativeBalance, setSourceNativeBalance] = useState<bigint>();
  const [arcBalance, setArcBalance] = useState<bigint>();
  const [estimate, setEstimate] = useState<BridgeEstimateSnapshot>();
  const [estimatedAmountAtomic, setEstimatedAmountAtomic] = useState<bigint>();
  const [record, setRecord] = useState<CrossChainFundingRecord>();
  const [progress, setProgress] = useState<BridgeProgressEvent[]>([]);
  const [sdkResult, setSdkResult] = useState<BridgeResult>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [networkSetup, setNetworkSetup] = useState<"arc" | "base">();

  const amountAtomic = useMemo(() => {
    try {
      return parseCrossChainUsdc(amountInput);
    } catch {
      return undefined;
    }
  }, [amountInput]);
  const amountIsEnough = amountAtomic !== undefined && amountAtomic >= props.requiredAmountAtomic;
  const balanceIsEnough = amountAtomic !== undefined && sourceBalance !== undefined && sourceBalance >= amountAtomic;
  const bridgeReady = Boolean(record && arcBalance !== undefined && isReadyToFund(record, arcBalance));

  function persist(next: CrossChainFundingRecord) {
    setRecord(next);
    writeCrossChainFundingRecord(next);
  }

  async function refreshBalances() {
    if (!props.walletAddress) return;
    const account = props.walletAddress as `0x${string}`;
    const [usdc, native, arc] = await Promise.all([
      readBaseSepoliaUsdcBalance(account),
      readBaseSepoliaNativeBalance(account),
      readArcUsdcBalance(account),
    ]);
    setSourceBalance(usdc);
    setSourceNativeBalance(native);
    setArcBalance(arc);
  }

  async function addRequestedNetwork(network: "arc" | "base") {
    setBusy(true);
    setError(undefined);
    try {
      const provider = getStoredBrowserProvider();
      if (network === "arc") await addArcNetwork(provider);
      else await addBaseSepoliaNetwork(provider);
      setNetworkSetup(undefined);
      setNotice(network === "arc" ? "Arc Testnet이 지갑에 추가되었습니다. 필요한 작업을 다시 시도하세요." : "Base Sepolia가 지갑에 추가되었습니다. 필요한 작업을 다시 시도하세요.");
    } catch (caught) {
      setError(explainBridgeError(caught));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    props.onBridgeReady(bridgeReady);
  }, [bridgeReady]);

  useEffect(() => {
    if (!props.walletAddress) {
      setRecord(undefined);
      setArcBalance(undefined);
      props.onBridgeReady(false);
      return;
    }
    const restored = readCrossChainFundingRecord(undefined, {
      walletAddress: props.walletAddress,
      escrowId: props.escrowId,
    });
    setRecord(restored ?? undefined);
    setProgress([]);
    setSdkResult(undefined);
    setError(undefined);
    void refreshBalances().catch(() => setNotice("잔액을 불러오지 못했습니다. 지갑 네트워크와 RPC 연결을 확인하세요."));
  }, [props.walletAddress, props.escrowId]);

  useEffect(() => {
    if (!props.walletAddress) return;
    let provider: any;
    try {
      provider = getStoredBrowserProvider();
    } catch {
      return;
    }
    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts[0] || accounts[0].toLowerCase() !== props.walletAddress!.toLowerCase()) {
        setRecord(undefined);
        setSdkResult(undefined);
        setProgress([]);
        setError("작업 중 지갑 계정이 변경되었습니다. 새 계정의 escrow 작업으로 다시 시작하세요.");
        props.onBridgeReady(false);
      }
    };
    provider.on?.("accountsChanged", handleAccountsChanged);
    return () => provider.removeListener?.("accountsChanged", handleAccountsChanged);
  }, [props.walletAddress]);

  async function handleEstimate() {
    setError(undefined);
    setNotice(undefined);
    setEstimate(undefined);
    setEstimatedAmountAtomic(undefined);
    try {
      if (props.demoMode) throw new Error("공개 데모에서는 브리지 실행을 할 수 없습니다.");
      if (!props.walletAddress) throw new Error("광고주 브라우저 지갑을 연결하세요.");
      if (!amountAtomic || !amountIsEnough) throw new Error(`예상 도착 금액이 escrow 필요액(${formatCrossChainUsdc(props.requiredAmountAtomic)} USDC) 이상이어야 합니다.`);
      const provider = getStoredBrowserProvider();
      setNotice("지갑에서 Base Sepolia 네트워크 전환을 확인하는 중입니다.");
      await ensureBaseSepoliaNetwork(provider);
      const snapshot = await estimateBaseToArcBridge(provider, props.walletAddress as `0x${string}`, amountInput);
      setEstimate(snapshot);
      setEstimatedAmountAtomic(amountAtomic);
      setNotice("수수료 견적을 확인했습니다. 예상 도착 금액과 가스 잔액을 확인한 뒤 브리지를 실행하세요.");
      await refreshBalances();
    } catch (caught) {
      if (isNetworkNotAddedError(caught)) setNetworkSetup("base");
      setError(explainBridgeError(caught));
    }
  }

  async function completeBridge(nextRecord: CrossChainFundingRecord, result: BridgeResult) {
    const mapped = {
      ...nextRecord,
      sourceTxHash: result.steps.find((step) => /burn|source/i.test(step.name) && step.txHash)?.txHash ?? nextRecord.sourceTxHash,
      destinationTxHash: result.steps.find((step) => /mint|destination|receive/i.test(step.name) && step.txHash)?.txHash ?? nextRecord.destinationTxHash,
      bridgeStatus: result.state === "success" ? "awaiting-arc" as const : "error" as const,
      lastError: result.steps.find((step) => step.state === "error")?.errorMessage,
      updatedAt: new Date().toISOString(),
    };
    persist(mapped);
    if (result.state !== "success") {
      throw new Error(mapped.lastError ?? "브리지 SDK가 오류 상태를 반환했습니다.");
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const nextBalance = await readArcUsdcBalance(props.walletAddress as `0x${string}`);
      setArcBalance(nextBalance);
      if (nextBalance >= props.requiredAmountAtomic) {
        const ready = { ...mapped, bridgeStatus: "bridge-complete" as const, lastError: undefined, updatedAt: new Date().toISOString() };
        persist(ready);
        setNotice("브리지 완료와 Arc 잔액을 확인했습니다. 이제 기존 Approve USDC 후 Fund escrow를 별도로 실행하세요.");
        return;
      }
      if (attempt < 7) await new Promise((resolve) => window.setTimeout(resolve, 2500));
    }
    const waiting = { ...mapped, bridgeStatus: "awaiting-arc" as const, lastError: "Arc 잔액이 아직 escrow 필요액에 도달하지 않았습니다. attestation 또는 도착 처리가 지연 중일 수 있습니다." };
    persist(waiting);
    throw new Error(waiting.lastError);
  }

  async function handleBridge() {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      if (props.demoMode) throw new Error("공개 데모에서는 브리지 실행을 할 수 없습니다.");
      if (!props.walletAddress) throw new Error("광고주 브라우저 지갑을 연결하세요.");
      if (!amountAtomic || !amountIsEnough) throw new Error(`브리지 금액은 escrow 필요액 ${formatCrossChainUsdc(props.requiredAmountAtomic)} USDC 이상이어야 합니다.`);
      if (estimatedAmountAtomic !== amountAtomic) throw new Error("금액이 변경되었습니다. 먼저 수수료 견적을 다시 조회하세요.");
      const provider = getStoredBrowserProvider();
      setNotice("지갑에서 Base Sepolia 네트워크 전환을 확인하는 중입니다.");
      await ensureBaseSepoliaNetwork(provider);
      if (sourceBalance === undefined || sourceNativeBalance === undefined) await refreshBalances();
      if (sourceBalance !== undefined && sourceBalance < amountAtomic) throw new Error("Base Sepolia USDC 잔액이 부족합니다.");
      if (sourceNativeBalance !== undefined && sourceNativeBalance === 0n) throw new Error("Base Sepolia ETH 가스가 부족합니다. 테스트 ETH를 준비하세요.");
      if (record && !shouldResumeBridge(record)) throw new Error("이미 출발 전송이 완료되었거나 Arc 도착을 기다리는 작업입니다. 새 브리지를 시작하지 말고 상태를 새로고침하세요.");

      const next = record && record.amountAtomic === amountAtomic.toString()
        ? { ...record, bridgeStatus: "bridging" as const, lastError: undefined, updatedAt: new Date().toISOString() }
        : { ...newRecord(props, amountAtomic), bridgeStatus: "bridging" as const };
      persist(next);
      setProgress([]);
      const result = await executeBaseToArcBridge(provider, props.walletAddress as `0x${string}`, amountInput, (event) => {
        setProgress((previous) => [...previous.filter((item) => item.name !== event.name), event]);
        const current = readCrossChainFundingRecord(undefined, { walletAddress: props.walletAddress!, escrowId: props.escrowId });
        if (current) {
          const isSource = /burn|source|approve/i.test(event.name);
          persist({
            ...current,
            bridgeStatus: event.state === "error" ? "error" : isSource && event.txHash ? "awaiting-arc" : "bridging",
            sourceTxHash: isSource && event.txHash ? event.txHash : current.sourceTxHash,
            destinationTxHash: !isSource && event.txHash ? event.txHash : current.destinationTxHash,
            lastError: event.errorMessage,
            updatedAt: new Date().toISOString(),
          });
        }
      });
      setSdkResult(result);
      await completeBridge(readCrossChainFundingRecord(undefined, { walletAddress: props.walletAddress, escrowId: props.escrowId }) ?? next, result);
    } catch (caught) {
      if (isNetworkNotAddedError(caught)) setNetworkSetup("base");
      setError(explainBridgeError(caught));
    } finally {
      setBusy(false);
    }
  }

  async function handleRetry() {
    if (!sdkResult || sdkResult.state !== "error") return;
    setBusy(true);
    setError(undefined);
    try {
      const provider = getStoredBrowserProvider();
      const retryNetwork = bridgeRetryNetwork(sdkResult);
      if (retryNetwork === "destination") {
        setNotice("지갑에서 Arc Testnet 네트워크 전환을 확인하는 중입니다. 전환이 끝나면 Arc 도착 단계만 재개합니다.");
        await ensureArcNetwork(provider);
      } else {
        setNotice("지갑에서 Base Sepolia 네트워크 전환을 확인하는 중입니다.");
        await ensureBaseSepoliaNetwork(provider);
      }
      const result = await retryBaseToArcBridge(provider, sdkResult, (event) => setProgress((previous) => [...previous.filter((item) => item.name !== event.name), event]));
      setSdkResult(result);
      const current = readCrossChainFundingRecord(undefined, { walletAddress: props.walletAddress!, escrowId: props.escrowId });
      if (!current) throw new Error("복구할 작업 상태를 찾지 못했습니다.");
      await completeBridge(current, result);
    } catch (caught) {
      if (isNetworkNotAddedError(caught)) setNetworkSetup(bridgeRetryNetwork(sdkResult ?? { steps: [] }) === "destination" ? "arc" : "base");
      setError(explainBridgeError(caught));
    } finally {
      setBusy(false);
    }
  }

  const hasPersistedWork = Boolean(record);

  return (
    <div className="mt-4 rounded-3xl border border-arc-purple/30 bg-[#f8f6ff] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-arc-purple">Cross-chain funding</p>
            <span className="rounded-full bg-arc-lime px-2.5 py-1 text-[11px] font-black text-arc-ink">Testnet only</span>
          </div>
          <h3 className="mt-2 text-xl font-black">Base Sepolia에서 Arc로 가져오기</h3>
          <p className="mt-1 text-sm text-arc-muted">브리지는 광고주 지갑으로 도착한 뒤, 기존 Arc escrow 예치와 별도로 실행됩니다.</p>
        </div>
        <button type="button" onClick={() => void refreshBalances().catch((caught) => setError(explainBridgeError(caught)))} className="rounded-full border border-arc-line bg-white px-3 py-2 text-xs font-black">Refresh balances</button>
      </div>

      <div role="note" aria-label="Wallet security notice" className="mt-4 rounded-2xl border border-arc-line bg-white p-4 text-sm">
        <p className="font-black">Wallet security notice</p>
        <p className="mt-1 text-arc-muted">Testnet only. Creator Settlement never asks for a seed phrase, private key, recovery phrase, or wallet password. Before approving, verify the network, amount, and contract action in your wallet.</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4"><p className="text-xs font-bold text-arc-muted">Route</p><p className="mt-1 font-black">Base Sepolia → Arc Testnet</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs font-bold text-arc-muted">Destination wallet</p><p className="mt-1 break-all text-xs font-black">{props.walletAddress ?? "Wallet not connected"}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs font-bold text-arc-muted">Base Sepolia USDC</p><p className="mt-1 font-black">{sourceBalance === undefined ? "—" : `${formatCrossChainUsdc(sourceBalance)} USDC`}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs font-bold text-arc-muted">Base Sepolia ETH (gas)</p><p className="mt-1 font-black">{sourceNativeBalance === undefined ? "—" : `${formatUnits(sourceNativeBalance, 18)} ETH`}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs font-bold text-arc-muted">Arc USDC (verified)</p><p className="mt-1 font-black">{arcBalance === undefined ? "—" : `${formatCrossChainUsdc(arcBalance)} USDC`}</p></div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="block"><span className="text-xs font-black text-arc-muted">Bridge amount (USDC)</span><input value={amountInput} onChange={(event) => { setAmountInput(event.target.value); setEstimate(undefined); setEstimatedAmountAtomic(undefined); }} inputMode="decimal" className="mt-1 min-h-11 w-full rounded-2xl border border-arc-line bg-white px-4 font-black outline-none focus:border-arc-purple" /></label>
        <Button type="button" disabled={busy || props.demoMode} onClick={handleEstimate}>{busy ? "Processing…" : "Get fee estimate"}</Button>
      </div>
      <p className={`mt-2 text-xs font-semibold ${amountIsEnough ? "text-arc-muted" : "text-red-700"}`}>Escrow 필요액: {formatCrossChainUsdc(props.requiredAmountAtomic)} USDC 이상. 수수료와 도착 차감액을 고려해 입력하세요.</p>

      {estimate ? <div className="mt-4 rounded-2xl border border-arc-line bg-white p-4 text-sm">
        <p className="font-black">예상 도착: {estimate.expectedDestinationUsdc} USDC · protocol fee: {estimate.protocolFeeUsdc} USDC</p>
        <div className="mt-2 space-y-1 text-xs text-arc-muted">{estimate.gasFees.map((fee) => <p key={`${fee.name}-${fee.chain}`}>{fee.name}: 약 {fee.amount} {fee.token} ({fee.chain})</p>)}</div>
      </div> : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" disabled={busy || props.demoMode || !estimate || !balanceIsEnough || !amountIsEnough || Boolean(record?.sourceTxHash)} onClick={() => void handleBridge()} className="bg-arc-purple">{record?.bridgeStatus === "awaiting-arc" ? "Continue bridge" : "Bridge to Arc"}</Button>
        {sdkResult?.state === "error" ? <Button type="button" disabled={busy} onClick={() => void handleRetry()}>{bridgeRetryNetwork(sdkResult) === "destination" ? "Retry Arc arrival" : "Retry SDK step"}</Button> : null}
        {hasPersistedWork && record?.sourceTxHash ? <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-arc-muted">Source transaction already recorded — do not start a duplicate bridge</span> : null}
      </div>

      {networkSetup ? <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-black">네트워크를 먼저 지갑에 추가하세요</p>
        <p className="mt-1">자동으로 네트워크를 추가하지 않습니다. 아래 버튼을 눌러 지갑에서 네트워크 정보를 확인하고 직접 추가한 뒤 작업을 다시 시도하세요.</p>
        <Button type="button" disabled={busy} onClick={() => void addRequestedNetwork(networkSetup)} className="mt-3 bg-amber-200 text-amber-950">{networkSetup === "base" ? "Add Base Sepolia to wallet" : "Add Arc Testnet to wallet"}</Button>
      </div> : null}

      {progress.length ? <div className="mt-4 space-y-2">{progress.map((step) => <div key={step.name} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3 text-sm"><span className="font-black">{stepLabel(step.name)}</span><span className={step.state === "error" ? "text-red-700" : step.state === "success" ? "text-green-700" : "text-arc-muted"}>{step.state}{step.explorerUrl || explorerUrlForBridgeStep(step) ? <a className="ml-2 underline" href={step.explorerUrl || explorerUrlForBridgeStep(step)} target="_blank" rel="noreferrer">Explorer</a> : null}</span></div>)}</div> : null}

      {record?.sourceTxHash ? <p className="mt-3 text-xs font-semibold text-arc-muted">Source tx: <a className="underline" href={`${BASE_SEPOLIA_EXPLORER_URL}/tx/${record.sourceTxHash}`} target="_blank" rel="noreferrer">{record.sourceTxHash}</a></p> : null}
      {record?.destinationTxHash ? <p className="mt-1 text-xs font-semibold text-arc-muted">Destination tx: <a className="underline" href={`${record.destinationTxHash.includes("http") ? record.destinationTxHash : `https://testnet.arcscan.app/tx/${record.destinationTxHash}`}`} target="_blank" rel="noreferrer">{record.destinationTxHash}</a></p> : null}

      {bridgeReady ? <div className="mt-4 rounded-2xl border border-green-300 bg-green-50 p-4 text-sm font-bold text-green-800">Arc 잔액과 SDK 최종 결과를 확인했습니다. 아래의 기존 <b>Approve USDC</b>와 <b>Deposit to escrow</b>를 별도로 실행하세요. 브리지 완료만으로 escrow가 funded로 바뀌지 않습니다.</div> : null}
      {record?.bridgeStatus === "awaiting-arc" && record.sourceTxHash ? <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">출발 전송은 이미 기록되었습니다. attestation/Arc 도착 처리가 지연될 수 있습니다. 새 Bridge를 다시 누르지 말고 Refresh balances로 확인하세요.</div> : null}
      {notice ? <p role="status" className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold text-arc-muted">{notice}</p> : null}
      {error ? <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}
      {!sourceBalance || sourceNativeBalance === 0n ? <p className="mt-3 text-xs font-semibold text-red-700">Base Sepolia USDC와 ETH 가스가 필요합니다. Base Sepolia 네트워크의 브라우저 지갑 주소로 테스트 토큰을 준비하세요.</p> : null}
    </div>
  );
}
