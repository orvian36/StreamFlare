# StreamFlare Monorepo Refactor — Design

**Date:** 2026-05-26
**Status:** Approved (pending user review of this doc)
**Author:** Habibur Rahman

## 1. Goal

Refactor the existing StreamFlare project (Express + React + Oracle, all JavaScript) into a Turborepo monorepo with three TypeScript apps: a Next.js web app, an Express API, and an Express + Python ML server. Replace Oracle with SQLite via Prisma. Containerize all three apps with Docker and orchestrate via `docker-compose.yml` at the repo root.

Behavior parity with the current app is the success criterion. No new features, no UI redesign.

## 2. Constraints & Decisions

The decisions below were confirmed during brainstorming:

| Topic | Decision |
|---|---|
| DB logic (procedures, triggers, sequences) | Move all logic to TypeScript service layer. No raw SQL except via Prisma. |
| ML server architecture | TS Express wrapper + Python child process (preserve scikit-learn / pandas). |
| Next.js mode | App Router, client components, separate backend (axios → API). |
| Shared packages | `packages/db` (Prisma) + `packages/types` (shared DTOs). |
| SQLite location | Single file in a shared Docker volume, mounted into `api` and `ml`. |
| Data migration | Prisma seed script reads CSVs from `legacy/Table Backup/`. |
| Delivery | Single rewrite. Old code archived under `legacy/`. |
| Package manager | pnpm. |
| Node version | 20 LTS. |

## 3. Repository Layout

```
streamflare/
├── apps/
│   ├── web/              # Next.js 14 (App Router, TS)
│   ├── api/              # Express + TS
│   └── ml/               # Express + TS wrapper + Python ML
├── packages/
│   ├── db/               # Prisma schema, client, migrations, seed
│   └── types/            # Shared TS DTOs
├── legacy/               # Archived old code (backend/, frontend/, ml_model_server/, *.sql, Table Backup/, old README.md)
├── docker/
│   ├── web.Dockerfile
│   ├── api.Dockerfile
│   ├── ml.Dockerfile
│   └── db-init.Dockerfile
├── docs/
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── .env.example
├── .gitignore
└── README.md
```

`pnpm-workspace.yaml` includes `apps/*` and `packages/*`. `legacy/` is **not** a workspace.

## 4. Apps

### 4.1 `apps/api` — Express + TypeScript

**Source layout** (mirrors current backend so each file has a clear new home):

