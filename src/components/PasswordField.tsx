"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { checkPassword } from "@/lib/auth-flow";

export const inputClass =
  "w-full h-11 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-1)] px-3.5 text-[15px] text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--ring)]/25 disabled:opacity-60";

/** Password input with a show or hide toggle and an optional strength hint. */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  showStrength,
  autoFocus,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  disabled?: boolean;
  showStrength?: boolean;
  autoFocus?: boolean;
}) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const hintId = `${inputId}-hint`;
  const [visible, setVisible] = useState(false);
  const check = checkPassword(value);
  const bars = value ? Math.max(check.score, 0) : 0;
  const barColor =
    !check.ok ? "bg-[var(--danger)]" : check.score <= 1 ? "bg-[var(--warn)]" : "bg-[var(--accent)]";

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-[13px] font-semibold text-[var(--fg)]">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={autoComplete === "new-password" ? 10 : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-describedby={showStrength ? hintId : undefined}
          className={`${inputClass} pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={inputId}
          className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-r-xl text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
      {showStrength && (
        <div id={hintId} aria-live="polite">
          <div className="flex gap-1" aria-hidden>
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${value && (i <= bars || (!check.ok && i === 1)) ? barColor : "bg-[var(--surface-3)]"}`}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">
            {value ? (
              <>
                <span className="font-semibold text-[var(--fg)]">{check.label}.</span> {check.hint}
              </>
            ) : (
              "At least 10 characters. A short phrase is easy to remember and hard to guess."
            )}
          </p>
        </div>
      )}
    </div>
  );
}
