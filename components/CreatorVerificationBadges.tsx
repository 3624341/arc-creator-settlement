import type { CreatorVerification } from "@/lib/creator-profile";

export function CreatorVerificationBadges({ verification }: { verification: CreatorVerification }) {
  return <div className="flex flex-wrap gap-2" aria-label="Profile verification">
    {verification.walletSigned ? <span className="rounded-full bg-arc-lime px-3 py-1 text-xs font-black text-arc-ink">Wallet Signed</span> : null}
    {verification.arcSettlementVerified ? <span className="rounded-full bg-arc-purple px-3 py-1 text-xs font-black text-white">Arc Settlement Verified</span> : null}
  </div>;
}
