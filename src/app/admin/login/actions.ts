"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  checkCredentials,
  makeToken,
} from "../../lib/auth";

export type LoginState = { ok: boolean; error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!checkCredentials(username, password)) {
    return { ok: false, error: "Wrong username or password." };
  }

  const token = await makeToken();
  const jar = await cookies();
  jar.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.delete(AUTH_COOKIE_NAME);
  redirect("/admin/login");
}
