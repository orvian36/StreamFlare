# StreamFlare Premium Redesign — Phase 2B (App Shell, Account & Subscription) Design

**Date:** 2026-05-29
**Status:** Approved direction; spec for review.
**Depends on:** Phases 0/1 (merged) + Phase 2A (ProfileAvatar, PlanPicker, onboarding).

## 1. Goal

Introduce the authenticated `AppShell` (top nav + profile menu) and redesign the account
settings and subscription management surfaces in Aurora Noir. Password and phone editing move
into inline dialogs on the account page. Preserve all API contracts. No backend changes.

## 2. Scope

In scope: a reusable `AppShell`; `/account` (sectioned settings + password/phone dialogs);
`/subscription/update`, `/subscription/cancel`, `/subscription/history`. Remove the now-unneeded
`/account/password` and `/account/phone` routes (only `/account` links to them today; replaced
by dialogs). `/subscription/add` standalone is retained and restyled to reuse `PlanPicker`.

Out of scope (Phase 3+): `/browse` (adopts `AppShell` then), watch, history (movie/show watch
history pages remain as-is until a later pass; `/account` keeps links to them).

## 3. Preserved contracts (must not change)

- **Account end date:** `GET /api/subscription/getenddate/:email` → `{ ed: { ED: string } | null }`.
- **Update password:** `PATCH /api/users/updatepassword` `{ EMAIL, OLD_PASS, NEW_PASS, NEW_PASS_CON }`;
  201 ok, 422 incorrect old password, 423 new passwords don't match.
- **Get/Update phone:** `GET /api/users/getphone/:email` → `{ phone: { PHONE: string } }`;
  `PATCH /api/users/updatephone` `{ EMAIL, Phone }` (note the exact key `Phone`); 201 ok, 422 invalid.
- **Plans:** `GET /api/subscription/plans` → `{ plans: { SUB_TYPE, BILL, NUM_PROFILES }[] }`.
- **Update subscription:** `POST /api/subscription/update` `{ EMAIL, SUB_TYPE, END_DATE }`; 201 ok
  (then `set_bill`, `set_max_profiles`; if `num_profiles > NUM_PROFILES` send to manage-profiles
  to remove the excess, else browse), 422 invalid.
- **Cancel subscription:** `PATCH /api/subscription/delete` `{ EMAIL }`; 201 ok, 422 invalid.
- **History:** `GET /api/subscription/history/:email` → `{ history: { S_DATE, T_DATE, SUB_TYPE, TOTAL_BILL }[] }`.

## 4. `AppShell` (new, `apps/web/components/app/app-shell.tsx`)

Sticky glass top nav wrapping authenticated content:
- Left: Wordmark → `/browse`.
- Right: a **profile menu** — `ProfileAvatar` (of `auth.profile ?? auth.email`) opening a shadcn
  `DropdownMenu`: a header row (avatar + current profile/email), **Account** → `/account`,
  **Switch profile** → `/profiles`, separator, **Sign out** (`auth.logout()` → `/signin`).
