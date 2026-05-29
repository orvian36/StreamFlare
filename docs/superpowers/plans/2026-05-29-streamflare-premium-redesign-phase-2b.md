# StreamFlare Premium Redesign — Phase 2B (App Shell, Account & Subscription) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the authenticated `AppShell` (top nav + profile menu) and rebuild account settings (with inline password/phone dialogs) and subscription management (update/cancel/history/add) in Aurora Noir, preserving all API contracts.

**Architecture:** New `AppShell` + account dialogs in `apps/web/components/`, built from Phase 0/2A primitives (subpath imports) + shadcn (DropdownMenu, Dialog, AlertDialog, Form, Input, Separator). Forms use rhf + zod. Subscription pages reuse `PlanPicker`. No backend changes.

**Tech Stack:** Next.js 14 App Router, Tailwind v4 + shadcn, Framer Motion, react-hook-form + zod, Vitest + Testing Library.

**Reference spec:** `docs/superpowers/specs/2026-05-29-streamflare-premium-redesign-phase-2b-design.md`.

---

## Conventions

- Worktree root: `C:\Users\Best Laptop Gallery\Desktop\CodeDev\StreamFlare\.claude\worktrees\premium-redesign`.
- Build: PowerShell `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`.
- Tests: `pnpm --filter @streamflare/web test -- <pattern>`.
- Typecheck: `pnpm --filter @streamflare/{ui,web} typecheck`.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Components import `@streamflare/ui` primitives via subpaths.

## File Structure

**Create:**
- `apps/web/lib/account-schemas.ts` — password + phone zod schemas.
- `apps/web/components/app/app-shell.tsx` — authenticated top-nav shell.
- `apps/web/components/account/password-dialog.tsx` — change-password dialog.
- `apps/web/components/account/phone-dialog.tsx` — update-phone dialog.
- Tests under `apps/web/__tests__/`.

**Modify:**
- `apps/web/app/account/page.tsx` — sectioned settings inside `AppShell`.
- `apps/web/app/subscription/update/page.tsx` — `PlanPicker` + routing.
- `apps/web/app/subscription/cancel/page.tsx` — confirm + `PATCH delete`.
- `apps/web/app/subscription/history/page.tsx` — Aurora table.
- `apps/web/app/subscription/add/page.tsx` — `PlanPicker`.

**Delete:**
- `apps/web/app/account/password/page.tsx`, `apps/web/app/account/phone/page.tsx` (replaced by dialogs).

---

## Task 1: Account zod schemas

**Files:**
- Create: `apps/web/lib/account-schemas.ts`
- Test: `apps/web/__tests__/account-schemas.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { passwordSchema, phoneSchema } from "../lib/account-schemas";

describe("account schemas", () => {
  it("password requires matching new/confirm and >= 8 chars", () => {
    expect(passwordSchema.safeParse({ oldPass: "x", newPass: "longenough", newPassCon: "longenough" }).success).toBe(true);
    expect(passwordSchema.safeParse({ oldPass: "x", newPass: "longenough", newPassCon: "different" }).success).toBe(false);
    expect(passwordSchema.safeParse({ oldPass: "x", newPass: "short", newPassCon: "short" }).success).toBe(false);
  });
  it("phone requires a reasonable length", () => {
    expect(phoneSchema.safeParse({ phone: "5551234" }).success).toBe(true);
    expect(phoneSchema.safeParse({ phone: "1" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- account-schemas`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/lib/account-schemas.ts`**

```ts
import { z } from "zod";

