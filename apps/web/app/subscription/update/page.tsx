"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@streamflare/ui/components/ui/alert";
import { AppShell } from "../../../components/app/app-shell";
import { PlanPicker } from "../../../components/subscription/plan-picker";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../../context/auth-context";
import * as ROUTES from "../../../constants/routes";

const BILL_TO_TYPE: Record<number, string> = { 5: "Basic", 8: "Standard", 10: "Premium" };
const TYPE_PROFILES: Record<string, number> = { Basic: 2, Standard: 4, Premium: 6 };
const TYPE_BILL: Record<string, number> = { Basic: 5, Standard: 8, Premium: 10 };

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
        if (TYPE_BILL[subType]) auth.set_bill(TYPE_BILL[subType]);
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
