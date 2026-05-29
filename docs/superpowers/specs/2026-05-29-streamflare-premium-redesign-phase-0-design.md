# StreamFlare Premium Redesign — North Star + Phase 0 (Design System Foundation)

**Date:** 2026-05-29
**Status:** Approved direction; Phase 0 spec for review.
**Supersedes:** the editorial-brutalist attempt (branch `brutalist-redesign` / PR #2, parked as fallback).

---

## 1. Goal

Reimagine StreamFlare end-to-end (web + api + ml) from a Netflix-clone with a tangled
styling stack into a **production-grade, "Premium Modern" cinematic product** with a
distinctive identity, real motion, surfaced content data, and several new full-stack
features. Resume-showcase quality is an explicit requirement.

This document is the **program north star** (locked direction, identity, roadmap) plus the
**Phase 0 spec** (the design-system foundation everything else builds on). Later phases get
their own spec → plan → build cycles that reference this north star.

## 2. Locked decisions

- **Direction:** Premium Modern cinematic (NOT brutalist). Sleek dark cinematic UI.
- **Identity:** "Aurora Noir" — cool blue-violet near-black chrome, a luminous indigo→cyan
  accent used sparingly, characterful geometric display type, purposeful glass.
  Executed deliberately to avoid the generic "SaaS dark mode" reflex (see §5.6).
- **Stack:** migrate `apps/web` UI from styled-components to **Tailwind v4 + shadcn/ui**
  (Radix + CVA). Shared design system in **`packages/ui`** (shadcn monorepo mode).
  **Framer Motion** for motion. Remove styled-components, MUI, Bootstrap, reactstrap,
  react-country-region-selector.
- **Scope:** full reimagining + new backend features (the 4 in §4).
- **Delivery:** phased; each phase ships working, verifiable software. Backend feature
  specs are interleaved immediately before the UI that consumes them.
- **Branch:** fresh off `master`.

## 3. Program roadmap

| Phase | Subsystem(s) | Outcome |
|------|---------------|---------|
| **0** | `packages/ui`, `apps/web` | Design-system foundation: Tailwind v4 + shadcn, Aurora Noir tokens, fonts, motion primitives, core components, legacy-lib removal, impeccable context. |
| **1** | `apps/web` (brand + product) | Cinematic landing, sign in / sign up, first-run onboarding. |
| **2** | `apps/web` | App shell (global nav/topbar), profile selection + management, account settings, subscription/billing UX. |
| **3** | `apps/web` + `apps/api` | Browse core: cinematic hero, content rows, **title detail pages + More Like This**, **⌘K search + filters**, **personalized "For You"** rows, watchlist. |
| **4** | `apps/web` + `apps/api` | Watch experience: redesigned cinematic player with resume, episode/season navigation, ratings. |
| **A** | `apps/api`, `apps/web` | Admin & analytics dashboard (full-stack + data-viz). May run in parallel after Phase 0. |

Backend specs feed the phases that need them:
- *Detail/Similarity/Episodes read endpoints* → before Phase 3 detail pages.
- *Search filter params* → before Phase 3 search.
- *ML "For You"/trending/new aggregation* → before Phase 3 personalized home.
- *Admin/analytics endpoints + (optional) new models* → before Phase A.

## 4. New / upgraded features (all in scope)

1. **Title detail pages + More Like This** — per-title (movie & show) cinematic pages with
   synopsis, cast (`Celeb`), genres, maturity rating, runtime, rating, season/episode
   browser, and a "More Like This" rail from the existing `MovieSimilarity`/`ShowSimilarity`
   tables. This data already exists but is hidden in the current UI.
2. **⌘K command palette + advanced search/filters** — keyboard-driven `cmdk` overlay plus
   filtered search (genre, year, rating, maturity, type), upgrading the existing search
   controller with filter params.
3. **Personalized "For You" home (ML-powered)** — wire the existing Python TF-IDF ML service
   into real personalized rows ("For You", "Because you watched X"), plus trending (from
   `total_views`) and new releases (from `release_date`).
4. **Admin & analytics dashboard** — manage titles and view analytics (views, votes, ratings,
   trending) with charts.

## 5. Aurora Noir identity (applies to all phases)

### 5.1 Color (OKLCH)

Cool blue-violet neutrals, hue ≈ 274. Reduce chroma toward the lightness extremes. Never
`#000`/`#fff`; every neutral is tinted toward the brand hue.

```
--sf-canvas        oklch(0.16 0.015 274)   page background (cool violet near-black)
--sf-surface-1     oklch(0.20 0.018 274)   raised background / sections
--sf-surface-2     oklch(0.24 0.020 274)   cards
--sf-surface-3     oklch(0.28 0.022 274)   popovers / dropdowns
--sf-overlay       oklch(0.12 0.015 274)   scrim base (used with alpha)
--sf-hairline      oklch(0.30 0.018 274)   borders / dividers
--sf-line-strong   oklch(0.38 0.020 274)   emphasized borders

--sf-text          oklch(0.97 0.005 274)   primary text (near-white, faint cool tint)
--sf-text-muted    oklch(0.76 0.012 274)   secondary text
--sf-text-subtle   oklch(0.60 0.012 274)   tertiary / meta

--sf-accent        oklch(0.68 0.170 274)   indigo — primary CTA / active / focus
--sf-accent-hover  oklch(0.72 0.170 274)
--sf-accent-2      oklch(0.80 0.130 210)   cyan — gradient partner / highlights
--sf-accent-ink    oklch(0.16 0.020 274)   foreground ON accent surfaces (dark)
--sf-accent-grad   linear-gradient(120deg, oklch(0.68 0.17 274), oklch(0.80 0.13 210))

--sf-success       oklch(0.72 0.150 155)
--sf-warning       oklch(0.80 0.130 85)
--sf-danger        oklch(0.62 0.200 22)
--sf-danger-ink    oklch(0.98 0.010 22)
```

**Color strategy = Restrained.** Cool neutral chrome carries the surface; the indigo→cyan
glow appears only on focus rings, the single primary CTA per screen, active nav, and hero
moments (target < 10% of any view). Poster art supplies the warmth and saturation.

### 5.2 Elevation & effects

Tinted, layered shadows (not pure-black) + an optional accent glow for focus/hero.

```
--sf-shadow-1  0 1px 2px oklch(0.10 0.02 274 / 0.40)
--sf-shadow-2  0 8px 24px oklch(0.08 0.02 274 / 0.45)
--sf-shadow-3  0 24px 64px oklch(0.06 0.02 274 / 0.55)
--sf-glow      0 0 0 1px oklch(0.68 0.17 274 / 0.5), 0 0 24px oklch(0.68 0.17 274 / 0.25)
```

- A very subtle canvas **grain/noise** layer prevents flat gradient banding on dark surfaces.
- **Glass** (`backdrop-filter: blur`) is used only over imagery or on transient overlays
  (sticky topbar over hero, sheets, command palette) — never decoratively on flat surfaces.

### 5.3 Radii & spacing

```
--sf-radius-sm 6px · --sf-radius 10px (default) · --sf-radius-lg 16px · --sf-radius-xl 24px · --sf-radius-full 9999px
spacing scale (4px base): 1=4 2=8 3=12 4=16 5=24 6=32 7=48 8=64 9=96 10=128 11=160
```

Spacing varies for rhythm; avoid uniform padding everywhere. Containers use a consistent
max width; not everything is wrapped in a container.

### 5.4 Typography

- **Display:** `Clash Display` (geometric, variable), self-hosted woff2 via `next/font/local`
  → CSS var `--sf-font-display`. Hero titles, big numerals, section headers.
- **Body / UI:** `Inter` (variable) via `next/font/google` → `--sf-font-body`.
- **Mono:** `JetBrains Mono` via `next/font/google` → `--sf-font-mono`. Metadata, timecodes,
  labels, tabular figures (use `font-variant-numeric: tabular-nums` for data/prices/timers).
- **Scale:** 12 · 14 · 16 · 20 · 26 · 34 · 46 · 64 (≥1.25 ratio between steps). Body
  line-height 1.5–1.6, capped 65–75ch. Hierarchy via size + weight (display 600–700, body
  400, labels 500).
- **Fallback:** if the Clash Display woff2 cannot be fetched in the build environment, fall
  back to Google `Sora` for `--sf-font-display` (documented in the plan; identity unchanged
  in spirit).

### 5.5 Motion (Framer Motion)

```
--sf-dur-fast 150ms · --sf-dur 250ms · --sf-dur-slow 400ms
enter easing  cubic-bezier(0.16, 1, 0.3, 1)   (ease-out-expo-ish)
interactive   spring { stiffness: 300, damping: 30 }
exit          ~65% of enter duration
```

Patterns: page fade+slide-up; hero parallax; horizontal row stagger (~40ms/item);
shared-element transition into detail pages; card hover-scale 1.03; focus glow; skeleton
shimmer. Never animate layout properties (use transform/opacity). All motion is wrapped so
that `prefers-reduced-motion` collapses to opacity-only (or none) via a top-level
`MotionConfig` + `useReducedMotion`.

### 5.6 Anti-slop guardrails (impeccable)

- Push the palette to read **aurora/cinematic** — violet-tinted chrome + cyan partner —
  not the default electric-blue SaaS dark mode. The display face (Clash Display) and grain
  reinforce bespoke identity.
- **Bans:** no gradient text, no side-stripe accent borders, no glassmorphism-as-default,
  no hero-metric template, no identical icon+heading+text card grids, no modal-as-first-thought.
- One primary CTA per screen; secondary actions visually subordinate.
- Consistent elevation scale; never random shadow values. SVG icons (lucide), never emoji.

## 6. Phase 0 scope — Design System Foundation

### 6.1 Tech foundation

- Install **Tailwind v4** (CSS-first `@theme`) and wire it through **PostCSS** for Next 14.
- Initialize **shadcn/ui** in **monorepo mode** with the design system in `packages/ui`:
  - `packages/ui` owns the Tailwind theme/preset, the token CSS, and shadcn components under
    `packages/ui/src/components/ui/*`, exported from `packages/ui/src/index.ts`.
  - `apps/web` consumes the shared preset + components; `transpilePackages` already includes
    `@streamflare/ui`. Tailwind content globs include `packages/ui` sources.
  - A `components.json` configures shadcn for the package.
- Aurora Noir tokens live as CSS custom properties in a single theme stylesheet and are
  mapped into the Tailwind theme so utilities (`bg-canvas`, `text-muted`, `border-hairline`,
  `bg-accent`, etc.) resolve to the tokens. shadcn's semantic vars (`--background`,
  `--foreground`, `--primary`, `--ring`, `--radius`, …) are aliased to the `--sf-*` tokens.

