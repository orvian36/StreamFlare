# StreamFlare Premium Redesign — Phase 3B (Title Detail Pages) Design

**Date:** 2026-05-30
**Status:** Approved direction; spec for review.
**Depends on:** Phases 0/1/2/3A. Reuses `BrowseCard`, `ContentRow`, hero/meta primitives, `browse-data`.

## 1. Goal

Add cinematic title detail pages at `/title/[type]/[id]` that surface the rich (currently hidden)
relational data — cast, genres, More Like This, episodes — alongside Play / add-to-list / rate
actions. Add the one missing backend endpoint (fetch a single title's core fields). Re-point browse
posters and the hero "More info" to detail.

Second slice of Phase 3 (after 3A browse). **3C** adds the ⌘K command palette + filtered search.

## 2. Scope

In scope: backend `GET /api/browse/movie/:id` + `GET /api/browse/show/:id`; the `/title/[type]/[id]`
route + its components and fetch helpers; re-pointing `BrowseCard`/`BrowseHero` to detail.

Out of scope: ⌘K/search (3C); watch player (Phase 4, "Play" still routes to `/watch/[id]`).

## 3. New backend endpoint (additive)

Add to `apps/api/src/controllers/browse.controller.ts` + `routes/browse.routes.ts`:
- `GET /api/browse/movie/:id` → `200` with
  `{ MOVIE_ID, TITLE, DESCRIPTION, RATING, RELEASE_DATE (year:number|null), MATURITY_RATING,
  LENGTH, LANGUAGE, IMAGE_URL, VIDEO_URL }`; `404 { message }` if not found.
- `GET /api/browse/show/:id` → `200` with
  `{ SHOW_ID, TITLE, DESCRIPTION, RATING, START_YEAR, END_YEAR, MATURITY_RATING, SEASONS, EPISODES,
  LANGUAGE, IMAGE_URL, VIDEO_URL }`; `404` if not found.
- Singular paths; the existing plural `/movies/:genre` / `/shows/:genre` are unaffected. Mapped
  UPPER_SNAKE to match sibling endpoints. Invalid id → `400`.

## 4. Composed endpoints (existing, unchanged)

- Cast: `GET /api/browse/celeb?movie_id=|show_id=` → `[{ TITLE, NAME }]`.
- Genres: `GET /api/browse/genre?movie_id=|show_id=` → `[{ NAME, TOTAL_VIEWS, TOTAL_VOTES }]`.
- More Like This: `GET /api/browse/similar?movie_id=|show_id=` → up to 5 items (BrowseItem shape).
- Episodes (shows): `GET /api/browse/show/episodes?show_id=&email=&profile_id=` →
  `[{ title: "Continue Watching"|"Season N", data: Episode[] }]`.
- Rating: `POST /api/profiles/rating/find` `{ EMAIL, PROFILE_ID, MOVIE_ID|SHOW_ID }` (current rating);
  `POST /api/profiles/rating/add` `{ EMAIL, PROFILE_ID, MOVIE_ID|SHOW_ID, RATING }`.
- Watchlist add/remove/find (reused from `browse-data`).

## 5. Route & data flow

`apps/web/app/title/[type]/[id]/page.tsx` — client component reading `type` (`movie|show`) and `id`
from params (validate `type`; bad type/id → not-found state). On mount (profile-gated like browse):
fetch the single title, then in parallel cast + genres + similar (+ episodes if show) + current
rating. Render via `TitleDetail`. Image via `posterUrl`.

## 6. Detail page (`TitleDetail`)

- **Hero:** full-bleed `HeroBackdrop` (title image) + scrims; title (`font-display`), meta row
  (`Rating`, `MaturityBadge`, year(s), runtime/seasons, `GenreChip`s), clamped synopsis, and
  actions: **Play** (`GlowButton` → `/watch/[id]`), **＋/✓ My List** (watchlist toggle, reusing the
  `browse-data` add/remove), and a **`RateControl`** (1–5; prefilled from `rating/find`; sets via
  `rating/add`).
- **Cast:** `CastList` — names from `/browse/celeb` as chips/avatars (initials).
- **More Like This:** `ContentRow` of `BrowseCard` from `/browse/similar` (empty → omit the row).
- **Episodes (shows only):** `EpisodeList` — season selector (Tabs or a select) + episode cards
  (image, title, description, runtime) per season; "Continue Watching" surfaced first if present.
- States: skeleton while loading; a clean not-found card if the title 404s.

## 7. Re-point browse to detail

- Add `itemType(item): "movie" | "show"` to `browse-data` (`MOVIE_ID != null ? "movie" : "show"`).
- `BrowseCard`: link `/title/${itemType(item)}/${id}` (was `/watch/${id}`); update its test.
- `BrowseHero`: "More info" → `/title/...`; **Play** stays `/watch/[id]`; update its test.

## 8. Components

New: `apps/web/components/title/{title-detail.tsx,cast-list.tsx,episode-list.tsx,rate-control.tsx}`,
`apps/web/lib/title-data.ts` (typed fetchers: `fetchMovie`/`fetchShow`/`fetchCast`/`fetchGenres`/
`fetchSimilar`/`fetchEpisodes`/`getRating`/`setRating`). Reuse `BrowseCard`, `ContentRow`,
`HeroBackdrop`, `GlowButton`, `Rating`, `MaturityBadge`, `GenreChip`, shadcn `Tabs`/`Select`.
Subpath imports.

## 9. Accessibility

Hero text on scrim (contrast); `RateControl` is a labelled radiogroup/buttons with keyboard
support and `aria-pressed`/`aria-checked`; season selector keyboard-navigable (Radix); More Like
This row keyboard-scrollable; not-found state announced; reduced-motion respected.

## 10. Testing

- Backend: an `apps/api` test (following `tests/smoke.test.ts`) asserting
  `GET /api/browse/movie/:id` returns 404 for an unknown id and the route is wired (and 200 shape if
  the seed has data).
- `title-data`: maps params into the right endpoints (mock `api`).
- `RateControl`: clicking a star posts `rating/add` with that value.
- `TitleDetail`: renders title + meta + cast + a More-Like-This row from mocked fetchers; Play links
  to `/watch/[id]`.
- `BrowseCard`/`BrowseHero`: updated link assertions (`/title/...`).
- All existing tests stay green; ui+web typecheck, web build, and `pnpm --filter @streamflare/api test` green.

## 11. Non-goals

No watch-player redesign (Phase 4); no search (3C); no changes to existing endpoint shapes.

## 12. Definition of done

`/title/[type]/[id]` renders hero + synopsis + cast + genres + More Like This (+ episodes for shows)
with Play / add-to-list / rate; the new single-title endpoints exist and are tested; browse posters
+ hero "More info" route to detail; a11y in §9 met; tests in §10 green; typecheck + build green.
