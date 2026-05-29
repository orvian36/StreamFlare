# StreamFlare Premium Redesign — Phase 3C (Command Palette + Filtered Search) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global ⌘K command palette (quick search → detail) and a `/search` page with type/genre/year filters, over the existing `/api/browse/search`. No backend changes.

**Architecture:** `search-data.ts` wraps static + filtered search. `CommandPalette` (shadcn `CommandDialog`) is mounted in `AppShell`, which owns its open state, a ⌘K listener, and a search button. `/search` reads URL params, renders `SearchFilters` + result grids of `BrowseCard`. Results route to `/title/[type]/[id]`.

**Tech Stack:** Next.js 14 App Router, Tailwind v4 + shadcn (command/dialog/select), Vitest + Testing Library.

**Reference spec:** `docs/superpowers/specs/2026-05-30-streamflare-premium-redesign-phase-3c-design.md`.

---

## Conventions

- Worktree root: `C:\Users\Best Laptop Gallery\Desktop\CodeDev\StreamFlare\.claude\worktrees\premium-redesign`.
- Web build: PowerShell `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`.
- Tests: `pnpm --filter @streamflare/web test -- <pattern>`. Typecheck: `pnpm --filter @streamflare/{ui,web} typecheck`.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Subpath imports for `@streamflare/ui` primitives.

## File Structure

**Create:** `apps/web/lib/search-data.ts`; `apps/web/components/search/command-palette.tsx`;
`apps/web/components/search/search-filters.tsx`; `apps/web/app/search/page.tsx`; tests.
**Modify:** `apps/web/components/app/app-shell.tsx` (search button + mount palette) + its test.

---

## Task 1: search-data helpers

**Files:**
- Create: `apps/web/lib/search-data.ts`
- Test: `apps/web/__tests__/search-data.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
const post = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { post: (...a: unknown[]) => post(...a) } }));
import { staticSearch, filteredSearch, SEARCH_GENRES } from "../lib/search-data";

describe("search-data", () => {
  beforeEach(() => post.mockReset());

  it("staticSearch posts the static body", async () => {
    post.mockResolvedValue({ data: [{ title: "Search Result from Movies", data: [] }, { title: "Search Result from Shows", data: [] }] });
    await staticSearch("joker");
    expect(post).toHaveBeenCalledWith("/api/browse/search", { ss: "static", key: ["joker"] });
  });

  it("filteredSearch builds ss + key from filters", async () => {
    post.mockResolvedValue({ data: [] });
    await filteredSearch({ query: "joker", type: "movie", genre: "Drama", year: "2019" });
    expect(post).toHaveBeenCalledWith("/api/browse/search", {
      ss: "movie",
      key: ["title", "joker", "genre", "Drama", "year", "2019"],
    });
  });

  it("filteredSearch returns [] when nothing to search", async () => {
    const r = await filteredSearch({ type: "all" });
    expect(r).toEqual([]);
    expect(post).not.toHaveBeenCalled();
  });

  it("exposes a non-empty genre list", () => {
    expect(SEARCH_GENRES.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- search-data`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/lib/search-data.ts`**

```ts
import { api } from "./api-client";
import type { SlideItem } from "./browse-data";

export const SEARCH_GENRES = [
  "Action", "Children", "Comedy", "Documentary", "Drama", "Romance", "Suspense", "Thriller",
];

export async function staticSearch(query: string): Promise<SlideItem[]> {
  const r = await api.post<SlideItem[]>("/api/browse/search", { ss: "static", key: [query] });
  return r.data ?? [];
}

export interface FilterOpts {
  query?: string;
  type: "all" | "movie" | "show";
  genre?: string;
  year?: string;
}

export async function filteredSearch(opts: FilterOpts): Promise<SlideItem[]> {
  const key: (string | number)[] = [];
  if (opts.query) key.push("title", opts.query);
  if (opts.genre) key.push("genre", opts.genre);
  if (opts.year) key.push("year", opts.year);
  if (key.length === 0) return [];
  const r = await api.post<SlideItem[]>("/api/browse/search", { ss: opts.type, key });
  return r.data ?? [];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- search-data`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/search-data.ts apps/web/__tests__/search-data.test.ts
git commit -m "feat(web): add search-data helpers (static + filtered search)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: CommandPalette

**Files:**
- Create: `apps/web/components/search/command-palette.tsx`
- Test: `apps/web/__tests__/command-palette.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const post = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { post: (...a: unknown[]) => post(...a) } }));

