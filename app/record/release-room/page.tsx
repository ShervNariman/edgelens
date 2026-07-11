import type { Metadata } from "next";
import { EvidenceRoom } from "@/components/release-room/evidence-room";
import { ReleaseShell } from "@/components/release-room/release-shell";

// Quiet route for launch / progress recordings — chrome stripped,
// blocked candidate with live integrations + editor evidence in view.

export const metadata: Metadata = {
  title: "Release Room — Recording",
  description:
    "Capture-friendly Release Room: live integrations, editor evidence, and a blocked go / no-go story.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReleaseRoomRecordPage() {
  return (
    <ReleaseShell recording>
      <EvidenceRoom slug="rc-104" showIntegrations />
    </ReleaseShell>
  );
}
