"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { sendMessage } from "../actions";

const MAX = 4000;

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  function submit() {
    const text = body.trim();
    if (!text || pending) return;
    const fd = new FormData();
    fd.set("conversation_id", conversationId);
    fd.set("body", text);
    startTransition(async () => {
      await sendMessage(fd);
      setBody("");
      router.refresh();
      requestAnimationFrame(() => textareaRef.current?.focus());
    });
  }

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX))}
        placeholder="Message…"
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
        disabled={!body.trim() || pending}
        aria-label="Send message"
        className="press-shrink shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-full bg-[var(--accent)] text-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-[filter]"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
