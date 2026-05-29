import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const post = vi.fn();
vi.mock("../lib/api-client", () => ({ api: { post: (...a: unknown[]) => post(...a) } }));

import { CommandPalette } from "../components/search/command-palette";

describe("CommandPalette", () => {
  beforeEach(() => { push.mockClear(); post.mockReset(); });

  it("searches and routes to a result's detail page", async () => {
    post.mockResolvedValue({ data: [
      { title: "Search Result from Movies", data: [{ MOVIE_ID: 7, TITLE: "Joker", IMAGE_URL: "/j", RELEASE_DATE: 2019 }] },
      { title: "Search Result from Shows", data: [] },
    ] });
    render(<CommandPalette open onOpenChange={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "joker" } });
    const item = await screen.findByText("Joker");
    fireEvent.click(item);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/title/movie/7"));
  });
});
