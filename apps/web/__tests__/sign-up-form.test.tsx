import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthProvider } from "../context/auth-context";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams("email=pre%40fill.com"),
}));

const post = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { post: (...a: unknown[]) => post(...a) } }));

import { SignUpForm } from "../components/auth/sign-up-form";

const renderForm = () => render(<AuthProvider><SignUpForm /></AuthProvider>);

describe("SignUpForm", () => {
  beforeEach(() => { push.mockClear(); post.mockReset(); });

  it("prefills the email from the query string", () => {
    renderForm();
    expect(screen.getByLabelText(/email/i)).toHaveValue("pre@fill.com");
  });

  it("rejects a short password before posting", async () => {
    const { container } = renderForm();
    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "short" } });
    fireEvent.submit(container.querySelector("form")!);
    expect(await screen.findByText(/must be at least 8 characters/i)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });
});
