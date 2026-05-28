"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import {
  updateNotificationPrefs,
  type NotificationPrefs,
} from "../actions";

const TOGGLES: Array<{
  key: keyof Omit<NotificationPrefs, "email_digest">;
  label: string;
  hint: string;
}> = [
  { key: "new_match", label: "New match", hint: "AI matched you with another founder" },
  { key: "match_accepted", label: "Match accepted", hint: "Someone accepted your match" },
  { key: "new_message", label: "New message", hint: "Direct messages in your inbox" },
  { key: "new_reaction", label: "Post reactions", hint: "Someone reacted to your post" },
  { key: "new_comment", label: "Post comments", hint: "Someone replied to your post" },
  { key: "new_document", label: "Documents", hint: "NDA / contract sent to you" },
  { key: "document_signed", label: "Document signed", hint: "Your doc is fully signed" },
  { key: "new_review", label: "Reviews", hint: "Someone left you a review" },
];

const DIGEST_OPTIONS: Array<{
  value: NotificationPrefs["email_digest"];
  label: string;
}> = [
  { value: "off", label: "Off" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

export function NotificationPrefsForm({ initial }: { initial: NotificationPrefs }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggle(key: keyof NotificationPrefs, value: boolean) {
    setPrefs({ ...prefs, [key]: value });
    setSaved(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await updateNotificationPrefs(prefs);
      if (r.error) setError(r.error);
      else setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {TOGGLES.map((t) => (
          <label
            key={t.key}
            className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-sm text-[var(--fg)]">{t.label}</p>
              <p className="font-mono text-[10px] text-[var(--fg-subtle)] mt-0.5">
                {t.hint}
              </p>
            </div>
            <Toggle
              checked={Boolean(prefs[t.key])}
              onChange={(v) => toggle(t.key, v)}
              disabled={pending}
            />
          </label>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)] mb-2">
          Email digest
        </p>
        <div className="flex gap-2">
          {DIGEST_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                setPrefs({ ...prefs, email_digest: o.value });
                setSaved(false);
              }}
              disabled={pending}
              className={`press-shrink px-3 py-1.5 rounded-full text-xs border transition-colors ${
                prefs.email_digest === o.value
                  ? "border-[var(--accent)]/60 bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "border-[var(--border-strong)] bg-white/[0.02] text-[var(--fg-muted)] hover:text-[var(--fg)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="font-mono text-[10px] text-[var(--fg-subtle)] mt-2">
          Email delivery requires Supabase SMTP to be configured. Until then this is in-app only.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save preferences
        </button>
        {saved && <span className="text-xs text-[var(--accent)]">Saved</span>}
        {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-[var(--accent)]" : "bg-[var(--surface-3)]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
