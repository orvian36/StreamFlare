"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { CountryCombobox } from "@streamflare/ui/components/forms/country-combobox";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@streamflare/ui/components/ui/form";
import { Input } from "@streamflare/ui/components/ui/input";
import { Alert, AlertDescription } from "@streamflare/ui/components/ui/alert";
import { signUpSchema, type SignUpValues } from "../../lib/auth-schemas";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";

interface SignupResponse { EMAIL: string; token: string }

export function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();
  const [formError, setFormError] = React.useState("");
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "", email: params.get("email") ?? "", password: "",
      dob: "", creditCard: "", phone: "", country: "",
    },
  });

  const onSubmit = async (v: SignUpValues) => {
    setFormError("");
    try {
      const { data, status } = await api.post<SignupResponse>(
        "/api/users/signup",
        {
          NAME: v.name, EMAIL: v.email, DOB: v.dob, COUNTRY: v.country,
          CREDIT_CARD: v.creditCard, PASSWORD: v.password, PHONE: v.phone,
        },
        { validateStatus: () => true },
      );
      if (status === 422) return setFormError("Invalid user info.");
      if (status === 423) return setFormError("User already exists. Try signing in.");
      if (status !== 201) return setFormError("Sign up failed. Please try again.");
      auth.login(v.email, data.token);
      router.push("/subscription/add");
    } catch (err) {
      const msg = (err as Error).message ?? "Something went wrong";
      setFormError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-text">Create your account</h1>
        <p className="text-sm text-text-muted">Start watching in minutes.</p>
      </div>
      {formError ? (
        <Alert variant="destructive" data-testid="error"><AlertDescription>{formError}</AlertDescription></Alert>
      ) : null}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Name</FormLabel><FormControl><Input autoComplete="name" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email address</FormLabel><FormControl><Input type="email" autoComplete="email" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
              <FormDescription>At least 8 characters.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="dob" render={({ field }) => (
            <FormItem><FormLabel>Date of birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="creditCard" render={({ field }) => (
            <FormItem><FormLabel>Credit card number</FormLabel><FormControl><Input inputMode="numeric" autoComplete="cc-number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Phone number</FormLabel><FormControl><Input type="tel" autoComplete="tel" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="country" render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl><CountryCombobox value={field.value} onChange={field.onChange} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <GlowButton type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating account..." : "Create account"}
          </GlowButton>
        </form>
      </Form>
      <p className="text-sm text-text-muted">
        Already a member? <Link href="/signin" className="text-brand hover:underline">Sign in.</Link>
      </p>
    </div>
  );
}
