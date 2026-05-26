# StreamFlare Monorepo Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor StreamFlare (Express + React + Oracle, all JavaScript) into a Turborepo monorepo with three TypeScript apps — Next.js web, Express API, Express+Python ML — backed by SQLite via Prisma, all containerized via `docker-compose`.

**Architecture:** pnpm-managed Turborepo with `apps/{web,api,ml}` and `packages/{db,types}`. Old code archived under `legacy/`. Single shared SQLite file in a Docker volume mounted into `api` and `ml`. Behavior parity with the current app — no new features, no UI redesign.

**Tech Stack:** pnpm + Turborepo, TypeScript strict mode, Next.js 14 App Router + MUI v5, Express 4, Prisma + SQLite, scikit-learn (Python) via `child_process.spawn`, Vitest, Docker multi-stage builds with Turbo prune.

**Spec:** `docs/superpowers/specs/2026-05-26-streamflare-monorepo-refactor-design.md`

---

## Conventions for All Tasks

- **Run from repo root** unless stated otherwise.
- **PowerShell** is the default shell. Use forward slashes in paths inside config files; PowerShell handles them fine.
- **TDD where it makes sense.** Scaffolding tasks don't have failing tests to write; service-layer tasks do.
- **Commit at the end of every task.** Conventional commit messages: `feat(scope): ...`, `refactor(scope): ...`, `chore: ...`.
- **Source-file mapping convention:** for porting tasks, the source file is referenced as `legacy/backend/...` or `legacy/frontend/...` (after Task 1 moves them). Pre-Task 1, the same files live at `backend/...` and `frontend/...`.
- **Type-check after every task:** `pnpm typecheck`. Must pass before committing.

---

## Phase 1 — Foundation

### Task 1: Archive Legacy Code

**Files:**
- Create: `legacy/` directory
- Move: `backend/`, `frontend/`, `ml_model_server/`, `Table Backup/`, `DDL.sql`, `PROCEDURES.sql`, `TRIGGERS.sql`, `README.md` → into `legacy/`

- [ ] **Step 1: Create the `legacy/` directory**

```powershell
New-Item -ItemType Directory -Path legacy
```

- [ ] **Step 2: Move old code into `legacy/`**

Use `git mv` so history is preserved:

```powershell
git mv backend legacy/backend
git mv frontend legacy/frontend
git mv ml_model_server legacy/ml_model_server
git mv "Table Backup" "legacy/Table Backup"
git mv DDL.sql legacy/DDL.sql
git mv PROCEDURES.sql legacy/PROCEDURES.sql
git mv TRIGGERS.sql legacy/TRIGGERS.sql
git mv README.md legacy/README.md
```

- [ ] **Step 3: Verify the move**

```powershell
git status
```

Expected: shows renames (R) for each moved file, no untracked content at repo root.

- [ ] **Step 4: Commit**

```powershell
git commit -m "chore: archive legacy code into legacy/"
```

---

### Task 2: Monorepo Root Scaffolding

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore`, `.env.example`, `.nvmrc`, `.npmrc`

- [ ] **Step 1: Verify pnpm is installed**

```powershell
pnpm --version
```

Expected: prints a version `>= 9.0.0`. If not, install: `npm install -g pnpm`.

- [ ] **Step 2: Create `.nvmrc`**

```
20
```

- [ ] **Step 3: Create `.npmrc`**

```
auto-install-peers=true
shamefully-hoist=false
```

- [ ] **Step 4: Create root `package.json`**

```json
{
  "name": "streamflare",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "db:generate": "pnpm --filter @streamflare/db exec prisma generate",
    "db:migrate": "pnpm --filter @streamflare/db exec prisma migrate dev",
    "db:migrate:deploy": "pnpm --filter @streamflare/db exec prisma migrate deploy",
    "db:seed": "pnpm --filter @streamflare/db exec prisma db seed",
    "db:studio": "pnpm --filter @streamflare/db exec prisma studio"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0",
    "prettier": "^3.2.0",
    "@types/node": "^20.12.0"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  }
}
```

- [ ] **Step 5: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 6: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env", "tsconfig.base.json"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "db:generate": {
      "cache": false
    }
  }
}
```

- [ ] **Step 7: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true
  }
}
```

- [ ] **Step 8: Create `.gitignore`**

```
node_modules/
.pnpm-store/
.turbo/
dist/
build/
.next/
out/

*.db
*.db-journal

.env
.env.local
.env.*.local
!.env.example

.DS_Store
*.log
.vscode/
.idea/

coverage/
*.tsbuildinfo
```

- [ ] **Step 9: Create `.env.example`**

```
# Database
DATABASE_URL=file:./packages/db/dev.db

# API
JWT_SECRET=replace-me-with-a-long-random-string
TMDB_API_KEY=replace-me-with-your-tmdb-key

# Web
NEXT_PUBLIC_API_URL=http://localhost:5000

# ML Service URL (used by API to call ML)
ML_SERVICE_URL=http://localhost:5001
```

- [ ] **Step 9b: Create root `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 10: Install root dev deps**

```powershell
pnpm install
```

Expected: creates `pnpm-lock.yaml` and `node_modules/`.

- [ ] **Step 11: Commit**

```powershell
git add .
git commit -m "chore: scaffold monorepo root (pnpm workspaces, turbo, tsconfig)"
```

---

### Task 3: `packages/types`

**Files:**
- Create: `packages/types/package.json`, `tsconfig.json`, `src/{index,user,profile,movie,show,subscription,api}.ts`

- [ ] **Step 1: Create `packages/types/package.json`**

```json
{
  "name": "@streamflare/types",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create `packages/types/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create `packages/types/src/user.ts`**

```typescript
export interface UserDTO {
  name: string;
  email: string;
  dob: string;
  country: string;
  phone: string | null;
  joined: string;
  maxProfiles: number;
}

export interface SignupRequest {
  NAME: string;
  EMAIL: string;
  DOB: string;
  COUNTRY: string;
  CREDIT_CARD: string;
  PASSWORD: string;
  PHONE?: string;
}

export interface LoginRequest {
  EMAIL: string;
  PASSWORD: string;
}

export interface AuthResponse {
  EMAIL: string;
  token: string;
}

export interface UpdatePhoneRequest {
  EMAIL: string;
  Phone: string;
}

export interface UpdatePasswordRequest {
  EMAIL: string;
  OLD_PASS: string;
  NEW_PASS: string;
  NEW_PASS_CON: string;
}

export interface MovieWatchHistoryItem {
  RATING: number | null;
  WATCHED_UPTO: number;
  TITLE: string;
  TIME: string;
  IMAGE_URL: string;
  PID?: string;
}

export interface ShowWatchHistoryItem {
  TITLE: string;
  RATING: number | null;
  SEASON_NO: number;
  EPISODE_NO: number;
  WATCHED_UPTO: number;
  PID?: string;
}
```

- [ ] **Step 4: Create `packages/types/src/profile.ts`**

```typescript
export interface ProfileDTO {
  profileId: string;
  email: string;
  dob: string;
}

export interface CreateProfileRequest {
  EMAIL: string;
  PROFILE_ID: string;
  DOB: string;
}

export interface UpdateProfileRequest {
  EMAIL: string;
  OLD_PROFILE_ID: string;
  NEW_PROFILE_ID: string;
}

export interface DeleteProfileRequest {
  EMAIL: string;
  PROFILE_ID: string;
}
```

- [ ] **Step 5: Create `packages/types/src/movie.ts`**

```typescript
export interface MovieDTO {
  MOVIE_ID: number;
  TITLE: string;
  COUNTRY: string | null;
  RATING: number;
  TOTAL_VIEWS: number;
  TOTAL_VOTES: number;
  DESCRIPTION: string | null;
  IMAGE_URL: string | null;
  VIDEO_URL: string | null;
  LENGTH: number;
  LANGUAGE: string | null;
  PRICE: number;
  MATURITY_RATING: string | null;
  RELEASE_DATE: string;
}

export interface MovieListItem {
  MOVIE_ID: number;
  TITLE: string;
  IMAGE_URL: string | null;
  RATING: number;
}
```

- [ ] **Step 6: Create `packages/types/src/show.ts`**

```typescript
export interface ShowDTO {
  SHOW_ID: number;
  TITLE: string;
  START_DATE: string | null;
  END_DATE: string | null;
  COUNTRY: string | null;
  RATING: number;
  TOTAL_VIEWS: number;
  TOTAL_VOTES: number;
  DESCRIPTION: string | null;
  IMAGE_URL: string | null;
  VIDEO_URL: string | null;
  LENGTH: number;
  LANGUAGE: string | null;
  SEASONS: number;
  EPISODES: number;
  PRICE: number;
  MATURITY_RATING: string | null;
}

export interface EpisodeDTO {
  SEASON_NO: number;
  EPISODE_NO: number;
  SHOW_ID: number;
  TITLE: string | null;
  DESCRIPTION: string | null;
  LENGTH: number | null;
  IMAGE_URL: string | null;
  VIDEO_URL: string | null;
}
```

- [ ] **Step 7: Create `packages/types/src/subscription.ts`**

```typescript
export interface SubscriptionPlan {
  SUB_TYPE: string;
  BILL: number;
  NUM_PROFILES: number;
}

export interface SubscriptionDTO {
  SUB_ID: number;
  SUB_TYPE: string;
  EMAIL: string;
  START_DATE: string;
  END_DATE: string;
  BILL: number;
  TOTAL_BILL: number;
  RUNNING: number | null;
  TERMINATION_DATE: string | null;
}

export interface AddSubscriptionRequest {
  EMAIL: string;
  SUB_TYPE: string;
  END_DATE: string;
}
```

- [ ] **Step 8: Create `packages/types/src/api.ts`**

