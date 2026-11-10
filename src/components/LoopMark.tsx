// The Loop mark, "Twin L" (Fable 5, owner approved 2026-11-10): two capital
// L's, one turned around, close a square loop with a gap at each corner.
// Each member brings an L; together they make the loop. Inline SVG so it
// follows the theme (fill reads --accent, which swaps in dark mode).
export function LoopMark({
  size = 26,
  className,
  color = "var(--accent)",
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden
      className={className}
    >
      <path
        fill={color}
        d="M7 24H18.5V45.5H40V57H7Z M57 40H45.5V18.5H24V7H57Z"
      />
    </svg>
  );
}

export function LoopWordmark({
  className,
  color,
}: {
  className?: string;
  color?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-lg font-bold tracking-[-0.02em] ${className ?? ""}`}
    >
      <LoopMark color={color} />
      Loop
    </span>
  );
}
