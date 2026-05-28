"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ProfilePayload } from "../actions";

const REVENUE_BANDS: Array<{ value: ProfilePayload["revenue_band"]; label: string }> = [
  { value: "pre-revenue", label: "Pre-revenue" },
  { value: "0-10k", label: "$0 – $10k" },
  { value: "10k-100k", label: "$10k – $100k" },
  { value: "100k-1m", label: "$100k – $1M" },
  { value: "1m-10m", label: "$1M – $10M" },
  { value: "10m+", label: "$10M+" },
];

export function ProfileStep({
  value,
  onChange,
}: {
  value: ProfilePayload;
  onChange: (next: ProfilePayload) => void;
}) {
  const set =
    <K extends keyof ProfilePayload>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...value, [key]: e.target.value });

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="display_name">Your name</Label>
        <Input
          id="display_name"
          value={value.display_name}
          onChange={set("display_name")}
          placeholder="Jane Founder"
          required
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="company_name">Company name</Label>
        <Input
          id="company_name"
          value={value.company_name}
          onChange={set("company_name")}
          placeholder="Acme Inc."
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="company_url">Company URL</Label>
        <Input
          id="company_url"
          type="url"
          value={value.company_url}
          onChange={set("company_url")}
          placeholder="https://acme.com"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="industry">Industry</Label>
        <Input
          id="industry"
          value={value.industry}
          onChange={set("industry")}
          placeholder="SaaS, fintech, healthtech…"
          required
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="revenue_band">Revenue band</Label>
        <Select
          id="revenue_band"
          value={value.revenue_band}
          onChange={set("revenue_band")}
          required
          className="mt-1.5"
        >
          <option value="" className="bg-[var(--surface-2)] text-[var(--fg-subtle)]">
            Select a revenue band
          </option>
          {REVENUE_BANDS.map((b) => (
            <option
              key={b.value}
              value={b.value}
              className="bg-[var(--surface-2)] text-[var(--fg)]"
            >
              {b.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
