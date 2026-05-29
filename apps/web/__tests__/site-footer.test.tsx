import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "../components/marketing/site-footer";

describe("SiteFooter", () => {
  it("renders the wordmark and a few link columns", () => {
    render(<SiteFooter />);
    expect(screen.getByText("FAQ")).toBeInTheDocument();
    expect(screen.getByText(/© \d{4} StreamFlare/)).toBeInTheDocument();
  });
});
