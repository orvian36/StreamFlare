import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a) } }));

import { fetchMovieHistory, fetchShowHistory, toMovieEntries, toShowEntries } from "../lib/history-data";

describe("history-data", () => {
  beforeEach(() => { get.mockReset(); });

  it("fetchMovieHistory hits the email endpoint and returns rows", async () => {
    get.mockResolvedValue({ data: { history: [{ TITLE: "Joker", PID: "Ada", RATING: 8.4, WATCHED_UPTO: "45:12", TIME: "2026-05-20" }] } });
    const rows = await fetchMovieHistory("a@b.com");
    expect(get).toHaveBeenCalledWith("/api/users/getmoviehistory/a@b.com");
    expect(rows[0]!.TITLE).toBe("Joker");
  });

  it("fetchShowHistory hits the show endpoint and tolerates a missing history field", async () => {
    get.mockResolvedValue({ data: {} });
    const rows = await fetchShowHistory("a@b.com");
    expect(get).toHaveBeenCalledWith("/api/users/getshowhistory/a@b.com");
    expect(rows).toEqual([]);
  });

  it("maps rows to entries; shows get an episode label, movies do not", () => {
    const m = toMovieEntries([{ TITLE: "Joker", PID: "Ada", RATING: 8.4, WATCHED_UPTO: "45:12", TIME: "2026-05-20" }]);
    expect(m[0]!.episode).toBeUndefined();
    const s = toShowEntries([{ TITLE: "Loki", PID: "Ada", SEASON_NO: 1, EPISODE_NO: 2, RATING: null, WATCHED_UPTO: null, TIME: null }]);
    expect(s[0]!.episode).toBe("S1 E2");
    expect(s[0]!.title).toBe("Loki");
  });
});