- Optional `children` slot for page content with a sensible max-width container.
- Redirects to `/signin` if `!auth.email` (guard). Client component (auth + router).
- Used by `/account` and `/subscription/*` now; `/browse` adopts it in Phase 3 (it may also
  accept a center `nav` slot for browse's section links — built when needed, not now).

## 5. `/account` — settings

Rendered inside `AppShell`. Sectioned single-column layout (max-w ~2xl), each section a titled
block separated by hairlines:
- **Membership & billing:** current plan (derived from `auth.bill`: 5→Basic/2, 8→Standard/4,
  10→Premium/6, else "No active plan"), renew date from `getenddate`, monthly price. Buttons:
  "Change plan" → `/subscription/update`, "Payment history" → `/subscription/history`,
  "Cancel membership" → `/subscription/cancel`.
- **Security:** "Change password" and "Update phone" buttons that open **dialogs** (§6). Shows
  the current phone (from `getphone`).
- **Profiles:** "Manage profiles" → `/profiles/delete`; "Switch profile" → `/profiles`.
- **Watch history:** links to `/history/movies` and `/history/shows` (those pages unchanged this
  phase).
- Sign out button (also in the shell menu).

## 6. Security dialogs (new components)

`apps/web/components/account/password-dialog.tsx` and `phone-dialog.tsx` — shadcn `Dialog` +
rhf + zod (`apps/web/lib/account-schemas.ts`):
- **Password:** fields old / new / confirm; zod requires old non-empty, new ≥ 8, and
  `new === confirm` (`.refine`); `PATCH updatepassword`; map 422 ("Current password is
  incorrect") and 423 ("New passwords don't match"); on 201 close + success toast.
- **Phone:** field new phone (≥ 5, tel); prefilled with current phone; `PATCH updatephone`
  `{ EMAIL, Phone }`; 422 → "Invalid number"; on 201 close + toast + refresh shown phone.
- Both: inline `Alert` for server errors, loading/disabled submit, `aria` correct, controlled
  `open` from the account page.

## 7. Subscription pages

- **`/subscription/update`** (inside `AppShell`): heading "Change your plan", `PlanPicker` with
  `currentType` set to the plan whose `BILL === auth.bill` (so the active plan shows "Current
  plan"); `onSelect` → `POST update`; on 201 `set_bill`/`set_max_profiles`, then if
  `(auth.num_profiles ?? 0) > NUM_PROFILES` route to `/profiles/delete` (remove excess) else
  `/browse`; 422 → inline alert. Back link to `/account`.
- **`/subscription/cancel`** (inside `AppShell`): a focused confirm card with a destructive
  `AlertDialog` ("Cancel membership? You'll keep access until the end of your billing period.")
  → `PATCH delete`; on 201 → `/account` (now shows no active plan); 422 → alert.
- **`/subscription/history`** (inside `AppShell`): Aurora table/list of records (Start, End,
  Plan, Total) using `tabular-nums`; `EmptyState` when none; back link to `/account`.
- **`/subscription/add`** standalone: restyled to reuse `PlanPicker` (`onSelect` → `POST add` →
  `/browse`), inside a centered layout (not `AppShell`, since it's also part of the pre-app
  flow). Kept working for the sign-in-without-sub edge and direct links.

## 8. Components summary

New: `apps/web/components/app/app-shell.tsx`, `apps/web/components/account/password-dialog.tsx`,
`apps/web/components/account/phone-dialog.tsx`, `apps/web/lib/account-schemas.ts`.
Reused: `ProfileAvatar`, `PlanPicker` (2A); shadcn `DropdownMenu`, `Dialog`, `AlertDialog`,
`Form`, `Input`, `Alert`, `Separator`. Server components import primitives via subpaths.
Removed: `apps/web/app/account/password/page.tsx`, `apps/web/app/account/phone/page.tsx`
(and the `UPDATE_PHONE`/`UPDATE_PASSWORD` route constants if unused elsewhere — verify, keep if
referenced).

## 9. Accessibility

Dropdown + dialogs are Radix (focus trap, escape, aria); destructive cancel is clearly marked;
forms have visible labels, inline `role="alert"` errors, first-invalid focus; AA contrast;
reduced-motion respected; the history table uses real `<table>` semantics with headers.

## 10. Testing

- `AppShell`: renders wordmark + profile menu; menu items route (Account/Switch/Sign out);
  redirects when unauthenticated.
- `/account`: shows plan label for a given `bill`; opens password & phone dialogs.
- password dialog: zod rejects mismatched new/confirm and <8 new; valid submit PATCHes the exact
  payload; 422/423 mapped.
- phone dialog: valid submit PATCHes `{ EMAIL, Phone }`; prefilled from current.
- `/subscription/update`: marks current plan; selecting posts update and routes (browse vs
  manage-profiles by profile count).
- `/subscription/cancel`: confirm → PATCH delete → `/account`.
- `/subscription/history`: renders rows / empty state.
- All existing tests stay green; typecheck (ui + web) + production build green.

## 11. Non-goals

No backend changes; no `/browse`/watch/history redesign; no new subscription features beyond the
existing endpoints.

## 12. Definition of done

`AppShell` built and wrapping account + subscription pages; `/account` sectioned with working
password/phone dialogs; `/subscription/{update,cancel,history,add}` rebuilt in Aurora Noir;
old `/account/password` + `/account/phone` routes removed; contracts preserved; a11y in §9 met;
tests in §10 green; typecheck + build green.
