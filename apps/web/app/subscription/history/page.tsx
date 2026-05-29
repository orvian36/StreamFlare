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
