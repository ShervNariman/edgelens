import { cn } from "@/lib/utils";
import type { DecisionStatus } from "@/lib/db/types";

const styles: Record<DecisionStatus, string> = {
  READY: "bg-[var(--color-ready-bg)] text-[var(--color-ready)]",
  BLOCKED: "bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
  PENDING: "bg-[var(--color-wash)] text-[var(--color-muted)]",
};

export function DecisionBadge({
  decision,
  className,
}: {
  decision: DecisionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide uppercase",
        styles[decision],
        className,
      )}
    >
      {decision}
    </span>
  );
}
