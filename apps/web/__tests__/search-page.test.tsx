import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const replace = vi.fn();
let params = new URLSearchParams("q=joker&type=all");
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => params,
}));
vi.mock("../context/auth-context", () => ({ useAuth: () => ({ email: "a@b.com", profile: "Ada", logout: vi.fn() }) }));
const filtered = vi.fn();
vi.mock("../lib/search-data", async () => {
  const actual = await vi.importActual<typeof import("../lib/search-data")>("../lib/search-data");
  return { ...actual, filteredSearch: (...a: unknown[]) => filtered(...a) };
});
vi.mock("../lib/api-client", () => ({ api: { post: vi.fn(), delete: vi.fn() } }));

import SearchPage from "../app/search/page";

describe("search page", () => {
  beforeEach(() => { replace.mockClear(); filtered.mockReset(); params = new URLSearchParams("q=joker&type=all"); });

  it("renders results from filteredSearch", async () => {
    filtered.mockResolvedValue([{ title: "Search Result from Movies", data: [{ MOVIE_ID: 7, TITLE: "Joker", IMAGE_URL: "/j" }] }]);
    render(<SearchPage />);
    expect(await screen.findAllByAltText("Joker")).not.toHaveLength(0);
  });

  it("updates the URL when the type filter changes", async () => {
    filtered.mockResolvedValue([]);
    render(<SearchPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Movies" }));
    await waitFor(() => expect(replace).toHaveBeenCalled());
  });
});
