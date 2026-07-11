"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useReleaseRoom } from "@/lib/release-demo/store";
import {
  formatRelativeTime,
  statusTone,
} from "@/lib/release-demo/decision";
import { DecisionBadge, RiskBadge } from "@/components/release-room/status-badges";
import type { ReleaseCandidate, ReleaseDecisionStatus } from "@/types/release";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | ReleaseDecisionStatus;

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "BLOCKED", label: "Blocked" },
  { id: "WARNING", label: "Warning" },
  { id: "READY", label: "Ready" },
];

function StatusIcon({ status }: { status: ReleaseCandidate["status"] }) {
  if (status === "BLOCKED") {
    return <ShieldAlert className="size-5 text-[var(--rr-blocked)]" aria-hidden />;
  }
  if (status === "WARNING") {
    return <AlertTriangle className="size-5 text-[var(--rr-warn)]" aria-hidden />;
  }
  return <CheckCircle2 className="size-5 text-[var(--rr-ready)]" aria-hidden />;
}

function ReleaseRow({
  release,
  index,
}: {
  release: ReleaseCandidate;
  index: number;
}) {
  const tone = statusTone(release.status);
  const primarySignal =
    release.blockers[0] ??
    release.warnings[0] ??
    "All required evidence present";

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3, ease: "easeOut" }}
    >
      <Link
        href={`/releases/${release.slug}`}
        className="group rr-card relative block overflow-hidden transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-[var(--rr-ink)]/20"
      >
        <span
          className={`absolute inset-y-0 left-0 w-1 ${tone.barClassName}`}
          aria-hidden
        />
        <div className="flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-start sm:justify-between sm:p-5 sm:pl-6">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <DecisionBadge status={release.status} />
              <RiskBadge risk={release.risk} />
              <span className="font-mono text-xs text-[var(--rr-muted)]">
                {release.id.toUpperCase()} · {release.version}
              </span>
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--rr-ink)] sm:text-2xl">
                {release.name}
              </h2>
              <p className="mt-1 text-sm text-[var(--rr-muted)]">
                {release.repository} · {release.branch}
                {release.prNumber ? ` · PR #${release.prNumber}` : ""}
              </p>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <StatusIcon status={release.status} />
              <p className="leading-snug text-[var(--rr-ink)]">
                <span className="font-medium">
                  {release.status === "BLOCKED"
                    ? "Why blocked: "
                    : release.status === "WARNING"
                      ? "Watch: "
                      : "Clear: "}
                </span>
                {primarySignal}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <p className="text-xs text-[var(--rr-muted)]">
              Updated {formatRelativeTime(release.updatedAt)}
              <span className="mx-1.5 text-[var(--rr-line)]">·</span>
              {release.owner}
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--rr-ink)] opacity-80 transition-opacity group-hover:opacity-100">
              Open evidence room
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.li>
  );
}

function EmptyState({
  hasReleases,
  query,
  filter,
  onClear,
}: {
  hasReleases: boolean;
  query: string;
  filter: StatusFilter;
  onClear: () => void;
}) {
  if (!hasReleases) {
    return (
      <div className="rr-card px-5 py-14 text-center">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
          No release candidates yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--rr-muted)]">
          Connect GitHub, Linear, and Vercel in Setup, then open a PR-linked
          candidate to start collecting evidence.
        </p>
        <Link
          href="/setup"
          className="mt-5 inline-flex h-9 items-center justify-center rounded-lg bg-[var(--rr-ink)] px-4 text-sm font-medium text-[var(--rr-paper)]"
        >
          Go to setup
        </Link>
      </div>
    );
  }

  return (
    <div className="rr-card px-5 py-14 text-center">
      <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
        No matches
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--rr-muted)]">
        Nothing matched
        {query ? (
          <>
            {" "}
            <span className="font-medium text-[var(--rr-ink)]">
              &ldquo;{query}&rdquo;
            </span>
          </>
        ) : null}
        {filter !== "all" ? (
          <>
            {" "}
            in <span className="font-medium text-[var(--rr-ink)]">{filter}</span>
          </>
        ) : null}
        . Try another status or clear filters.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 inline-flex h-9 items-center justify-center rounded-lg border border-[var(--rr-line)] bg-[var(--rr-surface)] px-4 text-sm font-medium hover:bg-black/[0.03]"
      >
        Clear filters
      </button>
    </div>
  );
}

