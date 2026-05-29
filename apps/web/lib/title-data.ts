import { api } from "./api-client";
import type { BrowseItem, SlideItem } from "./browse-data";

export type TitleType = "movie" | "show";

export interface TitleDetailData {
  id: number;
  type: TitleType;
  title: string;
  description: string | null;
  rating: number | null;
  yearLabel: string | null;
  maturity: string | null;
  metaExtra: string | null; // runtime (movie) or "N seasons" (show)
  imageUrl: string | null;
  videoUrl: string | null;
}

const idParam = (type: TitleType, id: number) => (type === "movie" ? `movie_id=${id}` : `show_id=${id}`);

export async function fetchMovie(id: number): Promise<TitleDetailData> {
  const r = await api.get<Record<string, unknown>>(`/api/browse/movie/${id}`);
  const d = r.data;
  return {
    id, type: "movie",
    title: String(d.TITLE ?? ""),
    description: (d.DESCRIPTION as string) ?? null,
    rating: (d.RATING as number) ?? null,
    yearLabel: d.RELEASE_DATE != null ? String(d.RELEASE_DATE) : null,
    maturity: (d.MATURITY_RATING as string) ?? null,
    metaExtra: d.LENGTH ? `${Math.round(Number(d.LENGTH))} min` : null,
    imageUrl: (d.IMAGE_URL as string) ?? null,
    videoUrl: (d.VIDEO_URL as string) ?? null,
  };
}

export async function fetchShow(id: number): Promise<TitleDetailData> {
  const r = await api.get<Record<string, unknown>>(`/api/browse/show/${id}`);
  const d = r.data;
  const start = d.START_YEAR != null ? String(d.START_YEAR) : null;
  const end = d.END_YEAR != null ? String(d.END_YEAR) : null;
  return {
    id, type: "show",
    title: String(d.TITLE ?? ""),
    description: (d.DESCRIPTION as string) ?? null,
    rating: (d.RATING as number) ?? null,
    yearLabel: start ? (end ? `${start} - ${end}` : start) : null,
    maturity: (d.MATURITY_RATING as string) ?? null,
    metaExtra: d.SEASONS ? `${d.SEASONS} season${Number(d.SEASONS) === 1 ? "" : "s"}` : null,
    imageUrl: (d.IMAGE_URL as string) ?? null,
    videoUrl: (d.VIDEO_URL as string) ?? null,
  };
}

export const fetchTitle = (type: TitleType, id: number) => (type === "movie" ? fetchMovie(id) : fetchShow(id));

export async function fetchCast(type: TitleType, id: number): Promise<{ TITLE: string; NAME: string | null }[]> {
  const r = await api.get<{ TITLE: string; NAME: string | null }[]>(`/api/browse/celeb?${idParam(type, id)}`);
  return r.data ?? [];
}

export async function fetchGenres(type: TitleType, id: number): Promise<{ NAME: string | null }[]> {
  const r = await api.get<{ NAME: string | null }[]>(`/api/browse/genre?${idParam(type, id)}`);
  return r.data ?? [];
}

export async function fetchSimilar(type: TitleType, id: number): Promise<BrowseItem[]> {
  const r = await api.get<BrowseItem[]>(`/api/browse/similar?${idParam(type, id)}`);
  return r.data ?? [];
}

export async function fetchEpisodes(showId: number, email: string, profileId: string): Promise<SlideItem[]> {
  const r = await api.get<SlideItem[]>(
    `/api/browse/show/episodes?show_id=${showId}&email=${encodeURIComponent(email)}&profile_id=${encodeURIComponent(profileId)}`,
  );
  return r.data ?? [];
}

export async function getRating(type: TitleType, id: number, email: string, profileId: string): Promise<number | null> {
  const body: Record<string, unknown> = { EMAIL: email, PROFILE_ID: profileId };
  body[type === "movie" ? "MOVIE_ID" : "SHOW_ID"] = id;
  const r = await api.post<{ RATING?: number; rating?: { RATING?: number } }>("/api/profiles/rating/find", body, {
    validateStatus: () => true,
  });
  const data = r.data;
  return data?.RATING ?? data?.rating?.RATING ?? null;
}

export async function setRating(type: TitleType, id: number, email: string, profileId: string, rating: number) {
  const body: Record<string, unknown> = { EMAIL: email, PROFILE_ID: profileId, RATING: rating };
  body[type === "movie" ? "MOVIE_ID" : "SHOW_ID"] = id;
  await api.post("/api/profiles/rating/add", body);
}
