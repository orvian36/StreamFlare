# StreamFlare Premium Redesign — Phase 0 (Design System Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a production-grade design-system foundation (Tailwind v4 + shadcn/ui in `packages/ui`, Aurora Noir tokens, fonts, Framer Motion primitives, core + bespoke components, a showcase route, and impeccable context) **additively**, so the existing styled-components/MUI app keeps building and every route still renders.

**Architecture:** The shared design system lives in `@streamflare/ui` (`packages/ui`). Tailwind v4 is configured CSS-first; Aurora Noir design tokens are CSS custom properties (`--sf-*`) in one `globals.css`, with shadcn's semantic vars (`--background`, `--primary`, `--ring`, …) aliased to them and a `@theme inline` block exposing brand utilities (`bg-canvas`, `text-muted`, `bg-primary`, `from-brand to-brand-2`). shadcn primitives are generated under `packages/ui/src/components/ui/*` and, together with hand-authored bespoke primitives and motion helpers, re-exported through the package barrel (`@streamflare/ui`) so apps keep a single import surface. styled-components and MUI remain installed and working until their pages are migrated in later phases.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS v4 (`@tailwindcss/postcss`), shadcn/ui (Radix + CVA + `cn`), Framer Motion, react-hook-form + zod, lucide-react, cmdk, sonner, Vitest + jsdom + Testing Library, pnpm/Turborepo monorepo.

**Reference spec:** `docs/superpowers/specs/2026-05-29-streamflare-premium-redesign-phase-0-design.md`.

---

## Conventions for every task

- Run all commands from the worktree root unless stated:
  `C:\Users\Best Laptop Gallery\Desktop\CodeDev\StreamFlare\.claude\worktrees\premium-redesign`
