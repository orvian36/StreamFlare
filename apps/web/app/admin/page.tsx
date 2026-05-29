"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@streamflare/ui/components/brand/empty-state";
import { AppShell } from "../../components/app/app-shell";
import { StatCard } from "../../components/admin/stat-card";
import { TopTitles } from "../../components/admin/top-titles";
import { AnalyticsCharts } from "../../components/admin/analytics-charts";
import { fetchOverview, isAdmin, type Overview } from "../../lib/admin-data";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

export default function AdminPage() {
  const auth = useAuth();
  const router = useRouter();
  const [data, setData] = React.useState<Overview | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!auth.email) {
      router.push(ROUTES.SIGN_IN);
      return;
    }
    if (!isAdmin(auth.email)) {
      router.push(ROUTES.BROWSE);
      return;
    }
    let cancelled = false;
    fetchOverview()
      .then((o) => { if (!cancelled) setData(o); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [auth.email, router]);

  if (!auth.email || !isAdmin(auth.email)) return null;

  const fmtMoney = (n: number) => `$${n.toLocaleString()}`;

  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text">Admin · Analytics</h1>
          <p className="mt-1 text-text-muted">A read-only snapshot of the catalog and subscriptions.</p>
        </header>

        {loading ? (
          <p className="text-text-muted">Loading…</p>
        ) : !data ? (
          <EmptyState title="No analytics yet" description="Data will appear once the catalog has activity." />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Users" value={data.totals.users.toLocaleString()} />
              <StatCard label="Profiles" value={data.totals.profiles.toLocaleString()} />
              <StatCard label="Titles" value={(data.totals.movies + data.totals.shows).toLocaleString()} />
              <StatCard label="Subscriptions" value={data.totals.subscriptions.toLocaleString()} />
              <StatCard label="Revenue" value={fmtMoney(data.revenue)} />
            </div>

            <AnalyticsCharts overview={data} />

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-text">Top titles</h2>
              <TopTitles items={data.trending} />
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
