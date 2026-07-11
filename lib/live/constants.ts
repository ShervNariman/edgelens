/** Live dashboard timing and freshness constants (SHE-71). */

export const LIVE_POLL_INTERVAL_MS = 5_000;

/** Mark snapshot UI stale when last successful fetch is older than this. */
export const LIVE_CLIENT_STALE_AFTER_MS = 20_000;

/** Provider last-success older than this → stale. */
export const PROVIDER_STALE_AFTER_MS = 15 * 60_000;

/** Provider last-success older than this but younger than stale → degraded. */
export const PROVIDER_DEGRADED_AFTER_MS = 5 * 60_000;

export const LIVE_EVENT_LIMIT = 40;

export const PROVIDER_LABELS: Record<string, string> = {
  github: "GitHub",
  linear: "Linear",
  vercel: "Vercel",
  editor: "Editor / agent",
  webhook: "Webhooks",
};
