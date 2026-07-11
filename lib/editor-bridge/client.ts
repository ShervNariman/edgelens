import {
  canonicalizeJson,
  formatSignatureHeader,
  signBody,
} from "@/lib/editor-bridge/sign";
import { EDITOR_BRIDGE_LIMITS, EditorBridgeError } from "@/lib/editor-bridge/types";
import type { EditorEvidencePayload } from "@/lib/editor-bridge/types";

export interface DeliverOptions {
  endpoint: string;
  secret: string;
  payload: EditorEvidencePayload;
  /** When true, do not POST — return the signed body only. */
  dryRun?: boolean;
  /** When true, skip network and return offline JSON only. */
  offline?: boolean;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

export interface DeliverResult {
  ok: boolean;
  status: number;
  body: unknown;
  dryRun: boolean;
  offline: boolean;
  signedBody: string;
  signatureHeader: string;
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sign and deliver an editor/agent evidence payload to the generic endpoint.
 * Retries transient failures with exponential backoff.
 */
export async function deliverEditorEvidence(
  options: DeliverOptions,
): Promise<DeliverResult> {
  const signedBody = canonicalizeJson(options.payload);
  const signature = signBody(signedBody, options.secret);
  const signatureHeader = formatSignatureHeader(signature);

  if (options.offline || options.dryRun) {
    return {
      ok: true,
      status: 0,
      body: {
        mode: options.offline ? "offline" : "dry-run",
        endpoint: options.endpoint,
        payload: options.payload,
        signatureHeader,
      },
      dryRun: Boolean(options.dryRun),
      offline: Boolean(options.offline),
      signedBody,
      signatureHeader,
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  let lastError: EditorBridgeError | null = null;

  for (let attempt = 0; attempt <= EDITOR_BRIDGE_LIMITS.maxRetries; attempt += 1) {
    try {
      const response = await fetchImpl(options.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-release-room-signature": signatureHeader,
          accept: "application/json",
        },
        body: signedBody,
      });

      const text = await response.text();
      let parsed: unknown = text;
      if (text) {
        try {
          parsed = JSON.parse(text) as unknown;
        } catch {
          parsed = { raw: text };
        }
      }

      if (response.ok) {
        return {
          ok: true,
          status: response.status,
          body: parsed,
          dryRun: false,
          offline: false,
          signedBody,
          signatureHeader,
        };
      }

      const retryable = response.status >= 500 || response.status === 429;
      lastError = new EditorBridgeError(
        "evidence_delivery_failed",
        `Evidence endpoint returned HTTP ${response.status}.`,
        response.status,
        typeof parsed === "object" && parsed
          ? (parsed as Record<string, unknown>)
          : { body: parsed },
      );

      if (!retryable || attempt === EDITOR_BRIDGE_LIMITS.maxRetries) {
        throw lastError;
      }
    } catch (error) {
      if (error instanceof EditorBridgeError && error.status < 500 && error.status !== 429) {
        throw error;
      }
      lastError =
        error instanceof EditorBridgeError
          ? error
          : new EditorBridgeError(
              "evidence_delivery_network",
              error instanceof Error ? error.message : "Network delivery failed.",
              503,
            );
      if (attempt === EDITOR_BRIDGE_LIMITS.maxRetries) {
        throw lastError;
      }
    }

    await sleep(250 * 2 ** attempt);
  }

  throw (
    lastError ??
    new EditorBridgeError(
      "evidence_delivery_failed",
      "Evidence delivery failed after retries.",
      503,
    )
  );
}
