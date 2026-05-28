import { redirect } from "next/navigation";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { INDUSTRIES } from "@/lib/industries";
import { createAdForm } from "../actions";

export const dynamic = "force-dynamic";

const REVENUE_BANDS = [
  { value: "pre-revenue", label: "Pre-revenue" },
  { value: "0-10k", label: "$0–10k" },
  { value: "10k-100k", label: "$10k–100k" },
  { value: "100k-1m", label: "$100k–1M" },
  { value: "1m-10m", label: "$1M–10M" },
  { value: "10m+", label: "$10M+" },
];

export default async function NewAdPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/ads/new");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: ownPositions } = await supabase
    .from("positions")
    .select("organization_id, organizations:organization_id(id, name)")
    .eq("user_id", user.id)
    .eq("is_current", true)
    .not("organization_id", "is", null);

  type OrgRow = { organizations: { id: string; name: string } | null };
  const orgOptions = (ownPositions ?? [])
    .map((r) => (r as unknown as OrgRow).organizations)
    .filter((o): o is { id: string; name: string } => Boolean(o));

  const sp = await searchParams;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={profile?.display_name ?? "founder"}
        role={profile?.role ?? "user"}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            New ad
          </h1>
          <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
            Ad launches as a draft. You decide when to activate it from{" "}
            <Link href="/ads" className="text-[var(--accent)] hover:underline">
              your dashboard
            </Link>.
          </p>
        </div>

        {sp.error && (
          <div className="mb-4 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/[0.06] p-3 text-sm text-[var(--danger)]">
            {sp.error}
          </div>
        )}

        <form action={createAdForm} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <Field label="Company (optional)" htmlFor="organization_id">
            <select
              id="organization_id"
              name="organization_id"
              className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="">No company / personal ad</option>
              {orgOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Headline" htmlFor="headline">
            <input
              id="headline"
              name="headline"
              required
              maxLength={100}
              placeholder="The HR tool YC founders use"
              className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </Field>

          <Field label="Body" htmlFor="body">
            <textarea
              id="body"
              name="body"
              required
              maxLength={400}
              rows={3}
              placeholder="What it does, who it's for, one credible proof point."
              className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="CTA label" htmlFor="cta_label">
              <input
                id="cta_label"
                name="cta_label"
                defaultValue="Learn more"
                maxLength={30}
                className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </Field>
            <Field label="Target URL" htmlFor="target_url">
              <input
                id="target_url"
                name="target_url"
                type="url"
                required
                placeholder="https://yourproduct.com/founders"
                className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </Field>
          </div>

          <Field label="Creative image URL (optional)" htmlFor="creative_url">
            <input
              id="creative_url"
              name="creative_url"
              type="url"
              placeholder="https://…/banner.png"
              className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </Field>

          <fieldset className="space-y-2">
            <legend className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)] mb-1.5">
              Target industries (optional — leave blank for all)
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2">
              {INDUSTRIES.map((i) => (
                <label key={i} className="inline-flex items-center gap-1.5 text-xs text-[var(--fg-muted)]">
                  <input type="checkbox" name="target_industries" value={i} className="h-3.5 w-3.5" />
                  {i}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)] mb-1.5">
              Target revenue bands (optional)
            </legend>
            <div className="flex flex-wrap gap-2">
              {REVENUE_BANDS.map((b) => (
                <label key={b.value} className="inline-flex items-center gap-1.5 text-xs text-[var(--fg-muted)]">
                  <input type="checkbox" name="target_revenue_bands" value={b.value} className="h-3.5 w-3.5" />
                  {b.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Total budget ($)" htmlFor="budget_dollars">
              <input
                id="budget_dollars"
                name="budget_dollars"
                type="number"
                required
                min={1}
                step="0.01"
                placeholder="500"
                className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </Field>
            <Field label="Cost per impression (¢)" htmlFor="cost_per_impression_cents">
              <input
                id="cost_per_impression_cents"
                name="cost_per_impression_cents"
                type="number"
                required
                min={1}
                defaultValue={5}
                className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Start (optional)" htmlFor="starts_at">
              <input
                id="starts_at"
                name="starts_at"
                type="datetime-local"
                className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </Field>
            <Field label="End (optional)" htmlFor="ends_at">
              <input
                id="ends_at"
                name="ends_at"
                type="datetime-local"
                className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </Field>
          </div>

          <p className="font-mono text-[10px] text-[var(--fg-subtle)]">
            Billing isn&apos;t collected yet. Budget + spend are tracked, Stripe
            integration ships next. Treat this as a sandbox until then.
          </p>

          <button
            type="submit"
            className="press-shrink inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110"
          >
            Save draft
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)] block mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
