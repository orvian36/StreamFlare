import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Rating } from "@streamflare/ui/components/brand/rating";
import { MaturityBadge } from "@streamflare/ui/components/brand/maturity-badge";
import { GenreChip } from "@streamflare/ui/components/brand/genre-chip";

describe("brand meta primitives", () => {
  it("formats the rating to one decimal", () => {
    render(<Rating value={8.42} />);
    expect(screen.getByText("8.4")).toBeInTheDocument();
  });
  it("renders the maturity label", () => {
    render(<MaturityBadge rating="PG-13" />);
    expect(screen.getByText("PG-13")).toBeInTheDocument();
  });
  it("renders a genre chip", () => {
    render(<GenreChip>Thriller</GenreChip>);
    expect(screen.getByText("Thriller")).toBeInTheDocument();
  });
});