import { CommandPalette } from "../components/search/command-palette";

describe("CommandPalette", () => {
  beforeEach(() => { push.mockClear(); post.mockReset(); });

  it("searches and routes to a result's detail page", async () => {
    post.mockResolvedValue({ data: [
      { title: "Search Result from Movies", data: [{ MOVIE_ID: 7, TITLE: "Joker", IMAGE_URL: "/j", RELEASE_DATE: 2019 }] },
      { title: "Search Result from Shows", data: [] },
    ] });
    render(<CommandPalette open onOpenChange={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "joker" } });
    const item = await screen.findByText("Joker");
    fireEvent.click(item);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/title/movie/7"));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- command-palette`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/search/command-palette.tsx`**

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@streamflare/ui/components/ui/command";
import { staticSearch } from "../../lib/search-data";
import { itemId, itemType, posterUrl, type BrowseItem, type SlideItem } from "../../lib/browse-data";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [sections, setSections] = React.useState<SlideItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (query.trim().length < 2) { setSections([]); return; }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await staticSearch(query.trim());
        if (!cancelled) setSections(r);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  function go(item: BrowseItem) {
    onOpenChange(false);
    router.push(`/title/${itemType(item)}/${itemId(item) ?? ""}`);
  }

  function viewAll() {
    onOpenChange(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search films and series..." value={query} onValueChange={setQuery} />
      <CommandList>
        {loading ? <div className="px-3 py-2 text-sm text-text-muted">Searching...</div> : null}
        {!loading && query.trim().length >= 2 ? <CommandEmpty>No results found.</CommandEmpty> : null}
        {sections.map((section) =>
          section.data.length > 0 ? (
            <CommandGroup key={section.title} heading={section.title.replace("Search Result from ", "")}>
              {section.data.slice(0, 6).map((item) => (
                <CommandItem
                  key={`${item.MOVIE_ID ?? item.SHOW_ID}-${item.TITLE}`}
                  value={`${item.TITLE}-${item.MOVIE_ID ?? item.SHOW_ID}`}
                  onSelect={() => go(item)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={posterUrl(item.IMAGE_URL)} alt="" className="mr-2 h-10 w-7 rounded object-cover" />
                  <span className="truncate">{item.TITLE}</span>
                  {item.RELEASE_DATE ? <span className="ml-auto font-mono text-xs text-text-subtle">{item.RELEASE_DATE}</span> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null,
        )}
        {query.trim().length >= 2 ? (
          <CommandGroup>
            <CommandItem value="__all__" onSelect={viewAll}>Search all results for &quot;{query.trim()}&quot;</CommandItem>
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
```

> Uses shadcn `CommandDialog` (generated in Phase 0). If `CommandInput` ignores `value`/`onValueChange` in this cmdk version, switch to its `onValueChange` only and keep `query` from it; the test drives the input via `fireEvent.change` on the rendered textbox.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- command-palette`
Expected: PASS. (cmdk filters by `value`; the test types the exact substring so the item shows.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/search/command-palette.tsx apps/web/__tests__/command-palette.test.tsx
git commit -m "feat(web): add ⌘K CommandPalette quick search

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: SearchFilters + /search page

**Files:**
- Create: `apps/web/components/search/search-filters.tsx`
- Create: `apps/web/app/search/page.tsx`
- Test: `apps/web/__tests__/search-page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const replace = vi.fn();
let params = new URLSearchParams("q=joker&type=all");
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => params,
}));
vi.mock("../context/auth-context", () => ({ useAuth: () => ({ email: "a@b.com", profile: "Ada", logout: vi.fn() }) }));
const filtered = vi.fn();
vi.mock("../lib/search-data", async () => {
  const actual = await vi.importActual<typeof import("../lib/search-data")>("../lib/search-data");
  return { ...actual, filteredSearch: (...a: unknown[]) => filtered(...a) };
});
vi.mock("../lib/api-client", () => ({ api: { post: vi.fn(), delete: vi.fn() } }));

import SearchPage from "../app/search/page";

describe("search page", () => {
  beforeEach(() => { replace.mockClear(); filtered.mockReset(); params = new URLSearchParams("q=joker&type=all"); });

  it("renders results from filteredSearch", async () => {
    filtered.mockResolvedValue([{ title: "Search Result from Movies", data: [{ MOVIE_ID: 7, TITLE: "Joker", IMAGE_URL: "/j" }] }]);
    render(<SearchPage />);
    expect(await screen.findAllByAltText("Joker")).not.toHaveLength(0);
  });

  it("updates the URL when the type filter changes", async () => {
    filtered.mockResolvedValue([]);
    render(<SearchPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Movies" }));
    await waitFor(() => expect(replace).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- search-page`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create `apps/web/components/search/search-filters.tsx`**

```tsx
"use client";

import { cn } from "@streamflare/ui/lib/utils";
import { Input } from "@streamflare/ui/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@streamflare/ui/components/ui/select";
import { SEARCH_GENRES } from "../../lib/search-data";

export type SearchType = "all" | "movie" | "show";

export interface SearchFiltersValue { query: string; type: SearchType; genre: string; year: string }

const TYPES: { id: SearchType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "movie", label: "Movies" },
  { id: "show", label: "Shows" },
];

export function SearchFilters({ value, onChange }: { value: SearchFiltersValue; onChange: (v: SearchFiltersValue) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search films and series..."
        value={value.query}
        onChange={(e) => onChange({ ...value, query: e.target.value })}
        className="h-10 w-full max-w-sm"
        aria-label="Search query"
      />
      <div className="flex gap-1">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange({ ...value, type: t.id })}
            aria-current={value.type === t.id ? "true" : undefined}
            className={cn("rounded-md px-3 py-1.5 text-sm", value.type === t.id ? "bg-surface-3 text-text" : "text-text-muted hover:text-text")}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Select value={value.genre || "any"} onValueChange={(g) => onChange({ ...value, genre: g === "any" ? "" : g })}>
        <SelectTrigger className="w-40" aria-label="Genre"><SelectValue placeholder="Any genre" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any genre</SelectItem>
          {SEARCH_GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input
        placeholder="Year"
        inputMode="numeric"
        value={value.year}
        onChange={(e) => onChange({ ...value, year: e.target.value })}
        className="h-10 w-24"
        aria-label="Year"
      />
    </div>
  );
}
```

- [ ] **Step 4: Create `apps/web/app/search/page.tsx`**

```tsx
"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ContentRow } from "@streamflare/ui/components/brand/content-row";
import { EmptyState } from "@streamflare/ui/components/brand/empty-state";
import { AppShell } from "../../components/app/app-shell";
import { SearchFilters, type SearchFiltersValue, type SearchType } from "../../components/search/search-filters";
import { BrowseCard } from "../../components/browse/browse-card";
import { filteredSearch } from "../../lib/search-data";
import type { SlideItem } from "../../lib/browse-data";
import { useAuth } from "../../context/auth-context";

function SearchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();

  const value: SearchFiltersValue = {
    query: params.get("q") ?? "",
    type: (params.get("type") as SearchType) || "all",
    genre: params.get("genre") ?? "",
    year: params.get("year") ?? "",
  };
  const [sections, setSections] = React.useState<SlideItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  function update(next: SearchFiltersValue) {
    const sp = new URLSearchParams();
    if (next.query) sp.set("q", next.query);
    sp.set("type", next.type);
    if (next.genre) sp.set("genre", next.genre);
    if (next.year) sp.set("year", next.year);
    router.replace(`/search?${sp.toString()}`);
  }

  const key = `${value.query}|${value.type}|${value.genre}|${value.year}`;
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const r = await filteredSearch(value);
      if (!cancelled) { setSections(r.filter((s) => s.data.length > 0)); setLoading(false); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const email = auth.email ?? "";
  const profile = auth.profile ?? "";

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold tracking-tight text-text">Search</h1>
      <SearchFilters value={value} onChange={update} />
      {loading ? (
        <p className="text-text-muted">Searching...</p>
      ) : sections.length === 0 ? (
        <EmptyState title="No results" description="Try a different query or filters." />
      ) : (
        sections.map((section, i) => (
          <ContentRow key={`${section.title}-${i}`} title={section.title.replace("Search Result from ", "")}>
            {section.data.map((item) => (
              <BrowseCard key={`${item.MOVIE_ID ?? item.SHOW_ID}-${item.TITLE}`} item={item} email={email} profileId={profile} />
            ))}
          </ContentRow>
        ))
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <SearchInner />
      </Suspense>
    </AppShell>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- search-page`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/search/search-filters.tsx apps/web/app/search/page.tsx apps/web/__tests__/search-page.test.tsx
git commit -m "feat(web): add /search page with type/genre/year filters

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: AppShell search trigger + palette mount

**Files:**
- Modify: `apps/web/components/app/app-shell.tsx`
- Modify: `apps/web/__tests__/app-shell.test.tsx`

- [ ] **Step 1: Add a failing test (palette opens via the button)**

Add to `apps/web/__tests__/app-shell.test.tsx`. First ensure `next/navigation` is mocked at the top of the file (it isn't yet — AppShell currently only uses `useRouter`; add the mock):

```tsx
// at top, after the existing vi.mock for auth-context:
const post = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { post: (...a: unknown[]) => post(...a) } }));
```

Add this test inside the authenticated `describe`:

```tsx
  it("opens the command palette from the search button", async () => {
    render(<AppShell><p>c</p></AppShell>);
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(await screen.findByPlaceholderText(/search films and series/i)).toBeInTheDocument();
  });
```

(Import `fireEvent` in the test file if not already imported.)

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- app-shell`
Expected: FAIL — no search button / palette yet.

- [ ] **Step 3: Update `apps/web/components/app/app-shell.tsx`**

Add imports:

```tsx
import { Search } from "lucide-react";
import { CommandPalette } from "../search/command-palette";
```

Add palette state near the top of the component body:

```tsx
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
```

In the header, add a search button just before the `DropdownMenu` (wrap the right side in a flex group):

```tsx
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="grid size-9 place-items-center rounded-full text-text-muted hover:bg-surface-3 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Search className="size-5" />
            </button>
            <DropdownMenu>
              {/* ...existing trigger + content unchanged... */}
            </DropdownMenu>
          </div>
```

Mount the palette once, just before the closing `</div>` of the root wrapper (after `<main>`):

```tsx
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- app-shell`
Expected: PASS (existing AppShell tests + the new palette test).

- [ ] **Step 5: Typecheck + commit**

Run: `pnpm --filter @streamflare/web typecheck` → PASS.

```bash
git add apps/web/components/app/app-shell.tsx apps/web/__tests__/app-shell.test.tsx
git commit -m "feat(web): add search button + ⌘K palette to AppShell

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Phase 3C green-gate sweep

**Files:** none (verification + fixes)

- [ ] **Step 1: Typecheck both packages**

Run: `pnpm --filter @streamflare/ui typecheck` and `pnpm --filter @streamflare/web typecheck` → PASS.

- [ ] **Step 2: Full web test suite**

Run: `pnpm --filter @streamflare/web test`
Expected: all pass (adds search-data, command-palette, search-page; app-shell updated).

- [ ] **Step 3: Production build, all routes**

Run (PowerShell): `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: success; `/search` builds (dynamic via `useSearchParams`).

- [ ] **Step 4: No hardcoded hex in new components**

Run: `pnpm dlx rg -n "#[0-9a-fA-F]{3,6}" apps/web/components/search`
Expected: no matches.

- [ ] **Step 5: Final commit (if fixes were needed)**

```bash
git add -A
git commit -m "chore: Phase 3C green-gate fixes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage:** search-data (static/filtered/genres) → Task 1. CommandPalette (⌘K via AppShell,
debounced static, → /title, "search all" → /search) → Tasks 2 & 4. SearchFilters + /search (type/
genre/year, URL-driven, BrowseCard grid, empty state) → Task 3. AppShell trigger + mount + ⌘K
listener → Task 4. a11y (Radix CommandDialog, labelled search button + filters) across Tasks 2–4.
Sweep → Task 5. ✓ Contract: `POST /api/browse/search` static + filtered `ss`/`key` exact (Task 1).

**2. Placeholder scan:** none; complete code + real tests/mocks. The CommandInput note is a
contingency, not a placeholder (the code is complete).

**3. Type/name consistency:** `staticSearch`/`filteredSearch`/`FilterOpts`/`SEARCH_GENRES` (Task 1)
used in Tasks 2/3; `SearchFiltersValue`/`SearchType` (Task 3) consistent; `CommandPalette` props
`open`/`onOpenChange` (Task 2) match the AppShell mount (Task 4); `itemType`/`itemId`/`posterUrl`/
`SlideItem`/`BrowseItem`/`BrowseCard` reused; detail link `/title/<type>/<id>` consistent.

**Known interim:** "Play"/watch still routes to the un-redesigned `/watch/[id]` (Phase 4). After 3C,
Phase 3 (browse core) is complete; remaining program work is Phase 4 (watch player) and the admin
dashboard feature.
