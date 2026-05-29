import { describe, it, expect } from "vitest";
import { signInSchema, signUpSchema } from "../lib/auth-schemas";

describe("auth schemas", () => {
  it("sign-in requires a valid email and non-empty password", () => {
    expect(signInSchema.safeParse({ email: "x", password: "" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@b.com", password: "secret" }).success).toBe(true);
  });
  it("sign-up rejects short passwords and requires all fields", () => {
    const ok = {
      name: "Ada", email: "a@b.com", password: "longenough", dob: "1990-01-01",
      creditCard: "4111111111111111", phone: "5551234", country: "United States",
    };
    expect(signUpSchema.safeParse(ok).success).toBe(true);
    expect(signUpSchema.safeParse({ ...ok, password: "short" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...ok, name: "" }).success).toBe(false);
  });
});
