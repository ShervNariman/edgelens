"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuditTimeline } from "@/components/release-room/audit-timeline";
import { DecisionPanel } from "@/components/release-room/decision-panel";
import { ManualEvidenceForm } from "@/components/release-room/manual-evidence-form";
import {
  DecisionBadge,
  EvidenceStatusBadge,
  RiskBadge,
} from "@/components/release-room/status-badges";
import {
  formatRelativeTime,
  formatTimestamp,
} from "@/lib/release-demo/decision";
import { useReleaseRoom } from "@/lib/release-demo/store";
import { useFeedback } from "@/components/release-room/feedback-toast";
import {
  DEMO_INTEGRATIONS,
  integrationHealthLabel,
} from "@/lib/release-demo/integrations";
import {
  EVIDENCE_GROUP_BLURBS,
  EVIDENCE_GROUP_LABELS,
  EVIDENCE_GROUP_ORDER,
  type EvidenceGroup,
  type EvidenceItem,
  type ReleaseCandidate,
} from "@/types/release";
import { cn } from "@/lib/utils";

function EvidenceRow({
  item,
  onMarkPass,
}: {
  item: EvidenceItem;
  onMarkPass: (id: string) => void;
}) {
  return (
    <li className="rounded-lg border border-[var(--rr-line)] bg-[var(--rr-surface-raised)] p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-[var(--rr-ink)]">
              {item.title}
            </h4>
            <EvidenceStatusBadge status={item.status} />
            {item.required ? (
              <span className="text-[11px] font-medium tracking-wide text-[var(--rr-muted)] uppercase">
                Required
              </span>
            ) : (
              <span className="text-[11px] font-medium tracking-wide text-[var(--rr-muted)] uppercase">
                Optional
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--rr-muted)]">{item.summary}</p>
        </div>
        {(item.status === "missing" || item.status === "fail") && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onMarkPass(item.id)}
            className="shrink-0"
          >
            <Check data-icon="inline-start" />
            Mark resolved
          </Button>
        )}
      </div>
      <dl className="mt-3 grid gap-2 text-xs text-[var(--rr-muted)] sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="font-medium text-[var(--rr-ink)]/70">Owner</dt>
          <dd>{item.owner}</dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--rr-ink)]/70">Source</dt>
          <dd>
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[var(--rr-ink)] underline decoration-[var(--rr-line)] underline-offset-2 hover:decoration-[var(--rr-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rr-focus)]"
              >
                {item.sourceLabel}
                <ExternalLink className="size-3" aria-hidden />
              </a>
            ) : (
              item.sourceLabel
            )}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--rr-ink)]/70">Collected</dt>
          <dd>
            <time dateTime={item.collectedAt}>
              {formatTimestamp(item.collectedAt)}
            </time>
          </dd>
        </div>
        <div>
          <dt className="font-medium text-[var(--rr-ink)]/70">Refreshed</dt>
          <dd>
            {item.refreshedAt ? (
              <time dateTime={item.refreshedAt}>
                {formatRelativeTime(item.refreshedAt)}
              </time>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>
    </li>
  );
}

