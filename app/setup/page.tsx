import { ReleaseShell } from "@/components/release-room/release-shell";
import { SetupChecklist } from "@/components/release-room/setup-checklist";

export const metadata = {
  title: "Setup — Release Room",
  description:
    "First-run setup and workspace integration checklist for Release Room.",
};

export default function SetupPage() {
  return (
    <ReleaseShell>
      <SetupChecklist />
    </ReleaseShell>
  );
}
