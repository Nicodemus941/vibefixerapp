"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface NotifPrefs {
  notif_email_digest: "off" | "daily" | "weekly";
  notif_new_offer: boolean;
  notif_new_message: boolean;
  notif_price_drops: boolean;
  notif_saved_search_alerts: boolean;
}

export function NotifPrefsForm({ initial }: { initial: NotifPrefs }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotifPrefs>(initial);
  const [savedPrefs, setSavedPrefs] = useState<NotifPrefs>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );

  const dirty =
    JSON.stringify(prefs) !== JSON.stringify(savedPrefs);

  function set<K extends keyof NotifPrefs>(k: K, v: NotifPrefs[K]) {
    setPrefs((p) => ({ ...p, [k]: v }));
  }

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
        .update(prefs)
        .eq("id", user.id);
      if (error) {
        setMsg({ kind: "err", text: error.message });
        return;
      }
      setSavedPrefs(prefs);
      setMsg({ kind: "ok", text: "Preferences saved." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
          Email digest
        </label>
        <select
          className="ak-input mt-2 w-full max-w-xs"
          value={prefs.notif_email_digest}
          onChange={(e) =>
            set("notif_email_digest", e.target.value as NotifPrefs["notif_email_digest"])
          }
        >
          <option value="off">Off</option>
          <option value="daily">Daily summary</option>
          <option value="weekly">Weekly summary (recommended)</option>
        </select>
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          A roll-up of new offers, messages, and price drops.
        </p>
      </div>

      <Toggle
        label="New offer on my listing"
        description="Send an email the moment a buyer makes an offer."
        checked={prefs.notif_new_offer}
        onChange={(v) => set("notif_new_offer", v)}
      />
      <Toggle
        label="New message"
        description="Notify me when someone replies in a conversation."
        checked={prefs.notif_new_message}
        onChange={(v) => set("notif_new_message", v)}
      />
      <Toggle
        label="Price drops on saved cars"
        description="Alert me when a car I've saved drops in price."
        checked={prefs.notif_price_drops}
        onChange={(v) => set("notif_price_drops", v)}
      />
      <Toggle
        label="Saved search matches"
        description="Notify me when a new listing matches one of my saved searches."
        checked={prefs.notif_saved_search_alerts}
        onChange={(v) => set("notif_saved_search_alerts", v)}
      />

      <div className="flex items-center gap-2">
        <button
          disabled={!dirty || pending}
          onClick={save}
          className="ak-btn ak-btn-primary text-sm disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save preferences"}
        </button>
        {dirty && (
          <button
            onClick={() => setPrefs(savedPrefs)}
            className="ak-btn ak-btn-ghost text-sm"
          >
            Cancel
          </button>
        )}
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
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-[var(--color-brand)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-[var(--color-ink-muted)]">
          {description}
        </span>
      </span>
    </label>
  );
}
