import { describe, it, expect } from "vitest";
import * as UI from "@streamflare/ui";

describe("@streamflare/ui barrel", () => {
  it("re-exports new primitives and motion helpers", () => {
    for (const name of [
      "Wordmark", "GlowButton", "GlassPanel", "SectionHeader", "Rating",
      "MaturityBadge", "GenreChip", "PosterCard", "ContentRow", "HeroBackdrop",
      "EmptyState", "CountryCombobox", "FadeIn", "Stagger", "StaggerItem", "HoverScale",
    ]) {
      expect(UI, `missing export: ${name}`).toHaveProperty(name);
    }
  });
});
