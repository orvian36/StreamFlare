# StreamFlare Brutalist Redesign: Phase 0 + Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the brutalist design-system foundation (tokens, fonts, primitives) and redesign the public face (landing, sign in, sign up) of the StreamFlare web app.

**Architecture:** Tokenize the existing styled-components in place. Design tokens become CSS custom properties declared in a `createGlobalStyle` block in `@streamflare/ui`, fonts load via `next/font/google` and expose CSS variables, and every component style file consumes `var(--sf-*)`. The compound-component public APIs and the SSR registry stay intact, so page code barely changes.

**Tech Stack:** Next.js 14 App Router, styled-components 6, `next/font/google` (Bricolage Grotesque, Archivo, JetBrains Mono), Vitest + Testing Library (jsdom), pnpm workspace monorepo.

---

## Conventions (read once)

- **Token names** (defined in Task 0.2, used everywhere after): colors `--sf-canvas --sf-surface-1 --sf-surface-2 --sf-line --sf-line-strong --sf-text --sf-text-dim --sf-accent --sf-accent-ink --sf-danger --sf-ok`; fonts `--sf-font-display --sf-font-body --sf-font-mono`; spacing `--sf-space-1` (4px) through `--sf-space-10` (160px); motion `--sf-ease --sf-dur-fast --sf-dur`; z-index `--sf-z-header --sf-z-dropdown --sf-z-overlay --sf-z-toast`.
- **Commit trailer:** every commit message must end with a blank line then `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Testing rationale:** primitives with logic or accessibility surface (Button, Field) get TDD unit tests. Pure visual style-file rewrites are verified by typecheck + build + the manual visual checklist in Task 1.10 (asserting exact CSS in a unit test has no value). Do not skip the typecheck/build verification steps.
- **Run all commands from the repo root.** Filters target packages: `@streamflare/web` and `@streamflare/ui`.
- After any `next/font/google` step: that fetch needs network at build/dev time. If the environment is offline the build will fail fetching fonts; run where network is available.

## File Structure

**Create:**
- `packages/ui/src/styles/global.ts` — `GlobalStyle` (createGlobalStyle) declaring all token custom properties and base resets.
- `packages/ui/src/components/button/index.tsx` + `styles/button.ts` — accent/ghost button primitive.
- `packages/ui/src/components/field/index.tsx` + `styles/field.ts` — labeled input primitive with error/helper wiring.
- `packages/ui/src/components/tag/index.tsx` + `styles/tag.ts` — mono kicker/label primitive.
- `packages/ui/src/components/section/index.tsx` + `styles/section.ts` — numbered section with exposed top rule.
- `packages/ui/src/components/frame/index.tsx` + `styles/frame.ts` — hard media frame.
- `apps/web/vitest.config.ts`, `apps/web/vitest.setup.ts` — web test infra.
- `apps/web/__tests__/smoke.test.ts`, `button.test.tsx`, `field.test.tsx` — tests.

**Modify:**
- `apps/web/next.config.mjs` — add `@streamflare/ui` to `transpilePackages`, enable styled-components compiler.
- `packages/ui/src/index.ts` — export the 5 new primitives + `GlobalStyle`.
- `apps/web/app/layout.tsx` — wire the 3 fonts as CSS variables on `<html>`.
- `apps/web/lib/registry.tsx` — render `<GlobalStyle />`.
- `apps/web/app/globals.css` — trim to base resets + canvas fallback.
- `packages/ui/src/components/{header,feature,opt-form,form,jumbotron,accordion,footer}/styles/*.ts` — full brutalist rewrites.
- `packages/ui/src/components/{header,opt-form,accordion,jumbotron}/index.tsx` — small structural edits (wordmark logo, SVG chevron, glyph toggle, framed image).
- `apps/web/app/page.tsx`, `apps/web/app/signin/page.tsx`, `apps/web/app/signup/page.tsx` — wire new primitives.

---

# PHASE 0: FOUNDATION

### Task 0.1: Fix build config

**Files:**
- Modify: `apps/web/next.config.mjs:10-15`

- [ ] **Step 1: Add `@streamflare/ui` to transpilePackages and enable the styled-components compiler**

Replace the `nextConfig` object so it reads:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@streamflare/types", "@streamflare/ui"],
  compiler: {
    styledComponents: true,
  },
};
```

- [ ] **Step 2: Verify the app still builds with the current (un-restyled) UI**

Run: `pnpm --filter @streamflare/web build`
Expected: build completes without "Module parse failed" / transpile errors for `@streamflare/ui`. (This catches the latent missing-transpile bug before we add more.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/next.config.mjs
git commit -m "fix(web): transpile @streamflare/ui and enable styled-components compiler"
```

---

### Task 0.2: Design tokens via GlobalStyle

**Files:**
- Create: `packages/ui/src/styles/global.ts`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Create the GlobalStyle with all tokens**

Create `packages/ui/src/styles/global.ts`:

```typescript
import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    /* Color: cool tinted neutrals (hue 265), never #000/#fff, never Netflix red */
    --sf-canvas: oklch(0.17 0.012 265);
    --sf-surface-1: oklch(0.21 0.014 265);
    --sf-surface-2: oklch(0.26 0.016 265);
    --sf-line: oklch(0.40 0.012 265);
    --sf-line-strong: oklch(0.62 0.012 265);
    --sf-text: oklch(0.96 0.006 265);
    --sf-text-dim: oklch(0.70 0.012 265);
    --sf-accent: oklch(0.88 0.21 128);
    --sf-accent-ink: oklch(0.18 0.04 128);
    --sf-danger: oklch(0.62 0.20 25);
    --sf-ok: oklch(0.80 0.16 150);

    /* Fonts: variables set by next/font in layout.tsx */
    --sf-font-display: var(--font-bricolage), 'Archivo', system-ui, sans-serif;
    --sf-font-body: var(--font-archivo), system-ui, -apple-system, sans-serif;
    --sf-font-mono: var(--font-jetbrains), ui-monospace, 'SFMono-Regular', monospace;

    /* Spacing scale (brutalist jumps) */
    --sf-space-1: 4px;
    --sf-space-2: 8px;
    --sf-space-3: 12px;
    --sf-space-4: 16px;
    --sf-space-5: 24px;
    --sf-space-6: 32px;
    --sf-space-7: 48px;
    --sf-space-8: 64px;
    --sf-space-9: 96px;
    --sf-space-10: 160px;

    /* Motion */
    --sf-ease: cubic-bezier(0.16, 1, 0.3, 1);
    --sf-dur-fast: 180ms;
    --sf-dur: 240ms;

    /* z-index scale */
    --sf-z-header: 10;
    --sf-z-dropdown: 40;
    --sf-z-overlay: 100;
    --sf-z-toast: 1000;
  }

  *, *::before, *::after { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    background: var(--sf-canvas);
    color: var(--sf-text);
    font-family: var(--sf-font-body);
    -webkit-font-smoothing: antialiased;
  }

  a { color: inherit; }

  ::selection { background: var(--sf-accent); color: var(--sf-accent-ink); }

  :focus-visible { outline: 2px solid var(--sf-accent); outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
```

- [ ] **Step 2: Export GlobalStyle from the package index**

Add this line to the end of `packages/ui/src/index.ts`:

```typescript
export { GlobalStyle } from './styles/global';
```

- [ ] **Step 3: Verify the package typechecks**

Run: `pnpm --filter @streamflare/ui typecheck`
Expected: PASS (no errors).

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/styles/global.ts packages/ui/src/index.ts
git commit -m "feat(ui): add brutalist design tokens via GlobalStyle"
```

---

### Task 0.3: Wire fonts and trim base CSS

**Files:**
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/globals.css`

- [ ] **Step 1: Replace `apps/web/app/layout.tsx` entirely**

```tsx
import type { Metadata } from "next";
import { Bricolage_Grotesque, Archivo, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "../context/auth-context";
import StyledComponentsRegistry from "../lib/registry";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});
const body = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StreamFlare",
  description: "Movie streaming app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <StyledComponentsRegistry>
          <AuthProvider>{children}</AuthProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
