"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { NeedPayload } from "../actions";

export const EMPTY_NEED: NeedPayload = {
  title: "",
  description: "",
  category: "",
  budget_min: null,
  budget_max: null,
  urgency: "this_month",
};

const URGENCIES = [
  { value: "now", label: "Now" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "exploratory", label: "Exploratory" },
];

export function NeedsStep({
  value,
  onChange,
}: {
  value: NeedPayload[];
  onChange: (next: NeedPayload[]) => void;
}) {
  const update = (i: number, patch: Partial<NeedPayload>) =>
    onChange(value.map((n, idx) => (idx === i ? { ...n, ...patch } : n)));

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-600">
        Add 1–3 things you need today. Reciprocity is required — no spectators.
      </p>
      {value.map((need, i) => (
        <div
          key={i}
          className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              Need {i + 1}
            </div>
            {value.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-neutral-400 hover:text-red-600"
                aria-label={`Remove need ${i + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div>
            <Label>Title</Label>
            <Input
              value={need.title}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder="Need a 3-page landing site, this week"
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={need.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder="What does done look like? Any constraints, stack, references?"
              required
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Category</Label>
            <Input
              value={need.category}
              onChange={(e) => update(i, { category: e.target.value })}
              placeholder="design, growth, legal…"
              required
              className="mt-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Budget min ($)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={need.budget_min ?? ""}
                onChange={(e) =>
                  update(i, {
                    budget_min:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="500"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Budget max ($)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={need.budget_max ?? ""}
                onChange={(e) =>
                  update(i, {
                    budget_max:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="2000"
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label>Urgency</Label>
            <Select
              value={need.urgency}
              onChange={(e) => update(i, { urgency: e.target.value })}
              className="mt-1.5"
            >
              {URGENCIES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
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
          onClick={() => onChange([...value, { ...EMPTY_NEED }])}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add another need
        </Button>
      )}
    </div>
  );
}
