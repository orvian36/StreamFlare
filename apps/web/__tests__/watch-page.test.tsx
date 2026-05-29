import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const push = vi.fn();
const back = vi.fn();
let params: Record<string, string> = { type: "movie", id: "7" };
let sp = new URLSearchParams("");
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back }),
  useParams: () => params,
  useSearchParams: () => sp,
}));
vi.mock("../context/auth-context", () => ({ useAuth: () => ({ email: "a@b.com", profile: "Ada" }) }));
vi.mock("../lib/title-data", () => ({
  fetchMovie: vi.fn(async () => ({ id: 7, type: "movie", title: "Joker", imageUrl: "/j", videoUrl: "/v.mp4" })),
  fetchShow: vi.fn(async () => ({ id: 9, type: "show", title: "Show", imageUrl: "/s", videoUrl: null })),
  fetchEpisodes: vi.fn(async () => []),
}));
const getProgress = vi.fn(async (..._a: unknown[]) => 0);
const saveProgress = vi.fn(async (..._a: unknown[]) => {});
vi.mock("../lib/watch-data", async () => {
  const actual = await vi.importActual<typeof import("../lib/watch-data")>("../lib/watch-data");
  return { ...actual, getProgress: (...a: unknown[]) => getProgress(...a), saveProgress: (...a: unknown[]) => saveProgress(...a) };
});
vi.mock("../lib/api-client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

import WatchPage from "../app/watch/[type]/[id]/page";

describe("watch page", () => {
  beforeEach(() => { push.mockClear(); back.mockClear(); params = { type: "movie", id: "7" }; sp = new URLSearchParams(""); getProgress.mockClear(); });

  it("loads the movie and renders the player with its title", async () => {
    render(<WatchPage />);
    expect(await screen.findByText("Joker")).toBeInTheDocument();
    expect(getProgress).toHaveBeenCalled();
  });
});
