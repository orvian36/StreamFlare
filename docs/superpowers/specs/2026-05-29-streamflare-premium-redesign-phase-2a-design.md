# StreamFlare Premium Redesign — Phase 2A (Profiles & Onboarding) Design

**Date:** 2026-05-29
**Status:** Approved direction; spec for review.
**Depends on:** Phase 0 design system + Phase 1 (merged to master).

## 1. Goal

Redesign the profile layer and first-run onboarding in Aurora Noir: the "Who's watching?"
profile gate, profile create/delete (manage), and a guided onboarding stepper (choose plan →
create first profile → enter). Introduce a reusable `ProfileAvatar` primitive and a reusable
`PlanPicker`. Preserve all API contracts. No backend changes.

This is the first half of Phase 2; **Phase 2B** (authenticated `AppShell`/top-nav, account
settings, subscription management) follows. The full app shell is deferred to 2B because its
first real consumers (account, subscription) live there.

## 2. Scope

In scope: `/profiles` (gate), `/profiles/create`, `/profiles/delete` (manage), `/onboarding`
(new), the `ProfileAvatar` primitive, and the `PlanPicker` component. Routing repoint of the
Phase 1 auth forms into `/onboarding`.

Out of scope (2B / later): `AppShell` top-nav, `/account*`, `/subscription/*` standalone
pages (stay working, restyled in 2B), `/browse` (its inline profile gate is addressed in
Phase 3), watch, history.

## 3. Preserved contracts (must not change)

- **List profiles:** `GET /api/profiles/:email` → `{ profile: { PROFILE_ID: string; DOB: string|null }[] }`.
- **Create profile:** `POST /api/profiles/add` `{ EMAIL, PROFILE_ID, DOB }`; 201 ok, 400 invalid,
  423 already exists.
- **Delete profile:** `DELETE /api/profiles/delete` with body `{ EMAIL, PROFILE_ID }`; 200/201 ok,
  422 invalid.
- **Plans:** `GET /api/subscription/plans` → `{ plans: { SUB_TYPE, BILL, NUM_PROFILES }[] }`.
- **Add subscription:** `POST /api/subscription/add` `{ EMAIL, SUB_TYPE, END_DATE }` (END_DATE =
  YYYY-MM-DD, one month out); 201 ok.
- Auth context: `set_profile`, `set_ptbd`, `set_num_profiles`, `max_profiles`, `email`, `logout`
  used as today.

## 4. `ProfileAvatar` (new primitive, `packages/ui`)

`packages/ui/src/components/brand/profile-avatar.tsx`, exported from the barrel.
- Props: `name: string`, `size?: "sm" | "md" | "lg"` (default md), `selected?: boolean`,
  `className?`.
- Renders a rounded-`xl` tile with a **deterministic** Aurora gradient (hue derived from a
  simple hash of `name`, kept within the indigo→cyan family by mapping hash → an angle and
  picking two of the brand stops) and the uppercase first initial in `font-display`.
- `selected`/hover adds an accent ring (`ring-2 ring-ring`). Decorative gradient only (not
  conveying meaning), so it does not violate the no-gradient-text / no-decorative-glass bans
  (text is solid; gradient is a surface fill).
- Sizes: sm 40px, md 64px, lg 96px. `aria-hidden` on the gradient; the name is provided by the
  consuming label.

## 5. `/profiles` — profile gate

Full-screen centered "Who's watching?" experience under a minimal header (Wordmark left,
"Sign out" right):
- Grid of profile tiles: `ProfileAvatar` (md/lg) + name below; hover lifts + accent ring;
  click selects → `set_profile(PROFILE_ID)`, `set_ptbd(index)` → `/browse`.
- "Add profile" tile: dashed-border `ProfileAvatar`-sized tile with a `+`, shown only when
  `profiles.length < max_profiles`; links to `/profiles/create`.
- "Manage profiles" text link → `/profiles/delete`.
- Redirects to `/signin` if not authenticated (as today). Loading shows skeleton tiles.
- Motion: `Stagger` the tiles in.

## 6. `/profiles/create`

Centered Aurora card (reuse a simple centered layout, not the auth backdrop): heading "Add a
profile", rhf+zod form — `name` (required), `dob` (date, required) — `GlowButton` submit.
`POST /api/profiles/add`; 201 → `/browse`; 400 → "Invalid profile info"; 423 → "A profile with
that name already exists"; other → generic. Inline `Alert` + sonner on failure. Live
`ProfileAvatar` preview of the typed name beside the form.

## 7. `/profiles/delete` — manage profiles