- Builds run with standalone disabled (Windows symlink EPERM):
  PowerShell: `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
- Green gate commands (used as verification throughout):
  - `pnpm --filter @streamflare/ui typecheck`
  - `pnpm --filter @streamflare/web typecheck`
  - `pnpm --filter @streamflare/web test`
- Commit after each task with the trailer:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- **Decision (font):** The geometric display face is **Sora** via `next/font/google` (zero-friction, reliably available, matches the Aurora Noir geometric intent). The spec named Clash Display with Sora as fallback; we flip to Sora-as-primary for build reliability and leave a one-line swap point to self-host Clash Display later. Identity is preserved.
- **Decision (additive scope):** Do **not** remove `styled-components`, `@mui/material`, `@emotion/*`, `bootstrap`, `reactstrap`, `react-select`, `react-popper`, or `react-country-region-selector` in Phase 0 — they are still used by un-migrated pages. Only `normalize.css` is dropped (Tailwind preflight replaces it). Keep `compiler.styledComponents: true` in `next.config.mjs`.

---

## File Structure

**Create:**
- `apps/web/postcss.config.mjs` — Tailwind v4 PostCSS plugin.
- `packages/ui/src/styles/globals.css` — `@import "tailwindcss"`, tokens, `@theme inline`, base layer.
- `packages/ui/src/lib/utils.ts` — `cn()` helper.
- `packages/ui/components.json` — shadcn config for the package.
- `apps/web/components.json` — shadcn config for the app (css → package globals).
- `packages/ui/src/components/ui/*.tsx` — generated shadcn primitives.
- `packages/ui/src/motion/index.tsx` — `FadeIn`, `Stagger`, `StaggerItem`, `HoverScale`, `ReducedMotionProvider`, motion tokens.
- `packages/ui/src/components/brand/{wordmark,glow-button,glass-panel,section-header,rating,maturity-badge,genre-chip,poster-card,content-row,hero-backdrop,empty-state}.tsx` — bespoke primitives.
- `packages/ui/src/components/forms/country-combobox.tsx` — shadcn Combobox country picker.
- `packages/ui/src/lib/countries.ts` — static country list.
- `apps/web/app/(design)/design/page.tsx` — design-system showcase route.
- `apps/web/app/fonts.ts` — `next/font` font definitions (display/body/mono).
- `PRODUCT.md`, `DESIGN.md` — impeccable context at repo root.
- New tests under `apps/web/__tests__/`.

**Modify:**
- `packages/ui/package.json` — add deps + `exports` map.
- `packages/ui/tsconfig.json` — `baseUrl` + intra-package `paths`.
- `apps/web/package.json` — add deps (framer-motion, rhf, zod, etc.); drop `normalize.css`.
- `apps/web/tsconfig.json` — confirm `@streamflare/ui/*` subpath resolution for tests/build.
- `apps/web/app/layout.tsx` — wire fonts + `ReducedMotionProvider` + `Toaster`; import package globals.
- `apps/web/app/globals.css` — remove `@import "normalize.css"` (kept minimal or deleted).
- `apps/web/vitest.config.ts` — add `@streamflare/ui` subpath resolve aliases.
- `packages/ui/src/index.ts` — re-export new primitives.

---

## Task 1: Dependencies + PostCSS (additive, app unchanged)

**Files:**
- Modify: `packages/ui/package.json`
- Modify: `apps/web/package.json`
- Create: `apps/web/postcss.config.mjs`

- [ ] **Step 1: Add design-system runtime deps to `packages/ui/package.json`**

Merge into `dependencies` (keep existing `react-player`, `styled-components`):

```json
{
  "dependencies": {
    "react-player": "^2.7.0",
    "styled-components": "^6.1.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "lucide-react": "^0.454.0",
    "framer-motion": "^11.11.0",
    "cmdk": "^1.0.0",
    "sonner": "^1.5.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "next": "^14.2.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "tw-animate-css": "^1.0.0"
  }
}
```

- [ ] **Step 2: Add app-level deps to `apps/web/package.json`**

Add to `dependencies`: `"framer-motion": "^11.11.0"`, `"react-hook-form": "^7.53.0"`, `"@hookform/resolvers": "^3.9.0"`, `"zod": "^3.23.8"`, `"lucide-react": "^0.454.0"`, `"cmdk": "^1.0.0"`, `"sonner": "^1.5.0"`, `"clsx": "^2.1.1"`, `"tailwind-merge": "^2.5.4"`, `"class-variance-authority": "^0.7.0"`.
Add to `devDependencies`: `"tailwindcss": "^4.0.0"`, `"@tailwindcss/postcss": "^4.0.0"`, `"tw-animate-css": "^1.0.0"`.
**Remove** from `dependencies`: `"normalize.css": "^8.0.1"`.

- [ ] **Step 3: Create `apps/web/postcss.config.mjs`**

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 4: Install**

Run: `pnpm install`
Expected: completes; lockfile updated; no peer-dependency errors that fail the install.

- [ ] **Step 5: Verify the app still builds (Tailwind not yet imported anywhere)**

Run (PowerShell): `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: build succeeds and prerenders all existing routes (unchanged behavior).

- [ ] **Step 6: Commit**

```bash
git add apps/web/package.json packages/ui/package.json apps/web/postcss.config.mjs pnpm-lock.yaml
git commit -m "build: add Tailwind v4 + shadcn/motion/form deps and PostCSS config

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `cn` helper + package exports + tsconfig paths

**Files:**
- Create: `packages/ui/src/lib/utils.ts`
- Modify: `packages/ui/package.json` (add `exports`)
- Modify: `packages/ui/tsconfig.json` (baseUrl + paths)
- Modify: `apps/web/vitest.config.ts` (resolve aliases)
- Test: `apps/web/__tests__/cn.test.ts`

- [ ] **Step 1: Write the failing test**

`apps/web/__tests__/cn.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { cn } from "@streamflare/ui/lib/utils";

describe("cn", () => {
  it("merges class names and dedupes conflicting tailwind utilities", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe("text-sm font-bold");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- cn`
Expected: FAIL — cannot resolve `@streamflare/ui/lib/utils`.

- [ ] **Step 3: Create `packages/ui/src/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Add `exports` map to `packages/ui/package.json`**

Add this top-level key (keep `main`/`types` for the barrel):

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./globals.css": "./src/styles/globals.css",
    "./lib/utils": "./src/lib/utils.ts",
    "./lib/*": "./src/lib/*.ts",
    "./hooks/*": "./src/hooks/*.ts",
    "./components/ui/*": "./src/components/ui/*.tsx",
    "./components/brand/*": "./src/components/brand/*.tsx",
    "./components/forms/*": "./src/components/forms/*.tsx",
    "./motion": "./src/motion/index.tsx"
  }
}
```

- [ ] **Step 5: Add `baseUrl` + `paths` to `packages/ui/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@streamflare/ui/lib/*": ["./src/lib/*"],
      "@streamflare/ui/hooks/*": ["./src/hooks/*"],
      "@streamflare/ui/components/ui/*": ["./src/components/ui/*"],
      "@streamflare/ui/components/brand/*": ["./src/components/brand/*"],
      "@streamflare/ui/components/forms/*": ["./src/components/forms/*"],
      "@streamflare/ui/motion": ["./src/motion/index.tsx"]
    }
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 6: Add subpath resolve aliases to `apps/web/vitest.config.ts`**

Add a `resolve.alias` entry so Vitest resolves package subpaths to source (keep the existing `esbuild`, `test`, and `server.deps.inline` config):

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const ui = (p: string) =>
  fileURLToPath(new URL(`../../packages/ui/src/${p}`, import.meta.url));

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: [
      { find: /^@streamflare\/ui\/lib\/(.*)$/, replacement: ui("lib/$1") },
      { find: /^@streamflare\/ui\/components\/ui\/(.*)$/, replacement: ui("components/ui/$1") },
      { find: /^@streamflare\/ui\/components\/brand\/(.*)$/, replacement: ui("components/brand/$1") },
      { find: /^@streamflare\/ui\/components\/forms\/(.*)$/, replacement: ui("components/forms/$1") },
      { find: /^@streamflare\/ui\/motion$/, replacement: ui("motion/index.tsx") },
      { find: /^@streamflare\/ui$/, replacement: ui("index.ts") },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    server: { deps: { inline: [/@streamflare\/ui/] } },
  },
});
```

> If the existing `vitest.config.ts` differs, preserve its options and only add the `resolve.alias` array and the `ui()` helper.

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- cn`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/lib/utils.ts packages/ui/package.json packages/ui/tsconfig.json apps/web/vitest.config.ts apps/web/__tests__/cn.test.ts
git commit -m "feat(ui): add cn() util, package subpath exports, and tsconfig/vitest resolution

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Aurora Noir tokens + Tailwind theme (`globals.css`)

**Files:**
- Create: `packages/ui/src/styles/globals.css`
- Test: `apps/web/__tests__/tokens.test.ts`

- [ ] **Step 1: Write the failing test (token sanity)**

`apps/web/__tests__/tokens.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  fileURLToPath(new URL("../../../packages/ui/src/styles/globals.css", import.meta.url)),
  "utf8",
);

describe("Aurora Noir tokens", () => {
  it("imports tailwind and defines core brand + shadcn tokens", () => {
    expect(css).toContain('@import "tailwindcss"');
    expect(css).toContain("--sf-canvas:");
    expect(css).toContain("--sf-accent:");
    expect(css).toContain("--sf-accent-2:");
    expect(css).toContain("--background:");
    expect(css).toContain("--primary:");
    expect(css).toContain("--ring:");
  });

  it("uses OKLCH and never raw hex black/white", () => {
    expect(css).toContain("oklch(");
    expect(css.toLowerCase()).not.toContain("#000");
    expect(css.toLowerCase()).not.toContain("#fff");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- tokens`
Expected: FAIL — file does not exist.

- [ ] **Step 3: Create `packages/ui/src/styles/globals.css`**

```css
@import "tailwindcss";
@import "tw-animate-css";

/* Scan the app + this package for class usage (monorepo). */
@source "../../../../apps/web";
@source "../../";

