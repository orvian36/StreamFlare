import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../context/auth-context", () => ({ useAuth: () => ({ email: "a@b.com", profile: "Ada", logout: vi.fn() }) }));
vi.mock("../lib/title-data", () => ({
  fetchTitle: vi.fn(async () => ({ id: 7, type: "movie", title: "Joker", description: "d", rating: 8.4, yearLabel: "2019", maturity: "R", metaExtra: "122 min", imageUrl: "/j", videoUrl: null })),
  fetchCast: vi.fn(async () => [{ TITLE: "Joker", NAME: "Joaquin Phoenix" }]),
  fetchGenres: vi.fn(async () => [{ NAME: "Thriller" }]),
  fetchSimilar: vi.fn(async () => [{ MOVIE_ID: 8, TITLE: "Sib", IMAGE_URL: "/s" }]),
  fetchEpisodes: vi.fn(async () => []),
  getRating: vi.fn(async () => null),
  setRating: vi.fn(async () => {}),
}));
vi.mock("../lib/api-client", () => ({ api: { post: vi.fn(), delete: vi.fn() } }));

import { TitleDetail } from "../components/title/title-detail";

describe("TitleDetail", () => {
  it("renders the title, cast, genre, and a Play link", async () => {
    render(<TitleDetail type="movie" id={7} />);
    expect(await screen.findByRole("heading", { name: "Joker", level: 1 })).toBeInTheDocument();
    expect(await screen.findByText("Joaquin Phoenix")).toBeInTheDocument();
    expect(screen.getByText("Thriller")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /play/i })).toHaveAttribute("href", "/watch/movie/7");
  });
});
