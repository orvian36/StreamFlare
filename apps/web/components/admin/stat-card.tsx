export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-1 p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-text-subtle">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-text">{value}</p>
    </div>
  );
}
