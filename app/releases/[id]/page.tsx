import { EvidenceRoom } from "@/components/release-room/evidence-room";
import { ReleaseShell } from "@/components/release-room/release-shell";

export default async function ReleaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ReleaseShell>
      <EvidenceRoom slug={id} />
    </ReleaseShell>
  );
}
