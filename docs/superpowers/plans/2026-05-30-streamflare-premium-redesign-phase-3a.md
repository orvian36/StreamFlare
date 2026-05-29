# StreamFlare Premium Redesign — Phase 3A (Browse Home) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/browse` in Aurora Noir — profile-gated, AppShell nav + cinematic hero + content rows (Continue Watching / For-You / Trending / New / by-genre / My List) over the existing endpoints, with a watchlist toggle. No backend changes.

**Architecture:** Fetch logic lives in `apps/web/lib/browse-data.ts` (typed wrappers + grouping). Presentational pieces (`BrowseNav`, `BrowseHero`, `BrowseCard`) live in `apps/web/components/browse/`. The rebuilt `/browse` page is a thin client orchestrator. `AppShell` gains an optional `nav` slot. Posters link to the existing `/watch/[id]`.

**Tech Stack:** Next.js 14 App Router, Tailwind v4 + shadcn, Framer Motion, Vitest + Testing Library.

**Reference spec:** `docs/superpowers/specs/2026-05-30-streamflare-premium-redesign-phase-3a-design.md`.

---

## Conventions

- Worktree root: `C:\Users\Best Laptop Gallery\Desktop\CodeDev\StreamFlare\.claude\worktrees\premium-redesign`.
- Build: PowerShell `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`.
- Tests: `pnpm --filter @streamflare/web test -- <pattern>`. Typecheck: `pnpm --filter @streamflare/{ui,web} typecheck`.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Subpath imports for `@streamflare/ui` primitives.

## File Structure

**Create:**
- `apps/web/lib/browse-data.ts` — types + fetch wrappers + `groupByGenre`.
- `apps/web/components/browse/browse-nav.tsx` — view tabs.
- `apps/web/components/browse/browse-card.tsx` — poster + link + watchlist toggle.
- `apps/web/components/browse/browse-hero.tsx` — featured-title hero.
- Tests under `apps/web/__tests__/`.

**Modify:**
- `apps/web/components/app/app-shell.tsx` — add optional `nav` slot.
- `apps/web/app/browse/page.tsx` — rebuilt orchestrator.

---

## Task 1: AppShell nav slot

**Files:**
- Modify: `apps/web/components/app/app-shell.tsx`
- Modify: `apps/web/__tests__/app-shell.test.tsx`

- [ ] **Step 1: Add the `nav` prop to `AppShell`**

Change the signature and render the slot centered in the bar. Replace the component signature and header row:

```tsx
export function AppShell({ children, nav }: { children: React.ReactNode; nav?: React.ReactNode }) {
```

In the header's inner `<div>`, place `nav` between the wordmark and the menu:

```tsx
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3 md:px-10">
          <Link href={ROUTES.BROWSE} aria-label="StreamFlare home"><Wordmark /></Link>
          {nav ? <div className="hidden flex-1 justify-center md:flex">{nav}</div> : null}
          <DropdownMenu>
            {/* ...unchanged trigger + content... */}
          </DropdownMenu>
        </div>
```

(Keep everything else in the file unchanged.)

- [ ] **Step 2: Extend the test to assert the nav renders**

Add to `apps/web/__tests__/app-shell.test.tsx` inside the authenticated `describe`:

```tsx
  it("renders a provided nav slot", () => {
    render(<AppShell nav={<span>BROWSENAV</span>}><p>c</p></AppShell>);
    expect(screen.getByText("BROWSENAV")).toBeInTheDocument();
  });
```

- [ ] **Step 3: Run the test**

Run: `pnpm --filter @streamflare/web test -- app-shell`
Expected: PASS (3 tests).

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/app/app-shell.tsx apps/web/__tests__/app-shell.test.tsx
git commit -m "feat(web): add optional nav slot to AppShell

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: browse-data helpers

