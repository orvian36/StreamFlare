import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowseNav, type BrowseView } from "../components/browse/browse-nav";

describe("BrowseNav", () => {
  it("marks the active view and reports changes", () => {
    const onChange = vi.fn();
    render(<BrowseNav view="home" onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "Movies" }));
    expect(onChange).toHaveBeenCalledWith("movies" satisfies BrowseView);
  });
});
