# StreamFlare Premium Redesign — Phase 1 (Brand & Entry) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the landing, sign-in, and sign-up pages in the Aurora Noir premium-cinematic language using the Phase 0 design system, preserving all API contracts and post-auth routing.

**Architecture:** Page-level composition lives in `apps/web/components/marketing/*` and `apps/web/components/auth/*`, built from `@streamflare/ui` primitives (HeroBackdrop, GlassPanel, GlowButton, ContentRow, PosterCard, SectionHeader, Wordmark, FadeIn) and shadcn primitives (Input, Form, Accordion, Alert, Button). Auth forms use react-hook-form + zod with schemas in `apps/web/lib/auth-schemas.ts`. Landing content comes from JSON fixtures (StreamFlare-branded). No backend changes.

**Tech Stack:** Next.js 14 App Router, Tailwind v4 + shadcn, Framer Motion, react-hook-form + zod, Vitest + Testing Library.

**Reference spec:** `docs/superpowers/specs/2026-05-29-streamflare-premium-redesign-phase-1-design.md`.

---

## Conventions

- Worktree root: `C:\Users\Best Laptop Gallery\Desktop\CodeDev\StreamFlare\.claude\worktrees\premium-redesign`.
- Build: PowerShell `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`.
- Tests: `pnpm --filter @streamflare/web test -- <pattern>`; full: `pnpm --filter @streamflare/web test`.
- Typecheck: `pnpm --filter @streamflare/web typecheck`.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- All composition components live in `apps/web/components/`; they import primitives from `@streamflare/ui` (barrel) and shadcn via `@streamflare/ui/components/ui/<name>`.

## File Structure

**Create:**
- `apps/web/fixtures/trending.json` — curated local posters for the showcase row.
- `apps/web/components/marketing/top-bar.tsx` — sticky glass nav.
- `apps/web/components/marketing/hero.tsx` — cinematic hero + email opt-in (client).
- `apps/web/components/marketing/showcase.tsx` — "Trending" ContentRow.
- `apps/web/components/marketing/feature-panel.tsx` — one alternating media/text panel.
- `apps/web/components/marketing/why-section.tsx` — three feature panels from jumbo.json.
- `apps/web/components/marketing/faq.tsx` — shadcn Accordion from faqs.json (client).
- `apps/web/components/marketing/site-footer.tsx` — tokenized marketing footer.
- `apps/web/components/auth/auth-shell.tsx` — glass card over cinematic backdrop.
- `apps/web/components/auth/sign-in-form.tsx` — rhf+zod sign-in (client).
- `apps/web/components/auth/sign-up-form.tsx` — rhf+zod sign-up (client).
- `apps/web/lib/auth-schemas.ts` — zod schemas + inferred types.
- Tests under `apps/web/__tests__/`.

**Modify:**
- `apps/web/fixtures/jumbo.json`, `apps/web/fixtures/faqs.json` — rebrand copy to StreamFlare.
- `apps/web/app/page.tsx` — assemble landing.
- `apps/web/app/signin/page.tsx`, `apps/web/app/signup/page.tsx` — use AuthShell + forms.

---

## Task 1: Fixtures (trending posters + StreamFlare rebrand)

**Files:**
- Create: `apps/web/fixtures/trending.json`
- Modify: `apps/web/fixtures/jumbo.json`, `apps/web/fixtures/faqs.json`

- [ ] **Step 1: Create `apps/web/fixtures/trending.json`**

