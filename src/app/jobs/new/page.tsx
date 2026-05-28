import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { createJobListingForm } from "../actions";

export const dynamic = "force-dynamic";

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "volunteer", label: "Volunteer" },
];

const REMOTE_POLICIES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ org_id?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/jobs/new");

  const sp = await searchParams;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  // Pull orgs this user has a current position at — those are the natural
  // posting candidates.
  const { data: ownPositions } = await supabase
    .from("positions")
    .select("organization_id, organizations:organization_id(id, name, slug)")
    .eq("user_id", user.id)
    .eq("is_current", true)
    .not("organization_id", "is", null);

  type PositionRow = { organization_id: string | null; organizations: { id: string; name: string; slug: string } | null };
  const orgOptions = (ownPositions ?? [])
    .map((r) => {
      const row = r as unknown as PositionRow;
      return row.organizations;
    })
    .filter((o): o is { id: string; name: string; slug: string } => Boolean(o));

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={profile?.display_name ?? "founder"}
        role={profile?.role ?? "user"}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Post a job
          </h1>
          <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
            Loop matches it to founders looking for that kind of work.
          </p>
        </div>

        {sp.error && (
          <div className="mb-4 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/[0.06] p-3 text-sm text-[var(--danger)]">
            {sp.error}
          </div>
        )}

        <form action={createJobListingForm} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <Field label="Company" htmlFor="organization_id">
            <select
              id="organization_id"
              name="organization_id"
              defaultValue={sp.org_id ?? ""}
              className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="">Independent / no company page</option>
              {orgOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <p className="mt-1 font-mono text-[10px] text-[var(--fg-subtle)]">
              Only companies where you have a current position show here.
            </p>
          </Field>

          <Field label="Job title" htmlFor="title">
            <input
              id="title"
              name="title"
              required
              maxLength={160}
              placeholder="Senior iOS Engineer"
              className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Employment type" htmlFor="employment_type">
              <select
                id="employment_type"
                name="employment_type"
                required
                className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Remote policy" htmlFor="remote_policy">
              <select
                id="remote_policy"
                name="remote_policy"
                required
                className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {REMOTE_POLICIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Location (optional)" htmlFor="location">
            <input
              id="location"
              name="location"
              placeholder="San Francisco, CA"
              className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </Field>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Comp min" htmlFor="compensation_min">
              <input
                id="compensation_min"
                name="compensation_min"
                type="number"
                min={0}
                placeholder="120000"
                className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </Field>
            <Field label="Comp max" htmlFor="compensation_max">
              <input
                id="compensation_max"
                name="compensation_max"
                type="number"
                min={0}
                placeholder="160000"
                className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </Field>
            <Field label="Period" htmlFor="compensation_period">
              <select
                id="compensation_period"
                name="compensation_period"
                className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="year">/ year</option>
                <option value="month">/ month</option>
                <option value="hour">/ hour</option>
                <option value="project">/ project</option>
              </select>
            </Field>
          </div>

          <Field label="Description" htmlFor="description">
            <textarea
              id="description"
              name="description"
              required
              minLength={10}
              maxLength={8000}
              rows={6}
              placeholder="What the role is, who you need, day-to-day, what success looks like in 90 days. Be specific — that's what makes the matching work."
              className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Application URL" htmlFor="application_url">
              <input
                id="application_url"
                name="application_url"
                type="url"
                placeholder="https://acme.com/careers/ios"
                className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </Field>
            <Field label="Application email" htmlFor="application_email">
              <input
                id="application_email"
                name="application_email"
                type="email"
                placeholder="jobs@acme.com"
                className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </Field>
          </div>
          <p className="font-mono text-[10px] text-[var(--fg-subtle)]">
            Provide at least one — URL or email.
          </p>

          <input type="hidden" name="currency" value="USD" />

          <button
            type="submit"
            className="press-shrink inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110"
          >
            Post job
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
