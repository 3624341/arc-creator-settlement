export function StatCard({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="rounded-[2rem] border border-arc-line bg-white/70 p-6 shadow-sm">
      <p className="text-sm font-semibold text-arc-muted">{label}</p>
      <p className="mt-2 text-4xl font-black tracking-tight">{value}</p>
      {caption ? <p className="mt-2 text-sm text-arc-muted">{caption}</p> : null}
    </div>
  );
}
