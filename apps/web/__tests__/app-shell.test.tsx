import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
let authValue: { email: string | null; profile: string | null; logout: () => void };
vi.mock("../context/auth-context", () => ({ useAuth: () => authValue }));
vi.mock("../lib/api-client", () => ({ api: { post: vi.fn().mockResolvedValue({ data: [] }) } }));

import { AppShell } from "../components/app/app-shell";

describe("AppShell", () => {
  beforeEach(() => { push.mockClear(); authValue = { email: "a@b.com", profile: "Ada", logout: vi.fn() }; });

  it("renders the wordmark link to /browse and the content", () => {
    render(<AppShell><p>content here</p></AppShell>);
    expect(screen.getByRole("link", { name: /streamflare home/i })).toHaveAttribute("href", "/browse");
    expect(screen.getByText("content here")).toBeInTheDocument();
  });

  it("renders a provided nav slot", () => {
    render(<AppShell nav={<span>BROWSENAV</span>}><p>c</p></AppShell>);
    expect(screen.getByText("BROWSENAV")).toBeInTheDocument();
  });

  it("opens the command palette from the search button", async () => {
    render(<AppShell><p>c</p></AppShell>);
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(await screen.findByPlaceholderText(/search films and series/i)).toBeInTheDocument();
  });

  it("redirects to /signin when unauthenticated", async () => {
    authValue = { email: null, profile: null, logout: vi.fn() };
    render(<AppShell><p>x</p></AppShell>);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/signin"));
  });
});
