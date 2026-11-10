import { HandHeart, Heart, Laugh, Lightbulb, PartyPopper, ThumbsUp } from "lucide-react";
import type { ReactionKind } from "@/lib/reactions";

export const REACTION_ICONS: Record<ReactionKind, typeof ThumbsUp> = {
  like: ThumbsUp,
  celebrate: PartyPopper,
  support: HandHeart,
  insightful: Lightbulb,
  love: Heart,
  funny: Laugh,
};

// Text color per reaction, used for the chosen state and summary bubbles.
export const REACTION_COLORS: Record<ReactionKind, string> = {
  like: "text-[var(--accent)]",
  celebrate: "text-[var(--accent)]",
  support: "text-[var(--shipped)]",
  insightful: "text-[var(--need)]",
  love: "text-[var(--danger)]",
  funny: "text-[var(--job)]",
};

export function ReactionBubble({ kind, className = "" }: { kind: ReactionKind; className?: string }) {
  const Icon = REACTION_ICONS[kind];
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--surface-1)] bg-[var(--surface-3)] ${REACTION_COLORS[kind]} ${className}`}
      aria-hidden
    >
      <Icon className="h-3 w-3" />
    </span>
  );
}
