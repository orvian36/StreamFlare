import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
let authValue: { email: string | null; profile: string | null; logout: () => void };
vi.mock("../context/auth-context", () => ({ useAuth: () => authValue }));

import { AppShell } from "../components/app/app-shell";

describe("AppShell", () => {
  beforeEach(() => { push.mockClear(); authValue = { email: "a@b.com", profile: "Ada", logout: vi.fn() }; });

  it("renders the wordmark link to /browse and the content", () => {
    render(<AppShell><p>content here</p></AppShell>);
    expect(screen.getByRole("link", { name: /streamflare home/i })).toHaveAttribute("href", "/browse");
    expect(screen.getByText("content here")).toBeInTheDocument();
  });

  it("redirects to /signin when unauthenticated", async () => {
    authValue = { email: null, profile: null, logout: vi.fn() };
    render(<AppShell><p>x</p></AppShell>);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/signin"));
  });
});
