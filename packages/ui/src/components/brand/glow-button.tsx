"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@streamflare/ui/lib/utils";

const glowButton = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[background,box-shadow,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[0_0_24px_-6px_var(--sf-accent)] hover:shadow-[0_0_32px_-4px_var(--sf-accent)] hover:bg-[var(--sf-accent-hover)]",
        glass:
          "bg-white/10 text-text backdrop-blur-md border border-white/15 hover:bg-white/15",
        ghost: "bg-transparent text-text hover:bg-surface-3",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface GlowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glowButton> {}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(glowButton({ variant, size }), className)} {...props} />
  ),
);
GlowButton.displayName = "GlowButton";
