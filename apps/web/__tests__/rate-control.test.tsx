import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RateControl } from "../components/title/rate-control";

describe("RateControl", () => {
  it("reports the chosen rating", () => {
    const onRate = vi.fn();
    render(<RateControl value={null} onRate={onRate} />);
    fireEvent.click(screen.getByRole("button", { name: /rate 4 of 5/i }));
    expect(onRate).toHaveBeenCalledWith(4);
  });
});
