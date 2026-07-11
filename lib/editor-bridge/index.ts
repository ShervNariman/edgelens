export type {
  EditorAgent,
  EditorCapacity,
  EditorEventKind,
  EditorEvidencePayload,
  EditorOutcome,
  SignedEditorEvidenceEnvelope,
} from "@/lib/editor-bridge/types";
export {
  EDITOR_AGENTS,
  EDITOR_BRIDGE_LIMITS,
  EDITOR_EVENT_KINDS,
  EDITOR_OUTCOMES,
  EditorBridgeError,
} from "@/lib/editor-bridge/types";
export {
  boundMetadata,
  boundStringList,
  redactSecrets,
  sanitizeString,
} from "@/lib/editor-bridge/redact";
export {
  canonicalizeJson,
  formatSignatureHeader,
  parseSignatureHeader,
  signBody,
  verifyEvidenceSignature,
} from "@/lib/editor-bridge/sign";
export {
  outcomeToEvidenceStatus,
  parseEditorEvidencePayload,
} from "@/lib/editor-bridge/schema";
export { applyEditorEvidence } from "@/lib/editor-bridge/ingest";
export { deliverEditorEvidence } from "@/lib/editor-bridge/client";
