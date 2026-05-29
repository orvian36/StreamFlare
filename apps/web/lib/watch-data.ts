import { api } from "./api-client";
import type { SlideItem } from "./browse-data";

export const SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export interface ProgressRef {
  type: "movie" | "show";
  id: number;
  season?: number;
  episode?: number;
  email: string;
  profile: string;
}

function query(ref: ProgressRef): string {
  const p = new URLSearchParams({ profile_id: ref.profile, email: ref.email });
  if (ref.type === "movie") p.set("movie_id", String(ref.id));
  else {
    p.set("show_id", String(ref.id));
    p.set("season_no", String(ref.season ?? 1));
    p.set("episode_no", String(ref.episode ?? 1));
  }
  return p.toString();
}

export async function getProgress(ref: ProgressRef): Promise<number> {
  try {
    const r = await api.get<{ WATCHED_UPTO?: number }>(`/api/profiles/time/get?${query(ref)}`, { validateStatus: () => true });
    return r.data?.WATCHED_UPTO ?? 0;
  } catch {
    return 0;
  }
}

export async function saveProgress(ref: ProgressRef & { seconds: number }): Promise<void> {
  const body: Record<string, unknown> = { profile_id: ref.profile, email: ref.email, watched_upto: Math.floor(ref.seconds) };
  if (ref.type === "movie") body.movie_id = ref.id;
  else { body.show_id = ref.id; body.season_no = ref.season ?? 1; body.episode_no = ref.episode ?? 1; }
  await api.post("/api/profiles/time/set", body, { validateStatus: () => true });
}

export function nextEpisode(
  seasons: SlideItem[],
  season: number,
  episode: number,
): { season: number; episode: number } | null {
  const flat = seasons
    .flatMap((s) => s.data)
    .filter((e) => e.SEASON_NO != null && e.EPISODE_NO != null)
    .sort((a, b) => (a.SEASON_NO! - b.SEASON_NO!) || (a.EPISODE_NO! - b.EPISODE_NO!));
  const idx = flat.findIndex((e) => e.SEASON_NO === season && e.EPISODE_NO === episode);
  const nxt = idx >= 0 ? flat[idx + 1] : undefined;
  return nxt ? { season: nxt.SEASON_NO!, episode: nxt.EPISODE_NO! } : null;
}
