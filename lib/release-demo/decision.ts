import type {
  EvidenceItem,
  EvidenceStatus,
  ReleaseCandidate,
  ReleaseDecisionStatus,
} from "@/types/release";

export function recomputeStatus(
  evidence: EvidenceItem[],
): ReleaseDecisionStatus {
  const required = evidence.filter((e) => e.required);
  const hasBlocker = required.some(
    (e) => e.status === "fail" || e.status === "missing",
  );
  if (hasBlocker) return "BLOCKED";

  const hasWarning = evidence.some(
    (e) =>
      e.status === "pending" ||
      e.status === "waived" ||
      (!e.required && (e.status === "fail" || e.status === "missing")),
  );
  if (hasWarning) return "WARNING";
  return "READY";
}

export function deriveBlockers(evidence: EvidenceItem[]): string[] {
  return evidence
    .filter(
      (e) =>
        e.required && (e.status === "fail" || e.status === "missing"),
    )
    .map((e) => {
      if (e.status === "fail") return `${e.title} failed`;
      return `${e.title} missing`;
    });
}

export function deriveWarnings(evidence: EvidenceItem[]): string[] {
  const warnings: string[] = [];
  for (const e of evidence) {
    if (e.status === "pending") {
      warnings.push(`${e.title} still pending`);
    } else if (e.status === "waived") {
      warnings.push(`${e.title} waived via exception`);
    } else if (
      !e.required &&
      (e.status === "fail" || e.status === "missing")
    ) {
      warnings.push(`Optional: ${e.title} is ${e.status}`);
    }
  }
  return warnings;
}

export function applyDecisionToRelease(
  release: ReleaseCandidate,
  status: ReleaseDecisionStatus,
  evidence: EvidenceItem[] = release.evidence,
): ReleaseCandidate {
  return {
    ...release,
    evidence,
    status,
    blockers: deriveBlockers(evidence),
    warnings: deriveWarnings(evidence),
    updatedAt: new Date().toISOString(),
  };
}

export function statusTone(status: ReleaseDecisionStatus): {
  label: string;
  className: string;
  barClassName: string;
} {
  switch (status) {
    case "BLOCKED":
      return {
        label: "Blocked",
        className: "bg-[var(--rr-blocked-bg)] text-[var(--rr-blocked)]",
        barClassName: "bg-[var(--rr-blocked)]",
      };
    case "WARNING":
      return {
        label: "Warning",
        className: "bg-[var(--rr-warn-bg)] text-[var(--rr-warn)]",
        barClassName: "bg-[var(--rr-warn)]",
      };
    case "READY":
      return {
        label: "Ready",
        className: "bg-[var(--rr-ready-bg)] text-[var(--rr-ready)]",
        barClassName: "bg-[var(--rr-ready)]",
      };
  }
}

export function evidenceStatusLabel(status: EvidenceStatus): string {
  switch (status) {
    case "pass":
      return "Pass";
    case "fail":
      return "Fail";
    case "missing":
      return "Missing";
    case "pending":
      return "Pending";
    case "waived":
      return "Waived";
  }
}

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const delta = Math.max(0, now - new Date(iso).getTime());
  const mins = Math.floor(delta / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

export function riskLabel(risk: ReleaseCandidate["risk"]): string {
  return risk.charAt(0).toUpperCase() + risk.slice(1);
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
