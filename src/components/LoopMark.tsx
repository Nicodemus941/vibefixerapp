// The Loop mark: an open ring in Loop green. Inline SVG so it follows
// the theme (the stroke reads --accent, which swaps in dark mode).
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
      viewBox="0 0 28 28"
      width={size}
      height={size}
      aria-hidden
      className={className}
    >
      <circle
        cx="14"
        cy="14"
        r="9.5"
        fill="none"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray="46 14"
        transform="rotate(-50 14 14)"
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