```
apps/api/
├── src/
│   ├── app.ts                  # Express bootstrap, middleware, route mounting
│   ├── routes/
│   │   ├── users.routes.ts
│   │   ├── profile.routes.ts
│   │   ├── browse.routes.ts
│   │   └── subscription.routes.ts
│   ├── controllers/
│   │   ├── users.controller.ts
│   │   ├── profile.controller.ts
│   │   ├── browse.controller.ts
│   │   └── subscription.controller.ts
│   ├── services/
│   │   ├── auth.service.ts            # bcrypt hashing, JWT signing/verifying
│   │   ├── subscription.service.ts    # ports PROCEDURES.sql billing logic
│   │   ├── recommendation.service.ts  # ports cosine_similarity.js to TS
│   │   ├── tmdb.service.ts            # TMDB integration (axios)
│   │   └── env.ts                     # zod-validated env at boot
│   ├── middleware/
│   │   ├── check-auth.ts
│   │   └── error-handler.ts
│   └── models/
│       └── http-error.ts
├── tests/                              # Vitest + supertest smoke tests
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

**Endpoints** ported 1:1 from current backend:
- `/api/users/*` — signup, login, profile management
- `/api/profiles/*` — sub-profile CRUD
- `/api/browse/*` — movies, shows, search, recommendations
- `/api/subscription/*` — plan selection, billing

**Tech:**
- Express 4, `express-validator`, `jsonwebtoken`, `bcryptjs`, `axios`, `zod` (env validation), `cors`.
- DB access exclusively via `@streamflare/db` (Prisma client).
- All Oracle stored-procedure logic re-implemented in `src/services/*.ts`. Triggers (e.g., auto-incrementing `max_profiles`, billing totals) handled in service code or via Prisma `@default` / app-level transactions.

**Dev:** `pnpm dev` → `tsx watch src/app.ts`. **Build:** `tsc`. **Start:** `node dist/app.js`. **Port:** 5000.

### 4.2 `apps/web` — Next.js 14, App Router, TypeScript

**Source layout:**

```
apps/web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                # Home / landing
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── browse/page.tsx
│   ├── profile/page.tsx
│   ├── watch/[id]/page.tsx
│   └── subscription/page.tsx
├── components/                  # ported from frontend/src/components
├── containers/                  # ported, if still used after Next.js refactor
├── context/                     # auth context, etc.
├── hooks/
├── lib/
│   ├── api-client.ts            # axios instance pointing at NEXT_PUBLIC_API_URL
│   └── auth.ts                  # token storage helpers
├── public/                      # static assets from old frontend/public + frontend/src
├── styles/
├── package.json
├── tsconfig.json
├── next.config.js               # output: 'standalone' for Docker
└── vitest.config.ts
```

**Routing mapping** (old react-router → Next.js routes): preserve URL paths from the current app. `react-router-dom` is removed.

**Tech upgrades:**
- `@material-ui/core` v4 → `@mui/material` v5 (v4 is incompatible with React 18 strict mode in Next.js).
- `react-router-dom` removed; Next.js handles routing.
- Retained: `bootstrap`, `reactstrap`, `styled-components`, `axios`, `react-player`, `fuse.js`, `react-select`, `react-country-region-selector`.
- Removed: `react-scripts`, `web-vitals` (use Next's built-in metrics), `material-ui` v0.x package (legacy, unused).

**Components default to `'use client'`** since the app is interactive (player, auth, search). Server components used only for static layout shells.

**Dev:** `pnpm dev` → `next dev -p 3000`. **Build:** `next build`. **Start:** `next start`. **Port:** 3000.

### 4.3 `apps/ml` — Express + TS Wrapper + Python

**Source layout:**

```
apps/ml/
├── src/
│   ├── app.ts                       # Express bootstrap
│   ├── routes/recommend.ts
│   ├── services/
│   │   ├── python-runner.ts         # child_process.spawn wrapper
│   │   └── env.ts
│   └── models/http-error.ts
├── python/
│   ├── recommend.py                 # cleaned port of movie_recommendation_system_*.py
│   ├── requirements.txt             # pandas, scikit-learn, numpy
│   └── README.md
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

**Endpoints:**
- `POST /recommend` — body `{ movieId: number, limit?: number }` → returns recommended movies. Loads movies from shared SQLite via `@streamflare/db`, passes them as stdin JSON to `python/recommend.py`, reads stdout JSON.

**Tech:**
- Express 4, `zod` env validation.
- Python invoked via `child_process.spawn`, NOT `python-shell` + `deasync` (the old approach uses synchronous tricks that block the event loop).
- Python deps installed via `pip install -r python/requirements.txt` in the Docker build.

**Dev:** `pnpm dev` → `tsx watch src/app.ts`. **Port:** 5001.

## 5. Shared Packages

### 5.1 `packages/db`

```
packages/db/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   └── index.ts                 # exports PrismaClient singleton + re-exports types
├── package.json
└── tsconfig.json
```

**`schema.prisma` model decisions** (translating Oracle DDL):

| Old Oracle table | New Prisma model | Notes |
|---|---|---|
| `user_netflix` | `User` | `email` stays `@id`. `dob: DateTime`. `password: String`. `maxProfiles Int @default(0)`. |
| `profile` | `Profile` | Was composite PK `(email, profile_id)`. New: `id Int @id @default(autoincrement())`, with `@@unique([email, profileId])`. The old `PROFILE_ID_SEQ` Oracle sequence is replaced by Prisma autoincrement. |
| `subscription` | `Subscription` | Same composite-PK treatment. Old `SUBSCRIPTION_SUB_ID_SEQ` → Prisma autoincrement. |
| `movie`, `show`, `episode` | `Movie`, `Show`, `Episode` | `VARCHAR2` → `String`, `NUMBER(4,2)` → `Float`, `DATE` → `DateTime`. |
| `celeb`, `genre` | `Celeb`, `Genre` | Straight port. |
| `movie_watch`, `movie_watchlist`, `movie_genre`, `movie_celeb`, `movie_similarity` | Same names in PascalCase | Composite PKs preserved via `@@id([...])`. |
| `show_watch`, `show_watchlist`, `show_genre`, `show_celeb`, `show_similarity`, `episode_watch` | Same | Same treatment. |
| `subscription_type` | `SubscriptionType` | Lookup table. Seeded with BASIC/STANDARD/PREMIUM rows. |

**Datasource:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

`DATABASE_URL` is `file:/data/streamflare.db` in containers, `file:./dev.db` in local dev.

**`prisma/seed.ts`:**
- Reads CSV files from a configurable directory, defaulting to `../../legacy/Table Backup/` (relative to `packages/db/`). The path is overridable via the `SEED_DATA_DIR` env var so the same script works in local dev and inside Docker.
- Parses with `csv-parser` (already a dep of the old backend, carry it over).
- Inserts via `prisma.<model>.upsert(...)` keyed on natural keys — **idempotent**, safe to re-run.
- Skips gracefully if `SEED_DATA_DIR` does not exist (logs a warning and exits 0) — so the seed step never blocks startup in environments without CSV data.
- Run via `prisma db seed` (registered in `package.json`'s `prisma.seed` field).

**`src/index.ts`:**
- Exports a singleton `PrismaClient` instance to avoid connection storms during dev hot-reload.
- Re-exports Prisma-generated types so other packages can import `User`, `Movie`, etc. from `@streamflare/db`.

### 5.2 `packages/types`

```
packages/types/
├── src/
│   ├── index.ts
│   ├── user.ts                  # UserDTO (no password), AuthResponse, SignupRequest, LoginRequest
│   ├── profile.ts               # ProfileDTO, CreateProfileRequest
│   ├── movie.ts                 # MovieDTO, MovieListItem
│   ├── show.ts                  # ShowDTO, EpisodeDTO
│   ├── subscription.ts          # SubscriptionDTO, SubscriptionPlan
│   └── api.ts                   # generic ApiError, Paginated<T>
├── package.json
└── tsconfig.json
```

DTOs are **distinct from Prisma models** — they describe the API contract, never include `password` or other sensitive fields, and use `string` dates (ISO) rather than `Date` (since they cross the wire). Used by all three apps.

## 6. Docker & Orchestration

### 6.1 `docker-compose.yml`

```yaml
services:
  db-init:
    build:
      context: .
      dockerfile: docker/db-init.Dockerfile
    environment:
      DATABASE_URL: file:/data/streamflare.db
    volumes:
      - sqlite-data:/data
    # Runs `prisma migrate deploy && prisma db seed`, then exits.

  api:
    build:
      context: .
      dockerfile: docker/api.Dockerfile
    ports: ["5000:5000"]
    environment:
      DATABASE_URL: file:/data/streamflare.db
      JWT_SECRET: ${JWT_SECRET}
      TMDB_API_KEY: ${TMDB_API_KEY}
      ML_SERVICE_URL: http://ml:5001
    volumes:
      - sqlite-data:/data
    depends_on:
      db-init:
        condition: service_completed_successfully

  ml:
    build:
      context: .
      dockerfile: docker/ml.Dockerfile
    ports: ["5001:5001"]
    environment:
      DATABASE_URL: file:/data/streamflare.db
    volumes:
      - sqlite-data:/data
    depends_on:
      db-init:
        condition: service_completed_successfully

  web:
    build:
      context: .
      dockerfile: docker/web.Dockerfile
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:5000
    depends_on:
      - api

volumes:
  sqlite-data:
```

### 6.2 Dockerfiles

All Dockerfiles are **multi-stage** and use **Turborepo's `prune`** feature to copy only the dependencies relevant to each app, keeping images small.

- **`docker/api.Dockerfile`** — Base: `node:20-alpine`. Stages: `pruner` (uses `turbo prune --scope=api --docker`) → `installer` (`pnpm install --frozen-lockfile`) → `builder` (`pnpm turbo run build --filter=api` + `prisma generate`) → `runner` (copies `dist/`, runs `node dist/app.js`).
- **`docker/web.Dockerfile`** — Same pattern. Uses Next.js `output: 'standalone'` so the runner stage only needs the standalone server + `.next/static`.
- **`docker/ml.Dockerfile`** — Base: `node:20-bookworm-slim` (NOT alpine — Python ML libs need glibc). Installs `python3`, `python3-pip`, runs `pip install -r apps/ml/python/requirements.txt`. Same multi-stage Node build for the TS wrapper.
- **`docker/db-init.Dockerfile`** — Minimal `node:20-alpine` image containing `packages/db` (Prisma schema, migrations, seed script, generated client) plus a copy of `legacy/Table Backup/` at `/seed-data/`. Sets `SEED_DATA_DIR=/seed-data`. Entrypoint: `prisma migrate deploy && prisma db seed`.

### 6.3 `turbo.json`

Pipeline tasks:
- `build` — depends on `^build`. Outputs: `dist/**`, `.next/**` (excluding `.next/cache`), generated Prisma client.
- `dev` — persistent, no cache.
- `lint`, `typecheck` — no outputs.
- `test` — depends on `^build`.
- `db:generate`, `db:migrate` — run in `packages/db`.

Remote caching not configured (out of scope).

### 6.4 Local Development (no Docker)

`pnpm install` at root, then `pnpm dev` runs `turbo run dev`, starting all three apps concurrently:
- `web` on `:3000`
- `api` on `:5000`
- `ml` on `:5001`

SQLite file at `packages/db/dev.db`. First-time setup: `pnpm db:migrate && pnpm db:seed`.

## 7. Testing

Minimal, focused on regression detection during the port:

- **`apps/api`** — Vitest + supertest. One happy-path test per controller (signup, login, list movies, create profile, subscribe). Tests use a real SQLite database at `file::memory:?cache=shared` with migrations applied in `beforeAll`.
- **`apps/web`** — Vitest + React Testing Library. One render-smoke test per top-level page (asserts no crash, key elements present).
- **`apps/ml`** — One integration test that spawns `recommend.py` with fixed input JSON and asserts a non-empty array is returned.

No CI configured. Tests runnable via `pnpm test` (Turbo) locally.

## 8. Tooling

- **ESLint** — root config; `eslint-config-next` for `apps/web`, generic TS config for `apps/api` and `apps/ml`.
- **Prettier** — root `.prettierrc`.
- **TypeScript** — `tsconfig.base.json` at root with `strict: true`; per-app configs extend it.
- **Env validation** — each app validates required env vars at boot using `zod` (`src/services/env.ts`). App fails fast with a clear error if anything is missing.

## 9. Secrets & Env

`.env.example` at root documents:
```
JWT_SECRET=replace-me
TMDB_API_KEY=replace-me
DATABASE_URL=file:./packages/db/dev.db
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Real `.env` is gitignored. Currently-hardcoded secrets in the old backend are moved to env vars during the port.

## 10. Cleanup

The following are moved into `legacy/` (kept in git for reference):
- `backend/`, `frontend/`, `ml_model_server/`
- `DDL.sql`, `PROCEDURES.sql`, `TRIGGERS.sql`
- `Table Backup/`
- Old root `README.md`

A new root `README.md` documents the monorepo: prerequisites, `docker compose up`, `pnpm dev`, env var setup.

`.gitignore` updated for: `node_modules/`, `.next/`, `dist/`, `*.db`, `*.db-journal`, `.env`, `.env.local`, `.turbo/`, `.pnpm-store/`.

## 11. Out of Scope (Explicit Non-Goals)

- New features. Behavior parity only.
- UI redesign. MUI v4 → v5 migration kept minimal (visual changes only where forced).
- CI/CD pipelines.
- Production hardening (rate limiting, HTTPS, observability, structured logging).
- Switching to Postgres later (Prisma makes it a one-line change, but not now).
- Remote Turbo cache.
- Auth provider migration (stays on JWT + bcrypt).

## 12. Success Criteria

The refactor is complete when:

1. `pnpm install && pnpm dev` starts all three apps locally and `localhost:3000` loads the homepage with data.
2. `docker compose up --build` brings up the full stack from a clean checkout; `localhost:3000` works identically.
3. A user can: sign up, log in, create a profile, browse movies, watch a movie, get a recommendation, and manage a subscription — matching current behavior.
4. `pnpm test` passes across all apps.
5. `pnpm typecheck` and `pnpm lint` pass with zero errors.
6. Old code lives in `legacy/`, root contains only the new monorepo structure.
