import { Star } from "lucide-react";
import { EmptyState } from "@streamflare/ui/components/brand/empty-state";
import type { HistoryEntry } from "../../lib/history-data";

export function HistoryList({ items, emptyLabel }: { items: HistoryEntry[]; emptyLabel: string }) {
  if (items.length === 0) return <EmptyState title={emptyLabel} />;
  return (
    <ul className="space-y-3">
      {items.map((e, i) => (
        <li key={`${e.title}-${i}`} className="rounded-xl border border-hairline bg-surface-1 p-4">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-lg font-semibold text-text">{e.title}</h3>
            {e.rating != null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2 py-0.5 text-sm tabular-nums text-text">
                <Star className="size-3.5 fill-warning text-warning" aria-hidden />
                {e.rating.toFixed(1)}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
            <span>watched by · {e.profile}</span>
            {e.episode ? <span className="text-text">{e.episode}</span> : null}
            {e.watchedUpto ? <span className="tabular-nums">progress {e.watchedUpto}</span> : null}
            {e.time ? <span className="tabular-nums">{e.time}</span> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
