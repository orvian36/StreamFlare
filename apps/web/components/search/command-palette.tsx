"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@streamflare/ui/components/ui/command";
import { staticSearch } from "../../lib/search-data";
import { itemId, itemType, posterUrl, type BrowseItem, type SlideItem } from "../../lib/browse-data";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [sections, setSections] = React.useState<SlideItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (query.trim().length < 2) { setSections([]); return; }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await staticSearch(query.trim());
        if (!cancelled) setSections(r);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  function go(item: BrowseItem) {
    onOpenChange(false);
    router.push(`/title/${itemType(item)}/${itemId(item) ?? ""}`);
  }

  function viewAll() {
    onOpenChange(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search films and series..." value={query} onValueChange={setQuery} />
      <CommandList>
        {loading ? <div className="px-3 py-2 text-sm text-text-muted">Searching...</div> : null}
        {!loading && query.trim().length >= 2 ? <CommandEmpty>No results found.</CommandEmpty> : null}
        {sections.map((section) =>
          section.data.length > 0 ? (
            <CommandGroup key={section.title} heading={section.title.replace("Search Result from ", "")}>
              {section.data.slice(0, 6).map((item) => (
                <CommandItem
                  key={`${item.MOVIE_ID ?? item.SHOW_ID}-${item.TITLE}`}
                  value={`${item.TITLE}-${item.MOVIE_ID ?? item.SHOW_ID}`}
                  onSelect={() => go(item)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={posterUrl(item.IMAGE_URL)} alt="" className="mr-2 h-10 w-7 rounded object-cover" />
                  <span className="truncate">{item.TITLE}</span>
                  {item.RELEASE_DATE ? <span className="ml-auto font-mono text-xs text-text-subtle">{item.RELEASE_DATE}</span> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null,
        )}
        {query.trim().length >= 2 ? (
          <CommandGroup>
            <CommandItem value="__all__" onSelect={viewAll}>Search all results for &quot;{query.trim()}&quot;</CommandItem>
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
