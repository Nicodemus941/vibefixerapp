"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  FileText,
  HandCoins,
  ImagePlus,
  Loader2,
  Plus,
  Send,
  Trophy,
  X,
} from "lucide-react";
import { createPost } from "../actions";
import { createClient } from "@/lib/supabase/browser";
import {
  IMAGE_TYPES,
  MAX_FILE_BYTES,
  MAX_IMAGES,
  PDF_TYPE,
  POST_MEDIA_BUCKET,
  formatBytes,
} from "@/lib/post-media";
import {
  POST_BODY_MAX,
  extractHashtagsFromBody,
  toStoredText,
  type MentionPick,
} from "@/lib/post-text";
import { FOCUS_RING } from "./Modal";
import { MentionTextarea } from "./MentionTextarea";

type PostKind = "need" | "offer" | "win";

const KIND_OPTIONS: Array<{
  value: PostKind;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  placeholder: string;
}> = [
  {
    value: "need",
    label: "Need",
    icon: Briefcase,
    hint: "Something you're looking to get done.",
    placeholder:
      "What do you need today? Be specific: budget, timeline, the shape of the work. Tag with #design #cfo #ios and type @ to mention someone.",
  },
  {
    value: "offer",
    label: "Offer",
    icon: HandCoins,
    hint: "Something you can deliver for another founder.",
    placeholder:
      "What can you deliver this month? Who it's for, the scope, how to engage. Tag with the categories you serve.",
  },
  {
    value: "win",
    label: "Win",
    icon: Trophy,
    hint: "Receipts only. A thing you actually shipped or closed.",
    placeholder:
      "What did you ship? Who did you work with? Type @ to credit them. Concrete is better than vague.",
  },
];

type ImageDraft = {
  localId: string;
  previewUrl: string;
  path: string | null;
  width: number | null;
  height: number | null;
  alt: string;
  status: "uploading" | "done" | "error";
};

type DocDraft = {
  path: string | null;
  name: string;
  size: number;
  status: "uploading" | "done" | "error";
};

type PollDraft = { options: string[]; days: 1 | 3 | 7 };

const TOOL_BTN = `press-shrink inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.04] hover:text-[var(--fg)] disabled:opacity-40 disabled:cursor-not-allowed ${FOCUS_RING}`;

async function imageSize(file: File): Promise<{ width: number | null; height: number | null }> {
  try {
    const bmp = await createImageBitmap(file);
    const out = { width: bmp.width, height: bmp.height };
    bmp.close();
    return out;
  } catch {
    return { width: null, height: null };
  }
}

