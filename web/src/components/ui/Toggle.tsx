"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "./utils";

type ToggleProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed?: boolean;
};

export function Toggle({ className, pressed = false, ...props }: ToggleProps) {
  return (
    <button
      aria-pressed={pressed}
      className={cn(
        "inline-flex h-7 w-12 items-center rounded-full border border-border bg-muted p-0.5 transition focus-visible:outline-2 focus-visible:outline-offset-2",
        pressed && "bg-primary",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "h-5 w-5 rounded-full bg-card shadow-sm transition-transform",
          pressed && "translate-x-5",
        )}
      />
    </button>
  );
}
