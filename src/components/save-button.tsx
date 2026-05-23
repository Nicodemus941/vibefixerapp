"use client";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SaveButton({
  listingId,
  initialSaved,
}: {
  listingId: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={saved ? "Unsave car" : "Save car"}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (busy) return;
        setBusy(true);
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          router.push("/auth/sign-in?next=/search");
          return;
        }
        if (saved) {
          await supabase
            .from("saved_listings")
            .delete()
            .eq("user_id", data.user.id)
            .eq("listing_id", listingId);
          setSaved(false);
        } else {
          await supabase
            .from("saved_listings")
            .insert({ user_id: data.user.id, listing_id: listingId });
          setSaved(true);
        }
        setBusy(false);
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white/95 backdrop-blur transition ${
        saved
          ? "text-[var(--color-brand)] border-[var(--color-brand)]"
          : "text-[var(--color-ink-muted)] hover:text-[var(--color-brand)]"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
