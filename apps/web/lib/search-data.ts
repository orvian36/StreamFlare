import { api } from "./api-client";
import type { SlideItem } from "./browse-data";

export const SEARCH_GENRES = [
  "Action", "Children", "Comedy", "Documentary", "Drama", "Romance", "Suspense", "Thriller",
];

export async function staticSearch(query: string): Promise<SlideItem[]> {
  const r = await api.post<SlideItem[]>("/api/browse/search", { ss: "static", key: [query] });
  return r.data ?? [];
}

export interface FilterOpts {
  query?: string;
  type: "all" | "movie" | "show";
  genre?: string;
  year?: string;
}

export async function filteredSearch(opts: FilterOpts): Promise<SlideItem[]> {
  const key: (string | number)[] = [];
  if (opts.query) key.push("title", opts.query);
  if (opts.genre) key.push("genre", opts.genre);
  if (opts.year) key.push("year", opts.year);
  if (key.length === 0) return [];
  const r = await api.post<SlideItem[]>("/api/browse/search", { ss: opts.type, key });
  return r.data ?? [];
}
