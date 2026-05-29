import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VideoPlayer } from "../components/watch/video-player";

describe("VideoPlayer", () => {
  it("renders the title and a back button, and toggles play", () => {
    const onBack = vi.fn();
    render(<VideoPlayer src="/x.mp4" poster="/p.jpg" title="Joker" onBack={onBack} />);
    expect(screen.getByText("Joker")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^back$/i }));
    expect(onBack).toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: /^play$/i })[0]!);
    expect(screen.getByRole("button", { name: /^pause$/i })).toBeInTheDocument();
  });
});
