"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ContentRow } from "@streamflare/ui/components/brand/content-row";
import { EmptyState } from "@streamflare/ui/components/brand/empty-state";
import { AppShell } from "../../components/app/app-shell";
import { SearchFilters, type SearchFiltersValue, type SearchType } from "../../components/search/search-filters";
import { BrowseCard } from "../../components/browse/browse-card";
import { filteredSearch } from "../../lib/search-data";
import type { SlideItem } from "../../lib/browse-data";
import { useAuth } from "../../context/auth-context";

function SearchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();

  const value: SearchFiltersValue = {
    query: params.get("q") ?? "",
    type: (params.get("type") as SearchType) || "all",
    genre: params.get("genre") ?? "",
    year: params.get("year") ?? "",
  };
  const [sections, setSections] = React.useState<SlideItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  function update(next: SearchFiltersValue) {
    const sp = new URLSearchParams();
    if (next.query) sp.set("q", next.query);
    sp.set("type", next.type);
    if (next.genre) sp.set("genre", next.genre);
    if (next.year) sp.set("year", next.year);
    router.replace(`/search?${sp.toString()}`);
  }

  const key = `${value.query}|${value.type}|${value.genre}|${value.year}`;
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const r = await filteredSearch(value);
      if (!cancelled) { setSections(r.filter((s) => s.data.length > 0)); setLoading(false); }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const email = auth.email ?? "";
  const profile = auth.profile ?? "";

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold tracking-tight text-text">Search</h1>
      <SearchFilters value={value} onChange={update} />
      {loading ? (
        <p className="text-text-muted">Searching...</p>
      ) : sections.length === 0 ? (
        <EmptyState title="No results" description="Try a different query or filters." />
      ) : (
        sections.map((section, i) => (
          <ContentRow key={`${section.title}-${i}`} title={section.title.replace("Search Result from ", "")}>
            {section.data.map((item) => (
              <BrowseCard key={`${item.MOVIE_ID ?? item.SHOW_ID}-${item.TITLE}`} item={item} email={email} profileId={profile} />
            ))}
          </ContentRow>
        ))
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <SearchInner />
      </Suspense>
    </AppShell>
  );
}
