import { describe, it, expect, vi, beforeEach } from "vitest";
const post = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { post: (...a: unknown[]) => post(...a) } }));
import { staticSearch, filteredSearch, SEARCH_GENRES } from "../lib/search-data";

describe("search-data", () => {
  beforeEach(() => post.mockReset());

  it("staticSearch posts the static body", async () => {
    post.mockResolvedValue({ data: [{ title: "Search Result from Movies", data: [] }, { title: "Search Result from Shows", data: [] }] });
    await staticSearch("joker");
    expect(post).toHaveBeenCalledWith("/api/browse/search", { ss: "static", key: ["joker"] });
  });

  it("filteredSearch builds ss + key from filters", async () => {
    post.mockResolvedValue({ data: [] });
    await filteredSearch({ query: "joker", type: "movie", genre: "Drama", year: "2019" });
    expect(post).toHaveBeenCalledWith("/api/browse/search", {
      ss: "movie",
      key: ["title", "joker", "genre", "Drama", "year", "2019"],
    });
  });

  it("filteredSearch returns [] when nothing to search", async () => {
    const r = await filteredSearch({ type: "all" });
    expect(r).toEqual([]);
    expect(post).not.toHaveBeenCalled();
  });

  it("exposes a non-empty genre list", () => {
    expect(SEARCH_GENRES.length).toBeGreaterThan(0);
  });
});
