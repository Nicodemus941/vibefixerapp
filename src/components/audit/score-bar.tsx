import { Progress } from "@/components/ui/progress";

export function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.max(0, Math.min(100, score * 10));
  const tone = score >= 8 ? "text-emerald-600" : score >= 5 ? "text-amber-600" : "text-destructive";
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={`text-sm font-semibold ${tone}`}>{score}/10</span>
      </div>
      <Progress value={pct} />
    </div>
  );
}
