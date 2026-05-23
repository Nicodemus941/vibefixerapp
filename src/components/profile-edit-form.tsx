"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ProfileEditForm({
  initialName,
  email,
  emailVerified,
}: {
  initialName: string;
  email: string;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const [resendBusy, setResendBusy] = useState(false);

  function save() {
    start(async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setMsg({ kind: "err", text: "Not signed in" });
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name.trim() })
        .eq("id", user.id);
      if (error) {
        setMsg({ kind: "err", text: error.message });
        return;
      }
      setSavedName(name.trim());
      setMsg({ kind: "ok", text: "Profile saved." });
      router.refresh();
    });
  }

  async function resendVerify() {
    setResendBusy(true);
    setMsg(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    });
    setResendBusy(false);
    if (error) setMsg({ kind: "err", text: error.message });
    else
      setMsg({
        kind: "ok",
        text: `Verification email re-sent to ${email}.`,
      });
  }

  const dirty = name.trim() !== savedName.trim() && name.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
          Full name
        </label>
        <input
          className="ak-input mt-2 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="mt-2 flex gap-2">
          <button
            disabled={!dirty || pending}
            onClick={save}
            className="ak-btn ak-btn-primary text-sm disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save name"}
          </button>
          {dirty && (
            <button
              onClick={() => setName(savedName)}
              className="ak-btn ak-btn-ghost text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
          Email
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            className="ak-input w-full max-w-sm bg-[var(--color-bg)]"
            value={email}
            disabled
          />
          {emailVerified ? (
            <span className="rounded bg-[var(--color-good-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--color-good)]">
              Verified
            </span>
          ) : (
            <button
              onClick={resendVerify}
              disabled={resendBusy}
              className="ak-btn ak-btn-ghost border text-sm disabled:opacity-50"
            >
              {resendBusy ? "Sending…" : "Resend verification email"}
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
          To change your email, contact{" "}
          <a
            href="mailto:help@carworldusa.com"
            className="text-[var(--color-brand)] hover:underline"
          >
            help@carworldusa.com
          </a>
          .
        </p>
      </div>

      <PasswordSection />

      {msg && (
        <p
          className={`text-sm ${
            msg.kind === "ok"
              ? "text-[var(--color-good)]"
              : "text-[var(--color-bad)]"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}

function PasswordSection() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );

  async function save() {
    setMsg(null);
    if (pw.length < 8) {
      setMsg({ kind: "err", text: "Password must be at least 8 characters." });
      return;
    }
    if (pw !== pw2) {
      setMsg({ kind: "err", text: "Passwords don't match." });
      return;
    }
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setMsg({ kind: "err", text: error.message });
    else {
      setMsg({ kind: "ok", text: "Password updated." });
      setPw("");
      setPw2("");
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
        Change password
      </label>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input
          className="ak-input"
          type="password"
          placeholder="New password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <input
          className="ak-input"
          type="password"
          placeholder="Confirm new password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
        />
      </div>
      <div className="mt-2">
        <button
          disabled={busy || !pw}
          onClick={save}
          className="ak-btn ak-btn-primary text-sm disabled:opacity-50"
        >
          {busy ? "Updating…" : "Update password"}
        </button>
      </div>
      {msg && (
        <p
          className={`mt-2 text-xs ${
            msg.kind === "ok"
              ? "text-[var(--color-good)]"
              : "text-[var(--color-bad)]"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
