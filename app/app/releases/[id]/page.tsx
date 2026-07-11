import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ApprovalForm } from "@/components/approval-form";
import { DecisionBadge } from "@/components/decision-badge";
import { getSession } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { evaluateDecision } from "@/lib/policy/decision";
import { formatTimestamp } from "@/lib/utils";

export default async function ReleaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const db = getDatabase();
  const [workspace, release] = await Promise.all([db.getWorkspace(), db.getRelease(id)]);

  if (!release) {
    notFound();
  }

  const recomputed = evaluateDecision(release.evidence);

  return (
    <div className="min-h-screen">
      <AppHeader workspaceName={workspace.name} ownerEmail={session.email} />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <p className="mb-4 text-sm">
          <Link href="/app" className="text-[var(--color-accent)] hover:underline">
            ← All release candidates
          </Link>
        </p>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
              {release.title}
            </h1>
            <p className="mt-2 text-[var(--color-muted)]">
              {release.version} · {release.branch}
            </p>
          </div>
          <DecisionBadge decision={release.decision} />
        </div>

        <p className="mt-5 max-w-3xl text-lg text-[var(--color-ink-soft)]">
          {release.summary}
        </p>

        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Stored decision: {release.decision}. Policy recomputation: {recomputed}.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Evidence</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Engineering evidence includes CI, deployments, and approved editor/agent
            bridge submissions — not private editor telemetry.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {release.evidence.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]/90 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  <span className="text-xs font-semibold tracking-wide text-[var(--color-muted)] uppercase">
                    {item.source === "editor" ? "editor/agent" : item.source} ·{" "}
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                  {item.summary}
                </p>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  Collected {formatTimestamp(item.collectedAt)}
                  {item.url ? (
                    <>
                      {" · "}
                      <a
                        href={item.url}
                        className="text-[var(--color-accent)] hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open source
                      </a>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Approvals</h2>
            <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]/90 p-4">
              <ApprovalForm releaseId={release.id} />
            </div>
            <ul className="mt-4 flex flex-col gap-3">
              {release.approvals.length === 0 ? (
                <li className="text-sm text-[var(--color-muted)]">No approvals yet.</li>
              ) : (
                release.approvals.map((approval) => (
                  <li
                    key={approval.id}
                    className="rounded-lg border border-[var(--color-line)] bg-[var(--color-wash)]/70 p-3 text-sm"
                  >
                    <p className="font-medium">
                      {approval.kind} · {approval.actorEmail}
                    </p>
                    <p className="mt-1 text-[var(--color-ink-soft)]">{approval.note}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {formatTimestamp(approval.createdAt)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight">Audit trail</h2>
            <ol className="mt-4 flex flex-col gap-3">
              {[...release.audit].reverse().map((event) => (
                <li
                  key={event.id}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)]/90 p-3 text-sm"
                >
                  <p className="font-medium">
                    {event.action} · {event.actorEmail}
                  </p>
                  <p className="mt-1 text-[var(--color-ink-soft)]">{event.detail}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {formatTimestamp(event.at)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
    </div>
  );
}
