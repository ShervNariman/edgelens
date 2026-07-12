import {
  githubLiveEnabled,
  githubWebhookConfigured,
  linearLiveEnabled,
  linearWebhookConfigured,
  vercelLiveEnabled,
  vercelWebhookConfigured,
  webhookConfigured,
  type IntegrationEnv,
  getIntegrationEnv,
} from "./config";
import type {
  ConnectionHealth,
  ConnectionProvider,
  ConnectionState,
} from "./types";

const PROVIDERS: ConnectionProvider[] = [
  "github",
  "linear",
  "vercel",
  "webhook",
  "editor",
];

function emptyState(
  provider: ConnectionProvider,
  configured: boolean
): ConnectionState {
  return {
    provider,
    health: configured ? "configured" : "not_configured",
    lastEventAt: null,
    lastEventId: null,
    lastEventType: null,
    lastSuccessAt: null,
    lastErrorAt: null,
    lastProbeAt: null,
    lastError: null,
    configured,
  };
}

/**
 * Tracks connection freshness, last event, and actionable error state per provider.
 * Reports configured / connected / stale / degraded / failed truthfully (SHE-94).
 */
export class ConnectionStateStore {
  private env: IntegrationEnv;
  private readonly states = new Map<ConnectionProvider, ConnectionState>();

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

  private isConfigured(provider: ConnectionProvider): boolean {
    switch (provider) {
      case "github":
        return githubWebhookConfigured(this.env) || githubLiveEnabled(this.env);
      case "linear":
        return linearWebhookConfigured(this.env) || linearLiveEnabled(this.env);
      case "vercel":
        return vercelWebhookConfigured(this.env) || vercelLiveEnabled(this.env);
      case "webhook":
        return webhookConfigured(this.env);
      case "editor":
        return Boolean(this.env.evidenceSecret || this.env.webhookSecret);
    }
  }

  get(provider: ConnectionProvider): ConnectionState {
    return (
      this.states.get(provider) ??
      emptyState(provider, this.isConfigured(provider))
    );
  }

  list(): ConnectionState[] {
    return PROVIDERS.map((provider) => this.get(provider));
  }

  recordSuccess(options: {
    provider: ConnectionProvider;
    eventId: string;
    eventType: string;
    at?: string;
  }): ConnectionState {
    const at = options.at ?? new Date().toISOString();
    const next: ConnectionState = {
      ...this.get(options.provider),
      health: "connected",
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
    provider: ConnectionProvider;
    code: string;
    message: string;
    eventId?: string | null;
    eventType?: string | null;
    at?: string;
    /** Soft failure — keep prior success visible as degraded */
    degraded?: boolean;
  }): ConnectionState {
    const at = options.at ?? new Date().toISOString();
    const current = this.get(options.provider);
    const next: ConnectionState = {
      ...current,
      health: options.degraded ? "degraded" : "failed",
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

  recordProbe(options: {
    provider: ConnectionProvider;
    health: ConnectionHealth;
    message: string;
    at?: string;
  }): ConnectionState {
    const at = options.at ?? new Date().toISOString();
    const current = this.get(options.provider);
    const next: ConnectionState = {
      ...current,
      health: options.health,
      lastProbeAt: at,
      lastError:
        options.health === "failed" || options.health === "degraded"
          ? { code: `probe_${options.health}`, message: options.message }
          : options.health === "connected"
            ? null
            : current.lastError,
      configured: this.isConfigured(options.provider),
    };
    this.states.set(options.provider, next);
    return next;
  }

  setChannelHealth(
    provider: ConnectionProvider,
    channels: NonNullable<ConnectionState["channels"]>
  ): ConnectionState {
    const current = this.get(provider);
    const next: ConnectionState = {
      ...current,
      channels: { ...current.channels, ...channels },
      configured: this.isConfigured(provider),
    };
    this.states.set(provider, next);
    return next;
  }

  /**
   * Mark connected providers as stale when last success exceeds maxAgeSeconds.
   * Failed / not_configured / configured (never connected) are left alone.
   */
  refreshStale(
    maxAgeSeconds: number,
    now: string | Date = new Date()
  ): ConnectionState[] {
    const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
    for (const provider of PROVIDERS) {
      const state = this.get(provider);
      if (!state.configured) {
        this.states.set(provider, {
          ...state,
          health: "not_configured",
        });
        continue;
      }
      if (state.health === "failed" || state.health === "degraded") continue;
      if (!state.lastSuccessAt) {
        if (state.health === "connected") {
          this.states.set(provider, { ...state, health: "configured" });
        }
        continue;
      }
      const age = (nowMs - Date.parse(state.lastSuccessAt)) / 1000;
      if (age > maxAgeSeconds && state.health === "connected") {
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
