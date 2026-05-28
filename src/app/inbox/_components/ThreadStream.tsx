"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { MessageBubble } from "./MessageBubble";
import type { ThreadMessage } from "../actions";

export function ThreadStream({
  conversationId,
  viewerId,
  initial,
}: {
  conversationId: string;
  viewerId: string;
  initial: ThreadMessage[];
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initial);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Realtime subscription: append new messages as they arrive.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`thread:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as ThreadMessage;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Reset state if the parent passes a new initial list (e.g. server refresh).
  useEffect(() => {
    setMessages((prev) => {
      // Merge initial server snapshot with any local realtime messages.
      const ids = new Set(prev.map((m) => m.id));
      const merged = [...prev];
      for (const m of initial) {
        if (!ids.has(m.id)) merged.push(m);
      }
      merged.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      return merged;
    });
  }, [initial]);

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
        <p className="text-[var(--fg-muted)]">
          New conversation. Say something concrete — what you need, what you can deliver.
        </p>
      </div>
    );
  }

  return (
    <>
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          body={m.body}
          createdAt={m.created_at}
          isMine={m.sender_id === viewerId}
        />
      ))}
      <div ref={bottomRef} />
    </>
  );
}
