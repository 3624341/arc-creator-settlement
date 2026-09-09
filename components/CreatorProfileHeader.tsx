import type { CreatorProfile } from "@/lib/creator-profile";

export function CreatorProfileHeader({ profile }: { profile: CreatorProfile }) {
  return <div className="flex min-w-0 items-start gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-arc-ink text-xl font-black text-arc-lime">{profile.avatarUrl ? <img src={profile.avatarUrl} alt={`${profile.displayName} avatar`} className="h-full w-full object-cover" /> : profile.displayName.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><h1 className="break-words text-3xl font-black tracking-tight">{profile.displayName}</h1>{profile.headline ? <p className="mt-1 break-words text-arc-muted">{profile.headline}</p> : null}<p className="mt-2 break-all text-xs font-bold text-arc-muted">{profile.walletAddress}</p></div></div>;
}
