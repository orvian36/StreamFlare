import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowseHero } from "../components/browse/browse-hero";

describe("BrowseHero", () => {
  it("renders the featured title and a play link", () => {
    render(<BrowseHero item={{ MOVIE_ID: 9, TITLE: "Joker", IMAGE_URL: "/j", RATING: 8.4, DESCRIPTION: "d" }} />);
    expect(screen.getByRole("heading", { name: "Joker" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /play/i })).toHaveAttribute("href", "/watch/9");
  });
});
