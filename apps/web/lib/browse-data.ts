import { api } from "./api-client";

export interface BrowseItem {
  MOVIE_ID?: number;
  SHOW_ID?: number;
  TITLE: string;
  IMAGE_URL: string | null;
  RATING?: number | null;
  RELEASE_DATE?: string | number | null;
  DESCRIPTION?: string | null;
  SEASON_NO?: number;
  EPISODE_NO?: number;
  NAME?: string; // genre name on by-genre rows
}

export interface SlideItem {
  title: string;
  data: BrowseItem[];
}

export const posterUrl = (path: string | null | undefined): string =>
  path ? `https://image.tmdb.org/t/p/w780${path}` : "/images/misc/joker1.jpg";

export const itemId = (it: BrowseItem): number | undefined => it.MOVIE_ID ?? it.SHOW_ID;

export const itemType = (it: BrowseItem): "movie" | "show" => (it.MOVIE_ID != null ? "movie" : "show");

export function groupByGenre(items: BrowseItem[]): SlideItem[] {
  const map = new Map<string, BrowseItem[]>();
  for (const it of items) {
    const name = it.NAME ?? "All";
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(it);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export async function fetchProfiles(email: string) {
  const res = await api.get<{ profile: { PROFILE_ID: string; DOB: string | null }[] }>(`/api/profiles/${email}`);
  return res.data.profile ?? [];
}

export async function fetchNewAndPopular(email: string): Promise<SlideItem[]> {
  const res = await api.get<SlideItem[]>(`/api/browse/new?email=${encodeURIComponent(email)}`);
  return res.data ?? [];
}

export async function fetchSuggestions(email: string, profileId: string): Promise<SlideItem[]> {
  const res = await api.get<SlideItem[]>(
    `/api/browse/suggestions?email=${encodeURIComponent(email)}&profile_id=${encodeURIComponent(profileId)}`,
  );
  return res.data ?? [];
}

export async function fetchContinue(email: string, profileId: string): Promise<SlideItem[]> {
  const q = `profile_id=${encodeURIComponent(profileId)}&email=${encodeURIComponent(email)}`;
  const [mv, sh] = await Promise.all([
    api.get<SlideItem>(`/api/profiles/movie/continue?${q}`).then((r) => r.data).catch(() => null),
    api.get<SlideItem>(`/api/profiles/show/continue?${q}`).then((r) => r.data).catch(() => null),
  ]);
  return [mv, sh].filter((s): s is SlideItem => !!s && Array.isArray(s.data) && s.data.length > 0);
}

export async function fetchByGenre(type: "movies" | "shows"): Promise<SlideItem[]> {
  const res = await api.get<{ movies?: BrowseItem[]; shows?: BrowseItem[] }>(`/api/browse/${type}/all`);
  const items = (type === "movies" ? res.data.movies : res.data.shows) ?? [];
  return groupByGenre(items);
}

export async function fetchWatchList(email: string, profileId: string): Promise<SlideItem[]> {
  const res = await api.post<{ arr: SlideItem[] }>("/api/profiles/watchlist/get", { EMAIL: email, PROFILE_ID: profileId });
  return res.data.arr ?? [];
}

export async function addToWatchList(email: string, profileId: string, item: BrowseItem) {
  const body: Record<string, unknown> = { EMAIL: email, PROFILE_ID: profileId };
  if (item.MOVIE_ID != null) body.MOVIE_ID = item.MOVIE_ID;
  else if (item.SHOW_ID != null) body.SHOW_ID = item.SHOW_ID;
  await api.post("/api/profiles/watchlist/add", body);
}

export async function removeFromWatchList(email: string, profileId: string, item: BrowseItem) {
  const body: Record<string, unknown> = { EMAIL: email, PROFILE_ID: profileId };
  if (item.MOVIE_ID != null) body.MOVIE_ID = item.MOVIE_ID;
  else if (item.SHOW_ID != null) body.SHOW_ID = item.SHOW_ID;
  await api.delete("/api/profiles/watchlist/delete", { data: body });
}
