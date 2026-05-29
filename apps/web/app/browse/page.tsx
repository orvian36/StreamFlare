"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ContentRow } from "@streamflare/ui/components/brand/content-row";
import { EmptyState } from "@streamflare/ui/components/brand/empty-state";
import { AppShell } from "../../components/app/app-shell";
import { BrowseNav, type BrowseView } from "../../components/browse/browse-nav";
import { BrowseHero } from "../../components/browse/browse-hero";
import { BrowseCard } from "../../components/browse/browse-card";
import {
  fetchNewAndPopular, fetchSuggestions, fetchContinue, fetchByGenre, fetchWatchList,
  type SlideItem, type BrowseItem,
} from "../../lib/browse-data";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

function pickHero(rows: SlideItem[]): BrowseItem | null {
  for (const r of rows) {
    const withImg = r.data.find((d) => d.IMAGE_URL);
    if (withImg) return withImg;
  }
  return null;
}

export default function BrowsePage() {
  const auth = useAuth();
  const router = useRouter();
  const [view, setView] = React.useState<BrowseView>("home");
  const [rows, setRows] = React.useState<SlideItem[]>([]);
  const [hero, setHero] = React.useState<BrowseItem | null>(null);
  const [loading, setLoading] = React.useState(true);

  const email = auth.email;
  const profile = auth.profile;

  React.useEffect(() => {
    if (!email) { router.push(ROUTES.SIGN_IN); return; }
    if (!profile) { router.push(ROUTES.PROFILES); return; }
  }, [email, profile, router]);

  React.useEffect(() => {
    if (!email || !profile) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      let next: SlideItem[] = [];
      try {
        if (view === "home") {
          const [cont, sugg, np] = await Promise.all([
            fetchContinue(email, profile), fetchSuggestions(email, profile), fetchNewAndPopular(email),
          ]);
          next = [...cont, ...sugg, ...np.slice(0, 4)];
        } else if (view === "movies") {
          next = await fetchByGenre("movies");
        } else if (view === "shows") {
          next = await fetchByGenre("shows");
        } else if (view === "mylist") {
          next = await fetchWatchList(email, profile);
        } else {
          next = await fetchNewAndPopular(email);
        }
      } catch (err) {
        console.error(err);
      }
      if (!cancelled) {
        setRows(next.filter((r) => r.data && r.data.length > 0));
        if (view === "home") setHero(pickHero(next));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [view, email, profile]);

  const nav = <BrowseNav view={view} onChange={setView} />;

  if (!email || !profile) return null;

  return (
    <AppShell nav={nav}>
      <div className="space-y-10">
        {view === "home" && hero ? <BrowseHero item={hero} /> : null}
        <div className="mb-3 md:hidden"><BrowseNav view={view} onChange={setView} /></div>
        {loading ? (
          <div className="space-y-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-5 w-40 animate-pulse rounded bg-surface-2" />
                <div className="flex gap-3">
                  {[0, 1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-60 w-40 shrink-0 animate-pulse rounded-lg bg-surface-2" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description={view === "mylist" ? "Add titles to your list to see them here." : "Check back soon."}
          />
        ) : (
          rows.map((row, i) => (
            <ContentRow key={`${view}-${row.title}-${i}`} index={String(i + 1).padStart(2, "0")} title={row.title.trim()}>
              {row.data.map((item) => (
                <BrowseCard
                  key={`${item.MOVIE_ID ?? item.SHOW_ID}-${item.TITLE}`}
                  item={item}
                  email={email}
                  profileId={profile}
                  inList={view === "mylist"}
                />
              ))}
            </ContentRow>
          ))
        )}
      </div>
    </AppShell>
  );
}
