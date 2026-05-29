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
