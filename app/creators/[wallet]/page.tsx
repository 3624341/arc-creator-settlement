"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shell } from "@/components/Shell";
import { CreatorPortfolio } from "@/components/CreatorPortfolio";
import { CreatorProfileHeader } from "@/components/CreatorProfileHeader";
import { CreatorSocialLinks } from "@/components/CreatorSocialLinks";
import { CreatorVerificationBadges } from "@/components/CreatorVerificationBadges";
import { getRemoteProfile } from "@/lib/creator-profile-remote";
import type { CreatorProfile, CreatorVerification } from "@/lib/creator-profile";

function short(wallet: string) { return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`; }

export default function PublicCreatorProfilePage() {
  const params = useParams<{ wallet: string }>();
  const wallet = params.wallet;
  const [profile, setProfile] = useState<CreatorProfile>();
  const [verification, setVerification] = useState<CreatorVerification>();
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (!wallet) return; void getRemoteProfile(wallet).then((result) => { setProfile(result.profile); setVerification(result.verification); }).catch(() => undefined).finally(() => setLoading(false)); }, [wallet]);
  if (loading) return <Shell><p className="rounded-2xl bg-arc-bg p-4 text-sm font-semibold">Loading creator profile…</p></Shell>;
  if (!profile || !verification) return <Shell><section className="rounded-[2rem] border border-arc-line bg-white/80 p-8"><h1 className="text-3xl font-black">Creator profile unavailable</h1><p className="mt-3 text-sm text-arc-muted">No public Creator Passport is available for this wallet.</p></section></Shell>;
  return <Shell><div className="rounded-[2rem] border border-arc-line bg-white/80 p-6"><CreatorProfileHeader profile={profile} /><div className="mt-5"><CreatorVerificationBadges verification={verification} /></div><p className="mt-4 max-w-3xl whitespace-pre-wrap break-words text-sm leading-7 text-arc-muted">{profile.bio}</p><div className="mt-6 flex flex-wrap gap-2">{profile.roles.map((role) => <span key={role} className="rounded-full bg-arc-bg px-3 py-1 text-xs font-black">{role}</span>)}{profile.languages.map((language) => <span key={language} className="rounded-full border border-arc-line px-3 py-1 text-xs font-bold">{language}</span>)}</div><div className="mt-8 grid gap-6 lg:grid-cols-2"><section><h2 className="text-xl font-black">Social channels</h2><div className="mt-3"><CreatorSocialLinks links={profile.socialLinks} /></div></section><section><h2 className="text-xl font-black">Portfolio</h2><div className="mt-3"><CreatorPortfolio items={profile.portfolioItems} /></div></section></div><section className="mt-8 rounded-2xl bg-arc-bg p-4"><h2 className="text-xl font-black">Arc settlement history</h2><p className="mt-2 text-sm text-arc-muted">{verification.completedPayouts} completed payouts · {verification.distinctEscrows} distinct escrows · {verification.totalPaidUsdc} USDC paid</p></section><div className="mt-6 flex flex-wrap items-center gap-3"><span className="break-all text-sm font-bold text-arc-muted">Wallet: {short(profile.walletAddress)}</span><button type="button" onClick={() => void navigator.clipboard?.writeText(profile.walletAddress)} className="min-h-11 rounded-full border border-arc-line px-4 py-2 text-sm font-black">Copy wallet</button><a href={`https://testnet.arcscan.app/address/${profile.walletAddress}`} target="_blank" rel="noopener noreferrer" className="min-h-11 rounded-full border border-arc-line px-4 py-2 text-sm font-black">View on ArcScan ↗</a></div></div></Shell>;
}
