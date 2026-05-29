"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GlowButton } from "@streamflare/ui/components/brand/glow-button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@streamflare/ui/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@streamflare/ui/components/ui/form";
import { Input } from "@streamflare/ui/components/ui/input";
import { Alert, AlertDescription } from "@streamflare/ui/components/ui/alert";
import { passwordSchema, type PasswordValues } from "../../lib/account-schemas";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";

export function PasswordDialog() {
  const auth = useAuth();
  const [open, setOpen] = React.useState(false);
  const [formError, setFormError] = React.useState("");
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPass: "", newPass: "", newPassCon: "" },
  });

  const onSubmit = async (v: PasswordValues) => {
    if (!auth.email) return setFormError("Not signed in.");
    setFormError("");
    try {
      const { status } = await api.patch(
        "/api/users/updatepassword",
        { EMAIL: auth.email, OLD_PASS: v.oldPass, NEW_PASS: v.newPass, NEW_PASS_CON: v.newPassCon },
        { validateStatus: () => true },
      );
      if (status === 201) { toast.success("Password updated."); setOpen(false); form.reset(); return; }
      if (status === 422) return setFormError("Current password is incorrect.");
      if (status === 423) return setFormError("New passwords don't match.");
      setFormError("Failed to update password.");
    } catch (err) {
      const msg = (err as Error).message ?? "Something went wrong";
      setFormError(msg); toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GlowButton variant="ghost" size="sm">Change password</GlowButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Enter your current password and a new one.</DialogDescription>
        </DialogHeader>
        {formError ? <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert> : null}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="oldPass" render={({ field }) => (
              <FormItem><FormLabel>Current password</FormLabel><FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="newPass" render={({ field }) => (
              <FormItem><FormLabel>New password</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="newPassCon" render={({ field }) => (
              <FormItem><FormLabel>Confirm new password</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <GlowButton type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Updating..." : "Update password"}
            </GlowButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