export const passwordSchema = z
  .object({
    oldPass: z.string().min(1, "Enter your current password"),
    newPass: z.string().min(8, "New password must be at least 8 characters"),
    newPassCon: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPass === d.newPassCon, {
    message: "New passwords don't match",
    path: ["newPassCon"],
  });
export type PasswordValues = z.infer<typeof passwordSchema>;

export const phoneSchema = z.object({
  phone: z.string().min(5, "Enter a valid phone number"),
});
export type PhoneValues = z.infer<typeof phoneSchema>;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- account-schemas`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/account-schemas.ts apps/web/__tests__/account-schemas.test.ts
git commit -m "feat(web): add account (password/phone) zod schemas

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: AppShell

**Files:**
- Create: `apps/web/components/app/app-shell.tsx`
- Test: `apps/web/__tests__/app-shell.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
let authValue: { email: string | null; profile: string | null; logout: () => void };
vi.mock("../context/auth-context", () => ({ useAuth: () => authValue }));

import { AppShell } from "../components/app/app-shell";

describe("AppShell", () => {
  beforeEach(() => { push.mockClear(); authValue = { email: "a@b.com", profile: "Ada", logout: vi.fn() }; });

  it("renders the wordmark link to /browse and the content", () => {
    render(<AppShell><p>content here</p></AppShell>);
    expect(screen.getByRole("link", { name: /streamflare home/i })).toHaveAttribute("href", "/browse");
    expect(screen.getByText("content here")).toBeInTheDocument();
  });

  it("redirects to /signin when unauthenticated", async () => {
    authValue = { email: null, profile: null, logout: vi.fn() };
    render(<AppShell><p>x</p></AppShell>);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/signin"));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- app-shell`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/app/app-shell.tsx`**

```tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@streamflare/ui/components/brand/wordmark";
import { ProfileAvatar } from "@streamflare/ui/components/brand/profile-avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@streamflare/ui/components/ui/dropdown-menu";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

export function AppShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!auth.email) router.push(ROUTES.SIGN_IN);
  }, [auth.email, router]);

  const who = auth.profile ?? auth.email ?? "Guest";

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 md:px-10">
          <Link href={ROUTES.BROWSE} aria-label="StreamFlare home"><Wordmark /></Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Account menu"
              className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ProfileAvatar name={who} size="sm" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <ProfileAvatar name={who} size="sm" />
                <span className="truncate">{who}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push(ROUTES.ACCOUNT_SETTINGS)}>Account</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push(ROUTES.PROFILES)}>Switch profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => { auth.logout(); router.push(ROUTES.SIGN_IN); }}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10 md:px-10">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- app-shell`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/app/app-shell.tsx apps/web/__tests__/app-shell.test.tsx
git commit -m "feat(web): add authenticated AppShell with profile menu

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: PasswordDialog

**Files:**
- Create: `apps/web/components/account/password-dialog.tsx`
- Test: `apps/web/__tests__/password-dialog.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../context/auth-context", () => ({ useAuth: () => ({ email: "a@b.com" }) }));
const patch = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { patch: (...a: unknown[]) => patch(...a) } }));

import { PasswordDialog } from "../components/account/password-dialog";

describe("PasswordDialog", () => {
  beforeEach(() => patch.mockReset());

  it("patches the password payload on valid submit", async () => {
    patch.mockResolvedValue({ status: 201 });
    render(<PasswordDialog />);
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));
    fireEvent.change(await screen.findByLabelText(/current password/i), { target: { value: "old" } });
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "longenough" } });
    fireEvent.change(screen.getByLabelText(/confirm/i), { target: { value: "longenough" } });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith(
      "/api/users/updatepassword",
      { EMAIL: "a@b.com", OLD_PASS: "old", NEW_PASS: "longenough", NEW_PASS_CON: "longenough" },
      { validateStatus: expect.any(Function) },
    ));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- password-dialog`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/account/password-dialog.tsx`**

```tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@streamflare/ui/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@streamflare/ui/components/ui/form";
import { Input } from "@streamflare/ui/components/ui/input";
import { Alert, AlertDescription } from "@streamflare/ui/components/ui/alert";
import { passwordSchema, type PasswordValues } from "../../lib/account-schemas";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";

export function PasswordDialog() {
  const auth = useAuth();
  const [open, setOpen] = React.useState(false);
  const [formError, setFormError] = React.useState("");
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPass: "", newPass: "", newPassCon: "" },
  });

  const onSubmit = async (v: PasswordValues) => {
    if (!auth.email) return setFormError("Not signed in.");
    setFormError("");
    try {
      const { status } = await api.patch(
        "/api/users/updatepassword",
        { EMAIL: auth.email, OLD_PASS: v.oldPass, NEW_PASS: v.newPass, NEW_PASS_CON: v.newPassCon },
        { validateStatus: () => true },
      );
      if (status === 201) { toast.success("Password updated."); setOpen(false); form.reset(); return; }
      if (status === 422) return setFormError("Current password is incorrect.");
      if (status === 423) return setFormError("New passwords don't match.");
      setFormError("Failed to update password.");
    } catch (err) {
      const msg = (err as Error).message ?? "Something went wrong";
      setFormError(msg); toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GlowButton variant="ghost" size="sm">Change password</GlowButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Enter your current password and a new one.</DialogDescription>
        </DialogHeader>
        {formError ? <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert> : null}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="oldPass" render={({ field }) => (
              <FormItem><FormLabel>Current password</FormLabel><FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="newPass" render={({ field }) => (
              <FormItem><FormLabel>New password</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="newPassCon" render={({ field }) => (
              <FormItem><FormLabel>Confirm new password</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <GlowButton type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Updating..." : "Update password"}
            </GlowButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- password-dialog`
Expected: PASS. (Radix `Dialog` renders content to a portal once open; the labelled inputs are then queryable.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/account/password-dialog.tsx apps/web/__tests__/password-dialog.test.tsx
git commit -m "feat(web): add change-password dialog

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: PhoneDialog

**Files:**
- Create: `apps/web/components/account/phone-dialog.tsx`
- Test: `apps/web/__tests__/phone-dialog.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../context/auth-context", () => ({ useAuth: () => ({ email: "a@b.com" }) }));
const patch = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { patch: (...a: unknown[]) => patch(...a) } }));

import { PhoneDialog } from "../components/account/phone-dialog";

describe("PhoneDialog", () => {
  beforeEach(() => patch.mockReset());

  it("patches the phone payload on valid submit", async () => {
    patch.mockResolvedValue({ status: 201 });
    render(<PhoneDialog currentPhone="000" onUpdated={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /update phone/i }));
    fireEvent.change(await screen.findByLabelText(/new phone/i), { target: { value: "5551234" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith(
      "/api/users/updatephone",
      { EMAIL: "a@b.com", Phone: "5551234" },
      { validateStatus: expect.any(Function) },
    ));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- phone-dialog`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/account/phone-dialog.tsx`**

```tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@streamflare/ui/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@streamflare/ui/components/ui/form";
import { Input } from "@streamflare/ui/components/ui/input";
import { Alert, AlertDescription } from "@streamflare/ui/components/ui/alert";
import { phoneSchema, type PhoneValues } from "../../lib/account-schemas";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";

export function PhoneDialog({ currentPhone, onUpdated }: { currentPhone: string | null; onUpdated: (phone: string) => void }) {
  const auth = useAuth();
  const [open, setOpen] = React.useState(false);
  const [formError, setFormError] = React.useState("");
  const form = useForm<PhoneValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: currentPhone ?? "" },
  });

  const onSubmit = async (v: PhoneValues) => {
    if (!auth.email) return setFormError("Not signed in.");
    setFormError("");
    try {
      const { status } = await api.patch(
        "/api/users/updatephone",
        { EMAIL: auth.email, Phone: v.phone },
        { validateStatus: () => true },
      );
      if (status === 201) { toast.success("Phone updated."); onUpdated(v.phone); setOpen(false); return; }
      if (status === 422) return setFormError("Invalid number.");
      setFormError("Failed to update phone.");
    } catch (err) {
      const msg = (err as Error).message ?? "Something went wrong";
      setFormError(msg); toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GlowButton variant="ghost" size="sm">Update phone</GlowButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update phone</DialogTitle>
          <DialogDescription>We&apos;ll use this number for account notifications.</DialogDescription>
        </DialogHeader>
        {formError ? <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert> : null}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>New phone number</FormLabel><FormControl><Input type="tel" autoComplete="tel" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <GlowButton type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save"}
            </GlowButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- phone-dialog`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/account/phone-dialog.tsx apps/web/__tests__/phone-dialog.test.tsx
git commit -m "feat(web): add update-phone dialog

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Rebuild `/account` + remove password/phone routes

**Files:**
- Modify: `apps/web/app/account/page.tsx`
- Delete: `apps/web/app/account/password/page.tsx`, `apps/web/app/account/phone/page.tsx`

- [ ] **Step 1: Replace `apps/web/app/account/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { Separator } from "@streamflare/ui/components/ui/separator";
import { AppShell } from "../../components/app/app-shell";
import { PasswordDialog } from "../../components/account/password-dialog";
import { PhoneDialog } from "../../components/account/phone-dialog";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

function planLabel(bill: number | null): string {
  if (bill === 5) return "Basic — up to 2 profiles";
  if (bill === 8) return "Standard — up to 4 profiles";
  if (bill === 10) return "Premium — up to 6 profiles";
  return "No active plan";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 py-6">
      <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
      {children}
    </section>
  );
}

export default function AccountPage() {
  const auth = useAuth();
  const router = useRouter();
  const [endDate, setEndDate] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.email) return;
    api.get<{ ed: { ED: string } | null }>(`/api/subscription/getenddate/${auth.email}`)
      .then((res) => setEndDate(res.data.ed?.ED ?? null)).catch(() => setEndDate(null));
    api.get<{ phone: { PHONE: string } }>(`/api/users/getphone/${auth.email}`)
      .then((res) => setPhone(res.data.phone?.PHONE ?? null)).catch(() => setPhone(null));
  }, [auth.email]);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight text-text">Account</h1>
        <p className="mt-1 text-text-muted">{auth.email}</p>
        <Separator className="my-2" />

        <Section title="Membership & billing">
          <p className="text-text">{planLabel(auth.bill)}</p>
          {endDate ? <p className="text-sm text-text-muted">Renews {endDate}</p> : null}
          {auth.bill ? <p className="text-sm text-text-muted tabular-nums">${auth.bill}/month</p> : null}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href={ROUTES.UPDATE_SUBSCRIPTION}><GlowButton variant="ghost" size="sm">Change plan</GlowButton></Link>
            <Link href={ROUTES.SUBSCRIPTION_HISTORY}><GlowButton variant="ghost" size="sm">Payment history</GlowButton></Link>
            <Link href={ROUTES.CANCEL_SUBCRIPTION}><GlowButton variant="ghost" size="sm">Cancel membership</GlowButton></Link>
          </div>
        </Section>
        <Separator />

        <Section title="Security">
          {phone ? <p className="text-sm text-text-muted">Phone: {phone}</p> : null}
          <div className="flex flex-wrap gap-2">
            <PasswordDialog />
            <PhoneDialog currentPhone={phone} onUpdated={setPhone} />
          </div>
        </Section>
        <Separator />

        <Section title="Profiles">
          <div className="flex flex-wrap gap-2">
            <Link href={ROUTES.PROFILES}><GlowButton variant="ghost" size="sm">Switch profile</GlowButton></Link>
            <Link href={ROUTES.DELETE_PROFILE}><GlowButton variant="ghost" size="sm">Manage profiles</GlowButton></Link>
          </div>
        </Section>
        <Separator />

        <Section title="Watch history">
          <div className="flex flex-wrap gap-2">
            <Link href={ROUTES.MOVIE_HISTORY}><GlowButton variant="ghost" size="sm">Movies</GlowButton></Link>
            <Link href={ROUTES.SHOW_HISTORY}><GlowButton variant="ghost" size="sm">Shows</GlowButton></Link>
          </div>
        </Section>
        <Separator />

        <div className="py-6">
          <GlowButton variant="ghost" size="sm" onClick={() => { auth.logout(); router.push(ROUTES.SIGN_IN); }}>
            Sign out
          </GlowButton>
        </div>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Delete the standalone routes**

```bash
git rm apps/web/app/account/password/page.tsx apps/web/app/account/phone/page.tsx
```

- [ ] **Step 3: Typecheck + build**

Run: `pnpm --filter @streamflare/web typecheck` then (PowerShell) `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: both succeed; `/account` builds; `/account/password` and `/account/phone` are gone from the route list; no MUI import remains in `/account`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/account/page.tsx
git commit -m "feat(web): rebuild /account with AppShell, sections, and security dialogs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Rebuild `/subscription/update`

**Files:**
- Modify: `apps/web/app/subscription/update/page.tsx`

- [ ] **Step 1: Replace `apps/web/app/subscription/update/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { Alert, AlertDescription } from "@streamflare/ui/components/ui/alert";
import { AppShell } from "../../../components/app/app-shell";
import { PlanPicker } from "../../../components/subscription/plan-picker";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../../context/auth-context";
import * as ROUTES from "../../../constants/routes";

const BILL_TO_TYPE: Record<number, string> = { 5: "Basic", 8: "Standard", 10: "Premium" };
const TYPE_PROFILES: Record<string, number> = { Basic: 2, Standard: 4, Premium: 6 };

export default function UpdateSubscriptionPage() {
  const auth = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [selecting, setSelecting] = useState<string | null>(null);
  const currentType = auth.bill != null ? BILL_TO_TYPE[auth.bill] : undefined;

  async function choose(subType: string) {
    if (!auth.email) { setError("Not signed in"); return; }
    setSelecting(subType);
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    try {
      const { status } = await api.post(
        "/api/subscription/update",
        { EMAIL: auth.email, SUB_TYPE: subType, END_DATE: end.toISOString().slice(0, 10) },
        { validateStatus: () => true },
      );
      if (status === 201) {
        const numProfiles = TYPE_PROFILES[subType] ?? 0;
        const bill = Object.entries(BILL_TO_TYPE).find(([, t]) => t === subType)?.[0];
        if (bill) auth.set_bill(Number(bill));
        auth.set_max_profiles(numProfiles);
        if ((auth.num_profiles ?? 0) > numProfiles) router.push(ROUTES.DELETE_PROFILE);
        else router.push(ROUTES.BROWSE);
      } else if (status === 422) {
        setError("Invalid user info");
      } else {
        setError("Failed to update subscription");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSelecting(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tight text-text">Change your plan</h1>
          <p className="text-text-muted">Upgrade or downgrade anytime.</p>
        </div>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <PlanPicker onSelect={choose} selecting={selecting} currentType={currentType} />
        <Link href={ROUTES.ACCOUNT_SETTINGS} className="inline-block font-mono text-xs uppercase tracking-wide text-text-subtle hover:text-text">
          Back to account
        </Link>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `pnpm --filter @streamflare/web typecheck` → PASS.

```bash
git add apps/web/app/subscription/update/page.tsx
git commit -m "feat(web): rebuild /subscription/update with PlanPicker

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Rebuild `/subscription/cancel`

**Files:**
- Modify: `apps/web/app/subscription/cancel/page.tsx`

- [ ] **Step 1: Replace `apps/web/app/subscription/cancel/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { Alert, AlertDescription } from "@streamflare/ui/components/ui/alert";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@streamflare/ui/components/ui/alert-dialog";
import { AppShell } from "../../../components/app/app-shell";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../../context/auth-context";
import * as ROUTES from "../../../constants/routes";

export default function CancelSubscriptionPage() {
  const auth = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function cancel() {
    if (!auth.email) { setError("Not signed in"); return; }
    setBusy(true);
    try {
      const { status } = await api.patch("/api/subscription/delete", { EMAIL: auth.email }, { validateStatus: () => true });
      if (status === 201) { auth.set_bill(0); router.push(ROUTES.ACCOUNT_SETTINGS); }
      else if (status === 422) setError("Invalid user info");
      else setError("Failed to cancel subscription");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="font-display text-3xl font-bold tracking-tight text-text">Cancel membership</h1>
        <p className="text-text-muted">
          You&apos;ll keep access until the end of your current billing period. You can resubscribe anytime.
        </p>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <GlowButton variant="ghost" disabled={busy}>Cancel membership</GlowButton>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel your membership?</AlertDialogTitle>
              <AlertDialogDescription>This stops your renewal. You keep access until your period ends.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep membership</AlertDialogCancel>
              <AlertDialogAction onClick={cancel} disabled={busy}>Yes, cancel</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `pnpm --filter @streamflare/web typecheck` → PASS.

```bash
git add apps/web/app/subscription/cancel/page.tsx
git commit -m "feat(web): rebuild /subscription/cancel with confirm dialog

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Rebuild `/subscription/history`

**Files:**
- Modify: `apps/web/app/subscription/history/page.tsx`

- [ ] **Step 1: Replace `apps/web/app/subscription/history/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@streamflare/ui/components/brand/empty-state";
import { AppShell } from "../../../components/app/app-shell";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../../context/auth-context";
import * as ROUTES from "../../../constants/routes";

interface SubscriptionRecord { S_DATE: string; T_DATE: string; SUB_TYPE: string; TOTAL_BILL: number }

export default function SubscriptionHistoryPage() {
  const auth = useAuth();
  const [history, setHistory] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.email) return;
    api.get<{ history: SubscriptionRecord[] }>(`/api/subscription/history/${auth.email}`)
      .then((res) => setHistory(res.data.history ?? []))
      .finally(() => setLoading(false));
  }, [auth.email]);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-text">Payment history</h1>
        {loading ? (
          <p className="text-text-muted">Loading...</p>
        ) : history.length === 0 ? (
          <EmptyState title="No history yet" description="Your payments will appear here." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-hairline">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-1 text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Start</th>
                  <th className="px-4 py-3 font-medium">End</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, idx) => (
                  <tr key={idx} className="border-t border-hairline">
                    <td className="px-4 py-3 text-text-muted tabular-nums">{row.S_DATE}</td>
                    <td className="px-4 py-3 text-text-muted tabular-nums">{row.T_DATE}</td>
                    <td className="px-4 py-3 text-text">{row.SUB_TYPE}</td>
                    <td className="px-4 py-3 text-right text-text tabular-nums">${row.TOTAL_BILL}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Link href={ROUTES.ACCOUNT_SETTINGS} className="inline-block font-mono text-xs uppercase tracking-wide text-text-subtle hover:text-text">
          Back to account
        </Link>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `pnpm --filter @streamflare/web typecheck` → PASS.

```bash
git add apps/web/app/subscription/history/page.tsx
git commit -m "feat(web): rebuild /subscription/history as an Aurora table

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Restyle `/subscription/add` with PlanPicker

**Files:**
- Modify: `apps/web/app/subscription/add/page.tsx`

- [ ] **Step 1: Replace `apps/web/app/subscription/add/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@streamflare/ui/components/ui/alert";
import { PlanPicker } from "../../../components/subscription/plan-picker";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../../context/auth-context";
import * as ROUTES from "../../../constants/routes";

export default function AddSubscriptionPage() {
  const auth = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [selecting, setSelecting] = useState<string | null>(null);

  async function choose(subType: string) {
    if (!auth.email) { setError("Not signed in"); return; }
    setSelecting(subType);
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    try {
      const { status } = await api.post(
        "/api/subscription/add",
        { EMAIL: auth.email, SUB_TYPE: subType, END_DATE: end.toISOString().slice(0, 10) },
        { validateStatus: () => true },
      );
      if (status === 201) router.push(ROUTES.BROWSE);
      else setError("Failed to subscribe");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSelecting(null);
    }
  }

  return (
    <main className="min-h-dvh bg-canvas px-6 py-16 md:px-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tight text-text">Choose your plan</h1>
          <p className="text-text-muted">Switch or cancel anytime.</p>
        </div>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <PlanPicker onSelect={choose} selecting={selecting} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Typecheck + build**

Run: `pnpm --filter @streamflare/web typecheck` then (PowerShell) `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: both succeed; all subscription routes build; no MUI imports remain in subscription pages.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/subscription/add/page.tsx
git commit -m "feat(web): restyle /subscription/add with PlanPicker

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Phase 2B green-gate sweep

**Files:** none (verification + fixes)

- [ ] **Step 1: Typecheck both packages**

Run: `pnpm --filter @streamflare/ui typecheck` and `pnpm --filter @streamflare/web typecheck` → PASS.

- [ ] **Step 2: Full web test suite**

Run: `pnpm --filter @streamflare/web test`
Expected: all pass (existing + new: account-schemas, app-shell, password-dialog, phone-dialog).

- [ ] **Step 3: Production build, all routes**

Run (PowerShell): `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: success; `/account`, `/subscription/{add,update,cancel,history}` build; `/account/password` and `/account/phone` removed.

- [ ] **Step 4: Confirm MUI no longer imported by account/subscription pages**

Run: `pnpm dlx rg -n "@mui/material" apps/web/app/account apps/web/app/subscription`
Expected: no matches.

- [ ] **Step 5: No hardcoded hex in new components**

Run: `pnpm dlx rg -n "#[0-9a-fA-F]{3,6}" apps/web/components/app apps/web/components/account`
Expected: no matches.

- [ ] **Step 6: Final commit (if fixes were needed)**

```bash
git add -A
git commit -m "chore: Phase 2B green-gate fixes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage:**
- `AppShell` → Task 2. account-schemas → Task 1. PasswordDialog → Task 3. PhoneDialog → Task 4.
  `/account` sectioned + dialogs + route removal → Task 5. `/subscription/update` (PlanPicker +
  currentType + downgrade routing) → Task 6. `/subscription/cancel` confirm → Task 7.
  `/subscription/history` table → Task 8. `/subscription/add` restyle → Task 9. a11y (Radix
  dropdown/dialog, labels, role=alert, table semantics) across Tasks 2/3/4/8. Sweep → Task 10. ✓
- Contracts: updatepassword `{EMAIL,OLD_PASS,NEW_PASS,NEW_PASS_CON}` (Task 3), updatephone
  `{EMAIL,Phone}` (Task 4), update `{EMAIL,SUB_TYPE,END_DATE}` (Task 6), delete `{EMAIL}` (Task 7),
  history GET (Task 8), add `{EMAIL,SUB_TYPE,END_DATE}` (Task 9), getenddate/getphone (Task 5) —
  all preserved with exact keys (note `Phone` capitalization).

**2. Placeholder scan:** none; every code step is complete; tests have real assertions + mocks.

**3. Type/name consistency:** `passwordSchema`/`PasswordValues`, `phoneSchema`/`PhoneValues`
(Task 1) used in Tasks 3/4; `PhoneDialog` props `currentPhone`/`onUpdated` (Task 4) used in Task 5;
`PlanPicker` props `onSelect`/`selecting`/`currentType` (2A) used in Tasks 6/9; `AppShell` wraps
Tasks 5/6/7/8; `BILL_TO_TYPE`/`TYPE_PROFILES` maps consistent in Task 6; route constants
(`ACCOUNT_SETTINGS`, `UPDATE_SUBSCRIPTION`, `CANCEL_SUBCRIPTION`, `SUBSCRIPTION_HISTORY`,
`DELETE_PROFILE`, `PROFILES`, `BROWSE`) used as defined.

**Known interim state:** `/browse`, watch, and the movie/show history pages remain pre-redesign
until Phase 3+; `AppShell` gains a browse nav slot then. `UPDATE_PHONE`/`UPDATE_PASSWORD` route
constants become unused but are left in `routes.ts` (harmless).
