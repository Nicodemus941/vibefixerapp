"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("sort") ?? "best-deal";

  function set(v: string) {
    const sp = new URLSearchParams(params.toString());
    if (v === "best-deal") sp.delete("sort");
    else sp.set("sort", v);
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={(e) => set(e.target.value)}
      className="ak-input w-auto"
    >
      <option value="best-deal">Best deal first</option>
      <option value="newest">Newest first</option>
      <option value="price-asc">Lowest price</option>
      <option value="price-desc">Highest price</option>
      <option value="mileage-asc">Lowest miles</option>
      <option value="year-desc">Newest year</option>
    </select>
  );
}
