import { redirect } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { DecisionBadge } from "@/components/decision-badge";
import { getSession } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { formatTimestamp } from "@/lib/utils";

export default async function AppHomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const db = getDatabase();
  const [workspace, releases] = await Promise.all([db.getWorkspace(), db.listReleases()]);

  return (
    <div className="min-h-screen">
      <AppHeader workspaceName={workspace.name} ownerEmail={session.email} />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
            Release candidates
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
            Seeded private demo workspace with normalized evidence and deterministic READY
            / BLOCKED decisions.
          </p>
        </div>

        <ul className="flex flex-col gap-4">
          {releases.map((release) => (
            <li key={release.id}>
              <Link
                href={`/app/releases/${release.id}`}
                className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]/90 p-5 transition-colors hover:bg-[var(--color-wash)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">
                      {release.title}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {release.version} · {release.branch}
                    </p>
                  </div>
                  <DecisionBadge decision={release.decision} />
                </div>
                <p className="mt-3 text-[var(--color-ink-soft)]">{release.summary}</p>
                <p className="mt-4 text-xs text-[var(--color-muted)]">
                  Updated {formatTimestamp(release.updatedAt)} · {release.evidence.length}{" "}
                  evidence items
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