```typescript
export interface ApiError {
  message: string;
  code?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

- [ ] **Step 9: Create `packages/types/src/index.ts`**

```typescript
export * from "./user.js";
export * from "./profile.js";
export * from "./movie.js";
export * from "./show.js";
export * from "./subscription.js";
export * from "./api.js";
```

- [ ] **Step 10: Install and typecheck**

```powershell
pnpm install
pnpm --filter @streamflare/types typecheck
```

Expected: typecheck passes with no output.

- [ ] **Step 11: Commit**

```powershell
git add .
git commit -m "feat(types): add @streamflare/types shared DTO package"
```

---

### Task 4: `packages/db` — Prisma Schema and Client

**Files:**
- Create: `packages/db/package.json`, `tsconfig.json`, `src/index.ts`, `prisma/schema.prisma`

- [ ] **Step 1: Create `packages/db/package.json`**

```json
{
  "name": "@streamflare/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "prisma generate",
    "typecheck": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.14.0"
  },
  "devDependencies": {
    "prisma": "^5.14.0",
    "tsx": "^4.7.0",
    "csv-parser": "^3.0.0",
    "typescript": "^5.4.0",
    "@types/node": "^20.12.0"
  }
}
```

- [ ] **Step 2: Create `packages/db/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src/**/*", "prisma/**/*.ts"]
}
```

- [ ] **Step 3: Create `packages/db/prisma/schema.prisma`**

This is a TypeScript-friendly port of `legacy/DDL.sql`. Key conversions: `VARCHAR2`→`String`, `NUMBER(p,s)`→`Float`, `INTEGER`→`Int`, `DATE`→`DateTime`. Composite PKs use `@@id([...])`. Oracle sequences (PROFILE_ID_SEQ, SUBSCRIPTION_SUB_ID_SEQ) replaced by Prisma `@default(autoincrement())`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  email       String   @id
  name        String
  dob         DateTime
  country     String
  creditCard  String   @map("credit_card")
  password    String
  phone       String?
  joined      DateTime @default(now())
  maxProfiles Int      @default(0) @map("max_profiles")

  profiles      Profile[]
  subscriptions Subscription[]

  @@map("user_netflix")
}

model Profile {
  id        Int    @id @default(autoincrement())
  profileId String @map("profile_id")
  email     String
  dob       DateTime

  user             User              @relation(fields: [email], references: [email], onDelete: Cascade)
  movieWatches     MovieWatch[]
  movieWatchlists  MovieWatchlist[]
  showWatches      ShowWatch[]
  showWatchlists   ShowWatchlist[]
  episodeWatches   EpisodeWatch[]

  @@unique([email, profileId])
  @@map("profile")
}

model Subscription {
  subId           Int       @id @default(autoincrement()) @map("sub_id")
  subType         String    @map("sub_type")
  email           String
  startDate       DateTime  @default(now()) @map("start_date")
  endDate         DateTime  @map("end_date")
  bill            Float     @default(0)
  totalBill       Float     @default(0) @map("total_bill")
  running         Int?
  terminationDate DateTime? @map("termination_date")

  user User @relation(fields: [email], references: [email], onDelete: Cascade)

  @@map("subscription")
}

model SubscriptionType {
  subType     String @id @map("sub_type")
  bill        Float
  numProfiles Int    @map("num_profiles")

  @@map("subscription_type")
}

model Movie {
  movieId        Int      @id @map("movie_id")
  title          String
  country        String?
  rating         Float    @default(0)
  totalViews     Int      @default(0) @map("total_views")
  totalVotes     Int      @default(0) @map("total_votes")
  description    String?
  imageUrl       String?  @map("image_url")
  videoUrl       String?  @map("video_url")
  length         Float    @default(0)
  language       String?
  price          Float    @default(0)
  maturityRating String?  @map("maturity_rating")
  releaseDate    DateTime @map("release_date")

  watches      MovieWatch[]
  watchlists   MovieWatchlist[]
  genres       MovieGenre[]
  celebs       MovieCeleb[]
  similarFrom  MovieSimilarity[] @relation("MovieSimilarFrom")
  similarTo    MovieSimilarity[] @relation("MovieSimilarTo")

  @@map("movie")
}

model Show {
  showId         Int       @id @map("show_id")
  title          String
  startDate      DateTime? @map("start_date")
  endDate        DateTime? @map("end_date")
  country        String?
  rating         Float     @default(0)
  totalViews     Int       @default(0) @map("total_views")
  totalVotes     Int       @default(0) @map("total_votes")
  description    String?
  imageUrl       String?   @map("image_url")
  videoUrl       String?   @map("video_url")
  length         Float     @default(0)
  language       String?
  seasons        Int       @default(0)
  episodes       Int       @default(0)
  price          Float     @default(0)
  maturityRating String?   @map("maturity_rating")

  episodeList    Episode[]
  watches        ShowWatch[]
  watchlists     ShowWatchlist[]
  genres         ShowGenre[]
  celebs         ShowCeleb[]
  similarFrom    ShowSimilarity[] @relation("ShowSimilarFrom")
  similarTo      ShowSimilarity[] @relation("ShowSimilarTo")

  @@map("show")
}

model Episode {
  seasonNo    Int     @map("season_no")
  episodeNo   Int     @map("episode_no")
  showId      Int     @map("show_id")
  title       String?
  description String?
  length      Float?
  imageUrl    String? @map("image_url")
  videoUrl    String? @map("video_url")

  show           Show           @relation(fields: [showId], references: [showId])
  episodeWatches EpisodeWatch[]

  @@id([seasonNo, episodeNo, showId])
  @@map("episode")
}

model Celeb {
  celebId  Int    @id @map("celeb_id")
  name     String?
  contents Int    @default(0)

  movies MovieCeleb[]
  shows  ShowCeleb[]

  @@map("celeb")
}

model Genre {
  genreId  Int    @id @map("genre_id")
  name     String?
  contents Int    @default(0)

  movies MovieGenre[]
  shows  ShowGenre[]

  @@map("genre")
}

model MovieWatch {
  movieId     Int      @map("movie_id")
  profileId   String   @map("profile_id")
  email       String
  rating      Int?
  watchedUpto Float    @default(0) @map("watched_upto")
  time        DateTime @default(now())

  movie   Movie   @relation(fields: [movieId], references: [movieId])
  profile Profile @relation(fields: [email, profileId], references: [email, profileId])

  @@id([movieId, email, profileId])
  @@map("movie_watch")
}

model MovieWatchlist {
  movieId   Int    @map("movie_id")
  email     String
  profileId String @map("profile_id")

  movie   Movie   @relation(fields: [movieId], references: [movieId])
  profile Profile @relation(fields: [email, profileId], references: [email, profileId])

  @@id([movieId, email, profileId])
  @@map("movie_watchlist")
}

model MovieGenre {
  movieId Int @map("movie_id")
  genreId Int @map("genre_id")

  movie Movie @relation(fields: [movieId], references: [movieId])
  genre Genre @relation(fields: [genreId], references: [genreId])

  @@id([movieId, genreId])
  @@map("movie_genre")
}

model MovieCeleb {
  movieId Int    @map("movie_id")
  celebId Int    @map("celeb_id")
  role    String?

  movie Movie @relation(fields: [movieId], references: [movieId])
  celeb Celeb @relation(fields: [celebId], references: [celebId])

  @@id([movieId, celebId])
  @@map("movie_celeb")
}

model MovieSimilarity {
  movieId1 Int   @map("movie_id1")
  movieId2 Int   @map("movie_id2")
  score    Float

  movie1 Movie @relation("MovieSimilarFrom", fields: [movieId1], references: [movieId])
  movie2 Movie @relation("MovieSimilarTo",   fields: [movieId2], references: [movieId])

  @@id([movieId1, movieId2])
  @@map("movie_similarity")
}

model ShowWatch {
  profileId   String   @map("profile_id")
  email       String
  showId      Int      @map("show_id")
  rating      Int?
  status      String?
  watchedUpto Float    @default(0) @map("watched_upto")
  time        DateTime @default(now())

  show    Show    @relation(fields: [showId], references: [showId])
  profile Profile @relation(fields: [email, profileId], references: [email, profileId])

  @@id([profileId, showId, email])
  @@map("show_watch")
}

model ShowWatchlist {
  profileId String @map("profile_id")
  showId    Int    @map("show_id")
  email     String

  show    Show    @relation(fields: [showId], references: [showId])
  profile Profile @relation(fields: [email, profileId], references: [email, profileId])

  @@id([showId, profileId, email])
  @@map("show_watchlist")
}

model ShowGenre {
  showId  Int @map("show_id")
  genreId Int @map("genre_id")

  show  Show  @relation(fields: [showId], references: [showId])
  genre Genre @relation(fields: [genreId], references: [genreId])

  @@id([showId, genreId])
  @@map("show_genre")
}

model ShowCeleb {
  showId  Int    @map("show_id")
  celebId Int    @map("celeb_id")
  role    String?

  show  Show  @relation(fields: [showId], references: [showId])
  celeb Celeb @relation(fields: [celebId], references: [celebId])

  @@id([showId, celebId])
  @@map("show_celeb")
}

model ShowSimilarity {
  showId1 Int   @map("show_id1")
  showId2 Int   @map("show_id2")
  score   Float

  show1 Show @relation("ShowSimilarFrom", fields: [showId1], references: [showId])
  show2 Show @relation("ShowSimilarTo",   fields: [showId2], references: [showId])

  @@id([showId1, showId2])
  @@map("show_similarity")
}

model EpisodeWatch {
  profileId   String   @map("profile_id")
  email       String
  seasonNo    Int      @map("season_no")
  episodeNo   Int      @map("episode_no")
  showId      Int      @map("show_id")
  status      String?
  watchedUpto Float    @default(0) @map("watched_upto")
  time        DateTime @default(now())

  episode Episode @relation(fields: [seasonNo, episodeNo, showId], references: [seasonNo, episodeNo, showId])
  profile Profile @relation(fields: [email, profileId], references: [email, profileId])

  @@id([profileId, seasonNo, showId, episodeNo, email])
  @@map("episode_watch")
}
```

- [ ] **Step 4: Create `packages/db/src/index.ts`**

Singleton Prisma client (avoids connection storms in dev hot-reload):

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
```

- [ ] **Step 5: Install deps and generate the client**

```powershell
pnpm install
$env:DATABASE_URL = "file:./dev.db"
pnpm --filter @streamflare/db db:generate
```

Expected: prints "Generated Prisma Client" with no errors.

- [ ] **Step 6: Create the initial migration**

```powershell
$env:DATABASE_URL = "file:./dev.db"
pnpm --filter @streamflare/db exec prisma migrate dev --name init
```

Expected: creates `packages/db/prisma/migrations/<timestamp>_init/migration.sql` and `packages/db/dev.db`.

- [ ] **Step 7: Verify**

```powershell
pnpm --filter @streamflare/db typecheck
```

Expected: passes.

- [ ] **Step 8: Commit**

```powershell
git add .
git commit -m "feat(db): add Prisma schema, client, and initial SQLite migration"
```

---

### Task 5: `packages/db` — Seed Script

**Files:**
- Create: `packages/db/prisma/seed.ts`

The seed reads CSVs from `legacy/Table Backup/` (configurable via `SEED_DATA_DIR`). It must be idempotent (`upsert`) and skip gracefully if the directory does not exist.

- [ ] **Step 1: Inspect available CSVs**

```powershell
Get-ChildItem "legacy/Table Backup" -Recurse -File | Select-Object Name
```

Expected: list of CSV files matching Oracle table names (e.g., `USER_NETFLIX.csv`, `MOVIE.csv`, `SHOW.csv`, etc.).

- [ ] **Step 2: Create `packages/db/prisma/seed.ts`**

```typescript
import { PrismaClient } from "@prisma/client";
import { existsSync, createReadStream } from "node:fs";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import csvParser from "csv-parser";

const prisma = new PrismaClient();

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const SEED_DATA_DIR =
  process.env.SEED_DATA_DIR ?? resolve(__dirname, "../../../legacy/Table Backup");

type Row = Record<string, string>;

function readCsv(path: string): Promise<Row[]> {
  return new Promise((resolveP, rejectP) => {
    const rows: Row[] = [];
    createReadStream(path)
      .pipe(csvParser())
      .on("data", (row: Row) => rows.push(row))
      .on("end", () => resolveP(rows))
      .on("error", rejectP);
  });
}

function findCsv(name: string): string | null {
  if (!existsSync(SEED_DATA_DIR)) return null;
  const file = readdirSync(SEED_DATA_DIR).find(
    (f) => f.toLowerCase() === `${name.toLowerCase()}.csv`,
  );
  return file ? join(SEED_DATA_DIR, file) : null;
}

