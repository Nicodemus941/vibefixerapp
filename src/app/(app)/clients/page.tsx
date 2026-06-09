import Link from "next/link";
import { clients } from "@/lib/data";
import { Avatar, Badge, ScoreTrend, SectionTitle, stageTone } from "@/components/ui";
import { Plus, Phone, Mail, MapPin } from "lucide-react";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <SectionTitle sub="Every client, from first contact to graduation — personal info, progress, payment, and goal in one view.">
          Clients
        </SectionTitle>
        <button className="inline-flex items-center gap-2 rounded-lg brand-gradient px-4 py-2.5 text-sm font-semibold text-white glow">
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clients.map((c) => {
          const lift = c.currentScore - c.startScore;
          const progress = Math.min(
            100,
            Math.round(((c.currentScore - c.startScore) / Math.max(1, c.targetScore - c.startScore)) * 100)
          );
          return (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              className="card group p-5 transition hover:glow"
            >
              <div className="flex items-start gap-3">
                <Avatar name={c.name} color={c.avatarColor} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-white">{c.name}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <MapPin size={11} /> {c.city}
                  </div>
                </div>
                <Badge tone={stageTone(c.stage)}>{c.stage}</Badge>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Current score</div>
                  <div className="text-2xl font-black text-white">{c.currentScore}</div>
                  <div className={`text-xs ${lift > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                    {lift > 0 ? `+${lift} pts` : "baseline set"}
                  </div>
                </div>
                <ScoreTrend data={c.scoreHistory} height={44} />
              </div>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                  <span>Goal: {c.goal}</span>
                  <span>{progress}% to target {c.targetScore}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full gold-gradient" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[var(--color-line)] pt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Phone size={12} /> {c.phone}
                </span>
                <Badge tone={c.payment === "Current" || c.payment === "Paid in Full" ? "green" : c.payment === "Past Due" ? "red" : "slate"}>
                  {c.payment}
                </Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
