import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// vitest runs with cwd = apps/web; the shared stylesheet lives in packages/ui.
const css = readFileSync(
  resolve(process.cwd(), "../../packages/ui/src/styles/globals.css"),
  "utf8",
);

describe("Aurora Noir tokens", () => {
  it("imports tailwind and defines core brand + shadcn tokens", () => {
    expect(css).toContain('@import "tailwindcss"');
    expect(css).toContain("--sf-canvas:");
    expect(css).toContain("--sf-accent:");
    expect(css).toContain("--sf-accent-2:");
    expect(css).toContain("--background:");
    expect(css).toContain("--primary:");
    expect(css).toContain("--ring:");
  });

  it("uses OKLCH and never raw hex black/white", () => {
    expect(css).toContain("oklch(");
    expect(css.toLowerCase()).not.toContain("#000");
    expect(css.toLowerCase()).not.toContain("#fff");
  });
});
