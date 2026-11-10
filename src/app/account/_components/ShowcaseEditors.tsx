"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  deleteAchievement,
  deleteFeatured,
  deleteGoal,
  getFeaturedImageUploadUrl,
  moveShowcaseItem,
  previewFeaturedLink,
  saveAchievement,
  saveFeatured,
  saveGoal,
  type FeaturedImageChoice,
} from "@/app/profile-showcase/actions";
import type { AchievementRow, FeaturedRow, GoalRow } from "@/lib/profile-showcase-data";
import {
  ACHIEVEMENTS_MAX,
  ACHIEVEMENT_DESCRIPTION_MAX,
  FEATURED_DESCRIPTION_MAX,
  FEATURED_KINDS,
  FEATURED_KIND_LABEL,
  FEATURED_MAX,
  GOALS_MAX,
  GOAL_HELP_MAX,
  GOAL_STATEMENT_MAX,
  hostLabel,
  moveById,
  type FeaturedKind,
} from "@/lib/profile-showcase";

type Section = "featured" | "achievements" | "goals";

// Shared list behaviour: optimistic up/down reorder with a live region so
// screen reader users hear where the item landed.
function useOrderedList<T extends { id: string }>(initial: T[], section: Section, name: (row: T) => string) {
  const [rows, setRows] = useState(initial);
  const [announce, setAnnounce] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function move(id: string, delta: -1 | 1) {
    const before = rows;
    const after = moveById(rows, id, delta);
    const idx = after.findIndex((r) => r.id === id);
    if (after.every((r, i) => r.id === before[i]?.id)) return;
    setRows(after);
    setError(null);
    const row = after[idx];
    setAnnounce(`Moved ${name(row)} to position ${idx + 1} of ${after.length}.`);
    startTransition(async () => {
      const r = await moveShowcaseItem(section, id, delta);
      if (r.error) {
        setRows(before);
        setError(r.error);
        setAnnounce("Could not move that item.");
      } else {
        router.refresh();
      }
    });
  }

  return { rows, setRows, move, announce, setAnnounce, error, setError };
}

// ======================= Featured =======================

