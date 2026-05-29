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
import { phoneSchema, type PhoneValues } from "../../lib/account-schemas";
import { api } from "../../lib/api-client";
import { useAuth } from "../../context/auth-context";

export function PhoneDialog({ currentPhone, onUpdated }: { currentPhone: string | null; onUpdated: (phone: string) => void }) {
  const auth = useAuth();
  const [open, setOpen] = React.useState(false);
  const [formError, setFormError] = React.useState("");
  const form = useForm<PhoneValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: currentPhone ?? "" },
  });

  const onSubmit = async (v: PhoneValues) => {
    if (!auth.email) return setFormError("Not signed in.");
    setFormError("");
    try {
      const { status } = await api.patch(
        "/api/users/updatephone",
        { EMAIL: auth.email, Phone: v.phone },
        { validateStatus: () => true },
      );
      if (status === 201) { toast.success("Phone updated."); onUpdated(v.phone); setOpen(false); return; }
      if (status === 422) return setFormError("Invalid number.");
      setFormError("Failed to update phone.");
    } catch (err) {
      const msg = (err as Error).message ?? "Something went wrong";
      setFormError(msg); toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GlowButton variant="ghost" size="sm">Update phone</GlowButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update phone</DialogTitle>
          <DialogDescription>We&apos;ll use this number for account notifications.</DialogDescription>
        </DialogHeader>
        {formError ? <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert> : null}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>New phone number</FormLabel><FormControl><Input type="tel" autoComplete="tel" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <GlowButton type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save"}
            </GlowButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
