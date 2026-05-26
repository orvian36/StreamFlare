# StreamFlare

A movie streaming app — refactored from the original Express + React + Oracle codebase into a Turborepo monorepo with three TypeScript apps backed by SQLite via Prisma. Optionally deployable as four containers via `docker compose`.

## Apps

| App | Stack | Port |
|---|---|---|
| `apps/web` | Next.js 14 (App Router) + MUI v5 | 3000 |
| `apps/api` | Express 4 + TypeScript + Prisma | 5000 |
| `apps/ml`  | Express + TypeScript wrapper around a Python (scikit-learn) recommendation script | 5001 |

## Shared Packages

- `packages/db` — Prisma schema, generated client, migrations, and seed
- `packages/types` — Shared TypeScript DTOs for API request/response shapes

## Quick Start (Docker)

Requires Docker Desktop.

```sh
cp .env.example .env
# Edit .env: set JWT_SECRET and TMDB_API_KEY to real values
docker compose up --build
```

Then open <http://localhost:3000>.

The compose stack runs four services:
- `db-init` — applies migrations and seeds the SQLite volume, then exits
- `api` — Express API (depends on db-init)
- `ml`  — recommendation service (depends on db-init)
- `web` — Next.js frontend (depends on api)

Data lives in the `sqlite-data` named volume so it survives container restarts.

## Local Development (no Docker)

Requires Node 20, pnpm 9, and Python 3.10+.

```sh
pnpm install
pip install -r apps/ml/python/requirements.txt
cp .env.example .env
# Edit .env — set DATABASE_URL to an absolute path, see comment in the file
```

First-time database setup:

```sh
pnpm db:migrate
pnpm db:seed
```

Run all three apps in parallel:

```sh
pnpm dev
```

| App | URL |
|---|---|
| web | <http://localhost:3000> |
| api | <http://localhost:5000> |
| ml  | <http://localhost:5001> |

## Scripts

| Script | Effect |
|---|---|
| `pnpm dev` | Run web, api, and ml in dev mode (parallel) |
| `pnpm build` | Build all apps |
| `pnpm typecheck` | TypeScript check across the monorepo |
| `pnpm test` | Run all tests |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm db:migrate` | Create + apply a new migration |
| `pnpm db:migrate:deploy` | Apply existing migrations (for production / Docker) |
| `pnpm db:seed` | Seed SQLite from legacy JSON exports |
| `pnpm db:studio` | Open Prisma Studio |

## Environment Variables

See `.env.example`. Notable ones:

- `DATABASE_URL` — SQLite file. For local dev use an absolute path because Prisma resolves relative paths from the cwd of whichever app is running.
- `JWT_SECRET` — required by the API (min 16 chars)
- `TMDB_API_KEY` — required by the API
- `NEXT_PUBLIC_API_URL` — base URL the web app calls (defaults to `http://localhost:5000`)
- `ML_SERVICE_URL` — base URL the API uses to reach the ML server (defaults to `http://localhost:5001`)

## Tests

- `apps/api/tests/smoke.test.ts` — 8 supertest cases hitting a fresh SQLite DB
- `apps/ml/tests/recommend.test.ts` — 2 integration tests that actually spawn Python

```sh
pnpm test
```

## Original Project

The original Oracle/React/JavaScript codebase is preserved under [`legacy/`](./legacy/) for reference. The original README is at [`legacy/README.md`](./legacy/README.md).

## License

MIT
