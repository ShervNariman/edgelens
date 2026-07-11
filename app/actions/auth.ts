"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  createOwnerSessionToken,
  sessionCookieOptions,
  verifyOwnerCredentials,
} from "@/lib/auth/session";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (!verifyOwnerCredentials(email, password)) {
    return { error: "Invalid owner credentials." };
  }

  const token = await createOwnerSessionToken(email);
  const jar = await cookies();
  const options = sessionCookieOptions(token);
  jar.set(options.name, options.value, options);

  redirect("/app");
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  redirect("/login");
}
