import type { CreatorPortfolioItem } from "@/lib/creator-profile";

export function CreatorPortfolio({ items }: { items: CreatorPortfolioItem[] }) {
  if (!items.length) return <p className="text-sm text-arc-muted">No portfolio items added.</p>;
  return <div className="grid gap-3 md:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-2xl border border-arc-line p-4"><p className="font-black">{item.title}</p>{item.description ? <p className="mt-2 break-words text-sm text-arc-muted">{item.description}</p> : null}<a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block break-all text-sm font-bold text-arc-purple hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arc-purple">Open work ↗</a></article>)}</div>;
}
