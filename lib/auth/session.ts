import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import {
  SESSION_COOKIE,
  createSessionToken,
  readSessionToken,
  sessionCookieOptions,
  type SessionPayload,
} from "@/lib/auth/token";

export {
  SESSION_COOKIE,
  createSessionToken,
  readSessionToken,
  sessionCookieOptions,
  type SessionPayload,
};

function secretsEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    createHmac("sha256", "length-check").update(left).digest();
    createHmac("sha256", "length-check").update(right).digest();
    return false;
  }
  return timingSafeEqual(left, right);
}

export function verifyOwnerCredentials(email: string, password: string): boolean {
  const env = getEnv();
  return (
    secretsEqual(email.trim().toLowerCase(), env.OWNER_EMAIL.toLowerCase()) &&
    secretsEqual(password, env.OWNER_PASSWORD)
  );
}

export async function createOwnerSessionToken(email: string): Promise<string> {
  return createSessionToken(
    { email: email.trim().toLowerCase(), role: "owner" },
    getEnv().SESSION_SECRET,
  );
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value, getEnv().SESSION_SECRET);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