### 6.2 Typography setup

- Self-host Clash Display woff2 under `apps/web` (or `packages/ui`), loaded with
  `next/font/local`; `Inter` + `JetBrains Mono` via `next/font/google`. Expose all three as
  CSS variables on `<html>` and feed them to the Tailwind `fontFamily` theme.

### 6.3 Motion system

- Add `framer-motion`. Create motion primitives in `packages/ui`: `FadeIn`, `Stagger`
  (+`StaggerItem`), `HoverScale`, and a `Motion` re-export, plus a `ReducedMotionProvider`
  wrapping `MotionConfig`. Motion duration/easing read from the tokens.

### 6.4 Component inventory (built/installed this phase)

- **shadcn primitives:** button, input, label, textarea, select, dropdown-menu, dialog,
  sheet, command, popover, tooltip, tabs, avatar, badge, skeleton, sonner (toast),
  scroll-area, separator, switch, checkbox, slider, progress, aspect-ratio, hover-card,
  navigation-menu, form, accordion, alert, alert-dialog.
- **Bespoke StreamFlare primitives** (on top of shadcn/tokens): `Wordmark`, `GlowButton`,
  `GlassPanel`, `SectionHeader`, `Rating`, `MaturityBadge`, `GenreChip`, `PosterCard`,
  `ContentRow` (snap-scroll + arrow controls), `HeroBackdrop` (parallax + gradient scrim),
  `EmptyState`.
