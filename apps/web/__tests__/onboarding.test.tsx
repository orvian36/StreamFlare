import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../context/auth-context", () => ({
  useAuth: () => ({ email: "a@b.com", set_num_profiles: vi.fn() }),
}));
const get = vi.fn();
const post = vi.fn();
vi.mock("../lib/api-client", () => ({
  api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) },
}));

import { OnboardingStepper } from "../components/onboarding/onboarding-stepper";

describe("OnboardingStepper", () => {
  beforeEach(() => { push.mockClear(); get.mockReset(); post.mockReset(); });

  it("adds a plan then advances to the profile step", async () => {
    get.mockImplementation((url: string) => {
      if (url.includes("/api/subscription/plans")) {
        return Promise.resolve({ data: { plans: [{ SUB_TYPE: "Basic", BILL: 5, NUM_PROFILES: 2 }] } });
      }
      return Promise.resolve({ data: { profile: [] } });
    });
    post.mockResolvedValue({ status: 201 });
    render(<OnboardingStepper />);
    fireEvent.click(await screen.findByRole("button", { name: /choose basic/i }));
    await waitFor(() => expect(post).toHaveBeenCalledWith(
      "/api/subscription/add",
      expect.objectContaining({ EMAIL: "a@b.com", SUB_TYPE: "Basic" }),
      expect.any(Object),
    ));
    expect(await screen.findByText(/add a profile/i)).toBeInTheDocument();
  });
});
