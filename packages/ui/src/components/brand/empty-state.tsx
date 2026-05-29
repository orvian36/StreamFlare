import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-hairline px-6 py-16 text-center",
        className,
      )}
      {...props}
    >
      {icon ? <div className="text-text-subtle">{icon}</div> : null}
      <h3 className="font-display text-lg font-semibold text-text">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
