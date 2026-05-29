import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../context/auth-context", () => ({ useAuth: () => ({ email: "a@b.com" }) }));
const patch = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { patch: (...a: unknown[]) => patch(...a) } }));

import { PasswordDialog } from "../components/account/password-dialog";

describe("PasswordDialog", () => {
  beforeEach(() => patch.mockReset());

  it("patches the password payload on valid submit", async () => {
    patch.mockResolvedValue({ status: 201 });
    render(<PasswordDialog />);
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));
    fireEvent.change(await screen.findByLabelText(/current password/i), { target: { value: "old" } });
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: "longenough" } });
    fireEvent.change(screen.getByLabelText(/confirm/i), { target: { value: "longenough" } });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith(
      "/api/users/updatepassword",
      { EMAIL: "a@b.com", OLD_PASS: "old", NEW_PASS: "longenough", NEW_PASS_CON: "longenough" },
      { validateStatus: expect.any(Function) },
    ));
  });
});
