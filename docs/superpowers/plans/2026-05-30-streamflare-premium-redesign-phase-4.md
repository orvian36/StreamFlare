# StreamFlare Premium Redesign — Phase 4 (Watch Player) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/watch/[id]` stub with a cinematic custom `VideoPlayer` at `/watch/[type]/[id]` that resumes + saves progress and supports episode/next for shows, removing MUI from the watch route.

**Architecture:** `watch-data.ts` wraps progress get/set + next-episode + the sample fallback. `VideoPlayer` is a pure UI component (native `<video>` + custom controls + callbacks). The `/watch/[type]/[id]` page fetches sources/progress and wires the player. Play entry points (hero, title, episodes) route here.

**Tech Stack:** Next.js 14 App Router, Tailwind v4 + shadcn (slider), Vitest + Testing Library.

**Reference spec:** `docs/superpowers/specs/2026-05-30-streamflare-premium-redesign-phase-4-design.md`.

---

## Conventions

- Worktree root: `C:\Users\Best Laptop Gallery\Desktop\CodeDev\StreamFlare\.claude\worktrees\premium-redesign`.
- Web build: PowerShell `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`.
- Tests: `pnpm --filter @streamflare/web test -- <pattern>`. Typecheck: `pnpm --filter @streamflare/{ui,web} typecheck`.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Subpath imports for `@streamflare/ui`.

## File Structure

**Create:** `apps/web/lib/watch-data.ts`; `apps/web/components/watch/video-player.tsx`;
`apps/web/app/watch/[type]/[id]/page.tsx`; tests.
**Modify:** `apps/web/vitest.setup.ts` (HTMLMediaElement stubs); `apps/web/components/browse/browse-hero.tsx`;
`apps/web/components/title/title-detail.tsx`; `apps/web/components/title/episode-list.tsx` + its test;
`apps/web/__tests__/{browse-hero,title-detail}.test.tsx`.
**Delete:** `apps/web/app/watch/[id]/page.tsx`.

---

## Task 1: watch-data helpers

**Files:**
- Create: `apps/web/lib/watch-data.ts`
- Test: `apps/web/__tests__/watch-data.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
const get = vi.fn();
const post = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) } }));
import { getProgress, saveProgress, nextEpisode, SAMPLE_VIDEO } from "../lib/watch-data";

describe("watch-data", () => {
  beforeEach(() => { get.mockReset(); post.mockReset(); });

  it("getProgress reads WATCHED_UPTO for a movie", async () => {
    get.mockResolvedValue({ data: { WATCHED_UPTO: 42 } });
    const s = await getProgress({ type: "movie", id: 7, email: "a@b.com", profile: "Ada" });
    expect(get).toHaveBeenCalledWith("/api/profiles/time/get?profile_id=Ada&email=a%40b.com&movie_id=7");
    expect(s).toBe(42);
  });

  it("saveProgress posts a show body", async () => {
    post.mockResolvedValue({ status: 201 });
    await saveProgress({ type: "show", id: 9, season: 1, episode: 2, email: "a@b.com", profile: "Ada", seconds: 100 });
    expect(post).toHaveBeenCalledWith("/api/profiles/time/set", {
      show_id: 9, season_no: 1, episode_no: 2, profile_id: "Ada", email: "a@b.com", watched_upto: 100,
    });
  });

  it("nextEpisode returns the following episode", () => {
    const seasons = [
      { title: "Season 1", data: [
        { TITLE: "E1", IMAGE_URL: null, SEASON_NO: 1, EPISODE_NO: 1 },
        { TITLE: "E2", IMAGE_URL: null, SEASON_NO: 1, EPISODE_NO: 2 },
      ] },
    ];
    expect(nextEpisode(seasons, 1, 1)).toEqual({ season: 1, episode: 2 });
    expect(nextEpisode(seasons, 1, 2)).toBeNull();
  });

  it("exposes a sample video url", () => {
    expect(SAMPLE_VIDEO).toMatch(/^https?:\/\//);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- watch-data`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/lib/watch-data.ts`**

```ts
import { api } from "./api-client";
import type { SlideItem } from "./browse-data";

export const SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export interface ProgressRef {
  type: "movie" | "show";
  id: number;
  season?: number;
  episode?: number;
  email: string;
  profile: string;
}