- Feature-specific components (player, command-palette search UI, detail layout, charts)
  are built in their own phases.

### 6.5 Forms standardization

- Adopt **react-hook-form + zod + shadcn `form`** as the form pattern. Replace
  `react-country-region-selector` with a shadcn **Combobox** backed by a static country list
  and remove the dependency.

### 6.6 Legacy removal

- Remove `styled-components`, `@mui/material`, `@mui/icons-material`, `@emotion/*`,
  `bootstrap`, `reactstrap`, `react-country-region-selector`, `react-select`,
  `react-popper`, and `normalize.css` from `apps/web` once their usages are replaced.
- The styled-components SSR registry (`apps/web/lib/registry.tsx`) and
  `packages/ui/src/styles/global.ts` are retired in favor of Tailwind's global stylesheet.
  Old `@streamflare/ui` styled components are removed as each consuming surface is migrated;
  Phase 0 establishes the foundation and migrates only what's needed to keep the app
  compiling (the full page migration happens in Phases 1–4).
- **Migration safety:** Phase 0 keeps the app building and tests green at every commit. Where
  a page still imports an old component that hasn't been migrated yet, the old component
  stays until its phase. No route is left broken between commits.

### 6.7 impeccable context

- Generate `PRODUCT.md` (users, brand, tone, anti-references, register) and `DESIGN.md`
  (Aurora Noir tokens, type, elevation, components) at the repo root so future impeccable
  runs are on-brand.

