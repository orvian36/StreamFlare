"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@streamflare/ui/lib/utils";
import { posterUrl, type SlideItem } from "../../lib/browse-data";

export function EpisodeList({ seasons, showId }: { seasons: SlideItem[]; showId: number }) {
  const [active, setActive] = React.useState(0);
  if (seasons.length === 0) return null;
  const current = seasons[active] ?? seasons[0]!;
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-semibold text-text">Episodes</h2>
        <div className="flex flex-wrap gap-1">
          {seasons.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setActive(i)}
              aria-current={i === active ? "true" : undefined}
              className={cn("rounded-md px-3 py-1.5 text-sm", i === active ? "bg-surface-3 text-text" : "text-text-muted hover:text-text")}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>
      <ul className="space-y-3">
        {current.data.map((ep, i) => (
          <li key={`${ep.SEASON_NO}-${ep.EPISODE_NO}-${i}`} className="overflow-hidden rounded-lg border border-hairline bg-surface-1">
            <Link
              href={`/watch/show/${showId}?s=${ep.SEASON_NO}&e=${ep.EPISODE_NO}`}
              className="flex gap-4 p-3 transition-colors hover:bg-surface-2"
            >
              <div className="aspect-video w-40 shrink-0 overflow-hidden rounded-md bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={posterUrl(ep.IMAGE_URL)} alt={ep.TITLE} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-text">
                  {ep.EPISODE_NO ? `${ep.EPISODE_NO}. ` : ""}{ep.TITLE}
                </p>
                {ep.DESCRIPTION ? <p className="line-clamp-2 text-sm text-text-muted">{ep.DESCRIPTION}</p> : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
