import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type BadgeVariant = "green" | "yellow" | "red" | "blue" | "gray" | "orange";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-green-100 text-green-700",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  gray: "bg-slate-100 text-slate-600",
  orange: "bg-orange-100 text-orange-700",
};

export function Badge({ variant = "gray", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
