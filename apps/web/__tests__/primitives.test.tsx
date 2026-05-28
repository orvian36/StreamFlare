import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Tag from "@streamflare/ui/src/components/tag";
import Section from "@streamflare/ui/src/components/section";
import Frame from "@streamflare/ui/src/components/frame";

describe("presentational primitives", () => {
  it("Tag renders its text", () => {
    render(<Tag accent>Now Streaming</Tag>);
    expect(screen.getByText("Now Streaming")).toBeInTheDocument();
  });

  it("Section renders its index, label, and children", () => {
    render(
      <Section index="01" label="Why StreamFlare">
        <p>body</p>
      </Section>
    );
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Why StreamFlare")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("Frame renders wrapped media", () => {
    render(
      <Frame>
        <img src="/x.jpg" alt="poster" />
      </Frame>
    );
    expect(screen.getByAltText("poster")).toBeInTheDocument();
  });
});
