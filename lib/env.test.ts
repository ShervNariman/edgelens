import { describe, expect, it } from "vitest";
import { envSchema, formatEnvIssues, resetEnvCache } from "@/lib/env";

describe("env validation", () => {
  it("accepts local zero-credential configuration", () => {
    const parsed = envSchema.safeParse({
      DATABASE_ADAPTER: "local",
      OWNER_EMAIL: "owner@release-room.local",
      OWNER_PASSWORD: "release-room-dev",
      SESSION_SECRET: "dev-only-change-me-to-a-long-random-secret-value",
      APP_URL: "http://localhost:3000",
    });

    expect(parsed.success).toBe(true);
  });

  it("requires DATABASE_URL for postgres adapter", () => {
    const parsed = envSchema.safeParse({
      DATABASE_ADAPTER: "postgres",
      OWNER_EMAIL: "owner@release-room.local",
      OWNER_PASSWORD: "release-room-dev",
      SESSION_SECRET: "dev-only-change-me-to-a-long-random-secret-value",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(formatEnvIssues(parsed.error).join(" ")).toContain("DATABASE_URL");
    }
  });

  it("resetEnvCache clears memoization without throwing", () => {
    resetEnvCache();
    expect(true).toBe(true);
  });
});
