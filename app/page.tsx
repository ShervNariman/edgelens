import { ReleaseDashboard } from "@/components/release-room/release-dashboard";
import { ReleaseShell } from "@/components/release-room/release-shell";

export default function Home() {
  return (
    <ReleaseShell>
      <ReleaseDashboard />
    </ReleaseShell>
  );
}
