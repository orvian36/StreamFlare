"use client";

import { cn } from "@streamflare/ui/lib/utils";

export type BrowseView = "home" | "movies" | "shows" | "mylist" | "new";

const TABS: { id: BrowseView; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "movies", label: "Movies" },
  { id: "shows", label: "Shows" },
  { id: "mylist", label: "My List" },
  { id: "new", label: "New & Popular" },
];

export function BrowseNav({ view, onChange }: { view: BrowseView; onChange: (v: BrowseView) => void }) {
  return (
    <nav className="flex items-center gap-1">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          aria-current={view === t.id ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            view === t.id ? "text-text" : "text-text-muted hover:text-text",
          )}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
