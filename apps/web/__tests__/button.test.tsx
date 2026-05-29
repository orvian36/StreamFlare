import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Button from "@streamflare/ui/src/components/button";

describe("Button", () => {
  it("renders a native button with its label as the accessible name", () => {
    render(<Button>Try it now</Button>);
    expect(screen.getByRole("button", { name: "Try it now" })).toBeInTheDocument();
  });

  it("forwards the disabled attribute", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
