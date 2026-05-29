# Specification: StreamFlare Brutalist Redesign

Replace StreamFlare's Netflix-clone visual identity with a committed **editorial / typographic brutalist** language across the entire web app, delivered in phases. The compound-component structure and the Next.js App Router setup stay; the visual layer is fully replaced.

## Locked Direction

Decided during brainstorming:

- **Aesthetic:** Editorial / typographic brutalism. Oversized display type, asymmetric exposed grid, generous whitespace, hard edges. Type and posters do the talking.
- **Canvas:** Near-black, cool-tinted (not `#000`). Artwork and video glow against it.
- **Color strategy:** Mono surface plus one jarring accent (acid lime) used under ~10% of any surface.
- **Delivery:** Phased, highest-impact first (Phase 0 system, then landing/auth, then core product, then settings).

### Explicit non-goals

- No Netflix red `#e50914`, no `#000`, no `#fff`.
- No neo-brutalism template (safety-yellow + thick borders + hard offset shadows + Space Grotesk). This is the second-order reflex and is avoided on purpose.
- No glassmorphism, no decorative shadows, no gradient text, no side-stripe accent borders, no hero-metric template, no identical card grids.
- No migration off styled-components. No framework changes.

## 1. Technical Approach

Tokenize styled-components in place.

1. Define all design tokens as **CSS custom properties** in a `createGlobalStyle` block exported from `@streamflare/ui` (`packages/ui/src/styles/global.ts`) plus a plain TS export of the same values (`packages/ui/src/tokens.ts`) for use in component logic.
2. Load fonts with `next/font/google` in `apps/web/app/layout.tsx`, exposing them as CSS variables (`--font-display`, `--font-body`, `--font-mono`).
3. Rewrite each `packages/ui/src/components/*/styles/*.ts` to consume `var(--...)` tokens. Remove every hardcoded hex (`#000`, `#e50914`, `#333`, etc.).
4. Keep the existing SSR registry (`apps/web/lib/registry.tsx`) and the compound-component public APIs unchanged wherever possible, so page code in `apps/web/app/**` needs minimal edits.
5. `apps/web/app/globals.css` keeps `normalize.css`, sets the canvas background and base text color from tokens, and removes the hardcoded country-dropdown styling in favor of tokenized field styles.

Rejected alternatives: migrating to Tailwind (large rewrite, touches the registry and every component, no requested benefit); a JS `ThemeProvider` theme object (raw CSS variables are more brutalist-honest and easier to inspect).

Optional cleanup, not required for this work: remove unused `@mui/material`, `@mui/icons-material`, `bootstrap`, `reactstrap` once no component references them.

## 2. Design Tokens

### Color (OKLCH, cool neutrals at hue ~265)

```
--canvas        oklch(0.17 0.012 265)   page background, near-black cool
--surface-1     oklch(0.21 0.014 265)   raised panels
--surface-2     oklch(0.26 0.016 265)   nested panels, inputs
--line          oklch(0.40 0.012 265)   hairlines, exposed grid rules
--line-strong   oklch(0.62 0.012 265)   emphasis dividers
--text          oklch(0.96 0.006 265)   primary text, off-white
--text-dim      oklch(0.70 0.012 265)   secondary text (>= 4.5:1 on canvas)
--accent        oklch(0.88 0.21 128)    acid lime signature, < 10% usage
--accent-ink    oklch(0.18 0.04 128)    near-black text placed on accent fills
--danger        oklch(0.62 0.20 25)     errors; always paired with icon/text
--ok            oklch(0.80 0.16 150)    success; always paired with icon/text
```

Accent discipline: lime appears only on primary CTAs, focus rings, active navigation, the logo mark, and the maturity/rating chips. Never as a background wash. Documented swaps (single token change): electric cyan `oklch(0.85 0.15 220)`, hot magenta `oklch(0.70 0.27 350)`, ultramarine `oklch(0.55 0.24 270)`.

### Typography

- `--font-display`: **Bricolage Grotesque** 800. Oversized headlines, tight tracking (-0.02em), selective UPPERCASE.
- `--font-body`: **Archivo** 400 / 500 / 600. Body and UI.
- `--font-mono`: **JetBrains Mono** 500. Kickers, section numbers, ratings, durations, season/episode, form labels, helper text. UPPERCASE with +0.08em tracking at small sizes.

All three are OFL fonts available on Google Fonts via `next/font`. Type scale (brutalist jumps, >= 1.25 ratio): `12 14 16 20 28 40 64 96 140`. Body minimum 16px, line-height 1.5, measure capped 65-75ch. Hero sizes use `clamp()` for fluid scaling.

### Spacing, borders, radius, motion, z-index

```
--space: 4 8 12 16 24 32 48 64 96 160   (px, used as --space-1 ... --space-10)
--radius: 0                              hard corners everywhere
--border-hair: 1px solid var(--line)
--border-emph: 2px solid var(--text)
--ease: cubic-bezier(0.16, 1, 0.3, 1)    ease-out-expo
--dur-fast: 180ms
--dur: 240ms
--z: 0 / 10 (sticky header) / 40 (dropdown) / 100 (player overlay) / 1000 (toast)
```

Motion rules: hover and focus transition border color, accent, and at most `transform: scale(1.02)`. Row item reveals stagger 40ms. `@media (prefers-reduced-motion: reduce)` removes transforms and shortens transitions. No bounce, no elastic, never animate layout properties.

