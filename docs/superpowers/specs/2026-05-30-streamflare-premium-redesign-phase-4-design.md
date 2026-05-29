# StreamFlare Premium Redesign — Phase 4 (Watch Player) Design

**Date:** 2026-05-30
**Status:** Approved direction; spec for review.
**Depends on:** Phases 0/1/2/3. Reuses `title-data` (`fetchMovie`/`fetchShow`/`fetchEpisodes`),
`browse-data`, motion, tokens.

## 1. Goal

Replace the stub `/watch/[id]` with a cinematic, full-screen custom video player that plays the
title's video, resumes from and saves watch progress, and (for shows) supports episode context and
"Next episode." This is the last consumer-facing redesign and removes MUI from the watch route.

## 2. Scope

In scope: a `VideoPlayer` component, a `watch-data.ts` helper, the rebuilt `/watch/[type]/[id]`
route (movies + shows, episode via `?s=&e=`), progress save/resume, and re-pointing the Play
entry points to the new route.

Out of scope: the admin & analytics dashboard (separate feature); `/profile` and `/history/*`
(remain on MUI for now — a later cleanup); no new backend endpoints.

## 3. Preserved contracts

- **Title video/meta:** `GET /api/browse/movie/:id` / `GET /api/browse/show/:id` (Phase 3B) → include
  `TITLE`, `IMAGE_URL`, `VIDEO_URL`.
- **Episodes:** `GET /api/browse/show/episodes?show_id=&email=&profile_id=` → `[{ title, data: Episode[] }]`
  (Episode has `SEASON_NO`, `EPISODE_NO`, `TITLE`, `VIDEO_URL`, `IMAGE_URL`).
- **Progress get:** `GET /api/profiles/time/get?profile_id=&email=&movie_id=` (or
  `&show_id=&season_no=&episode_no=`) → saved `watched_upto` (seconds). Exact JSON key confirmed from
  `profile.controller.ts` when writing the plan; read defensively (`watched_upto`/`WATCHED_UPTO`/nested).
- **Progress set:** `POST /api/profiles/time/set` `{ profile_id, email, watched_upto, movie_id }` or
  `{ ..., show_id, season_no, episode_no }`.

`auth`: `email`, `profile` (profile-gated; redirect to `/signin`/`/profiles` if missing).

## 4. Route & Play entry points

- New route `apps/web/app/watch/[type]/[id]/page.tsx` (`type` = `movie|show`). Shows read `?s=&e=`
  (default season 1 / episode 1). Delete the old `apps/web/app/watch/[id]/page.tsx`.
- Re-point Play links to `/watch/${type}/${id}` (`?s=&e=` for shows):
  - `BrowseHero` Play; `TitleDetail` Play (type known from page params).
  - `EpisodeList` (title detail): each episode becomes a Play link to `/watch/show/${showId}?s=${SEASON_NO}&e=${EPISODE_NO}` — so `EpisodeList` gains a `showId` prop.
- Full-screen layout (no AppShell chrome) — the player IS the page; a back affordance returns to the
  referring title/browse.

## 5. `VideoPlayer` (new, `apps/web/components/watch/video-player.tsx`, client)

Custom controls over a native `<video>`:
- **Surface:** the `<video>` fills the viewport (object-contain on a black-tinted canvas); `poster`
  = the title image. `src` = `VIDEO_URL` if present, else `SAMPLE_VIDEO` (a public sample URL) so the
  chrome is always demoable.
- **Controls bar** (auto-hides after ~3s idle, reappears on mouse move / focus / pause): play/pause,
  a scrubbable progress slider (shadcn `Slider`) showing current position with buffered hint, current
  time / duration (mono tabular), skip −10s/+10s, volume toggle + slider, fullscreen toggle.
- **Overlays:** top bar with a Back button (`router.back()`) + the title (and "S{e} · E{n} — Episode
  Title" for shows); a large centered play button when paused; a subtle loading spinner on buffering.
- **Keyboard:** Space/K play-pause, ←/→ skip 10s, ↑/↓ volume, F fullscreen, M mute. Buttons have
  `aria-label`s; respects `prefers-reduced-motion` (control fade only).
- Props: `src`, `poster`, `title`, `subtitle?`, `startAt?` (resume seconds), `onProgress(seconds)`,
  `onEnded?`. Pure UI + callbacks (no data fetching) so it's unit-testable.

## 6. Resume & progress

The page wires the player:
- On mount: fetch title (video + image + name) and, for shows, the episode (title + its `VIDEO_URL`);
  fetch saved progress via `getProgress` → pass as `startAt`.
- `onProgress`: throttle (~ every 10s of playback) a `saveProgress` call; also save on pause and on
  unmount (best-effort). This keeps Continue-Watching (browse) current.
- `onEnded` (shows): if a next episode exists, show a "Next episode" affordance routing to it.

## 7. Shows: episode context + next

The page resolves the current episode from `?s=&e=` against `fetchEpisodes(showId)` (flattened,
ordered). It computes the **next** episode (next `EPISODE_NO` in the season, else first of the next
season) and exposes a "Next episode" button (in the controls/end overlay) linking to its `/watch`
URL. The player title overlay shows the episode label.

## 8. `watch-data.ts`

`getProgress({ type, id, season?, episode?, email, profile })` → `GET time/get` (builds the right
query) → seconds (0 if none). `saveProgress({ ...same, seconds })` → `POST time/set`. Reuses
`fetchMovie`/`fetchShow`/`fetchEpisodes` from `title-data` for sources. Exports `SAMPLE_VIDEO`.

## 9. Components

New: `apps/web/components/watch/video-player.tsx`, `apps/web/lib/watch-data.ts`,
`apps/web/app/watch/[type]/[id]/page.tsx`. Modify: `BrowseHero`, `TitleDetail` (Play targets),
`EpisodeList` (+`showId`, play links). Delete: `apps/web/app/watch/[id]/page.tsx`. Reuse shadcn
`Slider`, lucide icons, tokens. Subpath imports.

## 10. Accessibility

All controls are labelled buttons/sliders; keyboard fully operable; the progress slider is a real
`Slider` with `aria-valuetext` (time); focus-visible rings; controls remain reachable when the bar is
visible; reduced-motion limits fades; the video has a `title`.

## 11. Testing

- `VideoPlayer`: renders title + a play button; calling the play toggle flips the icon/label;
  exposes the back button; (jsdom `HTMLMediaElement` play/pause are stubbed in `vitest.setup.ts`).
- `watch-data`: `getProgress`/`saveProgress` build the correct movie vs show query/body (mock `api`).
- `/watch` page: movie path fetches the movie + progress and renders the player with the title; bad
  type/id → a not-found/back state.
- next-episode computation: given an episode list + current `(s,e)`, returns the correct next.
- Re-point: `BrowseHero`/`TitleDetail` Play links point to `/watch/<type>/<id>`; `EpisodeList`
  episode links point to `/watch/show/<id>?s=&e=`.
- All existing tests stay green; ui+web typecheck and web build green.

## 12. Non-goals

No admin dashboard; no `/profile` or `/history` redesign; no adaptive streaming/DRM (single `<video>`
source); no new backend endpoints.

## 13. Definition of done

`/watch/[type]/[id]` plays via the custom `VideoPlayer` with resume + throttled progress save; shows
get episode context + Next episode; Play entry points route to the new route; MUI removed from the
watch route; a11y in §10 met; tests in §11 green; typecheck + build green.
