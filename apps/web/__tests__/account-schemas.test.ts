import { describe, it, expect } from "vitest";
import { passwordSchema, phoneSchema } from "../lib/account-schemas";

describe("account schemas", () => {
  it("password requires matching new/confirm and >= 8 chars", () => {
    expect(passwordSchema.safeParse({ oldPass: "x", newPass: "longenough", newPassCon: "longenough" }).success).toBe(true);
    expect(passwordSchema.safeParse({ oldPass: "x", newPass: "longenough", newPassCon: "different" }).success).toBe(false);
    expect(passwordSchema.safeParse({ oldPass: "x", newPass: "short", newPassCon: "short" }).success).toBe(false);
  });
  it("phone requires a reasonable length", () => {
    expect(phoneSchema.safeParse({ phone: "5551234" }).success).toBe(true);
    expect(phoneSchema.safeParse({ phone: "1" }).success).toBe(false);
  });
});
