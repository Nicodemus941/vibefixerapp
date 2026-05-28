"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { OfferPayload } from "../actions";

export const EMPTY_OFFER: OfferPayload = {
  title: "",
  description: "",
  category: "",
  price_min: null,
  price_max: null,
  pricing_model: "hourly",
};

const PRICING_MODELS = [
  { value: "hourly", label: "Hourly" },
  { value: "fixed", label: "Fixed" },
  { value: "retainer", label: "Retainer" },
  { value: "equity", label: "Equity" },
  { value: "revshare", label: "Revenue share" },
];

export function OffersStep({
  value,
  onChange,
}: {
  value: OfferPayload[];
  onChange: (next: OfferPayload[]) => void;
}) {
  const update = (i: number, patch: Partial<OfferPayload>) =>
    onChange(value.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--fg-muted)]">
        Add 1–3 things you can deliver for another founder. Be specific —
        matches are run against this text.
      </p>
      {value.map((offer, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
              Offer {i + 1}
            </div>
            {value.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-[var(--fg-subtle)] hover:text-[var(--danger)] transition-colors"
                aria-label={`Remove offer ${i + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div>
            <Label>Title</Label>
            <Input
              value={offer.title}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder="Fractional CFO for seed-stage SaaS"
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={offer.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder="What's the scope, who's it for, what's a typical outcome?"
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Category</Label>
            <Input
              value={offer.category}
              onChange={(e) => update(i, { category: e.target.value })}
              placeholder="finance, design, growth…"
              required
              className="mt-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Price min ($)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={offer.price_min ?? ""}
                onChange={(e) =>
                  update(i, {
                    price_min:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="1000"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Price max ($)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={offer.price_max ?? ""}
                onChange={(e) =>
                  update(i, {
                    price_max:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="5000"
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label>Pricing model</Label>
            <Select
              value={offer.pricing_model}
              onChange={(e) => update(i, { pricing_model: e.target.value })}
              className="mt-1.5"
            >
              {PRICING_MODELS.map((m) => (
                <option
                  key={m.value}
                  value={m.value}
                  className="bg-[var(--surface-2)] text-[var(--fg)]"
                >
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      ))}
      {value.length < 3 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange([...value, { ...EMPTY_OFFER }])}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add another offer
        </Button>
      )}
    </div>
  );
}
