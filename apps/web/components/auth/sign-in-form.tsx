"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@streamflare/ui/components/ui/form";
import { Input } from "@streamflare/ui/components/ui/input";
import { Alert, AlertDescription } from "@streamflare/ui/components/ui/alert";
import { signInSchema, type SignInValues } from "../../lib/auth-schemas";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";

interface LoginResponse { EMAIL: string; token: string }

export function SignInForm() {
  const router = useRouter();
  const auth = useAuth();
  const [formError, setFormError] = React.useState("");
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignInValues) => {
    setFormError("");
    try {
      const { data, status } = await api.post<LoginResponse>(
        "/api/users/login",
        { EMAIL: values.email, PASSWORD: values.password },
        { validateStatus: () => true },
      );
      if (status === 422) return setFormError("User does not exist. Please sign up instead.");
      if (status === 423) return setFormError("Incorrect password.");
      if (status !== 201) return setFormError("Login failed. Please try again.");

      auth.login(values.email, data.token);
      const mp = await api.get(`/api/users/maxprofiles/${values.email}`);
      auth.set_max_profiles(mp.data.mp.MAX_PROFILES);
      const np = await api.get(`/api/users/numprofiles/${values.email}`);
      auth.set_num_profiles(np.data.C.C);
      const sub = await api.get(`/api/subscription/subid/${values.email}`);
      if (sub.data.sub_id?.SUB_ID) {
        const subId = sub.data.sub_id.SUB_ID;
        auth.set_sub_id(subId);
        const bill = await api.get(`/api/subscription/bill/${subId}`);
        auth.set_bill(bill.data.bill.BILL);
        router.push("/browse");
      } else {
        router.push("/subscription/add");
      }
    } catch (err) {
      const msg = (err as Error).message ?? "Something went wrong";
      setFormError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-text">Sign in</h1>
        <p className="text-sm text-text-muted">Welcome back to StreamFlare.</p>
      </div>
      {formError ? (
        <Alert variant="destructive" data-testid="error"><AlertDescription>{formError}</AlertDescription></Alert>
      ) : null}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <GlowButton type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </GlowButton>
        </form>
      </Form>
      <p className="text-sm text-text-muted">
        New to StreamFlare? <Link href="/signup" className="text-brand hover:underline">Sign up now.</Link>
      </p>
    </div>
  );
}
