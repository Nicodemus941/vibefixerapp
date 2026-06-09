import { automations } from "@/lib/data";
import { Badge, SectionTitle } from "@/components/ui";
import { Zap, ArrowDown, Play, Workflow } from "lucide-react";

export default function AutomationsPage() {
  const totalRuns = automations.reduce((a, x) => a + x.runs, 0);
  return (
    <div className="space-y-6">
      <SectionTitle sub="The done-for-you engine. Each workflow runs automatically on its trigger so the business keeps moving while Jonathan focuses on clients.">
        Automations
      </SectionTitle>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-2xl font-black text-white">{automations.length}</div>
          <div className="text-xs text-slate-400">Active workflows</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-black text-emerald-300">{totalRuns}</div>
          <div className="text-xs text-slate-400">Total runs</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-black gold-text">100%</div>
          <div className="text-xs text-slate-400">Hands-free</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {automations.map((a) => (
          <div key={a.id} className="card p-5">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg brand-gradient text-white">
                  <Workflow size={18} />
                </div>
                <div>
                  <div className="font-semibold text-white">{a.name}</div>
                  <div className="flex items-center gap-1 text-xs text-amber-300">
                    <Zap size={11} /> {a.trigger}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge tone="green">● Active</Badge>
                <span className="text-[11px] text-slate-500">{a.runs} runs</span>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-3">
              {a.steps.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-500/15 text-[11px] font-bold text-sky-300">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-200">{s}</span>
                  </div>
                  {i < a.steps.length - 1 && (
                    <div className="ml-3 my-0.5 flex h-4 items-center">
                      <ArrowDown size={12} className="text-slate-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-line)] py-2 text-xs font-semibold text-slate-200 hover:bg-white/5">
              <Play size={13} /> Run now / Test
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
