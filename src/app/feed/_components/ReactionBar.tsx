"use client";

import { useOptimistic, useTransition } from "react";
import { Flame, Handshake, Hand } from "lucide-react";
import { toggleReaction, type ReactionKind } from "../actions";

type State = {
  fire: number;
  handshake: number;
  in: number;
  mine: ReactionKind[];
};

const KINDS: Array<{
  kind: ReactionKind;
  icon: typeof Flame;
  label: string;
  ariaLabel: string;
}> = [
  { kind: "fire", icon: Flame, label: "Fire", ariaLabel: "React fire" },
  { kind: "handshake", icon: Handshake, label: "Help", ariaLabel: "React I can help" },
  { kind: "in", icon: Hand, label: "I'm in", ariaLabel: "React I'm in" },
];

export function ReactionBar({
  postId,
  initial,
}: {
  postId: string;
  initial: State;
}) {
  const [, startTransition] = useTransition();
  const [state, applyOptimistic] = useOptimistic(
    initial,
    (prev: State, kind: ReactionKind): State => {
      const isOn = prev.mine.includes(kind);
      return {
        ...prev,
        [kind]: Math.max(0, (prev[kind] as number) + (isOn ? -1 : 1)),
        mine: isOn
          ? prev.mine.filter((k) => k !== kind)
          : [...prev.mine, kind],
      };
    },
  );

  function onClick(kind: ReactionKind) {
    startTransition(async () => {
      applyOptimistic(kind);
      await toggleReaction({ postId, kind });
    });
  }

  return (
    <div className="flex items-center gap-1">
      {KINDS.map(({ kind, icon: Icon, ariaLabel }) => {
        const active = state.mine.includes(kind);
        const count = state[kind] as number;
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onClick(kind)}
            aria-label={ariaLabel}
            aria-pressed={active}
            className={[
              "press-shrink inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors",
              active
                ? "bg-[var(--accent)]/15 border border-[var(--accent)]/40 text-[var(--accent)]"
                : "bg-white/[0.02] border border-[var(--border)] text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)]",
            ].join(" ")}
          >
            <Icon className="h-3.5 w-3.5" />
            {count > 0 && (
              <span className="font-mono tabular-nums">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
