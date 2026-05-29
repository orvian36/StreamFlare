import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../context/auth-context", () => ({ useAuth: () => ({ email: "a@b.com" }) }));
const patch = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { patch: (...a: unknown[]) => patch(...a) } }));

import { PhoneDialog } from "../components/account/phone-dialog";

describe("PhoneDialog", () => {
  beforeEach(() => patch.mockReset());

  it("patches the phone payload on valid submit", async () => {
    patch.mockResolvedValue({ status: 201 });
    render(<PhoneDialog currentPhone="000" onUpdated={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /update phone/i }));
    fireEvent.change(await screen.findByLabelText(/new phone/i), { target: { value: "5551234" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith(
      "/api/users/updatephone",
      { EMAIL: "a@b.com", Phone: "5551234" },
      { validateStatus: expect.any(Function) },
    ));
  });
});
