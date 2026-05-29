"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import { ProfileAvatar } from "@streamflare/ui/components/brand/profile-avatar";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@streamflare/ui/components/ui/form";
import { Input } from "@streamflare/ui/components/ui/input";
import { Alert, AlertDescription } from "@streamflare/ui/components/ui/alert";
import { profileSchema, type ProfileValues } from "../../lib/profile-schemas";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";

export function ProfileCreateForm({ onSuccess }: { onSuccess: (name: string) => void }) {
  const auth = useAuth();
  const [formError, setFormError] = React.useState("");
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", dob: "" },
  });
  const name = form.watch("name");

  const onSubmit = async (v: ProfileValues) => {
    if (!auth.email) return setFormError("Not signed in.");
    setFormError("");
    try {
      const { status } = await api.post(
        "/api/profiles/add",
        { EMAIL: auth.email, PROFILE_ID: v.name, DOB: v.dob },
        { validateStatus: () => true },
      );
      if (status === 201) return onSuccess(v.name);
      if (status === 400) return setFormError("Invalid profile info.");
      if (status === 423) return setFormError("A profile with that name already exists.");
      setFormError("Failed to create profile.");
    } catch (err) {
      const msg = (err as Error).message ?? "Something went wrong";
      setFormError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <ProfileAvatar name={name || "?"} size="lg" />
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Add a profile</h1>
          <p className="text-sm text-text-muted">Who is this profile for?</p>
        </div>
      </div>
      {formError ? (
        <Alert variant="destructive" data-testid="error"><AlertDescription>{formError}</AlertDescription></Alert>
      ) : null}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="dob" render={({ field }) => (
            <FormItem><FormLabel>Date of birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <GlowButton type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Add profile"}
          </GlowButton>
        </form>
      </Form>
    </div>
  );
}
