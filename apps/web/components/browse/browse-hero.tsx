"use client";

import Link from "next/link";
import { Play, Info } from "lucide-react";
import { HeroBackdrop } from "@streamflare/ui/components/brand/hero-backdrop";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { Rating } from "@streamflare/ui/components/brand/rating";
import { FadeIn } from "@streamflare/ui/motion";
import { posterUrl, itemId, type BrowseItem } from "../../lib/browse-data";

export function BrowseHero({ item }: { item: BrowseItem }) {
  const id = itemId(item);
  return (
    <HeroBackdrop imageUrl={posterUrl(item.IMAGE_URL)} className="rounded-2xl">
      <div className="flex min-h-[56vh] max-w-2xl flex-col justify-end gap-4 p-8 md:p-12">
        <FadeIn className="space-y-4">
          <h1 className="font-display text-4xl font-bold tracking-tight text-text md:text-6xl">{item.TITLE}</h1>
          <div className="flex items-center gap-3">
            {item.RATING != null ? <Rating value={item.RATING} /> : null}
            {item.RELEASE_DATE ? <span className="font-mono text-xs text-text-subtle">{item.RELEASE_DATE}</span> : null}
          </div>
          {item.DESCRIPTION ? <p className="line-clamp-3 max-w-xl text-text-muted">{item.DESCRIPTION}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Link href={`/watch/${id ?? ""}`}><GlowButton size="lg"><Play className="size-5" /> Play</GlowButton></Link>
            <Link href={`/watch/${id ?? ""}`}><GlowButton variant="glass" size="lg"><Info className="size-5" /> More info</GlowButton></Link>
          </div>
        </FadeIn>
      </div>
    </HeroBackdrop>
  );
}
