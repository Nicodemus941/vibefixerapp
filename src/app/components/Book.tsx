"use client";
import { useState } from "react";

const REASONS = [
  "New patient consult",
  "Become a member",
  "Same-day sick visit",
  "Refill / prescription",
  "Hormone therapy",
  "Weight loss / GLP-1",
  "Executive physical",
  "Aesthetics / Accufit",
  "Functional medicine",
  "Other",
];

export default function Book() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle",
  );
  const [reason, setReason] = useState(REASONS[0]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          phone: fd.get("phone"),
          email: fd.get("email"),
          reason,
          notes: fd.get("notes"),
        }),
      });
      setStatus(res.ok ? "ok" : "err");
      if (res.ok) e.currentTarget.reset();
    } catch {
      setStatus("err");
    }
  }

  return (
    <section
      id="book"
      className="relative py-20 sm:py-28 bg-gradient-to-b from-[#0d0c0a] to-black"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--gold)]">
              Apply for membership
            </p>
            <h2 className="mt-3 font-black uppercase leading-[0.95] tracking-tight text-4xl sm:text-5xl">
              Lock in this month’s
              <br />
              <span className="text-[var(--gold)]">rate &amp; spot.</span>
            </h2>
            <p className="mt-4 text-white/80">
              We cap our roster to keep care personal. Submit the form — Dr.
              Monica or Dr. Richard will call you within one business day to
              walk you through next steps.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              {[
                "30-day money-back promise",
                "No long-term contracts",
                "HSA / FSA itemized superbills",
                "Couples & family pricing available",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-[var(--gold)]">★</span>
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                Prefer to talk?
              </div>
              <a
                href="tel:+14076637447"
                className="mt-1 block text-2xl font-black text-[var(--gold)]"
              >
                (407) 663-7447
              </a>
              <div className="mt-1 text-xs text-white/60">
                Mon–Fri 8a–6p · Sat 9a–1p · Sun on-call for members
              </div>
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 sm:p-8"
          >
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-tr from-[var(--gold)]/25 via-transparent to-white/5 blur-2xl -z-10" />
            <h3 className="text-xl font-black uppercase tracking-tight">
              Apply now
            </h3>
            <p className="mt-1 text-xs text-white/55">
              Takes ~60 seconds. We respond same business day.
            </p>

            <div className="mt-5 grid gap-3">
              <Field label="Your name" name="name" required />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Phone" name="phone" type="tel" required />
                <Field label="Email" name="email" type="email" required />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                  What brings you in?
                </label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {REASONS.map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setReason(r)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        reason === r
                          ? "bg-[var(--gold)] text-black border-[var(--gold)]"
                          : "border-white/15 text-white/70 hover:border-[var(--gold)]/50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <Field
                label="Anything we should know? (optional)"
                name="notes"
                textarea
              />

              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 inline-flex items-center justify-center rounded-full bg-[var(--gold)] py-4 text-sm font-black uppercase tracking-wider text-black hover:bg-[var(--gold-bright)] disabled:opacity-60 transition"
              >
                {status === "loading"
                  ? "Sending…"
                  : status === "ok"
                    ? "Got it ✓ We’ll call you shortly"
                    : "Reserve My Spot →"}
              </button>

              {status === "err" && (
                <p className="text-xs text-rose-300">
                  Something hiccuped. Please call (407) 663-7447 — we’ll take
                  care of you.
                </p>
              )}

              <p className="text-[11px] text-white/50">
                By submitting, you agree to our privacy policy. We never sell
                your info. HIPAA-grade handling.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  textarea = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  const cls =
    "mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/30 transition";
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
        {label}
      </span>
      {textarea ? (
        <textarea
          name={name}
          rows={3}
          className={cls}
          placeholder="Symptoms, goals, preferred times…"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          className={cls}
          placeholder={
            type === "email"
              ? "you@email.com"
              : type === "tel"
                ? "(407) 555-0100"
                : "Jane Doe"
          }
          autoComplete={
            name === "email"
              ? "email"
              : name === "phone"
                ? "tel"
                : name === "name"
                  ? "name"
                  : "off"
          }
        />
      )}
    </label>
  );
}
