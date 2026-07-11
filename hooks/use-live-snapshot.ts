"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveSnapshot } from "@/lib/live/types";

export type LiveFetchStatus = "idle" | "loading" | "ready" | "error";

export interface UseLiveSnapshotResult {
  snapshot: LiveSnapshot | null;
  status: LiveFetchStatus;
  error: string | null;
  /** Client-side: data older than staleAfterMs without a successful fetch. */
  clientStale: boolean;
  paused: boolean;
  lastFetchedAt: number | null;
  nextRefreshAt: number | null;
  pause: () => void;
  resume: () => void;
  refresh: () => Promise<void>;
}

async function fetchSnapshot(signal?: AbortSignal): Promise<LiveSnapshot> {
  const response = await fetch("/api/internal/snapshot", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(body?.message ?? `Snapshot failed (${response.status})`);
  }
  return (await response.json()) as LiveSnapshot;
}

/**
 * Visibility-aware polling for the live founder command center.
 * Pauses when the document is hidden or the user opts out.
 */
export function useLiveSnapshot(): UseLiveSnapshotResult {
  const [snapshot, setSnapshot] = useState<LiveSnapshot | null>(null);
  const [status, setStatus] = useState<LiveFetchStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [nextRefreshAt, setNextRefreshAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const inFlight = useRef(false);
  const snapshotRef = useRef<LiveSnapshot | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const pollIntervalMs = snapshot?.pollIntervalMs ?? 5_000;
  const staleAfterMs = snapshot?.staleAfterMs ?? 20_000;

  const runFetch = useCallback(async (reason: "poll" | "manual" | "resume") => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (reason === "manual" || snapshotRef.current === null) {
      setStatus((prev) => (prev === "ready" ? prev : "loading"));
    }

    try {
      const next = await fetchSnapshot();
      setSnapshot(next);
      setError(null);
      setStatus("ready");
      const fetchedAt = Date.now();
      setLastFetchedAt(fetchedAt);
      setNextRefreshAt(fetchedAt + next.pollIntervalMs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Snapshot request failed");
      setStatus((prev) => (prev === "ready" ? "ready" : "error"));
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void runFetch("poll");
  }, [runFetch]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !pausedRef.current) {
        void runFetch("resume");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [runFetch]);

  useEffect(() => {
    if (paused) {
      setNextRefreshAt(null);
      return;
    }

    const tick = window.setInterval(() => {
      setNow(Date.now());
      if (document.visibilityState !== "visible") return;
      void runFetch("poll");
    }, pollIntervalMs);

    return () => window.clearInterval(tick);
  }, [paused, pollIntervalMs, runFetch]);

  const pause = useCallback(() => {
    setPaused(true);
    setNextRefreshAt(null);
  }, []);

  const resume = useCallback(() => {
    setPaused(false);
    void runFetch("resume");
  }, [runFetch]);

  const refresh = useCallback(async () => {
    await runFetch("manual");
  }, [runFetch]);

  const clientStale = lastFetchedAt !== null && now - lastFetchedAt > staleAfterMs;

  return {
    snapshot,
    status,
    error,
    clientStale,
    paused,
    lastFetchedAt,
    nextRefreshAt,
    pause,
    resume,
    refresh,
  };
}
