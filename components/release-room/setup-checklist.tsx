"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  PlugZap,
  Sparkles,
} from "lucide-react";
import {
  DEMO_INTEGRATIONS,
  FIRST_RUN_CHECKLIST,
  integrationHealthLabel,
  setupProgress,
  type IntegrationHealth,
} from "@/lib/release-demo/integrations";
import { DEMO_WORKSPACE } from "@/lib/release-demo/seed";
import { cn } from "@/lib/utils";

function healthTone(health: IntegrationHealth): string {
  switch (health) {
    case "connected":
      return "bg-[var(--rr-ready-bg)] text-[var(--rr-ready)]";
    case "stale":
      return "bg-[var(--rr-warn-bg)] text-[var(--rr-warn)]";
    case "error":
      return "bg-[var(--rr-blocked-bg)] text-[var(--rr-blocked)]";
    case "needs_setup":
      return "bg-[var(--rr-info-bg)] text-[var(--rr-info)]";
  }
}

export function SetupChecklist() {
  const progress = setupProgress();

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rr-card overflow-hidden"
        aria-labelledby="setup-hero-title"
      >
        <div className="border-b border-[var(--rr-line)] bg-[var(--rr-ink)] px-5 py-7 text-[var(--rr-paper)] sm:px-8 sm:py-8">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--rr-paper)]/65 uppercase">
            First-run setup
          </p>
          <h1
            id="setup-hero-title"
            className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Connect evidence sources
          </h1>
          <p className="mt-3 max-w-xl text-sm text-[var(--rr-paper)]/75 sm:text-base">
            Workspace connections live server-side. This checklist never asks
            for tokens in the browser — only connection health and next steps
            for {DEMO_WORKSPACE}.
          </p>
          <p className="mt-4 text-sm text-[var(--rr-paper)]/65">
            Progress {progress.done} of {progress.total}
          </p>
        </div>

        <ol className="divide-y divide-[var(--rr-line)]">
          {FIRST_RUN_CHECKLIST.map((item, index) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 text-[var(--rr-muted-soft)]" aria-hidden>
                  {item.done ? (
                    <CheckCircle2 className="size-5 text-[var(--rr-ready)]" />
                  ) : (
                    <Circle className="size-5" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--rr-ink)]">
                    <span className="mr-2 font-mono text-xs text-[var(--rr-muted-soft)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--rr-muted)]">
                    {item.detail}
                  </p>
                </div>
              </div>
              {item.href ? (
                <Link
                  href={item.href}
                  className="inline-flex h-7 shrink-0 items-center justify-center rounded-lg border border-[var(--rr-line)] bg-[var(--rr-surface)] px-2.5 text-[0.8rem] font-medium hover:bg-black/[0.03]"
                >
                  {item.done ? "View" : "Continue"}
                </Link>
              ) : null}
            </li>
          ))}
        </ol>
      </motion.section>

      <section aria-labelledby="integrations-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="integrations-title"
              className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight"
            >
              Integration checklist
            </h2>
            <p className="mt-1 text-sm text-[var(--rr-muted)]">
              Live adapters plus editor/agent evidence CLI — health only, no
              secrets.
            </p>
          </div>
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--rr-muted)]">
            <PlugZap className="size-3.5" aria-hidden />
            Installable connections
          </p>
        </div>

        <ul className="grid gap-3 lg:grid-cols-2">
          {DEMO_INTEGRATIONS.map((integration, index) => (
            <motion.li
              key={integration.id}
              id={`integration-${integration.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index, duration: 0.3 }}
              className="rr-card scroll-mt-24 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                    {integration.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--rr-muted)]">
                    {integration.blurb}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-semibold",
                    healthTone(integration.health),
                  )}
                >
                  {integrationHealthLabel(integration.health)}
                </span>
              </div>
              <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-[var(--rr-ink)]/70">Account</dt>
                  <dd className="text-[var(--rr-muted)]">
                    {integration.accountLabel}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-[var(--rr-ink)]/70">Freshness</dt>
                  <dd className="text-[var(--rr-muted)]">
                    {integration.freshnessLabel}
                  </dd>
                </div>
              </dl>
              <ol className="mt-4 list-decimal space-y-1.5 pl-4 text-sm text-[var(--rr-ink)]">
                {integration.setupSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              {integration.id === "editor" ? (
                <p className="mt-4 inline-flex items-start gap-2 rounded-lg bg-[var(--rr-info-bg)] px-3 py-2 text-xs text-[var(--rr-info)]">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  Cursor, Codex, and Claude Code submit signed runs through the
                  evidence CLI — keys stay on the server.
                </p>
              ) : null}
            </motion.li>
          ))}
        </ul>

        <p className="text-xs text-[var(--rr-muted)]">
          Need a quiet capture surface?{" "}
          <Link
            href="/record/release-room"
            className="inline-flex items-center gap-1 font-medium text-[var(--rr-ink)] underline decoration-[var(--rr-line)] underline-offset-2 hover:decoration-[var(--rr-ink)]"
          >
            Open the recording route
            <ExternalLink className="size-3" aria-hidden />
          </Link>
        </p>
      </section>
    </div>
  );
}
