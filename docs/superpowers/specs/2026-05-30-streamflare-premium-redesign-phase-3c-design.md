# StreamFlare Premium Redesign — Phase 3C (Command Palette + Filtered Search) Design

**Date:** 2026-05-30
**Status:** Approved direction; spec for review.
**Depends on:** Phases 0/1/2/3A/3B. Reuses `AppShell`, `BrowseCard`, `ContentRow`, `browse-data`,
`title` routing, shadcn `command`/`dialog`/`select`.

## 1. Goal

Add a global ⌘K command palette for quick search and a `/search` results page with filters, over
the existing `/api/browse/search` endpoint. Results route to `/title/[type]/[id]`. No backend
changes.

Final slice of Phase 3. Phase 4 is the watch player.

## 2. Scope

In scope: `CommandPalette` (⌘K + AppShell trigger, mounted in `AppShell`); `/search` route with
query + type/genre/year filters; `search-data.ts` helpers; AppShell integration.

Out of scope: watch player (Phase 4); admin dashboard (separate feature); no new endpoints.

## 3. Preserved search contract (`POST /api/browse/search`)

- **Static (palette):** `{ ss: "static", key: [query] }` → `[{ title: "Search Result from Movies", data: Item[] }, { title: "Search Result from Shows", data: Item[] }]`.
- **Filtered (/search):** `{ ss: "movie" | "show" | "all", key: [param, kw, param, kw, …] }` where
  `param ∈ {title, genre, celeb, year, lang, sim}`; returns `[{ title, data: Item[] }]` sections
  (movies and/or shows per `ss`). `Item` is the standard `BrowseItem` shape (`MOVIE_ID|SHOW_ID`,
  `TITLE`, `IMAGE_URL`, `RATING`, `RELEASE_DATE`).

## 4. `search-data.ts` (new helpers)

- `staticSearch(query: string): Promise<SlideItem[]>` → posts the static body.
- `filteredSearch(opts: { query?: string; type: "all" | "movie" | "show"; genre?: string; year?: string }): Promise<SlideItem[]>`
  — builds `key` (push `["title", query]`, `["genre", genre]`, `["year", year]` when present) and
  `ss` (= `type`), posts, returns sections. If `key` is empty, returns `[]` (nothing to search).
- `SEARCH_GENRES: string[]` — a curated genre list for the dropdown (Drama, Comedy, Romance,
  Thriller, Suspense, Children, Action, Documentary). The backend matches by name `contains`.

(Reuses `SlideItem`/`BrowseItem`/`itemType`/`itemId`/`posterUrl` from `browse-data`.)

## 5. `CommandPalette` (new, mounted in `AppShell`)

`apps/web/components/search/command-palette.tsx` (client):
- A shadcn `CommandDialog` controlled by `open` state. A module-level global `keydown` listener
  toggles it on **⌘K / Ctrl+K** (preventDefault); also opened by the AppShell search button.
- `CommandInput` (debounced ~250ms). For queries ≥ 2 chars, calls `staticSearch`; shows a loading
  hint, `CommandEmpty` when none. Results in two `CommandGroup`s (Movies, Shows): each
  `CommandItem` shows a small poster thumbnail + title (+ year); `onSelect` →
  `router.push(/title/${itemType(item)}/${id})` and closes.
- A footer `CommandItem`: "Search all results for '<q>'" → `/search?q=<q>` and closes.
- Esc/overlay closes (Radix). Cleared on close.

## 6. `/search` page

`apps/web/app/search/page.tsx` (client, wrapped in `Suspense` for `useSearchParams`,
`AppShell`-wrapped):
- Reads `q`, `type` (default `all`), `genre`, `year` from the URL. A `SearchFilters` row: a text
  query input, a type segmented control (All / Movies / Shows), a genre `Select` (from
  `SEARCH_GENRES`, with an "Any genre" option), and a year input. Changing a filter updates the URL
  query (`router.replace`) which re-runs the search.
- Runs `filteredSearch` on the current params; renders each returned section as a titled grid of
  `BrowseCard`s. Loading skeleton; `EmptyState` ("No results — try different filters") when empty
  or when no query/filters are set yet (prompt to search).

## 7. AppShell integration

Modify `AppShell`: render a search trigger button (magnifier, `aria-label="Search"`) to the left of
the profile menu, and mount `<CommandPalette />` once. The button and ⌘K both open the palette
(shared open state via the palette's own listener + an exposed control: the AppShell holds `open`
state and passes `open`/`onOpenChange` to `CommandPalette`, and the button sets `open`).

## 8. Components

New: `apps/web/components/search/command-palette.tsx`, `apps/web/components/search/search-filters.tsx`,
`apps/web/lib/search-data.ts`, `apps/web/app/search/page.tsx`. Modify `AppShell`. Reuse `BrowseCard`,
`ContentRow`/grid, shadcn `command`, `dialog`, `select`, `input`. Subpath imports.

## 9. Accessibility

`CommandDialog` is Radix (focus trap, Esc, aria); the search button has `aria-label`; the ⌘K
shortcut does not trap typing in inputs (listener ignores when a dialog/input is the target except
the global toggle); filter controls have labels; result items have accessible names (title);
reduced-motion respected.

## 10. Testing

- `search-data`: `filteredSearch` builds the correct `ss` + `key` for query+genre+year; empty
  filters → `[]`; `staticSearch` posts the static body.
- `CommandPalette`: typing a query (≥2) calls the static endpoint (mock) and renders a result;
  selecting routes to `/title/<type>/<id>`; the "search all" action routes to `/search?q=`.
- `/search`: renders results from a mocked `filteredSearch`; changing the type filter updates the
  query; empty → `EmptyState`.
- All existing tests stay green; ui+web typecheck and web build green.

## 11. Non-goals

No backend changes; no watch player (Phase 4); no admin dashboard; no fuzzy/typeahead beyond the
existing endpoint's `contains` matching.

## 12. Definition of done

⌘K palette opens app-wide (and via the AppShell button), quick-searches, and routes to detail;
`/search` filters by type/genre/year and lists results linking to detail; a11y in §9 met; tests in
§10 green; typecheck + build green.
