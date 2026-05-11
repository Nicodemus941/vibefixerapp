import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "../env";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) =>
        cookieStore.set({ name, value, ...options }),
      remove: (name: string, options: CookieOptions) =>
        cookieStore.set({ name, value: "", ...options }),
    },
  });
}