/* ---- Aurora Noir tokens (dark-only) ---------------------------------- */
:root {
  /* surfaces (cool blue-violet near-black, hue ~274) */
  --sf-canvas: oklch(0.16 0.015 274);
  --sf-surface-1: oklch(0.20 0.018 274);
  --sf-surface-2: oklch(0.24 0.020 274);
  --sf-surface-3: oklch(0.28 0.022 274);
  --sf-overlay: oklch(0.12 0.015 274);
  --sf-hairline: oklch(0.30 0.018 274);
  --sf-line-strong: oklch(0.38 0.020 274);

  /* text */
  --sf-text: oklch(0.97 0.005 274);
  --sf-text-muted: oklch(0.76 0.012 274);
  --sf-text-subtle: oklch(0.60 0.012 274);

  /* brand accent (indigo -> cyan) */
  --sf-accent: oklch(0.68 0.170 274);
  --sf-accent-hover: oklch(0.72 0.170 274);
  --sf-accent-2: oklch(0.80 0.130 210);
  --sf-accent-ink: oklch(0.16 0.020 274);

  /* semantic */
  --sf-success: oklch(0.72 0.150 155);
  --sf-warning: oklch(0.80 0.130 85);
  --sf-danger: oklch(0.62 0.200 22);
  --sf-danger-ink: oklch(0.98 0.010 22);

  /* radii */
  --radius: 0.625rem;

  /* shadcn semantic vars -> Aurora Noir */
  --background: var(--sf-canvas);
  --foreground: var(--sf-text);
  --card: var(--sf-surface-2);
  --card-foreground: var(--sf-text);
  --popover: var(--sf-surface-3);
  --popover-foreground: var(--sf-text);
  --primary: var(--sf-accent);
  --primary-foreground: var(--sf-accent-ink);
  --secondary: var(--sf-surface-1);
  --secondary-foreground: var(--sf-text);
  --muted: var(--sf-surface-1);
  --muted-foreground: var(--sf-text-muted);
  --accent: var(--sf-surface-3);
  --accent-foreground: var(--sf-text);
  --destructive: var(--sf-danger);
  --destructive-foreground: var(--sf-danger-ink);
  --border: var(--sf-hairline);
  --input: var(--sf-hairline);
  --ring: var(--sf-accent);
  --chart-1: oklch(0.68 0.170 274);
  --chart-2: oklch(0.80 0.130 210);
  --chart-3: oklch(0.72 0.150 155);
  --chart-4: oklch(0.74 0.150 320);
  --chart-5: oklch(0.80 0.130 85);
}

/* ---- Map tokens into the Tailwind theme ------------------------------ */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  /* brand utilities: bg-canvas, text-muted, bg-brand, from-brand to-brand-2 */
  --color-canvas: var(--sf-canvas);
  --color-surface-1: var(--sf-surface-1);
  --color-surface-2: var(--sf-surface-2);
  --color-surface-3: var(--sf-surface-3);
  --color-hairline: var(--sf-hairline);
  --color-line-strong: var(--sf-line-strong);
  --color-text: var(--sf-text);
  --color-text-muted: var(--sf-text-muted);
  --color-text-subtle: var(--sf-text-subtle);
  --color-brand: var(--sf-accent);
  --color-brand-2: var(--sf-accent-2);
  --color-success: var(--sf-success);
  --color-warning: var(--sf-warning);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 6px);

  --font-display: var(--font-display);
  --font-sans: var(--font-body);
  --font-mono: var(--font-mono);

  --ease-fluid: cubic-bezier(0.16, 1, 0.3, 1);
}

/* ---- Base layer ------------------------------------------------------ */
@layer base {
  * {
    border-color: var(--color-border);
  }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  }
  /* faint grain to avoid flat banding on dark gradients */
  .sf-grain::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.035;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
}
```

> The `@source` paths are relative to this CSS file. Verify in Task 7's build that utilities used in `apps/web` and `packages/ui` are generated; if any are missing, adjust the `@source` globs and re-run the build.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- tokens`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/styles/globals.css apps/web/__tests__/tokens.test.ts
git commit -m "feat(ui): add Aurora Noir tokens and Tailwind v4 theme mapping

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: shadcn config (`components.json` for package + app)

**Files:**
- Create: `packages/ui/components.json`
- Create: `apps/web/components.json`

- [ ] **Step 1: Create `packages/ui/components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@streamflare/ui/components",
    "ui": "@streamflare/ui/components/ui",
    "utils": "@streamflare/ui/lib/utils",
    "lib": "@streamflare/ui/lib",
    "hooks": "@streamflare/ui/hooks"
  }
}
```

- [ ] **Step 2: Create `apps/web/components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "../../packages/ui/src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@streamflare/ui/components",
    "ui": "@streamflare/ui/components/ui",
    "utils": "@streamflare/ui/lib/utils",
    "lib": "@streamflare/ui/lib",
    "hooks": "@streamflare/ui/hooks"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/ui/components.json apps/web/components.json
git commit -m "chore(ui): add shadcn monorepo components.json for package and app

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Generate shadcn primitives

**Files:**
- Create: `packages/ui/src/components/ui/*.tsx` (via CLI)

- [ ] **Step 1: Add primitives via the shadcn CLI (writes into `packages/ui` through the `-c apps/web` alias)**

Run from the worktree root:

```bash
pnpm dlx shadcn@latest add -c apps/web --yes \
  button input label textarea select dropdown-menu dialog sheet command popover \
  tooltip tabs avatar badge skeleton sonner scroll-area separator switch checkbox \
  slider progress aspect-ratio hover-card navigation-menu form accordion alert alert-dialog
```

Expected: files appear under `packages/ui/src/components/ui/*.tsx`; Radix and supporting deps are added to `packages/ui/package.json`; `pnpm-lock.yaml` updates.

> If the CLI cannot run non-interactively in this environment, add components one-by-one with the same flags, or hand-create the files from the shadcn registry (https://ui.shadcn.com/docs/components) into `packages/ui/src/components/ui/`. Each generated file must import siblings via `@streamflare/ui/components/ui/<name>` and `cn` via `@streamflare/ui/lib/utils` (per the aliases in Task 4).

- [ ] **Step 2: Re-run install to settle any added deps**

Run: `pnpm install`
Expected: success.

- [ ] **Step 3: Typecheck the package**

Run: `pnpm --filter @streamflare/ui typecheck`
Expected: PASS (no unresolved imports). If a generated file imports `@/...` instead of `@streamflare/ui/...`, fix the alias in that file.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/ui packages/ui/package.json pnpm-lock.yaml
git commit -m "feat(ui): generate shadcn primitives (button, dialog, command, form, ...)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Fonts module + Tailwind font wiring

**Files:**
- Create: `apps/web/app/fonts.ts`
- Modify: `apps/web/app/layout.tsx` (font variables on `<html>`)

- [ ] **Step 1: Create `apps/web/app/fonts.ts`**

```ts
import { Sora, Inter, JetBrains_Mono } from "next/font/google";

// Geometric display face (Aurora Noir). To self-host Clash Display later,
// replace this with next/font/local pointing at the woff2 and keep the same
// `--font-display` variable name.
export const fontDisplay = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const fontBody = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const fontVariables = `${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`;
```

- [ ] **Step 2: Apply font variables to `<html>` in `apps/web/app/layout.tsx`**

Import `fontVariables` and add it to the `<html>` `className` (preserve existing providers/registry). Example:

```tsx
import { fontVariables } from "./fonts";
// ...
return (
  <html lang="en" className={fontVariables}>
    {/* existing body / providers unchanged in this step */}
  </html>
);
```

- [ ] **Step 3: Typecheck the app**

Run: `pnpm --filter @streamflare/web typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/fonts.ts apps/web/app/layout.tsx
git commit -m "feat(web): add Sora/Inter/JetBrains Mono font variables

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Mount Tailwind globally + retire normalize.css (keep app rendering)

