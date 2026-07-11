import {
  githubWebhookConfigured,
  linearWebhookConfigured,
  vercelWebhookConfigured,
  webhookConfigured,
  type IntegrationEnv,
  getIntegrationEnv,
} from "./config";
import type {
  ConnectionHealth,
  ConnectionState,
  NativeProvider,
} from "./types";

const PROVIDERS: Array<NativeProvider | "webhook"> = [
  "github",
  "linear",
  "vercel",
  "webhook",
];

function emptyState(
  provider: NativeProvider | "webhook",
  configured: boolean
): ConnectionState {
  return {
    provider,
    health: "never",
    lastEventAt: null,
    lastEventId: null,
    lastEventType: null,
    lastSuccessAt: null,
    lastErrorAt: null,
    lastError: null,
    configured,
  };
}

/**
 * Tracks connection freshness, last event, and actionable error state per provider.
 */
export class ConnectionStateStore {
  private env: IntegrationEnv;
  private readonly states = new Map<NativeProvider | "webhook", ConnectionState>();

  constructor(env: IntegrationEnv = getIntegrationEnv()) {
    this.env = env;
    this.resetFromEnv(env);
  }

  resetFromEnv(env: IntegrationEnv = this.env): void {
    this.env = env;
    for (const provider of PROVIDERS) {
      this.states.set(provider, emptyState(provider, this.isConfigured(provider)));
    }
  }

  private isConfigured(provider: NativeProvider | "webhook"): boolean {
    switch (provider) {
      case "github":
        return githubWebhookConfigured(this.env);
      case "linear":
        return linearWebhookConfigured(this.env);
      case "vercel":
        return vercelWebhookConfigured(this.env);
      case "webhook":
        return webhookConfigured(this.env);
    }
  }

  get(provider: NativeProvider | "webhook"): ConnectionState {
    return (
      this.states.get(provider) ??
      emptyState(provider, this.isConfigured(provider))
    );
  }

  list(): ConnectionState[] {
    return PROVIDERS.map((provider) => this.get(provider));
  }

  recordSuccess(options: {
    provider: NativeProvider | "webhook";
    eventId: string;
    eventType: string;
    at?: string;
  }): ConnectionState {
    const at = options.at ?? new Date().toISOString();
    const next: ConnectionState = {
      ...this.get(options.provider),
      health: "healthy",
      lastEventAt: at,
      lastEventId: options.eventId,
      lastEventType: options.eventType,
      lastSuccessAt: at,
      lastError: null,
      configured: this.isConfigured(options.provider),
    };
    this.states.set(options.provider, next);
    return next;
  }

  recordError(options: {
    provider: NativeProvider | "webhook";
    code: string;
    message: string;
    eventId?: string | null;
    eventType?: string | null;
    at?: string;
  }): ConnectionState {
    const at = options.at ?? new Date().toISOString();
    const current = this.get(options.provider);
    const next: ConnectionState = {
      ...current,
      health: "error",
      lastEventAt: options.eventId ? at : current.lastEventAt,
      lastEventId: options.eventId ?? current.lastEventId,
      lastEventType: options.eventType ?? current.lastEventType,
      lastErrorAt: at,
      lastError: { code: options.code, message: options.message },
      configured: this.isConfigured(options.provider),
    };
    this.states.set(options.provider, next);
    return next;
  }

  /**
   * Mark healthy connections as stale when last success exceeds maxAgeSeconds.
   */
  refreshStale(
    maxAgeSeconds: number,
    now: string | Date = new Date()
  ): ConnectionState[] {
    const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
    for (const provider of PROVIDERS) {
      const state = this.get(provider);
      if (!state.lastSuccessAt || state.health === "error") continue;
      const age = (nowMs - Date.parse(state.lastSuccessAt)) / 1000;
      if (age > maxAgeSeconds) {
        this.states.set(provider, {
          ...state,
          health: "stale" as ConnectionHealth,
        });
      }
    }
    return this.list();
  }

  clear(): void {
    this.resetFromEnv(this.env);
  }
}

export const defaultConnectionStateStore = new ConnectionStateStore();
