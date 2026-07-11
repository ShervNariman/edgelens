/**
 * Provider freshness — connected / degraded / stale / error.
 * Never reports "connected" when the last success is outside the window.
 */

import {
  PROVIDER_DEGRADED_AFTER_MS,
  PROVIDER_LABELS,
  PROVIDER_STALE_AFTER_MS,
} from "@/lib/live/constants";
import type {
  LiveProvider,
  ProviderHealth,
  ProviderHealthStatus,
} from "@/lib/live/types";

export interface ProviderRecord {
  id: LiveProvider;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastError: string | null;
  mode: "live" | "fixture";
}

export function evaluateProviderHealth(
  record: ProviderRecord,
  nowIso: string,
): ProviderHealth {
  const nowMs = Date.parse(nowIso);
  const lastSuccessMs = record.lastSuccessAt ? Date.parse(record.lastSuccessAt) : null;
  const label = PROVIDER_LABELS[record.id] ?? record.id;

  if (record.lastError && !lastSuccessMs) {
    return {
      id: record.id,
      label,
      status: "error",
      lastSuccessAt: record.lastSuccessAt,
      lastAttemptAt: record.lastAttemptAt,
      detail: record.lastError,
      mode: record.mode,
    };
  }

  if (!lastSuccessMs || Number.isNaN(lastSuccessMs)) {
    return {
      id: record.id,
      label,
      status: "unknown",
      lastSuccessAt: record.lastSuccessAt,
      lastAttemptAt: record.lastAttemptAt,
      detail: "No successful observation yet.",
      mode: record.mode,
    };
  }

  const age = nowMs - lastSuccessMs;
  let status: ProviderHealthStatus = "connected";
  let detail = "Receiving evidence within freshness window.";

  if (age >= PROVIDER_STALE_AFTER_MS) {
    status = "stale";
    detail = `No successful update for ${Math.round(age / 60_000)}m — data may be outdated.`;
  } else if (age >= PROVIDER_DEGRADED_AFTER_MS || record.lastError) {
    status = "degraded";
    detail = record.lastError
      ? `Last error: ${record.lastError}`
      : `Last success ${Math.round(age / 60_000)}m ago — nearing stale.`;
  }

  return {
    id: record.id,
    label,
    status,
    lastSuccessAt: record.lastSuccessAt,
    lastAttemptAt: record.lastAttemptAt,
    detail,
    mode: record.mode,
  };
}

export function defaultProviderRecords(nowIso: string): ProviderRecord[] {
  const providers: LiveProvider[] = ["github", "linear", "vercel", "editor", "webhook"];

  return providers.map((id) => {
    // Seeded fixture providers look recently healthy except editor (idle).
    if (id === "editor") {
      return {
        id,
        lastSuccessAt: null,
        lastAttemptAt: null,
        lastError: null,
        mode: "fixture" as const,
      };
    }
    if (id === "webhook") {
      return {
        id,
        lastSuccessAt: nowIso,
        lastAttemptAt: nowIso,
        lastError: null,
        mode: "fixture" as const,
      };
    }
    return {
      id,
      lastSuccessAt: nowIso,
      lastAttemptAt: nowIso,
      lastError: null,
      mode: "fixture" as const,
    };
  });
}
