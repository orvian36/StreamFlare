# StreamFlare Premium Redesign — Admin & Analytics Dashboard Design

**Date:** 2026-05-30
**Status:** Approved direction; spec for review.
**Depends on:** Phases 0-4. Reuses `AppShell`, tokens (incl. `--chart-1..5`), shadcn.

## 1. Goal

Add an admin analytics dashboard: a new Express+Prisma `overview` endpoint and a gated web
`/admin` page with KPI cards, charts (recharts), and a top-titles table. Read-only (no content
CRUD). This is the fourth and final chosen feature.

## 2. Scope

In scope: `GET /api/admin/overview`; the `/admin` page + its components; client admin gating; an
"Admin" entry in the AppShell menu for admins; `recharts` dependency.

Out of scope: title/user CRUD, a `role` column/migration, server-enforced admin auth (the API
isn't auth-enforced today; gating is client-side for the demo), and redesign of `/profile` and
`/history/*`.

## 3. Admin gating (no migration)

- `isAdmin(email)` (in `apps/web/lib/admin-data.ts`): reads `NEXT_PUBLIC_ADMIN_EMAILS`
  (comma-separated). If the list is empty/unset → returns `true` for any non-empty email (demoable
  out of the box); otherwise returns whether `email` is in the list.
- `/admin` page: if `!auth.email` → `/signin`; else if `!isAdmin(auth.email)` → `/browse`.
- `AppShell` profile menu: show an **"Admin"** item (→ `/admin`) only when `isAdmin(auth.email)`.
- Documented limitation: real enforcement would add a `User.role` + server middleware; deliberately
  deferred (no migration) for this portfolio feature.

## 4. Backend — `GET /api/admin/overview`

New controller `apps/api/src/controllers/admin.controller.ts` + route file
`apps/api/src/routes/admin.routes.ts`, mounted at `/api/admin` in `app.ts` and the test app.
Returns `200`:

```
{
  totals: { users, profiles, movies, shows, subscriptions },   // prisma.count()
  revenue: number,                                             // subscription.aggregate _sum.totalBill (?? 0)
  trending: { title: string; views: number }[],               // top 8 movies+shows by totalViews, merged, desc
  topRated: { title: string; rating: number }[],              // top 8 movies+shows by rating, merged, desc
  genres: { name: string; count: number }[],                  // title count per genre (movieGenre+showGenre), desc
}
```

All via Prisma (`count`, `aggregate`, `findMany orderBy take`, `groupBy` on genre links + a genre
name lookup). On error → `500 { message }`. No auth middleware (consistent with the rest of the
API). + an api smoke test asserting `200` and the shape against the (empty) test DB.

## 5. Web — `/admin` page

`apps/web/app/admin/page.tsx` (client), wrapped in `AppShell`:
- Gate per §3.
- Fetch `fetchOverview()` on mount; loading → skeleton; error/empty → `EmptyState`.
- **KPI cards** (`StatCard`): Users, Profiles, Titles (movies+shows), Subscriptions, Revenue
  (`$` + tabular-nums). A responsive grid.
- **Charts** (recharts, client): a **Trending** bar chart (title → views) and a **Genres** bar (or
  horizontal bar) chart (genre → count), colored from the Aurora chart palette. Wrapped in
  `ResponsiveContainer`.
- **Top titles table**: title · rating · (from `topRated`/`trending` merge or a `trending`+rating
  view) — render the `trending` list with views, plus `topRated` as a second small list/section.
  Semantic `<table>`, tabular-nums.

## 6. Components

New: `apps/web/lib/admin-data.ts` (`fetchOverview`, `isAdmin`, types); `apps/web/components/admin/stat-card.tsx`;
`apps/web/components/admin/analytics-charts.tsx` (the recharts charts, `"use client"`);
`apps/web/components/admin/top-titles.tsx`; `apps/web/app/admin/page.tsx`. Modify `AppShell` (admin
menu item). Reuse `EmptyState`, tokens. Chart series colors use the Aurora `--chart-1..5` values
(oklch literals mirroring the tokens, documented — recharts sets SVG `fill`, which doesn't resolve
CSS `var()`).

## 7. Accessibility

KPI cards have text labels (not color-only); charts have an accessible title/caption and a
`<table>` fallback of the same data nearby (the top-titles table doubles as the data table);
recharts tooltips are supplementary; table uses headers; reduced-motion respected (recharts
`isAnimationActive={false}` when reduced-motion).

## 8. Testing

- api: `GET /api/admin/overview` → `200` with `totals` (numbers), `revenue` (number), and array
  fields (empty on the seedless test DB).
- `admin-data`: `isAdmin` — empty env → true for any email; set env → membership; `fetchOverview`
  maps the endpoint (mock `api`).
- `/admin` page: non-admin email → redirects to `/browse`; admin → renders a KPI value + a
  top-titles row from a mocked overview.
- `StatCard`/`TopTitles`: render label + value / rows.
- Charts are verified via build (recharts + jsdom sizing is unreliable for unit assertions; keep
  chart logic trivial and data-driven).
- All existing tests stay green; ui+web+api typecheck and web build green.

## 9. Non-goals

No CRUD/mutations; no role migration; no server auth enforcement; no redesign of remaining MUI
pages (`/profile`, `/history/*`).

## 10. Definition of done

`GET /api/admin/overview` returns the analytics bundle (tested); `/admin` is gated and renders KPI
cards + charts + a top-titles table from real aggregates; an Admin menu item shows for admins;
a11y in §7 met; tests in §8 green; typecheck + build green.
