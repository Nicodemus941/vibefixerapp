"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function UserMenu({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!email) {
    return (
      <Link href="/auth/sign-in" className="ak-btn ak-btn-ghost border">
        Sign in
      </Link>
    );
  }

  const initials = email[0]?.toUpperCase() ?? "U";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand)] text-sm font-semibold text-white"
        aria-label="Open user menu"
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white p-2 shadow-lg">
          <div className="border-b px-3 py-2 text-xs text-[var(--color-ink-muted)]">
            {email}
          </div>
          <Link
            href="/account"
            className="block rounded px-3 py-2 text-sm hover:bg-[var(--color-bg)]"
            onClick={() => setOpen(false)}
          >
            Account
          </Link>
          <Link
            href="/saved"
            className="block rounded px-3 py-2 text-sm hover:bg-[var(--color-bg)]"
            onClick={() => setOpen(false)}
          >
            Saved cars
          </Link>
          <Link
            href="/messages"
            className="block rounded px-3 py-2 text-sm hover:bg-[var(--color-bg)]"
            onClick={() => setOpen(false)}
          >
            Messages
          </Link>
          <button
            onClick={async () => {
              const supabase = createSupabaseBrowserClient();
              await supabase.auth.signOut();
              setOpen(false);
              router.refresh();
              router.push("/");
            }}
            className="block w-full rounded px-3 py-2 text-left text-sm text-[var(--color-bad)] hover:bg-[var(--color-bad-soft)]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
