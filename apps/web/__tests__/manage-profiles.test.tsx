import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../context/auth-context", () => ({
  useAuth: () => ({ email: "a@b.com", set_num_profiles: vi.fn() }),
}));
const get = vi.fn();
const del = vi.fn();
vi.mock("../lib/api-client", () => ({
  api: { get: (...a: unknown[]) => get(...a), delete: (...a: unknown[]) => del(...a) },
}));

import { ManageProfiles } from "../components/profiles/manage-profiles";

describe("ManageProfiles", () => {
  beforeEach(() => { get.mockReset(); del.mockReset(); });

  it("deletes a profile after confirming", async () => {
    get.mockResolvedValue({ data: { profile: [{ PROFILE_ID: "Ada" }] } });
    del.mockResolvedValue({ status: 200 });
    render(<ManageProfiles />);
    fireEvent.click(await screen.findByRole("button", { name: /remove ada/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^remove$/i }));
    await waitFor(() => expect(del).toHaveBeenCalledWith(
      "/api/profiles/delete",
      { data: { EMAIL: "a@b.com", PROFILE_ID: "Ada" }, validateStatus: expect.any(Function) },
    ));
  });
});
