/**
 * In-memory registry of known release candidates for Loop 1 matching.
 * Prevents silent attachment of webhook evidence to the wrong candidate.
 */

import { SEEDED_BLOCKED_RELEASE, SEEDED_RELEASE } from "./fixtures";
import type { ReleaseRef } from "./types";

export class ReleaseRegistry {
  private readonly byId = new Map<string, ReleaseRef>();

  constructor(seed: ReleaseRef[] = [SEEDED_RELEASE, SEEDED_BLOCKED_RELEASE]) {
    for (const release of seed) {
      this.register(release);
    }
  }

  register(release: ReleaseRef): void {
    this.byId.set(release.id, { ...release });
  }

  unregister(id: string): boolean {
    return this.byId.delete(id);
  }

  get(id: string): ReleaseRef | undefined {
    return this.byId.get(id);
  }

  list(): ReleaseRef[] {
    return [...this.byId.values()];
  }

  clear(seedDefaults = true): void {
    this.byId.clear();
    if (seedDefaults) {
      this.register(SEEDED_RELEASE);
      this.register(SEEDED_BLOCKED_RELEASE);
    }
  }

  /** Replace all candidates (tests). */
  replaceAll(releases: ReleaseRef[]): void {
    this.byId.clear();
    for (const release of releases) {
      this.register(release);
    }
  }
}

export const defaultReleaseRegistry = new ReleaseRegistry();