**Files:**
- Modify: `apps/web/app/layout.tsx` (import package globals)
- Modify: `apps/web/app/globals.css` (drop normalize import)

- [ ] **Step 1: Import the design-system stylesheet in `apps/web/app/layout.tsx`**

Add at the top (this makes Tailwind preflight + tokens global):

```tsx
import "@streamflare/ui/globals.css";
import "./globals.css";
```

- [ ] **Step 2: Remove the normalize import from `apps/web/app/globals.css`**

Delete the line `@import "normalize.css";`. Keep any remaining app-specific rules, or reduce the file to a short comment if it only held the normalize import and a canvas fallback:

```css
/* App-local overrides. Base reset + tokens come from @streamflare/ui/globals.css. */
```

- [ ] **Step 3: Build the app and confirm all routes still prerender**

Run (PowerShell): `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: build succeeds; the same route list prerenders as before. Tailwind utilities are now available. Existing styled-components/MUI pages still function (Preflight may reset some base element styles on un-migrated pages — expected and acceptable; those pages are redesigned in later phases).

- [ ] **Step 4: Verify Tailwind actually emits utilities (content scanning sanity)**

Run (PowerShell): `Select-String -Path (Get-ChildItem -Recurse apps/web/.next/static/css/*.css).FullName -Pattern "--color-canvas|\.bg-primary" -List`
Expected: at least one match (tokens + a utility present). If empty, widen the `@source` globs in `globals.css` and rebuild.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/layout.tsx apps/web/app/globals.css
git commit -m "feat(web): mount Aurora Noir/Tailwind globally, drop normalize.css

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Motion primitives + reduced-motion provider

**Files:**
- Create: `packages/ui/src/motion/index.tsx`
- Modify: `apps/web/app/layout.tsx` (wrap children in `ReducedMotionProvider` + add `Toaster`)
- Test: `apps/web/__tests__/motion.test.tsx`

- [ ] **Step 1: Write the failing test**

`apps/web/__tests__/motion.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FadeIn, Stagger, StaggerItem } from "@streamflare/ui/motion";

describe("motion primitives", () => {
  it("renders children", () => {
    render(
      <Stagger data-testid="list">
        <StaggerItem>
          <FadeIn>hello</FadeIn>
        </StaggerItem>
      </Stagger>,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- motion`
Expected: FAIL — cannot resolve `@streamflare/ui/motion`.

- [ ] **Step 3: Create `packages/ui/src/motion/index.tsx`**

```tsx
"use client";

import * as React from "react";
import {
  motion,
  MotionConfig,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";

export const MOTION = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
  ease: [0.16, 1, 0.3, 1] as const,
  spring: { type: "spring", stiffness: 300, damping: 30 } as const,
};

export function ReducedMotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function FadeIn({
  children,
  delay = 0,
  y = 12,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.base, ease: MOTION.ease, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  stagger = 0.04,
  ...props
}: HTMLMotionProps<"div"> & { stagger?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: stagger } } }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...props }: HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: reduce ? 0 : 12 },
        show: { opacity: 1, y: 0, transition: { duration: MOTION.base, ease: MOTION.ease } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function HoverScale({
  children,
  scale = 1.03,
  ...props
}: HTMLMotionProps<"div"> & { scale?: number }) {
  return (
    <motion.div whileHover={{ scale }} whileTap={{ scale: 0.98 }} transition={MOTION.spring} {...props}>
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 4: Wrap the app + add toaster in `apps/web/app/layout.tsx`**

Wrap the existing provider tree with `ReducedMotionProvider` and mount `Toaster` (sonner) once:

```tsx
import { ReducedMotionProvider } from "@streamflare/ui/motion";
import { Toaster } from "@streamflare/ui/components/ui/sonner";
// inside <body>, wrapping existing providers/children:
// <ReducedMotionProvider>{children}<Toaster richColors position="top-center" /></ReducedMotionProvider>
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- motion`
Expected: PASS.

- [ ] **Step 6: Typecheck + commit**

Run: `pnpm --filter @streamflare/ui typecheck` then `pnpm --filter @streamflare/web typecheck` → PASS.

```bash
git add packages/ui/src/motion/index.tsx apps/web/app/layout.tsx apps/web/__tests__/motion.test.tsx
git commit -m "feat(ui): add Framer Motion primitives + reduced-motion provider and toaster

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Bespoke primitives — Wordmark, GlowButton, GlassPanel, SectionHeader

**Files:**
- Create: `packages/ui/src/components/brand/wordmark.tsx`
- Create: `packages/ui/src/components/brand/glow-button.tsx`
- Create: `packages/ui/src/components/brand/glass-panel.tsx`
- Create: `packages/ui/src/components/brand/section-header.tsx`
- Test: `apps/web/__tests__/brand-core.test.tsx`

- [ ] **Step 1: Write the failing test**

`apps/web/__tests__/brand-core.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Wordmark } from "@streamflare/ui/components/brand/wordmark";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { SectionHeader } from "@streamflare/ui/components/brand/section-header";

describe("brand core primitives", () => {
  it("renders the wordmark", () => {
    render(<Wordmark />);
    expect(screen.getByText(/streamflare/i)).toBeInTheDocument();
  });
  it("renders a glow button with label", () => {
    render(<GlowButton>Play</GlowButton>);
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });
  it("renders a section header with index and title", () => {
    render(<SectionHeader index="01" title="Continue Watching" />);
    expect(screen.getByText("Continue Watching")).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- brand-core`
Expected: FAIL — modules do not exist.

- [ ] **Step 3: Create `packages/ui/src/components/brand/wordmark.tsx`**

```tsx
import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

export function Wordmark({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "font-display text-lg font-700 tracking-tight text-text select-none",
        className,
      )}
      {...props}
    >
      STREAM<span className="text-brand">FLARE</span>
    </span>
  );
}
```

- [ ] **Step 4: Create `packages/ui/src/components/brand/glow-button.tsx`**

```tsx
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@streamflare/ui/lib/utils";

const glowButton = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[background,box-shadow,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[0_0_24px_-6px_var(--sf-accent)] hover:shadow-[0_0_32px_-4px_var(--sf-accent)] hover:bg-[var(--sf-accent-hover)]",
        glass:
          "bg-white/10 text-text backdrop-blur-md border border-white/15 hover:bg-white/15",
        ghost: "bg-transparent text-text hover:bg-surface-3",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface GlowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glowButton> {}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(glowButton({ variant, size }), className)} {...props} />
  ),
);
GlowButton.displayName = "GlowButton";
```

- [ ] **Step 5: Create `packages/ui/src/components/brand/glass-panel.tsx`**

```tsx
import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

/** Glass surface — use ONLY over imagery or as a transient overlay, never on flat bg. */
export function GlassPanel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/8 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]",
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 6: Create `packages/ui/src/components/brand/section-header.tsx`**

