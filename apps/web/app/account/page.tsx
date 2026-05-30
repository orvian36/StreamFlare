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
            <Link href={ROUTES.HISTORY}><GlowButton variant="ghost" size="sm">View history</GlowButton></Link>
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