function query(ref: ProgressRef): string {
  const p = new URLSearchParams({ profile_id: ref.profile, email: ref.email });
  if (ref.type === "movie") p.set("movie_id", String(ref.id));
  else { p.set("show_id", String(ref.id)); p.set("season_no", String(ref.season ?? 1)); p.set("episode_no", String(ref.episode ?? 1)); }
  return p.toString();
}

export async function getProgress(ref: ProgressRef): Promise<number> {
  try {
    const r = await api.get<{ WATCHED_UPTO?: number }>(`/api/profiles/time/get?${query(ref)}`, { validateStatus: () => true });
    return r.data?.WATCHED_UPTO ?? 0;
  } catch {
    return 0;
  }
}

export async function saveProgress(ref: ProgressRef & { seconds: number }): Promise<void> {
  const body: Record<string, unknown> = { profile_id: ref.profile, email: ref.email, watched_upto: Math.floor(ref.seconds) };
  if (ref.type === "movie") body.movie_id = ref.id;
  else { body.show_id = ref.id; body.season_no = ref.season ?? 1; body.episode_no = ref.episode ?? 1; }
  await api.post("/api/profiles/time/set", body, { validateStatus: () => true });
}

export function nextEpisode(
  seasons: SlideItem[],
  season: number,
  episode: number,
): { season: number; episode: number } | null {
  const flat = seasons
    .flatMap((s) => s.data)
    .filter((e) => e.SEASON_NO != null && e.EPISODE_NO != null)
    .sort((a, b) => (a.SEASON_NO! - b.SEASON_NO!) || (a.EPISODE_NO! - b.EPISODE_NO!));
  const idx = flat.findIndex((e) => e.SEASON_NO === season && e.EPISODE_NO === episode);
  const nxt = idx >= 0 ? flat[idx + 1] : undefined;
  return nxt ? { season: nxt.SEASON_NO!, episode: nxt.EPISODE_NO! } : null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- watch-data`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/watch-data.ts apps/web/__tests__/watch-data.test.ts
git commit -m "feat(web): add watch-data (progress get/set, next-episode, sample video)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: VideoPlayer + jsdom media stubs

**Files:**
- Modify: `apps/web/vitest.setup.ts`
- Create: `apps/web/components/watch/video-player.tsx`
- Test: `apps/web/__tests__/video-player.test.tsx`

- [ ] **Step 1: Add HTMLMediaElement stubs to `apps/web/vitest.setup.ts`** (append)

```ts
// jsdom does not implement media playback.
if (typeof window !== "undefined") {
  window.HTMLMediaElement.prototype.play = function play() { return Promise.resolve(); };
  window.HTMLMediaElement.prototype.pause = function pause() {};
  window.HTMLMediaElement.prototype.load = function load() {};
}
```

- [ ] **Step 2: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VideoPlayer } from "../components/watch/video-player";

describe("VideoPlayer", () => {
  it("renders the title and a back button, and toggles play", () => {
    const onBack = vi.fn();
    render(<VideoPlayer src="/x.mp4" poster="/p.jpg" title="Joker" onBack={onBack} />);
    expect(screen.getByText("Joker")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(onBack).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /^play$/i }));
    expect(screen.getByRole("button", { name: /^pause$/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- video-player`
Expected: FAIL — module not found.

- [ ] **Step 4: Create `apps/web/components/watch/video-player.tsx`**

```tsx
"use client";

import * as React from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, ChevronLeft } from "lucide-react";
import { Slider } from "@streamflare/ui/components/ui/slider";
import { cn } from "@streamflare/ui/lib/utils";

function fmt(t: number): string {
  if (!Number.isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
  subtitle?: string;
  startAt?: number;
  onProgress?: (seconds: number) => void;
  onEnded?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  onNext?: () => void;
}

export function VideoPlayer(props: VideoPlayerProps) {
  const { src, poster, title, subtitle, startAt = 0, onProgress, onEnded, onBack, nextLabel, onNext } = props;
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [visible, setVisible] = React.useState(true);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControls = React.useCallback(() => {
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { void v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
    showControls();
  }
  function skip(delta: number) {
    const v = videoRef.current;
    if (v) v.currentTime = Math.min(Math.max(0, v.currentTime + delta), duration || v.currentTime + delta);
    showControls();
  }
  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }
  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }
  function seekTo(pct: number) {
    const v = videoRef.current;
    if (v && duration) { v.currentTime = (pct / 100) * duration; setCurrent(v.currentTime); }
  }

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key.toLowerCase() === "k") { e.preventDefault(); togglePlay(); }
      else if (e.key === "ArrowRight") skip(10);
      else if (e.key === "ArrowLeft") skip(-10);
      else if (e.key.toLowerCase() === "f") toggleFullscreen();
      else if (e.key.toLowerCase() === "m") toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={showControls}
      className="relative h-dvh w-full overflow-hidden bg-black"
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        title={title}
        className="h-full w-full object-contain"
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          setDuration(v.duration);
          if (startAt > 0 && startAt < v.duration) v.currentTime = startAt;
        }}
        onTimeUpdate={(e) => { setCurrent(e.currentTarget.currentTime); onProgress?.(e.currentTarget.currentTime); }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); onEnded?.(); }}
        onClick={togglePlay}
      />

      {/* Top overlay */}
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-4 transition-opacity md:p-6", visible ? "opacity-100" : "opacity-0")}>
        <div className="pointer-events-auto flex items-center gap-3">
          <button type="button" aria-label="Back" onClick={onBack} className="grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <ChevronLeft className="size-5" />
          </button>
          <div>
            <p className="font-display text-lg font-semibold text-white">{title}</p>
            {subtitle ? <p className="text-sm text-white/70">{subtitle}</p> : null}
          </div>
        </div>
      </div>

      {/* Center play (when paused) */}
      {!playing ? (
        <button
          type="button"
          aria-label="Play"
          onClick={togglePlay}
          className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
        >
          <Play className="size-9" />
        </button>
      ) : null}

      {/* Control bar */}
      <div className={cn("absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity md:p-6", visible ? "opacity-100" : "opacity-0")}>
        <div className="flex items-center gap-3 text-xs text-white/80">
          <span className="font-mono tabular-nums">{fmt(current)}</span>
          <Slider
            value={[pct]}
            max={100}
            step={0.1}
            onValueChange={(v) => seekTo(v[0] ?? 0)}
            aria-label="Seek"
            className="flex-1"
          />
          <span className="font-mono tabular-nums">{fmt(duration)}</span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={togglePlay} className="grid size-10 place-items-center rounded-full hover:bg-white/10">
            {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </button>
          <button type="button" aria-label="Back 10 seconds" onClick={() => skip(-10)} className="grid size-10 place-items-center rounded-full hover:bg-white/10"><RotateCcw className="size-5" /></button>
          <button type="button" aria-label="Forward 10 seconds" onClick={() => skip(10)} className="grid size-10 place-items-center rounded-full hover:bg-white/10"><RotateCw className="size-5" /></button>
          <button type="button" aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute} className="grid size-10 place-items-center rounded-full hover:bg-white/10">
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <div className="ml-auto flex items-center gap-2">
            {nextLabel && onNext ? (
              <button type="button" onClick={onNext} className="rounded-md px-3 py-1.5 text-sm hover:bg-white/10">{nextLabel}</button>
            ) : null}
            <button type="button" aria-label="Fullscreen" onClick={toggleFullscreen} className="grid size-10 place-items-center rounded-full hover:bg-white/10"><Maximize className="size-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- video-player`
Expected: PASS. (The control-bar Play button shares the `Play`/`Pause` aria-label; the test asserts a `Pause`-labelled button exists after toggling — both the center overlay disappears and the bar button flips, so a `Pause` button is present.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/watch/video-player.tsx apps/web/__tests__/video-player.test.tsx apps/web/vitest.setup.ts
git commit -m "feat(web): add custom VideoPlayer (controls, keyboard, overlays)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `/watch/[type]/[id]` page

**Files:**
- Create: `apps/web/app/watch/[type]/[id]/page.tsx`
- Delete: `apps/web/app/watch/[id]/page.tsx`
- Test: `apps/web/__tests__/watch-page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const push = vi.fn();
const back = vi.fn();
let params: Record<string, string> = { type: "movie", id: "7" };
let sp = new URLSearchParams("");
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back }),
  useParams: () => params,
  useSearchParams: () => sp,
}));
vi.mock("../context/auth-context", () => ({ useAuth: () => ({ email: "a@b.com", profile: "Ada" }) }));
vi.mock("../lib/title-data", () => ({
  fetchMovie: vi.fn(async () => ({ id: 7, type: "movie", title: "Joker", imageUrl: "/j", videoUrl: "/v.mp4" })),
  fetchShow: vi.fn(async () => ({ id: 9, type: "show", title: "Show", imageUrl: "/s", videoUrl: null })),
  fetchEpisodes: vi.fn(async () => []),
}));
const getProgress = vi.fn(async () => 0);
const saveProgress = vi.fn(async () => {});
vi.mock("../lib/watch-data", async () => {
  const actual = await vi.importActual<typeof import("../lib/watch-data")>("../lib/watch-data");
  return { ...actual, getProgress: (...a: unknown[]) => getProgress(...a), saveProgress: (...a: unknown[]) => saveProgress(...a) };
});
vi.mock("../lib/api-client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

import WatchPage from "../app/watch/[type]/[id]/page";

describe("watch page", () => {
  beforeEach(() => { push.mockClear(); back.mockClear(); params = { type: "movie", id: "7" }; sp = new URLSearchParams(""); getProgress.mockClear(); });

  it("loads the movie and renders the player with its title", async () => {
    render(<WatchPage />);
    expect(await screen.findByText("Joker")).toBeInTheDocument();
    expect(getProgress).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- watch-page`
Expected: FAIL — the new route module does not exist yet.

- [ ] **Step 3: Create `apps/web/app/watch/[type]/[id]/page.tsx`**

```tsx
"use client";

import * as React from "react";
import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { VideoPlayer } from "../../../../components/watch/video-player";
import { fetchMovie, fetchShow, fetchEpisodes } from "../../../../lib/title-data";
import { getProgress, saveProgress, nextEpisode, SAMPLE_VIDEO } from "../../../../lib/watch-data";
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
      let video = detail.videoUrl;
      if (type === "show") {
        const seasons: SlideItem[] = email && profile ? await fetchEpisodes(id, email, profile) : [];
        const ep = seasons.flatMap((s) => s.data).find((e) => e.SEASON_NO === season && e.EPISODE_NO === episode);
        if (ep) { video = (ep as { VIDEO_URL?: string }).VIDEO_URL ?? video; setSubtitle(`S${season} · E${episode}${ep.TITLE ? ` — ${ep.TITLE}` : ""}`); }
        setNext(nextEpisode(seasons, season, episode));
      }
      setSrc(video ?? SAMPLE_VIDEO);
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
```

- [ ] **Step 4: Delete the old route**

```bash
git rm apps/web/app/watch/[id]/page.tsx
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- watch-page`
Expected: PASS.

- [ ] **Step 6: Typecheck + commit**

Run: `pnpm --filter @streamflare/web typecheck` → PASS.

```bash
git add "apps/web/app/watch"
git commit -m "feat(web): rebuild watch as /watch/[type]/[id] with resume + next episode

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Re-point Play entry points

**Files:**
- Modify: `apps/web/components/browse/browse-hero.tsx`
- Modify: `apps/web/components/title/title-detail.tsx`
- Modify: `apps/web/components/title/episode-list.tsx`
- Modify: `apps/web/__tests__/browse-hero.test.tsx`, `apps/web/__tests__/title-detail.test.tsx`, `apps/web/__tests__/title-pieces.test.tsx`

- [ ] **Step 1: BrowseHero Play → typed watch route**

In `browse-hero.tsx`, change the Play link to `/watch/${itemType(item)}/${id ?? ""}` (it already imports `itemType`). Update `browse-hero.test.tsx` Play assertion to `"/watch/movie/9"`.

- [ ] **Step 2: TitleDetail Play → typed watch route**

In `title-detail.tsx`, change `<Link href={`/watch/${id}`}>` (Play) to `<Link href={`/watch/${type}/${id}`}>`. Pass `showId` to `EpisodeList`: `<EpisodeList seasons={episodes} showId={id} />`. Update `title-detail.test.tsx` Play assertion to `"/watch/movie/7"`.

- [ ] **Step 3: EpisodeList episodes become Play links**

In `episode-list.tsx`, add a `showId: number` prop and wrap each episode row in a Next `Link` to `/watch/show/${showId}?s=${ep.SEASON_NO}&e=${ep.EPISODE_NO}`:

```tsx
import Link from "next/link";
// signature:
export function EpisodeList({ seasons, showId }: { seasons: SlideItem[]; showId: number }) {
```

Wrap the `<li>` content in:

```tsx
            <Link href={`/watch/show/${showId}?s=${ep.SEASON_NO}&e=${ep.EPISODE_NO}`} className="flex flex-1 gap-4">
              {/* existing thumbnail + text */}
            </Link>
```

Update `title-pieces.test.tsx`: pass `showId={9}` to `EpisodeList`, and assert an episode links correctly, e.g. after rendering, `expect(screen.getAllByRole("link")[0]).toHaveAttribute("href", "/watch/show/9?s=1&e=1")` (keep the existing season-switch assertion).

- [ ] **Step 4: Run the affected tests**

Run: `pnpm --filter @streamflare/web test -- browse-hero title-detail title-pieces`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/browse/browse-hero.tsx apps/web/components/title/title-detail.tsx apps/web/components/title/episode-list.tsx apps/web/__tests__/browse-hero.test.tsx apps/web/__tests__/title-detail.test.tsx apps/web/__tests__/title-pieces.test.tsx
git commit -m "feat(web): route Play + episodes to /watch/[type]/[id]

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Phase 4 green-gate sweep

**Files:** none (verification + fixes)

- [ ] **Step 1: Typecheck both packages**

Run: `pnpm --filter @streamflare/ui typecheck` and `pnpm --filter @streamflare/web typecheck` → PASS.

- [ ] **Step 2: Full web test suite**

Run: `pnpm --filter @streamflare/web test`
Expected: all pass (adds watch-data, video-player, watch-page; browse-hero/title-detail/title-pieces updated).

- [ ] **Step 3: Production build, all routes**

Run (PowerShell): `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: success; `/watch/[type]/[id]` builds (dynamic); old `/watch/[id]` gone.

- [ ] **Step 4: Confirm MUI no longer imported by the watch route**

Run: `pnpm dlx rg -n "@mui/material" apps/web/app/watch apps/web/components/watch`
Expected: no matches.

- [ ] **Step 5: No hardcoded hex in new components**

Run: `pnpm dlx rg -n "#[0-9a-fA-F]{3,6}" apps/web/components/watch`
Expected: no matches (the player uses `bg-black` and `white/N` keyword utilities over video, intentional and acceptable like other media surfaces).

- [ ] **Step 6: Final commit (if fixes were needed)**

```bash
git add -A
git commit -m "chore: Phase 4 green-gate fixes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage:** watch-data (progress get/set, next-episode, sample) → Task 1. VideoPlayer
(controls, keyboard, overlays, callbacks) → Task 2. `/watch/[type]/[id]` (resume, throttled save,
shows episode + next, delete old route) → Task 3. Re-point hero/title/episodes → Task 4. a11y
(labelled controls, Slider, keyboard) in Task 2. Sweep + MUI-removal check → Task 5. ✓ Contracts:
`time/get` returns `WATCHED_UPTO` (Task 1), `time/set` body movie vs show (Task 1), title/episodes
reused (Task 3).

**2. Placeholder scan:** none; complete code + real tests/mocks. The control-bar/center Play sharing
a label is noted, not a gap.

**3. Type/name consistency:** `ProgressRef`/`getProgress`/`saveProgress`/`nextEpisode`/`SAMPLE_VIDEO`
(Task 1) used in Task 3; `VideoPlayerProps` (`src`/`poster`/`title`/`subtitle`/`startAt`/`onProgress`/
`onEnded`/`onBack`/`nextLabel`/`onNext`, Task 2) match Task 3 usage; `EpisodeList` gains `showId`
(Task 4) matching the title-detail call; `fetchMovie`/`fetchShow`/`fetchEpisodes` reused;
`/watch/<type>/<id>` link shape consistent across hero/title/episodes/next.

**Known interim:** `/profile` and `/history/movies|shows` remain MUI/legacy (out of scope; a later
cleanup). After Phase 4, the only remaining program item is the admin & analytics dashboard feature.
