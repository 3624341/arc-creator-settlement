"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { escrowAbi } from "@/lib/abi";
import { ensureArcNetwork, getPublicClient, getWalletClient, resolveBrowserProvider, type BrowserWalletName } from "@/lib/browser-wallet";
import { getCircleSession, requestCircleContractExecution } from "@/lib/circle-wallet-client";
import { selectRemoteApplication } from "@/lib/marketplace-remote";
import type { JobApplication } from "@/lib/marketplace-store";

const BROWSER_WALLET_STORAGE = "arc-browser-wallet";

type Props = {
  contractId: string;
  applicant: JobApplication;
  advertiser: string;
  onSelected: (application: JobApplication) => void;
};

function sameAddress(left: string | undefined, right: string) {
  return Boolean(left && left.toLowerCase() === right.toLowerCase());
}

export function CreatorSelectionButton({ contractId, applicant, advertiser, onSelected }: Props) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string>();

  async function waitForCreator(expected: string) {
    const publicClient = getPublicClient();
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const creator = await publicClient.readContract({ address: contractId as `0x${string}`, abi: escrowAbi, functionName: "creator" });
      if (sameAddress(String(creator), expected)) return;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error("Arc assignment is still indexing. Refresh this page before retrying.");
  }

  async function assignOnchain() {
    const currentCreator = await getPublicClient().readContract({ address: contractId as `0x${string}`, abi: escrowAbi, functionName: "creator" });
    if (sameAddress(String(currentCreator), applicant.applicant)) return;

    const circle = getCircleSession();
    const saved = JSON.parse(localStorage.getItem(BROWSER_WALLET_STORAGE) ?? "null") as { name?: BrowserWalletName } | null;
    if (circle && sameAddress(circle.address, advertiser) && localStorage.getItem("arc-wallet-mode") !== "browser") {
      await requestCircleContractExecution({
        contractAddress: contractId as `0x${string}`,
        abiFunctionSignature: "assignCreator(address)",
        abiParameters: [applicant.applicant],
        refId: `assign-creator-${contractId}-${applicant.applicant}`
      });
      await waitForCreator(applicant.applicant);
      return;
    }

    if (!saved?.name) throw new Error("Connect the advertiser browser wallet before selecting a creator.");
    const provider = resolveBrowserProvider(saved.name);
    await ensureArcNetwork(provider);
    const { walletClient, account } = await getWalletClient(provider);
    if (!sameAddress(account, advertiser)) throw new Error("Connect the advertiser wallet to select a creator.");
    const hash = await walletClient.writeContract({
      address: contractId as `0x${string}`,
      abi: escrowAbi,
      functionName: "assignCreator",
      args: [applicant.applicant as `0x${string}`],
      account
    });
    const receipt = await getPublicClient().waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error("Creator assignment transaction reverted on Arc.");
    await waitForCreator(applicant.applicant);
  }

  async function select() {
    if (applicant.status !== "Applied" || busy) return;
    setBusy(true);
    setFeedback(undefined);
    try {
      await assignOnchain();
      const result = await selectRemoteApplication({ contractId, applicant: applicant.applicant });
      onSelected(result.application);
      setFeedback("Creator selected and assigned on Arc.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Creator selection failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="flex shrink-0 flex-col items-end gap-2">
    {applicant.status === "Applied" ? <Button type="button" disabled={busy} className="bg-arc-lime text-arc-ink" onClick={select}>{busy ? "Selecting…" : "Select creator"}</Button> : <span className="rounded-full bg-arc-lime px-3 py-1 text-xs font-black text-arc-ink">{applicant.status}</span>}
    {feedback ? <p role="status" className="max-w-64 text-right text-xs font-semibold text-arc-muted">{feedback}</p> : null}
  </div>;
}
