import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

export function GenreChip({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-surface-3 px-3 py-1 text-xs text-text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
