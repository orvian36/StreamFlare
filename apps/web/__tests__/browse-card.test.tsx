import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const post = vi.fn();
const del = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { post: (...a: unknown[]) => post(...a), delete: (...a: unknown[]) => del(...a) } }));

import { BrowseCard } from "../components/browse/browse-card";

describe("BrowseCard", () => {
  beforeEach(() => { post.mockReset(); del.mockReset(); });

  it("links to the title detail page for the item", () => {
    render(<BrowseCard item={{ MOVIE_ID: 7, TITLE: "X", IMAGE_URL: "/x" }} email="a@b.com" profileId="Ada" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/title/movie/7");
  });

  it("adds to the watchlist without navigating", async () => {
    post.mockResolvedValue({ status: 201 });
    render(<BrowseCard item={{ MOVIE_ID: 7, TITLE: "X", IMAGE_URL: "/x" }} email="a@b.com" profileId="Ada" />);
    fireEvent.click(screen.getByRole("button", { name: /add x to my list/i }));
    await waitFor(() => expect(post).toHaveBeenCalledWith(
      "/api/profiles/watchlist/add", { EMAIL: "a@b.com", PROFILE_ID: "Ada", MOVIE_ID: 7 },
    ));
  });
});