## 3. Component Language

### New primitives (added to `@streamflare/ui`)

- **GlobalStyle** (`styles/global.ts`): token custom properties, base resets, canvas background, selection color (accent), focus-visible ring (2px accent, 2px offset).
- **Button**: `Accent` (lime fill, accent-ink text) and `Ghost` (transparent, 2px `--text` border, fills on hover). Hard corners, no shadow.
- **Field**: hard-bordered input, big mono label above (not placeholder-only), helper and error text below in mono, error state uses `--danger` plus an icon.
- **Tag / Kicker**: mono uppercase label, optional 1px frame, used for section numbers and category chips.
- **Section / Grid**: full-width hairline top rule, optional mono section number (`01`), modular column grid that is visible on the landing page.
- **Frame**: hard rectangular media frame, 1px `--line` border, no radius, desaturate-at-rest / full-color-on-focus behavior with a 2px accent outline on focus.

### Rebuilt components (keep compound APIs, rewrite styles)

Header, Header2, Feature, Card (rows), Jumbotron, Accordion, OptForm, Form, Form2, Profiles, Loading, Player, Footer.

Specific behavior changes from the current Netflix clone:

- **Header**: sticky, hairline bottom rule, mono nav links, active link marked with the accent (color + 2px underline), not a hover-reveal gloss dropdown. Profile dropdown becomes a hard-bordered panel.
- **Card rows**: posters in `Frame`, mono metadata (`★ 8.4`, `S2 E5`) always visible beneath rather than only on hover, focus/hover swaps to full color + accent outline + `scale(1.02)`. Replaces the `scale(1.3)` balloon.
- **Feature / hero**: huge Bricolage headline on near-black, mono subtitle/kicker, accent CTA. Text-shadow removed in favor of a solid scrim plane where text overlaps imagery.
- **Jumbotron**: asymmetric editorial panels, numbered, hairline separators instead of full-bleed alternating blocks.
- **Accordion**: full-border items, large mono `+ / -`, no rounded corners.
- **Forms (OptForm/Form/Form2)**: brutalist `Field` primitive, visible mono labels, inline validation on blur, error below field with icon.
- **Profiles**: hard-framed square avatars, mono names, accent outline on the focused/hovered avatar.
- **Loading**: replace the gif spinner with a brutalist determinate/indeterminate bar or a mono ticker. No raster spinner.
- **Player**: full-bleed overlay, hard-edged controls, accent scrub/active state.
- **Footer**: exposed grid of mono links under a `--line-strong` rule.

## 4. Phased Page Plan

### Phase 0, Foundation
Tokens, GlobalStyle, font wiring in `layout.tsx`, and the new primitives (Button, Field, Tag, Section/Grid, Frame). No page is "done" but the system compiles and is consumable. Everything else depends on this.

### Phase 1, Public face
- `/` landing: Header, Feature hero, OptForm, Jumbotron panels, FAQ Accordion, Footer. Visible column grid, numbered sections, oversized type.
- `/signin`, `/signup`: brutalist Form on near-black, mono labels, accent submit, inline validation.

### Phase 2, Core product
- `/profiles` (+ `/profiles/create`, `/profiles/delete`): "WHO'S WATCHING" as oversized display type, hard-framed avatars.
- `/browse`: profile gate, category nav in mono with accent active state, content rows with hard poster frames and always-on mono metadata, search slider restyled, featured player block.
- `/watch/[id]`: full-bleed player, hard controls, mono timecode.

### Phase 3, Settings
- `/account` (+ `/account/password`, `/account/phone`): settings as a bordered definition-list layout, plan tiers as bordered blocks (not identical cards), mono field labels.
- `/subscription/*` (add, update, cancel, history): plan selection as bordered blocks, history as a mono data table with tabular figures.
- `/history/movies`, `/history/shows`: watched lists reusing Card rows / Frame, mono timestamps.

## 5. Accessibility

- Contrast: `--text` on `--canvas` and `--accent-ink` on `--accent` both clear AA; `--text-dim` kept >= 4.5:1 where used as body. Verify each pair.
- Focus: visible 2px accent ring with 2px offset on every interactive element. Never remove focus outlines.
- Color is never the only signal: maturity/rating, error, and success states pair color with text or an icon.
- Respect `prefers-reduced-motion`. Keyboard navigation order matches visual order. Icon-only controls get `aria-label`.
- Touch targets >= 44px; mono labels stay legible at the smallest scale step.

## 6. Verification

- `pnpm --filter @streamflare/web typecheck` and `pnpm --filter @streamflare/ui typecheck` pass.
- `pnpm --filter @streamflare/web build` succeeds (SSR styles register without FOUC).
- Manual pass per phase at 375px, 768px, 1024px, 1440px, plus landscape, dark canvas only.
- Reduced-motion verified. Focus rings verified via keyboard tab-through.
- No hardcoded hex remains in `packages/ui/src/components/**/styles/*.ts` (grep check).

## 7. Anti-Slop Rationale

- First-order reflex avoided: streaming product is not `#000` + Netflix red. Cool near-black canvas, acid lime accent, brutalist structure instead of streaming gloss.
- Second-order reflex avoided: not the saturated neo-brutalism template. Editorial-typographic instead of offset-shadow blocks; Bricolage + Archivo + JetBrains Mono instead of Space Grotesk; acid lime instead of safety yellow; no hard drop shadows.
