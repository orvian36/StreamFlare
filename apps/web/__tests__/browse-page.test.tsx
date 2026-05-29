import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
let authValue: Record<string, unknown>;
vi.mock("../context/auth-context", () => ({ useAuth: () => authValue }));
const get = vi.fn();
const post = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) } }));

import BrowsePage from "../app/browse/page";

describe("browse page", () => {
  beforeEach(() => {
    push.mockClear(); get.mockReset(); post.mockReset();
    authValue = { email: "a@b.com", profile: "Ada", logout: vi.fn(), set_profile: vi.fn() };
    get.mockImplementation((url: string) => {
      if (url.includes("/api/browse/new")) {
        return Promise.resolve({ data: [{ title: "Trending Movies ", data: [{ MOVIE_ID: 1, TITLE: "Joker", IMAGE_URL: "/j", RATING: 8 }] }] });
      }
      if (url.includes("/api/browse/suggestions")) {
        return Promise.resolve({ data: [{ title: "For You", data: [{ MOVIE_ID: 2, TITLE: "Pick", IMAGE_URL: "/p" }] }] });
      }
      if (url.includes("/continue")) return Promise.resolve({ data: { title: "Continue Watching", data: [] } });
      return Promise.resolve({ data: {} });
    });
  });

  it("redirects to /profiles when no profile is selected", async () => {
    authValue = { ...authValue, profile: null };
    render(<BrowsePage />);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/profiles"));
  });

  it("renders the For-You / trending rows on home", async () => {
    render(<BrowsePage />);
    expect(await screen.findByText("For You")).toBeInTheDocument();
    expect(await screen.findAllByAltText("Joker")).not.toHaveLength(0);
  });
});
