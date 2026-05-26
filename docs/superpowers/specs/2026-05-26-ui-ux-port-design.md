# Specification: Porting Legacy UI/UX to Monorepo

Restore the original Netflix-inspired visual identity from the legacy frontend codebase to the new monorepo Next.js web application by moving custom `styled-components`, containers, fixtures, assets, and page logic to a shared workspace package (`@streamflare/ui`).

## Objectives
1. Build a workspace package `@streamflare/ui` containing the custom styled-components and shared layouts.
2. Port public assets (images, videos) from `legacy/frontend/public` to `apps/web/public`.
3. Support server-side rendering of styles in the Next.js App Router by implementing a custom styled-components stylesheet registry.
4. Replace the basic MUI page implementations in `apps/web/app/` with the original styled layouts, utilizing the Next.js App Router for routing and context for state management.

---

## 1. Shared Package Structure (`packages/ui`)

A new TypeScript-compatible package `@streamflare/ui` will be created in the `packages/` directory.

### `packages/ui/package.json`
```json
{
  "name": "@streamflare/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react-player": "^2.7.0",
    "styled-components": "^6.1.1"
  },
  "peerDependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0"
  }
}
```

### `packages/ui/tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "jsx": "preserve"
  },
  "include": ["src/**/*"]
}
```

### Components to Export (`packages/ui/src/components`)
We will write typed React components inside `packages/ui/src/components/` and export them from `packages/ui/src/index.ts`:
* **Accordion**: Handles FAQ expanding/collapsing.
* **Card**: Netflix-style lists of titles with hover preview metadata.
* **Feature**: Bold headline and subtitle component.
* **Footer**: Bottom layout links.
* **Form** & **Form2**: Custom styled forms.
* **Header** & **Header2**: Sticky navigation bar, logo, options link, sliding search input, profile selector.
* **Jumbotron**: Horizontal alternating media/text panels.
* **Loading**: User selection page loader spinner.
* **OptForm**: Landing page email signup box.
* **Player**: Portalled YouTube overlay using react-player.
* **Profiles**: Visual profile avatars selection view.

---

## 2. Server-side Styles Registry in Next.js

To prevent the styling from flashing when loading Next.js pages, we will set up a stylesheet registry that captures styled-components during server rendering.

### `apps/web/lib/registry.tsx`
```typescript
"use client";

import React, { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

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

  if (typeof window !== "undefined") return <>{children}</>;

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  );
}
```

Wrap the root layout in `apps/web/app/layout.tsx` to include `StyledComponentsRegistry`.

---

## 3. Next.js Routing & Pages Migration

All pages in `apps/web/app/` will be updated to client components using the ported custom styled-components and page layout logic:

### Page Changes:
1. **Home (`/`)**:
   * Uses `Header`, `Feature`, `OptForm`, `Jumbotron`, `Accordion`, `Footer`.
   * Displays FAQ list and alternating jumbo text panels.
2. **Sign In (`/signin`) & Sign Up (`/signup`)**:
   * Renders `Form` inputs, triggers auth login/signup, hydrates context metadata, and redirects.
3. **Browse (`/browse`)**:
   * Conditionally renders profile selection or movie grids:
     * If no profile is selected: Renders `SelectProfileContainer` (avatar list). Selecting an avatar sets `auth.set_profile(PROFILE_ID)`.
     * If profile is selected: Displays main browse categories (Movies, Shows, WatchList, Suggestions, New/Popular) with search slider, TMDb play video features.
4. **Settings (`/account`, `/account/password`, `/account/phone`)**:
   * Displays subscription details (Basic, Standard, Premium), settings links, update inputs.
5. **Subscription (`/subscription/add`, `/subscription/update`, `/subscription/cancel`, `/subscription/history`)**:
   * Renders plan details, selection buttons, cancellations, history logs.
6. **Watch History (`/history/movies`, `/history/shows`)**:
   * Lists of watched films and shows for the active profile.

---

## 4. Verification & Testing

* Compile workspace using `pnpm build` or run Next.js types checking:
  ```bash
  pnpm --filter @streamflare/web typecheck
  ```
* Launch development server:
  ```bash
  pnpm dev
  ```
* Visually check landing page, sign in/out, profile creation and selection, browse rows, hover overlays, video play triggers, and settings panels.
