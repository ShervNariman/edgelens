"use client";

import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/utils";
import type { LiveEvent } from "@/lib/live/types";

export function LiveActivityRail({ events }: { events: LiveEvent[] }) {
  return (
    <section aria-labelledby="activity-rail-title" className="space-y-3">
      <div>
        <h2
          id="activity-rail-title"
          className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
        >
          Live activity
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Provider refreshes and editor evidence — appears without a page reload.
        </p>
      </div>

      {events.length === 0 ? (
        <div
          role="status"
          className="rounded-xl border border-dashed border-[var(--color-line)] px-4 py-8 text-center text-sm text-[var(--color-muted)]"
        >
          No events yet. Incoming webhooks and editor runs land here.
        </div>
      ) : (
        <ol className="space-y-2">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]/90 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                    event.kind === "editor"
                      ? "bg-[#e4edf7] text-[#1d4f7a]"
                      : event.kind === "webhook"
                        ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                        : "bg-[var(--color-wash)] text-[var(--color-muted)]",
                  )}
                >
                  {event.kind}
                </span>
                <span className="text-xs text-[var(--color-muted)]">
                  {event.provider}
                  {event.releaseId ? ` · ${event.releaseId}` : ""}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-[var(--color-ink)]">
                {event.title}
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{event.summary}</p>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                {formatTimestamp(event.at)}
                {event.actor ? ` · ${event.actor}` : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
