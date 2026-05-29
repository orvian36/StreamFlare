# StreamFlare Premium Redesign — Phase 3A (Browse Home) Design

**Date:** 2026-05-30
**Status:** Approved direction; spec for review.
**Depends on:** Phases 0/1 (merged) + 2A/2B (AppShell, ProfileAvatar, ContentRow, PosterCard, motion).

## 1. Goal

Rebuild `/browse` in the Aurora Noir language: an authenticated, profile-gated browse home with
a cinematic hero and horizontally-scrolling content rows, reusing the existing browse/profile
API endpoints. No backend changes.

First slice of Phase 3. **3B** adds title detail pages (re-points posters there); **3C** adds the
⌘K command palette + filtered search. The watch player is Phase 4.

## 2. Scope

In scope: `/browse` (home/movies/shows/my-list/new views), an `AppShell` nav slot, a `BrowseHero`,
a `BrowseCard` (poster + link + watchlist toggle), and the supporting fetch logic (reused from the
current page). Profile gating via redirect to `/profiles`.

Out of scope: title detail (3B), ⌘K/search (3C), watch player (Phase 4). Posters link to the
existing `/watch/[id]` route in the interim. The movie/show watch-history pages and `/watch/[id]`
stay as-is this phase.

## 3. Preserved contracts (read + watchlist mutations; no shape changes)

Item rows everywhere use the existing **SlideItem** shape `{ title: string; data: Item[] }`, where
`Item` has `MOVIE_ID|SHOW_ID`, `TITLE`, `IMAGE_URL` (TMDB path; rendered as
`https://image.tmdb.org/t/p/w780${IMAGE_URL}`), `RATING`, optional `RELEASE_DATE`, `DESCRIPTION`,
`SEASON_NO`/`EPISODE_NO`.

- **Profiles:** `GET /api/profiles/:email` → `{ profile: { PROFILE_ID, DOB }[] }`.
- **Catalog by genre:** `GET /api/browse/movies/:genre` → `{ movies: Item[] }`;
  `GET /api/browse/shows/:genre` → `{ shows: Item[] }` (`:genre` may be `all`).
- **New & Popular:** `GET /api/browse/new?email=` → `SlideItem[]` (Top-10 region, Trending, New,
  Upcoming for movies + shows).
- **For-You (ML):** `GET /api/browse/suggestions?email=&profile_id=` → `SlideItem[]`.
- **Continue watching:** `GET /api/profiles/movie/continue?profile_id=&email=` and
  `GET /api/profiles/show/continue?...` → a single `SlideItem`.
- **Watchlist:** `POST /api/profiles/watchlist/get` `{ EMAIL, PROFILE_ID }` → `{ arr: SlideItem[] }`;
  `POST /api/profiles/watchlist/find`, `POST /api/profiles/watchlist/add`,
  `DELETE /api/profiles/watchlist/delete` (exact payloads confirmed from
  `apps/api/src/controllers/profile.controller.ts` when writing the plan; reused unchanged).

`auth` context: `email`, `profile`, `set_profile`, `set_ptbd`, `num_profiles`, `max_profiles`.

## 4. Profile gating

`/browse` requires a selected profile. On mount: if `!auth.email` → `/signin`; else if
`!auth.profile` → `/profiles` (the 2A gate). This removes the legacy inline "Who's watching?" gate
that the old browse page embedded.

## 5. AppShell nav

Extend `AppShell` with an optional `nav?: React.ReactNode` slot rendered centered in the top bar
(desktop) / under it (mobile). Browse passes a `BrowseNav` of tab links/buttons:
**Home · Movies · Shows · My List · New & Popular**, with the active tab marked
(`aria-current`, accent underline). Tabs switch an in-page `view` state (no route change) — the
home stays a single client route, matching today's category behavior.

## 6. BrowseHero

A featured title (the first item of the Trending row from `/browse/new`, falling back to the first
available item). Full-bleed `HeroBackdrop` (TMDB image) with Aurora scrims; oversized
`font-display` title, `Rating`/`MaturityBadge`(if present)/`GenreChip` meta, a short clamped
description, and actions: **Play** (`GlowButton` → `/watch/[id]`), **More info** (→ `/watch/[id]`
for now; 3B re-points to detail), **＋ My List** (watchlist toggle). `FadeIn` + subtle parallax.

## 7. Views (rows per tab)

- **Home:** Continue Watching (merge movie+show continue), For-You (`/browse/suggestions`), then
  the `/browse/new` sections (Top-10, Trending, New). Hero shown.
- **Movies:** by-genre rows from `/browse/movies/all` grouped by `NAME` (genre), plus a
  selection-filtered set (reuse the existing `selectionFilter` util if present, else group client
  side). 
- **Shows:** same from `/browse/shows/all`.
- **My List:** `/profiles/watchlist/get` rows; `EmptyState` when empty.
- **New & Popular:** the full 8 sections from `/browse/new`.

Each row is a `ContentRow` of `BrowseCard`s. Loading shows skeleton rows; empty categories show
`EmptyState`.

## 8. BrowseCard (new, `apps/web/components/browse/browse-card.tsx`)

Composes `PosterCard` (title, subtitle = year/episode, TMDB image) wrapped in a Next `Link` to
`/watch/[id]` (using `MOVIE_ID`/`SHOW_ID`), with a hover/focus **watchlist toggle** button
(＋ to add, ✓ to remove) that calls `watchlist/add`/`watchlist/delete` and reflects state. The
button stops propagation so it doesn't trigger navigation. Accessible label
("Add <title> to My List" / "Remove …").

## 9. Components summary

New: `apps/web/components/browse/browse-nav.tsx`, `browse-hero.tsx`, `browse-card.tsx`, and the
rebuilt `apps/web/app/browse/page.tsx` (a focused orchestrator that fetches + composes; extract
fetch helpers into `apps/web/lib/browse-data.ts` to keep the page small). Modify `AppShell` to add
the `nav` slot. Reuse `ContentRow`, `PosterCard`, `HeroBackdrop`, `Rating`, `MaturityBadge`,
`GenreChip`, `GlowButton`, motion. Server-safe subpath imports; the page is a client component.
Drops legacy `Header`/`Card`/`Player`/`Loading`/`Profiles` usage from this route.

## 10. Accessibility

Nav tabs are buttons with `aria-current`; rows are keyboard-scrollable; poster links have the title
as accessible name; the watchlist toggle has an explicit label and is keyboard-reachable; hero text
sits on a scrim guaranteeing contrast; skeletons use `aria-hidden`; reduced-motion respected.

## 11. Testing

- Profile gating: no `auth.profile` → redirects to `/profiles`.
- Renders rows from mocked endpoints (Home shows a For-You / Trending row with poster alts).
- Tab switch changes the visible view (Movies shows a genre row).
- `BrowseCard`: links to `/watch/<id>`; clicking the toggle calls watchlist add (and not the link).
- My List empty → `EmptyState`.
- All existing tests stay green; typecheck (ui + web) + production build green.

## 12. Non-goals

No backend changes; no title detail (3B); no ⌘K/search (3C); no watch-player redesign (Phase 4);
no change to history pages.

## 13. Definition of done

`/browse` rebuilt in Aurora with AppShell nav, hero, and the rows in §7; profile gating; watchlist
toggle works; posters link to `/watch/[id]`; legacy styled-components usage removed from this route;
a11y in §10 met; tests in §11 green; typecheck + build green.
