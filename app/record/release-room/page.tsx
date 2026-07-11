import type { Metadata } from "next";
import { AnalyzerApp } from "@/components/analyzer-app";
import {
  parseRecordingScenario,
  type RecordingScenarioId,
} from "@/lib/recording-scenarios";

/**
 * Quiet capture surface for launch stills and screen recording (SHE-64).
 * Seeded scenarios: ?scenario=blocked | ready | demo
 * No analytics activation events on /record/* routes.
 */

export const metadata: Metadata = {
  title: "EdgeLens — Release Room",
  description:
    "Capture-friendly EdgeLens release room: deterministic READY and BLOCKED scenarios for screenshots and demo recording.",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{ scenario?: string }>;
};

export default async function ReleaseRoomRecordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const scenario: RecordingScenarioId = parseRecordingScenario(params.scenario);

  return <AnalyzerApp mode="recording" scenario={scenario} />;
}
