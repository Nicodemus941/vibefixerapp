"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

function LoginInner() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/feed";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGithub() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-neutral-200 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Loop</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Sign in to claim your founder spot.
        </p>
        <button
          onClick={signInWithGithub}
          disabled={loading}
          className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Redirecting…" : "Continue with GitHub"}
        </button>
        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}
        <p className="mt-6 text-xs text-neutral-500 text-center">
          Reciprocity required. Every founder gives and receives.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
