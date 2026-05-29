"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Wordmark } from "@streamflare/ui/components/brand/wordmark";
import { ProfileAvatar } from "@streamflare/ui/components/brand/profile-avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@streamflare/ui/components/ui/dropdown-menu";
import { CommandPalette } from "../search/command-palette";
import { useAuth } from "../../context/auth-context";
import { isAdmin } from "../../lib/admin-data";
import * as ROUTES from "../../constants/routes";

export function AppShell({ children, nav }: { children: React.ReactNode; nav?: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();

  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    if (!auth.email) router.push(ROUTES.SIGN_IN);
  }, [auth.email, router]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const who = auth.profile ?? auth.email ?? "Guest";

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3 md:px-10">
          <Link href={ROUTES.BROWSE} aria-label="StreamFlare home"><Wordmark /></Link>
          {nav ? <div className="hidden flex-1 justify-center md:flex">{nav}</div> : null}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="grid size-9 place-items-center rounded-full text-text-muted hover:bg-surface-3 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Search className="size-5" />
            </button>
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
              {isAdmin(auth.email) ? (
                <DropdownMenuItem onSelect={() => router.push(ROUTES.ADMIN)}>Admin</DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={() => router.push(ROUTES.ACCOUNT_SETTINGS)}>Account</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push(ROUTES.PROFILES)}>Switch profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => { auth.logout(); router.push(ROUTES.SIGN_IN); }}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10 md:px-10">{children}</main>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