function parseDate(v: string | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function parseInt0(v: string | undefined): number {
  const n = Number(v);
  return isFinite(n) ? Math.trunc(n) : 0;
}

function parseFloat0(v: string | undefined): number {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

async function seedSubscriptionTypes() {
  const plans = [
    { subType: "BASIC", bill: 5, numProfiles: 2 },
    { subType: "STANDARD", bill: 8, numProfiles: 4 },
    { subType: "PREMIUM", bill: 10, numProfiles: 6 },
  ];
  for (const p of plans) {
    await prisma.subscriptionType.upsert({
      where: { subType: p.subType },
      create: p,
      update: p,
    });
  }
  console.log("  seeded subscription_type (3 plans)");
}

async function seedTable(
  csvName: string,
  rowsToData: (rows: Row[]) => Array<{ where: object; create: object; update: object }>,
  model: { upsert: (args: { where: object; create: object; update: object }) => Promise<unknown> },
) {
  const path = findCsv(csvName);
  if (!path) {
    console.log(`  skip ${csvName} (no CSV)`);
    return;
  }
  const rows = await readCsv(path);
  const records = rowsToData(rows);
  for (const r of records) {
    await model.upsert(r);
  }
  console.log(`  seeded ${csvName} (${records.length} rows)`);
}

async function main() {
  if (!existsSync(SEED_DATA_DIR)) {
    console.warn(`SEED_DATA_DIR not found: ${SEED_DATA_DIR} — skipping CSV seed`);
    await seedSubscriptionTypes();
    return;
  }

  console.log(`Seeding from ${SEED_DATA_DIR}`);
  await seedSubscriptionTypes();

  await seedTable(
    "USER_NETFLIX",
    (rows) =>
      rows.map((r) => {
        const data = {
          email: r.EMAIL,
          name: r.NAME,
          dob: parseDate(r.DOB) ?? new Date("1970-01-01"),
          country: r.COUNTRY?.trim() ?? "",
          creditCard: r.CREDIT_CARD ?? "",
          password: r.PASSWORD,
          phone: r.PHONE || null,
          joined: parseDate(r.JOINED) ?? new Date(),
          maxProfiles: parseInt0(r.MAX_PROFILES),
        };
        return { where: { email: data.email }, create: data, update: data };
      }),
    prisma.user,
  );

  await seedTable(
    "MOVIE",
    (rows) =>
      rows.map((r) => {
        const data = {
          movieId: parseInt0(r.MOVIE_ID),
          title: r.TITLE,
          country: r.COUNTRY?.trim() || null,
          rating: parseFloat0(r.RATING),
          totalViews: parseInt0(r.TOTAL_VIEWS),
          totalVotes: parseInt0(r.TOTAL_VOTES),
          description: r.DESCRIPTION || null,
          imageUrl: r.IMAGE_URL || null,
          videoUrl: r.VIDEO_URL || null,
          length: parseFloat0(r.LENGTH),
          language: r.LANGUAGE || null,
          price: parseFloat0(r.PRICE),
          maturityRating: r.MATURITY_RATING || null,
          releaseDate: parseDate(r.RELEASE_DATE) ?? new Date("1970-01-01"),
        };
        return { where: { movieId: data.movieId }, create: data, update: data };
      }),
    prisma.movie,
  );

  await seedTable(
    "SHOW",
    (rows) =>
      rows.map((r) => {
        const data = {
          showId: parseInt0(r.SHOW_ID),
          title: r.TITLE,
          startDate: parseDate(r.START_DATE),
          endDate: parseDate(r.END_DATE),
          country: r.COUNTRY?.trim() || null,
          rating: parseFloat0(r.RATING),
          totalViews: parseInt0(r.TOTAL_VIEWS),
          totalVotes: parseInt0(r.TOTAL_VOTES),
          description: r.DESCRIPTION || null,
          imageUrl: r.IMAGE_URL || null,
          videoUrl: r.VIDEO_URL || null,
          length: parseFloat0(r.LENGTH),
          language: r.LANGUAGE || null,
          seasons: parseInt0(r.SEASONS),
          episodes: parseInt0(r.EPISODES),
          price: parseFloat0(r.PRICE),
          maturityRating: r.MATURITY_RATING || null,
        };
        return { where: { showId: data.showId }, create: data, update: data };
      }),
    prisma.show,
  );

  await seedTable(
    "GENRE",
    (rows) =>
      rows.map((r) => {
        const data = {
          genreId: parseInt0(r.GENRE_ID),
          name: r.NAME ?? null,
          contents: parseInt0(r.CONTENTS),
        };
        return { where: { genreId: data.genreId }, create: data, update: data };
      }),
    prisma.genre,
  );

  await seedTable(
    "CELEB",
    (rows) =>
      rows.map((r) => {
        const data = {
          celebId: parseInt0(r.CELEB_ID),
          name: r.NAME ?? null,
          contents: parseInt0(r.CONTENTS),
        };
        return { where: { celebId: data.celebId }, create: data, update: data };
      }),
    prisma.celeb,
  );

  // Join/relation tables — only seed if both sides exist
  await seedTable(
    "MOVIE_GENRE",
    (rows) =>
      rows.map((r) => {
        const movieId = parseInt0(r.MOVIE_ID);
        const genreId = parseInt0(r.GENRE_ID);
        return {
          where: { movieId_genreId: { movieId, genreId } },
          create: { movieId, genreId },
          update: {},
        };
      }),
    prisma.movieGenre,
  );

  await seedTable(
    "MOVIE_CELEB",
    (rows) =>
      rows.map((r) => {
        const movieId = parseInt0(r.MOVIE_ID);
        const celebId = parseInt0(r.CELEB_ID);
        return {
          where: { movieId_celebId: { movieId, celebId } },
          create: { movieId, celebId, role: r.ROLE || null },
          update: { role: r.ROLE || null },
        };
      }),
    prisma.movieCeleb,
  );

  await seedTable(
    "SHOW_GENRE",
    (rows) =>
      rows.map((r) => {
        const showId = parseInt0(r.SHOW_ID);
        const genreId = parseInt0(r.GENRE_ID);
        return {
          where: { showId_genreId: { showId, genreId } },
          create: { showId, genreId },
          update: {},
        };
      }),
    prisma.showGenre,
  );

  await seedTable(
    "SHOW_CELEB",
    (rows) =>
      rows.map((r) => {
        const showId = parseInt0(r.SHOW_ID);
        const celebId = parseInt0(r.CELEB_ID);
        return {
          where: { showId_celebId: { showId, celebId } },
          create: { showId, celebId, role: r.ROLE || null },
          update: { role: r.ROLE || null },
        };
      }),
    prisma.showCeleb,
  );

  await seedTable(
    "EPISODE",
    (rows) =>
      rows.map((r) => {
        const showId = parseInt0(r.SHOW_ID);
        const seasonNo = parseInt0(r.SEASON_NO);
        const episodeNo = parseInt0(r.EPISODE_NO);
        const data = {
          showId,
          seasonNo,
          episodeNo,
          title: r.TITLE || null,
          description: r.DESCRIPTION || null,
          length: r.LENGTH ? parseFloat0(r.LENGTH) : null,
          imageUrl: r.IMAGE_URL || null,
          videoUrl: r.VIDEO_URL || null,
        };
        return {
          where: { seasonNo_episodeNo_showId: { seasonNo, episodeNo, showId } },
          create: data,
          update: data,
        };
      }),
    prisma.episode,
  );

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 3: Run the seed**

```powershell
$env:DATABASE_URL = "file:./dev.db"
pnpm --filter @streamflare/db db:seed
```

Expected: prints "Seeded subscription_type (3 plans)" plus per-table counts (or "skip" if a CSV is missing). No exceptions.

- [ ] **Step 4: Verify data with Prisma Studio (optional)**

```powershell
$env:DATABASE_URL = "file:./packages/db/dev.db"
pnpm db:studio
```

Open the URL printed, confirm tables are populated. Close the studio with Ctrl+C.

- [ ] **Step 5: Commit**

```powershell
git add .
git commit -m "feat(db): add idempotent Prisma seed script for legacy CSV data"
```

---

## Phase 2 — API

### Task 6: `apps/api` Skeleton

**Files:**
- Create: `apps/api/package.json`, `tsconfig.json`, `src/app.ts`, `src/services/env.ts`, `src/models/http-error.ts`, `src/middleware/{check-auth.ts,error-handler.ts}`

- [ ] **Step 1: Create `apps/api/package.json`**

```json
{
  "name": "@streamflare/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "echo 'no lint configured'"
  },
  "dependencies": {
    "@streamflare/db": "workspace:*",
    "@streamflare/types": "workspace:*",
    "axios": "^1.6.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.12.0",
    "@types/supertest": "^6.0.2",
    "supertest": "^7.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create `apps/api/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": false
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create `apps/api/src/services/env.ts`**

```typescript
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  TMDB_API_KEY: z.string().min(1),
  ML_SERVICE_URL: z.string().url().default("http://localhost:5001"),
  PORT: z.coerce.number().default(5000),
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 4: Create `apps/api/src/models/http-error.ts`**

```typescript
export class HttpError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}
```

- [ ] **Step 5: Create `apps/api/src/middleware/check-auth.ts`**

```typescript
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../models/http-error.js";
import { env } from "../services/env.js";

declare global {
  namespace Express {
    interface Request {
      userData?: { EMAIL: string };
    }
  }
}

export function checkAuth(req: Request, _res: Response, next: NextFunction) {
  if (req.method === "OPTIONS") return next();
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("Authentication failed!");
    const decoded = jwt.verify(token, env.JWT_SECRET) as { EMAIL: string };
    req.userData = { EMAIL: decoded.EMAIL };
    next();
  } catch {
    next(new HttpError("Authentication failed!", 401));
  }
}
```

- [ ] **Step 6: Create `apps/api/src/middleware/error-handler.ts`**

```typescript
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../models/http-error.js";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError("Could not find this route", 404));
}

export function errorHandler(
  err: Error & { code?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (res.headersSent) return;
  res.status(err.code ?? 500).json({ message: err.message ?? "An unknown error occurred" });
}
```

- [ ] **Step 7: Create `apps/api/src/app.ts`**

```typescript
import express from "express";
import cors from "cors";
import { env } from "./services/env.js";
import { notFound, errorHandler } from "./middleware/error-handler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  console.log(req.method, req.url);
  next();
});

// Route mounts added in Tasks 7–10:
// app.use("/api/users", usersRouter);
// app.use("/api/profiles", profileRouter);
// app.use("/api/browse", browseRouter);
// app.use("/api/subscription", subscriptionRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API listening on :${env.PORT}`);
});
```

- [ ] **Step 8: Install and typecheck**

```powershell
pnpm install
pnpm --filter @streamflare/api typecheck
```

Expected: typecheck passes.

- [ ] **Step 9: Smoke-test the server boots**

```powershell
$env:DATABASE_URL = "file:./packages/db/dev.db"
$env:JWT_SECRET = "this-is-a-dev-secret-min-16-chars"
$env:TMDB_API_KEY = "dummy"
pnpm --filter @streamflare/api dev
```

Expected: prints "API listening on :5000". Stop with Ctrl+C.

- [ ] **Step 10: Commit**

```powershell
git add .
git commit -m "feat(api): scaffold Express + TS skeleton with env, error handling, auth middleware"
```

---

### Task 7: Port Users Routes

**Files:**
- Create: `apps/api/src/routes/users.routes.ts`, `apps/api/src/controllers/users.controller.ts`, `apps/api/src/services/auth.service.ts`
- Modify: `apps/api/src/app.ts` (mount the router)

**Source:** `legacy/backend/controllers/users-controller.js` and `legacy/backend/routes/users-routes.js`.

**Porting rules** (apply to every controller in Tasks 7–10):

| Legacy pattern | New pattern |
|---|---|
| `const x = require('y')` | `import x from "y"` or `import { x } from "y"` |
| `module.exports = {...}` / `exports.x = ...` | `export const x = ...` |
| `database.simpleExecute("SELECT * FROM USER_NETFLIX")` | `prisma.user.findMany(...)` |
| `database.simpleExecute("INSERT INTO ...", {bind})` | `prisma.user.create({ data: {...} })` |
| `database.simpleExecute("UPDATE ...", {bind})` | `prisma.user.update({ where, data })` |
| Oracle column `EMAIL`, `NAME`, etc. (UPPER) | Prisma fields `email`, `name` (camelCase) |
| Result `.rows[0].EMAIL` | Prisma returns objects directly; access `.email` |
| `jwt.sign({EMAIL}, 'supersecret_dont_share', ...)` | `jwt.sign({ EMAIL }, env.JWT_SECRET, ...)` |
| `console.log(err)` only (swallowed) | `next(new HttpError(message, code))` so errors actually reach the client |

**Response-shape contract:** the frontend currently expects responses with UPPER_CASE keys (e.g., `{users: [...]}`, `{EMAIL, token}`, `{mp: {MAX_PROFILES: 2}}`). Preserve the exact shape for behavior parity — do NOT camelCase API responses, even though Prisma uses camelCase internally. Map at the controller boundary.

- [ ] **Step 1: Re-read source files**

Read in full before porting:
- `legacy/backend/routes/users-routes.js`
- `legacy/backend/controllers/users-controller.js`

- [ ] **Step 2: Create `apps/api/src/services/auth.service.ts`**

```typescript
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "./env.js";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(email: string): string {
  return jwt.sign({ EMAIL: email }, env.JWT_SECRET, { expiresIn: "1h" });
}
```

- [ ] **Step 3: Create `apps/api/src/controllers/users.controller.ts`**

Port every function from `legacy/backend/controllers/users-controller.js`. Preserve response shapes exactly.

```typescript
import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { prisma } from "@streamflare/db";
import { HttpError } from "../models/http-error.js";
import { hashPassword, verifyPassword, signToken } from "../services/auth.service.js";

