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
                {featured ? (
                  <span className="rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[11px] uppercase text-brand">Popular</span>
                ) : null}
              </div>
              <p className="text-text-muted">
                <span className="text-2xl font-bold text-text tabular-nums">${p.BILL}</span>/month
              </p>
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
