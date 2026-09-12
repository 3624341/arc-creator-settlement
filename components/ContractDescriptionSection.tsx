export function ContractDescriptionSection({ description }: { description?: string }) {
  return (
    <section aria-labelledby="opportunity-description-title" className="mt-4 rounded-3xl border border-arc-line bg-white p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-arc-muted">Opportunity details</p>
      <h2 id="opportunity-description-title" className="mt-1 text-xl font-black">About this opportunity</h2>
      {description ? (
        <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-arc-muted">{description}</p>
      ) : (
        <p className="mt-3 text-arc-muted">The advertiser has not added a public description yet.</p>
      )}
    </section>
  );
}
