import { describe, it, expect, vi, beforeEach } from "vitest";
const get = vi.fn();
const post = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) } }));
import { getProgress, saveProgress, nextEpisode, LOCAL_VIDEO } from "../lib/watch-data";

describe("watch-data", () => {
  beforeEach(() => { get.mockReset(); post.mockReset(); });

  it("getProgress reads WATCHED_UPTO for a movie", async () => {
    get.mockResolvedValue({ data: { WATCHED_UPTO: 42 } });
    const s = await getProgress({ type: "movie", id: 7, email: "a@b.com", profile: "Ada" });
    expect(get).toHaveBeenCalledWith("/api/profiles/time/get?profile_id=Ada&email=a%40b.com&movie_id=7", { validateStatus: expect.any(Function) });
    expect(s).toBe(42);
  });

  it("saveProgress posts a show body", async () => {
    post.mockResolvedValue({ status: 201 });
    await saveProgress({ type: "show", id: 9, season: 1, episode: 2, email: "a@b.com", profile: "Ada", seconds: 100 });
    expect(post).toHaveBeenCalledWith("/api/profiles/time/set", {
      show_id: 9, season_no: 1, episode_no: 2, profile_id: "Ada", email: "a@b.com", watched_upto: 100,
    }, { validateStatus: expect.any(Function) });
  });

  it("nextEpisode returns the following episode", () => {
    const seasons = [
      { title: "Season 1", data: [
        { TITLE: "E1", IMAGE_URL: null, SEASON_NO: 1, EPISODE_NO: 1 },
        { TITLE: "E2", IMAGE_URL: null, SEASON_NO: 1, EPISODE_NO: 2 },
      ] },
    ];
    expect(nextEpisode(seasons, 1, 1)).toEqual({ season: 1, episode: 2 });
    expect(nextEpisode(seasons, 1, 2)).toBeNull();
  });

  it("exposes the bundled local video path", () => {
    expect(LOCAL_VIDEO).toBe("/videos/bunny.mp4");
  });
});
