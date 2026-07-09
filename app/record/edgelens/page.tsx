import type { Metadata } from "next";
import { AnalyzerApp } from "@/components/analyzer-app";

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

export default function EdgeLensRecordPage() {
  return <AnalyzerApp mode="recording" />;
}
