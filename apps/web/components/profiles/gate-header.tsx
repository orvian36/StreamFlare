"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@streamflare/ui/components/brand/wordmark";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

export function GateHeader() {
  const auth = useAuth();
  const router = useRouter();
  return (
    <header className="flex items-center justify-between px-6 py-5 md:px-12">
      <Link href={ROUTES.HOME} aria-label="StreamFlare home"><Wordmark /></Link>
      <GlowButton
        variant="ghost"
        size="sm"
        onClick={() => { auth.logout(); router.push(ROUTES.SIGN_IN); }}
      >
        Sign out
      </GlowButton>
    </header>
  );
}
