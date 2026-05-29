import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PosterCard } from "@streamflare/ui/components/brand/poster-card";
import { ContentRow } from "@streamflare/ui/components/brand/content-row";
import { EmptyState } from "@streamflare/ui/components/brand/empty-state";

describe("brand layout primitives", () => {
  it("renders a poster card with title and image alt", () => {
    render(<PosterCard title="Joker" imageUrl="/x.jpg" />);
    expect(screen.getByAltText("Joker")).toBeInTheDocument();
  });
  it("renders a content row title and children", () => {
    render(
      <ContentRow title="Trending">
        <div>item</div>
      </ContentRow>,
    );
    expect(screen.getByText("Trending")).toBeInTheDocument();
    expect(screen.getByText("item")).toBeInTheDocument();
  });
  it("renders empty state message", () => {
    render(<EmptyState title="Nothing here" description="Add some titles" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});
