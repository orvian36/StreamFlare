"use client";

import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";
import { HoverScale } from "@streamflare/ui/motion";

export interface PosterCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  imageUrl: string;
  subtitle?: string;
}

export function PosterCard({ title, imageUrl, subtitle, className, ...props }: PosterCardProps) {
  return (
    <HoverScale className={cn("w-40 shrink-0 cursor-pointer md:w-48", className)}>
      <div
        className="group relative overflow-hidden rounded-lg border border-hairline bg-surface-2"
        {...props}
      >
        <div className="aspect-[2/3] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <p className="line-clamp-1 font-medium text-text">{title}</p>
          {subtitle ? <p className="line-clamp-1 text-xs text-text-muted">{subtitle}</p> : null}
        </div>
      </div>
    </HoverScale>
  );
}
