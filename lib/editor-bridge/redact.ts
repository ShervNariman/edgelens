import { EDITOR_BRIDGE_LIMITS } from "@/lib/editor-bridge/types";

const SECRET_PATTERNS: RegExp[] = [
  /\b(sk|pk|rk|api|token|secret|password|passwd|auth|bearer)[-_]?[a-z0-9]{8,}\b/gi,
  /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/g,
  /\b(xox[baprs]-)[A-Za-z0-9-]{10,}\b/g,
  /\bAIza[0-9A-Za-z\-_]{20,}\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\b/g,
  /\b(AWS|AKIA)[A-Z0-9]{16,}\b/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
];

const REDACTED = "[REDACTED]";

/** Redact common secret shapes from free-form text. */
export function redactSecrets(input: string): string {
  let value = input;
  for (const pattern of SECRET_PATTERNS) {
    value = value.replace(pattern, REDACTED);
  }
  return value;
}

export function truncate(input: string, max: number): string {
  if (input.length <= max) {
    return input;
  }
  return `${input.slice(0, Math.max(0, max - 1))}…`;
}

export function sanitizeString(input: string, max?: number): string {
  const limit = max ?? EDITOR_BRIDGE_LIMITS.maxStringLength;
  return truncate(redactSecrets(input.trim()), limit);
}

/**
 * Bound and redact a metadata bag. Drops non-string values and excess keys.
 */
export function boundMetadata(
  input: Record<string, unknown> | undefined,
): Record<string, string> | undefined {
  if (!input) {
    return undefined;
  }

  const entries = Object.entries(input)
    .filter(([, value]) => typeof value === "string" || typeof value === "number")
    .slice(0, EDITOR_BRIDGE_LIMITS.maxMetadataKeys);

  if (entries.length === 0) {
    return undefined;
  }

  const out: Record<string, string> = {};
  for (const [rawKey, rawValue] of entries) {
    const key = sanitizeString(String(rawKey), 64);
    if (!key) {
      continue;
    }
    out[key] = sanitizeString(
      String(rawValue),
      EDITOR_BRIDGE_LIMITS.maxMetadataValueLength,
    );
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

export function boundStringList(
  values: string[] | undefined,
  maxItems: number,
): string[] | undefined {
  if (!values || values.length === 0) {
    return undefined;
  }
  const cleaned = values
    .filter((item) => typeof item === "string" && item.trim())
    .slice(0, maxItems)
    .map((item) => sanitizeString(item));
  return cleaned.length > 0 ? cleaned : undefined;
}