function EvidenceGroupSection({
  group,
  items,
  onMarkPass,
}: {
  group: EvidenceGroup;
  items: EvidenceItem[];
  onMarkPass: (id: string) => void;
}) {
  const gaps = items.filter(
    (i) => i.required && (i.status === "fail" || i.status === "missing"),
  ).length;

  return (
    <section
      aria-labelledby={`group-${group}`}
      className="scroll-mt-24 space-y-3"
      id={`evidence-${group}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3
            id={`group-${group}`}
            className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
          >
            {EVIDENCE_GROUP_LABELS[group]}
          </h3>
          <p className="text-sm text-[var(--rr-muted)]">
            {EVIDENCE_GROUP_BLURBS[group]}
          </p>
        </div>
        {gaps > 0 ? (
          <span className="rounded-md bg-[var(--rr-blocked-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--rr-blocked)]">
            {gaps} blocker{gaps === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="rounded-md bg-[var(--rr-ready-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--rr-ready)]">
            Clear
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <EvidenceRow key={item.id} item={item} onMarkPass={onMarkPass} />
        ))}
      </ul>
    </section>
  );
}

function BlockerBanner({ release }: { release: ReleaseCandidate }) {
  if (release.status !== "BLOCKED" && release.blockers.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      role="status"
      aria-live="polite"
      className="rounded-xl border border-[var(--rr-blocked)]/25 bg-[var(--rr-blocked-bg)] p-4 sm:p-5"
    >
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--rr-blocked)] uppercase">
        Why this release is blocked
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm font-medium text-[var(--rr-ink)]">
        {release.blockers.map((blocker) => (
          <li key={blocker}>{blocker}</li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-[var(--rr-muted)]">
        Resolve each gap below, or use Approve with exception to waive with a
        recorded rationale.
      </p>
    </motion.div>
  );
}

function LiveIntegrationsStrip({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-labelledby="live-integrations-title"
      className={cn("rr-card p-4", compact && "p-3")}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="live-integrations-title"
            className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight"
          >
            Live integrations
          </h2>
          <p className="mt-0.5 text-sm text-[var(--rr-muted)]">
            Connection freshness for GitHub, Linear, Vercel, and editor evidence.
          </p>
        </div>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {DEMO_INTEGRATIONS.map((integration) => (
          <li
            key={integration.id}
            className="rounded-lg border border-[var(--rr-line)] bg-[var(--rr-surface-raised)] px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--rr-ink)]">
                {integration.name}
              </p>
              <span className="text-[11px] font-semibold text-[var(--rr-muted)]">
                {integrationHealthLabel(integration.health)}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--rr-muted)]">
              {integration.freshnessLabel}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EvidenceRoom({
  slug,
  showIntegrations = false,
}: {
  slug: string;
  showIntegrations?: boolean;
}) {
  const {
    getRelease,
    refreshEvidence,
    captureEvidence,
    updateEvidenceStatus,
    decide,
  } = useReleaseRoom();
  const feedback = useFeedback();
  const release = getRelease(slug);
  const [refreshing, setRefreshing] = useState(false);

  const grouped = useMemo(() => {
    if (!release) return [];
    return EVIDENCE_GROUP_ORDER.map((group) => ({
      group,
      items: release.evidence.filter((e) => e.group === group),
    })).filter((g) => g.items.length > 0);
  }, [release]);

  if (!release) {
    return (
      <div className="space-y-4 py-16 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          Release not found
        </h1>
        <p className="text-sm text-[var(--rr-muted)]">
          No candidate matches <span className="font-mono">{slug}</span>.
        </p>
        <Link
          href="/"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--rr-line)] bg-white px-3 text-sm font-medium hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rr-focus)]"
        >
          Back to candidates
        </Link>
      </div>
    );
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      refreshEvidence(release!.slug);
      await new Promise((r) => setTimeout(r, 450));
      feedback.push({
        tone: "success",
        title: "Evidence refreshed",
        detail: "Connected sources polled · audit event appended.",
      });
    } catch {
      feedback.push({
        tone: "error",
        title: "Refresh failed",
        detail: "Could not poll connected evidence sources.",
      });
    } finally {
      setRefreshing(false);
    }
  }

  function handleMarkPass(id: string) {
    try {
      updateEvidenceStatus(
        release!.slug,
        id,
        "pass",
        "Marked resolved in evidence room",
      );
      feedback.push({
        tone: "success",
        title: "Evidence updated",
        detail: "Status set to pass · decision recomputed.",
      });
    } catch {
      feedback.push({
        tone: "error",
        title: "Update failed",
        detail: "Evidence status was not changed.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--rr-muted)] transition-colors hover:text-[var(--rr-ink)]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All candidates
        </Link>
      </div>

      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <DecisionBadge status={release.status} />
          <RiskBadge risk={release.risk} />
          <span className="font-mono text-xs text-[var(--rr-muted)]">
            {release.id.toUpperCase()} · {release.version}
          </span>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
              {release.name}
            </h1>
            <p className="mt-2 text-sm text-[var(--rr-muted)] sm:text-base">
              {release.summary}
            </p>
            <p className="mt-2 text-xs text-[var(--rr-muted)]">
              {release.repository} · {release.branch}
              {release.prUrl ? (
                <>
                  {" · "}
                  <a
                    href={release.prUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-[var(--rr-line)] underline-offset-2 hover:decoration-[var(--rr-ink)]"
                  >
                    PR #{release.prNumber}
                  </a>
                </>
              ) : null}
              {" · "}
              Owner {release.owner}
              {" · "}
              Updated {formatRelativeTime(release.updatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-busy={refreshing}
            >
              <RefreshCw
                data-icon="inline-start"
                className={refreshing ? "animate-spin" : undefined}
              />
              Refresh evidence
            </Button>
          </div>
        </div>

        {release.riskClasses.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label="Risk classes">
            {release.riskClasses.map((cls) => (
              <li
                key={cls}
                className="rounded-md border border-[var(--rr-line)] bg-[var(--rr-surface-raised)] px-2 py-0.5 text-xs text-[var(--rr-ink)]"
              >
                {cls}
              </li>
            ))}
          </ul>
        ) : null}
      </motion.header>

      <BlockerBanner release={release} />

      {showIntegrations ? <LiveIntegrationsStrip /> : null}

      {release.warnings.length > 0 ? (
        <div className="rounded-xl border border-[var(--rr-warn)]/20 bg-[var(--rr-warn-bg)] p-4">
          <p className="text-xs font-semibold tracking-wide text-[var(--rr-warn)] uppercase">
            Warnings
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[var(--rr-ink)]">
            {release.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-8">
          <nav
            aria-label="Evidence groups"
            className="flex gap-2 overflow-x-auto pb-1"
          >
            {grouped.map(({ group }) => (
              <a
                key={group}
                href={`#evidence-${group}`}
                className="shrink-0 rounded-md border border-[var(--rr-line)] bg-[var(--rr-surface)] px-3 py-1.5 text-xs font-medium text-[var(--rr-ink)] transition-colors hover:border-[var(--rr-ink)]/30"
              >
                {EVIDENCE_GROUP_LABELS[group]}
              </a>
            ))}
          </nav>

          {grouped.map(({ group, items }) => (
            <EvidenceGroupSection
              key={group}
              group={group}
              items={items}
              onMarkPass={handleMarkPass}
            />
          ))}

          <ManualEvidenceForm
            onCapture={(input) => captureEvidence(release.slug, input)}
          />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <DecisionPanel
            onDecide={(action, rationale) =>
              decide(release.slug, action, rationale)
            }
          />
          <section aria-labelledby="activity-title" className="rr-card p-4">
            <h2
              id="activity-title"
              className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight"
            >
              Recent activity
            </h2>
            <ul className="mt-3 space-y-3">
              {release.recentActivity.map((item) => (
                <li key={item.id} className="text-sm">
                  <p className="font-medium text-[var(--rr-ink)]">
                    {item.summary}
                  </p>
                  <p className="text-xs text-[var(--rr-muted)]">
                    {item.actor} · {formatRelativeTime(item.at)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
          <AuditTimeline events={release.auditTrail} />
        </aside>
      </div>
    </div>
  );
}
