"use client";

import * as React from "react";
import Link from "next/link";
import { Play, Plus, Check } from "lucide-react";
import { HeroBackdrop } from "@streamflare/ui/components/brand/hero-backdrop";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { Rating } from "@streamflare/ui/components/brand/rating";
import { MaturityBadge } from "@streamflare/ui/components/brand/maturity-badge";
import { GenreChip } from "@streamflare/ui/components/brand/genre-chip";
import { ContentRow } from "@streamflare/ui/components/brand/content-row";
import { CastList } from "./cast-list";
import { EpisodeList } from "./episode-list";
import { RateControl } from "./rate-control";
import { BrowseCard } from "../browse/browse-card";
import { AppShell } from "../app/app-shell";
import {
  fetchTitle, fetchCast, fetchGenres, fetchSimilar, fetchEpisodes, getRating, setRating,
  type TitleType, type TitleDetailData,
} from "../../lib/title-data";
import { addToWatchList, removeFromWatchList, posterUrl, type BrowseItem, type SlideItem } from "../../lib/browse-data";
import { useAuth } from "../../context/auth-context";

export function TitleDetail({ type, id }: { type: TitleType; id: number }) {
  const auth = useAuth();
  const [detail, setDetail] = React.useState<TitleDetailData | null>(null);
  const [cast, setCast] = React.useState<{ TITLE: string; NAME: string | null }[]>([]);
  const [genres, setGenres] = React.useState<{ NAME: string | null }[]>([]);
  const [similar, setSimilar] = React.useState<BrowseItem[]>([]);
  const [episodes, setEpisodes] = React.useState<SlideItem[]>([]);
  const [rating, setRatingState] = React.useState<number | null>(null);
  const [inList, setInList] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  const email = auth.email ?? "";
  const profile = auth.profile ?? "";

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true); setNotFound(false);
    (async () => {
      try {
        const d = await fetchTitle(type, id);
        if (cancelled) return;
        setDetail(d);
        const [c, g, s, r] = await Promise.all([
          fetchCast(type, id), fetchGenres(type, id), fetchSimilar(type, id),
          email && profile ? getRating(type, id, email, profile) : Promise.resolve(null),
        ]);
        const eps = type === "show" && email && profile ? await fetchEpisodes(id, email, profile) : [];
        if (cancelled) return;
        setCast(c); setGenres(g); setSimilar(s); setRatingState(r); setEpisodes(eps);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [type, id, email, profile]);

  async function toggleList() {
    if (!detail || !email || !profile) return;
    const item: BrowseItem = type === "movie"
      ? { MOVIE_ID: id, TITLE: detail.title, IMAGE_URL: detail.imageUrl }
      : { SHOW_ID: id, TITLE: detail.title, IMAGE_URL: detail.imageUrl };
    if (inList) { await removeFromWatchList(email, profile, item); setInList(false); }
    else { await addToWatchList(email, profile, item); setInList(true); }
  }

  async function rate(n: number) {
    setRatingState(n);
    if (email && profile) await setRating(type, id, email, profile, n);
  }

  if (loading) {
    return <AppShell><div className="h-[60vh] animate-pulse rounded-2xl bg-surface-2" /></AppShell>;
  }
  if (notFound || !detail) {
    return (
      <AppShell>
        <div className="grid min-h-[40vh] place-items-center text-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-text">Title not found</h1>
            <p className="mt-2 text-text-muted">This title may have been removed.</p>
            <Link href="/browse" className="mt-4 inline-block text-brand hover:underline">Back to browse</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-12">
        <HeroBackdrop imageUrl={posterUrl(detail.imageUrl)} className="rounded-2xl">
          <div className="flex min-h-[52vh] max-w-2xl flex-col justify-end gap-4 p-8 md:p-12">
            <h1 className="font-display text-4xl font-bold tracking-tight text-text md:text-6xl">{detail.title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              {detail.rating != null ? <Rating value={detail.rating} /> : null}
              {detail.maturity ? <MaturityBadge rating={detail.maturity} /> : null}
              {detail.yearLabel ? <span className="font-mono text-xs text-text-subtle">{detail.yearLabel}</span> : null}
              {detail.metaExtra ? <span className="font-mono text-xs text-text-subtle">{detail.metaExtra}</span> : null}
            </div>
            {genres.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {genres.filter((g) => g.NAME).map((g, i) => <GenreChip key={`${g.NAME}-${i}`}>{g.NAME}</GenreChip>)}
              </div>
            ) : null}
            {detail.description ? <p className="line-clamp-3 max-w-xl text-text-muted">{detail.description}</p> : null}
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/watch/${id}`}><GlowButton size="lg"><Play className="size-5" /> Play</GlowButton></Link>
              <GlowButton variant="glass" size="lg" onClick={toggleList}>
                {inList ? <Check className="size-5" /> : <Plus className="size-5" />} My List
              </GlowButton>
              <RateControl value={rating} onRate={rate} />
            </div>
          </div>
        </HeroBackdrop>

        <CastList cast={cast} />

        {type === "show" && episodes.length > 0 ? <EpisodeList seasons={episodes} /> : null}

        {similar.length > 0 ? (
          <ContentRow title="More like this">
            {similar.map((it) => (
              <BrowseCard key={`${it.MOVIE_ID ?? it.SHOW_ID}-${it.TITLE}`} item={it} email={email} profileId={profile} />
            ))}
          </ContentRow>
        ) : null}
      </div>
    </AppShell>
  );
}
