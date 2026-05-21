"use client";
import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Lightweight selection state shared between the per-row checkbox and the
// floating toolbar that appears once anything is selected.
interface SelectionCtx {
  selected: Set<string>;
  toggle: (id: string) => void;
  clear: () => void;
}
const Ctx = createContext<SelectionCtx | null>(null);

export function BulkSelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function clear() {
    setSelected(new Set());
  }
  return (
    <Ctx.Provider value={{ selected, toggle, clear }}>{children}</Ctx.Provider>
  );
}

export function BulkSelectCheckbox({ id }: { id: string }) {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  const checked = ctx.selected.has(id);
  return (
    <input
      type="checkbox"
      aria-label="Select listing"
      checked={checked}
      onChange={() => ctx.toggle(id)}
      className="h-4 w-4 flex-none accent-[var(--color-brand)]"
    />
  );
}

export function BulkActionsBar() {
  const ctx = useContext(Ctx);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!ctx || ctx.selected.size === 0) return null;
  const selectionCtx = ctx;
  const ids = Array.from(ctx.selected);

  async function bulk(action: "active" | "pending" | "sold" | "delete") {
    if (action === "delete") {
      if (
        !window.confirm(
          `Delete ${ids.length} listing${ids.length === 1 ? "" : "s"}? This can't be undone.`,
        )
      )
        return;
    }
    setErr(null);
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    if (action === "delete") {
      const { error } = await supabase.from("listings").delete().in("id", ids);
      if (error) {
        setErr(error.message);
        setBusy(false);
        return;
      }
    } else {
      const update: Record<string, unknown> = { status: action };
      if (action === "sold") update.sold_at = new Date().toISOString();
      if (action === "active") update.sold_at = null;
      const { error } = await supabase
        .from("listings")
        .update(update)
        .in("id", ids);
      if (error) {
        setErr(error.message);
        setBusy(false);
        return;
      }
    }
    selectionCtx.clear();
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="sticky top-16 z-30 mb-3 mt-3 flex flex-wrap items-center gap-2 rounded-lg border bg-white p-2 shadow-sm">
      <span className="text-sm font-semibold">
        {selectionCtx.selected.size} selected
      </span>
      <button
        onClick={() => bulk("active")}
        disabled={busy}
        className="ak-btn ak-btn-ghost border text-xs disabled:opacity-50"
      >
        Mark active
      </button>
      <button
        onClick={() => bulk("pending")}
        disabled={busy}
        className="ak-btn ak-btn-ghost border text-xs disabled:opacity-50"
      >
        Mark pending
      </button>
      <button
        onClick={() => bulk("sold")}
        disabled={busy}
        className="ak-btn ak-btn-ghost border text-xs disabled:opacity-50"
      >
        Mark sold
      </button>
      <button
        onClick={() => bulk("delete")}
        disabled={busy}
        className="rounded bg-[var(--color-bad)] px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
      >
        Delete
      </button>
      <button
        onClick={() => selectionCtx.clear()}
        className="ml-auto text-xs text-[var(--color-ink-muted)] hover:underline"
      >
        Clear
      </button>
      {err && <span className="text-xs text-[var(--color-bad)]">{err}</span>}
    </div>
  );
}