```tsx
import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  index?: string;
  title: string;
  action?: React.ReactNode;
}

export function SectionHeader({ index, title, action, className, ...props }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4 px-1", className)} {...props}>
      <div className="flex items-baseline gap-3">
        {index ? (
          <span className="font-mono text-xs tabular-nums text-text-subtle">{index}</span>
        ) : null}
        <h2 className="font-display text-xl font-600 tracking-tight text-text md:text-2xl">
          {title}
        </h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- brand-core`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/components/brand apps/web/__tests__/brand-core.test.tsx
git commit -m "feat(ui): add Wordmark, GlowButton, GlassPanel, SectionHeader primitives

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Bespoke primitives — Rating, MaturityBadge, GenreChip

**Files:**
- Create: `packages/ui/src/components/brand/rating.tsx`
- Create: `packages/ui/src/components/brand/maturity-badge.tsx`
- Create: `packages/ui/src/components/brand/genre-chip.tsx`
- Test: `apps/web/__tests__/brand-meta.test.tsx`

- [ ] **Step 1: Write the failing test**

`apps/web/__tests__/brand-meta.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Rating } from "@streamflare/ui/components/brand/rating";
import { MaturityBadge } from "@streamflare/ui/components/brand/maturity-badge";
import { GenreChip } from "@streamflare/ui/components/brand/genre-chip";

describe("brand meta primitives", () => {
  it("formats the rating to one decimal", () => {
    render(<Rating value={8.42} />);
    expect(screen.getByText("8.4")).toBeInTheDocument();
  });
  it("renders the maturity label", () => {
    render(<MaturityBadge rating="PG-13" />);
    expect(screen.getByText("PG-13")).toBeInTheDocument();
  });
  it("renders a genre chip", () => {
    render(<GenreChip>Thriller</GenreChip>);
    expect(screen.getByText("Thriller")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- brand-meta`
Expected: FAIL — modules do not exist.

- [ ] **Step 3: Create `packages/ui/src/components/brand/rating.tsx`**

```tsx
import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@streamflare/ui/lib/utils";

export function Rating({
  value,
  className,
  ...props
}: { value: number | null | undefined } & React.HTMLAttributes<HTMLSpanElement>) {
  const display = typeof value === "number" ? value.toFixed(1) : "N/A";
  return (
    <span
      className={cn("inline-flex items-center gap-1 font-mono text-xs text-text-muted", className)}
      {...props}
    >
      <Star className="size-3.5 fill-warning text-warning" aria-hidden />
      <span className="tabular-nums">{display}</span>
    </span>
  );
}
```

- [ ] **Step 4: Create `packages/ui/src/components/brand/maturity-badge.tsx`**

```tsx
import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

export function MaturityBadge({
  rating,
  className,
  ...props
}: { rating: string | null | undefined } & React.HTMLAttributes<HTMLSpanElement>) {
  if (!rating) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-hairline px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-text-muted",
        className,
      )}
      {...props}
    >
      {rating}
    </span>
  );
}
```

- [ ] **Step 5: Create `packages/ui/src/components/brand/genre-chip.tsx`**

```tsx
import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

export function GenreChip({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-surface-3 px-3 py-1 text-xs text-text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- brand-meta`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/brand apps/web/__tests__/brand-meta.test.tsx
git commit -m "feat(ui): add Rating, MaturityBadge, GenreChip primitives

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: Bespoke primitives — PosterCard, ContentRow, HeroBackdrop, EmptyState

**Files:**
- Create: `packages/ui/src/components/brand/poster-card.tsx`
- Create: `packages/ui/src/components/brand/content-row.tsx`
- Create: `packages/ui/src/components/brand/hero-backdrop.tsx`
- Create: `packages/ui/src/components/brand/empty-state.tsx`
- Test: `apps/web/__tests__/brand-layout.test.tsx`

- [ ] **Step 1: Write the failing test**

`apps/web/__tests__/brand-layout.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PosterCard } from "@streamflare/ui/components/brand/poster-card";
import { ContentRow } from "@streamflare/ui/components/brand/content-row";
import { EmptyState } from "@streamflare/ui/components/brand/empty-state";

describe("brand layout primitives", () => {
  it("renders a poster card with title and image alt", () => {
    render(<PosterCard title="Joker" imageUrl="/x.jpg" />);
    expect(screen.getByAltText("Joker")).toBeInTheDocument();
  });
  it("renders a content row title and children", () => {
    render(
      <ContentRow title="Trending">
        <div>item</div>
      </ContentRow>,
    );
    expect(screen.getByText("Trending")).toBeInTheDocument();
    expect(screen.getByText("item")).toBeInTheDocument();
  });
  it("renders empty state message", () => {
    render(<EmptyState title="Nothing here" description="Add some titles" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- brand-layout`
