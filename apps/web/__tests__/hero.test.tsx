import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { Hero } from "../components/marketing/hero";

describe("Hero", () => {
  beforeEach(() => push.mockClear());

  it("renders the headline and CTA", () => {
    render(<Hero />);
    expect(screen.getByText(/unlimited films/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
  });

  it("routes to signup with the typed email", () => {
    render(<Hero />);
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: "a@b.com" } });
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    expect(push).toHaveBeenCalledWith("/signup?email=a%40b.com");
  });
});
