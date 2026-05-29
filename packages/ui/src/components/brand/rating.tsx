import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@streamflare/ui/lib/utils";

export function Rating({
  value,
  className,
  ...props
}: { value: number | null | undefined } & React.HTMLAttributes<HTMLSpanElement>) {
  const display = typeof value === "number" ? value.toFixed(1) : "N/A";
  return (
    <span
      className={cn("inline-flex items-center gap-1 font-mono text-xs text-text-muted", className)}
      {...props}
    >
      <Star className="size-3.5 fill-warning text-warning" aria-hidden />
      <span className="tabular-nums">{display}</span>
    </span>
  );
}
