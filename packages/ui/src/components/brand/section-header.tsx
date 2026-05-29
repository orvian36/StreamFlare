import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  index?: string;
  title: string;
  action?: React.ReactNode;
}

export function SectionHeader({ index, title, action, className, ...props }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4 px-1", className)} {...props}>
      <div className="flex items-baseline gap-3">
        {index ? (
          <span className="font-mono text-xs tabular-nums text-text-subtle">{index}</span>
        ) : null}
        <h2 className="font-display text-xl font-semibold tracking-tight text-text md:text-2xl">
          {title}
        </h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