Expected: FAIL — modules do not exist.

- [ ] **Step 3: Create `packages/ui/src/components/brand/poster-card.tsx`**

```tsx
"use client";

import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";
import { HoverScale } from "@streamflare/ui/motion";

export interface PosterCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  imageUrl: string;
  subtitle?: string;
}

export function PosterCard({ title, imageUrl, subtitle, className, ...props }: PosterCardProps) {
  return (
    <HoverScale className={cn("w-40 shrink-0 cursor-pointer md:w-48", className)}>
      <div
        className="group relative overflow-hidden rounded-lg border border-hairline bg-surface-2"
        {...props}
      >
        <div className="aspect-[2/3] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <p className="line-clamp-1 font-medium text-text">{title}</p>
          {subtitle ? <p className="line-clamp-1 text-xs text-text-muted">{subtitle}</p> : null}
        </div>
      </div>
    </HoverScale>
  );
}
```

- [ ] **Step 4: Create `packages/ui/src/components/brand/content-row.tsx`**

```tsx
"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@streamflare/ui/lib/utils";
import { SectionHeader } from "@streamflare/ui/components/brand/section-header";

export interface ContentRowProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  index?: string;
}

export function ContentRow({ title, index, className, children, ...props }: ContentRowProps) {
  const scroller = React.useRef<HTMLDivElement>(null);
  const nudge = (dir: 1 | -1) =>
    scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className={cn("space-y-3", className)} {...props}>
      <SectionHeader
        index={index}
        title={title}
        action={
          <div className="hidden gap-1 md:flex">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => nudge(-1)}
              className="grid size-8 place-items-center rounded-md border border-hairline text-text-muted hover:bg-surface-3"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => nudge(1)}
              className="grid size-8 place-items-center rounded-md border border-hairline text-text-muted hover:bg-surface-3"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        }
      />
      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {React.Children.map(children, (child) => (
          <div className="snap-start">{child}</div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `packages/ui/src/components/brand/hero-backdrop.tsx`**

```tsx
import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

export interface HeroBackdropProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
}

