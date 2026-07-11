/**
 * Derive release stage from evidence coverage — never a hard-coded progress bar.
 */

import type { EvidenceItem, EvidenceSource } from "@/lib/db/types";
import type { ReleaseStage, ReleaseStageId } from "@/lib/live/types";

const STAGE_SOURCES: Record<ReleaseStageId, EvidenceSource[]> = {
  intent: ["linear"],
  engineering: ["github"],
  experience: ["fixture", "manual"],
  deployment: ["vercel"],
  decision: [],
};

const STAGE_LABELS: Record<ReleaseStageId, string> = {
  intent: "Intent",
  engineering: "Engineering",
  experience: "Experience",
  deployment: "Deployment",
  decision: "Decision",
};

function itemsForStage(evidence: EvidenceItem[], stage: ReleaseStageId): EvidenceItem[] {
  if (stage === "decision") {
    return evidence;
  }
  const sources = STAGE_SOURCES[stage];
  return evidence.filter((item) => sources.includes(item.source));
}

function stageFromItems(id: ReleaseStageId, items: EvidenceItem[]): ReleaseStage {
  if (items.length === 0) {
    return {
      id,
      label: STAGE_LABELS[id],
      state: "empty",
      detail: "No evidence collected for this stage yet.",
      evidenceCount: 0,
    };
  }
  if (items.some((item) => item.status === "fail")) {
    const failed = items.find((item) => item.status === "fail");
    return {
      id,
      label: STAGE_LABELS[id],
      state: "blocked",
      detail: failed?.summary ?? "Failing evidence blocks this stage.",
      evidenceCount: items.length,
    };
  }
  if (items.every((item) => item.status === "pass" || item.status === "info")) {
    return {
      id,
      label: STAGE_LABELS[id],
      state: "pass",
      detail: "Required signals present.",
      evidenceCount: items.length,
    };
  }
  return {
    id,
    label: STAGE_LABELS[id],
    state: "pending",
    detail: "Waiting on evidence or human review.",
    evidenceCount: items.length,
  };
}

/**
 * Current stage is the first non-passing stage, else Decision.
 */
export function deriveReleaseStages(evidence: EvidenceItem[]): {
  stages: ReleaseStage[];
  current: ReleaseStage;
} {
  const ordered: ReleaseStageId[] = [
    "intent",
    "engineering",
    "experience",
    "deployment",
    "decision",
  ];

  const stages = ordered.map((id) => stageFromItems(id, itemsForStage(evidence, id)));

  const blocked = stages.find((s) => s.state === "blocked");
  if (blocked) {
    return { stages, current: blocked };
  }

  const pending = stages.find((s) => s.id !== "decision" && s.state === "pending");
  if (pending) {
    return { stages, current: pending };
  }

  // Empty stages pin current only when no later stage has evidence yet.
  // Optional mid gaps (empty between covered stages) do not block Decision.
  let lastWithEvidence = -1;
  for (let i = stages.length - 1; i >= 0; i -= 1) {
    const stage = stages[i];
    if (stage && stage.id !== "decision" && stage.evidenceCount > 0) {
      lastWithEvidence = i;
      break;
    }
  }

  const nextEmpty = stages.find(
    (s, index) => s.id !== "decision" && s.state === "empty" && index > lastWithEvidence,
  );
  if (nextEmpty) {
    return { stages, current: nextEmpty };
  }

  if (lastWithEvidence < 0) {
    const empty = stages.find((s) => s.id !== "decision" && s.state === "empty");
    if (empty) {
      return { stages, current: empty };
    }
  }

  const decision = stages.find((s) => s.id === "decision") ?? stages.at(-1)!;
  return {
    stages,
    current: {
      ...decision,
      state: "pass",
      detail: "Evidence supports a go/no-go decision.",
    },
  };
}