export function ReleaseDashboard() {
  const { releases } = useReleaseRoom();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const blocked = releases.filter((r) => r.status === "BLOCKED").length;
  const ready = releases.filter((r) => r.status === "READY").length;
  const warning = releases.filter((r) => r.status === "WARNING").length;
  const hero = releases.find((r) => r.status === "BLOCKED") ?? releases[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return releases.filter((release) => {
      if (filter !== "all" && release.status !== filter) return false;
      if (!q) return true;
      const haystack = [
        release.name,
        release.id,
        release.slug,
        release.version,
        release.repository,
        release.branch,
        release.owner,
        ...release.blockers,
        ...release.warnings,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [releases, query, filter]);

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rr-hero relative overflow-hidden rounded-2xl border border-[var(--rr-line)] bg-[var(--rr-ink)] px-5 py-7 text-[var(--rr-paper)] sm:px-8 sm:py-9"
        aria-labelledby="dashboard-hero-title"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 85% 20%, rgba(232, 120, 74, 0.35), transparent 55%), radial-gradient(ellipse 50% 50% at 10% 90%, rgba(74, 144, 226, 0.25), transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative max-w-2xl space-y-4">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--rr-paper)]/70 uppercase">
            Evidence-backed go / no-go
          </p>
          <h1
            id="dashboard-hero-title"
            className="font-[family-name:var(--font-display)] text-3xl leading-[1.1] font-semibold tracking-tight sm:text-4xl"
          >
            Release Room
          </h1>
          <p className="max-w-xl text-base text-[var(--rr-paper)]/80 sm:text-lg">
            See why a release is blocked in seconds — then resolve missing
            evidence or explicitly waive it with an audit trail.
          </p>
          {hero ? (
            <p className="text-sm text-[var(--rr-paper)]/65">
              Demo focus:{" "}
              <Link
                href={`/releases/${hero.slug}`}
                className="font-medium text-[var(--rr-paper)] underline decoration-[var(--rr-paper)]/35 underline-offset-4 hover:decoration-[var(--rr-paper)]"
              >
                {hero.id.toUpperCase()} · {hero.name}
              </Link>{" "}
              is {hero.status.toLowerCase()}
              {hero.blockers[0] ? ` — ${hero.blockers[0]}` : ""}.
            </p>
          ) : null}
        </div>
      </motion.section>

      <section aria-labelledby="candidate-list-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="candidate-list-title"
              className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight"
            >
              Release candidates
            </h2>
            <p className="mt-1 text-sm text-[var(--rr-muted)]">
              Filter by status or search name, repo, owner, and signals.
            </p>
          </div>
          <dl className="flex flex-wrap gap-2 text-xs font-medium">
            <div className="rounded-md bg-[var(--rr-blocked-bg)] px-2.5 py-1 text-[var(--rr-blocked)]">
              <dt className="sr-only">Blocked</dt>
              <dd>{blocked} blocked</dd>
            </div>
            <div className="rounded-md bg-[var(--rr-warn-bg)] px-2.5 py-1 text-[var(--rr-warn)]">
              <dt className="sr-only">Warning</dt>
              <dd>{warning} warning</dd>
            </div>
            <div className="rounded-md bg-[var(--rr-ready-bg)] px-2.5 py-1 text-[var(--rr-ready)]">
              <dt className="sr-only">Ready</dt>
              <dd>{ready} ready</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search releases</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--rr-muted-soft)]"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search candidates…"
              className="h-10 w-full rounded-xl border border-[var(--rr-line)] bg-[var(--rr-surface)] pr-3 pl-10 text-sm outline-none placeholder:text-[var(--rr-muted-soft)] focus-visible:border-[var(--rr-focus)]"
            />
          </label>
          <div
            className="flex flex-wrap gap-1 rounded-xl border border-[var(--rr-line)] bg-[var(--rr-surface)] p-1"
            role="group"
            aria-label="Filter by status"
          >
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                aria-pressed={filter === item.id}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  filter === item.id
                    ? "bg-[var(--rr-ink)] text-[var(--rr-paper)]"
                    : "text-[var(--rr-muted)] hover:bg-black/[0.04] hover:text-[var(--rr-ink)]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            hasReleases={releases.length > 0}
            query={query}
            filter={filter}
            onClear={() => {
              setQuery("");
              setFilter("all");
            }}
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((release, index) => (
              <ReleaseRow key={release.id} release={release} index={index} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
