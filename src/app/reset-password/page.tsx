"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { LoopMark } from "@/components/LoopMark";
import { NewPasswordForm } from "@/components/NewPasswordForm";

// Reached from a password reset email. /auth/callback has already turned
// the link into a session, so updateUser() can set the new password.
export default function ResetPasswordPage() {
  const [state, setState] = useState<"checking" | "ready" | "no_session" | "done">("checking");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setState(data.user ? "ready" : "no_session");
    });
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--fg)] px-4 py-10">
      <Link href="/" aria-label="Loop home" className="mb-6 inline-flex min-h-11 items-center gap-2 text-xl font-bold tracking-[-0.02em] rounded-lg">
        <LoopMark size={30} />
        Loop
      </Link>
      <div className="surface-card w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-[24px] font-bold leading-tight tracking-[-0.025em]">
          {state === "done" ? "Password updated" : "Choose a new password"}
        </h1>

        {state === "checking" && (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--fg-muted)]" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Checking your link…
          </p>
        )}

        {state === "no_session" && (
          <>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              This reset link has expired or was already used. Request a new one and open it on this device.
            </p>
            <Link
              href="/forgot-password"
              className="press-shrink mt-6 inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 text-[15px] font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)]"
            >
              Send a new link
            </Link>
          </>
        )}

        {state === "ready" && (
          <>
            <p className="mt-2 mb-6 text-sm text-[var(--fg-muted)]">
              Use at least 10 characters. You will stay signed in on this device.
            </p>
            <NewPasswordForm submitLabel="Save new password" onDone={() => setState("done")} />
          </>
        )}

        {state === "done" && (
          <>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              You are all set. Use your new password next time you sign in.
            </p>
            <Link
              href="/feed"
              className="press-shrink mt-6 inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 text-[15px] font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)]"
            >
              Go to your feed
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
