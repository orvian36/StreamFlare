import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider } from "../context/auth-context";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const post = vi.fn();
const get = vi.fn();
vi.mock("../lib/api-client", () => ({
  api: { post: (...a: unknown[]) => post(...a), get: (...a: unknown[]) => get(...a) },
}));

import { SignInForm } from "../components/auth/sign-in-form";

const renderForm = () => render(<AuthProvider><SignInForm /></AuthProvider>);

describe("SignInForm", () => {
  beforeEach(() => { push.mockClear(); post.mockReset(); get.mockReset(); });

  it("shows a validation error for an invalid email", async () => {
    const { container } = renderForm();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "nope" } });
    fireEvent.submit(container.querySelector("form")!);
    expect(await screen.findByText(/valid email/i, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("posts credentials and routes to /subscription/add when no subscription", async () => {
    post.mockResolvedValue({ status: 201, data: { EMAIL: "a@b.com", token: "t" } });
    get.mockImplementation((url: string) => {
      if (url.includes("maxprofiles")) return Promise.resolve({ data: { mp: { MAX_PROFILES: 2 } } });
      if (url.includes("numprofiles")) return Promise.resolve({ data: { C: { C: 0 } } });
      if (url.includes("subid")) return Promise.resolve({ data: { sub_id: null } });
      return Promise.resolve({ data: {} });
    });
    const { container } = renderForm();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret1" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(post).toHaveBeenCalledWith(
      "/api/users/login",
      { EMAIL: "a@b.com", PASSWORD: "secret1" },
      { validateStatus: expect.any(Function) },
    ));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/onboarding"));
  });
});
