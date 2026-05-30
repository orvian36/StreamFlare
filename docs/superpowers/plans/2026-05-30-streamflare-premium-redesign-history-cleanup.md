# StreamFlare — Finish MUI Migration (/profile + /history) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the last MUI / styled-components pages with Aurora Noir: redirect `/profile` to `/profiles`, and merge the two history pages into one `/history` page with Movies | Shows tabs.

**Architecture:** A `history-data` layer wraps the existing watch-history endpoints and normalizes movie/show rows into a shared `HistoryEntry`. A `HistoryList` renders Aurora cards. `/history` (in `AppShell`) drives them with shadcn `Tabs`. `/profile` and the old `/history/*` routes become server-component redirects.

**Tech Stack:** Next.js 14 App Router, Tailwind v4 + shadcn (`Tabs`), Vitest.

**Reference spec:** `docs/superpowers/specs/2026-05-30-streamflare-premium-redesign-history-cleanup-design.md`.

---

## Conventions

- Worktree root: `C:\Users\Best Laptop Gallery\Desktop\CodeDev\StreamFlare\.claude\worktrees\premium-redesign`.
- Build (PowerShell): `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`.
- Tests: `pnpm --filter @streamflare/web test -- <pattern>`.
- Subpath imports for `@streamflare/ui`.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## File Structure

**Create:** `apps/web/lib/history-data.ts`, `apps/web/components/history/history-list.tsx`,
`apps/web/app/history/page.tsx`; tests `apps/web/__tests__/{history-data,history-list,history-page}.test.tsx`.
**Modify/replace:** `apps/web/app/profile/page.tsx`, `apps/web/app/history/movies/page.tsx`,
`apps/web/app/history/shows/page.tsx` (→ redirects); `apps/web/constants/routes.ts` (+`HISTORY`);
`apps/web/app/account/page.tsx` (history link).

---

## Task 1: history-data layer

**Files:** Create `apps/web/lib/history-data.ts`; Test `apps/web/__tests__/history-data.test.ts`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a) } }));

import { fetchMovieHistory, fetchShowHistory, toMovieEntries, toShowEntries } from "../lib/history-data";

