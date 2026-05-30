# StreamFlare Premium Redesign — Finish MUI Migration (/profile + /history) Design

**Date:** 2026-05-30
**Status:** Approved direction; spec for review.
**Depends on:** Phases 0-4 + Admin. Reuses `AppShell`, Aurora tokens, shadcn `Tabs`, `EmptyState`.

## 1. Goal

Remove the last legacy pages still using MUI / styled-components so the whole app is Aurora
Noir + shadcn:
1. `/profile` (MUI, orphaned duplicate) → redirect to `/profiles`.
2. `/history/movies` + `/history/shows` (styled-components) → one Aurora `/history` page with
   Movies | Shows tabs; the old routes redirect to `/history`.

## 2. Scope

In scope: a new `/history` page (AppShell + tabs + history cards), `lib/history-data.ts`,
`components/history/history-list.tsx`, redirects for `/profile`, `/history/movies`,
`/history/shows`, a `HISTORY` route constant, and repointing `/account`'s history links.

Out of scope: any backend change (the watch-history endpoints already exist), per-profile history
filtering, pagination, and deleting history rows.

## 3. Backend (unchanged)

Existing endpoints are reused as-is:
- `GET /api/users/getmoviehistory/:email` → `{ history: MovieHistoryRecord[] }`
  where `MovieHistoryRecord = { TITLE, PID, RATING, WATCHED_UPTO, TIME }`.
- `GET /api/users/getshowhistory/:email` → `{ history: ShowHistoryRecord[] }`
  where `ShowHistoryRecord = { TITLE, PID, SEASON_NO, EPISODE_NO, RATING, WATCHED_UPTO, TIME }`.

`PID` is the profile that watched (the email-only variant returns all profiles' rows).

## 4. Data layer — `apps/web/lib/history-data.ts`

- Raw types `MovieHistoryRow`, `ShowHistoryRow` (mirroring the records above).
- A shared UI shape:
  ```ts
  interface HistoryEntry {
    title: string;
    profile: string;            // PID
    rating: number | null;
    watchedUpto: string | null;
    time: string | null;
    episode?: string | null;    // "S1 E2" for shows, undefined for movies
  }
  ```
- `fetchMovieHistory(email)` / `fetchShowHistory(email)` → GET the endpoints, return
  `res.data.history ?? []`.
- `toMovieEntries(rows)` / `toShowEntries(rows)` → map raw rows to `HistoryEntry[]`. Shows get
  `episode = "S{n} E{m}"` when both season and episode are present, else `null`.

## 5. Web — `/history` page

`apps/web/app/history/page.tsx` (client), in `AppShell`:
- Gate: if `!auth.email` → `/signin`.
- shadcn `Tabs` (default `movies`): triggers **Movies** and **Shows**.
- On mount, fetch both histories (map to `HistoryEntry[]`); a `loading` flag while pending.
- Each tab body: loading → "Loading history…"; empty → `EmptyState` ("No movie/show history yet");
  else `<HistoryList items={...} />`.

## 6. Components — `components/history/history-list.tsx`

`HistoryList({ items }: { items: HistoryEntry[] })`:
- Empty → `EmptyState`.
- Else a vertical stack of cards. Each card (Aurora surface, **full** `border-hairline`, rounded —
  no side-stripe): title (display font) on the left; `★ {rating}` badge on the right when rating is
  present; a muted meta row: "watched by · {profile}", the `episode` label (shows), `watchedUpto`
  progress, and `time` date. Uses tabular-nums for numbers. Semantic, accessible text (not
  color-only).

## 7. Redirects & wiring

- `apps/web/app/profile/page.tsx`: server component → `redirect(ROUTES.PROFILES)`.
- `apps/web/app/history/movies/page.tsx` and `.../shows/page.tsx`: server components →
  `redirect(ROUTES.HISTORY)` (deep links keep working).
- `apps/web/constants/routes.ts`: add `export const HISTORY = "/history";` (keep the existing
  `MOVIE_HISTORY`/`SHOW_HISTORY` constants; they now only name the redirecting routes).
- `apps/web/app/account/page.tsx`: replace the two history buttons (Movies / Shows) with a single
  "View history" `GlowButton` → `ROUTES.HISTORY`.

## 8. Accessibility

Tabs are keyboard-navigable (Radix). History cards convey rating/progress as text (not color
alone). Headings use the type scale. Reduced-motion respected globally.

## 9. Testing

- `history-data`: `fetchMovieHistory`/`fetchShowHistory` hit the right URLs and return
  `res.data.history`; `toShowEntries` sets `episode` to `"S1 E2"` and `toMovieEntries` leaves it
  undefined.
- `history-list`: renders a title + `★ rating` + the episode label for a show row; empty array →
  empty-state text.
- `/history` page: renders a Movies row from a mocked fetch; clicking the **Shows** tab reveals a
  show row.
- All existing tests stay green; ui+web typecheck and web build green; the two `/history/*` and
  `/profile` routes still build (as redirects).

## 10. Definition of done

No MUI or styled-components imports remain in `apps/web/app` (verified by search). `/profile`
redirects to `/profiles`; `/history` renders movie & show history in Aurora tabs; old history
routes redirect to `/history`; `/account` links to `/history`; tests in §9 green; typecheck + build
green.
