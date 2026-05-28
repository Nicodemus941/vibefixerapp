"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Plus } from "lucide-react";
import { joinGroup, leaveGroup } from "../actions";

export function JoinLeaveButton({
  slug,
  isMember,
  role,
}: {
  slug: string;
  isMember: boolean;
  role: "owner" | "moderator" | "member" | null;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function go() {
    startTransition(async () => {
      const r = isMember ? await leaveGroup(slug) : await joinGroup(slug);
      if (r.error) {
        alert(r.error);
        return;
      }
      router.refresh();
    });
  }

  if (role === "owner") {
    return (
      <span className="press-shrink shrink-0 inline-flex items-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-[var(--accent)]">
        Owner
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={pending}
      className={[
        "press-shrink shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors",
        isMember
          ? "border border-[var(--border-strong)] bg-white/[0.02] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-white/[0.05]"
          : "bg-[var(--accent)] text-[var(--bg)] hover:brightness-110",
      ].join(" ")}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isMember ? (
        <LogOut className="h-3.5 w-3.5" />
      ) : (
        <Plus className="h-3.5 w-3.5" />
      )}
      {isMember ? "Leave" : "Join"}
    </button>
  );
}
