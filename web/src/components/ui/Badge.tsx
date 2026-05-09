import type { HTMLAttributes } from "react";
import { cn } from "./utils";

type BadgeVariant = "default" | "success" | "danger" | "warning" | "notice" | "muted";

const variants: Record<BadgeVariant, string> = {
  default: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  success: "bg-green-500/10 text-green-700 dark:text-green-300",
  danger: "bg-red-500/10 text-red-700 dark:text-red-300",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  notice: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  muted: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-current/10",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
