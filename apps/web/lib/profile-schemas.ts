import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(20, "Keep it under 20 characters"),
  dob: z.string().min(1, "Date of birth is required"),
});
export type ProfileValues = z.infer<typeof profileSchema>;
