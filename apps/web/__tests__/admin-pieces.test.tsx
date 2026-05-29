import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "../components/admin/stat-card";
import { TopTitles } from "../components/admin/top-titles";

describe("admin pieces", () => {
  it("StatCard shows label and value", () => {
    render(<StatCard label="Users" value="1,234" />);
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("TopTitles lists rows", () => {
    render(<TopTitles items={[{ title: "Joker", views: 999 }]} />);
    expect(screen.getByText("Joker")).toBeInTheDocument();
    expect(screen.getByText("999")).toBeInTheDocument();
  });
});
