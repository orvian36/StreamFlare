import { describe, it, expect } from "vitest";
import { profileSchema } from "../lib/profile-schemas";

describe("profileSchema", () => {
  it("requires name and dob", () => {
    expect(profileSchema.safeParse({ name: "", dob: "" }).success).toBe(false);
    expect(profileSchema.safeParse({ name: "Ada", dob: "1990-01-01" }).success).toBe(true);
  });
});
