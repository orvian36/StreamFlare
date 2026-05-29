# StreamFlare Premium Redesign — Phase 1 (Brand & Entry) Design

**Date:** 2026-05-29
**Status:** Approved direction; spec for review.
**Depends on:** Phase 0 design system (Aurora Noir tokens, shadcn primitives, bespoke
primitives, motion) — `docs/superpowers/specs/2026-05-29-streamflare-premium-redesign-phase-0-design.md`.

## 1. Goal

Redesign the public entry surfaces — **landing page, sign in, sign up** — into the Aurora
Noir premium-cinematic language, using the Phase 0 design system. Preserve all existing API
contracts and post-auth routing. No backend changes.

## 2. Scope

In scope: `/` (landing), `/signin`, `/signup`.
Out of scope (later phases): subscription, profiles, browse, watch, account, history. The
guided first-run onboarding (plan selection + profile creation) is folded into **Phase 2**
(those surfaces live there). Un-migrated pages keep working (Aurora-re-skinned brutalist).

## 3. Preserved contracts (must not change)

- **Sign in:** `POST /api/users/login` `{ EMAIL, PASSWORD }`; 201 success (returns `{ EMAIL, token }`),
  422 = user does not exist, 423 = incorrect password. On success: `auth.login`, then load
  `maxprofiles`, `numprofiles`, `subid` (+ `bill` if present) and route to `/browse` (has sub)
  or `/subscription/add` (no sub).
- **Sign up:** `POST /api/users/signup` `{ NAME, EMAIL, DOB, COUNTRY, CREDIT_CARD, PASSWORD, PHONE }`;
  201 success → `auth.login` → `/subscription/add`; 422 = invalid info, 423 = user exists.
  Password must be ≥ 8 chars.
- **Landing handoff:** "Get started" passes the typed email to `/signup?email=…`. Sign up will
  now **consume** that query param to prefill the email (currently dropped).

## 4. Landing (`/`)

Sections, top to bottom:

1. **Top bar** (`TopBar`): sticky, transparent over the hero, transitions to an Aurora glass
   bar (`backdrop-blur`) after scroll. `Wordmark` left; "Sign in" `GlowButton` (ghost) right.
2. **Hero** (`Hero`, client): full-bleed `HeroBackdrop` (a cinematic film still from
   `public/images/misc/`) with Aurora scrims and a subtle parallax/`FadeIn`. Oversized
   `font-display` headline ("Unlimited films, series, and more."), supporting subline
   ("Watch anywhere. Cancel anytime."), and an email opt-in: shadcn `Input` + `GlowButton`
   ("Get started") that routes to `/signup?email=…`. A small mono helper line.
3. **Showcase** (`Showcase`): a "Trending on StreamFlare" `ContentRow` of `PosterCard`s built
   from a static `trending.json` fixture that references real local poster images
   (`public/images/films/*`, `series/*`). No API/auth needed (public page). Row stagger motion.
4. **Why StreamFlare** (`WhySection`): three alternating media/text feature panels
   (`FeaturePanel`) from `jumbo.json`, using device imagery (`home-tv`, `home-mobile`,
   `home-imac`) inside a `Frame`-style media block; `FadeIn` on scroll. Led by a `SectionHeader`
   (index "01").
5. **FAQ** (`Faq`): shadcn `Accordion` populated from `faqs.json`, led by `SectionHeader`
   (index "02"); repeats the email opt-in CTA beneath.
6. **Footer** (`SiteFooter`): tokenized marketing footer (links grid + wordmark + copyright),
   replacing the current `FooterContainer`.

The page is a server component composing mostly server sections; `Hero` and the CTA form are
client components (`useState`/router). Imagery uses `next/image` where straightforward, with
explicit dimensions/`aspect-ratio` to avoid CLS.

## 5. Auth (`/signin`, `/signup`)

Shared **`AuthShell`** (client): a full-viewport `HeroBackdrop` (cinematic still + Aurora
scrim) with a centered `GlassPanel` card; `Wordmark` top-left; card stacks to full width on
mobile. Both forms live inside the card.

- **Forms:** shadcn `Form` + **react-hook-form + zod** (`@hookform/resolvers`). Visible labels,
  helper text, inline per-field errors (validate on blur), `aria-invalid`, submit button shows
  a loading state and is disabled while submitting. Top-level API failures surface as an inline
  `Alert` in the card **and** a sonner toast. Semantic input types + `autoComplete`.
- **Sign in fields:** email, password. zod: email valid, password non-empty. Maps 422/423/other
  to friendly messages. Link to sign up.
- **Sign up fields:** name, email (prefilled from `?email=`), password (≥8, show/hide toggle),
  date of birth (date), credit card (numeric, basic length check), phone (tel), country
  (`CountryCombobox`). zod schema enforces all. Maps 422/423/other. Link to sign in.
- Routing/auth-context calls unchanged from §3.

## 6. New components

App-level (composition) in `apps/web/components/`:
- `marketing/top-bar.tsx`, `marketing/hero.tsx`, `marketing/showcase.tsx`,
  `marketing/feature-panel.tsx`, `marketing/why-section.tsx`, `marketing/faq.tsx`,
  `marketing/site-footer.tsx`
- `auth/auth-shell.tsx`, `auth/sign-in-form.tsx`, `auth/sign-up-form.tsx`
- `lib/auth-schemas.ts` (zod schemas + inferred types)
- `fixtures/trending.json` (curated local posters: title + image path + meta)

Reused Phase 0 primitives: `Wordmark`, `GlowButton`, `GlassPanel`, `HeroBackdrop`,
`SectionHeader`, `ContentRow`, `PosterCard`, `Rating`/`MaturityBadge`/`GenreChip` (showcase),
`FadeIn`/`Stagger`; shadcn `Input`, `Label`, `Form`, `Accordion`, `Alert`, `Button`,
`Tooltip` as needed. No new primitives expected in `packages/ui`; if a genuinely reusable one
emerges (e.g., a password input with toggle) it goes in `packages/ui` and is exported.

## 7. Accessibility

Labels visible (not placeholder-only); errors via `role="alert"`/`aria-live`; first invalid
field focused on submit error; toasts use `aria-live` and don't steal focus; AA contrast
(Phase 0 tokens); reduced-motion respected (motion primitives already do); keyboard-navigable
accordion and combobox (Radix); hero/scrim text meets contrast over imagery (scrim guarantees
it).

## 8. Testing

- Landing renders hero headline, the CTA, the showcase row, and FAQ items (RTL).
- Sign-in form: invalid email shows error; valid submit calls the login endpoint (mock `api`)
  and routes per response (mock router). 422/423 show the mapped messages.
- Sign-up form: zod rejects <8-char password and missing fields; valid submit posts the exact
  payload shape in §3 and routes to `/subscription/add`; `?email=` prefills.
- All existing tests stay green; typecheck (ui + web) and production build (all routes) green
  (`NEXT_DISABLE_STANDALONE=1`).

## 9. Non-goals

No backend changes; no redesign of subscription/profiles/browse/watch/account/history (later
phases); no removal of styled-components/MUI yet (only the landing/auth styled-components usage
is replaced — the shared brutalist components they used, e.g. `Header`/`Form`/`Feature`/
`OptForm`/`Jumbotron`/`Accordion`, may remain in `packages/ui` until all consumers migrate).

## 10. Definition of done

Landing, sign in, sign up rebuilt in Aurora Noir per §4–5; `?email=` handoff wired; API
contracts/routing preserved; forms validated with rhf+zod; a11y items in §7 met; tests in §8
green; typecheck + build green.
