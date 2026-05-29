# StreamFlare Premium Redesign — Phase 2A (Profiles & Onboarding) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the profile gate, profile create/manage, and a new guided onboarding stepper in Aurora Noir, with a reusable `ProfileAvatar` primitive and `PlanPicker`, preserving all API contracts.

**Architecture:** New `ProfileAvatar` primitive in `packages/ui`. App composition in `apps/web/components/{profiles,subscription,onboarding}/*`, built from Phase 0 primitives (imported via `@streamflare/ui/...` subpaths) + shadcn (Form, Input, AlertDialog, Button). Forms use react-hook-form + zod. New `/onboarding` route stitches `PlanPicker` + a profile step. No backend changes.

**Tech Stack:** Next.js 14 App Router, Tailwind v4 + shadcn, Framer Motion, react-hook-form + zod, Vitest + Testing Library.

**Reference spec:** `docs/superpowers/specs/2026-05-29-streamflare-premium-redesign-phase-2a-design.md`.

---

## Conventions

- Worktree root: `C:\Users\Best Laptop Gallery\Desktop\CodeDev\StreamFlare\.claude\worktrees\premium-redesign`.
- Build: PowerShell `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`.
- Tests: `pnpm --filter @streamflare/web test -- <pattern>`.
- Typecheck: `pnpm --filter @streamflare/{ui,web} typecheck`.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Server components import `@streamflare/ui` primitives via subpaths (the barrel pulls the legacy client `Player` and breaks RSC). Client components may do the same for bundle hygiene.

## File Structure

**Create:**
- `packages/ui/src/components/brand/profile-avatar.tsx` — gradient+initial avatar (exported from barrel).
- `apps/web/lib/profile-schemas.ts` — zod profile schema.
- `apps/web/components/profiles/gate-header.tsx` — minimal wordmark + sign-out header.
- `apps/web/components/profiles/profile-create-form.tsx` — rhf+zod create form (reused by onboarding).
- `apps/web/components/profiles/manage-profiles.tsx` — delete list + AlertDialog confirm.
- `apps/web/components/subscription/plan-picker.tsx` — plan cards from the API.
- `apps/web/components/onboarding/onboarding-stepper.tsx` — two-step stepper.
- `apps/web/app/onboarding/page.tsx` — onboarding route.
- Tests under `apps/web/__tests__/`.

**Modify:**
- `packages/ui/src/index.ts` — export `ProfileAvatar`.
- `apps/web/constants/routes.ts` — add `ONBOARDING`.
- `apps/web/app/profiles/page.tsx` — redesigned gate.
- `apps/web/app/profiles/create/page.tsx` — use `ProfileCreateForm`.
- `apps/web/app/profiles/delete/page.tsx` — use `ManageProfiles`.
- `apps/web/components/auth/sign-up-form.tsx`, `sign-in-form.tsx` — repoint to `/onboarding`.

---

## Task 1: `ProfileAvatar` primitive

**Files:**
- Create: `packages/ui/src/components/brand/profile-avatar.tsx`
- Modify: `packages/ui/src/index.ts`
- Test: `apps/web/__tests__/profile-avatar.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ProfileAvatar } from "@streamflare/ui/components/brand/profile-avatar";

describe("ProfileAvatar", () => {
  it("shows the uppercase first initial", () => {
    const { getByText } = render(<ProfileAvatar name="ada" />);
    expect(getByText("A")).toBeInTheDocument();
  });
  it("is deterministic per name and differs across names", () => {
    const grad = (name: string) =>
      (render(<ProfileAvatar name={name} />).container.firstChild as HTMLElement).style.backgroundImage;
    expect(grad("Ada")).toBe(grad("Ada"));
    expect(grad("Ada")).not.toBe(grad("Bob"));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- profile-avatar`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `packages/ui/src/components/brand/profile-avatar.tsx`**

