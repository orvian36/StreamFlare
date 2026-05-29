import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopBar } from "../components/marketing/top-bar";

describe("TopBar", () => {
  it("renders the wordmark and a sign-in link to /signin", () => {
    render(<TopBar />);
    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/signin");
  });
});
