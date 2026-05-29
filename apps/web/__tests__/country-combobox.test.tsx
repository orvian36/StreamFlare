import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CountryCombobox } from "@streamflare/ui/components/forms/country-combobox";

describe("CountryCombobox", () => {
  it("renders a trigger with the placeholder when no value", () => {
    render(<CountryCombobox value="" onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveTextContent(/select country/i);
  });
  it("shows the selected country", () => {
    render(<CountryCombobox value="United States" onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("United States");
  });
});
