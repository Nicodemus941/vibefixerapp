"use client";

import { useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HandHeart, Loader2, Send, Sparkles, X } from "lucide-react";
import { HELP_LINE_MIN, validateHelpLine } from "@/lib/cold-dm";
import { Turnstile } from "@/components/Turnstile";
import { sendMessage, type DmStatus } from "../actions";

const MAX = 4000;

export function MessageComposer({
  conversationId,
  initialDraft,
  dm,
  counterpartyName,
  humanCheck = false,
}: {
  conversationId: string;
  initialDraft?: string | null;
  /** Set only before the first message to someone new. */
  dm?: DmStatus | null;
  counterpartyName?: string;
  /** Show Turnstile before the member's first message ever. */
  humanCheck?: boolean;
}) {
  const [body, setBody] = useState(initialDraft ?? "");
  const [helpLine, setHelpLine] = useState("");
  const [draftBanner, setDraftBanner] = useState(Boolean(initialDraft));
  const [error, setError] = useState<string | null>(null);
  const [humanToken, setHumanToken] = useState<string | null>(null);
  const [humanDone, setHumanDone] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const helpRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const ids = useId();

  const cold = Boolean(dm?.isCold);
  const name = counterpartyName ?? "them";

  if (cold && dm && !dm.hasOffer) {
    return (
      <div className="mb-3 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--fg)]">
          <HandHeart className="h-4 w-4 text-[var(--accent)]" aria-hidden />
          Give first
        </p>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          To message someone new on Loop, list at least one thing you can do for others. {name} will
          see it with your note.
        </p>
        <Link
          href="/onboarding"
          className="press-shrink mt-3 inline-flex h-11 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)]"
        >
          Add an offer
        </Link>
      </div>
    );
  }

  if (cold && dm && dm.coldLeftToday <= 0) {
    return (
      <div className="mb-3 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-4 text-sm text-[var(--fg-muted)]" role="status">
        You have started 10 new conversations today. You can start more tomorrow. Replies in
        conversations you already have are not limited.
      </div>
    );
  }

  const helpProblem = cold ? validateHelpLine(helpLine) : null;
  const needToken = humanCheck && !humanDone;
  const canSend = (cold ? !helpProblem : Boolean(body.trim())) && (!needToken || Boolean(humanToken));

  function submit() {
    if (pending) return;
    if (cold && helpProblem) {
      setError(helpProblem);
      helpRef.current?.focus();
      return;
    }
    const text = body.trim();
    if (!cold && !text) return;
    setError(null);
    const fd = new FormData();
    fd.set("conversation_id", conversationId);
    fd.set("body", text);
    if (needToken && humanToken) fd.set("turnstile_token", humanToken);
    if (cold) {
      fd.set("help_line", helpLine);
      if (dm?.topOffer) fd.set("offer_id", dm.topOffer.id);
    }
    startTransition(async () => {
      const r = await sendMessage(fd);
      if (r.error) {
        setError(r.error);
        // A Turnstile token works once. Get a fresh one for the retry.
        if (needToken) setResetKey((k) => k + 1);
        return;
      }
      if (needToken) setHumanDone(true);
      setBody("");
      setHelpLine("");
      setDraftBanner(false);
      router.refresh();
      requestAnimationFrame(() => textareaRef.current?.focus());
    });
  }

  function discard() {
    setBody("");
    setDraftBanner(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  return (
    <div className="space-y-2">
      {draftBanner && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-[var(--shipped-bg)] px-3 py-1.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--shipped-fg)]">
            <Sparkles className="h-3 w-3" />
            Loop drafted an intro. Edit it before sending
          </p>
          <button
            type="button"
            onClick={discard}
            aria-label="Discard draft"
            className="press-shrink text-[var(--shipped-fg)] hover:text-[var(--fg)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {cold && (
        <div className="space-y-1.5">
          <label htmlFor={`${ids}-help`} className="block text-[13px] font-semibold text-[var(--fg)]">
            How can you help them?
          </label>
          <input
            ref={helpRef}
            id={`${ids}-help`}
            value={helpLine}
            onChange={(e) => setHelpLine(e.target.value.slice(0, 300))}
            required
            minLength={HELP_LINE_MIN}
            aria-describedby={`${ids}-help-hint`}
            aria-invalid={Boolean(error && helpProblem)}
            placeholder="I set up cold email for two B2B SaaS teams this quarter and can..."
            disabled={pending}
            className="w-full h-11 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-1)] px-3.5 text-[15px] text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <p id={`${ids}-help-hint`} className="text-xs text-[var(--fg-subtle)]">
            This is your first line. Lead with what you can do for {name}, not what you want.{" "}
            {dm?.topOffer && (
              <>
                They will also see your offer{" "}
                <span className="font-semibold text-[var(--offer-fg)]">{dm.topOffer.title}</span>.{" "}
              </>
            )}
            <span className="num">{dm?.coldLeftToday ?? 0}</span> new conversation
            {dm?.coldLeftToday === 1 ? "" : "s"} left today.
          </p>
        </div>
      )}

      {needToken && (
        <div className="space-y-1">
          <p className="text-xs text-[var(--fg-subtle)]">
            One quick check before your first message, to keep Loop free of bots.
          </p>
          <Turnstile onToken={setHumanToken} resetKey={resetKey} />
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX))}
          placeholder={cold ? "Add more if you like (optional)" : "Message…"}
          aria-label={cold ? "More details, optional" : "Message"}
          rows={1}
          className="flex-1 resize-none bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl px-4 py-2.5 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] max-h-40"
          disabled={pending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 160) + "px";
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend || pending}
          aria-label="Send message"
          className="press-shrink shrink-0 inline-flex items-center justify-center h-11 w-11 rounded-full bg-[var(--accent)] text-[var(--fg-on-accent)] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-[filter]"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
