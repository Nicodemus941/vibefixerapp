import React from "react";

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "blue" | "gold" | "green" | "red" | "amber" | "violet";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    blue: "bg-sky-500/10 text-sky-300 border-sky-500/25",
    gold: "bg-amber-400/10 text-amber-300 border-amber-400/25",
    green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    red: "bg-red-500/10 text-red-300 border-red-500/25",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    violet: "bg-violet-500/10 text-violet-300 border-violet-500/25",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function stageTone(stage: string) {
  const map: Record<string, any> = {
    Lead: "slate",
    Onboarding: "violet",
    Analysis: "blue",
    Disputing: "amber",
    Rebuilding: "blue",
    "Goal Ready": "green",
    Graduated: "green",
  };
  return map[stage] || "slate";
}

export function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  return (
    <div
      className="grid place-items-center rounded-full font-bold text-white shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

export function ScoreRing({ score, size = 132 }: { score: number; size?: number }) {
  const min = 300;
  const max = 850;
  const pct = Math.max(0, Math.min(1, (score - min) / (max - min)));
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const color = score >= 720 ? "#34d399" : score >= 660 ? "#1f9dff" : score >= 600 ? "#e8b73e" : "#f87171";
  const band = score >= 740 ? "Excellent" : score >= 670 ? "Good" : score >= 600 ? "Fair" : "Poor";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1e2a44" strokeWidth="10" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-black" style={{ color }}>
          {score}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-slate-400">{band}</div>
      </div>
    </div>
  );
}

export function ScoreTrend({ data, height = 64 }: { data: { month: string; experian: number }[]; height?: number }) {
  const pts = data.filter((d) => d.experian > 0);
  if (pts.length < 2) return <div className="text-xs text-slate-500">Not enough data yet</div>;
  const vals = pts.map((p) => p.experian);
  const min = Math.min(...vals) - 8;
  const max = Math.max(...vals) + 8;
  const w = 220;
  const path = pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = height - ((p.experian - min) / (max - min)) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `${path} L${w},${height} L0,${height} Z`;
  return (
    <svg width={w} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f9dff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1f9dff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trendFill)" />
      <path d={path} fill="none" stroke="#1f9dff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={w}
        cy={height - ((pts.at(-1)!.experian - min) / (max - min)) * height}
        r="3.5"
        fill="#e8b73e"
      />
    </svg>
  );
}

export function Stat({
  label,
  value,
  sub,
  icon,
  tone = "blue",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="card p-4 fade-up">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
          <div className="mt-1 text-2xl font-black text-white">{value}</div>
          {sub && <div className="mt-0.5 text-xs text-emerald-400">{sub}</div>}
        </div>
        {icon && (
          <div className={`grid h-9 w-9 place-items-center rounded-lg bg-sky-500/10 text-sky-300`}>{icon}</div>
        )}
      </div>
    </div>
  );
}

export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-xl font-bold text-white">{children}</h1>
      {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
    </div>
  );
}
