import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
const post = vi.fn();
const del = vi.fn();
vi.mock("../lib/api-client", () => ({
  api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), delete: (...a: unknown[]) => del(...a) },
}));

import { groupByGenre, fetchWatchList, addToWatchList, type BrowseItem } from "../lib/browse-data";

describe("browse-data", () => {
  beforeEach(() => { get.mockReset(); post.mockReset(); del.mockReset(); });

  it("groups items into one SlideItem per genre NAME", () => {
    const items: BrowseItem[] = [
      { MOVIE_ID: 1, TITLE: "A", IMAGE_URL: "/a", NAME: "Drama" },
      { MOVIE_ID: 2, TITLE: "B", IMAGE_URL: "/b", NAME: "Drama" },
      { MOVIE_ID: 3, TITLE: "C", IMAGE_URL: "/c", NAME: "Comedy" },
    ];
    const rows = groupByGenre(items);
    expect(rows.map((r) => r.title)).toEqual(["Drama", "Comedy"]);
    expect(rows[0]!.data).toHaveLength(2);
  });

  it("fetches the watchlist rows", async () => {
    post.mockResolvedValue({ data: { arr: [{ title: "My List", data: [] }] } });
    const rows = await fetchWatchList("a@b.com", "Ada");
    expect(post).toHaveBeenCalledWith("/api/profiles/watchlist/get", { EMAIL: "a@b.com", PROFILE_ID: "Ada" });
    expect(rows[0]!.title).toBe("My List");
  });

  it("adds a movie to the watchlist", async () => {
    post.mockResolvedValue({ status: 201 });
    await addToWatchList("a@b.com", "Ada", { MOVIE_ID: 7, TITLE: "X", IMAGE_URL: "/x" });
    expect(post).toHaveBeenCalledWith("/api/profiles/watchlist/add", { EMAIL: "a@b.com", PROFILE_ID: "Ada", MOVIE_ID: 7 });
  });
});
