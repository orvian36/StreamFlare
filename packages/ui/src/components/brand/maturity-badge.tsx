import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

export function MaturityBadge({
  rating,
  className,
  ...props
}: { rating: string | null | undefined } & React.HTMLAttributes<HTMLSpanElement>) {
  if (!rating) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-hairline px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-text-muted",
        className,
      )}
      {...props}
    >
      {rating}
    </span>
  );
}
