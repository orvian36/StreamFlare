"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@streamflare/ui/components/ui/tabs";
import { AppShell } from "../../components/app/app-shell";
import { HistoryList } from "../../components/history/history-list";
import {
  fetchMovieHistory, fetchShowHistory, toMovieEntries, toShowEntries, type HistoryEntry,
} from "../../lib/history-data";
import { useAuth } from "../../context/auth-context";
import * as ROUTES from "../../constants/routes";

export default function HistoryPage() {
  const auth = useAuth();
  const router = useRouter();
  const [movies, setMovies] = React.useState<HistoryEntry[]>([]);
  const [shows, setShows] = React.useState<HistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!auth.email) { router.push(ROUTES.SIGN_IN); return; }
    let cancelled = false;
    Promise.all([fetchMovieHistory(auth.email), fetchShowHistory(auth.email)])
      .then(([m, s]) => { if (!cancelled) { setMovies(toMovieEntries(m)); setShows(toShowEntries(s)); } })
      .catch(() => { if (!cancelled) { setMovies([]); setShows([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [auth.email, router]);

  if (!auth.email) return null;

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text">Watch history</h1>
          <p className="mt-1 text-text-muted">Everything watched across your profiles.</p>
        </header>

        <Tabs defaultValue="movies">
          <TabsList>
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="shows">Shows</TabsTrigger>
          </TabsList>
          <TabsContent value="movies" className="mt-6">
            {loading ? <p className="text-text-muted">Loading history…</p>
              : <HistoryList items={movies} emptyLabel="No movie history yet" />}
          </TabsContent>
          <TabsContent value="shows" className="mt-6">
            {loading ? <p className="text-text-muted">Loading history…</p>
              : <HistoryList items={shows} emptyLabel="No show history yet" />}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
