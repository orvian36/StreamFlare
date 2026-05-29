import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Wordmark } from "@streamflare/ui/components/brand/wordmark";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { SectionHeader } from "@streamflare/ui/components/brand/section-header";

describe("brand core primitives", () => {
  it("renders the wordmark", () => {
    const { container } = render(<Wordmark />);
    expect(container.textContent).toMatch(/streamflare/i);
  });
  it("renders a glow button with label", () => {
    render(<GlowButton>Play</GlowButton>);
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });
  it("renders a section header with index and title", () => {
    render(<SectionHeader index="01" title="Continue Watching" />);
    expect(screen.getByText("Continue Watching")).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
  });
});