```json
[
  { "title": "Joker", "subtitle": "2019 · Thriller", "image": "/images/films/thriller/joker/large.jpg" },
  { "title": "The Prestige", "subtitle": "2006 · Drama", "image": "/images/films/drama/the-prestige/large.jpg" },
  { "title": "Fight Club", "subtitle": "1999 · Drama", "image": "/images/films/drama/fight-club/large.jpg" },
  { "title": "Shutter Island", "subtitle": "2010 · Suspense", "image": "/images/films/suspense/shutter-island/large.jpg" },
  { "title": "The Revenant", "subtitle": "2015 · Drama", "image": "/images/films/drama/the-revenant/large.jpg" },
  { "title": "La La Land", "subtitle": "2016 · Romance", "image": "/images/films/romance/la-la-land/large.jpg" },
  { "title": "Gone Girl", "subtitle": "2014 · Suspense", "image": "/images/films/suspense/gone-girl/large.jpg" },
  { "title": "Black Swan", "subtitle": "2010 · Thriller", "image": "/images/films/thriller/black-swan/large.jpg" },
  { "title": "The Social Network", "subtitle": "2010 · Drama", "image": "/images/films/drama/the-social-network/large.jpg" },
  { "title": "Se7en", "subtitle": "1995 · Suspense", "image": "/images/films/suspense/seven/large.jpg" }
]
```

- [ ] **Step 2: Rebrand `apps/web/fixtures/jumbo.json` (replace file contents)**

```json
[
  {
    "id": 1,
    "title": "Enjoy on your TV.",
    "subTitle": "Watch on smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players and more.",
    "image": "/images/misc/home-tv.jpg",
    "alt": "StreamFlare on a smart TV",
    "direction": "row"
  },
  {
    "id": 2,
    "title": "Download and watch offline.",
    "subTitle": "Save your data and keep your favourites with you, anywhere.",
    "image": "/images/misc/home-mobile.jpg",
    "alt": "StreamFlare on mobile",
    "direction": "row-reverse"
  },
  {
    "id": 3,
    "title": "Watch everywhere.",
    "subTitle": "Stream unlimited films and series on your phone, tablet, laptop and TV.",
    "image": "/images/misc/home-imac.jpg",
    "alt": "StreamFlare across devices",
    "direction": "row"
  }
]
```

- [ ] **Step 3: Rebrand `apps/web/fixtures/faqs.json` (replace file contents)**

```json
[
  {
    "id": 1,
    "header": "What is StreamFlare?",
    "body": "StreamFlare is a streaming service that offers a wide variety of films, series, documentaries and more on thousands of internet-connected devices.\n\nYou can watch as much as you want, whenever you want, without a single advert, all for one low monthly price."
  },
  {
    "id": 2,
    "header": "How much does StreamFlare cost?",
    "body": "Watch StreamFlare on your smartphone, tablet, smart TV, laptop or streaming device, all for one low fixed monthly fee. Plans start low, with no extra costs or contracts."
  },
  {
    "id": 3,
    "header": "Where can I watch?",
    "body": "Watch anywhere, anytime, on an unlimited number of devices. Sign in with your StreamFlare account to watch instantly on the web or on any internet-connected device that offers the StreamFlare app."
  },
  {
    "id": 4,
    "header": "How do I cancel?",
    "body": "StreamFlare is flexible. There are no annoying contracts and no commitments. You can easily cancel your account online in two clicks, with no cancellation fees."
  },
  {
    "id": 5,
    "header": "What can I watch?",
    "body": "StreamFlare has an extensive library of feature films, documentaries, series, and award-winning originals. Watch as much as you want, any time you want."
  }
]
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/fixtures/trending.json apps/web/fixtures/jumbo.json apps/web/fixtures/faqs.json
git commit -m "feat(web): add trending fixture and rebrand landing copy to StreamFlare

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: SiteFooter

**Files:**
- Create: `apps/web/components/marketing/site-footer.tsx`
- Test: `apps/web/__tests__/site-footer.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "../components/marketing/site-footer";

