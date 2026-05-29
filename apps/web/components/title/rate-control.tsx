"use client";

import { Star } from "lucide-react";
import { cn } from "@streamflare/ui/lib/utils";

export function RateControl({ value, onRate }: { value: number | null; onRate: (n: number) => void }) {
  return (
    <div role="group" aria-label="Rate this title" className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} of 5`}
          aria-pressed={value != null && n <= value}
          onClick={() => onRate(n)}
          className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star className={cn("size-5", value != null && n <= value ? "fill-warning text-warning" : "text-text-subtle")} />
        </button>
      ))}
    </div>
  );
}
