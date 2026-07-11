import type { Metadata } from "next";
import { AnalyzerApp } from "@/components/analyzer-app";
import {
  parseRecordingScenario,
  type RecordingScenarioId,
} from "@/lib/recording-scenarios";

// Quiet route for launch-asset screen recording — not a separate product flow.
// Opens EdgeLens with chrome stripped and a seeded scenario pre-analyzed.
// Prefer /record/release-room for READY/BLOCKED capture; this route stays for
// existing launch docs and SHE-8 continuity.

export const metadata: Metadata = {
  title: "EdgeLens — Recording",
  description:
    "Capture-friendly EdgeLens demo: AI-style component, missing states/a11y, live preview, and copyable fixes.",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{ scenario?: string }>;
};

export default async function EdgeLensRecordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const scenario: RecordingScenarioId = parseRecordingScenario(
    params.scenario ?? "demo"
  );

  return <AnalyzerApp mode="recording" scenario={scenario} />;
}
