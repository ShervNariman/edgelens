"use client";

import { AnalyzerApp } from "@/components/analyzer-app";

/**
 * Thin client boundary for /record/edgelens.
 * Keeps the route page module small and stable for production static generation
 * without changing AnalyzerApp or /analyzer behavior.
 */
export function RecordingAnalyzer() {
  return <AnalyzerApp mode="recording" />;
}
