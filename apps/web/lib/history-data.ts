import { api } from "./api-client";

export interface MovieHistoryRow {
  TITLE: string;
  PID: string;
  RATING: number | null;
  WATCHED_UPTO: string | null;
  TIME: string | null;
}

export interface ShowHistoryRow extends MovieHistoryRow {
  SEASON_NO: number | null;
  EPISODE_NO: number | null;
}

export interface HistoryEntry {
  title: string;
  profile: string;
  rating: number | null;
  watchedUpto: string | null;
  time: string | null;
  episode?: string | null;
}

export async function fetchMovieHistory(email: string): Promise<MovieHistoryRow[]> {
  const r = await api.get<{ history?: MovieHistoryRow[] }>(`/api/users/getmoviehistory/${email}`);
  return r.data.history ?? [];
}

export async function fetchShowHistory(email: string): Promise<ShowHistoryRow[]> {
  const r = await api.get<{ history?: ShowHistoryRow[] }>(`/api/users/getshowhistory/${email}`);
  return r.data.history ?? [];
}

export function toMovieEntries(rows: MovieHistoryRow[]): HistoryEntry[] {
  return rows.map((r) => ({
    title: r.TITLE,
    profile: r.PID,
    rating: r.RATING,
    watchedUpto: r.WATCHED_UPTO,
    time: r.TIME,
  }));
}

export function toShowEntries(rows: ShowHistoryRow[]): HistoryEntry[] {
  return rows.map((r) => ({
    title: r.TITLE,
    profile: r.PID,
    rating: r.RATING,
    watchedUpto: r.WATCHED_UPTO,
    time: r.TIME,
    episode: r.SEASON_NO != null && r.EPISODE_NO != null ? `S${r.SEASON_NO} E${r.EPISODE_NO}` : null,
  }));
}
