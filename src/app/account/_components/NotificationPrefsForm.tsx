"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import {
  KIND_GROUPS,
  KIND_INFO,
  NOTIFICATION_KINDS,
  type NotificationKind,
  type ResolvedPref,
} from "@/lib/notification-kinds";
import {
  saveNotificationSettings,
  type NotificationSettingsState,
} from "../notification-actions";

export function NotificationPrefsForm({ initial }: { initial: NotificationSettingsState }) {
  const [prefs, setPrefs] = useState<Record<NotificationKind, ResolvedPref>>(initial.prefs);
  const [digest, setDigest] = useState(initial.digest);
  const [paused, setPaused] = useState(initial.paused);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function setPref(kind: NotificationKind, field: "inApp" | "email", value: boolean) {
    setPrefs((p) => ({ ...p, [kind]: { ...p[kind], [field]: value } }));
    setSaved(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await saveNotificationSettings({
        prefs: NOTIFICATION_KINDS.map((k) => ({ kind: k, inApp: prefs[k].inApp, email: prefs[k].email })),
        digest,
        paused,
      });
      if (r.error) setError(r.error);
      else setSaved(true);
    });
  }

  return (
    <div className="space-y-5">
      {initial.unsubscribed && paused && (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--warn-bg)] p-3 text-sm text-[var(--warn)]">
          You unsubscribed from Loop emails. Switch off &ldquo;Pause all emails&rdquo; and save to get them again.
        </p>
      )}

      <div className="space-y-2">
        <SwitchRow
          id="notif-pause"
          label="Pause all emails"
          hint="Stop every notification email. You still see everything in Loop."
          checked={paused}
          onChange={(v) => {
            setPaused(v);
            setSaved(false);
          }}
          disabled={pending}
        />
        <SwitchRow
          id="notif-digest"
          label="Email me a daily summary instead"
          hint="Comments, reactions, followers and reposts arrive as one email a day. Messages, mentions, replies, matches and deal updates still come right away."
          checked={digest}
          onChange={(v) => {
            setDigest(v);
            setSaved(false);
          }}
          disabled={pending || paused}
        />
      </div>

      {KIND_GROUPS.map((g) => (
        <fieldset key={g.group} className="space-y-2">
          <legend className="px-1 pb-1 text-[13px] font-semibold text-[var(--fg)]">{g.title}</legend>
          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            <div className="hidden sm:grid grid-cols-[1fr_72px_72px] items-center gap-2 bg-[var(--surface-2)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]" aria-hidden>
              <span>What happened</span>
              <span className="text-center">In app</span>
              <span className="text-center">Email</span>
            </div>
            <ul className="divide-y divide-[var(--border)]">
              {NOTIFICATION_KINDS.filter((k) => KIND_INFO[k].group === g.group).map((k) => {
                const info = KIND_INFO[k];
                return (
                  <li key={k} className="grid grid-cols-1 gap-2 px-3 py-3 sm:grid-cols-[1fr_72px_72px] sm:items-center">
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--fg)]">{info.label}</p>
                      <p className="text-xs text-[var(--fg-muted)]">{info.hint}</p>
                    </div>
                    <div className="flex gap-6 sm:contents">
                      <div className="flex items-center gap-2 sm:justify-center">
                        <Toggle
                          label={`${info.label} in app`}
                          checked={prefs[k].inApp}
                          onChange={(v) => setPref(k, "inApp", v)}
                          disabled={pending}
                        />
                        <span className="text-xs text-[var(--fg-muted)] sm:hidden" aria-hidden>In app</span>
                      </div>
                      <div className="flex items-center gap-2 sm:justify-center">
                        <Toggle
                          label={`${info.label} by email`}
                          checked={prefs[k].email && !paused}
                          onChange={(v) => setPref(k, "email", v)}
                          disabled={pending || paused}
                        />
                        <span className="text-xs text-[var(--fg-muted)] sm:hidden" aria-hidden>Email</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="press-shrink inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          Save notification settings
        </button>
        <span aria-live="polite" className="text-sm">
          {saved && <span className="text-[var(--accent-text)]">Saved</span>}
          {error && <span className="text-[var(--danger)]">{error}</span>}
        </span>
      </div>
    </div>
  );
}

function SwitchRow({
  id,
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-sm font-semibold text-[var(--fg)]">{label}</p>
        <p id={`${id}-hint`} className="mt-0.5 text-xs text-[var(--fg-muted)]">{hint}</p>
      </div>
      <Toggle labelledBy={`${id}-label`} describedBy={`${id}-hint`} checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
  labelledBy,
  describedBy,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className="relative inline-flex h-11 w-12 shrink-0 items-center justify-center disabled:opacity-40"
    >
      <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-[var(--accent)]" : "bg-[var(--surface-3)] ring-1 ring-inset ring-[var(--border-strong)]"}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--surface-1)] shadow transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
