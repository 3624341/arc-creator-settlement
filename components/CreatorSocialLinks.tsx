import type { CreatorSocialLink } from "@/lib/creator-profile";

const labels: Record<CreatorSocialLink["platform"], string> = {
  telegram: "Telegram",
  x: "X",
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  github: "GitHub",
  website: "Website",
};

export function CreatorSocialLinks({ links }: { links: CreatorSocialLink[] }) {
  if (!links.length) return <p className="text-sm text-arc-muted">No public social channels added.</p>;
  return <div className="grid gap-3 sm:grid-cols-2">{links.map((link) => <a key={`${link.platform}-${link.url}`} href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 rounded-2xl border border-arc-line p-3 text-sm hover:border-arc-purple focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arc-purple"><span className="font-black">{labels[link.platform]}</span>{link.handle ? <span className="ml-2 break-all text-arc-muted">{link.handle}</span> : null}<span className="mt-1 block break-all text-xs text-arc-muted">{link.url} ↗</span>{link.followerCount !== undefined ? <span className="mt-1 block text-xs font-bold text-arc-muted">{link.followerCount.toLocaleString()} followers · Self-reported</span> : <span className="mt-1 block text-xs font-bold text-arc-muted">Self-reported</span>}</a>)}</div>;
}
