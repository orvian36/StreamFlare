# StreamFlare Premium Redesign — Phase 3B (Title Detail Pages) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/title/[type]/[id]` detail pages (hero, synopsis, cast, genres, More Like This, episodes, Play/add-to-list/rate) composing existing endpoints + two new single-title endpoints, and re-point browse to detail.

**Architecture:** Backend adds `getMovie`/`getShow` to the browse controller/routes. Frontend `title-data.ts` wraps the fetches; `TitleDetail` (+ `CastList`, `EpisodeList`, `RateControl`) renders them; the `/title/[type]/[id]` page is a thin parser. `BrowseCard`/`BrowseHero` re-point to `/title`.

**Tech Stack:** Express + Prisma (api), Next.js 14 App Router, Tailwind v4 + shadcn, Vitest (web + api).

**Reference spec:** `docs/superpowers/specs/2026-05-30-streamflare-premium-redesign-phase-3b-design.md`.

---

## Conventions

- Worktree root: `C:\Users\Best Laptop Gallery\Desktop\CodeDev\StreamFlare\.claude\worktrees\premium-redesign`.
- Web build: PowerShell `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`.
- Web tests: `pnpm --filter @streamflare/web test -- <pattern>`. API tests: `pnpm --filter @streamflare/api test`.
- Typecheck: `pnpm --filter @streamflare/{ui,web,api} typecheck`.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Web subpath imports for `@streamflare/ui`.

## File Structure

**Create:** `apps/web/lib/title-data.ts`; `apps/web/components/title/{rate-control,cast-list,episode-list,title-detail}.tsx`; `apps/web/app/title/[type]/[id]/page.tsx`; tests.
**Modify:** `apps/api/src/controllers/browse.controller.ts` (+`getMovie`/`getShow`), `apps/api/src/routes/browse.routes.ts`, `apps/api/tests/smoke.test.ts`; `apps/web/lib/browse-data.ts` (+`itemType`); `apps/web/components/browse/browse-card.tsx` + its test; `apps/web/components/browse/browse-hero.tsx`.

---

## Task 1: Backend single-title endpoints

**Files:**
- Modify: `apps/api/src/controllers/browse.controller.ts`
- Modify: `apps/api/src/routes/browse.routes.ts`
- Modify: `apps/api/tests/smoke.test.ts`

- [ ] **Step 1: Add the failing api test (in the `browse` describe block of `smoke.test.ts`)**

```ts
  it("GET /api/browse/movie/:id returns 404 for an unknown id", async () => {
    const res = await request(app).get("/api/browse/movie/999999");
    expect(res.status).toBe(404);
  });

  it("GET /api/browse/show/:id returns 404 for an unknown id", async () => {
    const res = await request(app).get("/api/browse/show/999999");
    expect(res.status).toBe(404);
  });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/api test`