/** Full-bleed cinematic backdrop with layered scrims so foreground text stays legible. */
export function HeroBackdrop({ imageUrl, className, children, ...props }: HeroBackdropProps) {
  return (
    <div className={cn("relative isolate overflow-hidden sf-grain", className)} {...props}>
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-canvas via-canvas/70 to-transparent"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-canvas via-transparent to-transparent"
        aria-hidden
      />
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Create `packages/ui/src/components/brand/empty-state.tsx`**

```tsx
import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-hairline px-6 py-16 text-center",
        className,
      )}
      {...props}
    >
      {icon ? <div className="text-text-subtle">{icon}</div> : null}
      <h3 className="font-display text-lg font-600 text-text">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- brand-layout`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/components/brand apps/web/__tests__/brand-layout.test.tsx
git commit -m "feat(ui): add PosterCard, ContentRow, HeroBackdrop, EmptyState primitives

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 12: Forms pattern + Country Combobox primitive

**Files:**
- Create: `packages/ui/src/lib/countries.ts`
- Create: `packages/ui/src/components/forms/country-combobox.tsx`
- Test: `apps/web/__tests__/country-combobox.test.tsx`

- [ ] **Step 1: Write the failing test**

`apps/web/__tests__/country-combobox.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CountryCombobox } from "@streamflare/ui/components/forms/country-combobox";

describe("CountryCombobox", () => {
  it("renders a trigger with the placeholder when no value", () => {
    render(<CountryCombobox value="" onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveTextContent(/select country/i);
  });
  it("shows the selected country", () => {
    render(<CountryCombobox value="United States" onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("United States");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- country-combobox`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create `packages/ui/src/lib/countries.ts`**

```ts
// Minimal ISO country name list for the signup country selector.
// Replaces react-country-region-selector. Extend as needed.
export const COUNTRIES: string[] = [
  "United States", "United Kingdom", "Canada", "Australia", "India", "Germany",
  "France", "Spain", "Italy", "Netherlands", "Sweden", "Norway", "Denmark",
  "Ireland", "Brazil", "Mexico", "Japan", "South Korea", "Singapore",
  "New Zealand", "South Africa", "United Arab Emirates", "Bangladesh",
  "Pakistan", "Nigeria", "Kenya", "Egypt", "Poland", "Portugal", "Switzerland",
];
```

- [ ] **Step 4: Create `packages/ui/src/components/forms/country-combobox.tsx`**

```tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@streamflare/ui/lib/utils";
import { COUNTRIES } from "@streamflare/ui/lib/countries";
import { Button } from "@streamflare/ui/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@streamflare/ui/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@streamflare/ui/components/ui/popover";

export interface CountryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function CountryCombobox({ value, onChange, id }: CountryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || "Select country"}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country}
                  value={country}
                  onSelect={(v) => {
                    onChange(v);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 size-4", value === country ? "opacity-100" : "opacity-0")} />
                  {country}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

> This depends on the `button`, `command`, and `popover` primitives generated in Task 5.

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- country-combobox`
Expected: PASS. (If Radix Popover needs a layout effect in jsdom, the trigger assertion still passes since the test never opens the popover.)

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/lib/countries.ts packages/ui/src/components/forms apps/web/__tests__/country-combobox.test.tsx
git commit -m "feat(ui): add CountryCombobox (replaces react-country-region-selector usage)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 13: Barrel exports for new primitives

**Files:**
- Modify: `packages/ui/src/index.ts`
- Test: `apps/web/__tests__/barrel.test.ts`

- [ ] **Step 1: Write the failing test**

`apps/web/__tests__/barrel.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import * as UI from "@streamflare/ui";

describe("@streamflare/ui barrel", () => {
  it("re-exports new primitives and motion helpers", () => {
    for (const name of [
      "Wordmark", "GlowButton", "GlassPanel", "SectionHeader", "Rating",
      "MaturityBadge", "GenreChip", "PosterCard", "ContentRow", "HeroBackdrop",
      "EmptyState", "CountryCombobox", "FadeIn", "Stagger", "StaggerItem", "HoverScale",
    ]) {
      expect(UI, `missing export: ${name}`).toHaveProperty(name);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- barrel`
Expected: FAIL — exports missing.

- [ ] **Step 3: Append re-exports to `packages/ui/src/index.ts`**

Keep all existing legacy exports; add at the end:

```ts
// --- Premium redesign (Phase 0) ---
export * from "./motion";
export { Wordmark } from "./components/brand/wordmark";
export { GlowButton } from "./components/brand/glow-button";
export { GlassPanel } from "./components/brand/glass-panel";
export { SectionHeader } from "./components/brand/section-header";
export { Rating } from "./components/brand/rating";
export { MaturityBadge } from "./components/brand/maturity-badge";
export { GenreChip } from "./components/brand/genre-chip";
export { PosterCard } from "./components/brand/poster-card";
export { ContentRow } from "./components/brand/content-row";
export { HeroBackdrop } from "./components/brand/hero-backdrop";
export { EmptyState } from "./components/brand/empty-state";
export { CountryCombobox } from "./components/forms/country-combobox";
```

> Note: the legacy `export { default as Button } from './components/button'` (styled-components) stays. The shadcn `Button` is imported via its subpath (`@streamflare/ui/components/ui/button`) to avoid a name clash in the barrel during the migration window.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- barrel`
Expected: PASS.

- [ ] **Step 5: Typecheck both packages + commit**

Run: `pnpm --filter @streamflare/ui typecheck` and `pnpm --filter @streamflare/web typecheck` → PASS.

```bash
git add packages/ui/src/index.ts apps/web/__tests__/barrel.test.ts
git commit -m "feat(ui): re-export Phase 0 primitives and motion helpers from the barrel

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 14: Design-system showcase route

**Files:**
- Create: `apps/web/app/(design)/design/page.tsx`

- [ ] **Step 1: Create `apps/web/app/(design)/design/page.tsx`**

```tsx
import {
  Wordmark, GlowButton, GlassPanel, SectionHeader, Rating, MaturityBadge,
  GenreChip, ContentRow, PosterCard, HeroBackdrop, EmptyState, CountryCombobox,
} from "@streamflare/ui";

const SWATCHES = [
  ["canvas", "bg-canvas"], ["surface-1", "bg-surface-1"], ["surface-2", "bg-surface-2"],
  ["surface-3", "bg-surface-3"], ["brand", "bg-brand"], ["brand-2", "bg-brand-2"],
] as const;

export default function DesignSystemPage() {
  return (
    <main className="min-h-dvh bg-canvas px-6 py-12 md:px-12">
      <div className="mx-auto max-w-5xl space-y-16">
        <header className="space-y-4">
          <Wordmark />
          <h1 className="font-display text-4xl font-700 tracking-tight text-text md:text-6xl">
            Aurora Noir
          </h1>
          <p className="max-w-xl text-text-muted">
            The StreamFlare design system. Cool blue-violet chrome, an indigo to cyan accent,
            geometric display type, purposeful glass and motion.
          </p>
        </header>

        <section className="space-y-4">
          <SectionHeader index="01" title="Color" />
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
            {SWATCHES.map(([name, bg]) => (
              <div key={name} className="space-y-2">
                <div className={`h-16 rounded-lg border border-hairline ${bg}`} />
                <p className="font-mono text-xs text-text-subtle">{name}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader index="02" title="Buttons & meta" />
          <div className="flex flex-wrap items-center gap-3">
            <GlowButton>Primary</GlowButton>
            <GlowButton variant="glass">Glass</GlowButton>
            <GlowButton variant="ghost">Ghost</GlowButton>
            <Rating value={8.4} />
            <MaturityBadge rating="PG-13" />
            <GenreChip>Thriller</GenreChip>
            <div className="w-56"><CountryCombobox value="" onChange={() => {}} /></div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader index="03" title="Hero" />
          <HeroBackdrop imageUrl="/images/misc/joker1.jpg" className="rounded-2xl">
            <div className="flex min-h-72 flex-col justify-end gap-3 p-8">
              <h3 className="font-display text-3xl font-700 text-text">Joker</h3>
              <div className="flex items-center gap-3">
                <Rating value={8.4} /><MaturityBadge rating="R" /><GenreChip>Thriller</GenreChip>
              </div>
              <div className="flex gap-3"><GlowButton>Play</GlowButton><GlowButton variant="glass">More info</GlowButton></div>
            </div>
          </HeroBackdrop>
        </section>

        <ContentRow index="04" title="Content row">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <PosterCard key={n} title={`Title ${n}`} subtitle="2019 · Film" imageUrl="/images/misc/joker1.jpg" />
          ))}
        </ContentRow>

        <section className="space-y-4">
          <SectionHeader index="05" title="Empty & glass" />
          <div className="grid gap-4 md:grid-cols-2">
            <EmptyState title="Your list is empty" description="Add titles to watch later." />
            <div className="relative h-40 overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-[url('/images/misc/joker1.jpg')] bg-cover bg-center" />
              <GlassPanel className="absolute inset-4 grid place-items-center">
                <p className="text-text">Glass over imagery</p>
              </GlassPanel>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Build and confirm the route prerenders**

Run (PowerShell): `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: build succeeds and `/design` appears in the prerendered route list.

- [ ] **Step 3: (Manual, optional) Visual check**

Run: `pnpm --filter @streamflare/web dev` and open `http://localhost:3000/design`.
Expected: Aurora Noir tokens, fonts, buttons, hero scrim, snap-scroll row, and glass all render correctly.

- [ ] **Step 4: Commit**

```bash
git add "apps/web/app/(design)"
git commit -m "feat(web): add /design system showcase route

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 15: impeccable context (PRODUCT.md + DESIGN.md)

**Files:**
- Create: `PRODUCT.md`
- Create: `DESIGN.md`

- [ ] **Step 1: Create `PRODUCT.md`**

```markdown
# StreamFlare — PRODUCT

**Register:** product (the app) with a brand-register marketing surface (landing).

**What it is:** a cinematic streaming product (movies + shows) with profiles, watchlists,
continue-watching, ML-powered recommendations, subscriptions, and an admin/analytics area.

**Users:** viewers browsing and watching at home in the evening (lean-back, low ambient
light); account holders managing profiles/billing; an internal admin managing the catalog.

**Tone:** premium, confident, cinematic, quietly futuristic. Content is the hero; chrome
recedes.

**Anti-references:** the literal Netflix dark+red clone; generic "SaaS dark mode"
(electric-blue on slate); neon-on-black crypto aesthetics; cluttered, busy dashboards.

**Strategic principles:** content-first; one primary action per screen; motion expresses
cause and effect; accessible by default (AA, reduced-motion, keyboard).
```

- [ ] **Step 2: Create `DESIGN.md`**

```markdown
# StreamFlare — DESIGN (Aurora Noir)

**Theme:** dark only. Scene: a viewer at night, lights low, leaning back, scanning glowing
poster art — chrome recedes, content glows.

**Color (OKLCH, hue ~274), strategy = Restrained.** Tokens live in
`packages/ui/src/styles/globals.css`:
canvas 0.16 · surfaces 0.20/0.24/0.28 · hairline 0.30 · text 0.97/muted 0.76/subtle 0.60 ·
brand accent indigo 0.68 0.17 274 → cyan 0.80 0.13 210 (used <10%, on focus/CTA/active/hero).
Never #000/#fff. shadcn semantic vars are aliased to these.

**Typography:** display = Sora (swap-in for Clash Display), body = Inter, mono = JetBrains
Mono. Scale 12/14/16/20/26/34/46/64, ≥1.25 ratio, body 65–75ch, tabular-nums for data.

**Elevation/effects:** tinted layered shadows; accent glow on primary CTA/focus; faint grain
(`.sf-grain`) to avoid banding; glass (`GlassPanel`) only over imagery/overlays.

**Motion (Framer Motion):** fast 150 / base 250 / slow 400ms; enter ease cubic-bezier(0.16,1,0.3,1);
interactive spring (300/30); row stagger 40ms; respects prefers-reduced-motion.

**Components:** shadcn primitives in `packages/ui/src/components/ui`; bespoke primitives in
`packages/ui/src/components/brand`; all re-exported from `@streamflare/ui`. Showcase at `/design`.

**Bans:** gradient text, side-stripe borders, decorative glass, hero-metric template,
identical card grids, modal-as-first-thought, emoji icons.
```

- [ ] **Step 3: Commit**

```bash
git add PRODUCT.md DESIGN.md
git commit -m "docs: add impeccable PRODUCT.md and DESIGN.md (Aurora Noir context)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 16: Phase 0 green-gate sweep

**Files:** none (verification + fixes only)

- [ ] **Step 1: Typecheck both packages**

Run: `pnpm --filter @streamflare/ui typecheck` then `pnpm --filter @streamflare/web typecheck`
Expected: both PASS. Fix any unresolved subpath imports or type errors before continuing.

- [ ] **Step 2: Run the web test suite**

Run: `pnpm --filter @streamflare/web test`
Expected: all tests pass (cn, tokens, motion, brand-core, brand-meta, brand-layout,
country-combobox, barrel, plus any pre-existing tests).

- [ ] **Step 3: Production build, all routes**

Run (PowerShell): `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: success; previously existing routes plus `/design` all prerender; no styled-components
or MUI runtime errors.

- [ ] **Step 4: Contrast spot-check (AA)**

Confirm these token pairs meet WCAG AA (≥4.5:1 for body text, ≥3:1 for large/UI):
- `--sf-text` on `--sf-canvas`, on `--sf-surface-2`, on `--sf-surface-3`
- `--sf-text-muted` on `--sf-canvas`
- `--sf-accent-ink` on `--sf-accent` (button label on primary)
- `--sf-danger-ink` on `--sf-danger`
Use any OKLCH/contrast tool. If a pair fails, nudge lightness (e.g., raise `--sf-text-muted`
toward 0.78 or `--sf-accent-ink` toward 0.14) and re-verify; commit the token change.

- [ ] **Step 5: No hardcoded hex in new components**

Run: `pnpm dlx rg -n "#[0-9a-fA-F]{3,6}" packages/ui/src/components/brand packages/ui/src/motion`
Expected: no matches except inside data-URI SVG/gradient rgba (document any intentional
`rgba(0,0,0,...)` used for image scrims, which is acceptable for shadows over media).

- [ ] **Step 6: Final Phase 0 commit (if any fixes were made)**

```bash
git add -A
git commit -m "chore: Phase 0 green-gate fixes (contrast/typecheck/build)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage** (spec → task):
- Tech foundation (Tailwind v4 + shadcn monorepo in `packages/ui`) → Tasks 1, 3, 4, 5, 7.
- Token system (Aurora Noir OKLCH, shadcn alias) → Task 3.
- Typography (display/body/mono via next/font, Tailwind wiring) → Tasks 3 (theme), 6.
- Motion system (Framer Motion + reduced-motion) → Task 8.
- Component inventory (shadcn primitives) → Task 5; (bespoke primitives) → Tasks 9–11; barrel → Task 13.
- Forms standardization + Combobox / drop react-country-region-selector usage → Task 12 (primitive; page swap deferred to Phase 1, as scoped).
- Legacy removal (additive stance; only normalize.css now) → Tasks 1, 7; full lib removal explicitly deferred (spec §6.6 "scheduled migration path").
- impeccable context (PRODUCT.md/DESIGN.md) → Task 15.
- Accessibility (AA contrast, focus ring, reduced-motion) → Tasks 8, 16.
- Quality bar (typecheck + vitest + build green, no hardcoded hex) → Tasks 1–16, sweep in 16.
- Showcase/verification artifact → Task 14.

**2. Placeholder scan:** No "TBD/TODO/handle edge cases" steps; every code step ships real code or a real CLI command. shadcn primitives are produced by the canonical CLI (Task 5), with a hand-create fallback noted.

**3. Type/name consistency:** `cn` (Task 2) used everywhere; `@streamflare/ui` subpaths match the `exports` map (Task 2) and tsconfig/vitest aliases; bespoke exports in Task 13 match the files created in Tasks 8–12; `GlowButton` variants (`primary`/`glass`/`ghost`) used consistently in Tasks 9 and 14; `CountryCombobox` props (`value`/`onChange`) consistent across Tasks 12–14.

**Known deferrals (intentional, per spec):** full removal of styled-components/MUI/bootstrap/reactstrap and page-level swaps happen in Phases 1–4; Phase 0 stays additive and keeps every route building.