```tsx
import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

const SIZES = {
  sm: "size-10 text-base",
  md: "size-16 text-2xl",
  lg: "size-24 text-4xl",
} as const;

function hashHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export interface ProfileAvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: keyof typeof SIZES;
  selected?: boolean;
}

export function ProfileAvatar({ name, size = "md", selected, className, ...props }: ProfileAvatarProps) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  const hue = hashHue(name);
  // Two stops kept within the Aurora indigo->cyan family (hue ~200-310).
  const from = `oklch(0.55 0.16 ${(hue % 80) + 230})`;
  const to = `oklch(0.72 0.13 ${(hue % 60) + 200})`;
  return (
    <span
      className={cn(
        "grid select-none place-items-center rounded-xl font-display font-bold text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] transition-transform",
        SIZES[size],
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        className,
      )}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden
      {...props}
    >
      {initial}
    </span>
  );
}
```

- [ ] **Step 4: Export from `packages/ui/src/index.ts`** (append in the Phase 0 block)

```ts
export { ProfileAvatar } from "./components/brand/profile-avatar";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- profile-avatar`
Expected: PASS.

- [ ] **Step 6: Typecheck + commit**

Run: `pnpm --filter @streamflare/ui typecheck` → PASS.

```bash
git add packages/ui/src/components/brand/profile-avatar.tsx packages/ui/src/index.ts apps/web/__tests__/profile-avatar.test.tsx
git commit -m "feat(ui): add ProfileAvatar (gradient + initial) primitive

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Profile zod schema + ONBOARDING route

**Files:**
- Create: `apps/web/lib/profile-schemas.ts`
- Modify: `apps/web/constants/routes.ts`
- Test: `apps/web/__tests__/profile-schemas.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { profileSchema } from "../lib/profile-schemas";

