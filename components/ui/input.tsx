import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, id, label, hint, error, ...props },
  ref,
) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-ink)]">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "h-11 rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 text-[var(--color-ink)]",
          "placeholder:text-[var(--color-muted)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
          error && "border-[var(--color-danger)]",
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-[var(--color-muted)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
