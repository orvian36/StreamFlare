import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../context/auth-context", () => ({
  useAuth: () => ({ email: "a@b.com", set_num_profiles: vi.fn() }),
}));
const post = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { post: (...a: unknown[]) => post(...a) } }));

import { ProfileCreateForm } from "../components/profiles/profile-create-form";

describe("ProfileCreateForm", () => {
  beforeEach(() => post.mockReset());

  it("rejects empty fields", async () => {
    const onSuccess = vi.fn();
    const { container } = render(<ProfileCreateForm onSuccess={onSuccess} />);
    fireEvent.submit(container.querySelector("form")!);
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("posts the profile payload and calls onSuccess", async () => {
    post.mockResolvedValue({ status: 201 });
    const onSuccess = vi.fn();
    const { container } = render(<ProfileCreateForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: "1990-01-01" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(post).toHaveBeenCalledWith(
      "/api/profiles/add",
      { EMAIL: "a@b.com", PROFILE_ID: "Ada", DOB: "1990-01-01" },
      { validateStatus: expect.any(Function) },
    ));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});
