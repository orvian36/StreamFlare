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
