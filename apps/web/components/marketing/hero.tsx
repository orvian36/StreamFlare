"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HeroBackdrop } from "@streamflare/ui/components/brand/hero-backdrop";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { FadeIn } from "@streamflare/ui/motion";
import { Input } from "@streamflare/ui/components/ui/input";

export function Hero() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/signup?email=${encodeURIComponent(email)}`);
  };

  return (
    <HeroBackdrop imageUrl="/images/misc/home-bg.jpg" className="min-h-[88vh]">
      <div className="mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-6 pt-24 md:px-12">
        <FadeIn className="max-w-2xl space-y-6">
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-text md:text-7xl">
            Unlimited films, series, and more.
          </h1>
          <p className="text-lg text-text-muted md:text-xl">Watch anywhere. Cancel anytime.</p>
          <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 flex-1 bg-surface-1/70 backdrop-blur"
              aria-label="Email address"
            />
            <GlowButton type="submit" size="lg">Get started</GlowButton>
          </form>
          <p className="font-mono text-xs text-text-subtle">
            Ready to watch? Enter your email to create or restart your membership.
          </p>
        </FadeIn>
      </div>
    </HeroBackdrop>
  );
}
