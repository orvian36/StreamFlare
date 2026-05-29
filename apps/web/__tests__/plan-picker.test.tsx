import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const get = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { get: (...a: unknown[]) => get(...a) } }));

import { PlanPicker } from "../components/subscription/plan-picker";

describe("PlanPicker", () => {
  beforeEach(() => get.mockReset());

  it("renders plans and fires onSelect with the plan type", async () => {
    get.mockResolvedValue({ data: { plans: [
      { SUB_TYPE: "Basic", BILL: 5, NUM_PROFILES: 2 },
      { SUB_TYPE: "Premium", BILL: 10, NUM_PROFILES: 6 },
    ] } });
    const onSelect = vi.fn();
    render(<PlanPicker onSelect={onSelect} />);
    fireEvent.click(await screen.findByRole("button", { name: /choose basic/i }));
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith("Basic"));
  });
});
