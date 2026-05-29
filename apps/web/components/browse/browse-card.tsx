"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { PosterCard } from "@streamflare/ui/components/brand/poster-card";
import { addToWatchList, removeFromWatchList, posterUrl, itemId, type BrowseItem } from "../../lib/browse-data";

export interface BrowseCardProps {
  item: BrowseItem;
  email: string;
  profileId: string;
  inList?: boolean;
}

export function BrowseCard({ item, email, profileId, inList = false }: BrowseCardProps) {
  const [added, setAdded] = React.useState(inList);
  const [busy, setBusy] = React.useState(false);
  const id = itemId(item);
  const subtitle =
    [item.RELEASE_DATE, item.SEASON_NO && item.EPISODE_NO ? `S${item.SEASON_NO}·E${item.EPISODE_NO}` : null]
      .filter(Boolean)
      .join(" · ") || undefined;

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      if (added) { await removeFromWatchList(email, profileId, item); setAdded(false); }
      else { await addToWatchList(email, profileId, item); setAdded(true); }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <Link href={`/watch/${id ?? ""}`} aria-label={item.TITLE}>
        <PosterCard title={item.TITLE} subtitle={subtitle} imageUrl={posterUrl(item.IMAGE_URL)} />
      </Link>
      <button
        type="button"
        onClick={toggle}
        aria-label={`${added ? "Remove" : "Add"} ${item.TITLE} ${added ? "from" : "to"} My List`}
        className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
      >
        {added ? <Check className="size-4" /> : <Plus className="size-4" />}
      </button>
    </div>
  );
}
