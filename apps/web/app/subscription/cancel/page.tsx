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