Expected: FAIL — those routes 404 via the catch-all `notFound` (message differs) or return 200; assert the new handler shape. (If the routes don't exist yet, supertest gets the `notFound` JSON with 404 — to make the test meaningful, Step 3 adds real handlers returning a `{ message }` 404 for missing rows; the assertion on `status === 404` then passes through the real handler.)

- [ ] **Step 3: Append `getMovie` and `getShow` to `apps/api/src/controllers/browse.controller.ts`**

(`asInt` and `yearOf` already exist at the top of the file; reuse them.)

```ts
// ────────────────────────────────────────────────────────────────────────────
// getMovie / getShow — single title core fields for the detail page
// ────────────────────────────────────────────────────────────────────────────
export async function getMovie(req: Request, res: Response, _next: NextFunction) {
  const id = asInt(req.params.id);
  if (id == null) return res.status(400).json({ message: "Invalid movie id" });
  try {
    const m = await prisma.movie.findUnique({ where: { movieId: id } });
    if (!m) return res.status(404).json({ message: "Movie not found" });
    res.status(200).json({
      MOVIE_ID: m.movieId,
      TITLE: m.title,
      DESCRIPTION: m.description,
      RATING: m.rating,
      RELEASE_DATE: yearOf(m.releaseDate),
      MATURITY_RATING: m.maturityRating,
      LENGTH: m.length,
      LANGUAGE: m.language,
      IMAGE_URL: m.imageUrl,
      VIDEO_URL: m.videoUrl,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Failed to fetch movie" });
  }
}

export async function getShow(req: Request, res: Response, _next: NextFunction) {
  const id = asInt(req.params.id);
  if (id == null) return res.status(400).json({ message: "Invalid show id" });
  try {
    const s = await prisma.show.findUnique({ where: { showId: id } });
    if (!s) return res.status(404).json({ message: "Show not found" });
    res.status(200).json({
      SHOW_ID: s.showId,
      TITLE: s.title,
      DESCRIPTION: s.description,
      RATING: s.rating,
      START_YEAR: yearOf(s.startDate),
      END_YEAR: yearOf(s.endDate),
      MATURITY_RATING: s.maturityRating,
      SEASONS: s.seasons,
      EPISODES: s.episodes,
      LANGUAGE: s.language,
      IMAGE_URL: s.imageUrl,
      VIDEO_URL: s.videoUrl,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Failed to fetch show" });
  }
}
```

- [ ] **Step 4: Register the routes in `apps/api/src/routes/browse.routes.ts`**

Add after the existing routes (so the literal `/show/episodes` keeps priority over `/show/:id`):

```ts
router.get("/movie/:id", ctrl.getMovie);
router.get("/show/:id", ctrl.getShow);
```

- [ ] **Step 5: Run the api test + typecheck**

Run: `pnpm --filter @streamflare/api test` → the two new cases PASS (real handler returns 404).
Run: `pnpm --filter @streamflare/api typecheck` → PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/controllers/browse.controller.ts apps/api/src/routes/browse.routes.ts apps/api/tests/smoke.test.ts
git commit -m "feat(api): add GET /api/browse/movie/:id and /show/:id single-title endpoints

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: title-data helpers + itemType

**Files:**
- Create: `apps/web/lib/title-data.ts`
- Modify: `apps/web/lib/browse-data.ts` (add `itemType`)
- Test: `apps/web/__tests__/title-data.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
const get = vi.fn();
const post = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) } }));
import { fetchCast, fetchSimilar, setRating } from "../lib/title-data";
import { itemType } from "../lib/browse-data";

describe("title-data", () => {
  beforeEach(() => { get.mockReset(); post.mockReset(); });

  it("itemType distinguishes movie vs show", () => {
    expect(itemType({ MOVIE_ID: 1, TITLE: "a", IMAGE_URL: null })).toBe("movie");
    expect(itemType({ SHOW_ID: 1, TITLE: "a", IMAGE_URL: null })).toBe("show");
  });

  it("fetchCast queries by movie_id", async () => {
    get.mockResolvedValue({ data: [{ TITLE: "x", NAME: "Actor" }] });
    const cast = await fetchCast("movie", 7);
    expect(get).toHaveBeenCalledWith("/api/browse/celeb?movie_id=7");
    expect(cast[0]!.NAME).toBe("Actor");
  });

  it("fetchSimilar queries by show_id", async () => {
    get.mockResolvedValue({ data: [] });
    await fetchSimilar("show", 9);
    expect(get).toHaveBeenCalledWith("/api/browse/similar?show_id=9");
  });

  it("setRating posts to rating/add", async () => {
    post.mockResolvedValue({ status: 201 });
    await setRating("movie", 7, "a@b.com", "Ada", 4);
    expect(post).toHaveBeenCalledWith("/api/profiles/rating/add", { EMAIL: "a@b.com", PROFILE_ID: "Ada", MOVIE_ID: 7, RATING: 4 });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- title-data`
Expected: FAIL — modules/exports missing.

- [ ] **Step 3: Add `itemType` to `apps/web/lib/browse-data.ts`**

```ts
export const itemType = (it: BrowseItem): "movie" | "show" => (it.MOVIE_ID != null ? "movie" : "show");
```

- [ ] **Step 4: Create `apps/web/lib/title-data.ts`**

```ts
import { api } from "./api-client";
import type { BrowseItem, SlideItem } from "./browse-data";

export type TitleType = "movie" | "show";

export interface TitleDetailData {
  id: number;
  type: TitleType;
  title: string;
  description: string | null;
  rating: number | null;
  yearLabel: string | null;
  maturity: string | null;
  metaExtra: string | null; // runtime (movie) or "N seasons" (show)
  imageUrl: string | null;
  videoUrl: string | null;
}

const idParam = (type: TitleType, id: number) => (type === "movie" ? `movie_id=${id}` : `show_id=${id}`);

export async function fetchMovie(id: number): Promise<TitleDetailData> {
  const r = await api.get<Record<string, unknown>>(`/api/browse/movie/${id}`);
  const d = r.data;
  return {
    id, type: "movie",
    title: String(d.TITLE ?? ""),
    description: (d.DESCRIPTION as string) ?? null,
    rating: (d.RATING as number) ?? null,
    yearLabel: d.RELEASE_DATE != null ? String(d.RELEASE_DATE) : null,
    maturity: (d.MATURITY_RATING as string) ?? null,
    metaExtra: d.LENGTH ? `${Math.round(Number(d.LENGTH))} min` : null,
    imageUrl: (d.IMAGE_URL as string) ?? null,
    videoUrl: (d.VIDEO_URL as string) ?? null,
  };
}

export async function fetchShow(id: number): Promise<TitleDetailData> {
  const r = await api.get<Record<string, unknown>>(`/api/browse/show/${id}`);
  const d = r.data;
  const start = d.START_YEAR != null ? String(d.START_YEAR) : null;
  const end = d.END_YEAR != null ? String(d.END_YEAR) : null;
  return {
    id, type: "show",
    title: String(d.TITLE ?? ""),
    description: (d.DESCRIPTION as string) ?? null,
    rating: (d.RATING as number) ?? null,
    yearLabel: start ? (end ? `${start} - ${end}` : start) : null,
    maturity: (d.MATURITY_RATING as string) ?? null,
    metaExtra: d.SEASONS ? `${d.SEASONS} season${Number(d.SEASONS) === 1 ? "" : "s"}` : null,
    imageUrl: (d.IMAGE_URL as string) ?? null,
    videoUrl: (d.VIDEO_URL as string) ?? null,
  };
}

export const fetchTitle = (type: TitleType, id: number) => (type === "movie" ? fetchMovie(id) : fetchShow(id));

export async function fetchCast(type: TitleType, id: number): Promise<{ TITLE: string; NAME: string | null }[]> {
  const r = await api.get<{ TITLE: string; NAME: string | null }[]>(`/api/browse/celeb?${idParam(type, id)}`);
  return r.data ?? [];
}

export async function fetchGenres(type: TitleType, id: number): Promise<{ NAME: string | null }[]> {
  const r = await api.get<{ NAME: string | null }[]>(`/api/browse/genre?${idParam(type, id)}`);
  return r.data ?? [];
}

export async function fetchSimilar(type: TitleType, id: number): Promise<BrowseItem[]> {
  const r = await api.get<BrowseItem[]>(`/api/browse/similar?${idParam(type, id)}`);
  return r.data ?? [];
}

export async function fetchEpisodes(showId: number, email: string, profileId: string): Promise<SlideItem[]> {
  const r = await api.get<SlideItem[]>(
    `/api/browse/show/episodes?show_id=${showId}&email=${encodeURIComponent(email)}&profile_id=${encodeURIComponent(profileId)}`,
  );
  return r.data ?? [];
}

export async function getRating(type: TitleType, id: number, email: string, profileId: string): Promise<number | null> {
  const body: Record<string, unknown> = { EMAIL: email, PROFILE_ID: profileId };
  body[type === "movie" ? "MOVIE_ID" : "SHOW_ID"] = id;
  const r = await api.post<{ RATING?: number } | { rating?: { RATING?: number } }>("/api/profiles/rating/find", body, {
    validateStatus: () => true,
  });
  const data = r.data as { RATING?: number; rating?: { RATING?: number } };
  return data?.RATING ?? data?.rating?.RATING ?? null;
}

export async function setRating(type: TitleType, id: number, email: string, profileId: string, rating: number) {
  const body: Record<string, unknown> = { EMAIL: email, PROFILE_ID: profileId, RATING: rating };
  body[type === "movie" ? "MOVIE_ID" : "SHOW_ID"] = id;
  await api.post("/api/profiles/rating/add", body);
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- title-data`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/title-data.ts apps/web/lib/browse-data.ts apps/web/__tests__/title-data.test.ts
git commit -m "feat(web): add title-data fetchers and itemType helper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: RateControl

**Files:**
- Create: `apps/web/components/title/rate-control.tsx`
- Test: `apps/web/__tests__/rate-control.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RateControl } from "../components/title/rate-control";

describe("RateControl", () => {
  it("reports the chosen rating", () => {
    const onRate = vi.fn();
    render(<RateControl value={null} onRate={onRate} />);
    fireEvent.click(screen.getByRole("button", { name: /rate 4 of 5/i }));
    expect(onRate).toHaveBeenCalledWith(4);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- rate-control`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/title/rate-control.tsx`**

```tsx
"use client";

import { Star } from "lucide-react";
import { cn } from "@streamflare/ui/lib/utils";

export function RateControl({ value, onRate }: { value: number | null; onRate: (n: number) => void }) {
  return (
    <div role="group" aria-label="Rate this title" className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} of 5`}
          aria-pressed={value != null && n <= value}
          onClick={() => onRate(n)}
          className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star className={cn("size-5", value != null && n <= value ? "fill-warning text-warning" : "text-text-subtle")} />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- rate-control`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/title/rate-control.tsx apps/web/__tests__/rate-control.test.tsx
git commit -m "feat(web): add RateControl (1-5 stars)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: CastList + EpisodeList

**Files:**
- Create: `apps/web/components/title/cast-list.tsx`
- Create: `apps/web/components/title/episode-list.tsx`
- Test: `apps/web/__tests__/title-pieces.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CastList } from "../components/title/cast-list";
import { EpisodeList } from "../components/title/episode-list";

describe("title pieces", () => {
  it("CastList renders names", () => {
    render(<CastList cast={[{ TITLE: "x", NAME: "Joaquin Phoenix" }, { TITLE: "x", NAME: null }]} />);
    expect(screen.getByText("Joaquin Phoenix")).toBeInTheDocument();
  });

  it("EpisodeList shows the selected season's episodes", () => {
    render(<EpisodeList seasons={[
      { title: "Season 1", data: [{ TITLE: "Pilot", IMAGE_URL: null, SEASON_NO: 1, EPISODE_NO: 1 }] },
      { title: "Season 2", data: [{ TITLE: "Return", IMAGE_URL: null, SEASON_NO: 2, EPISODE_NO: 1 }] },
    ]} />);
    expect(screen.getByText("Pilot")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Season 2" }));
    expect(screen.getByText("Return")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- title-pieces`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create `apps/web/components/title/cast-list.tsx`**

```tsx
import { ProfileAvatar } from "@streamflare/ui/components/brand/profile-avatar";

export function CastList({ cast }: { cast: { TITLE: string; NAME: string | null }[] }) {
  const named = cast.filter((c) => c.NAME);
  if (named.length === 0) return null;
  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-text">Cast</h2>
      <div className="flex flex-wrap gap-4">
        {named.map((c, i) => (
          <div key={`${c.NAME}-${i}`} className="flex items-center gap-2">
            <ProfileAvatar name={c.NAME!} size="sm" />
            <span className="text-sm text-text-muted">{c.NAME}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `apps/web/components/title/episode-list.tsx`**

```tsx
"use client";

import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";
import { posterUrl, type SlideItem } from "../../lib/browse-data";

export function EpisodeList({ seasons }: { seasons: SlideItem[] }) {
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
          <li key={`${ep.SEASON_NO}-${ep.EPISODE_NO}-${i}`} className="flex gap-4 rounded-lg border border-hairline bg-surface-1 p-3">
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
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- title-pieces`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/title/cast-list.tsx apps/web/components/title/episode-list.tsx apps/web/__tests__/title-pieces.test.tsx
git commit -m "feat(web): add CastList and EpisodeList for title detail

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: TitleDetail

**Files:**
- Create: `apps/web/components/title/title-detail.tsx`
- Test: `apps/web/__tests__/title-detail.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../context/auth-context", () => ({ useAuth: () => ({ email: "a@b.com", profile: "Ada" }) }));
vi.mock("../lib/title-data", () => ({
  fetchTitle: vi.fn(async () => ({ id: 7, type: "movie", title: "Joker", description: "d", rating: 8.4, yearLabel: "2019", maturity: "R", metaExtra: "122 min", imageUrl: "/j", videoUrl: null })),
  fetchCast: vi.fn(async () => [{ TITLE: "Joker", NAME: "Joaquin Phoenix" }]),
  fetchGenres: vi.fn(async () => [{ NAME: "Thriller" }]),
  fetchSimilar: vi.fn(async () => [{ MOVIE_ID: 8, TITLE: "Sib", IMAGE_URL: "/s" }]),
  fetchEpisodes: vi.fn(async () => []),
  getRating: vi.fn(async () => null),
  setRating: vi.fn(async () => {}),
}));
vi.mock("../lib/api-client", () => ({ api: { post: vi.fn(), delete: vi.fn() } }));

import { TitleDetail } from "../components/title/title-detail";

describe("TitleDetail", () => {
  beforeEach(() => {});

  it("renders the title, cast, genre, and a Play link", async () => {
    render(<TitleDetail type="movie" id={7} />);
    expect(await screen.findByRole("heading", { name: "Joker", level: 1 })).toBeInTheDocument();
    expect(await screen.findByText("Joaquin Phoenix")).toBeInTheDocument();
    expect(screen.getByText("Thriller")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /play/i })).toHaveAttribute("href", "/watch/7");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- title-detail`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/title/title-detail.tsx`**

```tsx
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- title-detail`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/title/title-detail.tsx apps/web/__tests__/title-detail.test.tsx
git commit -m "feat(web): add TitleDetail (hero + cast + genres + episodes + more-like-this)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: `/title/[type]/[id]` route

**Files:**
- Create: `apps/web/app/title/[type]/[id]/page.tsx`

- [ ] **Step 1: Create `apps/web/app/title/[type]/[id]/page.tsx`**

```tsx
"use client";

import { useParams } from "next/navigation";
import { TitleDetail } from "../../../../components/title/title-detail";

export default function TitlePage() {
  const params = useParams<{ type: string; id: string }>();
  const type = params.type === "show" ? "show" : "movie";
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return <main className="grid min-h-dvh place-items-center bg-canvas text-text-muted">Invalid title.</main>;
  }
  return <TitleDetail type={type} id={id} />;
}
```

- [ ] **Step 2: Typecheck + build**

Run: `pnpm --filter @streamflare/web typecheck` then (PowerShell) `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: both succeed; `/title/[type]/[id]` appears as a dynamic route.

- [ ] **Step 3: Commit**

```bash
git add "apps/web/app/title"
git commit -m "feat(web): add /title/[type]/[id] detail route

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Re-point browse to detail

**Files:**
- Modify: `apps/web/components/browse/browse-card.tsx`
- Modify: `apps/web/__tests__/browse-card.test.tsx`
- Modify: `apps/web/components/browse/browse-hero.tsx`

- [ ] **Step 1: Update `BrowseCard` to link to detail**

In `browse-card.tsx`, import `itemType` and change the link target:

```tsx
import { addToWatchList, removeFromWatchList, posterUrl, itemId, itemType, type BrowseItem } from "../../lib/browse-data";
```

Change `<Link href={`/watch/${id ?? ""}`} ...>` to:

```tsx
      <Link href={`/title/${itemType(item)}/${id ?? ""}`} aria-label={item.TITLE}>
```

- [ ] **Step 2: Update the BrowseCard test link assertion**

In `browse-card.test.tsx`, change the link expectation:

```tsx
    expect(screen.getByRole("link")).toHaveAttribute("href", "/title/movie/7");
```

- [ ] **Step 3: Update `BrowseHero` "More info" to detail**

In `browse-hero.tsx`, import `itemType` and change the **second** link (More info) only — keep Play → `/watch/${id}`:

```tsx
import { posterUrl, itemId, itemType, type BrowseItem } from "../../lib/browse-data";
```

```tsx
            <Link href={`/watch/${id ?? ""}`}><GlowButton size="lg"><Play className="size-5" /> Play</GlowButton></Link>
            <Link href={`/title/${itemType(item)}/${id ?? ""}`}><GlowButton variant="glass" size="lg"><Info className="size-5" /> More info</GlowButton></Link>
```

- [ ] **Step 4: Run the affected tests**

Run: `pnpm --filter @streamflare/web test -- browse-card browse-hero`
Expected: PASS (hero test still asserts Play → `/watch/9`).

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/browse/browse-card.tsx apps/web/components/browse/browse-hero.tsx apps/web/__tests__/browse-card.test.tsx
git commit -m "feat(web): point browse posters and hero More info to /title detail

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Phase 3B green-gate sweep

**Files:** none (verification + fixes)

- [ ] **Step 1: Typecheck all three packages**

Run: `pnpm --filter @streamflare/ui typecheck`, `pnpm --filter @streamflare/web typecheck`, `pnpm --filter @streamflare/api typecheck` → all PASS.

- [ ] **Step 2: API + web test suites**

Run: `pnpm --filter @streamflare/api test` and `pnpm --filter @streamflare/web test`
Expected: all pass (web adds title-data, rate-control, title-pieces, title-detail; browse-card/hero updated; api adds the two 404 cases).

- [ ] **Step 3: Production build, all routes**

Run (PowerShell): `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: success; `/title/[type]/[id]` builds (dynamic).

- [ ] **Step 4: No hardcoded hex in new components**

Run: `pnpm dlx rg -n "#[0-9a-fA-F]{3,6}" apps/web/components/title`
Expected: no matches (tokens/keywords only).

- [ ] **Step 5: Final commit (if fixes were needed)**

```bash
git add -A
git commit -m "chore: Phase 3B green-gate fixes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage:** new endpoints → Task 1. title-data + itemType → Task 2. RateControl → Task 3.
CastList/EpisodeList → Task 4. TitleDetail (hero/cast/genres/More-Like-This/episodes/play/list/rate)
→ Task 5. Route → Task 6. Re-point browse → Task 7. a11y (RateControl group, season buttons,
not-found) across Tasks 3–5. Sweep → Task 8. ✓ Contracts: celeb/genre/similar/episodes/rating
find+add reused with exact params/payloads (Task 2); new movie/show endpoints additive (Task 1).

**2. Placeholder scan:** none; complete code + real tests/mocks.

**3. Type/name consistency:** `TitleType`/`TitleDetailData`, `fetchTitle`/`fetchCast`/`fetchGenres`/
`fetchSimilar`/`fetchEpisodes`/`getRating`/`setRating` (Task 2) used in Task 5; `itemType` (Task 2)
used in Task 7; `RateControl` props `value`/`onRate` (Task 3) used in Task 5; `CastList`/`EpisodeList`
prop shapes (Task 4) match Task 5 usage; `BrowseItem`/`SlideItem`/`posterUrl` reused from
`browse-data`; rating payload key `MOVIE_ID`/`SHOW_ID` + `RATING` matches the controller. Play →
`/watch/<id>` consistent; detail link `/title/<type>/<id>` consistent.

**Known interim:** "Play" / watch still routes to the un-redesigned `/watch/[id]` (Phase 4). 3C search
results will also link to `/title`.