Centered Aurora layout: heading "Manage profiles"; list each profile as a row (`ProfileAvatar`
sm + name + a destructive "Remove" `GlowButton`/icon button). Clicking Remove opens a shadcn
`AlertDialog` ("Remove <name>? This can't be undone."). Confirm → `DELETE /api/profiles/delete`
`{ EMAIL, PROFILE_ID }`; 200/201 → refresh list (and `set_num_profiles`); 422 → "Invalid user
info"; other → generic. Empty state if no profiles. Link back to the gate.

## 8. `/onboarding` — guided stepper (new)

Client route `/onboarding` rendering a two-step stepper with a progress indicator
("Step 1 of 2"):
- **Step 1 — Choose your plan:** `PlanPicker` (see §9). On select → `POST /api/subscription/add`
  `{ EMAIL, SUB_TYPE, END_DATE }`; on 201 advance to Step 2 (and set `set_sub_id`/`set_bill` if
  available from the response or a follow-up, mirroring today's behavior is not required since
  onboarding ends at browse).
- **Step 2 — Create your first profile:** name + DOB (rhf+zod) → `POST /api/profiles/add` → on
  201 → `/browse`.
- **State detection on mount:** if `!auth.email` → `/signin`; the stepper starts at Step 1.
  After a successful plan add, if the account already has profiles (fetch
  `GET /api/profiles/:email`, count > 0) skip Step 2 → `/browse`. (Covers the
  sign-in-without-subscription case where profiles already exist.)
- Layout: cinematic but focused — Aurora canvas, centered content, progress indicator, motion
  between steps (fade/slide via motion primitives).

## 9. `PlanPicker` (new component, `apps/web/components/subscription/plan-picker.tsx`)

- Props: `onSelect(subType: string): void`, `selecting?: string | null` (the plan being
  submitted, for loading state), `currentType?: string` (to mark the active plan, used by 2B
  update).
- Fetches `GET /api/subscription/plans`; renders three Aurora plan cards (name, `$BILL/month`,
  "Up to N profiles", a select `GlowButton`). Highlights the recommended/middle plan. No
  hardcoded plan data (driven by the API); falls back to an `EmptyState` if the list is empty.

## 10. Routing changes

- `SignUpForm` success → `/onboarding` (was `/subscription/add`).
- `SignInForm` no-subscription branch → `/onboarding` (was `/subscription/add`).
- The standalone `/subscription/add` route remains and still works (restyled in 2B); it is no
  longer the primary entry target.

## 11. Components summary

New in `packages/ui`: `ProfileAvatar` (exported from barrel).
New in `apps/web/components/`: `profiles/profile-gate-header.tsx` (minimal header),
`subscription/plan-picker.tsx`, `onboarding/onboarding-stepper.tsx`,
`profiles/manage-profiles.tsx` (delete list + dialog). Forms reuse rhf+zod + shadcn `Form`.
Server components import primitives via `@streamflare/ui/...` subpaths (barrel pulls the legacy
client `Player`, which breaks RSC — established in Phase 1).

## 12. Accessibility

Profile tiles are real buttons with accessible names (the profile name); keyboard-navigable
grid; `AlertDialog` traps focus and is escapable; forms have visible labels, inline errors via
`role="alert"`, first-invalid-field focus; progress indicator uses `aria-current`/text, not
color alone; AA contrast (Phase 0 tokens); reduced-motion respected.

## 13. Testing

- `ProfileAvatar`: renders the initial; same name → same gradient (deterministic); different
  names differ.
- `/profiles` gate: renders fetched profiles (mock `api`), selecting routes to `/browse` and
  sets the profile; "Add profile" hidden when at `max_profiles`.
- create: zod rejects empty name/dob; valid submit posts `{ EMAIL, PROFILE_ID, DOB }` and routes
  to `/browse`; 423 shows the exists message.
- manage/delete: confirm dialog → `DELETE` with `{ EMAIL, PROFILE_ID }`; list refreshes.
- `PlanPicker`: renders plans from a mocked endpoint; select fires `onSelect(SUB_TYPE)`.
- onboarding: step 1 select posts add and advances; step 2 posts profile and routes to
  `/browse`.
- All existing tests stay green; typecheck (ui + web) + production build (all routes) green.

## 14. Non-goals

No backend changes; no `AppShell`/account/subscription-standalone redesign (2B); no `/browse`
redesign (Phase 3); no removal of MUI/styled-components beyond these pages' own usage.

## 15. Definition of done

`/profiles`, `/profiles/create`, `/profiles/delete`, `/onboarding` rebuilt in Aurora Noir per
§4–10; `ProfileAvatar` + `PlanPicker` added; routing repointed; contracts preserved; a11y in
§12 met; tests in §13 green; typecheck + build green.
