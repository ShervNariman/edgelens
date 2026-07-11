import { describe, expect, it } from "vitest";
import { createSessionToken, readSessionToken } from "@/lib/auth/token";

describe("session token", () => {
  it("round-trips a valid owner session", async () => {
    const secret = "test-session-secret-at-least-32-characters";
    const token = await createSessionToken(
      { email: "owner@release-room.local", role: "owner" },
      secret,
    );
    const session = await readSessionToken(token, secret);
    expect(session).toEqual({ email: "owner@release-room.local", role: "owner" });
  });

  it("rejects tampered tokens", async () => {
    const secret = "test-session-secret-at-least-32-characters";
    const token = await createSessionToken(
      { email: "owner@release-room.local", role: "owner" },
      secret,
    );
    const session = await readSessionToken(`${token}x`, secret);
    expect(session).toBeNull();
  });
});
