import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

export interface HeroBackdropProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
}

/** Full-bleed cinematic backdrop with layered scrims so foreground text stays legible. */
export function HeroBackdrop({ imageUrl, className, children, ...props }: HeroBackdropProps) {
  return (
    <div className={cn("relative isolate overflow-hidden sf-grain", className)} {...props}>
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-canvas via-canvas/70 to-transparent"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-canvas via-transparent to-transparent"
        aria-hidden
      />
      {children}
    </div>
  );
}
