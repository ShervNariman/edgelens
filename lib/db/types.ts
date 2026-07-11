export type DecisionStatus = "READY" | "BLOCKED" | "PENDING";

export type EvidenceSource =
  | "github"
  | "linear"
  | "vercel"
  | "fixture"
  | "manual"
  | "editor";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  isPrivate: true;
  createdAt: string;
}

export interface Owner {
  id: string;
  email: string;
  displayName: string;
}

export interface EvidenceItem {
  id: string;
  source: EvidenceSource;
  title: string;
  summary: string;
  status: "pass" | "fail" | "warn" | "info";
  url?: string;
  collectedAt: string;
}

export interface Approval {
  id: string;
  actorEmail: string;
  note: string;
  createdAt: string;
  kind: "approve" | "exception";
}

export interface AuditEvent {
  id: string;
  at: string;
  actorEmail: string;
  action: string;
  detail: string;
}

export interface ReleaseCandidate {
  id: string;
  workspaceId: string;
  title: string;
  version: string;
  branch: string;
  decision: DecisionStatus;
  summary: string;
  evidence: EvidenceItem[];
  approvals: Approval[];
  audit: AuditEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSnapshot {
  workspace: Workspace;
  owner: Owner;
  releases: ReleaseCandidate[];
}

export interface Database {
  getWorkspace(): Promise<Workspace>;
  getOwner(): Promise<Owner>;
  listReleases(): Promise<ReleaseCandidate[]>;
  getRelease(id: string): Promise<ReleaseCandidate | null>;
  addApproval(
    releaseId: string,
    input: Omit<Approval, "id" | "createdAt">,
  ): Promise<ReleaseCandidate>;
  appendAudit(
    releaseId: string,
    input: Omit<AuditEvent, "id" | "at">,
  ): Promise<ReleaseCandidate>;
  /**
   * Persist a mutator result for a release. Used by signed editor/agent
   * evidence ingest and other adapter writes.
   */
  saveRelease(release: ReleaseCandidate): Promise<ReleaseCandidate>;
  resetToSeed(): Promise<DatabaseSnapshot>;
}
