import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthShell } from "../components/auth/auth-shell";

describe("AuthShell", () => {
  it("renders the wordmark and its children", () => {
    render(<AuthShell><p>form here</p></AuthShell>);
    expect(screen.getByText("form here")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /streamflare home/i })).toHaveAttribute("href", "/");
  });
});
