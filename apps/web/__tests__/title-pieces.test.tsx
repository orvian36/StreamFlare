import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CastList } from "../components/title/cast-list";
import { EpisodeList } from "../components/title/episode-list";

describe("title pieces", () => {
  it("CastList renders names", () => {
    render(<CastList cast={[{ TITLE: "x", NAME: "Joaquin Phoenix" }, { TITLE: "x", NAME: null }]} />);
    expect(screen.getByText("Joaquin Phoenix")).toBeInTheDocument();
  });

  it("EpisodeList shows the selected season's episodes", () => {
    render(<EpisodeList seasons={[
      { title: "Season 1", data: [{ TITLE: "Pilot", IMAGE_URL: null, SEASON_NO: 1, EPISODE_NO: 1 }] },
      { title: "Season 2", data: [{ TITLE: "Return", IMAGE_URL: null, SEASON_NO: 2, EPISODE_NO: 1 }] },
    ]} />);
    expect(screen.getByText(/Pilot/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Season 2" }));
    expect(screen.getByText(/Return/)).toBeInTheDocument();
  });
});
