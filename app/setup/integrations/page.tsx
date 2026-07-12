import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildSetupGuides,
  describeProviderModes,
  getIntegrationEnv,
} from "@/lib/release-room/integrations";

export const dynamic = "force-dynamic";

/**
 * Loop 1 setup UX — explicit permissions + connection test entry points.
 */
export default function IntegrationsSetupPage() {
  const env = getIntegrationEnv();
  const guides = buildSetupGuides(env);
  const modes = describeProviderModes(env);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Release Room · Loop 1
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Integration setup
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Configure GitHub, Linear, Vercel, and the editor/agent bridge with the
          required permissions. Run connection tests before enabling webhooks.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/api/integrations/test"
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Run connection tests
          </Link>
          <Link
            href="/api/integrations/health"
            className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium"
          >
            Open health JSON
          </Link>
          <Link
            href="/api/integrations/setup"
            className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium"
          >
            Setup API payload
          </Link>
        </div>
      </header>

      <section className="grid gap-4">
        {guides.map((guide) => (
          <Card key={`${guide.provider}-${guide.title}`}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-3 text-xl">
                <span>{guide.title}</span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {guide.configured ? "configured" : "not configured"}
                </span>
                <span className="rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
                  {modes[guide.provider as keyof typeof modes] ?? "disabled"}
                </span>
              </CardTitle>
              <CardDescription>{guide.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="mb-2 text-sm font-semibold">Required permissions</h2>
                <ul className="space-y-2 text-sm">
                  {guide.permissions.map((permission) => (
                    <li key={permission.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{permission.label}</span>
                        <span className="text-xs uppercase text-muted-foreground">
                          {permission.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {permission.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-sm">
                <p>
                  <span className="font-medium">Env: </span>
                  {guide.envVars.join(", ")}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Test: {guide.connectionTest}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
