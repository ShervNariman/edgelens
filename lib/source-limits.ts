/** Soft and hard limits for pasted component source (client-side only). */
export const WARN_SOURCE_CHARS = 40_000;
export const MAX_SOURCE_CHARS = 80_000;

export type SourceSizeStatus = "ok" | "warn" | "over";

export function getSourceSizeStatus(source: string): SourceSizeStatus {
  const length = source.length;
  if (length > MAX_SOURCE_CHARS) return "over";
  if (length > WARN_SOURCE_CHARS) return "warn";
  return "ok";
}

export function formatSourceSize(length: number): string {
  if (length < 1000) return `${length} chars`;
  return `${(length / 1000).toFixed(1)}k chars`;
}
