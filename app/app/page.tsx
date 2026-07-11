import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { LiveDashboard } from "@/components/live/live-dashboard";
import { getSession } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";

export default async function AppHomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const db = getDatabase();
  const workspace = await db.getWorkspace();

  return (
    <div className="min-h-screen">
      <AppHeader workspaceName={workspace.name} ownerEmail={session.email} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <LiveDashboard workspaceName={workspace.name} ownerEmail={session.email} />
      </main>
    </div>
  );
}
