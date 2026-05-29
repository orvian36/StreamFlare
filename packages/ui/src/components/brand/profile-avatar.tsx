import * as React from "react";
import { cn } from "@streamflare/ui/lib/utils";

const SIZES = {
  sm: "size-10 text-base",
  md: "size-16 text-2xl",
  lg: "size-24 text-4xl",
} as const;

function hashHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export interface ProfileAvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: keyof typeof SIZES;
  selected?: boolean;
}

export function ProfileAvatar({ name, size = "md", selected, className, ...props }: ProfileAvatarProps) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  const hue = hashHue(name);
  // Two stops kept within the Aurora indigo->cyan family (hue ~200-310).
  const from = `oklch(0.55 0.16 ${(hue % 80) + 230})`;
  const to = `oklch(0.72 0.13 ${(hue % 60) + 200})`;
  return (
    <span
      className={cn(
        "grid select-none place-items-center rounded-xl font-display font-bold text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] transition-transform",
        SIZES[size],
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        className,
      )}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden
      {...props}
    >
      {initial}
    </span>
  );
}
