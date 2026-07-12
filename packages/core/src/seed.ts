/**
 * Deterministic Mulberry32 PRNG. Same seed always yields the same sequence.
 */
export function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher–Yates shuffle with a seeded RNG. Returns a new array; does not mutate input.
 */
export function seededOrder<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  const rng = createSeededRng(seed);
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const current = result[i];
    const swap = result[j];
    if (current === undefined || swap === undefined) {
      throw new Error("seededOrder encountered an unexpected hole in the array.");
    }
    result[i] = swap;
    result[j] = current;
  }
  return result;
}

export function parseSeed(value: string | number): number {
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0) {
      throw new TypeError("seed must be a non-negative integer.");
    }
    return value;
  }
  if (!/^\d+$/.test(value)) {
    throw new TypeError("seed must be a non-negative integer string.");
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new TypeError("seed must be a safe integer.");
  }
  return parsed;
}
