import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HistoryList } from "../components/history/history-list";
import type { HistoryEntry } from "../lib/history-data";

const show: HistoryEntry = { title: "Loki", profile: "Ada", rating: 8.2, watchedUpto: "12:30", time: "2026-05-20", episode: "S1 E2" };

describe("HistoryList", () => {
  it("renders a row with title, rating and episode", () => {
    render(<HistoryList items={[show]} emptyLabel="No show history yet" />);
    expect(screen.getByText("Loki")).toBeInTheDocument();
    expect(screen.getByText(/8\.2/)).toBeInTheDocument();
    expect(screen.getByText("S1 E2")).toBeInTheDocument();
  });

  it("renders an empty state", () => {
    render(<HistoryList items={[]} emptyLabel="No show history yet" />);
    expect(screen.getByText("No show history yet")).toBeInTheDocument();
  });
});
