import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const get = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a) } }));

import { fetchOverview, isAdmin } from "../lib/admin-data";

describe("admin-data", () => {
  beforeEach(() => { get.mockReset(); });
  afterEach(() => { vi.unstubAllEnvs(); });

  it("isAdmin allows any signed-in user when no allowlist is set", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_EMAILS", "");
    expect(isAdmin("a@b.com")).toBe(true);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it("isAdmin enforces the allowlist when set", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_EMAILS", "boss@x.com, admin@y.com");
    expect(isAdmin("admin@y.com")).toBe(true);
    expect(isAdmin("a@b.com")).toBe(false);
  });

  it("fetchOverview returns the analytics bundle", async () => {
    get.mockResolvedValue({
      data: {
        totals: { users: 1, profiles: 0, movies: 0, shows: 0, subscriptions: 0 },
        revenue: 0,
        trending: [],
        topRated: [],
        genres: [],
      },
    });
    const o = await fetchOverview();
    expect(get).toHaveBeenCalledWith("/api/admin/overview");
    expect(o.totals.users).toBe(1);
  });
});