function uc<T extends Record<string, unknown>>(row: T): T {
  return row; // shape transformation helper, expanded per-handler as needed
}

export async function getUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json({
      users: users.map((u) => ({
        NAME: u.name,
        EMAIL: u.email,
        DOB: u.dob,
        COUNTRY: u.country,
        CREDIT_CARD: u.creditCard,
        PHONE: u.phone,
        JOINED: u.joined,
        MAX_PROFILES: u.maxProfiles,
      })),
    });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new HttpError("Invalid Input", 422));

  const { NAME, EMAIL, DOB, COUNTRY, CREDIT_CARD, PASSWORD, PHONE } = req.body as {
    NAME: string;
    EMAIL: string;
    DOB: string;
    COUNTRY: string;
    CREDIT_CARD: string;
    PASSWORD: string;
    PHONE?: string;
  };

  try {
    const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (existing) {
      return next(new HttpError("User exists already, please login instead.", 423));
    }

    const hashed = await hashPassword(PASSWORD);
    await prisma.user.create({
      data: {
        name: NAME,
        email: EMAIL,
        dob: new Date(DOB),
        country: COUNTRY,
        creditCard: CREDIT_CARD,
        password: hashed,
        phone: PHONE ?? null,
      },
    });

    const token = signToken(EMAIL);
    res.status(201).json({ EMAIL, token });
  } catch (err) {
    next(new HttpError((err as Error).message, 424));
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  const { EMAIL, PASSWORD } = req.body as { EMAIL: string; PASSWORD: string };
  try {
    const user = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (!user) return next(new HttpError("User does not exist. Please sign up instead", 422));
    const ok = await verifyPassword(PASSWORD, user.password);
    if (!ok) return next(new HttpError("Incorrect Password", 423));
    const token = signToken(EMAIL);
    res.status(201).json({ EMAIL, token });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function getMaxProfiles(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.params.email },
      select: { maxProfiles: true },
    });
    if (!user) return next(new HttpError("User not found", 404));
    res.status(200).json({ mp: { MAX_PROFILES: user.maxProfiles } });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function getNumProfiles(req: Request, res: Response, next: NextFunction) {
  try {
    const c = await prisma.profile.count({ where: { email: req.params.email } });
    res.status(200).json({ C: { C: c } });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function updatePhone(req: Request, res: Response, next: NextFunction) {
  const { EMAIL, Phone } = req.body as { EMAIL: string; Phone: string };
  try {
    await prisma.user.update({ where: { email: EMAIL }, data: { phone: Phone } });
    res.status(201).json({ message: "Successfully updated phone" });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function getPhone(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.params.email },
      select: { phone: true },
    });
    if (!user) return next(new HttpError("User not found", 404));
    res.status(200).json({ phone: { PHONE: user.phone } });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function updatePassword(req: Request, res: Response, next: NextFunction) {
  const { EMAIL, OLD_PASS, NEW_PASS, NEW_PASS_CON } = req.body as {
    EMAIL: string;
    OLD_PASS: string;
    NEW_PASS: string;
    NEW_PASS_CON: string;
  };
  if (NEW_PASS !== NEW_PASS_CON) return next(new HttpError("New passwords don't match", 422));
  try {
    const user = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (!user) return next(new HttpError("User not found", 404));
    const ok = await verifyPassword(OLD_PASS, user.password);
    if (!ok) return next(new HttpError("Incorrect Password", 423));
    await prisma.user.update({
      where: { email: EMAIL },
      data: { password: await hashPassword(NEW_PASS) },
    });
    res.status(201).json({ message: "password updated successfully" });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function getMovieWatchHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.movieWatch.findMany({
      where: { email: req.params.email, profileId: req.params.prof_id },
      orderBy: { time: "desc" },
      include: { movie: { select: { title: true, imageUrl: true } } },
    });
    res.status(200).json({
      history: rows.map((r) => ({
        RATING: r.rating,
        WATCHED_UPTO: r.watchedUpto,
        TITLE: r.movie.title,
        TIME: r.time,
        IMAGE_URL: r.movie.imageUrl,
      })),
    });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function getMovieWatchHistory2(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.movieWatch.findMany({
      where: { email: req.params.email },
      orderBy: { time: "desc" },
      include: { movie: { select: { title: true, imageUrl: true } } },
    });
    res.status(200).json({
      history: rows.map((r) => ({
        RATING: r.rating,
        WATCHED_UPTO: r.watchedUpto,
        TITLE: r.movie.title,
        TIME: r.time,
        IMAGE_URL: r.movie.imageUrl,
        PID: r.profileId,
      })),
    });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function getShowWatchHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.episodeWatch.findMany({
      where: { email: req.params.email, profileId: req.params.prof_id },
      include: { episode: { include: { show: { select: { title: true, rating: true } } } } },
    });
    res.status(200).json({
      history: rows.map((r) => ({
        TITLE: r.episode.show.title,
        RATING: r.episode.show.rating,
        SEASON_NO: r.seasonNo,
        EPISODE_NO: r.episodeNo,
        WATCHED_UPTO: r.watchedUpto,
      })),
    });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function getShowWatchHistory2(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await prisma.episodeWatch.findMany({
      where: { email: req.params.email },
      include: { episode: { include: { show: { select: { title: true, rating: true } } } } },
    });
    res.status(200).json({
      history: rows.map((r) => ({
        TITLE: r.episode.show.title,
        RATING: r.episode.show.rating,
        SEASON_NO: r.seasonNo,
        EPISODE_NO: r.episodeNo,
        WATCHED_UPTO: r.watchedUpto,
        PID: r.profileId,
      })),
    });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

// Unused helper kept to silence unused-var warning in case of edits
void uc;
```

- [ ] **Step 4: Create `apps/api/src/routes/users.routes.ts`**

```typescript
import { Router } from "express";
import { check } from "express-validator";
import * as ctrl from "../controllers/users.controller.js";

const router = Router();

router.get("/", ctrl.getUsers);
router.post(
  "/signup",
  [check("NAME").isLength({ min: 3 }), check("EMAIL").normalizeEmail().isEmail()],
  ctrl.signup,
);
router.post("/login", ctrl.login);
router.get("/maxprofiles/:email", ctrl.getMaxProfiles);
router.get("/numprofiles/:email", ctrl.getNumProfiles);
router.patch("/updatephone", ctrl.updatePhone);
router.get("/getphone/:email", ctrl.getPhone);
router.patch("/updatepassword", ctrl.updatePassword);
router.get("/getmoviehistory/:email/:prof_id", ctrl.getMovieWatchHistory);
router.get("/getmoviehistory/:email", ctrl.getMovieWatchHistory2);
router.get("/getshowhistory/:email/:prof_id", ctrl.getShowWatchHistory);
router.get("/getshowhistory/:email", ctrl.getShowWatchHistory2);

export default router;
```

- [ ] **Step 5: Mount the router in `apps/api/src/app.ts`**

Add the import near the top and the `app.use` line above `app.use(notFound);`:

```typescript
import usersRouter from "./routes/users.routes.js";
// ...
app.use("/api/users", usersRouter);
```

- [ ] **Step 6: Typecheck and smoke-test**

```powershell
pnpm --filter @streamflare/api typecheck
```

Then in a separate terminal:

```powershell
$env:DATABASE_URL = "file:./packages/db/dev.db"
$env:JWT_SECRET = "this-is-a-dev-secret-min-16-chars"
$env:TMDB_API_KEY = "dummy"
pnpm --filter @streamflare/api dev
```

In another terminal, hit the endpoint:

```powershell
Invoke-RestMethod http://localhost:5000/api/users
```

Expected: returns `{ users: [...] }` (possibly empty if you haven't seeded users).

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat(api): port users routes from Oracle to Prisma + TypeScript"
```

---

### Task 8: Port Profiles Routes

**Files:**
- Create: `apps/api/src/routes/profile.routes.ts`, `apps/api/src/controllers/profile.controller.ts`
- Modify: `apps/api/src/app.ts` (mount the router)

**Source:** `legacy/backend/controllers/profile-controller.js` (516 lines), `legacy/backend/routes/profile-routes.js`.

This controller has the most routes. Apply the same porting rules from Task 7. The route list (from `profile-routes.js`):

| Route | Method | Handler |
|---|---|---|
| `/:email` | GET | `getProfile` |
| `/add` | POST | `addProfile` |
| `/update` | PATCH | `updateProfile` |
| `/delete` | DELETE | `deleteProfile` |
| `/watchlist/find` | POST | `hasWatchListed` |
| `/watchlist/add` | POST | `addToWatchList` |
| `/watchlist/delete` | DELETE | `deleteWatchList` |
| `/watchlist/get/` | POST | `getWatchList` |
| `/rating/add` | POST | `addRating` |
| `/rating/find` | POST | `findRating` |
| `/time/get` | GET | `getTime` |
| `/time/set` | POST | `setTime` |
| `/movie/continue` | GET | `movieContinueWatching` |
| `/show/continue` | GET | `showContinueWatching` |
| `/episode/continue` | GET | `episodeContinueWatching` |

- [ ] **Step 1: Read the source file in full**

Read `legacy/backend/controllers/profile-controller.js` completely. For each handler, identify:
1. Which legacy SQL tables it touches
2. The response shape (preserve exactly)
3. Any stored-procedure calls (replace with explicit Prisma logic)

- [ ] **Step 2: Create `apps/api/src/controllers/profile.controller.ts`**

Worked example for `addProfile` (which previously incremented `MAX_PROFILES` via a trigger):

```typescript
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@streamflare/db";
import { HttpError } from "../models/http-error.js";

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profiles = await prisma.profile.findMany({ where: { email: req.params.email } });
    res.status(200).json({
      profiles: profiles.map((p) => ({
        PROFILE_ID: p.profileId,
        EMAIL: p.email,
        DOB: p.dob,
      })),
    });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}

export async function addProfile(req: Request, res: Response, next: NextFunction) {
  const { EMAIL, PROFILE_ID, DOB } = req.body as { EMAIL: string; PROFILE_ID: string; DOB: string };
  try {
    // Replicate Oracle trigger: increment user.maxProfiles on each new profile.
    await prisma.$transaction([
      prisma.profile.create({ data: { email: EMAIL, profileId: PROFILE_ID, dob: new Date(DOB) } }),
      prisma.user.update({ where: { email: EMAIL }, data: { maxProfiles: { increment: 1 } } }),
    ]);
    res.status(201).json({ message: "Profile created" });
  } catch (err) {
    next(new HttpError((err as Error).message, 422));
  }
}
```

Port every remaining handler the same way. For each one:
- Translate SQL → Prisma calls
- Wrap in try/catch and forward errors via `next(new HttpError(...))`
- Preserve the exact response shape from the legacy controller (UPPER_CASE keys, nested shapes)
- For any stored-procedure or trigger logic referenced by the legacy controller, port the side-effect explicitly using `prisma.$transaction(...)` so atomicity is preserved

- [ ] **Step 3: Create `apps/api/src/routes/profile.routes.ts`**

```typescript
import { Router } from "express";
import * as ctrl from "../controllers/profile.controller.js";

const router = Router();

router.get("/:email", ctrl.getProfile);
router.post("/add", ctrl.addProfile);
router.patch("/update", ctrl.updateProfile);
router.delete("/delete", ctrl.deleteProfile);

router.post("/watchlist/find", ctrl.hasWatchListed);
router.post("/watchlist/add", ctrl.addToWatchList);
router.delete("/watchlist/delete", ctrl.deleteWatchList);
router.post("/watchlist/get/", ctrl.getWatchList);

router.post("/rating/add", ctrl.addRating);
router.post("/rating/find", ctrl.findRating);

router.get("/time/get", ctrl.getTime);
router.post("/time/set", ctrl.setTime);

router.get("/movie/continue", ctrl.movieContinueWatching);
router.get("/show/continue", ctrl.showContinueWatching);
router.get("/episode/continue", ctrl.episodeContinueWatching);

export default router;
```

- [ ] **Step 4: Mount the router in `apps/api/src/app.ts`**

```typescript
import profileRouter from "./routes/profile.routes.js";
// ...
app.use("/api/profiles", profileRouter);
```

- [ ] **Step 5: Typecheck**

```powershell
pnpm --filter @streamflare/api typecheck
```

Expected: passes with zero errors.

- [ ] **Step 6: Smoke-test the routes**

Start the server (see Task 7, Step 6). Hit a few endpoints with sample data via `Invoke-RestMethod`. Expected: each endpoint returns the documented response shape.

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat(api): port profile routes from Oracle to Prisma + TypeScript"
```

---

### Task 9: Port Browse Routes (incl. TMDB + Recommendation)

**Files:**
- Create: `apps/api/src/routes/browse.routes.ts`, `apps/api/src/controllers/browse.controller.ts`, `apps/api/src/services/tmdb.service.ts`, `apps/api/src/services/recommendation.service.ts`
- Modify: `apps/api/src/app.ts`

**Source:** `legacy/backend/controllers/browse-controller.js` (1028 lines), `legacy/backend/services/tmdb.js` (616 lines), `legacy/backend/services/cosine_similarity.js` (250 lines), `legacy/backend/routes/browse-routes.js`.

Route list:

| Route | Handler |
|---|---|
| `GET /movies/:genre` | `getMovieByGenre` |
| `GET /shows/:genre` | `getShowByGenre` |
| `POST /search` | `search` |
| `GET /show/episodes` | `getEpisodes` |
| `GET /suggestions` | `getSuggestions` |
| `GET /similarity` | `similarity` |
| `GET /new` | `newAndPopular` |
| `GET /genre` | `getGenres` |
| `GET /celeb` | `getCelebs` |
| `GET /similar` | `getSimilar` |

- [ ] **Step 1: Read all source files in full**

`legacy/backend/controllers/browse-controller.js`, `legacy/backend/services/tmdb.js`, `legacy/backend/services/cosine_similarity.js`, `legacy/backend/routes/browse-routes.js`.

- [ ] **Step 2: Create `apps/api/src/services/tmdb.service.ts`**

Port `legacy/backend/services/tmdb.js`. Critical changes:
- Replace hardcoded API key with `env.TMDB_API_KEY`.
- Type request/response with `axios` generics.
- Export typed functions; do not export the axios client directly.

Worked example (the rest of the file ports the same way — one exported function per current `module.exports`):

```typescript
import axios from "axios";
import { env } from "./env.js";

const TMDB_BASE = "https://api.themoviedb.org/3";

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  runtime: number | null;
}

export async function getMovieById(id: number): Promise<TmdbMovie> {
  const url = `${TMDB_BASE}/movie/${id}?language=en-US&api_key=${env.TMDB_API_KEY}`;
  const { data } = await axios.get<TmdbMovie>(url);
  return data;
}

// Port every remaining function from legacy/backend/services/tmdb.js here.
// For each function: type its parameters, type its TMDB response, return typed data.
```

- [ ] **Step 3: Create `apps/api/src/services/recommendation.service.ts`**

Port `legacy/backend/services/cosine_similarity.js`. The old service uses `tiny-tfidf` to compute movie similarity. Keep the same algorithm; only change is reading inputs via Prisma instead of `oracledb`.

```typescript
import { prisma } from "@streamflare/db";

// If tiny-tfidf is needed, declare its types or add a .d.ts shim:
// declare module "tiny-tfidf" { /* minimal types */ }

export async function computeMovieSimilarity(movieId: number, limit = 10) {
  // Port the legacy cosine_similarity.js algorithm here.
  // Replace any oracledb.execute(...) calls with prisma.movie.findMany(...) / prisma.movieSimilarity.findMany(...).
  // Return the same shape the legacy controller previously returned.
  void movieId;
  void limit;
  return [] as Array<{ movieId: number; score: number }>;
}
```

If `tiny-tfidf` lacks types, add `apps/api/src/types/tiny-tfidf.d.ts` with `declare module "tiny-tfidf" { export const TfIdf: any; }` (or a more precise shim based on the legacy usage).

- [ ] **Step 4: Create `apps/api/src/controllers/browse.controller.ts`**

Port every handler from `legacy/backend/controllers/browse-controller.js` following the Task 7 porting rules. Each handler:
- Translates SQL to Prisma calls (genre/celeb joins use `prisma.movieGenre.findMany({ where: { genreId: ... }, include: { movie: true } })`).
- Calls `tmdbService.*` or `recommendationService.*` where the legacy controller called them.
- Preserves the legacy response shape exactly.

Worked example for `getGenres` (one of the simplest):

```typescript
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@streamflare/db";
import { HttpError } from "../models/http-error.js";

export async function getGenres(_req: Request, res: Response, next: NextFunction) {
  try {
    const genres = await prisma.genre.findMany();
    res.status(200).json({
      genres: genres.map((g) => ({
        GENRE_ID: g.genreId,
        NAME: g.name,
        CONTENTS: g.contents,
      })),
    });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}
```

For `getSimilar` and `similarity` — these previously called the ML server. Replace direct cosine-similarity service calls or HTTP calls to `ML_SERVICE_URL` (e.g., `axios.post(\`${env.ML_SERVICE_URL}/recommend\`, { movieId })`).

- [ ] **Step 5: Create `apps/api/src/routes/browse.routes.ts`**

```typescript
import { Router } from "express";
import * as ctrl from "../controllers/browse.controller.js";

const router = Router();

router.get("/movies/:genre", ctrl.getMovieByGenre);
router.get("/shows/:genre", ctrl.getShowByGenre);
router.post("/search", ctrl.search);
router.get("/show/episodes", ctrl.getEpisodes);
router.get("/suggestions", ctrl.getSuggestions);
router.get("/similarity", ctrl.similarity);
router.get("/new", ctrl.newAndPopular);
router.get("/genre", ctrl.getGenres);
router.get("/celeb", ctrl.getCelebs);
router.get("/similar", ctrl.getSimilar);

export default router;
```

- [ ] **Step 6: Mount the router**

```typescript
import browseRouter from "./routes/browse.routes.js";
// ...
app.use("/api/browse", browseRouter);
```

- [ ] **Step 7: Typecheck and smoke-test**

```powershell
pnpm --filter @streamflare/api typecheck
```

Start the server. Hit `GET http://localhost:5000/api/browse/genre`. Expected: returns `{ genres: [...] }`.

- [ ] **Step 8: Commit**

```powershell
git add .
git commit -m "feat(api): port browse routes, TMDB service, recommendation service"
```

---

### Task 10: Port Subscription Routes

**Files:**
- Create: `apps/api/src/routes/subscription.routes.ts`, `apps/api/src/controllers/subscription.controller.ts`, `apps/api/src/services/subscription.service.ts`
- Modify: `apps/api/src/app.ts`

**Source:** `legacy/backend/controllers/subscription-controller.js` (225 lines), `legacy/backend/routes/subscription-routes.js`, `legacy/PROCEDURES.sql` (for billing logic).

Route list:

| Route | Handler |
|---|---|
| `GET /` | `getSubscriptions` |
| `GET /subid/:email` | `getSubId` |
| `GET /bill/:sub_id` | `getBill` |
| `GET /isvalid/:sub_id` | `isValidSubscription` |
| `POST /add` | `addSubscription` |
| `GET /history/:email` | `getHistory` |
| `GET /getenddate/:email` | `getEndDate` |
| `POST /update` | `addSubscription` (yes, same handler — legacy quirk, preserve) |
| `PATCH /delete` | `deleteSubscription` |
| `GET /plans` | `getplans` |

- [ ] **Step 1: Read source files**

`legacy/backend/controllers/subscription-controller.js` plus the relevant procedures in `legacy/PROCEDURES.sql`.

- [ ] **Step 2: Create `apps/api/src/services/subscription.service.ts`**

This service is where billing logic from PROCEDURES.sql gets ported. Identify each stored procedure currently called by the subscription controller and rewrite each as a TypeScript function.

```typescript
import { prisma } from "@streamflare/db";

export async function getActivePlanForEmail(email: string) {
  return prisma.subscription.findFirst({
    where: { email, OR: [{ terminationDate: null }, { running: 1 }] },
    orderBy: { startDate: "desc" },
  });
}

export async function listPlans() {
  return prisma.subscriptionType.findMany();
}

// Add additional functions ported from PROCEDURES.sql:
// - calculateBill(subId): replicates the bill-calculation stored procedure
// - markTerminated(subId): replicates termination procedure
// - any other procedure invoked by subscription-controller.js
```

- [ ] **Step 3: Create `apps/api/src/controllers/subscription.controller.ts`**

Port every handler. Worked example for `getplans`:

```typescript
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@streamflare/db";
import { HttpError } from "../models/http-error.js";

export async function getplans(_req: Request, res: Response, next: NextFunction) {
  try {
    const plans = await prisma.subscriptionType.findMany();
    res.status(200).json({
      plans: plans.map((p) => ({
        SUB_TYPE: p.subType,
        BILL: p.bill,
        NUM_PROFILES: p.numProfiles,
      })),
    });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
}
```

Port the rest. For `addSubscription` — replicate the side-effect of the corresponding stored procedure (e.g., updating `user.maxProfiles` per the plan's `NUM_PROFILES`) inside a `prisma.$transaction([...])` so the writes are atomic.

- [ ] **Step 4: Create `apps/api/src/routes/subscription.routes.ts`**

```typescript
import { Router } from "express";
import * as ctrl from "../controllers/subscription.controller.js";

const router = Router();

router.get("/", ctrl.getSubscriptions);
router.get("/subid/:email", ctrl.getSubId);
router.get("/bill/:sub_id", ctrl.getBill);
router.get("/isvalid/:sub_id", ctrl.isValidSubscription);
router.post("/add", ctrl.addSubscription);
router.get("/history/:email", ctrl.getHistory);
router.get("/getenddate/:email", ctrl.getEndDate);
router.post("/update", ctrl.addSubscription);
router.patch("/delete", ctrl.deleteSubscription);
router.get("/plans", ctrl.getplans);

export default router;
```

- [ ] **Step 5: Mount the router**

```typescript
import subscriptionRouter from "./routes/subscription.routes.js";
// ...
app.use("/api/subscription", subscriptionRouter);
```

- [ ] **Step 6: Typecheck and smoke-test**

```powershell
pnpm --filter @streamflare/api typecheck
```

Start the server. `Invoke-RestMethod http://localhost:5000/api/subscription/plans`. Expected: returns BASIC/STANDARD/PREMIUM rows.

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat(api): port subscription routes with billing logic from stored procedures"
```

---

### Task 11: API Smoke Tests

**Files:**
- Create: `apps/api/tests/smoke.test.ts`, `apps/api/vitest.config.ts`, `apps/api/tests/helpers/test-app.ts`

The goal: one happy-path test per controller. Tests run against a real SQLite database at `file::memory:?cache=shared`.

- [ ] **Step 1: Create `apps/api/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    setupFiles: ["./tests/helpers/setup.ts"],
    fileParallelism: false,
  },
});
```

- [ ] **Step 2: Create `apps/api/tests/helpers/setup.ts`**

```typescript
process.env.DATABASE_URL = "file:./test.db";
process.env.JWT_SECRET = "test-secret-min-16-chars-please";
process.env.TMDB_API_KEY = "test-tmdb-key";
process.env.ML_SERVICE_URL = "http://localhost:5001";
```

- [ ] **Step 3: Create `apps/api/tests/helpers/test-app.ts`**

```typescript
import express from "express";
import cors from "cors";
import { notFound, errorHandler } from "../../src/middleware/error-handler.js";
import usersRouter from "../../src/routes/users.routes.js";
import profileRouter from "../../src/routes/profile.routes.js";
import browseRouter from "../../src/routes/browse.routes.js";
import subscriptionRouter from "../../src/routes/subscription.routes.js";

export function buildTestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api/users", usersRouter);
  app.use("/api/profiles", profileRouter);
  app.use("/api/browse", browseRouter);
  app.use("/api/subscription", subscriptionRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
```

- [ ] **Step 4: Create `apps/api/tests/smoke.test.ts`**

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { rmSync, existsSync } from "node:fs";
import request from "supertest";
import { prisma } from "@streamflare/db";
import { buildTestApp } from "./helpers/test-app.js";

const app = buildTestApp();

beforeAll(() => {
  if (existsSync("test.db")) rmSync("test.db");
  execSync("pnpm --filter @streamflare/db exec prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "inherit",
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("users", () => {
  it("GET /api/users returns an array", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it("POST /api/users/signup creates a user and returns a token", async () => {
    const res = await request(app)
      .post("/api/users/signup")
      .send({
        NAME: "Test User",
        EMAIL: "test@example.com",
        DOB: "1990-01-01",
        COUNTRY: "BD",
        CREDIT_CARD: "0000-0000-0000-0000",
        PASSWORD: "supersecret",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.EMAIL).toBe("test@example.com");
  });

  it("POST /api/users/login succeeds with correct password", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ EMAIL: "test@example.com", PASSWORD: "supersecret" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
  });
});

describe("subscription", () => {
  it("GET /api/subscription/plans returns the three plans", async () => {
    // Seed plans
    await prisma.subscriptionType.upsert({
      where: { subType: "BASIC" },
      create: { subType: "BASIC", bill: 5, numProfiles: 2 },
      update: {},
    });
    const res = await request(app).get("/api/subscription/plans");
    expect(res.status).toBe(200);
    expect(res.body.plans.length).toBeGreaterThan(0);
  });
});

describe("browse", () => {
  it("GET /api/browse/genre returns an array", async () => {
    const res = await request(app).get("/api/browse/genre");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.genres)).toBe(true);
  });
});

describe("profiles", () => {
  it("POST /api/profiles/add then GET /api/profiles/:email returns the profile", async () => {
    await request(app)
      .post("/api/profiles/add")
      .send({ EMAIL: "test@example.com", PROFILE_ID: "kid", DOB: "2015-05-01" });
    const res = await request(app).get("/api/profiles/test@example.com");
    expect(res.status).toBe(200);
    expect(res.body.profiles.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 5: Run the tests**

```powershell
pnpm --filter @streamflare/api test
```

Expected: all tests pass. If `browse` or `profiles` test fails because additional fields are required, add the missing seed data inline.

- [ ] **Step 6: Commit**

```powershell
git add .
git commit -m "test(api): add smoke tests for users, profiles, browse, subscription"
```

---

## Phase 3 — ML

### Task 12: `apps/ml` — TS Wrapper + Python Recommendation Script

**Files:**
- Create: `apps/ml/package.json`, `tsconfig.json`, `src/{app,routes/recommend,services/{env,python-runner}}.ts`, `src/models/http-error.ts`, `python/{recommend.py,requirements.txt}`, `vitest.config.ts`, `tests/recommend.test.ts`

**Source:** `legacy/ml_model_server/app.js`, `legacy/ml_model_server/main.py`, `legacy/ml_model_server/movies.csv`.

- [ ] **Step 1: Create `apps/ml/package.json`**

```json
{
  "name": "@streamflare/ml",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "echo 'no lint configured'"
  },
  "dependencies": {
    "@streamflare/db": "workspace:*",
    "@streamflare/types": "workspace:*",
    "axios": "^1.6.2",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create `apps/ml/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": false
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create `apps/ml/python/requirements.txt`**

```
pandas==2.2.2
numpy==1.26.4
scikit-learn==1.4.2
```

- [ ] **Step 4: Create `apps/ml/python/recommend.py`**

Replaces `legacy/ml_model_server/main.py`. New contract:
- Reads JSON from stdin: `{ "movieTitle": string, "movies": [{ "id": number, "title": string }], "limit": number }`.
- Writes JSON to stdout: `[movieId, movieId, ...]` (array of recommended movie IDs).

```python
import sys
import json
import difflib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def main():
    payload = json.loads(sys.stdin.read())
    movie_title = payload["movieTitle"]
    movies = payload["movies"]
    limit = int(payload.get("limit", 20))

    titles = [m["title"] for m in movies]
    if not titles:
        print(json.dumps([]))
        return

    close = difflib.get_close_matches(movie_title, titles)
    if not close:
        print(json.dumps([]))
        return

    target_title = close[0]
    target_idx = titles.index(target_title)

    vectorizer = TfidfVectorizer()
    matrix = vectorizer.fit_transform(titles)
    sim = cosine_similarity(matrix[target_idx], matrix).flatten()

    ranked_idx = sim.argsort()[::-1].tolist()
    recommended_ids = []
    for i in ranked_idx:
        if i == target_idx:
            continue
        recommended_ids.append(int(movies[i]["id"]))
        if len(recommended_ids) >= limit:
            break

    print(json.dumps(recommended_ids))


if __name__ == "__main__":
    main()
```

- [ ] **Step 5: Create `apps/ml/src/services/env.ts`**

```typescript
import { z } from "zod";

export const env = z
  .object({
    DATABASE_URL: z.string().min(1),
    PORT: z.coerce.number().default(5001),
    PYTHON_BIN: z.string().default("python"),
  })
  .parse(process.env);
```

- [ ] **Step 6: Create `apps/ml/src/models/http-error.ts`**

```typescript
export class HttpError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}
```

- [ ] **Step 7: Create `apps/ml/src/services/python-runner.ts`**

```typescript
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { env } from "./env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = resolve(__dirname, "../../python/recommend.py");

export interface RecommendInput {
  movieTitle: string;
  movies: Array<{ id: number; title: string }>;
  limit?: number;
}

export function runRecommendation(input: RecommendInput): Promise<number[]> {
  return new Promise((resolveP, rejectP) => {
    const proc = spawn(env.PYTHON_BIN, [SCRIPT_PATH]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", rejectP);
    proc.on("close", (code) => {
      if (code !== 0) {
        return rejectP(new Error(`python exited ${code}: ${stderr}`));
      }
      try {
        resolveP(JSON.parse(stdout.trim()) as number[]);
      } catch (e) {
        rejectP(new Error(`python output not JSON: ${stdout}`));
      }
    });
    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}
```

- [ ] **Step 8: Create `apps/ml/src/routes/recommend.ts`**

```typescript
import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "@streamflare/db";
import { runRecommendation } from "../services/python-runner.js";
import { HttpError } from "../models/http-error.js";

const router = Router();

interface RecommendBody {
  movieId?: number;
  movieTitle?: string;
  limit?: number;
}

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { movieId, movieTitle: titleFromBody, limit } = req.body as RecommendBody;
    let movieTitle = titleFromBody;

    if (!movieTitle && movieId != null) {
      const movie = await prisma.movie.findUnique({
        where: { movieId },
        select: { title: true },
      });
      movieTitle = movie?.title;
    }

    if (!movieTitle) {
      return next(new HttpError("Either movieId or movieTitle is required", 400));
    }

    const movies = await prisma.movie.findMany({
      select: { movieId: true, title: true },
    });

    const ids = await runRecommendation({
      movieTitle,
      movies: movies.map((m) => ({ id: m.movieId, title: m.title })),
      limit: limit ?? 20,
    });

    res.status(200).json({ movieIds: ids });
  } catch (err) {
    next(new HttpError((err as Error).message, 500));
  }
});

export default router;
```

- [ ] **Step 9: Create `apps/ml/src/app.ts`**

```typescript
import express from "express";
import cors from "cors";
import { env } from "./services/env.js";
import recommendRouter from "./routes/recommend.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.send("ML server is running"));
app.use("/recommend", recommendRouter);

app.use((req, _res, next) => {
  const err = new Error("Not found") as Error & { code?: number };
  err.code = 404;
  next(err);
});

app.use(
  (
    err: Error & { code?: number },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res.status(err.code ?? 500).json({ message: err.message });
  },
);

app.listen(env.PORT, () => console.log(`ML server listening on :${env.PORT}`));
```

- [ ] **Step 10: Verify Python is available**

```powershell
python --version
```

Expected: `Python 3.10+`. If not, install Python 3 from python.org.

- [ ] **Step 11: Install Python deps locally**

```powershell
python -m pip install -r apps/ml/python/requirements.txt
```

Expected: pandas, numpy, scikit-learn install successfully.

- [ ] **Step 12: Create `apps/ml/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    testTimeout: 30000,
  },
});
```

- [ ] **Step 13: Create `apps/ml/tests/setup.ts`**

```typescript
process.env.DATABASE_URL = "file:./test.db";
process.env.PYTHON_BIN = process.env.PYTHON_BIN ?? "python";
```

- [ ] **Step 14: Create `apps/ml/tests/recommend.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { runRecommendation } from "../src/services/python-runner.js";

describe("runRecommendation", () => {
  it("returns recommendation IDs", async () => {
    const ids = await runRecommendation({
      movieTitle: "Batman",
      movies: [
        { id: 1, title: "Batman Begins" },
        { id: 2, title: "The Dark Knight" },
        { id: 3, title: "Frozen" },
        { id: 4, title: "Inception" },
      ],
      limit: 2,
    });
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBeLessThanOrEqual(2);
  });

  it("returns empty array for unmatchable title", async () => {
    const ids = await runRecommendation({
      movieTitle: "qqqqzzzzzz",
      movies: [{ id: 1, title: "Batman" }],
      limit: 5,
    });
    expect(ids).toEqual([]);
  });
});
```

- [ ] **Step 15: Install, typecheck, test**

```powershell
pnpm install
pnpm --filter @streamflare/ml typecheck
pnpm --filter @streamflare/ml test
```

Expected: typecheck passes, both tests pass.

- [ ] **Step 16: Commit**

```powershell
git add .
git commit -m "feat(ml): add TS Express wrapper + Python recommendation script"
```

---

## Phase 4 — Web

### Task 13: `apps/web` — Next.js Scaffold + Auth Context

**Files:**
- Create: `apps/web/{package.json,tsconfig.json,next.config.mjs,next-env.d.ts}`, `apps/web/app/{layout.tsx,page.tsx,globals.css}`, `apps/web/lib/{api-client.ts,auth.ts}`, `apps/web/context/auth-context.tsx`, `apps/web/constants/routes.ts`

**Source:** `legacy/frontend/src/App.js`, `legacy/frontend/src/context/auth-context.js`, `legacy/frontend/src/constants/routes.js`.

- [ ] **Step 1: Create `apps/web/package.json`**

```json
{
  "name": "@streamflare/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "next lint"
  },
  "dependencies": {
    "@streamflare/types": "workspace:*",
    "@emotion/react": "^11.11.4",
    "@emotion/styled": "^11.11.5",
    "@mui/material": "^5.15.18",
    "@mui/icons-material": "^5.15.18",
    "axios": "^1.6.2",
    "bootstrap": "^5.3.2",
    "fuse.js": "^7.0.0",
    "next": "^14.2.0",
    "normalize.css": "^8.0.1",
    "react": "^18.3.0",
    "react-country-region-selector": "^3.0.1",
    "react-dom": "^18.3.0",
    "react-player": "^2.7.0",
    "react-popper": "^2.3.0",
    "react-select": "^5.8.0",
    "react-video-js-player": "^1.1.1",
    "reactstrap": "^9.2.1",
    "styled-components": "^6.1.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/react": "^14.1.0",
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/styled-components": "^5.1.34",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "jsdom": "^24.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create `apps/web/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "module": "ESNext",
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `apps/web/next.config.mjs`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@streamflare/types"],
};

export default nextConfig;
```

- [ ] **Step 4: Create `apps/web/next-env.d.ts`**

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 5: Create `apps/web/constants/routes.ts`**

Port `legacy/frontend/src/constants/routes.js`:

```typescript
export const HOME = "/";
export const SIGN_IN = "/signin";
export const SIGN_UP = "/signup";
export const BROWSE = "/browse";
export const PROFILES = "/profiles";
export const CREATE_PROFILE = "/profiles/create";
export const DELETE_PROFILE = "/profiles/delete";
export const PROFILE_INFO = "/profile";
export const ADD_SUBSCRIPTION = "/subscription/add";
export const UPDATE_SUBSCRIPTION = "/subscription/update";
export const CANCEL_SUBCRIPTION = "/subscription/cancel";
export const SUBSCRIPTION_HISTORY = "/subscription/history";
export const ACCOUNT_SETTINGS = "/account";
export const UPDATE_PHONE = "/account/phone";
export const UPDATE_PASSWORD = "/account/password";
export const MOVIE_HISTORY = "/history/movies";
export const SHOW_HISTORY = "/history/shows";
```

- [ ] **Step 6: Create `apps/web/lib/api-client.ts`**

```typescript
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("userData");
    if (stored) {
      try {
        const { token } = JSON.parse(stored) as { token?: string };
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {
        /* ignore */
      }
    }
  }
  return config;
});
```

- [ ] **Step 7: Create `apps/web/lib/auth.ts`**

```typescript
export interface StoredAuth {
  email: string;
  token: string;
}

export function loadAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("userData");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function saveAuth(auth: StoredAuth): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("userData", JSON.stringify(auth));
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("userData");
}
```

- [ ] **Step 8: Create `apps/web/context/auth-context.tsx`**

Port `legacy/frontend/src/context/auth-context.js`, preserving the full context shape used by `App.js`:

```typescript
"use client";

import { createContext, useCallback, useState, useContext, type ReactNode } from "react";
import { saveAuth, clearAuth } from "../lib/auth";

interface AuthContextValue {
  email: string | null;
  token: string | null;
  sub_id: number | null;
  bill: number | null;
  max_profiles: number | null;
  num_profiles: number | null;
  ptbd: number | null;
  profile: string | null;
  isLoggedIn: boolean;
  login: (email: string, token: string) => void;
  logout: () => void;
  set_sub_id: (id: number) => void;
  set_bill: (b: number) => void;
  set_max_profiles: (mp: number) => void;
  set_num_profiles: (np: number) => void;
  set_ptbd: (d: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sub_id, set_Sub_Id] = useState<number | null>(null);
  const [bill, set_Bill] = useState<number | null>(null);
  const [max_profiles, set_MaxProfiles] = useState<number | null>(null);
  const [num_profiles, set_NumProfiles] = useState<number | null>(null);
  const [ptbd, set_PTBD] = useState<number | null>(null);
  const [profile] = useState<string | null>(null);

  const login = useCallback((email: string, token: string) => {
    setEmail(email);
    setToken(token);
    saveAuth({ email, token });
  }, []);

  const logout = useCallback(() => {
    setEmail(null);
    setToken(null);
    clearAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        email,
        token,
        sub_id,
        bill,
        max_profiles,
        num_profiles,
        ptbd,
        profile,
        isLoggedIn: !!token,
        login,
        logout,
        set_sub_id: set_Sub_Id,
        set_bill: set_Bill,
        set_max_profiles: set_MaxProfiles,
        set_num_profiles: set_NumProfiles,
        set_ptbd: set_PTBD,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

- [ ] **Step 9: Create `apps/web/app/globals.css`**

```css
@import "normalize.css";
@import "bootstrap/dist/css/bootstrap.min.css";

html,
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #000;
  color: #fff;
}
```

- [ ] **Step 10: Create `apps/web/app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import { AuthProvider } from "../context/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamFlare",
  description: "Movie streaming app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 11: Create `apps/web/app/page.tsx`**

Port `legacy/frontend/src/pages/home.js`. Minimal placeholder for now — the real port is part of Task 16 (pages):

```typescript
"use client";

import Link from "next/link";
import { SIGN_IN, SIGN_UP, BROWSE } from "../constants/routes";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>StreamFlare</h1>
      <p>Welcome.</p>
      <nav>
        <Link href={SIGN_IN}>Sign in</Link> · <Link href={SIGN_UP}>Sign up</Link> ·{" "}
        <Link href={BROWSE}>Browse</Link>
      </nav>
    </main>
  );
}
```

- [ ] **Step 12: Install, typecheck, smoke-test the dev server**

```powershell
pnpm install
pnpm --filter @streamflare/web typecheck
$env:NEXT_PUBLIC_API_URL = "http://localhost:5000"
pnpm --filter @streamflare/web dev
```

Expected: Next.js starts on `:3000`. Open `http://localhost:3000` — see "StreamFlare / Welcome." and the three links. Stop with Ctrl+C.

- [ ] **Step 13: Commit**

```powershell
git add .
git commit -m "feat(web): scaffold Next.js app with auth context and routing constants"
```

---

### Task 14: Port Auth Pages (signin, signup)

**Files:**
- Create: `apps/web/app/(auth)/signin/page.tsx`, `apps/web/app/(auth)/signup/page.tsx`
- Modify: as needed, copy form components from `legacy/frontend/src/components/form/`

**Source:** `legacy/frontend/src/pages/signin.js`, `legacy/frontend/src/pages/signup.js`, `legacy/frontend/src/components/form/index.js`.

- [ ] **Step 1: Read each source file completely**

`legacy/frontend/src/pages/signin.js` and `legacy/frontend/src/pages/signup.js`.

- [ ] **Step 2: Port `signin.js` → `apps/web/app/(auth)/signin/page.tsx`**

Conversion rules (apply to every page port in Tasks 14–16):

| Legacy pattern | Next.js pattern |
|---|---|
| Top of file: no directive | `"use client";` (these pages have interactivity) |
| `import axios from 'axios'` | `import { api } from "../../../lib/api-client";` and use `api.post(...)` |
| `import { useNavigate } from 'react-router-dom'` | `import { useRouter } from "next/navigation"; const router = useRouter();` |
| `navigate('/foo')` | `router.push("/foo")` |
| `<Link to="/foo">` | `<Link href="/foo">` (`next/link`) |
| `useContext(AuthContext)` | `useAuth()` from `../../../context/auth-context` |
| `@material-ui/core` imports | `@mui/material` imports (e.g., `Button`, `TextField`, `Snackbar`) |
| `@material-ui/icons` imports | `@mui/icons-material` |
| Class names from `material-ui` v0 (`<RaisedButton>`) | Replace with MUI v5 equivalents (`<Button variant="contained">`) — remove the v0 `material-ui` package entirely |
| Local images via `import logo from '../../logo.svg'` | Place in `apps/web/public/` and use `<img src="/logo.svg" />` or `next/image` |

For each form submit handler, change the axios endpoint to use the `api` instance:

```typescript
// Old:
// axios.post("http://localhost:5000/api/users/login", {...})
// New:
const { data } = await api.post<{ EMAIL: string; token: string }>("/api/users/login", {
  EMAIL: email,
  PASSWORD: password,
});
login(data.EMAIL, data.token);
router.push(BROWSE);
```

- [ ] **Step 3: Port `signup.js` → `apps/web/app/(auth)/signup/page.tsx`**

Same conversion rules. The signup form has more fields (NAME, EMAIL, DOB, COUNTRY, CREDIT_CARD, PASSWORD, PHONE). Use `react-country-region-selector` as before.

- [ ] **Step 4: Typecheck**

```powershell
pnpm --filter @streamflare/web typecheck
```

Expected: passes.

- [ ] **Step 5: Manual test**

Start both api + web (in two terminals). Visit `http://localhost:3000/signin`. Submit a known-good credential. Expected: lands on `/browse` (Task 15) or the home page if browse isn't ported yet. Browser devtools network tab shows a 201 from `/api/users/login`.

- [ ] **Step 6: Commit**

```powershell
git add .
git commit -m "feat(web): port signin and signup pages to Next.js + MUI v5"
```

---

### Task 15: Port Browse + Watch Pages

**Files:**
- Create: `apps/web/app/browse/page.tsx`, `apps/web/app/watch/[id]/page.tsx`
- Modify: copy needed components from `legacy/frontend/src/components/{card,header,jumbotron,player,loading}/` into `apps/web/components/`

**Source:** `legacy/frontend/src/pages/browse.js`, `legacy/frontend/src/components/player/`, `legacy/frontend/src/components/card/`.

- [ ] **Step 1: Copy needed component folders**

```powershell
Copy-Item -Recurse legacy/frontend/src/components/card apps/web/components/card
Copy-Item -Recurse legacy/frontend/src/components/header apps/web/components/header
Copy-Item -Recurse legacy/frontend/src/components/player apps/web/components/player
Copy-Item -Recurse legacy/frontend/src/components/jumbotron apps/web/components/jumbotron
Copy-Item -Recurse legacy/frontend/src/components/loading apps/web/components/loading
Copy-Item -Recurse legacy/frontend/src/components/footer apps/web/components/footer
```

- [ ] **Step 2: Rename `.js` files to `.tsx` and convert**

For each `.js` file in `apps/web/components/`:
- Rename to `.tsx`
- Add `"use client";` at the top if it uses hooks or interactivity
- Replace `import styled from 'styled-components'` — keeps working; just add types where needed (`const Foo = styled.div<{ active?: boolean }>\`...\`;`)
- Convert prop destructuring with TypeScript: `function Card({ src }: { src: string })`
- Replace `import { Link } from 'react-router-dom'` with `import Link from 'next/link'` and `to={...}` → `href={...}`

If a component is purely presentational and has no `js`-specific dependencies beyond `styled-components`, the conversion is mostly adding type annotations.

- [ ] **Step 3: Port `browse.js` → `apps/web/app/browse/page.tsx`**

Apply the conversion rules from Task 14. The browse page uses MUI carousels and the Header/Card/Player components. The data-loading effect uses axios — replace with the `api` client.

- [ ] **Step 4: Port the watch page**

`legacy/frontend/src/pages/browse.js` may have a movie-detail/player view, or there may be a separate route. If a movie ID is in the URL like `/watch/123`, create `apps/web/app/watch/[id]/page.tsx` and read `params.id`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../lib/api-client";

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<unknown>(null);

  useEffect(() => {
    api.get(`/api/browse/movie/${id}`).then(({ data }) => setMovie(data));
  }, [id]);

  if (!movie) return <p>Loading...</p>;
  // Render the player + metadata.
  return <pre>{JSON.stringify(movie, null, 2)}</pre>;
}
```

- [ ] **Step 5: Typecheck**

```powershell
pnpm --filter @streamflare/web typecheck
```

Fix any type errors that surface from the component conversions.

- [ ] **Step 6: Manual test**

Start the stack. Log in. Visit `/browse`. Expected: page renders, network tab shows successful calls to `/api/browse/*`.

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat(web): port browse and watch pages to Next.js"
```

---

### Task 16: Port Remaining Pages (Profile, Subscription, Account, History)

**Files:**
- Create: `apps/web/app/profiles/page.tsx`, `apps/web/app/profiles/create/page.tsx`, `apps/web/app/profiles/delete/page.tsx`, `apps/web/app/profile/page.tsx`, `apps/web/app/subscription/{add,update,cancel,history}/page.tsx`, `apps/web/app/account/{page,phone/page,password/page}.tsx`, `apps/web/app/history/{movies,shows}/page.tsx`
- Modify: copy any remaining component folders (`accordion`, `feature`, `form2`, `header2`, `opt-form`, `profiles`) into `apps/web/components/`

**Source files:** every file in `legacy/frontend/src/pages/` not yet ported.

Page-to-route mapping:

| Source page | New route |
|---|---|
| `accountsettings.js` | `/account` |
| `add_subscription.js` | `/subscription/add` |
| `cancelsubscription.js` | `/subscription/cancel` |
| `createprofile.js` | `/profiles/create` |
| `deleteprofile.js` | `/profiles/delete` |
| `moviehistory.js` | `/history/movies` |
| `profileinfo.js` | `/profile` |
| `profiles.js` | `/profiles` |
| `showhistory.js` | `/history/shows` |
| `subscription_history.js` | `/subscription/history` |
| `updatepassword.js` | `/account/password` |
| `updatephone.js` | `/account/phone` |
| `updatesubscription.js` | `/subscription/update` |

- [ ] **Step 1: Copy remaining component folders**

```powershell
Copy-Item -Recurse legacy/frontend/src/components/accordion apps/web/components/accordion
Copy-Item -Recurse legacy/frontend/src/components/feature apps/web/components/feature
Copy-Item -Recurse legacy/frontend/src/components/form apps/web/components/form
Copy-Item -Recurse legacy/frontend/src/components/form2 apps/web/components/form2
Copy-Item -Recurse legacy/frontend/src/components/header2 apps/web/components/header2
Copy-Item -Recurse legacy/frontend/src/components/opt-form apps/web/components/opt-form
Copy-Item -Recurse legacy/frontend/src/components/profiles apps/web/components/profiles
```

Convert each `.js` to `.tsx` using the rules from Tasks 14 and 15.

- [ ] **Step 2: Port each page**

For each page in the mapping table:
1. Read the source file fully.
2. Create the target file at the new route.
3. Apply the Task 14 conversion rules.
4. Replace all axios endpoint URLs with the `api` instance.
5. Replace `useNavigate` with `useRouter`.
6. Replace `useContext(AuthContext)` with `useAuth()`.

- [ ] **Step 3: Typecheck**

```powershell
pnpm --filter @streamflare/web typecheck
```

Fix any errors. Common issues:
- Missing `"use client";` directive on a hook-using component
- Implicit `any` on event handlers — type as `React.ChangeEvent<HTMLInputElement>`, `React.FormEvent`, etc.
- Missing types on destructured props

- [ ] **Step 4: Add one render-smoke test per page (optional but recommended)**

Create `apps/web/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
});
```

`apps/web/tests/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

For each page, a minimal test like:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "../app/page";

describe("HomePage", () => {
  it("renders the title", () => {
    render(<HomePage />);
    expect(screen.getByText("StreamFlare")).toBeInTheDocument();
  });
});
```

Skip pages that require complex context wrappers — focus on form/static pages.

```powershell
pnpm --filter @streamflare/web test
```

- [ ] **Step 5: Manual end-to-end test**

Run the stack. Log in. Walk through: profile list → create profile → browse → watch → manage subscription → update phone → log out → sign back in. Expected: everything works.

- [ ] **Step 6: Commit**

```powershell
git add .
git commit -m "feat(web): port remaining pages (profile, subscription, account, history)"
```

---

## Phase 5 — Docker

### Task 17: Dockerfiles

**Files:**
- Create: `docker/api.Dockerfile`, `docker/web.Dockerfile`, `docker/ml.Dockerfile`, `docker/db-init.Dockerfile`, `.dockerignore`

All Dockerfiles use multi-stage builds. The first stage uses Turbo's `prune --docker` to copy only the workspace files needed for the target app, keeping the install step minimal.

- [ ] **Step 1: Create `.dockerignore`**

```
node_modules
.pnpm-store
.turbo
dist
.next
**/*.db
**/*.db-journal
.git
.env
.env.local
.vscode
.idea
coverage
*.log
legacy/frontend/node_modules
legacy/backend/node_modules
legacy/ml_model_server/node_modules
```

- [ ] **Step 2: Create `docker/api.Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo@^2 prune --scope=@streamflare/api --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @streamflare/db exec prisma generate
RUN pnpm --filter @streamflare/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/ .
EXPOSE 5000
CMD ["node", "apps/api/dist/app.js"]
```

- [ ] **Step 3: Create `docker/web.Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo@^2 prune --scope=@streamflare/web --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @streamflare/web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

- [ ] **Step 4: Create `docker/ml.Dockerfile`**

```dockerfile
FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv openssl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo@^2 prune --scope=@streamflare/ml --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @streamflare/db exec prisma generate
RUN pnpm --filter @streamflare/ml build
RUN pip3 install --break-system-packages -r apps/ml/python/requirements.txt

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production PYTHON_BIN=python3
COPY --from=builder /app/ .
COPY --from=builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
EXPOSE 5001
CMD ["node", "apps/ml/dist/app.js"]
```

Note: pin the Python version path to whatever `python3 --version` reports in the `node:20-bookworm-slim` base image. If it's not 3.11, adjust the COPY accordingly.

- [ ] **Step 5: Create `docker/db-init.Dockerfile`**

```dockerfile
FROM node:20-alpine
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/db ./packages/db
COPY packages/types ./packages/types
RUN pnpm install --frozen-lockfile --filter @streamflare/db...
COPY legacy/Table\ Backup /seed-data
ENV SEED_DATA_DIR=/seed-data
WORKDIR /app/packages/db
RUN pnpm exec prisma generate
CMD sh -c "pnpm exec prisma migrate deploy && pnpm exec prisma db seed"
```

- [ ] **Step 6: Build each image individually to verify**

```powershell
docker build -f docker/api.Dockerfile -t streamflare-api .
docker build -f docker/web.Dockerfile -t streamflare-web .
docker build -f docker/ml.Dockerfile -t streamflare-ml .
docker build -f docker/db-init.Dockerfile -t streamflare-db-init .
```

Expected: each builds without error. The ML one takes longest (Python deps).

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat(docker): add multi-stage Dockerfiles for api, web, ml, db-init"
```

---

### Task 18: `docker-compose.yml` + End-to-End Verification

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  db-init:
    build:
      context: .
      dockerfile: docker/db-init.Dockerfile
    environment:
      DATABASE_URL: file:/data/streamflare.db
      SEED_DATA_DIR: /seed-data
    volumes:
      - sqlite-data:/data

  api:
    build:
      context: .
      dockerfile: docker/api.Dockerfile
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: file:/data/streamflare.db
      JWT_SECRET: ${JWT_SECRET}
      TMDB_API_KEY: ${TMDB_API_KEY}
      ML_SERVICE_URL: http://ml:5001
      PORT: 5000
    volumes:
      - sqlite-data:/data
    depends_on:
      db-init:
        condition: service_completed_successfully

  ml:
    build:
      context: .
      dockerfile: docker/ml.Dockerfile
    ports:
      - "5001:5001"
    environment:
      DATABASE_URL: file:/data/streamflare.db
      PORT: 5001
    volumes:
      - sqlite-data:/data
    depends_on:
      db-init:
        condition: service_completed_successfully

  web:
    build:
      context: .
      dockerfile: docker/web.Dockerfile
      args:
        NEXT_PUBLIC_API_URL: http://localhost:5000
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:5000
    depends_on:
      - api

volumes:
  sqlite-data:
```

- [ ] **Step 2: Create a real `.env` from `.env.example`**

```powershell
Copy-Item .env.example .env
# Edit .env: set JWT_SECRET to a strong random string and TMDB_API_KEY to your real key.
```

- [ ] **Step 3: Bring the full stack up**

```powershell
docker compose up --build
```

Expected:
- `db-init` runs migrations and seeds, then exits 0.
- `api` starts and logs "API listening on :5000".
- `ml` starts and logs "ML server listening on :5001".
- `web` builds (if first run), starts, logs "ready" on :3000.

- [ ] **Step 4: End-to-end smoke check**

In a new terminal:

```powershell
Invoke-RestMethod http://localhost:5000/api/subscription/plans
Invoke-RestMethod http://localhost:5000/api/browse/genre
Invoke-RestMethod -Method Post -Uri http://localhost:5001/recommend -Body '{"movieTitle":"Batman"}' -ContentType 'application/json'
```

Expected: each returns valid JSON.

Then open `http://localhost:3000` in a browser. Sign up. Log in. Browse. Expected: end-to-end works.

- [ ] **Step 5: Bring it down**

```powershell
docker compose down
```

- [ ] **Step 6: Commit**

```powershell
git add .
git commit -m "feat(docker): add docker-compose orchestrating db-init, api, ml, web"
```

---

## Phase 6 — Finalize

### Task 19: Root README + Final Polish

**Files:**
- Create: `README.md` (new, at root)

- [ ] **Step 1: Create new `README.md`**

```markdown
# StreamFlare

A movie streaming app — refactored into a Turborepo monorepo with TypeScript, Next.js, Prisma + SQLite, and a Python ML recommendation service. All apps run in Docker via `docker-compose`.

## Apps

- `apps/web` — Next.js 14 frontend (port 3000)
- `apps/api` — Express + TypeScript API (port 5000)
- `apps/ml` — Express + Python recommendation server (port 5001)

## Shared Packages

- `packages/db` — Prisma schema, client, migrations, seed
- `packages/types` — Shared TypeScript DTOs

## Quick Start (Docker)

Requires Docker Desktop.

```sh
cp .env.example .env
# Edit .env: set JWT_SECRET and TMDB_API_KEY
docker compose up --build
```

Open <http://localhost:3000>.

## Local Development (without Docker)

Requires Node 20, pnpm 9, Python 3.10+.

```sh
pnpm install
pip install -r apps/ml/python/requirements.txt
cp .env.example .env
# Edit .env

# First time only:
pnpm db:migrate
pnpm db:seed

pnpm dev
```

This starts all three apps in parallel:
- web: <http://localhost:3000>
- api: <http://localhost:5000>
- ml: <http://localhost:5001>

## Useful Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Run all apps in dev mode |
| `pnpm build` | Build all apps |
| `pnpm typecheck` | TypeScript check across the monorepo |
| `pnpm test` | Run all tests |
| `pnpm db:migrate` | Create + apply a new migration |
| `pnpm db:seed` | Seed SQLite from legacy CSV data |
| `pnpm db:studio` | Open Prisma Studio |

## Env Vars

See `.env.example`.

## Original Project

The original Oracle/React/JS code is preserved under `legacy/` for reference.
```

- [ ] **Step 2: Final sweep — `pnpm install && pnpm typecheck && pnpm test`**

```powershell
pnpm install
pnpm typecheck
pnpm test
```

Expected: all pass.

- [ ] **Step 3: Verify nothing important is missing**

```powershell
git status
```

Expected: only `README.md` is new.

- [ ] **Step 4: Commit**

```powershell
git add README.md
git commit -m "docs: add monorepo README with setup and dev instructions"
```

- [ ] **Step 5: Final verification — full docker-compose run from clean state**

```powershell
docker compose down -v
docker compose up --build
```

Expected: the volume `sqlite-data` is recreated, `db-init` reseeds, all three apps come up cleanly, frontend loads at `http://localhost:3000` and shows seeded movies.

---

## Done

All 19 tasks complete. The repo is now a Turborepo monorepo with three TypeScript apps backed by SQLite via Prisma, fully containerized.
