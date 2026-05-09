import type { Status } from "../lib/store";

const META: Record<Status, { label: string; bg: string; text: string }> = {
  new: { label: "New", bg: "bg-flame", text: "text-white" },
  contacted: { label: "Called", bg: "bg-amber", text: "text-ink" },
  booked: { label: "Booked", bg: "bg-brand", text: "text-white" },
  completed: { label: "Done", bg: "bg-emerald-600", text: "text-white" },
  "no-show": { label: "No-show", bg: "bg-slate-500", text: "text-white" },
};

export default function StatusPill({ status }: { status: Status }) {
  const { label, bg, text } = META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wider ${bg} ${text}`}
    >
      {label}
    </span>
  );
}
