import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  dob: z.string().min(1, "Date of birth is required"),
  creditCard: z.string().min(12, "Enter a valid card number").max(19),
  phone: z.string().min(5, "Enter a valid phone number"),
  country: z.string().min(1, "Select your country"),
});
export type SignUpValues = z.infer<typeof signUpSchema>;
