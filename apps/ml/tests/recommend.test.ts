import { describe, it, expect } from "vitest";
import { runRecommendation } from "../src/services/python-runner.js";

describe("runRecommendation", () => {
  it("returns recommendation IDs for a known title", async () => {
    const ids = await runRecommendation({
      movieTitle: "Batman",
      movies: [
        { id: 1, title: "Batman Begins" },
        { id: 2, title: "The Dark Knight" },
        { id: 3, title: "Frozen" },
        { id: 4, title: "Inception" },
      ],
      limit: 2,
    });
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBeLessThanOrEqual(2);
    expect(ids.every((n) => typeof n === "number")).toBe(true);
  });

  it("returns empty array for unmatchable title", async () => {
    const ids = await runRecommendation({
      movieTitle: "qqqqzzzzzz",
      movies: [{ id: 1, title: "Batman" }],
      limit: 5,
    });
    expect(ids).toEqual([]);
  });
});
