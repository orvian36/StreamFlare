import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FadeIn, Stagger, StaggerItem } from "@streamflare/ui/motion";

describe("motion primitives", () => {
  it("renders children", () => {
    render(
      <Stagger data-testid="list">
        <StaggerItem>
          <FadeIn>hello</FadeIn>
        </StaggerItem>
      </Stagger>,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
