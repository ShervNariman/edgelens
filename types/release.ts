/** Release Room product UI types (SHE-61). Aligned with the decision-engine evidence model. */

export type ReleaseDecisionStatus = "READY" | "WARNING" | "BLOCKED";

export type EvidenceGroup =
  | "intent"
  | "engineering"
  | "experience"
  | "deployment"
  | "launch";

export type EvidenceStatus =
  | "pass"
  | "fail"
  | "missing"
  | "pending"
  | "waived";

export type EvidenceSourceKind =
  | "github"
  | "linear"
  | "vercel"
  | "manual"
  | "ci"
  | "policy";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface EvidenceItem {
  id: string;
  group: EvidenceGroup;
  title: string;
  summary: string;
  status: EvidenceStatus;
  required: boolean;
  owner: string;
  sourceKind: EvidenceSourceKind;
  sourceLabel: string;
  sourceUrl?: string;
  collectedAt: string;
  refreshedAt?: string;
}

export interface ActivityItem {
  id: string;
  at: string;
  actor: string;
  summary: string;
}

export type AuditEventKind =
  | "created"
  | "evidence_refreshed"
  | "evidence_captured"
  | "status_recomputed"
  | "approved"
  | "blocked"
  | "approved_with_exception"
  | "note";

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  kind: AuditEventKind;
  summary: string;
  detail?: string;
  /** Immutable ledger entries cannot be edited after append. */
  immutable: true;
}

export interface ReleaseCandidate {
  id: string;
  slug: string;
  name: string;
  version: string;
  repository: string;
  branch: string;
  prNumber?: number;
  prUrl?: string;
  owner: string;
  targetEnv: string;
  status: ReleaseDecisionStatus;
  risk: RiskLevel;
  riskClasses: string[];
  summary: string;
  blockers: string[];
  warnings: string[];
  updatedAt: string;
  createdAt: string;
  evidence: EvidenceItem[];
  recentActivity: ActivityItem[];
  auditTrail: AuditEvent[];
}

export type DecisionAction = "approve" | "block" | "approve_with_exception";

export interface ManualEvidenceInput {
  group: EvidenceGroup;
  title: string;
  summary: string;
  status: Extract<EvidenceStatus, "pass" | "fail" | "pending">;
  owner: string;
  sourceLabel: string;
  sourceUrl?: string;
  required?: boolean;
}

export const EVIDENCE_GROUP_ORDER: EvidenceGroup[] = [
  "intent",
  "engineering",
  "experience",
  "deployment",
  "launch",
];

export const EVIDENCE_GROUP_LABELS: Record<EvidenceGroup, string> = {
  intent: "Intent",
  engineering: "Engineering",
  experience: "Experience",
  deployment: "Deployment",
  launch: "Launch",
};

export const EVIDENCE_GROUP_BLURBS: Record<EvidenceGroup, string> = {
  intent: "Why this ships — Linear intent and acceptance criteria.",
  engineering: "PR checks, CI, and change risk signals.",
  experience: "Preview quality, accessibility, and UX evidence.",
  deployment: "Vercel preview / production deploy readiness.",
  launch: "Rollback, comms, and go-live gates.",
};