describe("profileSchema", () => {
  it("requires name and dob", () => {
    expect(profileSchema.safeParse({ name: "", dob: "" }).success).toBe(false);
    expect(profileSchema.safeParse({ name: "Ada", dob: "1990-01-01" }).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- profile-schemas`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/lib/profile-schemas.ts`**

```ts
import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(20, "Keep it under 20 characters"),
  dob: z.string().min(1, "Date of birth is required"),
});
export type ProfileValues = z.infer<typeof profileSchema>;
```

- [ ] **Step 4: Add the onboarding route to `apps/web/constants/routes.ts`** (append)

```ts
export const ONBOARDING = "/onboarding";
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- profile-schemas`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/profile-schemas.ts apps/web/constants/routes.ts apps/web/__tests__/profile-schemas.test.ts
git commit -m "feat(web): add profile zod schema and ONBOARDING route

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: ProfileCreateForm (reusable)

**Files:**
- Create: `apps/web/components/profiles/profile-create-form.tsx`
- Test: `apps/web/__tests__/profile-create-form.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../context/auth-context", () => ({
  useAuth: () => ({ email: "a@b.com", set_num_profiles: vi.fn() }),
}));
const post = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { post: (...a: unknown[]) => post(...a) } }));

import { ProfileCreateForm } from "../components/profiles/profile-create-form";

describe("ProfileCreateForm", () => {
  beforeEach(() => post.mockReset());

  it("rejects empty fields", async () => {
    const onSuccess = vi.fn();
    const { container } = render(<ProfileCreateForm onSuccess={onSuccess} />);
    fireEvent.submit(container.querySelector("form")!);
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("posts the profile payload and calls onSuccess", async () => {
    post.mockResolvedValue({ status: 201 });
    const onSuccess = vi.fn();
    const { container } = render(<ProfileCreateForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: "1990-01-01" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(post).toHaveBeenCalledWith(
      "/api/profiles/add",
      { EMAIL: "a@b.com", PROFILE_ID: "Ada", DOB: "1990-01-01" },
      { validateStatus: expect.any(Function) },
    ));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- profile-create-form`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/profiles/profile-create-form.tsx`**

```tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { ProfileAvatar } from "@streamflare/ui/components/brand/profile-avatar";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@streamflare/ui/components/ui/form";
import { Input } from "@streamflare/ui/components/ui/input";
import { Alert, AlertDescription } from "@streamflare/ui/components/ui/alert";
import { profileSchema, type ProfileValues } from "../../lib/profile-schemas";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";

export function ProfileCreateForm({ onSuccess }: { onSuccess: (name: string) => void }) {
  const auth = useAuth();
  const [formError, setFormError] = React.useState("");
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", dob: "" },
  });
  const name = form.watch("name");

  const onSubmit = async (v: ProfileValues) => {
    if (!auth.email) return setFormError("Not signed in.");
    setFormError("");
    try {
      const { status } = await api.post(
        "/api/profiles/add",
        { EMAIL: auth.email, PROFILE_ID: v.name, DOB: v.dob },
        { validateStatus: () => true },
      );
      if (status === 201) return onSuccess(v.name);
      if (status === 400) return setFormError("Invalid profile info.");
      if (status === 423) return setFormError("A profile with that name already exists.");
      setFormError("Failed to create profile.");
    } catch (err) {
      const msg = (err as Error).message ?? "Something went wrong";
      setFormError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <ProfileAvatar name={name || "?"} size="lg" />
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Add a profile</h1>
          <p className="text-sm text-text-muted">Who is this profile for?</p>
        </div>
      </div>
      {formError ? (
        <Alert variant="destructive" data-testid="error"><AlertDescription>{formError}</AlertDescription></Alert>
      ) : null}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="dob" render={({ field }) => (
            <FormItem><FormLabel>Date of birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <GlowButton type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Add profile"}
          </GlowButton>
        </form>
      </Form>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- profile-create-form`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/profiles/profile-create-form.tsx apps/web/__tests__/profile-create-form.test.tsx
git commit -m "feat(web): add reusable ProfileCreateForm (rhf+zod)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Rebuild `/profiles/create`

**Files:**
- Modify: `apps/web/app/profiles/create/page.tsx`

- [ ] **Step 1: Replace `apps/web/app/profiles/create/page.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { GlassPanel } from "@streamflare/ui/components/brand/glass-panel";
import { ProfileCreateForm } from "../../../components/profiles/profile-create-form";
import * as ROUTES from "../../../constants/routes";

export default function CreateProfilePage() {
  const router = useRouter();
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md">
        <GlassPanel className="p-8">
          <ProfileCreateForm onSuccess={() => router.push(ROUTES.BROWSE)} />
        </GlassPanel>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Typecheck + build**

Run: `pnpm --filter @streamflare/web typecheck` then (PowerShell) `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: both succeed; `/profiles/create` prerenders; no MUI import remains in this file.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/profiles/create/page.tsx
git commit -m "feat(web): rebuild /profiles/create with ProfileCreateForm

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Rebuild `/profiles` gate

**Files:**
- Create: `apps/web/components/profiles/gate-header.tsx`
- Modify: `apps/web/app/profiles/page.tsx`
- Test: `apps/web/__tests__/profiles-gate.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const setProfile = vi.fn();
const setPtbd = vi.fn();
vi.mock("../context/auth-context", () => ({
  useAuth: () => ({
    email: "a@b.com", max_profiles: 4,
    set_profile: setProfile, set_ptbd: setPtbd, set_num_profiles: vi.fn(), logout: vi.fn(),
  }),
}));
const get = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a) } }));

import ProfilesPage from "../app/profiles/page";

describe("profiles gate", () => {
  beforeEach(() => { push.mockClear(); setProfile.mockClear(); setPtbd.mockClear(); get.mockReset(); });

  it("lists profiles and selects one into /browse", async () => {
    get.mockResolvedValue({ data: { profile: [{ PROFILE_ID: "Ada", DOB: null }, { PROFILE_ID: "Bo", DOB: null }] } });
    render(<ProfilesPage />);
    const tile = await screen.findByRole("button", { name: /ada/i });
    fireEvent.click(tile);
    await waitFor(() => expect(setProfile).toHaveBeenCalledWith("Ada"));
    expect(push).toHaveBeenCalledWith("/browse");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- profiles-gate`
Expected: FAIL — current gate uses the legacy `Profiles` component / different markup.

- [ ] **Step 3: Create `apps/web/components/profiles/gate-header.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@streamflare/ui/components/brand/wordmark";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

export function GateHeader() {
  const auth = useAuth();
  const router = useRouter();
  return (
    <header className="flex items-center justify-between px-6 py-5 md:px-12">
      <Link href={ROUTES.HOME} aria-label="StreamFlare home"><Wordmark /></Link>
      <GlowButton
        variant="ghost"
        size="sm"
        onClick={() => { auth.logout(); router.push(ROUTES.SIGN_IN); }}
      >
        Sign out
      </GlowButton>
    </header>
  );
}
```

- [ ] **Step 4: Replace `apps/web/app/profiles/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { ProfileAvatar } from "@streamflare/ui/components/brand/profile-avatar";
import { Stagger, StaggerItem } from "@streamflare/ui/motion";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";
import { GateHeader } from "../../components/profiles/gate-header";
import * as ROUTES from "../../constants/routes";

interface Profile { PROFILE_ID: string; DOB: string | null }

export default function ProfilesPage() {
  const auth = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.email) { router.push(ROUTES.SIGN_IN); return; }
    api
      .get<{ profile: Profile[] }>(`/api/profiles/${auth.email}`)
      .then((res) => {
        const list = res.data.profile ?? [];
        setProfiles(list);
        auth.set_num_profiles(list.length);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [auth.email, router]);

  function select(profileId: string, index: number) {
    auth.set_ptbd(index);
    auth.set_profile(profileId);
    router.push(ROUTES.BROWSE);
  }

  const canAdd = profiles.length < (auth.max_profiles ?? 0);

  return (
    <main className="flex min-h-dvh flex-col bg-canvas">
      <GateHeader />
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
        <h1 className="mb-10 font-display text-3xl font-bold tracking-tight text-text md:text-5xl">
          Who&apos;s watching?
        </h1>
        {loading ? (
          <div className="flex gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="size-24 animate-pulse rounded-xl bg-surface-2" />
            ))}
          </div>
        ) : (
          <Stagger className="flex flex-wrap items-start justify-center gap-6 md:gap-8">
            {profiles.map((p, index) => (
              <StaggerItem key={p.PROFILE_ID}>
                <button
                  type="button"
                  onClick={() => select(p.PROFILE_ID, index)}
                  className="group flex flex-col items-center gap-3"
                >
                  <ProfileAvatar name={p.PROFILE_ID} size="lg" className="transition-transform group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-ring" />
                  <span className="text-sm text-text-muted group-hover:text-text">{p.PROFILE_ID}</span>
                </button>
              </StaggerItem>
            ))}
            {canAdd ? (
              <StaggerItem>
                <Link href={ROUTES.CREATE_PROFILE} className="group flex flex-col items-center gap-3">
                  <span className="grid size-24 place-items-center rounded-xl border-2 border-dashed border-hairline text-text-subtle transition-colors group-hover:border-brand group-hover:text-text">
                    <Plus className="size-8" />
                  </span>
                  <span className="text-sm text-text-muted group-hover:text-text">Add profile</span>
                </Link>
              </StaggerItem>
            ) : null}
          </Stagger>
        )}
        <Link href={ROUTES.DELETE_PROFILE} className="mt-12 font-mono text-xs uppercase tracking-wide text-text-subtle hover:text-text">
          Manage profiles
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- profiles-gate`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/profiles/gate-header.tsx apps/web/app/profiles/page.tsx apps/web/__tests__/profiles-gate.test.tsx
git commit -m "feat(web): rebuild /profiles gate with ProfileAvatar grid

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: ManageProfiles + rebuild `/profiles/delete`

**Files:**
- Create: `apps/web/components/profiles/manage-profiles.tsx`
- Modify: `apps/web/app/profiles/delete/page.tsx`
- Test: `apps/web/__tests__/manage-profiles.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../context/auth-context", () => ({
  useAuth: () => ({ email: "a@b.com", set_num_profiles: vi.fn() }),
}));
const get = vi.fn();
const del = vi.fn();
vi.mock("../lib/api-client", () => ({
  api: { get: (...a: unknown[]) => get(...a), delete: (...a: unknown[]) => del(...a) },
}));

import { ManageProfiles } from "../components/profiles/manage-profiles";

describe("ManageProfiles", () => {
  beforeEach(() => { get.mockReset(); del.mockReset(); });

  it("deletes a profile after confirming", async () => {
    get.mockResolvedValue({ data: { profile: [{ PROFILE_ID: "Ada" }] } });
    del.mockResolvedValue({ status: 200 });
    render(<ManageProfiles />);
    fireEvent.click(await screen.findByRole("button", { name: /remove ada/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^remove$/i }));
    await waitFor(() => expect(del).toHaveBeenCalledWith(
      "/api/profiles/delete",
      { data: { EMAIL: "a@b.com", PROFILE_ID: "Ada" }, validateStatus: expect.any(Function) },
    ));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- manage-profiles`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/profiles/manage-profiles.tsx`**

```tsx
"use client";

import * as React from "react";
import { ProfileAvatar } from "@streamflare/ui/components/brand/profile-avatar";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { EmptyState } from "@streamflare/ui/components/brand/empty-state";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@streamflare/ui/components/ui/alert-dialog";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";

interface Profile { PROFILE_ID: string }

export function ManageProfiles() {
  const auth = useAuth();
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [target, setTarget] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    if (!auth.email) return;
    api
      .get<{ profile: Profile[] }>(`/api/profiles/${auth.email}`)
      .then((res) => setProfiles(res.data.profile ?? []))
      .finally(() => setLoading(false));
  }, [auth.email]);

  React.useEffect(() => { load(); }, [load]);

  async function confirmDelete() {
    if (!auth.email || !target) return;
    setBusy(true);
    try {
      await api.delete("/api/profiles/delete", {
        data: { EMAIL: auth.email, PROFILE_ID: target },
        validateStatus: () => true,
      });
      setTarget(null);
      setProfiles((prev) => {
        const next = prev.filter((p) => p.PROFILE_ID !== target);
        auth.set_num_profiles(next.length);
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-text">Manage profiles</h1>
      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : profiles.length === 0 ? (
        <EmptyState title="No profiles yet" description="Create a profile to start watching." />
      ) : (
        <ul className="space-y-3">
          {profiles.map((p) => (
            <li key={p.PROFILE_ID} className="flex items-center justify-between rounded-lg border border-hairline bg-surface-1 p-3">
              <div className="flex items-center gap-3">
                <ProfileAvatar name={p.PROFILE_ID} size="sm" />
                <span className="text-text">{p.PROFILE_ID}</span>
              </div>
              <GlowButton variant="ghost" size="sm" aria-label={`Remove ${p.PROFILE_ID}`} onClick={() => setTarget(p.PROFILE_ID)}>
                Remove
              </GlowButton>
            </li>
          ))}
        </ul>
      )}
      <AlertDialog open={target !== null} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {target}?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={busy}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

- [ ] **Step 4: Replace `apps/web/app/profiles/delete/page.tsx`**

```tsx
"use client";

import Link from "next/link";
import { GlassPanel } from "@streamflare/ui/components/brand/glass-panel";
import { ManageProfiles } from "../../../components/profiles/manage-profiles";
import * as ROUTES from "../../../constants/routes";

export default function DeleteProfilePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md space-y-6">
        <GlassPanel className="p-8"><ManageProfiles /></GlassPanel>
        <Link href={ROUTES.PROFILES} className="block text-center font-mono text-xs uppercase tracking-wide text-text-subtle hover:text-text">
          Back to profiles
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- manage-profiles`
Expected: PASS. (Radix AlertDialog renders its content to a portal; the confirm button query finds it.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/profiles/manage-profiles.tsx apps/web/app/profiles/delete/page.tsx apps/web/__tests__/manage-profiles.test.tsx
git commit -m "feat(web): rebuild /profiles/delete as manage-profiles with confirm dialog

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: PlanPicker

**Files:**
- Create: `apps/web/components/subscription/plan-picker.tsx`
- Test: `apps/web/__tests__/plan-picker.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const get = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a) } }));

import { PlanPicker } from "../components/subscription/plan-picker";

describe("PlanPicker", () => {
  beforeEach(() => get.mockReset());

  it("renders plans and fires onSelect with the plan type", async () => {
    get.mockResolvedValue({ data: { plans: [
      { SUB_TYPE: "Basic", BILL: 5, NUM_PROFILES: 2 },
      { SUB_TYPE: "Premium", BILL: 10, NUM_PROFILES: 6 },
    ] } });
    const onSelect = vi.fn();
    render(<PlanPicker onSelect={onSelect} />);
    fireEvent.click(await screen.findByRole("button", { name: /choose basic/i }));
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith("Basic"));
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- plan-picker`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/subscription/plan-picker.tsx`**

```tsx
"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@streamflare/ui/lib/utils";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { EmptyState } from "@streamflare/ui/components/brand/empty-state";
import { api } from "../../lib/api-client";

interface Plan { SUB_TYPE: string; BILL: number; NUM_PROFILES: number }

export interface PlanPickerProps {
  onSelect: (subType: string) => void;
  selecting?: string | null;
  currentType?: string;
}

export function PlanPicker({ onSelect, selecting, currentType }: PlanPickerProps) {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get<{ plans: Plan[] }>("/api/subscription/plans")
      .then((r) => setPlans(r.data.plans ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && plans.length === 0) {
    return <EmptyState title="No plans available" description="Please try again later." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {(loading ? [] : plans).map((p, i) => {
        const featured = i === 1;
        const isCurrent = currentType === p.SUB_TYPE;
        return (
          <div
            key={p.SUB_TYPE}
            className={cn(
              "flex flex-col gap-4 rounded-xl border bg-surface-1 p-6",
              featured ? "border-brand shadow-[0_0_32px_-12px_var(--sf-accent)]" : "border-hairline",
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-bold text-text">{p.SUB_TYPE}</h3>
                {featured ? <span className="rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[11px] uppercase text-brand">Popular</span> : null}
              </div>
              <p className="text-text-muted"><span className="text-2xl font-bold text-text tabular-nums">${p.BILL}</span>/month</p>
            </div>
            <p className="flex items-center gap-2 text-sm text-text-muted">
              <Check className="size-4 text-brand" /> Up to {p.NUM_PROFILES} profiles
            </p>
            <GlowButton
              variant={featured ? "primary" : "ghost"}
              className="mt-auto w-full"
              aria-label={`Choose ${p.SUB_TYPE}`}
              disabled={selecting === p.SUB_TYPE || isCurrent}
              onClick={() => onSelect(p.SUB_TYPE)}
            >
              {isCurrent ? "Current plan" : selecting === p.SUB_TYPE ? "Selecting..." : "Choose " + p.SUB_TYPE}
            </GlowButton>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- plan-picker`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/subscription/plan-picker.tsx apps/web/__tests__/plan-picker.test.tsx
git commit -m "feat(web): add reusable PlanPicker

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: OnboardingStepper + `/onboarding` route

**Files:**
- Create: `apps/web/components/onboarding/onboarding-stepper.tsx`
- Create: `apps/web/app/onboarding/page.tsx`
- Test: `apps/web/__tests__/onboarding.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../context/auth-context", () => ({
  useAuth: () => ({ email: "a@b.com", set_num_profiles: vi.fn() }),
}));
const get = vi.fn();
const post = vi.fn();
vi.mock("../lib/api-client", () => ({
  api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) },
}));

import { OnboardingStepper } from "../components/onboarding/onboarding-stepper";

describe("OnboardingStepper", () => {
  beforeEach(() => { push.mockClear(); get.mockReset(); post.mockReset(); });

  it("adds a plan then advances to the profile step", async () => {
    get.mockImplementation((url: string) => {
      if (url.includes("/api/subscription/plans")) {
        return Promise.resolve({ data: { plans: [{ SUB_TYPE: "Basic", BILL: 5, NUM_PROFILES: 2 }] } });
      }
      return Promise.resolve({ data: { profile: [] } }); // no existing profiles
    });
    post.mockResolvedValue({ status: 201 });
    render(<OnboardingStepper />);
    fireEvent.click(await screen.findByRole("button", { name: /choose basic/i }));
    await waitFor(() => expect(post).toHaveBeenCalledWith(
      "/api/subscription/add", expect.objectContaining({ EMAIL: "a@b.com", SUB_TYPE: "Basic" }), expect.any(Object),
    ));
    expect(await screen.findByText(/add a profile/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @streamflare/web test -- onboarding`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `apps/web/components/onboarding/onboarding-stepper.tsx`**

```tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@streamflare/ui/lib/utils";
import { FadeIn } from "@streamflare/ui/motion";
import { PlanPicker } from "../subscription/plan-picker";
import { ProfileCreateForm } from "../profiles/profile-create-form";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

type Step = "plan" | "profile";

export function OnboardingStepper() {
  const auth = useAuth();
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("plan");
  const [selecting, setSelecting] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!auth.email) router.push(ROUTES.SIGN_IN);
  }, [auth.email, router]);

  async function choosePlan(subType: string) {
    if (!auth.email) return;
    setSelecting(subType);
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    try {
      const { status } = await api.post(
        "/api/subscription/add",
        { EMAIL: auth.email, SUB_TYPE: subType, END_DATE: end.toISOString().slice(0, 10) },
        { validateStatus: () => true },
      );
      if (status !== 201) { toast.error("Could not start your subscription."); return; }
      const res = await api.get<{ profile: { PROFILE_ID: string }[] }>(`/api/profiles/${auth.email}`);
      if ((res.data.profile ?? []).length > 0) router.push(ROUTES.BROWSE);
      else setStep("profile");
    } catch (err) {
      toast.error((err as Error).message ?? "Something went wrong");
    } finally {
      setSelecting(null);
    }
  }

  const stepIndex = step === "plan" ? 1 : 2;

  return (
    <main className="min-h-dvh bg-canvas px-6 py-16 md:px-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-wide text-text-subtle" aria-current="step">
            Step {stepIndex} of 2
          </p>
          <div className="flex gap-2">
            {[1, 2].map((n) => (
              <span key={n} className={cn("h-1 flex-1 rounded-full", n <= stepIndex ? "bg-brand" : "bg-surface-3")} />
            ))}
          </div>
        </div>
        {step === "plan" ? (
          <FadeIn className="space-y-6">
            <div className="space-y-1">
              <h1 className="font-display text-3xl font-bold tracking-tight text-text">Choose your plan</h1>
              <p className="text-text-muted">Switch or cancel anytime.</p>
            </div>
            <PlanPicker onSelect={choosePlan} selecting={selecting} />
          </FadeIn>
        ) : (
          <FadeIn className="mx-auto max-w-md">
            <ProfileCreateForm onSuccess={() => router.push(ROUTES.BROWSE)} />
          </FadeIn>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Create `apps/web/app/onboarding/page.tsx`**

```tsx
import { OnboardingStepper } from "../../components/onboarding/onboarding-stepper";

export default function OnboardingPage() {
  return <OnboardingStepper />;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @streamflare/web test -- onboarding`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/onboarding/onboarding-stepper.tsx apps/web/app/onboarding/page.tsx apps/web/__tests__/onboarding.test.tsx
git commit -m "feat(web): add guided onboarding stepper (/onboarding)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Repoint auth routing into onboarding

**Files:**
- Modify: `apps/web/components/auth/sign-up-form.tsx`
- Modify: `apps/web/components/auth/sign-in-form.tsx`
- Modify: `apps/web/__tests__/sign-in-form.test.tsx`

- [ ] **Step 1: Update `sign-up-form.tsx` success route**

Change the success navigation from `router.push("/subscription/add")` to `router.push("/onboarding")` (the line after `auth.login(v.email, data.token);`).

- [ ] **Step 2: Update `sign-in-form.tsx` no-subscription branch**

In the `else` branch (no `sub_id`), change `router.push("/subscription/add")` to `router.push("/onboarding")`.

- [ ] **Step 3: Update the sign-in test expectation**

In `apps/web/__tests__/sign-in-form.test.tsx`, change the assertion
`expect(push).toHaveBeenCalledWith("/subscription/add")` to
`expect(push).toHaveBeenCalledWith("/onboarding")`.

- [ ] **Step 4: Run the auth tests**

Run: `pnpm --filter @streamflare/web test -- sign-in-form sign-up-form`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/auth/sign-up-form.tsx apps/web/components/auth/sign-in-form.tsx apps/web/__tests__/sign-in-form.test.tsx
git commit -m "feat(web): route new users into /onboarding after auth

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Phase 2A green-gate sweep

**Files:** none (verification + fixes)

- [ ] **Step 1: Typecheck both packages**

Run: `pnpm --filter @streamflare/ui typecheck` and `pnpm --filter @streamflare/web typecheck` → PASS.

- [ ] **Step 2: Full web test suite**

Run: `pnpm --filter @streamflare/web test`
Expected: all pass (Phase 0/1 + new: profile-avatar, profile-schemas, profile-create-form, profiles-gate, manage-profiles, plan-picker, onboarding).

- [ ] **Step 3: Production build, all routes**

Run (PowerShell): `$env:NEXT_DISABLE_STANDALONE=1; pnpm --filter @streamflare/web build`
Expected: success; `/profiles`, `/profiles/create`, `/profiles/delete`, `/onboarding` (+ all others) build. `/onboarding` may be dynamic.

- [ ] **Step 4: No hardcoded hex in new components**

Run: `pnpm dlx rg -n "#[0-9a-fA-F]{3,6}" apps/web/components/profiles apps/web/components/subscription apps/web/components/onboarding packages/ui/src/components/brand/profile-avatar.tsx`
Expected: no matches (token/keyword only; `rgba(0,0,0,...)` shadows are acceptable).

- [ ] **Step 5: Final commit (if fixes were needed)**

```bash
git add -A
git commit -m "chore: Phase 2A green-gate fixes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage:**
- `ProfileAvatar` → Task 1. Profile zod + ONBOARDING route → Task 2. ProfileCreateForm → Task 3. `/profiles/create` → Task 4. `/profiles` gate → Task 5. `/profiles/delete` manage + AlertDialog → Task 6. `PlanPicker` → Task 7. `/onboarding` stepper (plan→profile, state detection) → Task 8. Routing repoint → Task 9. a11y (button avatars, dialog focus, aria-current, role=alert) across Tasks 5/6/8. Tests + sweep → Task 10. ✓
- Contracts: create `{EMAIL,PROFILE_ID,DOB}` (Task 3), delete `{EMAIL,PROFILE_ID}` (Task 6), plans GET (Task 7), sub add `{EMAIL,SUB_TYPE,END_DATE}` (Task 8), list GET (Tasks 5/6/8) — all preserved.

**2. Placeholder scan:** none; every code step is complete; tests have real assertions + mocks.

**3. Type/name consistency:** `profileSchema`/`ProfileValues` (Task 2) used in Tasks 3/8; `ProfileCreateForm` prop `onSuccess(name)` consistent in Tasks 3/4/8; `PlanPicker` props `onSelect`/`selecting`/`currentType` (Task 7) used in Task 8; `ProfileAvatar` props `name`/`size`/`selected` (Task 1) used in Tasks 3/5/6; routes `ONBOARDING` (Task 2) used in Tasks 8/9; api payload key `PROFILE_ID` consistent. Avatar/button accessible names (`Remove <name>`, profile name) match test queries.

**Known interim state:** `/subscription/add` standalone + `/account*` remain MUI until 2B; `/browse` inline gate until Phase 3; the full `AppShell` is built in 2B.
