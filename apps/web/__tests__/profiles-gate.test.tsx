import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const setProfile = vi.fn();
const setPtbd = vi.fn();
vi.mock("../context/auth-context", () => ({
  useAuth: () => ({
    email: "a@b.com", max_profiles: 4,
    set_profile: setProfile, set_ptbd: setPtbd, set_num_profiles: vi.fn(), logout: vi.fn(),
  }),
}));
const get = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a) } }));

import ProfilesPage from "../app/profiles/page";

describe("profiles gate", () => {
  beforeEach(() => { push.mockClear(); setProfile.mockClear(); setPtbd.mockClear(); get.mockReset(); });

  it("lists profiles and selects one into /browse", async () => {
    get.mockResolvedValue({ data: { profile: [{ PROFILE_ID: "Ada", DOB: null }, { PROFILE_ID: "Bo", DOB: null }] } });
    render(<ProfilesPage />);
    const tile = await screen.findByRole("button", { name: /ada/i });
    fireEvent.click(tile);
    await waitFor(() => expect(setProfile).toHaveBeenCalledWith("Ada"));
    expect(push).toHaveBeenCalledWith("/browse");
  });
});
