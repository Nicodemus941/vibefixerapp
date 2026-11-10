"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, UserMinus, UserPlus } from "lucide-react";
import { followUser, unfollowUser } from "@/app/follows/actions";

export function FollowButton({
  targetUserId,
  initiallyFollowing,
  followsYou,
}: {
  targetUserId: string;
  initiallyFollowing: boolean;
  followsYou: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);
  const [hover, setHover] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    startTransition(async () => {
      if (isFollowing) {
        const r = await unfollowUser(targetUserId);
        if (!r.error) setIsFollowing(false);
      } else {
        const r = await followUser(targetUserId);
        if (!r.error) setIsFollowing(true);
      }
      router.refresh();
    });
  }

  // Following → "Following" (green) → "Unfollow" on hover (red outline)
  // Not following → "Follow" (accent) or "Follow back" if they follow you
  if (isFollowing) {
    return (
      <button
        type="button"
        onClick={toggle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        disabled={pending}
        className={[
          "press-shrink inline-flex items-center gap-1.5 rounded-full h-11 px-4 text-sm font-semibold transition-colors",
          hover
            ? "border border-[var(--danger)]/50 bg-[var(--danger-bg)] text-[var(--danger)]"
            : "border border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--accent-text)]",
        ].join(" ")}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : hover ? (
          <UserMinus className="h-4 w-4" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {hover ? "Unfollow" : "Following"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] h-11 px-4 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--surface-2)]"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
      {followsYou ? "Follow back" : "Follow"}
    </button>
  );
}
