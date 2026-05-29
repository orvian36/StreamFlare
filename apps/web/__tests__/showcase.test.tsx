import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Showcase } from "../components/marketing/showcase";

describe("Showcase", () => {
  it("renders the title and poster images", () => {
    render(<Showcase />);
    expect(screen.getByText(/trending on streamflare/i)).toBeInTheDocument();
    expect(screen.getByAltText("Joker")).toBeInTheDocument();
  });
});
