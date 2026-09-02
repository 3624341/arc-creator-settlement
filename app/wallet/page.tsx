"use client";

import { useEffect, useRef, useState } from "react";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/Button";
import { ARC_EXPLORER_URL } from "@/lib/arc";
import { saveCircleSession } from "@/lib/circle-wallet-client";

type LoginResult = { userToken: string; encryptionKey: string };
type CircleWallet = { id: string; address: string; blockchain: string; accountType?: string };

const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID ?? "";

async function api(action: string, params: Record<string, unknown> = {}) {
  const response = await fetch("/api/circle/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params })
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data?.message || data?.error || "Circle request failed"), data);
  return data;
}

export default function WalletPage() {
  const sdkRef = useRef<W3SSdk | null>(null);
  const [userId, setUserId] = useState("grant-demo-client");
  const [login, setLogin] = useState<LoginResult | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<CircleWallet | null>(null);
  const [balance, setBalance] = useState("0");
  const [status, setStatus] = useState(appId ? "Ready" : "Circle App ID is not configured yet.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!appId) return;
    const sdk = new W3SSdk({ appSettings: { appId } });
    sdkRef.current = sdk;
    void Promise.resolve(sdk.getDeviceId()).catch(() => {
      setStatus("Circle Web SDK could not initialize its device session.");
    });
  }, []);

  async function refreshWallet(userToken: string, encryptionKey?: string) {
    const data = await api("listWallets", { userToken });
    const wallets = (data.wallets ?? []) as CircleWallet[];
    const arcWallet = wallets.find((w) => w.blockchain === "ARC-TESTNET") ?? wallets[0];
    if (!arcWallet) {
      setWallet(null);
      return false;
    }
    setWallet(arcWallet);
    localStorage.setItem("circle-wallet-id", arcWallet.id);
    localStorage.setItem("circle-wallet-address", arcWallet.address);
    const key = encryptionKey ?? login?.encryptionKey;
    if (key) saveCircleSession({ userToken, encryptionKey: key, walletId: arcWallet.id, address: arcWallet.address });
    const balances = await api("getTokenBalance", { userToken, walletId: arcWallet.id });
    const tokenBalances = balances.tokenBalances ?? [];
    const usdc = tokenBalances.find((item: any) => item?.token?.symbol?.startsWith("USDC"));
    setBalance(usdc?.amount ?? "0");
    return true;
  }

  async function start() {
    if (!appId) return setStatus("Add NEXT_PUBLIC_CIRCLE_APP_ID first.");
    if (userId.length < 5) return setStatus("User ID must be at least 5 characters.");
    setBusy(true);
    try {
      setStatus("Creating Circle user...");
      try { await api("createUser", { userId }); } catch (error: any) {
        // Existing users may return an API error; continue to session token.
        const code = String(error?.code ?? "");
        const message = String(error?.message ?? "").toLowerCase();
        if (code !== "155101" && !message.includes("already")) throw error;
      }
      setStatus("Creating secure user session...");
      const token = await api("getUserToken", { userId });
      const credentials = { userToken: token.userToken, encryptionKey: token.encryptionKey };
      setLogin(credentials);
      sdkRef.current?.setAuthentication(credentials);

      setStatus("Initializing an Arc Testnet SCA wallet...");
      try {
        const init = await api("initializeUser", { userToken: credentials.userToken });
        setChallengeId(init.challengeId);
        setStatus("Wallet setup challenge ready. Click 'Create Circle wallet'.");
      } catch (error: any) {
        const loaded = await refreshWallet(credentials.userToken, credentials.encryptionKey).catch(() => false);
        if (loaded) {
          setStatus("Existing Circle wallet loaded.");
        } else {
          throw error;
        }
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Circle setup failed");
    } finally {
      setBusy(false);
    }
  }

  async function executeChallenge() {
    if (!challengeId || !login || !sdkRef.current) return;
    setBusy(true);
    setStatus("Open the Circle secure window and set your wallet PIN...");
    try {
      sdkRef.current.setAuthentication(login);
      await new Promise<void>((resolve, reject) => {
        sdkRef.current!.execute(challengeId, (error) => error ? reject(error) : resolve());
      });
      setChallengeId(null);
      await new Promise((r) => setTimeout(r, 1500));
      await refreshWallet(login.userToken, login.encryptionKey);
      setStatus("Circle User-Controlled Wallet created on Arc Testnet.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Challenge failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="grid gap-8 lg:grid-cols-[0.62fr_0.38fr]">
        <section className="rounded-[2rem] border border-arc-line bg-white/80 p-7 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-arc-muted">Circle Wallets</p>
          <h1 className="mt-2 text-5xl font-black tracking-tight">User-owned wallet on Arc</h1>
          <p className="mt-4 max-w-2xl text-arc-muted">The user keeps control of the keyshare. Circle handles wallet creation and authorization without seed phrases.</p>

          <label className="mt-8 grid gap-2 font-bold">Demo user ID
            <input className="rounded-2xl border border-arc-line bg-white px-4 py-3 font-normal" value={userId} onChange={(e) => setUserId(e.target.value)} />
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={start} disabled={busy}>{wallet ? "Reload wallet" : "1. Start Circle wallet setup"}</Button>
            <Button className="bg-arc-lime text-arc-ink" onClick={executeChallenge} disabled={busy || !challengeId}>2. Create Circle wallet</Button>
          </div>

          <div className="mt-6 rounded-2xl bg-arc-bg p-4 text-sm font-semibold text-arc-muted">{status}</div>
        </section>

        <aside className="rounded-[2rem] bg-arc-ink p-7 text-white shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-arc-cyan">Arc Testnet wallet</p>
          {wallet ? (
            <>
              <p className="mt-5 break-all text-xl font-black">{wallet.address}</p>
              <div className="mt-7 rounded-3xl bg-white/10 p-5">
                <p className="text-sm text-white/60">USDC balance</p>
                <p className="mt-1 text-4xl font-black">{balance} USDC</p>
              </div>
              <a className="mt-5 inline-block font-black text-arc-cyan" href={`${ARC_EXPLORER_URL}/address/${wallet.address}`} target="_blank" rel="noreferrer">View on ArcScan →</a>
            </>
          ) : (
            <p className="mt-5 text-white/65">Create the wallet to display its address, Arc network, and USDC balance here.</p>
          )}
        </aside>
      </div>
    </Shell>
  );
}
