import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

let authValue: { email: string | null; profile: string | null; logout: () => void };
vi.mock("../context/auth-context", () => ({ useAuth: () => authValue }));

const fetchOverview = vi.fn();
let admin = true;
vi.mock("../lib/admin-data", () => ({
  fetchOverview: (...a: unknown[]) => fetchOverview(...a),
  isAdmin: () => admin,
}));

vi.mock("../components/admin/analytics-charts", () => ({ AnalyticsCharts: () => <div data-testid="charts" /> }));
vi.mock("../lib/api-client", () => ({ api: { post: vi.fn().mockResolvedValue({ data: [] }) } }));

import AdminPage from "../app/admin/page";

describe("admin page", () => {
  beforeEach(() => {
    push.mockClear();
    fetchOverview.mockReset();
    admin = true;
    authValue = { email: "a@b.com", profile: "Ada", logout: vi.fn() };
    fetchOverview.mockResolvedValue({
      totals: { users: 5, profiles: 3, movies: 2, shows: 1, subscriptions: 4 },
      revenue: 42,
      trending: [{ title: "Joker", views: 999 }],
      topRated: [],
      genres: [],
    });
  });

  it("redirects non-admins to /browse", async () => {
    admin = false;
    render(<AdminPage />);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/browse"));
  });

  it("renders KPIs and the top-titles row for an admin", async () => {
    render(<AdminPage />);
    expect(await screen.findByText("999")).toBeInTheDocument();
    expect(screen.getByText("Joker")).toBeInTheDocument();
  });
});
