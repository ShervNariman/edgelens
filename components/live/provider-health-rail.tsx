"use client";

import { cn } from "@/lib/utils";
import type { ProviderHealth, ProviderHealthStatus } from "@/lib/live/types";

const statusStyles: Record<ProviderHealthStatus, string> = {
  connected: "bg-[var(--color-ready-bg)] text-[var(--color-ready)]",
  degraded: "bg-[#f5e6c8] text-[#8a5a00]",
  stale: "bg-[var(--color-wash)] text-[var(--color-muted)]",
  error: "bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
  unknown: "bg-[var(--color-wash)] text-[var(--color-muted)]",
};

function statusLabel(status: ProviderHealthStatus): string {
  switch (status) {
    case "connected":
      return "Connected";
    case "degraded":
      return "Degraded";
    case "stale":
      return "Stale";
    case "error":
      return "Error";
    default:
      return "Unknown";
  }
}

export function ProviderHealthRail({ providers }: { providers: ProviderHealth[] }) {
  return (
    <section aria-labelledby="provider-health-title" className="space-y-3">
      <div>
        <h2
          id="provider-health-title"
          className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
        >
          Provider health
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Connected, degraded, and stale states — never shown as fresh when outdated.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <li
            key={provider.id}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]/90 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{provider.label}</p>
                <p className="mt-0.5 text-xs text-[var(--color-muted)] uppercase">
                  {provider.mode} mode
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide uppercase",
                  statusStyles[provider.status],
                )}
              >
                {statusLabel(provider.status)}
              </span>
            </div>
            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">{provider.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