### 6.8 Accessibility

- WCAG AA: verify contrast for every token pair actually used as text/background, including
  text on `--sf-accent` (use `--sf-accent-ink`) and muted text on surfaces. Visible
  focus-visible ring (accent, 2px). Honor reduced-motion. Icon-only controls get
  `aria-label`. Semantic input types; labels visible (not placeholder-only).

### 6.9 Testing & quality bar

- Keep **vitest + jsdom + @testing-library**. Add tests: token stylesheet presence/sanity,
  render smoke for `Button`/`GlowButton`/`Field`-equivalent and a couple of bespoke
  primitives, and reduced-motion behavior.
- Green gate per commit: `pnpm --filter @streamflare/ui typecheck`,
  `pnpm --filter @streamflare/web typecheck`, web vitest, and a production build
  (`NEXT_DISABLE_STANDALONE=1 next build`) prerendering all routes. No hardcoded hex in
  components (tokens only).

## 7. Non-goals (Phase 0)

- No page redesigns yet (that's Phases 1–4). Phase 0 only builds the system + primitives and
  keeps the app compiling.
- No backend changes in Phase 0.
- No removal of the parked `brutalist-redesign` branch / PR #2.

## 8. Risks & contingencies

- **Tailwind v4 + shadcn + monorepo + Next 14** friction → if setup proves fragile, fall back
  to Tailwind v3 (shadcn stable), documented in the plan; identity/tokens unchanged.
- **Clash Display fetch blocked** → fall back to Google `Sora` for display.
- **Windows standalone build EPERM** → builds run with `NEXT_DISABLE_STANDALONE=1`; Docker
  path keeps standalone.
- **Big-bang lib removal breaking routes** → migrate incrementally; keep old components until
  their phase; never leave a route broken between commits.

## 9. Definition of done (Phase 0)

- Tailwind v4 + shadcn operational in `packages/ui`, consumed by `apps/web`.
- Aurora Noir tokens + fonts + motion primitives in place; shadcn semantic vars aliased to
  `--sf-*`.
- Listed shadcn + bespoke components exist, exported, and render.
- Legacy styling libs removed (or scheduled with a clear, compiling migration path) with the
  app still building and all routes prerendering.
- `PRODUCT.md` + `DESIGN.md` written.
- Typecheck + vitest + production build all green; AA contrast verified.
