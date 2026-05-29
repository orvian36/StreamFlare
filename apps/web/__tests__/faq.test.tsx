import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Faq } from "../components/marketing/faq";

describe("Faq", () => {
  it("renders the section heading and question triggers", () => {
    render(<Faq />);
    expect(screen.getByText(/frequently asked/i)).toBeInTheDocument();
    expect(screen.getByText("What is StreamFlare?")).toBeInTheDocument();
  });
});
