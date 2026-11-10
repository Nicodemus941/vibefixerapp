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
      <span className="press-shrink shrink-0 inline-flex items-center rounded-full bg-[var(--accent-soft)] h-11 px-4 text-sm font-semibold text-[var(--accent-text)]">
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
        "press-shrink shrink-0 inline-flex items-center gap-1.5 rounded-full h-11 px-4 text-sm font-semibold transition-colors",
        isMember
          ? "border border-[var(--border-strong)] bg-[var(--surface-1)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]"
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