```

Note: Bricolage Grotesque, Archivo, and JetBrains Mono are all variable fonts, so no `weight` is passed; `font-weight` in the component CSS (e.g. 800) is covered by the variable axis.

- [ ] **Step 2: Replace `apps/web/app/globals.css` entirely**

```css
@import "normalize.css";

:root {
  color-scheme: dark;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: oklch(0.17 0.012 265);
  color: oklch(0.96 0.006 265);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}

a {
  color: inherit;
}
```

(The hardcoded `.country-dropdown-inner` block is removed; the sign-up page tokenizes its own select in Task 1.9. The canvas color is duplicated here as a no-FOUC fallback before GlobalStyle hydrates.)

- [ ] **Step 3: Verify the web app typechecks**

Run: `pnpm --filter @streamflare/web typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/layout.tsx apps/web/app/globals.css
git commit -m "feat(web): load Bricolage/Archivo/JetBrains Mono and trim base CSS"
```

---

### Task 0.4: Render GlobalStyle through the SSR registry

**Files:**
- Modify: `apps/web/lib/registry.tsx`

- [ ] **Step 1: Replace `apps/web/lib/registry.tsx` entirely**

```tsx
"use client";

import React, { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";
import { GlobalStyle } from "@streamflare/ui";

export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    styledComponentsStyleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== "undefined") {
    return (
      <>
        <GlobalStyle />
        {children}
      </>
    );
  }

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      <GlobalStyle />
      {children}
    </StyleSheetManager>
  );
}
```

- [ ] **Step 2: Verify build and SSR style injection**

Run: `pnpm --filter @streamflare/web build`
Expected: build succeeds. (GlobalStyle is now SSR-captured, so tokens are present on first paint.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/registry.tsx
git commit -m "feat(web): inject GlobalStyle tokens via the styled-components registry"
```

---

### Task 0.5: Web test infrastructure

