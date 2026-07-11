import { cn } from "@/lib/utils";
import { statusTone } from "@/lib/release-demo/decision";
import type { EvidenceStatus, ReleaseDecisionStatus, RiskLevel } from "@/types/release";
import { evidenceStatusLabel, riskLabel } from "@/lib/release-demo/decision";

export function DecisionBadge({
  status,
  className,
}: {
  status: ReleaseDecisionStatus;
  className?: string;
}) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide uppercase",
        tone.className,
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-sm", tone.barClassName)}
        aria-hidden
      />
      {tone.label}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span className="inline-flex items-center rounded-md border border-[var(--rr-line)] bg-[var(--rr-surface-raised)] px-2 py-0.5 text-xs font-medium text-[var(--rr-ink)]">
      Risk · {riskLabel(risk)}
    </span>
  );
}

export function EvidenceStatusBadge({ status }: { status: EvidenceStatus }) {
  const map: Record<EvidenceStatus, string> = {
    pass: "bg-[var(--rr-ready-bg)] text-[var(--rr-ready)]",
    fail: "bg-[var(--rr-blocked-bg)] text-[var(--rr-blocked)]",
    missing: "bg-[var(--rr-blocked-bg)] text-[var(--rr-blocked)]",
    pending: "bg-[var(--rr-warn-bg)] text-[var(--rr-warn)]",
    waived: "bg-[var(--rr-warn-bg)] text-[var(--rr-warn)]",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
        map[status],
      )}
    >
      {evidenceStatusLabel(status)}
    </span>
  );
}
