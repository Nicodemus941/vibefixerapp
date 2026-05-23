export function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatMileage(n: number) {
  return `${new Intl.NumberFormat("en-US").format(n)} mi`;
}

export function dealLabel(score: number | null) {
  if (score == null) return { label: "No data", tone: "neutral" as const };
  if (score >= 90) return { label: "Great deal", tone: "great" as const };
  if (score >= 75) return { label: "Good deal", tone: "good" as const };
  if (score >= 55) return { label: "Fair price", tone: "fair" as const };
  return { label: "Above market", tone: "over" as const };
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
