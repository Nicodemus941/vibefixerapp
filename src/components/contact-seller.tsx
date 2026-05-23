"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const SCAM_PATTERNS = [
  /\bwire\b/i,
  /western union/i,
  /moneygram/i,
  /shipping company/i,
  /\bzelle\b/i,
  /\bbitcoin|crypto\b/i,
  /gift card/i,
];

export function ContactSeller({
  listingId,
  sellerId,
}: {
  listingId: string;
  sellerId: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("Hi — is this still available?");
  const [warn, setWarn] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  function check(text: string) {
    const hit = SCAM_PATTERNS.find((r) => r.test(text));
    if (hit)
      setWarn(
        "Heads up: this message mentions an off-platform payment method we block. Edit before sending.",
      );
    else setWarn(null);
  }

  async function send() {
    setSending(true);
    const supabase = createSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push(`/auth/sign-in?next=/listings/${listingId}`);
      return;
    }
    const { data: convo, error: convoErr } = await supabase
      .from("conversations")
      .upsert(
        {
          listing_id: listingId,
          buyer_id: userData.user.id,
          seller_id: sellerId,
        },
        { onConflict: "listing_id,buyer_id" },
      )
      .select()
      .single();
    if (convoErr || !convo) {
      setWarn(convoErr?.message ?? "Couldn't start conversation.");
      setSending(false);
      return;
    }
    const flagged = SCAM_PATTERNS.some((r) => r.test(body));
    const { error } = await supabase.from("messages").insert({
      conversation_id: convo.id,
      sender_id: userData.user.id,
      body,
      flagged_scam: flagged,
    });
    setSending(false);
    if (error) {
      setWarn(error.message);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="ak-card bg-[var(--color-good-soft)] p-4 text-sm text-[var(--color-good)]">
        Message sent — find it in{" "}
        <a href="/messages" className="font-semibold underline">
          Messages
        </a>
        .
      </div>
    );
  }

  return (
    <div className="ak-card space-y-3 p-5">
      <h3 className="text-base font-semibold">Message the seller</h3>
      <p className="text-xs text-[var(--color-ink-muted)]">
        Replies stay in Car World USA — we block off-platform payment requests so
        you don't get scammed.
      </p>
      <textarea
        rows={4}
        className="ak-input"
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          check(e.target.value);
        }}
      />
      {warn && (
        <div className="rounded-md bg-[var(--color-warn-soft)] p-2 text-xs text-[var(--color-warn)]">
          {warn}
        </div>
      )}
      <button
        type="button"
        onClick={send}
        disabled={sending}
        className="ak-btn ak-btn-primary w-full disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send secure message"}
      </button>
    </div>
  );
}
