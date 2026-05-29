"use client";

import { cn } from "@streamflare/ui/lib/utils";
import { Input } from "@streamflare/ui/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@streamflare/ui/components/ui/select";
import { SEARCH_GENRES } from "../../lib/search-data";

export type SearchType = "all" | "movie" | "show";

export interface SearchFiltersValue { query: string; type: SearchType; genre: string; year: string }

const TYPES: { id: SearchType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "movie", label: "Movies" },
  { id: "show", label: "Shows" },
];

export function SearchFilters({ value, onChange }: { value: SearchFiltersValue; onChange: (v: SearchFiltersValue) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search films and series..."
        value={value.query}
        onChange={(e) => onChange({ ...value, query: e.target.value })}
        className="h-10 w-full max-w-sm"
        aria-label="Search query"
      />
      <div className="flex gap-1">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange({ ...value, type: t.id })}
            aria-current={value.type === t.id ? "true" : undefined}
            className={cn("rounded-md px-3 py-1.5 text-sm", value.type === t.id ? "bg-surface-3 text-text" : "text-text-muted hover:text-text")}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Select value={value.genre || "any"} onValueChange={(g) => onChange({ ...value, genre: g === "any" ? "" : g })}>
        <SelectTrigger className="w-40" aria-label="Genre"><SelectValue placeholder="Any genre" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any genre</SelectItem>
          {SEARCH_GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input
        placeholder="Year"
        inputMode="numeric"
        value={value.year}
        onChange={(e) => onChange({ ...value, year: e.target.value })}
        className="h-10 w-24"
        aria-label="Year"
      />
    </div>
  );
}
