"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { CreatorProfileForm } from "@/components/CreatorProfileForm";
import { getCircleSession } from "@/lib/circle-wallet-client";
import { getRemoteProfile } from "@/lib/creator-profile-remote";
import type { CreatorProfile } from "@/lib/creator-profile";

export default function CreatorProfileEditPage() {
  const [wallet, setWallet] = useState("");
  const [profile, setProfile] = useState<CreatorProfile>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const circle = getCircleSession();
    let address = circle?.address ?? "";
    try { const saved = JSON.parse(localStorage.getItem("arc-browser-wallet") ?? "null") as { address?: string } | null; address = localStorage.getItem("arc-wallet-mode") === "browser" ? saved?.address ?? address : address; } catch { /* malformed local session */ }
    setWallet(address);
    if (!address) { setLoading(false); return; }
    void getRemoteProfile(address).then((result) => setProfile(result.profile)).catch(() => undefined).finally(() => setLoading(false));
  }, []);
  if (!wallet) return <Shell><section className="rounded-[2rem] border border-arc-line bg-white/80 p-8"><h1 className="text-3xl font-black">Connect a browser wallet to edit your Creator Passport.</h1><p className="mt-3 text-sm text-arc-muted">A wallet signature proves that this wallet owns the profile.</p></section></Shell>;
  return <Shell><div className="mb-8"><p className="text-sm font-bold uppercase tracking-[0.22em] text-arc-muted">Creator Passport</p><h1 className="mt-2 text-4xl font-black tracking-tight">{profile ? "Edit your profile" : "Build your Creator Passport"}</h1><p className="mt-3 max-w-2xl text-arc-muted">Show advertisers what you can do, where you work, and which Arc settlement history is verifiable.</p></div>{loading ? <p className="rounded-2xl bg-arc-bg p-4 text-sm font-semibold">Loading profile…</p> : <CreatorProfileForm walletAddress={wallet} initialProfile={profile} onSaved={setProfile} />}</Shell>;
}