**Files:**
- Create: `apps/web/lib/browse-data.ts`
- Test: `apps/web/__tests__/browse-data.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
const post = vi.fn();
const del = vi.fn();
vi.mock("../lib/api-client", () => ({
  api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), delete: (...a: unknown[]) => del(...a) },
}));

import { groupByGenre, fetchWatchList, addToWatchList, type BrowseItem } from "../lib/browse-data";

describe("browse-data", () => {
  beforeEach(() => { get.mockReset(); post.mockReset(); del.mockReset(); });

  it("groups items into one SlideItem per genre NAME", () => {
    const items: BrowseItem[] = [
      { MOVIE_ID: 1, TITLE: "A", IMAGE_URL: "/a", NAME: "Drama" },
      { MOVIE_ID: 2, TITLE: "B", IMAGE_URL: "/b", NAME: "Drama" },
      { MOVIE_ID: 3, TITLE: "C", IMAGE_URL: "/c", NAME: "Comedy" },
    ];
    const rows = groupByGenre(items);
    expect(rows.map((r) => r.title)).toEqual(["Drama", "Comedy"]);
    expect(rows[0]!.data).toHaveLength(2);
  });

  it("fetches the watchlist rows", async () => {
    post.mockResolvedValue({ data: { arr: [{ title: "My List", data: [] }] } });
    const rows = await fetchWatchList("a@b.com", "Ada");
    expect(post).toHaveBeenCalledWith("/api/profiles/watchlist/get", { EMAIL: "a@b.com", PROFILE_ID: "Ada" });
    expect(rows[0]!.title).toBe("My List");
  });

  it("adds a movie to the watchlist", async () => {
    post.mockResolvedValue({ status: 201 });
    await addToWatchList("a@b.com", "Ada", { MOVIE_ID: 7, TITLE: "X", IMAGE_URL: "/x" });
    expect(post).toHaveBeenCalledWith("/api/profiles/watchlist/add", { EMAIL: "a@b.com", PROFILE_ID: "Ada", MOVIE_ID: 7 });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- browse-data`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/lib/browse-data.ts`**

```ts
import { api } from "./api-client";

export interface BrowseItem {
  MOVIE_ID?: number;
  SHOW_ID?: number;
  TITLE: string;
  IMAGE_URL: string | null;
  RATING?: number | null;
  RELEASE_DATE?: string | number | null;
  DESCRIPTION?: string | null;
  SEASON_NO?: number;
  EPISODE_NO?: number;
  NAME?: string; // genre name on by-genre rows
}

export interface SlideItem {
  title: string;
  data: BrowseItem[];
}

export const posterUrl = (path: string | null | undefined): string =>
  path ? `https://image.tmdb.org/t/p/w780${path}` : "/images/misc/joker1.jpg";

export const itemId = (it: BrowseItem): number | undefined => it.MOVIE_ID ?? it.SHOW_ID;

export function groupByGenre(items: BrowseItem[]): SlideItem[] {
  const map = new Map<string, BrowseItem[]>();
  for (const it of items) {
    const name = it.NAME ?? "All";
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(it);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export async function fetchProfiles(email: string) {
  const res = await api.get<{ profile: { PROFILE_ID: string; DOB: string | null }[] }>(`/api/profiles/${email}`);
  return res.data.profile ?? [];
}

export async function fetchNewAndPopular(email: string): Promise<SlideItem[]> {
  const res = await api.get<SlideItem[]>(`/api/browse/new?email=${encodeURIComponent(email)}`);
  return res.data ?? [];
}

export async function fetchSuggestions(email: string, profileId: string): Promise<SlideItem[]> {
  const res = await api.get<SlideItem[]>(
    `/api/browse/suggestions?email=${encodeURIComponent(email)}&profile_id=${encodeURIComponent(profileId)}`,
  );
  return res.data ?? [];
}

export async function fetchContinue(email: string, profileId: string): Promise<SlideItem[]> {
  const q = `profile_id=${encodeURIComponent(profileId)}&email=${encodeURIComponent(email)}`;
  const [mv, sh] = await Promise.all([
    api.get<SlideItem>(`/api/profiles/movie/continue?${q}`).then((r) => r.data).catch(() => null),
    api.get<SlideItem>(`/api/profiles/show/continue?${q}`).then((r) => r.data).catch(() => null),
  ]);
  return [mv, sh].filter((s): s is SlideItem => !!s && Array.isArray(s.data) && s.data.length > 0);
}

export async function fetchByGenre(type: "movies" | "shows"): Promise<SlideItem[]> {
  const res = await api.get<{ movies?: BrowseItem[]; shows?: BrowseItem[] }>(`/api/browse/${type}/all`);
  const items = (type === "movies" ? res.data.movies : res.data.shows) ?? [];
  return groupByGenre(items);
}

export async function fetchWatchList(email: string, profileId: string): Promise<SlideItem[]> {
  const res = await api.post<{ arr: SlideItem[] }>("/api/profiles/watchlist/get", { EMAIL: email, PROFILE_ID: profileId });
  return res.data.arr ?? [];
}

export async function addToWatchList(email: string, profileId: string, item: BrowseItem) {
  const body: Record<string, unknown> = { EMAIL: email, PROFILE_ID: profileId };
  if (item.MOVIE_ID != null) body.MOVIE_ID = item.MOVIE_ID;
  else if (item.SHOW_ID != null) body.SHOW_ID = item.SHOW_ID;
  await api.post("/api/profiles/watchlist/add", body);
}

export async function removeFromWatchList(email: string, profileId: string, item: BrowseItem) {
  const body: Record<string, unknown> = { EMAIL: email, PROFILE_ID: profileId };
  if (item.MOVIE_ID != null) body.MOVIE_ID = item.MOVIE_ID;
  else if (item.SHOW_ID != null) body.SHOW_ID = item.SHOW_ID;
  await api.delete("/api/profiles/watchlist/delete", { data: body });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- browse-data`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/browse-data.ts apps/web/__tests__/browse-data.test.ts
git commit -m "feat(web): add browse-data fetch helpers and genre grouping

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: BrowseCard

**Files:**
- Create: `apps/web/components/browse/browse-card.tsx`
- Test: `apps/web/__tests__/browse-card.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const post = vi.fn();
const del = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { post: (...a: unknown[]) => post(...a), delete: (...a: unknown[]) => del(...a) } }));

