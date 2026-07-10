import type { Metadata } from "next";
import { RecordingAnalyzer } from "@/components/recording-analyzer";

// Quiet route for launch-asset screen recording — not a separate product flow.
// Opens EdgeLens with chrome stripped and the strongest demo pre-analyzed.

export const metadata: Metadata = {
  title: "EdgeLens — Recording",
  description:
    "Capture-friendly EdgeLens demo: AI-style component, missing states/a11y, live preview, and copyable fixes.",
  robots: {
    index: false,
    follow: false,
  },
};

/** Force static generation so the page module is always emitted into the build manifest. */
export const dynamic = "force-static";

export default function EdgeLensRecordPage() {
  return <RecordingAnalyzer />;
}
