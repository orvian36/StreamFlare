"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@streamflare/ui/components/brand/wordmark";
import { ProfileAvatar } from "@streamflare/ui/components/brand/profile-avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@streamflare/ui/components/ui/dropdown-menu";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

export function AppShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!auth.email) router.push(ROUTES.SIGN_IN);
  }, [auth.email, router]);

  const who = auth.profile ?? auth.email ?? "Guest";

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 md:px-10">
          <Link href={ROUTES.BROWSE} aria-label="StreamFlare home"><Wordmark /></Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Account menu"
              className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ProfileAvatar name={who} size="sm" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <ProfileAvatar name={who} size="sm" />
                <span className="truncate">{who}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push(ROUTES.ACCOUNT_SETTINGS)}>Account</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push(ROUTES.PROFILES)}>Switch profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => { auth.logout(); router.push(ROUTES.SIGN_IN); }}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10 md:px-10">{children}</main>
    </div>
  );
}
