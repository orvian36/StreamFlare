import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const push = vi.fn();
// Real Next useRouter returns a stable object; keep the mock stable too so an effect
// that lists `router` in its deps doesn't re-fire every render (infinite loop).
const routerMock = { push };
vi.mock("next/navigation", () => ({ useRouter: () => routerMock }));
let authValue: { email: string | null; profile: string | null; logout: () => void };
vi.mock("../context/auth-context", () => ({ useAuth: () => authValue }));
const get = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a), post: vi.fn().mockResolvedValue({ data: [] }) } }));

import HistoryPage from "../app/history/page";

describe("history page", () => {
  beforeEach(() => {
    push.mockClear();
    authValue = { email: "a@b.com", profile: "Ada", logout: vi.fn() };
    get.mockImplementation((url: string) => {
      if (url.includes("getmoviehistory")) return Promise.resolve({ data: { history: [{ TITLE: "Joker", PID: "Ada", RATING: 8.4, WATCHED_UPTO: "45:12", TIME: "2026-05-20" }] } });
      if (url.includes("getshowhistory")) return Promise.resolve({ data: { history: [{ TITLE: "Loki", PID: "Ada", SEASON_NO: 1, EPISODE_NO: 2, RATING: null, WATCHED_UPTO: null, TIME: null }] } });
      return Promise.resolve({ data: [] });
    });
  });

  it("shows movie history, then show history after switching tabs", async () => {
    render(<HistoryPage />);
    expect(await screen.findByText("Joker")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("tab", { name: /shows/i }), { button: 0 });
    expect(await screen.findByText("Loki")).toBeInTheDocument();
  });
});
