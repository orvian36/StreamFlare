import { describe, it, expect, vi, beforeEach } from "vitest";
const get = vi.fn();
const post = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) } }));
import { fetchCast, fetchSimilar, setRating } from "../lib/title-data";
import { itemType } from "../lib/browse-data";

describe("title-data", () => {
  beforeEach(() => { get.mockReset(); post.mockReset(); });

  it("itemType distinguishes movie vs show", () => {
    expect(itemType({ MOVIE_ID: 1, TITLE: "a", IMAGE_URL: null })).toBe("movie");
    expect(itemType({ SHOW_ID: 1, TITLE: "a", IMAGE_URL: null })).toBe("show");
  });

  it("fetchCast queries by movie_id", async () => {
    get.mockResolvedValue({ data: [{ TITLE: "x", NAME: "Actor" }] });
    const cast = await fetchCast("movie", 7);
    expect(get).toHaveBeenCalledWith("/api/browse/celeb?movie_id=7");
    expect(cast[0]!.NAME).toBe("Actor");
  });

  it("fetchSimilar queries by show_id", async () => {
    get.mockResolvedValue({ data: [] });
    await fetchSimilar("show", 9);
    expect(get).toHaveBeenCalledWith("/api/browse/similar?show_id=9");
  });

  it("setRating posts to rating/add", async () => {
    post.mockResolvedValue({ status: 201 });
    await setRating("movie", 7, "a@b.com", "Ada", 4);
    expect(post).toHaveBeenCalledWith("/api/profiles/rating/add", { EMAIL: "a@b.com", PROFILE_ID: "Ada", MOVIE_ID: 7, RATING: 4 });
  });
});
