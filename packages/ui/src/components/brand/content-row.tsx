"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@streamflare/ui/lib/utils";
import { SectionHeader } from "@streamflare/ui/components/brand/section-header";

export interface ContentRowProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  index?: string;
}

export function ContentRow({ title, index, className, children, ...props }: ContentRowProps) {
  const scroller = React.useRef<HTMLDivElement>(null);
  const nudge = (dir: 1 | -1) =>
    scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className={cn("space-y-3", className)} {...props}>
      <SectionHeader
        index={index}
        title={title}
        action={
          <div className="hidden gap-1 md:flex">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => nudge(-1)}
              className="grid size-8 place-items-center rounded-md border border-hairline text-text-muted hover:bg-surface-3"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => nudge(1)}
              className="grid size-8 place-items-center rounded-md border border-hairline text-text-muted hover:bg-surface-3"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        }
      />
      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {React.Children.map(children, (child) => (
          <div className="snap-start">{child}</div>
        ))}
      </div>
    </section>
  );
}
