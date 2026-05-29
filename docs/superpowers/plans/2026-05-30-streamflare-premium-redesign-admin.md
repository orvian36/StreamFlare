# StreamFlare Premium Redesign — Admin & Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `GET /api/admin/overview` analytics endpoint and a gated `/admin` web dashboard (KPI cards + recharts charts + top-titles table), read-only.

**Architecture:** New `admin.controller`/`admin.routes` (Prisma aggregations) mounted at `/api/admin`. Web `admin-data.ts` wraps the fetch + client gating; `/admin` (in `AppShell`) renders `StatCard`s, `AnalyticsCharts` (recharts using Aurora chart-token colors), and `TopTitles`. An "Admin" menu item appears for admins.

**Tech Stack:** Express + Prisma (api), Next.js 14 App Router, Tailwind v4 + shadcn, recharts, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-05-30-streamflare-premium-redesign-admin-design.md`.

---

## Conventions

- Worktree root: `C:\Users\Best Laptop Gallery\Desktop\CodeDev\StreamFlare\.claude\worktrees\premium-redesign`.
- Web build: PowerShell `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`.
- Tests: `pnpm --filter @streamflare/web test -- <pattern>`; `pnpm --filter @streamflare/api test`.
- Typecheck: `pnpm --filter @streamflare/{ui,web,api} typecheck`.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Subpath imports for `@streamflare/ui`.

## File Structure

**Create:** `apps/api/src/controllers/admin.controller.ts`, `apps/api/src/routes/admin.routes.ts`;
`apps/web/lib/admin-data.ts`, `apps/web/components/admin/{stat-card,top-titles,analytics-charts}.tsx`,
`apps/web/app/admin/page.tsx`; tests.
**Modify:** `apps/api/src/app.ts`, `apps/api/tests/helpers/test-app.ts`, `apps/api/tests/smoke.test.ts`;
`apps/web/package.json` (recharts); `apps/web/components/app/app-shell.tsx` + its test.

---

## Task 1: Backend `GET /api/admin/overview`

**Files:**
- Create: `apps/api/src/controllers/admin.controller.ts`, `apps/api/src/routes/admin.routes.ts`
- Modify: `apps/api/src/app.ts`, `apps/api/tests/helpers/test-app.ts`, `apps/api/tests/smoke.test.ts`

- [ ] **Step 1: Add a failing api test (new `describe` in `smoke.test.ts`)**

```ts
describe("admin", () => {
  it("GET /api/admin/overview returns totals, revenue and arrays", async () => {
    const res = await request(app).get("/api/admin/overview");
    expect(res.status).toBe(200);
    expect(typeof res.body.totals.users).toBe("number");
    expect(typeof res.body.revenue).toBe("number");
    expect(Array.isArray(res.body.trending)).toBe(true);
    expect(Array.isArray(res.body.genres)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/api test`
Expected: FAIL — route not mounted (404 via notFound).

- [ ] **Step 3: Create `apps/api/src/controllers/admin.controller.ts`**

```ts
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@streamflare/db";

export async function overview(_req: Request, res: Response, _next: NextFunction) {
  try {
    const [users, profiles, movies, shows, subscriptions, rev] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count(),
      prisma.movie.count(),
      prisma.show.count(),
      prisma.subscription.count(),
      prisma.subscription.aggregate({ _sum: { totalBill: true } }),
    ]);

    const [mViews, sViews, mRated, sRated] = await Promise.all([
      prisma.movie.findMany({ orderBy: { totalViews: "desc" }, take: 8, select: { title: true, totalViews: true } }),
      prisma.show.findMany({ orderBy: { totalViews: "desc" }, take: 8, select: { title: true, totalViews: true } }),
      prisma.movie.findMany({ orderBy: { rating: "desc" }, take: 8, select: { title: true, rating: true } }),
      prisma.show.findMany({ orderBy: { rating: "desc" }, take: 8, select: { title: true, rating: true } }),
    ]);
    const trending = [...mViews, ...sViews]
      .map((t) => ({ title: t.title, views: t.totalViews }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
    const topRated = [...mRated, ...sRated]
      .map((t) => ({ title: t.title, rating: t.rating }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8);

    const [mg, sg] = await Promise.all([
      prisma.movieGenre.groupBy({ by: ["genreId"], _count: { _all: true } }),
      prisma.showGenre.groupBy({ by: ["genreId"], _count: { _all: true } }),
    ]);
    const counts = new Map<number, number>();
    for (const g of mg) counts.set(g.genreId, (counts.get(g.genreId) ?? 0) + g._count._all);
    for (const g of sg) counts.set(g.genreId, (counts.get(g.genreId) ?? 0) + g._count._all);
    const genreRows = counts.size
      ? await prisma.genre.findMany({ where: { genreId: { in: [...counts.keys()] } }, select: { genreId: true, name: true } })
      : [];
    const genres = genreRows
      .map((gr) => ({ name: gr.name ?? "Unknown", count: counts.get(gr.genreId) ?? 0 }))
      .sort((a, b) => b.count - a.count);

    res.status(200).json({
      totals: { users, profiles, movies, shows, subscriptions },
      revenue: rev._sum.totalBill ?? 0,
      trending,
      topRated,
      genres,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: (err as Error).message });
  }
}
```

- [ ] **Step 4: Create `apps/api/src/routes/admin.routes.ts`**

```ts
import { Router } from "express";
import * as ctrl from "../controllers/admin.controller.js";

const router = Router();
router.get("/overview", ctrl.overview);
export default router;
```

- [ ] **Step 5: Mount in `apps/api/src/app.ts`** — add the import and `app.use`:

```ts
import adminRouter from "./routes/admin.routes.js";
// ...
app.use("/api/subscription", subscriptionRouter);
app.use("/api/admin", adminRouter);
```

- [ ] **Step 6: Mount in `apps/api/tests/helpers/test-app.ts`** — add the import and `app.use`:

```ts
import adminRouter from "../../src/routes/admin.routes.js";
// ...
app.use("/api/subscription", subscriptionRouter);
app.use("/api/admin", adminRouter);
```

- [ ] **Step 7: Run the api test + typecheck**

Run: `pnpm --filter @streamflare/api test` → admin test PASSES.
Run: `pnpm --filter @streamflare/api typecheck` → PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/controllers/admin.controller.ts apps/api/src/routes/admin.routes.ts apps/api/src/app.ts apps/api/tests/helpers/test-app.ts apps/api/tests/smoke.test.ts
git commit -m "feat(api): add GET /api/admin/overview analytics endpoint

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: recharts dep + admin-data

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/lib/admin-data.ts`
- Test: `apps/web/__tests__/admin-data.test.ts`

- [ ] **Step 1: Add `recharts` to `apps/web/package.json` dependencies and install**

Add `"recharts": "^2.13.0"` to `dependencies`, then run `pnpm install`.

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
const get = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a) } }));
import { fetchOverview, isAdmin } from "../lib/admin-data";

describe("admin-data", () => {
  beforeEach(() => get.mockReset());
  afterEach(() => vi.unstubAllEnvs());

  it("isAdmin allows any signed-in user when no allowlist is set", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_EMAILS", "");
    expect(isAdmin("a@b.com")).toBe(true);
    expect(isAdmin(null)).toBe(false);
  });

  it("isAdmin enforces the allowlist when set", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_EMAILS", "boss@x.com, admin@y.com");
    expect(isAdmin("admin@y.com")).toBe(true);
    expect(isAdmin("a@b.com")).toBe(false);
  });

  it("fetchOverview returns the bundle", async () => {
    get.mockResolvedValue({ data: { totals: { users: 1, profiles: 0, movies: 0, shows: 0, subscriptions: 0 }, revenue: 0, trending: [], topRated: [], genres: [] } });
    const o = await fetchOverview();
    expect(get).toHaveBeenCalledWith("/api/admin/overview");
    expect(o.totals.users).toBe(1);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- admin-data`
Expected: FAIL — module not found.

- [ ] **Step 4: Create `apps/web/lib/admin-data.ts`**

```ts
import { api } from "./api-client";

export interface Overview {
  totals: { users: number; profiles: number; movies: number; shows: number; subscriptions: number };
  revenue: number;
  trending: { title: string; views: number }[];
  topRated: { title: string; rating: number }[];
  genres: { name: string; count: number }[];
}

export async function fetchOverview(): Promise<Overview> {
  const r = await api.get<Overview>("/api/admin/overview");
  return r.data;
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length === 0 ? true : list.includes(email);
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- admin-data`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml apps/web/lib/admin-data.ts apps/web/__tests__/admin-data.test.ts
git commit -m "feat(web): add recharts + admin-data (fetchOverview, isAdmin gating)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: StatCard + TopTitles

**Files:**
- Create: `apps/web/components/admin/stat-card.tsx`, `apps/web/components/admin/top-titles.tsx`
- Test: `apps/web/__tests__/admin-pieces.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "../components/admin/stat-card";
import { TopTitles } from "../components/admin/top-titles";

describe("admin pieces", () => {
  it("StatCard shows label and value", () => {
    render(<StatCard label="Users" value="1,234" />);
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });
  it("TopTitles lists rows", () => {
    render(<TopTitles items={[{ title: "Joker", views: 999 }]} />);
    expect(screen.getByText("Joker")).toBeInTheDocument();
    expect(screen.getByText("999")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- admin-pieces`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create `apps/web/components/admin/stat-card.tsx`**

```tsx
export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-1 p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-text-subtle">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-text">{value}</p>
    </div>
  );
}
```

- [ ] **Step 4: Create `apps/web/components/admin/top-titles.tsx`**

```tsx
export function TopTitles({ items }: { items: { title: string; views: number }[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-1 text-text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 text-right font-medium">Views</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t, i) => (
            <tr key={`${t.title}-${i}`} className="border-t border-hairline">
              <td className="px-4 py-3 text-text">{t.title}</td>
              <td className="px-4 py-3 text-right text-text-muted tabular-nums">{t.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- admin-pieces`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/admin/stat-card.tsx apps/web/components/admin/top-titles.tsx apps/web/__tests__/admin-pieces.test.tsx
git commit -m "feat(web): add admin StatCard and TopTitles table

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: AnalyticsCharts (recharts)

**Files:**
- Create: `apps/web/components/admin/analytics-charts.tsx`

- [ ] **Step 1: Create `apps/web/components/admin/analytics-charts.tsx`**

```tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { Overview } from "../../lib/admin-data";

// Aurora --chart-1..5 token values (recharts sets the SVG fill attribute, which does not
// resolve CSS var(); these mirror the tokens in packages/ui/src/styles/globals.css).
const CHART = ["oklch(0.68 0.17 274)", "oklch(0.80 0.13 210)", "oklch(0.72 0.15 155)", "oklch(0.74 0.15 320)", "oklch(0.80 0.13 85)"];
const GRID = "oklch(0.30 0.018 274)";
const AXIS = "oklch(0.60 0.012 274)";

export function AnalyticsCharts({ overview }: { overview: Overview }) {
  const trending = overview.trending.map((t) => ({ name: t.title, views: t.views }));
  const genres = overview.genres.map((g) => ({ name: g.name, count: g.count }));
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-hairline bg-surface-1 p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-text">Trending by views</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trending} margin={{ left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} hide />
              <YAxis tick={{ fill: AXIS, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "oklch(0.20 0.018 274)", border: `1px solid ${GRID}`, borderRadius: 10, color: "oklch(0.97 0.005 274)" }} cursor={{ fill: "oklch(0.24 0.02 274 / 0.4)" }} />
              <Bar dataKey="views" fill={CHART[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-xl border border-hairline bg-surface-1 p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-text">Titles by genre</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={genres} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={{ fill: AXIS, fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ background: "oklch(0.20 0.018 274)", border: `1px solid ${GRID}`, borderRadius: 10, color: "oklch(0.97 0.005 274)" }} cursor={{ fill: "oklch(0.24 0.02 274 / 0.4)" }} />
              <Bar dataKey="count" fill={CHART[1]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck (no unit test — recharts/jsdom sizing is unreliable; verified in the build)**

Run: `pnpm --filter @streamflare/web typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/admin/analytics-charts.tsx
git commit -m "feat(web): add recharts AnalyticsCharts (trending + genres)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: `/admin` page

**Files:**
- Create: `apps/web/app/admin/page.tsx`
- Test: `apps/web/__tests__/admin-page.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
let authValue: Record<string, unknown>;
vi.mock("../context/auth-context", () => ({ useAuth: () => authValue }));
const fetchOverview = vi.fn();
let admin = true;
vi.mock("../lib/admin-data", () => ({
  fetchOverview: (...a: unknown[]) => fetchOverview(...a),
  isAdmin: () => admin,
}));
vi.mock("../components/admin/analytics-charts", () => ({ AnalyticsCharts: () => <div data-testid="charts" /> }));
vi.mock("../lib/api-client", () => ({ api: { post: vi.fn() } }));

import AdminPage from "../app/admin/page";

describe("admin page", () => {
  beforeEach(() => {
    push.mockClear(); fetchOverview.mockReset(); admin = true;
    authValue = { email: "a@b.com", profile: "Ada", logout: vi.fn() };
    fetchOverview.mockResolvedValue({ totals: { users: 5, profiles: 3, movies: 2, shows: 1, subscriptions: 4 }, revenue: 42, trending: [{ title: "Joker", views: 999 }], topRated: [], genres: [] });
  });

  it("redirects non-admins to /browse", async () => {
    admin = false;
    render(<AdminPage />);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/browse"));
  });

  it("renders KPIs and the top-titles row for an admin", async () => {
    render(<AdminPage />);
    expect(await screen.findByText("999")).toBeInTheDocument();
    expect(screen.getByText("Joker")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- admin-page`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/app/admin/page.tsx`**

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@streamflare/ui/components/brand/empty-state";
import { AppShell } from "../../components/app/app-shell";
import { StatCard } from "../../components/admin/stat-card";
import { TopTitles } from "../../components/admin/top-titles";
import { AnalyticsCharts } from "../../components/admin/analytics-charts";
import { fetchOverview, isAdmin, type Overview } from "../../lib/admin-data";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

export default function AdminPage() {
  const auth = useAuth();
  const router = useRouter();
  const [data, setData] = React.useState<Overview | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!auth.email) { router.push(ROUTES.SIGN_IN); return; }
    if (!isAdmin(auth.email)) { router.push(ROUTES.BROWSE); return; }
    let cancelled = false;
    fetchOverview()
      .then((o) => { if (!cancelled) setData(o); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [auth.email, router]);

  if (!auth.email || !isAdmin(auth.email)) return null;

  const fmtMoney = (n: number) => `$${n.toLocaleString()}`;

  return (
    <AppShell>
      <div className="space-y-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-text">Admin · Analytics</h1>
        {loading ? (
          <p className="text-text-muted">Loading…</p>
        ) : !data ? (
          <EmptyState title="No analytics yet" description="Data will appear once the catalog has activity." />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Users" value={data.totals.users.toLocaleString()} />
              <StatCard label="Profiles" value={data.totals.profiles.toLocaleString()} />
              <StatCard label="Titles" value={(data.totals.movies + data.totals.shows).toLocaleString()} />
              <StatCard label="Subscriptions" value={data.totals.subscriptions.toLocaleString()} />
              <StatCard label="Revenue" value={fmtMoney(data.revenue)} />
            </div>
            <AnalyticsCharts overview={data} />
            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-text">Top titles</h2>
              <TopTitles items={data.trending} />
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- admin-page`
Expected: PASS.

- [ ] **Step 5: Typecheck + build**

Run: `pnpm --filter @streamflare/web typecheck` then (PowerShell) `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: both succeed; `/admin` builds (the recharts chart renders client-side).

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/admin/page.tsx apps/web/__tests__/admin-page.test.tsx
git commit -m "feat(web): add gated /admin analytics dashboard

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: AppShell Admin menu item

**Files:**
- Modify: `apps/web/components/app/app-shell.tsx`
- Modify: `apps/web/__tests__/app-shell.test.tsx`

- [ ] **Step 1: Add a failing test (Admin item shows for an admin)**

Add inside the authenticated `describe` of `app-shell.test.tsx`:

```tsx
  it("shows an Admin menu item for an admin", async () => {
    render(<AppShell><p>c</p></AppShell>);
    fireEvent.click(screen.getByRole("button", { name: /account menu/i }));
    expect(await screen.findByText("Admin")).toBeInTheDocument();
  });
```

(The default `authValue.email` is `a@b.com` and `NEXT_PUBLIC_ADMIN_EMAILS` is unset in tests → `isAdmin` returns true.)

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- app-shell`
Expected: FAIL — no Admin item yet.

- [ ] **Step 3: Update `apps/web/components/app/app-shell.tsx`**

Add the import:

```tsx
import { isAdmin } from "../../lib/admin-data";
```

In the `DropdownMenuContent`, add an Admin item before the "Account" item (conditional):

```tsx
              {isAdmin(auth.email) ? (
                <DropdownMenuItem onSelect={() => router.push(ROUTES.ADMIN)}>Admin</DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={() => router.push(ROUTES.ACCOUNT_SETTINGS)}>Account</DropdownMenuItem>
```

- [ ] **Step 4: Add the `ADMIN` route constant** to `apps/web/constants/routes.ts`:

```ts
export const ADMIN = "/admin";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- app-shell`
Expected: PASS (Radix dropdown opens; the Admin item renders).

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/app/app-shell.tsx apps/web/constants/routes.ts apps/web/__tests__/app-shell.test.tsx
git commit -m "feat(web): add conditional Admin item to the AppShell menu

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Green-gate sweep

**Files:** none (verification + fixes)

- [ ] **Step 1: Typecheck all packages**

Run: `pnpm --filter @streamflare/ui typecheck`, `pnpm --filter @streamflare/web typecheck`, `pnpm --filter @streamflare/api typecheck` → all PASS.

- [ ] **Step 2: API + web test suites**

Run: `pnpm --filter @streamflare/api test` and `pnpm --filter @streamflare/web test`
Expected: all pass (adds admin overview test; admin-data, admin-pieces, admin-page; app-shell updated).

- [ ] **Step 3: Production build, all routes**

Run (PowerShell): `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: success; `/admin` builds.

- [ ] **Step 4: No hardcoded hex in new components**

Run: `pnpm dlx rg -n "#[0-9a-fA-F]{3,6}" apps/web/components/admin`
Expected: no matches (chart colors are oklch literals mirroring the tokens).

- [ ] **Step 5: Final commit (if fixes were needed)**

```bash
git add -A
git commit -m "chore: admin dashboard green-gate fixes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage:** overview endpoint + mount + api test → Task 1. recharts + admin-data
(fetchOverview, isAdmin) → Task 2. StatCard/TopTitles → Task 3. AnalyticsCharts (recharts, chart
tokens) → Task 4. `/admin` page (gating, KPIs, charts, top-titles) → Task 5. AppShell Admin item +
`ADMIN` route → Task 6. a11y (labelled KPIs, table, chart section headings) across Tasks 3-5. Sweep
→ Task 7. ✓ Endpoint shape (totals/revenue/trending/topRated/genres) consistent across Tasks 1/2/4/5.

**2. Placeholder scan:** none; complete code + real tests/mocks (charts intentionally build-verified,
not unit-asserted — recharts/jsdom).

**3. Type/name consistency:** `Overview` shape (Task 2) used by `AnalyticsCharts` (Task 4) + page
(Task 5); `fetchOverview`/`isAdmin` (Task 2) used in Tasks 5/6; `StatCard` (`label`/`value`),
`TopTitles` (`items: {title,views}[]`) (Task 3) match page usage (Task 5); `ADMIN` route (Task 6)
used by AppShell + page; api JSON keys (`totals.users`, `revenue`, `trending[].views`,
`genres[].count`) consistent with the controller (Task 1).

**Known limitation (per spec):** gating is client-side (no `role` migration / server enforcement),
consistent with the currently-unauthenticated API; documented as a deliberate scope choice.
