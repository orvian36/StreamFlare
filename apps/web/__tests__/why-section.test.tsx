import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhySection } from "../components/marketing/why-section";

describe("WhySection", () => {
  it("renders the section heading and feature titles", () => {
    render(<WhySection />);
    expect(screen.getByText(/why streamflare/i)).toBeInTheDocument();
    expect(screen.getByText("Enjoy on your TV.")).toBeInTheDocument();
    expect(screen.getByText("Watch everywhere.")).toBeInTheDocument();
  });
});