export function Composer({ displayName, userId }: { displayName: string; userId: string }) {
  const [kind, setKind] = useState<PostKind>("need");
  const [text, setText] = useState("");
  const [picks, setPicks] = useState<MentionPick[]>([]);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [doc, setDoc] = useState<DocDraft | null>(null);
  const [poll, setPoll] = useState<PollDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const imageInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);

  // Free preview object URLs when images are removed or on unmount.
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const set = previews.current;
    return () => set.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const stored = toStoredText(text.trim(), picks);
  const tags = extractHashtagsFromBody(stored);
  const remaining = POST_BODY_MAX - stored.length;
  const active = KIND_OPTIONS.find((o) => o.value === kind)!;
  const uploading = images.some((i) => i.status === "uploading") || doc?.status === "uploading";
  const hasFailed = images.some((i) => i.status === "error") || doc?.status === "error";
  const pollValid =
    !poll ||
    (poll.options.filter((o) => o.trim()).length >= 2 && poll.options.every((o) => o.trim().length <= 80));
  const canSubmit =
    !pending &&
    !uploading &&
    !hasFailed &&
    remaining >= 0 &&
    pollValid &&
    (poll ? stored.length > 0 : stored.length > 0 || images.length > 0 || doc !== null);

  async function upload(file: File, ext: string): Promise<string | null> {
    const supabase = createClient();
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(POST_MEDIA_BUCKET).upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
    return upErr ? null : path;
  }

  async function removeUploaded(path: string | null) {
    if (!path) return;
    try {
      await createClient().storage.from(POST_MEDIA_BUCKET).remove([path]);
    } catch {
      // ignore; orphaned files are harmless
    }
  }

  async function onPickImages(files: FileList | null) {
    if (!files) return;
    setError(null);
    const room = MAX_IMAGES - images.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) setError(`Up to ${MAX_IMAGES} images per post.`);
    for (const file of list) {
      const ext = IMAGE_TYPES[file.type];
      if (!ext) {
        setError("Images must be JPEG, PNG, WebP or GIF.");
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError("Each image must be 10 MB or smaller.");
        continue;
      }
      const localId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      previews.current.add(previewUrl);
      const dims = await imageSize(file);
      setImages((prev) => [
        ...prev,
        { localId, previewUrl, path: null, ...dims, alt: "", status: "uploading" },
      ]);
      const path = await upload(file, ext);
      setImages((prev) =>
        prev.map((img) =>
          img.localId === localId ? { ...img, path, status: path ? "done" : "error" } : img,
        ),
      );
      if (!path) setError("An image didn't upload. Remove it and try again.");
    }
  }

  async function onPickDoc(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    if (file.type !== PDF_TYPE) return setError("Documents must be a PDF.");
    if (file.size > MAX_FILE_BYTES) return setError("Documents must be 10 MB or smaller.");
    setDoc({ path: null, name: file.name, size: file.size, status: "uploading" });
    const path = await upload(file, "pdf");
    setDoc((d) => (d ? { ...d, path, status: path ? "done" : "error" } : d));
    if (!path) setError("The document didn't upload. Remove it and try again.");
  }

  function removeImage(localId: string) {
    setImages((prev) => {
      const img = prev.find((i) => i.localId === localId);
      if (img) {
        URL.revokeObjectURL(img.previewUrl);
        previews.current.delete(img.previewUrl);
        void removeUploaded(img.path);
      }
      return prev.filter((i) => i.localId !== localId);
    });
  }

  function removeDoc() {
    void removeUploaded(doc?.path ?? null);
    setDoc(null);
  }

  function reset() {
    setText("");
    setPicks([]);
    images.forEach((i) => {
      URL.revokeObjectURL(i.previewUrl);
      previews.current.delete(i.previewUrl);
    });
    setImages([]);
    setDoc(null);
    setPoll(null);
  }

  function submit() {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const res = await createPost({
        body: stored,
        kind,
        media: images.map((i) => ({ path: i.path, width: i.width, height: i.height, alt: i.alt })),
        document: doc ? { path: doc.path, name: doc.name, size: doc.size } : null,
        poll: poll
          ? { options: poll.options.map((o) => o.trim()).filter(Boolean), durationDays: poll.days }
          : null,
      });
      if (res.error) setError(res.error);
      else {
        reset();
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 sm:p-5">
      <div role="tablist" aria-label="Post kind" className="flex items-center gap-1.5 mb-3">
        {KIND_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = kind === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setKind(opt.value)}
              className={[
                "press-shrink inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-[var(--accent)] text-[var(--bg)]"
                  : "border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-white/[0.04]",
                FOCUS_RING,
              ].join(" ")}
            >
              <Icon className="h-3.5 w-3.5" />
              {opt.label}
            </button>
          );
        })}
        <p className="ml-auto hidden sm:block font-mono text-[10px] text-[var(--fg-subtle)] truncate">
          {active.hint}
        </p>
      </div>

      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-sm font-mono text-[var(--fg-muted)]" aria-hidden>
          {(displayName?.[0] ?? "?").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <MentionTextarea
            value={text}
            onChange={setText}
            picks={picks}
            onPicksChange={setPicks}
            placeholder={poll ? "Ask a question for your poll." : active.placeholder}
            ariaLabel={`Write a ${active.label.toLowerCase()}`}
            rows={3}
            disabled={pending}
            onSubmit={submit}
            className="w-full resize-y min-h-[4.5rem] bg-transparent text-[var(--fg)] placeholder:text-[var(--fg-subtle)] outline-none text-base leading-relaxed rounded-md focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
          />
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="font-mono text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/30"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {images.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 gap-2" aria-label="Attached images">
              {images.map((img, i) => (
                <li key={img.localId} className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.previewUrl} alt="" className="aspect-square w-full object-cover" />
                  {img.status === "uploading" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white">
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden /> Uploading
                    </span>
                  )}
                  {img.status === "error" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/70 px-2 text-center text-xs text-[var(--danger)]">
                      Upload failed
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(img.localId)}
                    aria-label={`Remove image ${i + 1}`}
                    className={`press-shrink absolute right-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 ${FOCUS_RING}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    value={img.alt}
                    maxLength={300}
                    onChange={(e) =>
                      setImages((prev) =>
                        prev.map((x) => (x.localId === img.localId ? { ...x, alt: e.target.value } : x)),
                      )
                    }
                    placeholder="Describe this image"
                    aria-label={`Alt text for image ${i + 1}`}
                    className="w-full border-t border-[var(--border)] bg-[var(--surface-2)] px-2 py-1.5 text-xs text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)]"
                  />
                </li>
              ))}
            </ul>
          )}

          {doc && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <FileText className="h-5 w-5 shrink-0 text-[var(--danger)]" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[var(--fg)]">{doc.name}</p>
                <p className="font-mono text-[11px] text-[var(--fg-subtle)]">
                  {doc.status === "uploading" ? "Uploading" : doc.status === "error" ? "Upload failed" : formatBytes(doc.size)}
                </p>
              </div>
              {doc.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-[var(--fg-muted)]" aria-hidden />}
              <button
                type="button"
                onClick={removeDoc}
                aria-label="Remove document"
                className={`press-shrink inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--fg-muted)] hover:bg-white/[0.06] hover:text-[var(--fg)] ${FOCUS_RING}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {poll && (
            <fieldset className="mt-3 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <legend className="px-1 font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
                Poll
              </legend>
              {poll.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    maxLength={80}
                    onChange={(e) =>
                      setPoll((p) =>
                        p ? { ...p, options: p.options.map((o, j) => (j === i ? e.target.value : o)) } : p,
                      )
                    }
                    placeholder={`Option ${i + 1}${i < 2 ? "" : " (optional)"}`}
                    aria-label={`Poll option ${i + 1}`}
                    className="h-9 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  {poll.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setPoll((p) => (p ? { ...p, options: p.options.filter((_, j) => j !== i) } : p))}
                      aria-label={`Remove option ${i + 1}`}
                      className={`press-shrink inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--fg-muted)] hover:bg-white/[0.06] ${FOCUS_RING}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {poll.options.length < 4 ? (
                  <button
                    type="button"
                    onClick={() => setPoll((p) => (p ? { ...p, options: [...p.options, ""] } : p))}
                    className={`press-shrink inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-[var(--accent)] hover:bg-[var(--accent)]/10 ${FOCUS_RING}`}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden /> Add option
                  </button>
                ) : (
                  <span />
                )}
                <label className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
                  Runs for
                  <select
                    value={poll.days}
                    onChange={(e) => setPoll((p) => (p ? { ...p, days: Number(e.target.value) as 1 | 3 | 7 } : p))}
                    className="h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-2 text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>1 week</option>
                  </select>
                </label>
              </div>
              <button
                type="button"
                onClick={() => setPoll(null)}
                className={`press-shrink rounded text-xs text-[var(--fg-subtle)] hover:text-[var(--danger)] ${FOCUS_RING}`}
              >
                Remove poll
              </button>
            </fieldset>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <input
        ref={imageInput}
        type="file"
        accept={Object.keys(IMAGE_TYPES).join(",")}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void onPickImages(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={docInput}
        type="file"
        accept={PDF_TYPE}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void onPickDoc(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => imageInput.current?.click()}
            disabled={pending || images.length >= MAX_IMAGES || doc !== null || poll !== null}
            className={TOOL_BTN}
            aria-label="Add images"
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            <span className="hidden xs:inline">Images</span>
          </button>
          <button
            type="button"
            onClick={() => docInput.current?.click()}
            disabled={pending || images.length > 0 || doc !== null || poll !== null}
            className={TOOL_BTN}
            aria-label="Add a PDF document"
          >
            <FileText className="h-4 w-4" aria-hidden />
            <span className="hidden xs:inline">PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setPoll({ options: ["", ""], days: 3 })}
            disabled={pending || images.length > 0 || doc !== null || poll !== null}
            className={TOOL_BTN}
            aria-label="Create a poll"
          >
            <BarChart3 className="h-4 w-4" aria-hidden />
            <span className="hidden xs:inline">Poll</span>
          </button>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span
            className={[
              "font-mono text-xs tabular-nums shrink-0",
              remaining < 100 ? "text-[var(--danger)]" : "text-[var(--fg-subtle)]",
            ].join(" ")}
            aria-label={`${remaining} characters left`}
          >
            {remaining}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={`press-shrink inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-[filter] ${FOCUS_RING}`}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Posting
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Post {active.label.toLowerCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