import { BrowseCard } from "../components/browse/browse-card";

describe("BrowseCard", () => {
  beforeEach(() => { post.mockReset(); del.mockReset(); });

  it("links to the watch route for the item", () => {
    render(<BrowseCard item={{ MOVIE_ID: 7, TITLE: "X", IMAGE_URL: "/x" }} email="a@b.com" profileId="Ada" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/watch/7");
  });

  it("adds to the watchlist without navigating", async () => {
    post.mockResolvedValue({ status: 201 });
    render(<BrowseCard item={{ MOVIE_ID: 7, TITLE: "X", IMAGE_URL: "/x" }} email="a@b.com" profileId="Ada" />);
    fireEvent.click(screen.getByRole("button", { name: /add x to my list/i }));
    await waitFor(() => expect(post).toHaveBeenCalledWith(
      "/api/profiles/watchlist/add", { EMAIL: "a@b.com", PROFILE_ID: "Ada", MOVIE_ID: 7 },
    ));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- browse-card`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/browse/browse-card.tsx`**

```tsx
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
  const subtitle = [item.RELEASE_DATE, item.SEASON_NO && item.EPISODE_NO ? `S${item.SEASON_NO}·E${item.EPISODE_NO}` : null]
    .filter(Boolean).join(" · ") || undefined;

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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- browse-card`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/browse/browse-card.tsx apps/web/__tests__/browse-card.test.tsx
git commit -m "feat(web): add BrowseCard (poster + watch link + watchlist toggle)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: BrowseNav

**Files:**
- Create: `apps/web/components/browse/browse-nav.tsx`
- Test: `apps/web/__tests__/browse-nav.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowseNav, type BrowseView } from "../components/browse/browse-nav";

describe("BrowseNav", () => {
  it("marks the active view and reports changes", () => {
    const onChange = vi.fn();
    render(<BrowseNav view="home" onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "Movies" }));
    expect(onChange).toHaveBeenCalledWith("movies" satisfies BrowseView);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- browse-nav`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/browse/browse-nav.tsx`**

```tsx
"use client";

import { cn } from "@streamflare/ui/lib/utils";

export type BrowseView = "home" | "movies" | "shows" | "mylist" | "new";

const TABS: { id: BrowseView; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "movies", label: "Movies" },
  { id: "shows", label: "Shows" },
  { id: "mylist", label: "My List" },
  { id: "new", label: "New & Popular" },
];

export function BrowseNav({ view, onChange }: { view: BrowseView; onChange: (v: BrowseView) => void }) {
  return (
    <nav className="flex items-center gap-1">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          aria-current={view === t.id ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            view === t.id ? "text-text" : "text-text-muted hover:text-text",
          )}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- browse-nav`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/browse/browse-nav.tsx apps/web/__tests__/browse-nav.test.tsx
git commit -m "feat(web): add BrowseNav view tabs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: BrowseHero

**Files:**
- Create: `apps/web/components/browse/browse-hero.tsx`
- Test: `apps/web/__tests__/browse-hero.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowseHero } from "../components/browse/browse-hero";

describe("BrowseHero", () => {
  it("renders the featured title and a play link", () => {
    render(<BrowseHero item={{ MOVIE_ID: 9, TITLE: "Joker", IMAGE_URL: "/j", RATING: 8.4, DESCRIPTION: "d" }} />);
    expect(screen.getByRole("heading", { name: "Joker" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /play/i })).toHaveAttribute("href", "/watch/9");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- browse-hero`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/browse/browse-hero.tsx`**

```tsx
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- browse-hero`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/browse/browse-hero.tsx apps/web/__tests__/browse-hero.test.tsx
git commit -m "feat(web): add BrowseHero featured-title hero

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Rebuild `/browse` orchestrator

**Files:**
- Modify: `apps/web/app/browse/page.tsx`
- Test: `apps/web/__tests__/browse-page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
let authValue: Record<string, unknown>;
vi.mock("../context/auth-context", () => ({ useAuth: () => authValue }));
const get = vi.fn();
const post = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) } }));

import BrowsePage from "../app/browse/page";

describe("browse page", () => {
  beforeEach(() => {
    push.mockClear(); get.mockReset(); post.mockReset();
    authValue = { email: "a@b.com", profile: "Ada", logout: vi.fn(), set_profile: vi.fn() };
    get.mockImplementation((url: string) => {
      if (url.includes("/api/browse/new")) return Promise.resolve({ data: [{ title: "Trending Movies ", data: [{ MOVIE_ID: 1, TITLE: "Joker", IMAGE_URL: "/j", RATING: 8 }] }] });
      if (url.includes("/api/browse/suggestions")) return Promise.resolve({ data: [{ title: "For You", data: [{ MOVIE_ID: 2, TITLE: "Pick", IMAGE_URL: "/p" }] }] });
      if (url.includes("/continue")) return Promise.resolve({ data: { title: "Continue Watching", data: [] } });
      return Promise.resolve({ data: {} });
    });
  });

  it("redirects to /profiles when no profile is selected", async () => {
    authValue = { ...authValue, profile: null };
    render(<BrowsePage />);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/profiles"));
  });

  it("renders the For-You / trending rows on home", async () => {
    render(<BrowsePage />);
    expect(await screen.findByText("For You")).toBeInTheDocument();
    expect(await screen.findAllByAltText("Joker")).not.toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- browse-page`
Expected: FAIL — the current page renders the legacy markup / different data path.

- [ ] **Step 3: Replace `apps/web/app/browse/page.tsx`**

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ContentRow } from "@streamflare/ui/components/brand/content-row";
import { EmptyState } from "@streamflare/ui/components/brand/empty-state";
import { AppShell } from "../../components/app/app-shell";
import { BrowseNav, type BrowseView } from "../../components/browse/browse-nav";
import { BrowseHero } from "../../components/browse/browse-hero";
import { BrowseCard } from "../../components/browse/browse-card";
import {
  fetchNewAndPopular, fetchSuggestions, fetchContinue, fetchByGenre, fetchWatchList,
  type SlideItem, type BrowseItem,
} from "../../lib/browse-data";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

function pickHero(rows: SlideItem[]): BrowseItem | null {
  for (const r of rows) {
    const withImg = r.data.find((d) => d.IMAGE_URL);
    if (withImg) return withImg;
  }
  return null;
}

export default function BrowsePage() {
  const auth = useAuth();
  const router = useRouter();
  const [view, setView] = React.useState<BrowseView>("home");
  const [rows, setRows] = React.useState<SlideItem[]>([]);
  const [hero, setHero] = React.useState<BrowseItem | null>(null);
  const [loading, setLoading] = React.useState(true);

  const email = auth.email;
  const profile = auth.profile;

  React.useEffect(() => {
    if (!email) { router.push(ROUTES.SIGN_IN); return; }
    if (!profile) { router.push(ROUTES.PROFILES); return; }
  }, [email, profile, router]);

  React.useEffect(() => {
    if (!email || !profile) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      let next: SlideItem[] = [];
      try {
        if (view === "home") {
          const [cont, sugg, np] = await Promise.all([
            fetchContinue(email, profile), fetchSuggestions(email, profile), fetchNewAndPopular(email),
          ]);
          next = [...cont, ...sugg, ...np.slice(0, 4)];
        } else if (view === "movies") {
          next = await fetchByGenre("movies");
        } else if (view === "shows") {
          next = await fetchByGenre("shows");
        } else if (view === "mylist") {
          next = await fetchWatchList(email, profile);
        } else {
          next = await fetchNewAndPopular(email);
        }
      } catch (err) {
        console.error(err);
      }
      if (!cancelled) {
        setRows(next.filter((r) => r.data && r.data.length > 0));
        if (view === "home") setHero(pickHero(next));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [view, email, profile]);

  const nav = <BrowseNav view={view} onChange={setView} />;

  if (!email || !profile) return null;

  return (
    <AppShell nav={nav}>
      <div className="space-y-10">
        {view === "home" && hero ? <BrowseHero item={hero} /> : null}
        <div className="mb-3 md:hidden"><BrowseNav view={view} onChange={setView} /></div>
        {loading ? (
          <div className="space-y-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-5 w-40 animate-pulse rounded bg-surface-2" />
                <div className="flex gap-3">{[0, 1, 2, 3, 4].map((j) => <div key={j} className="h-60 w-40 shrink-0 animate-pulse rounded-lg bg-surface-2" />)}</div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="Nothing here yet" description={view === "mylist" ? "Add titles to your list to see them here." : "Check back soon."} />
        ) : (
          rows.map((row, i) => (
            <ContentRow key={`${view}-${row.title}-${i}`} index={String(i + 1).padStart(2, "0")} title={row.title.trim()}>
              {row.data.map((item) => (
                <BrowseCard
                  key={`${item.MOVIE_ID ?? item.SHOW_ID}-${item.TITLE}`}
                  item={item}
                  email={email}
                  profileId={profile}
                  inList={view === "mylist"}
                />
              ))}
            </ContentRow>
          ))
        )}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- browse-page`
Expected: PASS.

- [ ] **Step 5: Typecheck + build**

Run: `pnpm --filter @streamflare/web typecheck` then (PowerShell) `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: both succeed; `/browse` builds; legacy `Header`/`Card`/`Player`/`Profiles`/`Loading` no longer imported by this route.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/browse/page.tsx apps/web/__tests__/browse-page.test.tsx
git commit -m "feat(web): rebuild /browse in Aurora (hero + rows + watchlist)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Phase 3A green-gate sweep

**Files:** none (verification + fixes)

- [ ] **Step 1: Typecheck both packages**

Run: `pnpm --filter @streamflare/ui typecheck` and `pnpm --filter @streamflare/web typecheck` → PASS.

- [ ] **Step 2: Full web test suite**

Run: `pnpm --filter @streamflare/web test`
Expected: all pass (existing + new: browse-data, browse-card, browse-nav, browse-hero, browse-page, app-shell).

- [ ] **Step 3: Production build, all routes**

Run (PowerShell): `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: success; `/browse` builds (likely dynamic). No styled-components/legacy-UI import remains on `/browse`.

- [ ] **Step 4: No hardcoded hex in new components**

Run: `pnpm dlx rg -n "#[0-9a-fA-F]{3,6}" apps/web/components/browse`
Expected: no matches (token/keyword/`rgba(0,0,0,…)`/`black/50` only — the `black/N` and `white/N` opacity utilities used on the watchlist button over imagery are acceptable, like the existing PosterCard scrim).

- [ ] **Step 5: Final commit (if fixes were needed)**

```bash
git add -A
git commit -m "chore: Phase 3A green-gate fixes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage:** AppShell nav slot → Task 1. Fetch helpers + grouping → Task 2. BrowseCard (link + watchlist toggle) → Task 3. BrowseNav (tabs, aria-current) → Task 4. BrowseHero → Task 5. Profile gating + views (Home/Movies/Shows/My List/New) + skeleton/empty → Task 6. a11y across Tasks 3–6. Sweep → Task 7. ✓ Contracts: by-genre, new, suggestions, continue, watchlist get/add/delete used with exact paths/payloads (Task 2). ✓

**2. Placeholder scan:** none; complete code + real tests/mocks throughout.

**3. Type/name consistency:** `BrowseItem`/`SlideItem`, `posterUrl`, `itemId`, `groupByGenre`, `fetch*`, `addToWatchList`/`removeFromWatchList` (Task 2) used in Tasks 3/5/6; `BrowseView` (Task 4) used in Task 6; `BrowseCard` props (`item`/`email`/`profileId`/`inList`) consistent (Tasks 3/6); `BrowseHero` `item` prop (Task 5) used in Task 6; watch link `/watch/<id>` consistent. Watchlist payload key `MOVIE_ID`/`SHOW_ID` matches the controller.

**Known interim:** posters/hero link to the existing `/watch/[id]` (redesigned in Phase 4); 3B re-points them to title detail. The legacy `selectionFilter` util and old browse components are no longer used by this route (left in the tree; removed in a later cleanup).