describe("history-data", () => {
  beforeEach(() => { get.mockReset(); });

  it("fetchMovieHistory hits the email endpoint and returns rows", async () => {
    get.mockResolvedValue({ data: { history: [{ TITLE: "Joker", PID: "Ada", RATING: 8.4, WATCHED_UPTO: "45:12", TIME: "2026-05-20" }] } });
    const rows = await fetchMovieHistory("a@b.com");
    expect(get).toHaveBeenCalledWith("/api/users/getmoviehistory/a@b.com");
    expect(rows[0]!.TITLE).toBe("Joker");
  });

  it("fetchShowHistory hits the show endpoint", async () => {
    get.mockResolvedValue({ data: {} });
    const rows = await fetchShowHistory("a@b.com");
    expect(get).toHaveBeenCalledWith("/api/users/getshowhistory/a@b.com");
    expect(rows).toEqual([]);
  });

  it("maps rows to entries; shows get an episode label, movies do not", () => {
    const m = toMovieEntries([{ TITLE: "Joker", PID: "Ada", RATING: 8.4, WATCHED_UPTO: "45:12", TIME: "2026-05-20" }]);
    expect(m[0]!.episode).toBeUndefined();
    const s = toShowEntries([{ TITLE: "Loki", PID: "Ada", SEASON_NO: 1, EPISODE_NO: 2, RATING: null, WATCHED_UPTO: null, TIME: null }]);
    expect(s[0]!.episode).toBe("S1 E2");
    expect(s[0]!.title).toBe("Loki");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- history-data` → FAIL (module not found).

- [ ] **Step 3: Create `apps/web/lib/history-data.ts`**

```ts
import { api } from "./api-client";

export interface MovieHistoryRow {
  TITLE: string;
  PID: string;
  RATING: number | null;
  WATCHED_UPTO: string | null;
  TIME: string | null;
}

export interface ShowHistoryRow extends MovieHistoryRow {
  SEASON_NO: number | null;
  EPISODE_NO: number | null;
}

export interface HistoryEntry {
  title: string;
  profile: string;
  rating: number | null;
  watchedUpto: string | null;
  time: string | null;
  episode?: string | null;
}

export async function fetchMovieHistory(email: string): Promise<MovieHistoryRow[]> {
  const r = await api.get<{ history?: MovieHistoryRow[] }>(`/api/users/getmoviehistory/${email}`);
  return r.data.history ?? [];
}

export async function fetchShowHistory(email: string): Promise<ShowHistoryRow[]> {
  const r = await api.get<{ history?: ShowHistoryRow[] }>(`/api/users/getshowhistory/${email}`);
  return r.data.history ?? [];
}

export function toMovieEntries(rows: MovieHistoryRow[]): HistoryEntry[] {
  return rows.map((r) => ({
    title: r.TITLE,
    profile: r.PID,
    rating: r.RATING,
    watchedUpto: r.WATCHED_UPTO,
    time: r.TIME,
  }));
}

export function toShowEntries(rows: ShowHistoryRow[]): HistoryEntry[] {
  return rows.map((r) => ({
    title: r.TITLE,
    profile: r.PID,
    rating: r.RATING,
    watchedUpto: r.WATCHED_UPTO,
    time: r.TIME,
    episode: r.SEASON_NO != null && r.EPISODE_NO != null ? `S${r.SEASON_NO} E${r.EPISODE_NO}` : null,
  }));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- history-data` → PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/history-data.ts apps/web/__tests__/history-data.test.ts
git commit -m "feat(web): add history-data (fetch + normalize watch history)"
```

---

## Task 2: HistoryList component

**Files:** Create `apps/web/components/history/history-list.tsx`; Test `apps/web/__tests__/history-list.test.tsx`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HistoryList } from "../components/history/history-list";
import type { HistoryEntry } from "../lib/history-data";

const show: HistoryEntry = { title: "Loki", profile: "Ada", rating: 8.2, watchedUpto: "12:30", time: "2026-05-20", episode: "S1 E2" };

describe("HistoryList", () => {
  it("renders a row with title, rating and episode", () => {
    render(<HistoryList items={[show]} emptyLabel="No show history yet" />);
    expect(screen.getByText("Loki")).toBeInTheDocument();
    expect(screen.getByText(/8\.2/)).toBeInTheDocument();
    expect(screen.getByText("S1 E2")).toBeInTheDocument();
  });

  it("renders an empty state", () => {
    render(<HistoryList items={[]} emptyLabel="No show history yet" />);
    expect(screen.getByText("No show history yet")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- history-list` → FAIL (module not found).

- [ ] **Step 3: Create `apps/web/components/history/history-list.tsx`**

```tsx
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
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2 py-0.5 text-sm text-text tabular-nums">
                <Star className="size-3.5 fill-warning text-warning" />
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- history-list` → PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/history/history-list.tsx apps/web/__tests__/history-list.test.tsx
git commit -m "feat(web): add Aurora HistoryList card component"
```

---

## Task 3: /history page with tabs

**Files:** Create `apps/web/app/history/page.tsx`; Test `apps/web/__tests__/history-page.test.tsx`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
let authValue: { email: string | null; profile: string | null; logout: () => void };
vi.mock("../context/auth-context", () => ({ useAuth: () => authValue }));
const get = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a), post: vi.fn().mockResolvedValue({ data: [] }) } }));

import HistoryPage from "../app/history/page";

describe("history page", () => {
  beforeEach(() => {
    push.mockClear();
    authValue = { email: "a@b.com", profile: "Ada", logout: vi.fn() };
    get.mockImplementation((url: string) => {
      if (url.includes("getmoviehistory")) return Promise.resolve({ data: { history: [{ TITLE: "Joker", PID: "Ada", RATING: 8.4, WATCHED_UPTO: "45:12", TIME: "2026-05-20" }] } });
      if (url.includes("getshowhistory")) return Promise.resolve({ data: { history: [{ TITLE: "Loki", PID: "Ada", SEASON_NO: 1, EPISODE_NO: 2, RATING: null, WATCHED_UPTO: null, TIME: null }] } });
      return Promise.resolve({ data: [] });
    });
  });

  it("shows movie history, then show history after switching tabs", async () => {
    render(<HistoryPage />);
    expect(await screen.findByText("Joker")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /shows/i }));
    expect(await screen.findByText("Loki")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- history-page` → FAIL (module not found).

- [ ] **Step 3: Create `apps/web/app/history/page.tsx`**

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@streamflare/ui/components/ui/tabs";
import { AppShell } from "../../components/app/app-shell";
import { HistoryList } from "../../components/history/history-list";
import {
  fetchMovieHistory, fetchShowHistory, toMovieEntries, toShowEntries, type HistoryEntry,
} from "../../lib/history-data";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

export default function HistoryPage() {
  const auth = useAuth();
  const router = useRouter();
  const [movies, setMovies] = React.useState<HistoryEntry[]>([]);
  const [shows, setShows] = React.useState<HistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!auth.email) { router.push(ROUTES.SIGN_IN); return; }
    let cancelled = false;
    Promise.all([fetchMovieHistory(auth.email), fetchShowHistory(auth.email)])
      .then(([m, s]) => { if (!cancelled) { setMovies(toMovieEntries(m)); setShows(toShowEntries(s)); } })
      .catch(() => { if (!cancelled) { setMovies([]); setShows([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [auth.email, router]);

  if (!auth.email) return null;

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text">Watch history</h1>
          <p className="mt-1 text-text-muted">Everything watched across your profiles.</p>
        </header>

        <Tabs defaultValue="movies">
          <TabsList>
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="shows">Shows</TabsTrigger>
          </TabsList>
          <TabsContent value="movies" className="mt-6">
            {loading ? <p className="text-text-muted">Loading history…</p>
              : <HistoryList items={movies} emptyLabel="No movie history yet" />}
          </TabsContent>
          <TabsContent value="shows" className="mt-6">
            {loading ? <p className="text-text-muted">Loading history…</p>
              : <HistoryList items={shows} emptyLabel="No show history yet" />}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- history-page` → PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/history/page.tsx apps/web/__tests__/history-page.test.tsx
git commit -m "feat(web): add /history page with Movies | Shows tabs"
```

---

## Task 4: Redirects + wiring

**Files:** Modify `apps/web/constants/routes.ts`, `apps/web/app/profile/page.tsx`,
`apps/web/app/history/movies/page.tsx`, `apps/web/app/history/shows/page.tsx`,
`apps/web/app/account/page.tsx`.

- [ ] **Step 1: Add the `HISTORY` route constant** to `apps/web/constants/routes.ts`:

```ts
export const HISTORY = "/history";
```

- [ ] **Step 2: Replace `apps/web/app/profile/page.tsx`** with a redirect:

```tsx
import { redirect } from "next/navigation";
import * as ROUTES from "../../constants/routes";

export default function ProfileRedirect() {
  redirect(ROUTES.PROFILES);
}
```

- [ ] **Step 3: Replace `apps/web/app/history/movies/page.tsx`**:

```tsx
import { redirect } from "next/navigation";
import * as ROUTES from "../../../constants/routes";

export default function MovieHistoryRedirect() {
  redirect(ROUTES.HISTORY);
}
```

- [ ] **Step 4: Replace `apps/web/app/history/shows/page.tsx`**:

```tsx
import { redirect } from "next/navigation";
import * as ROUTES from "../../../constants/routes";

export default function ShowHistoryRedirect() {
  redirect(ROUTES.HISTORY);
}
```

- [ ] **Step 5: Repoint the `/account` history section** — in `apps/web/app/account/page.tsx`, replace the two history buttons:

```tsx
        <Section title="Watch history">
          <div className="flex flex-wrap gap-2">
            <Link href={ROUTES.HISTORY}><GlowButton variant="ghost" size="sm">View history</GlowButton></Link>
          </div>
        </Section>
```

- [ ] **Step 6: Typecheck + build**

Run: `pnpm --filter @streamflare/web typecheck` then (PowerShell) `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`.
Expected: both succeed; `/profile`, `/history/movies`, `/history/shows` build (as redirects); `/history` builds.

- [ ] **Step 7: Commit**

```bash
git add apps/web/constants/routes.ts apps/web/app/profile/page.tsx apps/web/app/history/movies/page.tsx apps/web/app/history/shows/page.tsx apps/web/app/account/page.tsx
git commit -m "feat(web): redirect /profile and old /history/* routes; link /account to /history"
```

---

## Task 5: Green-gate sweep

**Files:** none (verification + fixes)

- [ ] **Step 1: No MUI / styled-components left in app pages**

Run (Grep tool): pattern `@mui/|styled-components` in `apps/web/app`.
Expected: no matches (the `/design` showcase only uses the Aurora barrel, which is fine).

- [ ] **Step 2: Typecheck ui + web**

Run: `pnpm --filter @streamflare/ui typecheck` and `pnpm --filter @streamflare/web typecheck` → PASS.

- [ ] **Step 3: Full web test suite**

Run: `pnpm --filter @streamflare/web test` → all pass (adds history-data, history-list, history-page).

- [ ] **Step 4: Production build**

Run (PowerShell): `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build` → success.

- [ ] **Step 5: No hardcoded hex in new components**

Run (Grep tool): pattern `#[0-9a-fA-F]{3,8}` in `apps/web/components/history`.
Expected: no matches.

- [ ] **Step 6: Final commit (if fixes were needed)**

```bash
git add -A
git commit -m "chore: finish MUI migration green-gate fixes"
```

---

## Self-Review

**1. Spec coverage:** history-data (fetch + normalize) → Task 1. HistoryList Aurora card (full
border, no side-stripe) → Task 2. `/history` tabs page (gate, fetch both, loading/empty) → Task 3.
`/profile` + old `/history/*` redirects, `HISTORY` constant, `/account` repoint → Task 4. a11y
(Radix tabs, text-not-color) across Tasks 2-3. Sweep + "no MUI left" → Task 5.

**2. Placeholder scan:** none; complete code + real tests.

**3. Type/name consistency:** `HistoryEntry` (Task 1) consumed by `HistoryList` (Task 2) and the
page (Task 3); `fetchMovieHistory`/`fetchShowHistory`/`toMovieEntries`/`toShowEntries` (Task 1)
used by the page (Task 3); `HISTORY` route (Task 4) used by `/account` + the redirects;
`HistoryList` prop `emptyLabel` consistent between Task 2 and Task 3.