export function FeaturedEditor({ initial }: { initial: FeaturedRow[] }) {
  const list = useOrderedList(initial, "featured", (r) => r.title);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const router = useRouter();
  const full = list.rows.length >= FEATURED_MAX;

  return (
    <div className="space-y-3">
      <p className="sr-only" aria-live="polite">
        {list.announce}
      </p>
      {list.rows.length > 0 ? (
        <ol className="space-y-2" aria-label="Featured links in display order">
          {list.rows.map((r, i) =>
            editing === r.id ? (
              <li key={r.id}>
                <FeaturedForm
                  initial={r}
                  onSaved={(row) => {
                    list.setRows((prev) => prev.map((x) => (x.id === row.id ? row : x)));
                    setEditing(null);
                    router.refresh();
                  }}
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <ItemShell
                key={r.id}
                index={i}
                count={list.rows.length}
                name={r.title}
                onMove={(d) => list.move(r.id, d)}
                onEdit={() => setEditing(r.id)}
                onDelete={async () => {
                  const res = await deleteFeatured(r.id);
                  if (res.error) list.setError(res.error);
                  else {
                    list.setRows((prev) => prev.filter((x) => x.id !== r.id));
                    list.setAnnounce(`Removed ${r.title}.`);
                    router.refresh();
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  {r.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={r.image_url}
                      alt=""
                      className="h-14 w-20 shrink-0 rounded-lg border border-[var(--border)] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <span className="chip chip-neutral">{FEATURED_KIND_LABEL[r.kind]}</span>
                    <p className="mt-1.5 text-sm font-semibold break-words">{r.title}</p>
                    <p className="text-xs text-[var(--fg-muted)] break-words">
                      {[r.publisher ?? hostLabel(r.url), r.published_on ? monthYear(r.published_on) : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
              </ItemShell>
            ),
          )}
        </ol>
      ) : (
        <p className="text-sm text-[var(--fg-muted)]">
          Show the work behind your name: articles you wrote, press about you, talks, podcasts and
          things you built. Up to {FEATURED_MAX}.
        </p>
      )}
      {list.error && (
        <p role="alert" className="text-xs text-[var(--danger)]">
          {list.error}
        </p>
      )}
      {editing === "new" ? (
        <FeaturedForm
          onSaved={(row) => {
            list.setRows((prev) => [...prev, row]);
            list.setAnnounce(`Added ${row.title}.`);
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <AddButton
          label="Add a featured link"
          onClick={() => setEditing("new")}
          disabled={full}
          note={full ? `You have ${FEATURED_MAX}, the most allowed. Remove one to add another.` : undefined}
        />
      )}
    </div>
  );
}

function FeaturedForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: FeaturedRow;
  onSaved: (row: FeaturedRow) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState(initial?.url ?? "");
  const [kind, setKind] = useState<FeaturedKind>(initial?.kind ?? "article");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [publisher, setPublisher] = useState(initial?.publisher ?? "");
  const [publishedOn, setPublishedOn] = useState(initial?.published_on ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState<FeaturedImageChoice>(
    initial ? { mode: "keep" } : { mode: "none" },
  );
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image_url ?? null);
  const [linkImage, setLinkImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const [fetching, startFetch] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileId = useId();

  function fetchDetails() {
    setError(null);
    setStatus("");
    startFetch(async () => {
      const r = await previewFeaturedLink(url);
      if (r.error || !r.prefill) {
        setError(r.error ?? "Could not read that link.");
        return;
      }
      const p = r.prefill;
      setUrl(p.url);
      let filled = 0;
      if (!title.trim() && p.title) {
        setTitle(p.title);
        filled++;
      }
      if (!description.trim() && p.description) {
        setDescription(p.description.slice(0, FEATURED_DESCRIPTION_MAX));
        filled++;
      }
      if (!publisher.trim() && p.publisher) {
        setPublisher(p.publisher);
        filled++;
      }
      setLinkImage(p.image);
      if (p.image && (image.mode === "none" || (image.mode === "keep" && !imagePreview))) {
        setImage({ mode: "link" });
        setImagePreview(p.image);
        filled++;
      }
      setStatus(
        filled > 0
          ? "Filled in details from the link. Edit anything that is off."
          : "No new details found on that page. Fill in the rest yourself.",
      );
    });
  }

  async function onFile(file: File) {
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const ticket = await getFeaturedImageUploadUrl(file.type);
      if (!ticket.uploadUrl || !ticket.objectPath) {
        setError(ticket.error ?? "Could not start the upload.");
        return;
      }
      const put = await fetch(ticket.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!put.ok) {
        setError(`Upload failed (${put.status}).`);
        return;
      }
      setImage({ mode: "upload", objectPath: ticket.objectPath });
      setImagePreview(URL.createObjectURL(file));
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await saveFeatured({
        id: initial?.id,
        kind,
        title,
        url,
        publisher,
        publishedOn,
        description,
        image,
      });
      if (r.error || !r.row) {
        setError(r.error ?? "Could not save.");
        return;
      }
      onSaved({ ...r.row, kind: r.row.kind });
    });
  }

  const busy = pending || fetching || uploading;

  return (
    <FormShell title={initial ? "Edit featured link" : "Add a featured link"} onCancel={onCancel} onSubmit={submit}>
      <Field label="Link" hint="Paste the address of the article, episode, video or project.">
        {(id, hintId) => (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id={id}
              aria-describedby={hintId}
              type="url"
              inputMode="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              className={INPUT}
            />
            <button
              type="button"
              onClick={fetchDetails}
              disabled={busy || !url.trim()}
              className={`${SECONDARY_BTN} shrink-0`}
            >
              {fetching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
              Fetch details
            </button>
          </div>
        )}
      </Field>
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
      {status && <p className="text-xs text-[var(--fg-muted)]">{status}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Type">
          {(id) => (
            <select id={id} value={kind} onChange={(e) => setKind(e.target.value as FeaturedKind)} className={INPUT}>
              {FEATURED_KINDS.map((k) => (
                <option key={k} value={k}>
                  {FEATURED_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Date (optional)">
          {(id) => (
            <input id={id} type="date" value={publishedOn} onChange={(e) => setPublishedOn(e.target.value)} className={INPUT} />
          )}
        </Field>
      </div>
      <Field label="Title" hint="Left empty, we use the page title.">
        {(id, hintId) => (
          <input
            id={id}
            aria-describedby={hintId}
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            className={INPUT}
          />
        )}
      </Field>
      <Field label="Publisher or outlet (optional)">
        {(id) => (
          <input
            id={id}
            value={publisher}
            maxLength={120}
            onChange={(e) => setPublisher(e.target.value)}
            placeholder="TechCrunch, your blog, a podcast name"
            className={INPUT}
          />
        )}
      </Field>
      <Field label="Short description (optional)" hint={`${description.length} of ${FEATURED_DESCRIPTION_MAX} characters`}>
        {(id, hintId) => (
          <textarea
            id={id}
            aria-describedby={hintId}
            value={description}
            rows={3}
            onChange={(e) => setDescription(e.target.value.slice(0, FEATURED_DESCRIPTION_MAX))}
            placeholder="What it is and why it matters."
            className={TEXTAREA}
          />
        )}
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-[13px] font-semibold">Image (optional)</legend>
        {imagePreview && image.mode !== "none" && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imagePreview}
            alt="Selected image"
            className="h-28 w-full max-w-xs rounded-lg border border-[var(--border)] object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="flex flex-wrap gap-2">
          <input
            id={fileId}
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.currentTarget.value = "";
            }}
          />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={SECONDARY_BTN}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ImagePlus className="h-4 w-4" aria-hidden />}
            Upload image
          </button>
          {linkImage && image.mode !== "link" && (
            <button
              type="button"
              onClick={() => {
                setImage({ mode: "link" });
                setImagePreview(linkImage);
              }}
              disabled={busy}
              className={SECONDARY_BTN}
            >
              Use image from link
            </button>
          )}
          {imagePreview && image.mode !== "none" && (
            <button
              type="button"
              onClick={() => {
                setImage({ mode: "none" });
                setImagePreview(null);
              }}
              disabled={busy}
              className={SECONDARY_BTN}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Remove image
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--fg-muted)]">JPEG, PNG or WebP, up to 5 MB.</p>
      </fieldset>

      <FormFooter error={error} pending={pending} disabled={busy || !url.trim()} />
    </FormShell>
  );
}

// ======================= Achievements =======================

export function AchievementsEditor({ initial }: { initial: AchievementRow[] }) {
  const list = useOrderedList(initial, "achievements", (r) => r.title);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const router = useRouter();
  const full = list.rows.length >= ACHIEVEMENTS_MAX;

  return (
    <div className="space-y-3">
      <p className="sr-only" aria-live="polite">
        {list.announce}
      </p>
      {list.rows.length > 0 ? (
        <ol className="space-y-2" aria-label="Achievements in display order">
          {list.rows.map((r, i) =>
            editing === r.id ? (
              <li key={r.id}>
                <AchievementForm
                  initial={r}
                  onSaved={(row) => {
                    list.setRows((prev) => prev.map((x) => (x.id === row.id ? row : x)));
                    setEditing(null);
                    router.refresh();
                  }}
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <ItemShell
                key={r.id}
                index={i}
                count={list.rows.length}
                name={r.title}
                onMove={(d) => list.move(r.id, d)}
                onEdit={() => setEditing(r.id)}
                onDelete={async () => {
                  const res = await deleteAchievement(r.id);
                  if (res.error) list.setError(res.error);
                  else {
                    list.setRows((prev) => prev.filter((x) => x.id !== r.id));
                    list.setAnnounce(`Removed ${r.title}.`);
                    router.refresh();
                  }
                }}
              >
                <p className="text-sm font-semibold break-words">{r.title}</p>
                <p className="text-xs text-[var(--fg-muted)] break-words">
                  {[r.issuer, r.achieved_on ? monthYear(r.achieved_on) : null].filter(Boolean).join(" · ")}
                </p>
                {r.proof_url && (
                  <a
                    href={r.proof_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow ugc"
                    className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-text)] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden />
                    Proof
                  </a>
                )}
              </ItemShell>
            ),
          )}
        </ol>
      ) : (
        <p className="text-sm text-[var(--fg-muted)]">
          Things you have done that others can learn from or check: a launch, a hard won customer, an
          award, a milestone. Add a link so people can see it for themselves.
        </p>
      )}
      {list.error && (
        <p role="alert" className="text-xs text-[var(--danger)]">
          {list.error}
        </p>
      )}
      {editing === "new" ? (
        <AchievementForm
          onSaved={(row) => {
            list.setRows((prev) => [...prev, row]);
            list.setAnnounce(`Added ${row.title}.`);
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <AddButton
          label="Add an achievement"
          onClick={() => setEditing("new")}
          disabled={full}
          note={full ? `You have ${ACHIEVEMENTS_MAX}, the most allowed.` : undefined}
        />
      )}
    </div>
  );
}

function AchievementForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: AchievementRow;
  onSaved: (row: AchievementRow) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [achievedOn, setAchievedOn] = useState(initial?.achieved_on ?? "");
  const [issuer, setIssuer] = useState(initial?.issuer ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [proofUrl, setProofUrl] = useState(initial?.proof_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await saveAchievement({ id: initial?.id, title, achievedOn, issuer, description, proofUrl });
      if (r.error || !r.row) setError(r.error ?? "Could not save.");
      else onSaved(r.row);
    });
  }

  return (
    <FormShell title={initial ? "Edit achievement" : "Add an achievement"} onCancel={onCancel} onSubmit={submit}>
      <Field label="What you did">
        {(id) => (
          <input
            id={id}
            required
            value={title}
            maxLength={160}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Grew Acme to its first 100 paying customers"
            className={INPUT}
          />
        )}
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Issuer or context (optional)">
          {(id) => (
            <input
              id={id}
              value={issuer}
              maxLength={160}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="Acme, a competition, a program"
              className={INPUT}
            />
          )}
        </Field>
        <Field label="Date (optional)">
          {(id) => (
            <input id={id} type="date" value={achievedOn} onChange={(e) => setAchievedOn(e.target.value)} className={INPUT} />
          )}
        </Field>
      </div>
      <Field label="Details (optional)" hint={`${description.length} of ${ACHIEVEMENT_DESCRIPTION_MAX} characters`}>
        {(id, hintId) => (
          <textarea
            id={id}
            aria-describedby={hintId}
            value={description}
            rows={3}
            onChange={(e) => setDescription(e.target.value.slice(0, ACHIEVEMENT_DESCRIPTION_MAX))}
            placeholder="How you did it and what you learned."
            className={TEXTAREA}
          />
        )}
      </Field>
      <Field label="Proof link (optional)" hint="A post, article, listing or record that shows it.">
        {(id, hintId) => (
          <input
            id={id}
            aria-describedby={hintId}
            type="url"
            inputMode="url"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder="https://"
            className={INPUT}
          />
        )}
      </Field>
      <FormFooter error={error} pending={pending} disabled={!title.trim()} />
    </FormShell>
  );
}

// ======================= Goals =======================

export function GoalsEditor({ initial }: { initial: GoalRow[] }) {
  const list = useOrderedList(initial, "goals", (r) => r.statement);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const router = useRouter();
  const full = list.rows.length >= GOALS_MAX;

  return (
    <div className="space-y-3">
      <p className="sr-only" aria-live="polite">
        {list.announce}
      </p>
      {list.rows.length > 0 ? (
        <ol className="space-y-2" aria-label="Goals in display order">
          {list.rows.map((r, i) =>
            editing === r.id ? (
              <li key={r.id}>
                <GoalForm
                  initial={r}
                  onSaved={(row) => {
                    list.setRows((prev) => prev.map((x) => (x.id === row.id ? row : x)));
                    setEditing(null);
                    router.refresh();
                  }}
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <ItemShell
                key={r.id}
                index={i}
                count={list.rows.length}
                name={r.statement}
                onMove={(d) => list.move(r.id, d)}
                onEdit={() => setEditing(r.id)}
                onDelete={async () => {
                  const res = await deleteGoal(r.id);
                  if (res.error) list.setError(res.error);
                  else {
                    list.setRows((prev) => prev.filter((x) => x.id !== r.id));
                    list.setAnnounce("Removed that goal.");
                    router.refresh();
                  }
                }}
              >
                <p className="text-sm font-semibold break-words">{r.statement}</p>
                {r.target_date && (
                  <p className="text-xs text-[var(--fg-muted)]">By {monthYear(r.target_date)}</p>
                )}
                {r.help_text && (
                  <p className="mt-0.5 text-xs text-[var(--fg-muted)] break-words">How you can help: {r.help_text}</p>
                )}
              </ItemShell>
            ),
          )}
        </ol>
      ) : (
        <p className="text-sm text-[var(--fg-muted)]">
          Say what you are working toward and how people could help. Honest and specific beats
          impressive. Up to {GOALS_MAX}.
        </p>
      )}
      {list.error && (
        <p role="alert" className="text-xs text-[var(--danger)]">
          {list.error}
        </p>
      )}
      {editing === "new" ? (
        <GoalForm
          onSaved={(row) => {
            list.setRows((prev) => [...prev, row]);
            list.setAnnounce("Added your goal.");
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <AddButton
          label="Add a goal"
          onClick={() => setEditing("new")}
          disabled={full}
          note={full ? `You have ${GOALS_MAX}, the most allowed. Keep the list short and real.` : undefined}
        />
      )}
    </div>
  );
}

function GoalForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: GoalRow;
  onSaved: (row: GoalRow) => void;
  onCancel: () => void;
}) {
  const [statement, setStatement] = useState(initial?.statement ?? "");
  const [targetDate, setTargetDate] = useState(initial?.target_date ?? "");
  const [helpText, setHelpText] = useState(initial?.help_text ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await saveGoal({ id: initial?.id, statement, targetDate, helpText });
      if (r.error || !r.row) setError(r.error ?? "Could not save.");
      else onSaved(r.row);
    });
  }

  return (
    <FormShell title={initial ? "Edit goal" : "Add a goal"} onCancel={onCancel} onSubmit={submit}>
      <Field label="Working toward" hint={`${statement.length} of ${GOAL_STATEMENT_MAX} characters`}>
        {(id, hintId) => (
          <input
            id={id}
            aria-describedby={hintId}
            required
            value={statement}
            maxLength={GOAL_STATEMENT_MAX}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Ship the v2 billing flow to our first ten customers"
            className={INPUT}
          />
        )}
      </Field>
      <Field label="Target date (optional)">
        {(id) => (
          <input id={id} type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={INPUT} />
        )}
      </Field>
      <Field label="How others can help (optional)" hint={`${helpText.length} of ${GOAL_HELP_MAX} characters`}>
        {(id, hintId) => (
          <input
            id={id}
            aria-describedby={hintId}
            value={helpText}
            maxLength={GOAL_HELP_MAX}
            onChange={(e) => setHelpText(e.target.value)}
            placeholder="Intros to finance leads at seed stage startups"
            className={INPUT}
          />
        )}
      </Field>
      <FormFooter error={error} pending={pending} disabled={!statement.trim()} />
    </FormShell>
  );
}

// ======================= shared UI =======================

const INPUT =
  "w-full h-11 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-1)] px-3.5 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";
const TEXTAREA =
  "w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-1)] px-3.5 py-2.5 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";
const SECONDARY_BTN =
  "press-shrink inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] px-4 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--surface-2)] disabled:opacity-40";

function ItemShell({
  index,
  count,
  name,
  onMove,
  onEdit,
  onDelete,
  children,
}: {
  index: number;
  count: number;
  name: string;
  onMove: (delta: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [deleting, startDelete] = useTransition();
  const short = name.length > 40 ? `${name.slice(0, 40)}…` : name;
  const first = index === 0;
  const last = index === count - 1;

  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">{children}</div>
        <div className="flex shrink-0 items-center gap-0.5 self-end sm:self-start" role="group" aria-label={`Actions for ${short}`}>
          {/* aria-disabled instead of disabled so focus stays on the button
              after it moves an item to the top or bottom. */}
          <IconButton
            label={`Move ${short} up`}
            onClick={() => !first && onMove(-1)}
            ariaDisabled={first}
          >
            <ArrowUp className="h-4 w-4" aria-hidden />
          </IconButton>
          <IconButton
            label={`Move ${short} down`}
            onClick={() => !last && onMove(1)}
            ariaDisabled={last}
          >
            <ArrowDown className="h-4 w-4" aria-hidden />
          </IconButton>
          <IconButton label={`Edit ${short}`} onClick={onEdit}>
            <Pencil className="h-4 w-4" aria-hidden />
          </IconButton>
          <IconButton
            label={`Remove ${short}`}
            danger
            disabled={deleting}
            onClick={() => {
              if (!confirm(`Remove "${short}"?`)) return;
              startDelete(onDelete);
            }}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
          </IconButton>
        </div>
      </div>
    </li>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  ariaDisabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  ariaDisabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={ariaDisabled || undefined}
      aria-label={label}
      title={label}
      className={`press-shrink inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--fg-muted)] hover:bg-[var(--surface-1)] disabled:opacity-40 aria-disabled:opacity-30 aria-disabled:cursor-default ${
        danger ? "hover:text-[var(--danger)]" : "hover:text-[var(--fg)]"
      }`}
    >
      {children}
    </button>
  );
}

function FormShell({
  title,
  onCancel,
  onSubmit,
  children,
}: {
  title: string;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}) {
  const headingId = useId();
  return (
    <form
      onSubmit={onSubmit}
      aria-labelledby={headingId}
      className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p id={headingId} className="text-sm font-semibold text-[var(--accent-text)]">
          {title}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center px-2 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          Cancel
        </button>
      </div>
      {children}
    </form>
  );
}

function FormFooter({ error, pending, disabled }: { error: string | null; pending: boolean; disabled: boolean }) {
  return (
    <>
      {error && (
        <p role="alert" className="text-xs text-[var(--danger)]">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || disabled}
        className="press-shrink inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Save
      </button>
    </>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string, hintId: string | undefined) => React.ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-[var(--fg)]">
        {label}
      </label>
      {children(id, hintId)}
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-[var(--fg-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}

function AddButton({
  label,
  onClick,
  disabled,
  note,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  note?: string;
}) {
  return (
    <div className="space-y-1">
      <button type="button" onClick={onClick} disabled={disabled} className={SECONDARY_BTN}>
        <Plus className="h-4 w-4" aria-hidden />
        {label}
      </button>
      {note && <p className="text-xs text-[var(--fg-muted)]">{note}</p>}
    </div>
  );
}

function monthYear(s: string): string {
  return new Date(`${s}T00:00:00Z`).toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}