describe("SiteFooter", () => {
  it("renders the wordmark and a few link columns", () => {
    render(<SiteFooter />);
    expect(screen.getByText("FAQ")).toBeInTheDocument();
    expect(screen.getByText(/© \d{4} StreamFlare/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- site-footer`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/marketing/site-footer.tsx`**

```tsx
import { Wordmark } from "@streamflare/ui";

const COLUMNS: { heading: string; links: string[] }[] = [
  { heading: "Watch", links: ["FAQ", "Ways to Watch", "Originals", "New & Popular"] },
  { heading: "Account", links: ["Help Center", "Account", "Redeem Gift Cards", "Privacy"] },
  { heading: "Company", links: ["Jobs", "Terms of Use", "Cookie Preferences", "Legal Notices"] },
  { heading: "Connect", links: ["Contact Us", "Media Center", "Investor Relations", "Speed Test"] },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-canvas px-6 py-14 md:px-12">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.2fr_repeat(4,1fr)]">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-xs text-sm text-text-subtle">
            Unlimited films and series, streaming on every screen.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.heading} className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-wide text-text-subtle">{col.heading}</p>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-text-muted transition-colors hover:text-text">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="mx-auto mt-12 max-w-6xl font-mono text-xs text-text-subtle">
        © {new Date().getFullYear()} StreamFlare. A portfolio project.
      </p>
    </footer>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- site-footer`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/marketing/site-footer.tsx apps/web/__tests__/site-footer.test.tsx
git commit -m "feat(web): add Aurora Noir SiteFooter

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: TopBar

**Files:**
- Create: `apps/web/components/marketing/top-bar.tsx`
- Test: `apps/web/__tests__/top-bar.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopBar } from "../components/marketing/top-bar";

describe("TopBar", () => {
  it("renders the wordmark and a sign-in link to /signin", () => {
    render(<TopBar />);
    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/signin");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- top-bar`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/marketing/top-bar.tsx`**

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Wordmark, GlowButton } from "@streamflare/ui";
import { cn } from "@streamflare/ui/lib/utils";

export function TopBar() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        scrolled ? "border-b border-hairline bg-canvas/80 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-12">
        <Link href="/" aria-label="StreamFlare home">
          <Wordmark />
        </Link>
        <Link href="/signin">
          <GlowButton variant="ghost" size="sm">Sign in</GlowButton>
        </Link>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- top-bar`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/marketing/top-bar.tsx apps/web/__tests__/top-bar.test.tsx
git commit -m "feat(web): add sticky glass TopBar

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Hero (email opt-in)

**Files:**
- Create: `apps/web/components/marketing/hero.tsx`
- Test: `apps/web/__tests__/hero.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { Hero } from "../components/marketing/hero";

describe("Hero", () => {
  beforeEach(() => push.mockClear());

  it("renders the headline and CTA", () => {
    render(<Hero />);
    expect(screen.getByText(/unlimited films/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
  });

  it("routes to signup with the typed email", () => {
    render(<Hero />);
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: "a@b.com" } });
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    expect(push).toHaveBeenCalledWith("/signup?email=a%40b.com");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- hero`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/marketing/hero.tsx`**

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HeroBackdrop, GlowButton, FadeIn } from "@streamflare/ui";
import { Input } from "@streamflare/ui/components/ui/input";

export function Hero() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/signup?email=${encodeURIComponent(email)}`);
  };

  return (
    <HeroBackdrop imageUrl="/images/misc/home-bg.jpg" className="min-h-[88vh]">
      <div className="mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-6 pt-24 md:px-12">
        <FadeIn className="max-w-2xl space-y-6">
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-text md:text-7xl">
            Unlimited films, series, and more.
          </h1>
          <p className="text-lg text-text-muted md:text-xl">Watch anywhere. Cancel anytime.</p>
          <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 flex-1 bg-surface-1/70 backdrop-blur"
              aria-label="Email address"
            />
            <GlowButton type="submit" size="lg">Get started</GlowButton>
          </form>
          <p className="font-mono text-xs text-text-subtle">
            Ready to watch? Enter your email to create or restart your membership.
          </p>
        </FadeIn>
      </div>
    </HeroBackdrop>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- hero`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/marketing/hero.tsx apps/web/__tests__/hero.test.tsx
git commit -m "feat(web): add cinematic Hero with email handoff to signup

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Showcase row

**Files:**
- Create: `apps/web/components/marketing/showcase.tsx`
- Test: `apps/web/__tests__/showcase.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Showcase } from "../components/marketing/showcase";

describe("Showcase", () => {
  it("renders the title and poster images", () => {
    render(<Showcase />);
    expect(screen.getByText(/trending on streamflare/i)).toBeInTheDocument();
    expect(screen.getByAltText("Joker")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- showcase`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/marketing/showcase.tsx`**

```tsx
import { ContentRow, PosterCard } from "@streamflare/ui";
import trending from "../../fixtures/trending.json";

export function Showcase() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 md:px-12">
      <ContentRow index="01" title="Trending on StreamFlare">
        {trending.map((t) => (
          <PosterCard key={t.title} title={t.title} subtitle={t.subtitle} imageUrl={t.image} />
        ))}
      </ContentRow>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- showcase`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/marketing/showcase.tsx apps/web/__tests__/showcase.test.tsx
git commit -m "feat(web): add Trending poster showcase row

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: FeaturePanel + WhySection

**Files:**
- Create: `apps/web/components/marketing/feature-panel.tsx`
- Create: `apps/web/components/marketing/why-section.tsx`
- Test: `apps/web/__tests__/why-section.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhySection } from "../components/marketing/why-section";

describe("WhySection", () => {
  it("renders the section heading and feature titles", () => {
    render(<WhySection />);
    expect(screen.getByText(/why streamflare/i)).toBeInTheDocument();
    expect(screen.getByText("Enjoy on your TV.")).toBeInTheDocument();
    expect(screen.getByText("Watch everywhere.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- why-section`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/marketing/feature-panel.tsx`**

```tsx
import { FadeIn } from "@streamflare/ui";
import { cn } from "@streamflare/ui/lib/utils";

export interface FeaturePanelProps {
  title: string;
  subTitle: string;
  image: string;
  alt: string;
  reverse?: boolean;
}

export function FeaturePanel({ title, subTitle, image, alt, reverse }: FeaturePanelProps) {
  return (
    <FadeIn
      className={cn(
        "grid items-center gap-8 md:grid-cols-2",
        reverse && "md:[&>*:first-child]:order-2",
      )}
    >
      <div className="space-y-4">
        <h3 className="font-display text-3xl font-bold tracking-tight text-text md:text-4xl">{title}</h3>
        <p className="text-lg text-text-muted">{subTitle}</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-hairline bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={alt} loading="lazy" className="aspect-video w-full object-cover" />
      </div>
    </FadeIn>
  );
}
```

- [ ] **Step 4: Create `apps/web/components/marketing/why-section.tsx`**

```tsx
import { SectionHeader } from "@streamflare/ui";
import { FeaturePanel } from "./feature-panel";
import jumbo from "../../fixtures/jumbo.json";

export function WhySection() {
  return (
    <section className="mx-auto max-w-6xl space-y-12 px-6 py-20 md:px-12">
      <SectionHeader index="02" title="Why StreamFlare" />
      <div className="space-y-20">
        {jumbo.map((item) => (
          <FeaturePanel
            key={item.id}
            title={item.title}
            subTitle={item.subTitle}
            image={item.image}
            alt={item.alt}
            reverse={item.direction === "row-reverse"}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- why-section`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/marketing/feature-panel.tsx apps/web/components/marketing/why-section.tsx apps/web/__tests__/why-section.test.tsx
git commit -m "feat(web): add WhySection feature panels

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: FAQ

**Files:**
- Create: `apps/web/components/marketing/faq.tsx`
- Test: `apps/web/__tests__/faq.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Faq } from "../components/marketing/faq";

describe("Faq", () => {
  it("renders the section heading and question triggers", () => {
    render(<Faq />);
    expect(screen.getByText(/frequently asked/i)).toBeInTheDocument();
    expect(screen.getByText("What is StreamFlare?")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- faq`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/marketing/faq.tsx`**

```tsx
"use client";

import { SectionHeader } from "@streamflare/ui";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@streamflare/ui/components/ui/accordion";
import faqs from "../../fixtures/faqs.json";

export function Faq() {
  return (
    <section className="mx-auto max-w-3xl space-y-8 px-6 py-20 md:px-12">
      <SectionHeader index="03" title="Frequently asked questions" />
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((item) => (
          <AccordionItem key={item.id} value={`item-${item.id}`}>
            <AccordionTrigger className="text-left font-display text-lg">{item.header}</AccordionTrigger>
            <AccordionContent className="whitespace-pre-line text-text-muted">{item.body}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- faq`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/marketing/faq.tsx apps/web/__tests__/faq.test.tsx
git commit -m "feat(web): add FAQ accordion section

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Assemble landing page

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Replace `apps/web/app/page.tsx`**

```tsx
import { TopBar } from "../components/marketing/top-bar";
import { Hero } from "../components/marketing/hero";
import { Showcase } from "../components/marketing/showcase";
import { WhySection } from "../components/marketing/why-section";
import { Faq } from "../components/marketing/faq";
import { SiteFooter } from "../components/marketing/site-footer";

export default function HomePage() {
  return (
    <>
      <TopBar />
      <main>
        <Hero />
        <Showcase />
        <WhySection />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: Build and confirm `/` prerenders**

Run (PowerShell): `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: success; `/` prerenders; no errors.

- [ ] **Step 3: (Manual, optional) Visual check**

Run `pnpm --filter @streamflare/web dev`, open `http://localhost:3000`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat(web): assemble Aurora Noir landing page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Auth zod schemas

**Files:**
- Create: `apps/web/lib/auth-schemas.ts`
- Test: `apps/web/__tests__/auth-schemas.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { signInSchema, signUpSchema } from "../lib/auth-schemas";

describe("auth schemas", () => {
  it("sign-in requires a valid email and non-empty password", () => {
    expect(signInSchema.safeParse({ email: "x", password: "" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@b.com", password: "secret" }).success).toBe(true);
  });
  it("sign-up rejects short passwords and requires all fields", () => {
    const ok = {
      name: "Ada", email: "a@b.com", password: "longenough", dob: "1990-01-01",
      creditCard: "4111111111111111", phone: "5551234", country: "United States",
    };
    expect(signUpSchema.safeParse(ok).success).toBe(true);
    expect(signUpSchema.safeParse({ ...ok, password: "short" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...ok, name: "" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- auth-schemas`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/lib/auth-schemas.ts`**

```ts
import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  dob: z.string().min(1, "Date of birth is required"),
  creditCard: z.string().min(12, "Enter a valid card number").max(19),
  phone: z.string().min(5, "Enter a valid phone number"),
  country: z.string().min(1, "Select your country"),
});
export type SignUpValues = z.infer<typeof signUpSchema>;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- auth-schemas`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/auth-schemas.ts apps/web/__tests__/auth-schemas.test.ts
git commit -m "feat(web): add zod auth schemas

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: AuthShell

**Files:**
- Create: `apps/web/components/auth/auth-shell.tsx`
- Test: `apps/web/__tests__/auth-shell.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthShell } from "../components/auth/auth-shell";

describe("AuthShell", () => {
  it("renders the wordmark and its children", () => {
    render(<AuthShell><p>form here</p></AuthShell>);
    expect(screen.getByText("form here")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /streamflare home/i })).toHaveAttribute("href", "/");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- auth-shell`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/auth/auth-shell.tsx`**

```tsx
import * as React from "react";
import Link from "next/link";
import { HeroBackdrop, GlassPanel, Wordmark, FadeIn } from "@streamflare/ui";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <HeroBackdrop imageUrl="/images/misc/joker1.jpg" className="min-h-dvh">
      <div className="absolute left-6 top-6 z-10 md:left-12 md:top-8">
        <Link href="/" aria-label="StreamFlare home">
          <Wordmark />
        </Link>
      </div>
      <div className="flex min-h-dvh items-center justify-center px-6 py-24">
        <FadeIn className="w-full max-w-md">
          <GlassPanel className="p-8">{children}</GlassPanel>
        </FadeIn>
      </div>
    </HeroBackdrop>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- auth-shell`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/auth/auth-shell.tsx apps/web/__tests__/auth-shell.test.tsx
git commit -m "feat(web): add glass-card-over-backdrop AuthShell

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: SignInForm

**Files:**
- Create: `apps/web/components/auth/sign-in-form.tsx`
- Test: `apps/web/__tests__/sign-in-form.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider } from "../context/auth-context";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const post = vi.fn();
const get = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { post: (...a: unknown[]) => post(...a), get: (...a: unknown[]) => get(...a) } }));

import { SignInForm } from "../components/auth/sign-in-form";

const renderForm = () => render(<AuthProvider><SignInForm /></AuthProvider>);

describe("SignInForm", () => {
  beforeEach(() => { push.mockClear(); post.mockReset(); get.mockReset(); });

  it("shows a validation error for an invalid email", async () => {
    renderForm();
    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("posts credentials and routes to /subscription/add when no subscription", async () => {
    post.mockResolvedValue({ status: 201, data: { EMAIL: "a@b.com", token: "t" } });
    get.mockImplementation((url: string) => {
      if (url.includes("maxprofiles")) return Promise.resolve({ data: { mp: { MAX_PROFILES: 2 } } });
      if (url.includes("numprofiles")) return Promise.resolve({ data: { C: { C: 0 } } });
      if (url.includes("subid")) return Promise.resolve({ data: { sub_id: null } });
      return Promise.resolve({ data: {} });
    });
    renderForm();
    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
    fireEvent.input(screen.getByLabelText(/password/i), { target: { value: "secret1" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(post).toHaveBeenCalledWith(
      "/api/users/login",
      { EMAIL: "a@b.com", PASSWORD: "secret1" },
      { validateStatus: expect.any(Function) },
    ));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/subscription/add"));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- sign-in-form`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/auth/sign-in-form.tsx`**

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { GlowButton } from "@streamflare/ui";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@streamflare/ui/components/ui/form";
import { Input } from "@streamflare/ui/components/ui/input";
import { Alert, AlertDescription } from "@streamflare/ui/components/ui/alert";
import { signInSchema, type SignInValues } from "../../lib/auth-schemas";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";

interface LoginResponse { EMAIL: string; token: string }

export function SignInForm() {
  const router = useRouter();
  const auth = useAuth();
  const [formError, setFormError] = React.useState("");
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignInValues) => {
    setFormError("");
    try {
      const { data, status } = await api.post<LoginResponse>(
        "/api/users/login",
        { EMAIL: values.email, PASSWORD: values.password },
        { validateStatus: () => true },
      );
      if (status === 422) return setFormError("User does not exist. Please sign up instead.");
      if (status === 423) return setFormError("Incorrect password.");
      if (status !== 201) return setFormError("Login failed. Please try again.");

      auth.login(values.email, data.token);
      const mp = await api.get(`/api/users/maxprofiles/${values.email}`);
      auth.set_max_profiles(mp.data.mp.MAX_PROFILES);
      const np = await api.get(`/api/users/numprofiles/${values.email}`);
      auth.set_num_profiles(np.data.C.C);
      const sub = await api.get(`/api/subscription/subid/${values.email}`);
      if (sub.data.sub_id?.SUB_ID) {
        const subId = sub.data.sub_id.SUB_ID;
        auth.set_sub_id(subId);
        const bill = await api.get(`/api/subscription/bill/${subId}`);
        auth.set_bill(bill.data.bill.BILL);
        router.push("/browse");
      } else {
        router.push("/subscription/add");
      }
    } catch (err) {
      const msg = (err as Error).message ?? "Something went wrong";
      setFormError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-text">Sign in</h1>
        <p className="text-sm text-text-muted">Welcome back to StreamFlare.</p>
      </div>
      {formError ? (
        <Alert variant="destructive" data-testid="error"><AlertDescription>{formError}</AlertDescription></Alert>
      ) : null}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <GlowButton type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </GlowButton>
        </form>
      </Form>
      <p className="text-sm text-text-muted">
        New to StreamFlare? <Link href="/signup" className="text-brand hover:underline">Sign up now.</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- sign-in-form`
Expected: PASS. (If RHF submit timing flakes, the `waitFor` calls already account for async.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/auth/sign-in-form.tsx apps/web/__tests__/sign-in-form.test.tsx
git commit -m "feat(web): add rhf+zod SignInForm preserving the login flow

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 12: Rebuild /signin page

**Files:**
- Modify: `apps/web/app/signin/page.tsx`

- [ ] **Step 1: Replace `apps/web/app/signin/page.tsx`**

```tsx
import { AuthShell } from "../../components/auth/auth-shell";
import { SignInForm } from "../../components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <AuthShell>
      <SignInForm />
    </AuthShell>
  );
}
```

- [ ] **Step 2: Typecheck + build**

Run: `pnpm --filter @streamflare/web typecheck` then (PowerShell) `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: both succeed; `/signin` prerenders.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/signin/page.tsx
git commit -m "feat(web): rebuild /signin with AuthShell + SignInForm

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 13: SignUpForm

**Files:**
- Create: `apps/web/components/auth/sign-up-form.tsx`
- Test: `apps/web/__tests__/sign-up-form.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider } from "../context/auth-context";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams("email=pre%40fill.com"),
}));

const post = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { post: (...a: unknown[]) => post(...a) } }));

import { SignUpForm } from "../components/auth/sign-up-form";

const renderForm = () => render(<AuthProvider><SignUpForm /></AuthProvider>);

describe("SignUpForm", () => {
  beforeEach(() => { push.mockClear(); post.mockReset(); });

  it("prefills the email from the query string", () => {
    renderForm();
    expect(screen.getByLabelText(/email/i)).toHaveValue("pre@fill.com");
  });

  it("rejects a short password before posting", async () => {
    renderForm();
    fireEvent.input(screen.getByLabelText(/^name/i), { target: { value: "Ada" } });
    fireEvent.input(screen.getByLabelText(/password/i), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- sign-up-form`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/auth/sign-up-form.tsx`**

```tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { GlowButton, CountryCombobox } from "@streamflare/ui";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@streamflare/ui/components/ui/form";
import { Input } from "@streamflare/ui/components/ui/input";
import { Alert, AlertDescription } from "@streamflare/ui/components/ui/alert";
import { signUpSchema, type SignUpValues } from "../../lib/auth-schemas";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";

interface SignupResponse { EMAIL: string; token: string }

export function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();
  const [formError, setFormError] = React.useState("");
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "", email: params.get("email") ?? "", password: "",
      dob: "", creditCard: "", phone: "", country: "",
    },
  });

  const onSubmit = async (v: SignUpValues) => {
    setFormError("");
    try {
      const { data, status } = await api.post<SignupResponse>(
        "/api/users/signup",
        {
          NAME: v.name, EMAIL: v.email, DOB: v.dob, COUNTRY: v.country,
          CREDIT_CARD: v.creditCard, PASSWORD: v.password, PHONE: v.phone,
        },
        { validateStatus: () => true },
      );
      if (status === 422) return setFormError("Invalid user info.");
      if (status === 423) return setFormError("User already exists. Try signing in.");
      if (status !== 201) return setFormError("Sign up failed. Please try again.");
      auth.login(v.email, data.token);
      router.push("/subscription/add");
    } catch (err) {
      const msg = (err as Error).message ?? "Something went wrong";
      setFormError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-text">Create your account</h1>
        <p className="text-sm text-text-muted">Start watching in minutes.</p>
      </div>
      {formError ? (
        <Alert variant="destructive" data-testid="error"><AlertDescription>{formError}</AlertDescription></Alert>
      ) : null}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Name</FormLabel><FormControl><Input autoComplete="name" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email address</FormLabel><FormControl><Input type="email" autoComplete="email" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
              <FormDescription>At least 8 characters.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="dob" render={({ field }) => (
            <FormItem><FormLabel>Date of birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="creditCard" render={({ field }) => (
            <FormItem><FormLabel>Credit card number</FormLabel><FormControl><Input inputMode="numeric" autoComplete="cc-number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Phone number</FormLabel><FormControl><Input type="tel" autoComplete="tel" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="country" render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl><CountryCombobox value={field.value} onChange={field.onChange} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <GlowButton type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating account..." : "Create account"}
          </GlowButton>
        </form>
      </Form>
      <p className="text-sm text-text-muted">
        Already a member? <Link href="/signin" className="text-brand hover:underline">Sign in.</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- sign-up-form`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/auth/sign-up-form.tsx apps/web/__tests__/sign-up-form.test.tsx
git commit -m "feat(web): add rhf+zod SignUpForm with CountryCombobox + email prefill

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 14: Rebuild /signup page

**Files:**
- Modify: `apps/web/app/signup/page.tsx`

- [ ] **Step 1: Replace `apps/web/app/signup/page.tsx`**

```tsx
import { Suspense } from "react";
import { AuthShell } from "../../components/auth/auth-shell";
import { SignUpForm } from "../../components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <SignUpForm />
      </Suspense>
    </AuthShell>
  );
}
```

> `useSearchParams` requires a Suspense boundary in the App Router; the wrapper provides it.

- [ ] **Step 2: Typecheck + build**

Run: `pnpm --filter @streamflare/web typecheck` then (PowerShell) `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: both succeed; `/signup` prerenders; the styled-components `CountryDropdown`/`react-country-region-selector` import is gone from this page.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/signup/page.tsx
git commit -m "feat(web): rebuild /signup with AuthShell + SignUpForm

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 15: Phase 1 green-gate sweep

**Files:** none (verification + fixes)

- [ ] **Step 1: Typecheck both packages**

Run: `pnpm --filter @streamflare/ui typecheck` and `pnpm --filter @streamflare/web typecheck` → both PASS.

- [ ] **Step 2: Full web test suite**

Run: `pnpm --filter @streamflare/web test`
Expected: all tests pass (Phase 0 + new Phase 1: site-footer, top-bar, hero, showcase, why-section, faq, auth-schemas, auth-shell, sign-in-form, sign-up-form).

- [ ] **Step 3: Production build, all routes**

Run (PowerShell): `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: success; `/`, `/signin`, `/signup` (+ all others) prerender. `/signup` may be dynamic due to `useSearchParams`; that is acceptable.

- [ ] **Step 4: Confirm no hardcoded hex in new components**

Run: `pnpm dlx rg -n "#[0-9a-fA-F]{3,6}" apps/web/components`
Expected: no matches (tokens/utilities only).

- [ ] **Step 5: Final commit (if fixes were needed)**

```bash
git add -A
git commit -m "chore: Phase 1 green-gate fixes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage:**
- Landing top bar → Task 3; hero + email handoff → Task 4; poster showcase → Task 5; why panels → Task 6; FAQ → Task 7; footer → Task 2; assembly → Task 8. ✓
- `?email=` handoff: written by Hero (Task 4), consumed by SignUpForm (Task 13). ✓
- Glass-card-over-backdrop auth → AuthShell (Task 10). ✓
- rhf+zod forms → schemas (Task 9), SignInForm (Task 11), SignUpForm (Task 13). ✓
- CountryCombobox in signup → Task 13. ✓
- Preserved API contracts/routing → Tasks 11 & 13 (exact payload shapes + status mapping + routing from spec §3). ✓
- Rebrand copy → Task 1. ✓
- a11y (labels, FormMessage role=alert via shadcn, toasts) → Tasks 11/13. ✓
- Testing → each component task + sweep (Task 15). ✓

**2. Placeholder scan:** No TBD/placeholder steps; every code step has real code; tests include real assertions and mocks.

**3. Type/name consistency:** `signInSchema`/`signUpSchema` + `SignInValues`/`SignUpValues` (Task 9) used verbatim in Tasks 11/13; field names (`email`,`password`,`name`,`dob`,`creditCard`,`phone`,`country`) match the zod schema and the API payload mapping (NAME/EMAIL/DOB/COUNTRY/CREDIT_CARD/PASSWORD/PHONE); component import paths match the files created; `CountryCombobox` props (`value`/`onChange`) match Phase 0. Marketing components import fixtures by relative path consistent with `apps/web/fixtures/*`.

**Known interim state:** subscription/profiles/browse/etc. remain Aurora-re-skinned brutalist until later phases; the shared brutalist `@streamflare/ui` components stay until all consumers migrate.
