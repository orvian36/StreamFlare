"use client";

import * as React from "react";
import Link from "next/link";
import { Wordmark, GlowButton } from "@streamflare/ui";
import { cn } from "@streamflare/ui/lib/utils";

export function TopBar() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        scrolled
          ? "border-b border-hairline bg-canvas/80 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-12">
        <Link href="/" aria-label="StreamFlare home">
          <Wordmark />
        </Link>
        <Link href="/signin">
          <GlowButton variant="ghost" size="sm">Sign in</GlowButton>
        </Link>
      </div>
    </header>
  );
}
