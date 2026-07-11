/**
 * File-backed live event + provider health store.
 * Separate from release DB so webhook/editor ingestion can append without
 * rewriting the whole candidate graph.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getEnv } from "@/lib/env";
import { LIVE_EVENT_LIMIT } from "@/lib/live/constants";
import { defaultProviderRecords, type ProviderRecord } from "@/lib/live/providers";
import type { LiveEvent, LiveProvider } from "@/lib/live/types";
import { newId } from "@/lib/db/seed";

export interface LiveState {
  providers: ProviderRecord[];
  events: LiveEvent[];
  updatedAt: string;
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

function filePath(): string {
  const env = getEnv();
  return path.join(env.DATA_DIR, "live-state.json");
}

function seedState(nowIso = new Date().toISOString()): LiveState {
  const providers = defaultProviderRecords(nowIso);
  const events: LiveEvent[] = [
    {
      id: newId("evt"),
      at: nowIso,
      kind: "system",
      provider: "system",
      title: "Live dashboard online",
      summary:
        "Snapshot endpoint ready. Provider fixtures healthy; editor awaiting first signed run.",
      actor: "system@release-room.local",
    },
    {
      id: newId("evt"),
      at: new Date(Date.parse(nowIso) - 90_000).toISOString(),
      kind: "provider_refresh",
      provider: "github",
      releaseId: "rc_blocked_001",
      title: "GitHub checks refreshed",
      summary: "Playwright e2e still failing on chromium smoke.",
      actor: "github-adapter",
    },
    {
      id: newId("evt"),
      at: new Date(Date.parse(nowIso) - 180_000).toISOString(),
      kind: "provider_refresh",
      provider: "linear",
      releaseId: "rc_ready_001",
      title: "Linear acceptance synced",
      summary: "SHE-58 foundation acceptance criteria marked complete.",
      actor: "linear-adapter",
    },
  ];

  return { providers, events, updatedAt: nowIso };
}

let memory: LiveState | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function load(): Promise<LiveState> {
  if (memory) return memory;

  const target = filePath();
  await ensureDir(path.dirname(target));

  try {
    const raw = await readFile(target, "utf8");
    memory = JSON.parse(raw) as LiveState;
    return memory;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
    memory = seedState();
    await persist(memory);
    return memory;
  }
}

async function persist(state: LiveState): Promise<void> {
  memory = state;
  const target = filePath();
  writeQueue = writeQueue.then(async () => {
    await ensureDir(path.dirname(target));
    await writeFile(target, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  });
  await writeQueue;
}

/** Test helper — clear memoized live state. */
export function resetLiveStoreCache(): void {
  memory = null;
}

export async function getLiveState(): Promise<LiveState> {
  return load();
}

export async function resetLiveState(): Promise<LiveState> {
  const state = seedState();
  await persist(state);
  return state;
}

export async function appendLiveEvent(
  event: Omit<LiveEvent, "id" | "at"> & { id?: string; at?: string },
): Promise<LiveEvent> {
  const state = await load();
  const at = event.at ?? new Date().toISOString();
  const next: LiveEvent = {
    id: event.id ?? newId("evt"),
    at,
    kind: event.kind,
    provider: event.provider,
    releaseId: event.releaseId,
    title: event.title,
    summary: event.summary,
    actor: event.actor,
  };

  const events = [next, ...state.events].slice(0, LIVE_EVENT_LIMIT);
  await persist({ ...state, events, updatedAt: at });
  return next;
}

export async function touchProvider(
  id: LiveProvider,
  input: {
    success: boolean;
    error?: string;
    mode?: "live" | "fixture";
    at?: string;
  },
): Promise<ProviderRecord> {
  const state = await load();
  const at = input.at ?? new Date().toISOString();
  const providers = state.providers.map((provider) => {
    if (provider.id !== id) return provider;
    return {
      ...provider,
      lastAttemptAt: at,
      lastSuccessAt: input.success ? at : provider.lastSuccessAt,
      lastError: input.success ? null : (input.error ?? "Provider error"),
      mode: input.mode ?? provider.mode,
    };
  });

  // Ensure provider exists if missing from older state files.
  if (!providers.some((p) => p.id === id)) {
    providers.push({
      id,
      lastAttemptAt: at,
      lastSuccessAt: input.success ? at : null,
      lastError: input.success ? null : (input.error ?? "Provider error"),
      mode: input.mode ?? "fixture",
    });
  }

  await persist({ ...state, providers, updatedAt: at });
  return providers.find((p) => p.id === id)!;
}
