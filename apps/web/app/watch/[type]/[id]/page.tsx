"use client";

import * as React from "react";
import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { VideoPlayer } from "../../../../components/watch/video-player";
import { fetchMovie, fetchShow, fetchEpisodes } from "../../../../lib/title-data";
import { getProgress, saveProgress, nextEpisode, LOCAL_VIDEO } from "../../../../lib/watch-data";
import { posterUrl, type SlideItem } from "../../../../lib/browse-data";
import { useAuth } from "../../../../context/auth-context";

function WatchInner() {
  const params = useParams<{ type: string; id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const auth = useAuth();

  const type = params.type === "show" ? "show" : "movie";
  const id = Number(params.id);
  const season = Number(sp.get("s") ?? "1") || 1;
  const episode = Number(sp.get("e") ?? "1") || 1;

  const [src, setSrc] = React.useState<string | null>(null);
  const [poster, setPoster] = React.useState<string | undefined>(undefined);
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState<string | undefined>(undefined);
  const [startAt, setStartAt] = React.useState(0);
  const [next, setNext] = React.useState<{ season: number; episode: number } | null>(null);
  const [ready, setReady] = React.useState(false);

  const email = auth.email ?? "";
  const profile = auth.profile ?? "";
  const lastSaved = React.useRef(0);

  React.useEffect(() => {
    if (!Number.isFinite(id)) return;
    let cancelled = false;
    (async () => {
      const detail = type === "movie" ? await fetchMovie(id) : await fetchShow(id);
      if (cancelled) return;
      setTitle(detail.title);
      setPoster(posterUrl(detail.imageUrl));
      if (type === "show") {
        const seasons: SlideItem[] = email && profile ? await fetchEpisodes(id, email, profile) : [];
        const ep = seasons.flatMap((s) => s.data).find((e) => e.SEASON_NO === season && e.EPISODE_NO === episode);
        if (ep) {
          setSubtitle(`S${season} · E${episode}${ep.TITLE ? ` — ${ep.TITLE}` : ""}`);
        }
        setNext(nextEpisode(seasons, season, episode));
      }
      // Always stream the bundled local clip, regardless of the title's videoUrl.
      setSrc(LOCAL_VIDEO);
      if (email && profile) setStartAt(await getProgress({ type, id, season, episode, email, profile }));
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, [type, id, season, episode, email, profile]);

  function onProgress(seconds: number) {
    if (!email || !profile) return;
    if (seconds - lastSaved.current >= 10) {
      lastSaved.current = seconds;
      void saveProgress({ type, id, season, episode, email, profile, seconds });
    }
  }

  if (!Number.isFinite(id)) {
    return <main className="grid h-dvh place-items-center bg-canvas text-text-muted">Invalid title.</main>;
  }
  if (!ready || !src) {
    return <main className="grid h-dvh place-items-center bg-black text-white/60">Loading…</main>;
  }

  return (
    <VideoPlayer
      src={src}
      poster={poster}
      title={title}
      subtitle={subtitle}
      startAt={startAt}
      onProgress={onProgress}
      onBack={() => router.back()}
      nextLabel={next ? "Next episode" : undefined}
      onNext={next ? () => router.push(`/watch/show/${id}?s=${next.season}&e=${next.episode}`) : undefined}
      onEnded={next ? () => router.push(`/watch/show/${id}?s=${next.season}&e=${next.episode}`) : undefined}
    />
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<main className="grid h-dvh place-items-center bg-black text-white/60">Loading…</main>}>
      <WatchInner />
    </Suspense>
  );
}
