import { z } from "zod";

export const passwordSchema = z
  .object({
    oldPass: z.string().min(1, "Enter your current password"),
    newPass: z.string().min(8, "New password must be at least 8 characters"),
    newPassCon: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPass === d.newPassCon, {
    message: "New passwords don't match",
    path: ["newPassCon"],
  });
export type PasswordValues = z.infer<typeof passwordSchema>;

export const phoneSchema = z.object({
  phone: z.string().min(5, "Enter a valid phone number"),
});
export type PhoneValues = z.infer<typeof phoneSchema>;