**Files:**
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`
- Create: `apps/web/__tests__/smoke.test.ts`

- [ ] **Step 1: Create `apps/web/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    server: {
      // Workspace package ships raw TSX; force Vitest to transform it.
      deps: { inline: [/@streamflare\/ui/] },
    },
  },
});
```

- [ ] **Step 2: Create `apps/web/vitest.setup.ts`**

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Create a trivial test to prove the runner works**

Create `apps/web/__tests__/smoke.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("vitest", () => {
  it("runs in the web package", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run the test**

Run: `pnpm --filter @streamflare/web test`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add apps/web/vitest.config.ts apps/web/vitest.setup.ts apps/web/__tests__/smoke.test.ts
git commit -m "test(web): set up vitest with jsdom and jest-dom"
```

---

### Task 0.6: Button primitive (TDD)

**Files:**
- Test: `apps/web/__tests__/button.test.tsx`
- Create: `packages/ui/src/components/button/styles/button.ts`
- Create: `packages/ui/src/components/button/index.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/__tests__/button.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Button from "@streamflare/ui/src/components/button";

describe("Button", () => {
  it("renders a native button with its label as the accessible name", () => {
    render(<Button>Try it now</Button>);
    expect(screen.getByRole("button", { name: "Try it now" })).toBeInTheDocument();
  });

  it("forwards the disabled attribute", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @streamflare/web test button`
Expected: FAIL with a module-not-found error for `@streamflare/ui/src/components/button`.

- [ ] **Step 3: Create the styles**

Create `packages/ui/src/components/button/styles/button.ts`:

```typescript
import styled, { css } from 'styled-components';

export const StyledButton = styled.button<{ $variant: 'accent' | 'ghost' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sf-space-2);
  font-family: var(--sf-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 14px;
  font-weight: 500;
  padding: var(--sf-space-3) var(--sf-space-5);
  border-radius: 0;
  cursor: pointer;
  transition: background var(--sf-dur-fast) var(--sf-ease),
    color var(--sf-dur-fast) var(--sf-ease),
    border-color var(--sf-dur-fast) var(--sf-ease);

  ${({ $variant }) =>
    $variant === 'accent'
      ? css`
          background: var(--sf-accent);
          color: var(--sf-accent-ink);
          border: 2px solid var(--sf-accent);
          &:hover:not(:disabled) {
            background: transparent;
            color: var(--sf-accent);
          }
        `
      : css`
          background: transparent;
          color: var(--sf-text);
          border: 2px solid var(--sf-text);
          &:hover:not(:disabled) {
            background: var(--sf-text);
            color: var(--sf-canvas);
          }
        `}

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
```

- [ ] **Step 4: Create the component**

Create `packages/ui/src/components/button/index.tsx`:

```tsx
import React from 'react';
import { StyledButton } from './styles/button';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'accent' | 'ghost';
}

export default function Button({ variant = 'accent', children, ...restProps }: ButtonProps) {
  return (
    <StyledButton $variant={variant} {...restProps}>
      {children}
    </StyledButton>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test button`
Expected: 2 passed.

- [ ] **Step 6: Export from the index**

Add to `packages/ui/src/index.ts`:

```typescript
export { default as Button } from './components/button';
```

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/button apps/web/__tests__/button.test.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add brutalist Button primitive"
```

---

### Task 0.7: Field primitive (TDD)

**Files:**
- Test: `apps/web/__tests__/field.test.tsx`
- Create: `packages/ui/src/components/field/styles/field.ts`
- Create: `packages/ui/src/components/field/index.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/__tests__/field.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Field from "@streamflare/ui/src/components/field";

describe("Field", () => {
  it("associates its visible label with the input", () => {
    render(<Field label="Email address" type="email" />);
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
  });

  it("marks the input invalid and exposes the error via role=alert", () => {
    render(<Field label="Email address" error="Email is required" />);
    expect(screen.getByLabelText("Email address")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Email is required");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @streamflare/web test field`
Expected: FAIL with a module-not-found error for `@streamflare/ui/src/components/field`.

- [ ] **Step 3: Create the styles**

Create `packages/ui/src/components/field/styles/field.ts`:

```typescript
import styled from 'styled-components';

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: var(--sf-space-4);
`;

export const Label = styled.label`
  font-family: var(--sf-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: var(--sf-text-dim);
  margin-bottom: var(--sf-space-2);
`;

export const StyledInput = styled.input<{ $error?: boolean }>`
  background: var(--sf-surface-2);
  color: var(--sf-text);
  border: 1px solid ${({ $error }) => ($error ? 'var(--sf-danger)' : 'var(--sf-line)')};
  border-radius: 0;
  height: 52px;
  padding: 0 var(--sf-space-4);
  font-family: var(--sf-font-body);
  font-size: 16px;
  &::placeholder {
    color: var(--sf-text-dim);
  }
  &:focus-visible {
    border-color: var(--sf-accent);
    outline: none;
  }
`;

export const Helper = styled.p`
  font-family: var(--sf-font-mono);
  font-size: 12px;
  color: var(--sf-text-dim);
  margin: var(--sf-space-2) 0 0;
`;

export const ErrorText = styled.p`
  font-family: var(--sf-font-mono);
  font-size: 12px;
  color: var(--sf-danger);
  margin: var(--sf-space-2) 0 0;
`;
```

- [ ] **Step 4: Create the component**

Create `packages/ui/src/components/field/index.tsx`:

```tsx
import React, { useId } from 'react';
import { Wrap, Label, StyledInput, Helper, ErrorText } from './styles/field';

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
}

export default function Field({ label, error, helper, id, ...restProps }: FieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = error ? `${fieldId}-error` : helper ? `${fieldId}-helper` : undefined;

  return (
    <Wrap>
      <Label htmlFor={fieldId}>{label}</Label>
      <StyledInput
        id={fieldId}
        $error={!!error}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...restProps}
      />
      {error ? (
        <ErrorText id={`${fieldId}-error`} role="alert">
          {error}
        </ErrorText>
      ) : helper ? (
        <Helper id={`${fieldId}-helper`}>{helper}</Helper>
      ) : null}
    </Wrap>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test field`
Expected: 2 passed.

- [ ] **Step 6: Export from the index**

Add to `packages/ui/src/index.ts`:

```typescript
export { default as Field } from './components/field';
```

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/field apps/web/__tests__/field.test.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add accessible brutalist Field primitive"
```

---

### Task 0.8: Tag, Section, and Frame primitives

**Files:**
- Create: `packages/ui/src/components/tag/styles/tag.ts`, `packages/ui/src/components/tag/index.tsx`
- Create: `packages/ui/src/components/section/styles/section.ts`, `packages/ui/src/components/section/index.tsx`
- Create: `packages/ui/src/components/frame/styles/frame.ts`, `packages/ui/src/components/frame/index.tsx`
- Test: `apps/web/__tests__/primitives.test.tsx`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Create the Tag primitive**

Create `packages/ui/src/components/tag/styles/tag.ts`:

```typescript
import styled from 'styled-components';

export const StyledTag = styled.span<{ $framed?: boolean; $accent?: boolean }>`
  display: inline-flex;
  align-items: center;
  font-family: var(--sf-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 12px;
  line-height: 1;
  color: ${({ $accent }) => ($accent ? 'var(--sf-accent)' : 'var(--sf-text-dim)')};
  ${({ $framed }) => $framed && `border: 1px solid var(--sf-line); padding: 6px 10px;`}
`;
```

Create `packages/ui/src/components/tag/index.tsx`:

```tsx
import React from 'react';
import { StyledTag } from './styles/tag';

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  framed?: boolean;
  accent?: boolean;
}

export default function Tag({ framed, accent, children, ...restProps }: TagProps) {
  return (
    <StyledTag $framed={framed} $accent={accent} {...restProps}>
      {children}
    </StyledTag>
  );
}
```

- [ ] **Step 2: Create the Section primitive**

Create `packages/ui/src/components/section/styles/section.ts`:

```typescript
import styled from 'styled-components';

export const SectionEl = styled.section`
  border-top: 1px solid var(--sf-line);
`;

export const Head = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--sf-space-4);
  padding: var(--sf-space-5) var(--sf-space-7) 0;
  @media (max-width: 740px) {
    padding: var(--sf-space-5) var(--sf-space-5) 0;
  }
`;

export const Num = styled.span`
  font-family: var(--sf-font-mono);
  color: var(--sf-accent);
  font-size: 13px;
  letter-spacing: 0.08em;
`;

export const Label = styled.span`
  font-family: var(--sf-font-mono);
  color: var(--sf-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 13px;
`;
```

Create `packages/ui/src/components/section/index.tsx`:

```tsx
import React from 'react';
import { SectionEl, Head, Num, Label } from './styles/section';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  index?: string;
  label?: string;
}

export default function Section({ index, label, children, ...restProps }: SectionProps) {
  return (
    <SectionEl {...restProps}>
      {(index || label) && (
        <Head>
          {index && <Num>{index}</Num>}
          {label && <Label>{label}</Label>}
        </Head>
      )}
      {children}
    </SectionEl>
  );
}
```

- [ ] **Step 3: Create the Frame primitive**

Create `packages/ui/src/components/frame/styles/frame.ts`:

```typescript
import styled from 'styled-components';

export const FrameEl = styled.div`
  border: 1px solid var(--sf-line);
  background: var(--sf-surface-1);
  overflow: hidden;
  line-height: 0;
  img {
    display: block;
    width: 100%;
    height: auto;
  }
`;
```

Create `packages/ui/src/components/frame/index.tsx`:

```tsx
import React from 'react';
import { FrameEl } from './styles/frame';

export default function Frame({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
  return <FrameEl {...restProps}>{children}</FrameEl>;
}
```

- [ ] **Step 4: Write a render-smoke test for all three**

Create `apps/web/__tests__/primitives.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Tag from "@streamflare/ui/src/components/tag";
import Section from "@streamflare/ui/src/components/section";
import Frame from "@streamflare/ui/src/components/frame";

describe("presentational primitives", () => {
  it("Tag renders its text", () => {
    render(<Tag accent>Now Streaming</Tag>);
    expect(screen.getByText("Now Streaming")).toBeInTheDocument();
  });

  it("Section renders its index, label, and children", () => {
    render(
      <Section index="01" label="Why StreamFlare">
        <p>body</p>
      </Section>
    );
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Why StreamFlare")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("Frame renders wrapped media", () => {
    render(
      <Frame>
        <img src="/x.jpg" alt="poster" />
      </Frame>
    );
    expect(screen.getByAltText("poster")).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Export the three primitives from the index**

Add to `packages/ui/src/index.ts`:

```typescript
export { default as Tag } from './components/tag';
export { default as Section } from './components/section';
export { default as Frame } from './components/frame';
```

- [ ] **Step 6: Run the tests**

Run: `pnpm --filter @streamflare/web test primitives`
Expected: 3 passed.

- [ ] **Step 7: Typecheck the package**

Run: `pnpm --filter @streamflare/ui typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/components/tag packages/ui/src/components/section packages/ui/src/components/frame apps/web/__tests__/primitives.test.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add Tag, Section, and Frame primitives"
```

---

# PHASE 1: PUBLIC FACE

> All Phase 1 style rewrites keep the existing `export` names so the component `index.tsx` files keep importing them unchanged, except for the four explicit index edits called out below.

### Task 1.1: Header restyle + wordmark logo

**Files:**
- Modify (full replace): `packages/ui/src/components/header/styles/header.ts`
- Modify: `packages/ui/src/components/header/index.tsx` (import list + `Header.Logo`)

- [ ] **Step 1: Replace `packages/ui/src/components/header/styles/header.ts` entirely**

```typescript
import styled, { css } from 'styled-components';
import Link from 'next/link';

export const Background = styled.div<{ src?: string; dontShowOnSmallViewPort?: boolean }>`
    position: relative;
    display: flex;
    flex-direction: column;
    background: var(--sf-canvas);
    border-bottom: 1px solid var(--sf-line);
    isolation: isolate;
    ${({ src }) =>
        src &&
        css`
            &::before {
                content: '';
                position: absolute;
                inset: 0;
                z-index: -1;
                background: url(/images/misc/${src}.jpg) center / cover no-repeat;
                filter: grayscale(1) contrast(1.05) brightness(0.45);
            }
            &::after {
                content: '';
                position: absolute;
                inset: 0;
                z-index: -1;
                background: linear-gradient(180deg, oklch(0.17 0.012 265 / 0.35) 0%, var(--sf-canvas) 92%);
            }
        `}
    @media (max-width: 1100px) {
        ${({ dontShowOnSmallViewPort }) =>
            dontShowOnSmallViewPort &&
            css`
                &::before,
                &::after {
                    display: none;
                }
            `}
    }
`;

export const Container = styled.div`
    position: sticky;
    top: 0;
    z-index: var(--sf-z-header);
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 72px;
    padding: 0 var(--sf-space-7);
    background: var(--sf-canvas);
    border-bottom: 1px solid var(--sf-line);
    a {
        display: flex;
        align-items: center;
    }
    @media (max-width: 1000px) {
        padding: 0 var(--sf-space-5);
    }
`;

export const LinkRoute = styled(Link)`
    display: flex;
    text-decoration: none;
`;

export const Wordmark = styled.span`
    font-family: var(--sf-font-display);
    font-weight: 800;
    font-size: 22px;
    letter-spacing: -0.02em;
    text-transform: uppercase;
    color: var(--sf-text);
    white-space: nowrap;
`;

export const ButtonLink = styled(Link)`
    font-family: var(--sf-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 13px;
    background: var(--sf-accent);
    color: var(--sf-accent-ink);
    border: 2px solid var(--sf-accent);
    padding: 10px 18px;
    text-decoration: none;
    cursor: pointer;
    transition: background var(--sf-dur-fast) var(--sf-ease), color var(--sf-dur-fast) var(--sf-ease);
    &:hover {
        background: transparent;
        color: var(--sf-accent);
    }
`;

export const Group = styled.div`
    display: flex;
    align-items: center;
    gap: var(--sf-space-5);
`;

export const TextLink = styled.p<{ active?: string }>`
    font-family: var(--sf-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-size: 13px;
    margin: 0;
    cursor: pointer;
    color: ${({ active }) => (active === 'true' ? 'var(--sf-accent)' : 'var(--sf-text)')};
    border-bottom: 2px solid ${({ active }) => (active === 'true' ? 'var(--sf-accent)' : 'transparent')};
    padding-bottom: 2px;
    transition: color var(--sf-dur-fast) var(--sf-ease), border-color var(--sf-dur-fast) var(--sf-ease);
    &:hover {
        color: var(--sf-accent);
    }
`;

export const SearchInput = styled.input<{ active?: boolean }>`
    background: var(--sf-surface-1);
    color: var(--sf-text);
    border: 1px solid var(--sf-line);
    border-radius: 0;
    transition: width var(--sf-dur) var(--sf-ease), opacity var(--sf-dur) var(--sf-ease);
    height: 36px;
    font-family: var(--sf-font-mono);
    font-size: 13px;
    margin-left: ${({ active }) => (active ? 'var(--sf-space-2)' : '0')};
    padding: ${({ active }) => (active ? '0 var(--sf-space-3)' : '0')};
    opacity: ${({ active }) => (active ? '1' : '0')};
    width: ${({ active }) => (active ? '220px' : '0px')};
    &:focus-visible {
        border-color: var(--sf-accent);
        outline: none;
    }
`;

export const Search = styled.div`
    display: flex;
    align-items: center;
    button {
        background: transparent;
        border: 0;
        cursor: pointer;
        display: flex;
        color: var(--sf-text);
    }
    @media (max-width: 700px) {
        display: none;
    }
`;

export const Picture = styled.img`
    width: 36px;
    height: 36px;
    border: 1px solid var(--sf-line);
    object-fit: cover;
    cursor: pointer;
`;

export const Dropdown = styled.div`
    display: none;
    position: absolute;
    top: 48px;
    right: 0;
    background: var(--sf-surface-1);
    border: 1px solid var(--sf-line);
    padding: var(--sf-space-3);
    min-width: 180px;
    z-index: var(--sf-z-dropdown);
    ${Group} {
        gap: var(--sf-space-3);
        margin-bottom: var(--sf-space-3);
        &:last-of-type {
            margin-bottom: 0;
        }
    }
`;

export const Profile = styled.div`
    display: flex;
    align-items: center;
    position: relative;
    &:hover > ${Dropdown} {
        display: flex;
        flex-direction: column;
    }
`;

export const Feature = styled(Container)`
    position: static;
    top: auto;
    z-index: auto;
    flex-direction: column;
    align-items: flex-start;
    width: min(620px, 60%);
    height: auto;
    border-bottom: 0;
    background: transparent;
    padding: var(--sf-space-10) 0 220px var(--sf-space-7);
    @media (max-width: 1100px) {
        display: none;
    }
`;

export const FeatureCallOut = styled.h2`
    font-family: var(--sf-font-display);
    font-weight: 800;
    text-transform: uppercase;
    color: var(--sf-text);
    font-size: clamp(40px, 6vw, 72px);
    line-height: 0.95;
    letter-spacing: -0.02em;
    margin: 0 0 var(--sf-space-4);
`;

export const Text = styled.p`
    color: var(--sf-text-dim);
    font-size: 18px;
    line-height: 1.5;
    max-width: 60ch;
    margin: 0;
`;

export const PlayButton = styled.button`
    font-family: var(--sf-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: var(--sf-accent);
    color: var(--sf-accent-ink);
    border: 2px solid var(--sf-accent);
    border-radius: 0;
    padding: 12px 22px;
    font-size: 14px;
    font-weight: 500;
    margin-top: var(--sf-space-4);
    cursor: pointer;
    transition: background var(--sf-dur-fast) var(--sf-ease), color var(--sf-dur-fast) var(--sf-ease);
    &:hover {
        background: transparent;
        color: var(--sf-accent);
    }
`;
```

- [ ] **Step 2: Update the import line in `packages/ui/src/components/header/index.tsx`**

Replace line 2-5 (the import from `./styles/header`) so `Logo` becomes `Wordmark`:

```tsx
import {
    Background, Container, LinkRoute, Wordmark, ButtonLink, Group, TextLink,
    Search, SearchInput, Picture, Dropdown, Profile, Feature, FeatureCallOut, Text, PlayButton
} from './styles/header';
```

- [ ] **Step 3: Replace the `Header.Logo` function in the same file**

Replace the existing `Header.Logo` (lines 28-34) with:

```tsx
Header.Logo = function HeaderLogo({ to, src, alt, ...restProps }: HeaderLogoProps) {
    return (
        <LinkRoute href={to} aria-label="StreamFlare home" {...restProps}>
            <Wordmark>STREAMFLARE</Wordmark>
        </LinkRoute>
    );
};
```

(The `src` and `alt` props are now destructured and intentionally ignored so call sites do not need to change and no invalid `src` lands on the anchor. The `HeaderLogoProps` interface stays as-is.)

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @streamflare/ui typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/header
git commit -m "feat(ui): rebuild Header in brutalist language with wordmark logo"
```

---

### Task 1.2: Feature (landing hero) restyle

**Files:**
- Modify (full replace): `packages/ui/src/components/feature/styles/feature.ts`

- [ ] **Step 1: Replace `packages/ui/src/components/feature/styles/feature.ts` entirely**

```typescript
import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    padding: var(--sf-space-10) var(--sf-space-7) var(--sf-space-9);
    border-bottom: 1px solid var(--sf-line);
    max-width: 1280px;
    @media (max-width: 740px) {
        padding: var(--sf-space-8) var(--sf-space-5);
    }
`;

export const Title = styled.h1`
    font-family: var(--sf-font-display);
    font-weight: 800;
    text-transform: uppercase;
    color: var(--sf-text);
    font-size: clamp(48px, 9vw, 140px);
    line-height: 0.92;
    letter-spacing: -0.03em;
    margin: var(--sf-space-4) 0 0;
    max-width: 16ch;
`;

export const SubTitle = styled.h2`
    font-family: var(--sf-font-mono);
    color: var(--sf-text-dim);
    font-size: clamp(14px, 1.6vw, 18px);
    font-weight: 400;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin: var(--sf-space-5) 0 0;
`;
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @streamflare/ui typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/components/feature/styles/feature.ts
git commit -m "feat(ui): rebuild landing hero Feature with oversized display type"
```

---

### Task 1.3: OptForm restyle + SVG chevron + form element

**Files:**
- Modify (full replace): `packages/ui/src/components/opt-form/styles/opt-form.ts`
- Modify: `packages/ui/src/components/opt-form/index.tsx` (`OptForm.Button`)

- [ ] **Step 1: Replace `packages/ui/src/components/opt-form/styles/opt-form.ts` entirely**

```typescript
import styled from 'styled-components';

export const Container = styled.form`
    display: flex;
    flex-wrap: wrap;
    gap: var(--sf-space-3);
    margin-top: var(--sf-space-6);
    max-width: 720px;
    @media (max-width: 740px) {
        flex-direction: column;
    }
`;

export const Input = styled.input`
    flex: 1 1 320px;
    min-width: 0;
    background: var(--sf-surface-1);
    color: var(--sf-text);
    border: 1px solid var(--sf-line);
    border-radius: 0;
    padding: 0 var(--sf-space-4);
    height: 64px;
    font-family: var(--sf-font-body);
    font-size: 16px;
    &::placeholder {
        color: var(--sf-text-dim);
    }
    &:focus-visible {
        border-color: var(--sf-accent);
        outline: none;
    }
`;

export const Break = styled.div`
    flex-basis: 100%;
    height: 0;
`;

export const Button = styled.button`
    display: inline-flex;
    align-items: center;
    gap: var(--sf-space-2);
    height: 64px;
    padding: 0 var(--sf-space-6);
    background: var(--sf-accent);
    color: var(--sf-accent-ink);
    border: 2px solid var(--sf-accent);
    border-radius: 0;
    font-family: var(--sf-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--sf-dur-fast) var(--sf-ease), color var(--sf-dur-fast) var(--sf-ease);
    svg {
        width: 18px;
        height: 18px;
    }
    &:hover {
        background: transparent;
        color: var(--sf-accent);
    }
`;

export const Text = styled.p`
    flex-basis: 100%;
    color: var(--sf-text-dim);
    font-family: var(--sf-font-mono);
    font-size: 13px;
    letter-spacing: 0.02em;
    margin: var(--sf-space-3) 0 0;
`;
```

- [ ] **Step 2: Replace the `OptForm.Button` function in `packages/ui/src/components/opt-form/index.tsx`**

Replace lines 12-19 with an inline SVG arrow (removes the raster `chevron-right.png`):

```tsx
OptForm.Button = function OptFormButton({ children, ...restProps }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <Button {...restProps}>
            {children}
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
            </svg>
        </Button>
    );
};
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @streamflare/ui typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/opt-form
git commit -m "feat(ui): rebuild OptForm with brutalist field, accent button, SVG arrow"
```

---

### Task 1.4: Form (auth) restyle

**Files:**
- Modify (full replace): `packages/ui/src/components/form/styles/form.ts`

- [ ] **Step 1: Replace `packages/ui/src/components/form/styles/form.ts` entirely**

```typescript
import styled from 'styled-components';
import Link from 'next/link';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 460px;
    margin: var(--sf-space-9) auto var(--sf-space-10);
    padding: var(--sf-space-8) var(--sf-space-7);
    background: var(--sf-surface-1);
    border: 1px solid var(--sf-line);
    box-sizing: border-box;
    @media (max-width: 520px) {
        padding: var(--sf-space-6) var(--sf-space-5);
    }
`;

export const Error = styled.div`
    display: flex;
    align-items: center;
    gap: var(--sf-space-2);
    background: transparent;
    border: 1px solid var(--sf-danger);
    color: var(--sf-text);
    font-family: var(--sf-font-mono);
    font-size: 13px;
    padding: var(--sf-space-3) var(--sf-space-4);
    margin-bottom: var(--sf-space-5);
    &::before {
        content: '!';
        color: var(--sf-danger);
        font-weight: 700;
    }
`;

export const Base = styled.form`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

export const Title = styled.h1`
    font-family: var(--sf-font-display);
    font-weight: 800;
    text-transform: uppercase;
    color: var(--sf-text);
    font-size: 40px;
    letter-spacing: -0.02em;
    line-height: 1;
    margin: 0 0 var(--sf-space-6);
`;

export const Text = styled.p`
    color: var(--sf-text-dim);
    font-family: var(--sf-font-mono);
    font-size: 13px;
    margin-top: var(--sf-space-5);
`;

export const TextSmall = styled.p`
    margin-top: var(--sf-space-3);
    font-size: 12px;
    line-height: 1.5;
    color: var(--sf-text-dim);
`;

export const LinkRoute = styled(Link)`
    color: var(--sf-accent);
    text-decoration: none;
    &:hover {
        text-decoration: underline;
    }
`;

export const Input = styled.input`
    background: var(--sf-surface-2);
    color: var(--sf-text);
    border: 1px solid var(--sf-line);
    border-radius: 0;
    height: 52px;
    padding: 0 var(--sf-space-4);
    margin-bottom: var(--sf-space-4);
    font-family: var(--sf-font-body);
    font-size: 16px;
    &::placeholder {
        color: var(--sf-text-dim);
    }
    &:focus-visible {
        border-color: var(--sf-accent);
        outline: none;
    }
`;

export const Submit = styled.button`
    font-family: var(--sf-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: var(--sf-accent);
    color: var(--sf-accent-ink);
    border: 2px solid var(--sf-accent);
    border-radius: 0;
    font-size: 15px;
    font-weight: 500;
    padding: 16px;
    margin: var(--sf-space-4) 0 var(--sf-space-2);
    cursor: pointer;
    transition: background var(--sf-dur-fast) var(--sf-ease), color var(--sf-dur-fast) var(--sf-ease);
    &:hover:not(:disabled) {
        background: transparent;
        color: var(--sf-accent);
    }
    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
`;
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @streamflare/ui typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/components/form/styles/form.ts
git commit -m "feat(ui): rebuild auth Form in brutalist language"
```

---

### Task 1.5: Jumbotron restyle + framed image

**Files:**
- Modify (full replace): `packages/ui/src/components/jumbotron/styles/jumbotron.ts`
- Modify: `packages/ui/src/components/jumbotron/index.tsx` (import Frame + `Jumbotron.Image`)

- [ ] **Step 1: Replace `packages/ui/src/components/jumbotron/styles/jumbotron.ts` entirely**

```typescript
import styled from 'styled-components';

export const Container = styled.div``;

export const Item = styled.div`
    display: flex;
    border-bottom: 1px solid var(--sf-line);
    padding: var(--sf-space-9) var(--sf-space-7);
    color: var(--sf-text);
    @media (max-width: 740px) {
        padding: var(--sf-space-7) var(--sf-space-5);
    }
`;

export const Inner = styled.div<{ direction?: string }>`
    display: flex;
    align-items: center;
    gap: var(--sf-space-8);
    max-width: 1200px;
    width: 100%;
    margin: auto;
    flex-direction: ${({ direction }) => (direction === 'row-reverse' ? 'row-reverse' : 'row')};
    @media (max-width: 900px) {
        flex-direction: column;
        gap: var(--sf-space-6);
        align-items: flex-start;
    }
`;

export const Pane = styled.div`
    flex: 1 1 0;
    min-width: 0;
    &:first-child {
        flex: 1 1 55%;
    }
`;

export const Title = styled.h1`
    font-family: var(--sf-font-display);
    font-weight: 800;
    text-transform: uppercase;
    color: var(--sf-text);
    font-size: clamp(32px, 4.5vw, 64px);
    line-height: 0.96;
    letter-spacing: -0.02em;
    margin: 0 0 var(--sf-space-3);
`;

export const SubTitle = styled.h2`
    font-family: var(--sf-font-body);
    font-weight: 400;
    color: var(--sf-text-dim);
    font-size: clamp(16px, 2vw, 20px);
    line-height: 1.5;
    margin: 0;
    max-width: 60ch;
`;

export const Image = styled.img`
    display: block;
    width: 100%;
    height: auto;
`;
```

- [ ] **Step 2: Update `packages/ui/src/components/jumbotron/index.tsx`**

Change the import on line 2 to add the Frame import after it, and wrap the image. Replace lines 1-2 with:

```tsx
import React from 'react';
import { Container, Inner, Item, Pane, Title, SubTitle, Image } from './styles/jumbotron';
import Frame from '../frame';
```

Replace the `Jumbotron.Image` function (lines 32-34) with:

```tsx
Jumbotron.Image = function JumbotronImage({ ...restProps }: React.ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <Frame>
            <Image {...restProps} />
        </Frame>
    );
};
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @streamflare/ui typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/jumbotron
git commit -m "feat(ui): rebuild Jumbotron as asymmetric editorial panels with framed media"
```

---

### Task 1.6: Accordion restyle + fix missing icon

**Files:**
- Modify (full replace): `packages/ui/src/components/accordion/styles/accordion.ts`
- Modify: `packages/ui/src/components/accordion/index.tsx` (`Accordion.Header`)

- [ ] **Step 1: Replace `packages/ui/src/components/accordion/styles/accordion.ts` entirely**

```typescript
import styled from 'styled-components';

export const Container = styled.div`
    border-bottom: 1px solid var(--sf-line);
    padding: var(--sf-space-9) var(--sf-space-7);
    @media (max-width: 740px) {
        padding: var(--sf-space-7) var(--sf-space-5);
    }
`;

export const Inner = styled.div`
    max-width: 900px;
    margin: auto;
`;

export const Frame = styled.div`
    margin-bottom: var(--sf-space-6);
`;

export const Title = styled.h1`
    font-family: var(--sf-font-display);
    font-weight: 800;
    text-transform: uppercase;
    color: var(--sf-text);
    font-size: clamp(32px, 5vw, 64px);
    line-height: 0.96;
    letter-spacing: -0.02em;
    text-align: left;
    margin: 0 0 var(--sf-space-6);
`;

export const Item = styled.div`
    border: 1px solid var(--sf-line);
    border-bottom: 0;
    &:last-of-type {
        border-bottom: 1px solid var(--sf-line);
    }
`;

export const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--sf-space-4);
    cursor: pointer;
    user-select: none;
    font-family: var(--sf-font-body);
    font-weight: 500;
    color: var(--sf-text);
    font-size: clamp(16px, 2vw, 22px);
    padding: var(--sf-space-5);
    background: var(--sf-surface-1);
    transition: background var(--sf-dur-fast) var(--sf-ease);
    &:hover {
        background: var(--sf-surface-2);
    }
    .sign {
        font-family: var(--sf-font-mono);
        font-size: 26px;
        line-height: 1;
        color: var(--sf-accent);
    }
`;

export const Body = styled.div`
    font-family: var(--sf-font-body);
    color: var(--sf-text-dim);
    font-size: clamp(15px, 1.6vw, 18px);
    line-height: 1.6;
    white-space: pre-wrap;
    background: var(--sf-canvas);
    overflow: hidden;
    &.open {
        max-height: 1200px;
        transition: max-height var(--sf-dur) var(--sf-ease);
        padding: var(--sf-space-5);
    }
    &.closed {
        max-height: 0;
        transition: max-height var(--sf-dur) var(--sf-ease);
    }
`;
```

- [ ] **Step 2: Replace the `Accordion.Header` function in `packages/ui/src/components/accordion/index.tsx`**

Replace lines 31-45 with a mono glyph toggle (removes the missing `/images/icons/close-map.png` reference):

```tsx
Accordion.Header = function AccordionHeader({ children, ...restProps }: React.HTMLAttributes<HTMLDivElement>) {
    const context = useContext(ToggleContext);
    if (!context) throw new Error("Accordion.Header must be used in Accordion.Item");
    const { toggleShow, setToggleShow } = context;
    return (
        <Header onClick={() => setToggleShow(!toggleShow)} {...restProps}>
            <span>{children}</span>
            <span className="sign" aria-hidden="true">
                {toggleShow ? '-' : '+'}
            </span>
        </Header>
    );
};
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @streamflare/ui typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/accordion
git commit -m "feat(ui): rebuild Accordion with full borders and mono toggle glyph"
```

---

### Task 1.7: Footer restyle

**Files:**
- Modify (full replace): `packages/ui/src/components/footer/styles/footer.ts`

- [ ] **Step 1: Replace `packages/ui/src/components/footer/styles/footer.ts` entirely**

```typescript
import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 1200px;
    margin: auto;
    padding: var(--sf-space-9) var(--sf-space-7);
    @media (max-width: 740px) {
        padding: var(--sf-space-7) var(--sf-space-5);
    }
`;

export const Title = styled.p`
    font-family: var(--sf-font-mono);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 13px;
    color: var(--sf-text-dim);
    margin: 0 0 var(--sf-space-6);
    padding-bottom: var(--sf-space-5);
    border-bottom: 1px solid var(--sf-line-strong);
`;

export const Row = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--sf-space-6);
`;

export const Column = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--sf-space-3);
`;

export const Link = styled.a`
    font-family: var(--sf-font-mono);
    color: var(--sf-text-dim);
    font-size: 13px;
    text-decoration: none;
    width: fit-content;
    &:hover {
        color: var(--sf-accent);
    }
`;

export const Text = styled.p`
    font-family: var(--sf-font-mono);
    font-size: 13px;
    color: var(--sf-text-dim);
    margin: 0;
`;

export const Break = styled.div`
    flex-basis: 100%;
    height: 0;
`;
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @streamflare/ui typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/components/footer/styles/footer.ts
git commit -m "feat(ui): rebuild Footer as exposed mono link grid"
```

---

### Task 1.8: Landing page wiring

**Files:**
- Modify (full replace): `apps/web/app/page.tsx`

- [ ] **Step 1: Replace `apps/web/app/page.tsx` entirely**

```tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Feature, OptForm, Jumbotron, Accordion, Section, Tag } from '@streamflare/ui';
import * as ROUTES from '../constants/routes';
import { FooterContainer } from '../containers/footer';
import jumboData from '../fixtures/jumbo.json';
import faqsData from '../fixtures/faqs.json';

export default function HomePage() {
  const router = useRouter();
  const [emailInput, setEmailInput] = useState('');

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`${ROUTES.SIGN_UP}?email=${encodeURIComponent(emailInput)}`);
  };

  return (
    <>
      <Header>
        <Header.Frame>
          <Header.Logo to={ROUTES.HOME} src="/images/logo.svg" alt="StreamFlare" />
          <Header.ButtonLink to={ROUTES.SIGN_IN}>Sign In</Header.ButtonLink>
        </Header.Frame>
        <Feature>
          <Tag accent style={{ marginBottom: 'var(--sf-space-4)' }}>Now Streaming</Tag>
          <Feature.Title>Unlimited films, TV programmes and more.</Feature.Title>
          <Feature.SubTitle>Watch anywhere. Cancel anytime.</Feature.SubTitle>
          <OptForm onSubmit={handleGetStarted}>
            <OptForm.Input
              placeholder="Email address"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <OptForm.Button type="submit">Try it now</OptForm.Button>
            <OptForm.Break />
            <OptForm.Text>
              Ready to watch? Enter your email to create or restart your membership.
            </OptForm.Text>
          </OptForm>
        </Feature>
      </Header>

      <Section index="01" label="Why StreamFlare">
        <Jumbotron.Container>
          {jumboData.map((item) => (
            <Jumbotron key={item.id} direction={item.direction}>
              <Jumbotron.Pane>
                <Jumbotron.Title>{item.title}</Jumbotron.Title>
                <Jumbotron.SubTitle>{item.subTitle}</Jumbotron.SubTitle>
              </Jumbotron.Pane>
              <Jumbotron.Pane>
                <Jumbotron.Image src={item.image} alt={item.alt} />
              </Jumbotron.Pane>
            </Jumbotron>
          ))}
        </Jumbotron.Container>
      </Section>

      <Section index="02" label="FAQ">
        <Accordion>
          <Accordion.Title>Frequently Asked Questions</Accordion.Title>
          <Accordion.Frame>
            {faqsData.map((item) => (
              <Accordion.Item key={item.id}>
                <Accordion.Header>{item.header}</Accordion.Header>
                <Accordion.Body>{item.body}</Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion.Frame>
          <OptForm onSubmit={handleGetStarted}>
            <OptForm.Input
              placeholder="Email address"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <OptForm.Button type="submit">Try it now</OptForm.Button>
            <OptForm.Break />
            <OptForm.Text>
              Ready to watch? Enter your email to create or restart your membership.
            </OptForm.Text>
          </OptForm>
        </Accordion>
      </Section>

      <FooterContainer />
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @streamflare/web typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat(web): wire landing page with numbered sections and kicker"
```

---

### Task 1.9: Sign In and Sign Up pages

**Files:**
- Modify (full replace): `apps/web/app/signin/page.tsx`
- Modify (full replace): `apps/web/app/signup/page.tsx`

- [ ] **Step 1: Replace `apps/web/app/signin/page.tsx` entirely**

Only the form body changes (inputs become `Field` with visible mono labels); all auth logic is identical.

```tsx
'use client';

import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Form, Field } from '@streamflare/ui';
import { api } from '../../lib/api-client';
import { useAuth } from '../../context/auth-context';
import * as ROUTES from '../../constants/routes';
import { FooterContainer } from '../../containers/footer';

interface LoginResponse {
  EMAIL: string;
  token: string;
}

interface MaxProfilesResponse {
  mp: { MAX_PROFILES: number };
}

interface NumProfilesResponse {
  C: { C: number };
}

interface SubIdResponse {
  sub_id: { SUB_ID: number } | null;
}

interface BillResponse {
  bill: { BILL: number };
}

export default function SignInPage() {
  const router = useRouter();
  const auth = useAuth();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isInvalid = password === '' || emailAddress === '';

  const handleSignin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data, status } = await api.post<LoginResponse>(
        '/api/users/login',
        { EMAIL: emailAddress, PASSWORD: password },
        { validateStatus: () => true }
      );

      if (status === 422) {
        setError('User does not exist. Please sign up instead');
        setSubmitting(false);
        return;
      }
      if (status === 423) {
        setError('Incorrect Password');
        setSubmitting(false);
        return;
      }
      if (status !== 201) {
        setError('Login failed');
        setSubmitting(false);
        return;
      }

      auth.login(emailAddress, data.token);

      const mp = await api.get<MaxProfilesResponse>(`/api/users/maxprofiles/${emailAddress}`);
      auth.set_max_profiles(mp.data.mp.MAX_PROFILES);

      const np = await api.get<NumProfilesResponse>(`/api/users/numprofiles/${emailAddress}`);
      auth.set_num_profiles(np.data.C.C);

      const sub = await api.get<SubIdResponse>(`/api/subscription/subid/${emailAddress}`);
      if (sub.data.sub_id?.SUB_ID) {
        const subId = sub.data.sub_id.SUB_ID;
        auth.set_sub_id(subId);
        const billResponse = await api.get<BillResponse>(`/api/subscription/bill/${subId}`);
        auth.set_bill(billResponse.data.bill.BILL);
        router.push(ROUTES.BROWSE);
      } else {
        router.push(ROUTES.ADD_SUBSCRIPTION);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header>
        <Header.Frame>
          <Header.Logo to={ROUTES.HOME} src="/images/logo.svg" alt="StreamFlare" />
        </Header.Frame>

        <Form>
          <Form.Title>Sign In</Form.Title>
          {error && <Form.Error data-testid="error">{error}</Form.Error>}

          <Form.Base onSubmit={handleSignin} method="POST">
            <Field
              label="Email address"
              type="email"
              autoComplete="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              required
            />
            <Field
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Form.Submit disabled={isInvalid || submitting} type="submit" data-testid="sign-in">
              {submitting ? 'Signing in...' : 'Sign In'}
            </Form.Submit>
          </Form.Base>

          <Form.Text>
            New to StreamFlare? <Form.Link to={ROUTES.SIGN_UP}>Sign up now.</Form.Link>
          </Form.Text>
        </Form>
      </Header>
      <FooterContainer />
    </>
  );
}
```

- [ ] **Step 2: Replace `apps/web/app/signup/page.tsx` entirely**

Inputs become `Field`; the country select and its label are tokenized; all signup logic is identical.

```tsx
'use client';

import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CountryDropdown } from 'react-country-region-selector';
import styled from 'styled-components';
import { Header, Form, Field } from '@streamflare/ui';
import { api } from '../../lib/api-client';
import { useAuth } from '../../context/auth-context';
import * as ROUTES from '../../constants/routes';
import { FooterContainer } from '../../containers/footer';

interface SignupResponse {
  EMAIL: string;
  token: string;
}

const FieldLabel = styled.label`
  display: block;
  font-family: var(--sf-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: var(--sf-text-dim);
  margin-bottom: var(--sf-space-2);
`;

const CountryBlock = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: var(--sf-space-4);
  select {
    background: var(--sf-surface-2);
    color: var(--sf-text);
    height: 52px;
    border: 1px solid var(--sf-line);
    border-radius: 0;
    padding: 0 var(--sf-space-4);
    font-family: var(--sf-font-body);
    font-size: 16px;
    width: 100%;
    outline: none;
  }
  select:focus-visible {
    border-color: var(--sf-accent);
  }
`;

export default function SignUpPage() {
  const router = useRouter();
  const auth = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [creditCard, setCreditCard] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isInvalid =
    name === '' || email === '' || dob === '' || password === '' || creditCard === '' || phone === '';

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) {
      setError('Password should be at least 8 characters long');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { data, status } = await api.post<SignupResponse>(
        '/api/users/signup',
        {
          NAME: name,
          EMAIL: email,
          DOB: dob,
          COUNTRY: country,
          CREDIT_CARD: creditCard,
          PASSWORD: password,
          PHONE: phone,
        },
        { validateStatus: () => true }
      );

      if (status === 422) {
        setError('Invalid user info');
        setSubmitting(false);
        return;
      }
      if (status === 423) {
        setError('User already exists');
        setSubmitting(false);
        return;
      }
      if (status !== 201) {
        setError('Signup failed');
        setSubmitting(false);
        return;
      }

      auth.login(email, data.token);
      router.push(ROUTES.ADD_SUBSCRIPTION);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header>
        <Header.Frame>
          <Header.Logo to={ROUTES.HOME} src="/images/logo.svg" alt="StreamFlare" />
        </Header.Frame>

        <Form style={{ maxWidth: '600px' }}>
          <Form.Title>Sign Up</Form.Title>
          {error && <Form.Error data-testid="error">{error}</Form.Error>}

          <Form.Base onSubmit={handleSignup} method="POST">
            <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Field
              label="Password"
              type="password"
              autoComplete="new-password"
              helper="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Field
              label="Date of Birth"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
            <Field
              label="Credit Card No."
              inputMode="numeric"
              value={creditCard}
              onChange={(e) => setCreditCard(e.target.value)}
              required
            />
            <Field
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <CountryBlock>
              <FieldLabel htmlFor="country">Country</FieldLabel>
              <CountryDropdown value={country} onChange={(val) => setCountry(val)} />
            </CountryBlock>

            <Form.Submit disabled={isInvalid || submitting} type="submit" data-testid="sign-up">
              {submitting ? 'Creating account...' : 'Sign Up'}
            </Form.Submit>
          </Form.Base>

          <Form.Text>
            Already a user? <Form.Link to={ROUTES.SIGN_IN}>Sign in now</Form.Link>
          </Form.Text>
        </Form>
      </Header>
      <FooterContainer />
    </>
  );
}
```

Note: `CountryDropdown` does not forward an `id`, so the `htmlFor="country"` label association is best-effort; the visible mono label is the accessibility win here. Leave as-is for this phase.

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @streamflare/web typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/signin/page.tsx apps/web/app/signup/page.tsx
git commit -m "feat(web): rebuild sign in and sign up with labeled brutalist fields"
```

---

### Task 1.10: Phase 1 verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck across the two packages**

Run: `pnpm --filter @streamflare/ui typecheck && pnpm --filter @streamflare/web typecheck`
Expected: both PASS.

- [ ] **Step 2: Run the full web test suite**

Run: `pnpm --filter @streamflare/web test`
Expected: all tests pass (smoke, button x2, field x2, primitives x3).

- [ ] **Step 3: Production build**

Run: `pnpm --filter @streamflare/web build`
Expected: build succeeds with no styled-components SSR/hydration warnings.

- [ ] **Step 4: Confirm no hardcoded hex remains in the Phase 1 components**

Run: `git grep -nE "#[0-9a-fA-F]{3,6}" -- "packages/ui/src/components/header" "packages/ui/src/components/feature" "packages/ui/src/components/opt-form" "packages/ui/src/components/form" "packages/ui/src/components/jumbotron" "packages/ui/src/components/accordion" "packages/ui/src/components/footer"`
Expected: no output (every color now flows through tokens).

- [ ] **Step 5: Manual visual checklist (run `pnpm dev`, open http://localhost:3000)**

Verify on the landing, sign in, and sign up routes:
- Cool near-black canvas, off-white text, acid-lime accent only on CTAs / kicker / active states. No Netflix red, no pure black, no rounded corners.
- Oversized Bricolage headline on the landing hero; mono kicker and section numbers visible; exposed hairline section rules.
- "Try it now" submits (the OptForm is now a real `<form>`); accent button inverts on hover.
- FAQ accordion opens/closes with the mono `+`/`-` glyph (no broken image icon).
- Sign in / sign up show visible mono field labels; focus rings are 2px lime with offset; submit disabled state is dimmed.
- Check at 375px, 768px, 1024px, 1440px and in `prefers-reduced-motion` (transitions effectively off, layout intact).

- [ ] **Step 6: Commit any fixes found during the manual pass**

```bash
git add -A
git commit -m "fix(web): address Phase 1 visual review findings"
```

(Skip this commit if the manual pass found nothing.)

---

## Self-Review

**Spec coverage** (against `2026-05-29-brutalist-redesign-design.md`):
- Technical approach (CSS-var tokens, keep registry/compound APIs, no Tailwind): Tasks 0.1-0.4. ✔
- Full token set (color/type/spacing/border/motion/z): Task 0.2. ✔
- Typography (Bricolage/Archivo/JetBrains Mono via next/font): Task 0.3. ✔
- New primitives (GlobalStyle, Button, Field, Tag, Section, Frame): Tasks 0.2, 0.6-0.8. ✔
- Rebuilt components for Phase 1 (Header, Feature, OptForm, Form, Jumbotron, Accordion, Footer) with the specific behavior changes (wordmark, SVG arrow, always-visible labels, mono glyph, framed media, no radius/shadow): Tasks 1.1-1.7. ✔
- Phase 1 pages (landing, signin, signup): Tasks 1.8-1.9. ✔
- Accessibility (visible labels, focus rings, error role=alert, reduced-motion): Field primitive + GlobalStyle + manual checklist. ✔
- Verification (typecheck, build, no-hex grep, responsive/reduced-motion manual): Task 1.10. ✔
- Components NOT in Phase 1 (Card, Player, Profiles, Loading, Header2, Form2): correctly deferred to Phase 2/3, not in this plan. ✔

**Placeholder scan:** No TBD/TODO; every code step has full file content or a fully-specified edit. ✔

**Type consistency:** Token names (`--sf-*`) are identical across Task 0.2 and all consumers. Primitive prop names (`variant`, `label`/`error`/`helper`, `framed`/`accent`, `index`/`label`) match between component definitions and their usages in pages. Transient props use the `$` prefix (`$variant`, `$error`, `$framed`, `$accent`) consistently so they are not forwarded to the DOM. ✔

**Known caveat carried into execution:** `next/font/google` requires network at build/dev time; if offline, Task 0.3 onward will fail fetching fonts. Documented at the top.
