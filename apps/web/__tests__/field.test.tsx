import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Field from "@streamflare/ui/src/components/field";

describe("Field", () => {
  it("associates its visible label with the input", () => {
    render(<Field label="Email address" type="email" />);
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
  });

  it("marks the input invalid and exposes the error via role=alert", () => {
    render(<Field label="Email address" error="Email is required" />);
    expect(screen.getByLabelText("Email address")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Email is required");
  });
});
