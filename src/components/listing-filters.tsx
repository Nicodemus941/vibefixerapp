"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BODY_TYPES, MAKES } from "@/lib/types";

export function ListingFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [state, setState] = useState({
    q: params.get("q") ?? "",
    make: params.get("make") ?? "",
    body: params.get("body") ?? "",
    yearMin: params.get("yearMin") ?? "",
    yearMax: params.get("yearMax") ?? "",
    priceMin: params.get("priceMin") ?? "",
    priceMax: params.get("priceMax") ?? "",
    mileageMax: params.get("mileageMax") ?? "",
    sellerType: params.get("sellerType") ?? "any",
    state_: params.get("state") ?? "",
    sort: params.get("sort") ?? "best-deal",
  });

  useEffect(() => {
    setState({
      q: params.get("q") ?? "",
      make: params.get("make") ?? "",
      body: params.get("body") ?? "",
      yearMin: params.get("yearMin") ?? "",
      yearMax: params.get("yearMax") ?? "",
      priceMin: params.get("priceMin") ?? "",
      priceMax: params.get("priceMax") ?? "",
      mileageMax: params.get("mileageMax") ?? "",
      sellerType: params.get("sellerType") ?? "any",
      state_: params.get("state") ?? "",
      sort: params.get("sort") ?? "best-deal",
    });
  }, [params]);

  function apply(next: Partial<typeof state>) {
    const merged = { ...state, ...next };
    setState(merged);
    const sp = new URLSearchParams();
    if (merged.q) sp.set("q", merged.q);
    if (merged.make) sp.set("make", merged.make);
    if (merged.body) sp.set("body", merged.body);
    if (merged.yearMin) sp.set("yearMin", merged.yearMin);
    if (merged.yearMax) sp.set("yearMax", merged.yearMax);
    if (merged.priceMin) sp.set("priceMin", merged.priceMin);
    if (merged.priceMax) sp.set("priceMax", merged.priceMax);
    if (merged.mileageMax) sp.set("mileageMax", merged.mileageMax);
    if (merged.sellerType && merged.sellerType !== "any")
      sp.set("sellerType", merged.sellerType);
    if (merged.state_) sp.set("state", merged.state_);
    if (merged.sort && merged.sort !== "best-deal") sp.set("sort", merged.sort);
    router.push(`${pathname}?${sp.toString()}`);
  }

  function reset() {
    router.push(pathname);
  }

  return (
    <aside className="ak-card sticky top-20 h-fit space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        <button
          onClick={reset}
          className="text-xs font-medium text-[var(--color-brand)] hover:underline"
        >
          Clear all
        </button>
      </div>

      <Field label="Keyword">
        <input
          className="ak-input"
          value={state.q}
          placeholder="e.g. low miles, manual…"
          onChange={(e) => setState((s) => ({ ...s, q: e.target.value }))}
          onBlur={() => apply({ q: state.q })}
          onKeyDown={(e) => {
            if (e.key === "Enter") apply({ q: state.q });
          }}
        />
      </Field>

      <Field label="Seller">
        <div className="grid grid-cols-3 gap-1 rounded-lg border p-1 text-xs">
          {[
            ["any", "Any"],
            ["private", "Private"],
            ["dealer", "Dealer"],
          ].map(([v, label]) => (
            <button
              key={v}
              onClick={() => apply({ sellerType: v })}
              className={`rounded px-2 py-1.5 font-medium ${
                state.sellerType === v
                  ? "bg-[var(--color-brand)] text-white"
                  : "text-[var(--color-ink-muted)] hover:bg-[var(--color-bg)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Make">
        <select
          className="ak-input"
          value={state.make}
          onChange={(e) => apply({ make: e.target.value })}
        >
          <option value="">Any make</option>
          {MAKES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Body type">
        <select
          className="ak-input"
          value={state.body}
          onChange={(e) => apply({ body: e.target.value })}
        >
          <option value="">Any body</option>
          {BODY_TYPES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Year">
        <div className="grid grid-cols-2 gap-2">
          <input
            className="ak-input"
            placeholder="Min"
            inputMode="numeric"
            value={state.yearMin}
            onChange={(e) => setState((s) => ({ ...s, yearMin: e.target.value }))}
            onBlur={() => apply({ yearMin: state.yearMin })}
          />
          <input
            className="ak-input"
            placeholder="Max"
            inputMode="numeric"
            value={state.yearMax}
            onChange={(e) => setState((s) => ({ ...s, yearMax: e.target.value }))}
            onBlur={() => apply({ yearMax: state.yearMax })}
          />
        </div>
      </Field>

      <Field label="Price ($)">
        <div className="grid grid-cols-2 gap-2">
          <input
            className="ak-input"
            placeholder="Min"
            inputMode="numeric"
            value={state.priceMin}
            onChange={(e) => setState((s) => ({ ...s, priceMin: e.target.value }))}
            onBlur={() => apply({ priceMin: state.priceMin })}
          />
          <input
            className="ak-input"
            placeholder="Max"
            inputMode="numeric"
            value={state.priceMax}
            onChange={(e) => setState((s) => ({ ...s, priceMax: e.target.value }))}
            onBlur={() => apply({ priceMax: state.priceMax })}
          />
        </div>
      </Field>

      <Field label="Max mileage">
        <input
          className="ak-input"
          placeholder="e.g. 80000"
          inputMode="numeric"
          value={state.mileageMax}
          onChange={(e) => setState((s) => ({ ...s, mileageMax: e.target.value }))}
          onBlur={() => apply({ mileageMax: state.mileageMax })}
        />
      </Field>

      <Field label="State">
        <input
          className="ak-input"
          placeholder="e.g. TX"
          maxLength={2}
          value={state.state_}
          onChange={(e) =>
            setState((s) => ({ ...s, state_: e.target.value.toUpperCase() }))
          }
          onBlur={() => apply({ state_: state.state_ })}
        />
      </Field>
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}
