import * as React from "react";
import Link from "next/link";
import { HeroBackdrop } from "@streamflare/ui/components/brand/hero-backdrop";
import { GlassPanel } from "@streamflare/ui/components/brand/glass-panel";
import { Wordmark } from "@streamflare/ui/components/brand/wordmark";
import { FadeIn } from "@streamflare/ui/motion";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <HeroBackdrop imageUrl="/images/misc/joker1.jpg" className="min-h-dvh">
      <div className="absolute left-6 top-6 z-10 md:left-12 md:top-8">
        <Link href="/" aria-label="StreamFlare home">
          <Wordmark />
        </Link>
      </div>
      <div className="flex min-h-dvh items-center justify-center px-6 py-24">
        <FadeIn className="w-full max-w-md">
          <GlassPanel className="p-8">{children}</GlassPanel>
        </FadeIn>
      </div>
    </HeroBackdrop>
  );
}
