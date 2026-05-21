// Minimal inline-svg sparkline for per-listing view trends.
// Renders zero-state gracefully (no data → flat baseline).
export function ViewSparkline({
  days,
  width = 100,
  height = 24,
}: {
  days: number[];
  width?: number;
  height?: number;
}) {
  if (!days.length) return null;
  const max = Math.max(1, ...days);
  const step = days.length > 1 ? width / (days.length - 1) : 0;
  const points = days
    .map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
