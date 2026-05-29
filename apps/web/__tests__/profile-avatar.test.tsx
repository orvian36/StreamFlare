import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ProfileAvatar } from "@streamflare/ui/components/brand/profile-avatar";

describe("ProfileAvatar", () => {
  it("shows the uppercase first initial", () => {
    const { getByText } = render(<ProfileAvatar name="ada" />);
    expect(getByText("A")).toBeInTheDocument();
  });
  it("is deterministic per name and differs across names", () => {
    const grad = (name: string) =>
      (render(<ProfileAvatar name={name} />).container.firstChild as HTMLElement).style.backgroundImage;
    expect(grad("Ada")).toBe(grad("Ada"));
    expect(grad("Ada")).not.toBe(grad("Bob"));
  });
});
