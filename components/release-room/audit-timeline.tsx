"use client";

import { motion } from "framer-motion";
import type { AuditEvent } from "@/types/release";
import { formatTimestamp } from "@/lib/release-demo/decision";

const KIND_LABEL: Record<AuditEvent["kind"], string> = {
  created: "Created",
  evidence_refreshed: "Evidence refreshed",
  evidence_captured: "Evidence captured",
  status_recomputed: "Status recomputed",
  approved: "Approved",
  blocked: "Blocked",
  approved_with_exception: "Approved w/ exception",
  note: "Note",
};

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  const ordered = [...events].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  return (
    <section
      aria-labelledby="audit-title"
      className="rr-card p-4 sm:p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="audit-title"
          className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight"
        >
          Audit trail
        </h2>
        <p className="text-xs font-medium tracking-wide text-[var(--rr-muted)] uppercase">
          Immutable ledger
        </p>
      </div>
      <p className="mt-1 text-sm text-[var(--rr-muted)]">
        Append-only history of evidence changes and release decisions.
      </p>

      <ol className="relative mt-5 space-y-0 border-l border-[var(--rr-line)] pl-5">
        {ordered.map((event, index) => (
          <motion.li
            key={event.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.25 }}
            className="relative pb-5 last:pb-0"
          >
            <span
              className="absolute top-1.5 -left-[1.4rem] size-2.5 rounded-sm bg-[var(--rr-ink)] ring-4 ring-[var(--rr-surface)]"
              aria-hidden
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-black/[0.04] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[var(--rr-ink)] uppercase">
                {KIND_LABEL[event.kind]}
              </span>
              <time
                dateTime={event.at}
                className="font-mono text-[11px] text-[var(--rr-muted)]"
              >
                {formatTimestamp(event.at)}
              </time>
            </div>
            <p className="mt-1.5 text-sm font-medium text-[var(--rr-ink)]">
              {event.summary}
            </p>
            <p className="mt-0.5 text-xs text-[var(--rr-muted)]">
              {event.actor}
              {event.detail ? ` · ${event.detail}` : ""}
            </p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
