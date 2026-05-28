import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { createOrganizationForm } from "../actions";
import { INDUSTRIES } from "@/lib/industries";

export const dynamic = "force-dynamic";

const SIZE_BANDS = [
  { value: "solo", label: "Just me" },
  { value: "2-10", label: "2–10" },
  { value: "11-50", label: "11–50" },
  { value: "51-200", label: "51–200" },
  { value: "201-500", label: "201–500" },
  { value: "501-1000", label: "501–1,000" },
  { value: "1000+", label: "1,000+" },
];

export default async function NewOrganizationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/organizations/new");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

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
            <Building2 className="h-5 w-5" />
            Add a company
          </h1>
          <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
            Anyone on Loop can list their role at this company once it exists.
          </p>
        </div>

        {sp.error && (
          <div className="mb-4 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/[0.06] p-3 text-sm text-[var(--danger)]">
            {sp.error}
          </div>
        )}

        <form action={createOrganizationForm} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <Field label="Company name" htmlFor="name">
            <input
              id="name"
              name="name"
              required
              maxLength={120}
              placeholder="Acme Inc."
              className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </Field>

          <Field label="Industry" htmlFor="industry">
            <select
              id="industry"
              name="industry"
              className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="">Pick one</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Team size" htmlFor="size_band">
              <select
                id="size_band"
                name="size_band"
                className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="">—</option>
                {SIZE_BANDS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Headquarters" htmlFor="headquarters">
              <input
                id="headquarters"
                name="headquarters"
                placeholder="San Francisco, CA"
                className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </Field>
          </div>

          <Field label="Website" htmlFor="website">
            <input
              id="website"
              name="website"
              type="url"
              placeholder="https://acme.com"
              className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </Field>

          <Field label="Description" htmlFor="description">
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={4000}
              placeholder="What does the company do? Who do you serve?"
              className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </Field>

          <button
            type="submit"
            className="press-shrink inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--bg)] hover:brightness-110 w-full sm:w-auto"
          >
            Create company
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
