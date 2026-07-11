import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const variantClass: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-ink-soft)] focus-visible:outline-[var(--color-accent)]",
  secondary:
    "border border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink)] hover:bg-[var(--color-wash)] focus-visible:outline-[var(--color-accent)]",
  ghost:
    "text-[var(--color-ink)] hover:bg-[var(--color-wash)] focus-visible:outline-[var(--color-accent)]",
  danger:
    "bg-[var(--color-danger)] text-white hover:opacity-90 focus-visible:outline-[var(--color-danger)]",
};

const sizeClass: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
});
