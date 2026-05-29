import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

/** Glass surface, use ONLY over imagery or as a transient overlay, never on flat bg. */
export function GlassPanel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/8 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]",
        className,
      )}
      {...props}
    />
  );
}
