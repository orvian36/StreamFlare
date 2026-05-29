import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

export function Wordmark({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "font-display text-lg font-bold tracking-tight text-text select-none",
        className,
      )}
      {...props}
    >
      STREAM<span className="text-brand">FLARE</span>
    </span>
  );
}
