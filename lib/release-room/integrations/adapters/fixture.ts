import { buildFixtureEvidence } from "../fixtures";
import type {
  AdapterContext,
  AdapterResult,
  EvidenceAdapter,
} from "../types";

/**
 * Explicit fixture adapter — always returns seeded demo evidence.
 * Used when credentials are absent or RELEASE_ROOM_FORCE_FIXTURES=true.
 */
export class FixtureAdapter implements EvidenceAdapter {
  readonly provider = "fixture" as const;

  isLiveConfigured(): boolean {
    return false;
  }

  async collect(ctx: AdapterContext): Promise<AdapterResult> {
    const evidence = buildFixtureEvidence(ctx.release);
    return {
      provider: "fixture",
      mode: "fixture",
      evidence,
      note: "Fixture adapter refreshed seeded demo evidence.",
    };
  }
}
