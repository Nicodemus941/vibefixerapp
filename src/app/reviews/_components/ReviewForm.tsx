"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Loader2, Star, Video, X } from "lucide-react";
import {
  createReview,
  getReviewMediaUploadUrl,
  type ReviewMediaInput,
} from "../actions";

const MAX_MEDIA = 6;
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB cap

type PendingMedia = {
  localId: string;
  kind: "image" | "video";
  previewUrl: string;
  publicUrl: string;
  uploading: boolean;
  error?: string;
};

export function ReviewForm({
  engagementId,
  counterpartyName,
  onDone,
}: {
  engagementId: string;
  counterpartyName: string;
  onDone?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<PendingMedia[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    setError(null);
    const files = Array.from(fileList).slice(0, MAX_MEDIA - media.length);
    for (const file of files) {
      const localId = crypto.randomUUID();
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        setError(`"${file.name}" is not an image or video.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError(`"${file.name}" is over 25 MB. Skipped.`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      setMedia((prev) => [
        ...prev,
        {
          localId,
          kind: isImage ? "image" : "video",
          previewUrl,
          publicUrl: "",
          uploading: true,
        },
      ]);

      // Async upload — don't block the loop.
      const r = await getReviewMediaUploadUrl({ filename: file.name });
      if (!r.uploadUrl || !r.publicUrl) {
        setMedia((prev) =>
          prev.map((m) =>
            m.localId === localId
              ? { ...m, uploading: false, error: r.error ?? "upload url failed" }
              : m,
          ),
        );
        continue;
      }
      try {
        const put = await fetch(r.uploadUrl, {
          method: "PUT",
          headers: { "content-type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!put.ok) throw new Error(`upload failed (${put.status})`);
        setMedia((prev) =>
          prev.map((m) =>
            m.localId === localId
              ? { ...m, uploading: false, publicUrl: r.publicUrl! }
              : m,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "upload failed";
        setMedia((prev) =>
          prev.map((m) =>
            m.localId === localId ? { ...m, uploading: false, error: msg } : m,
          ),
        );
      }
    }
  }

  function removeMedia(localId: string) {
    setMedia((prev) => {
      const item = prev.find((m) => m.localId === localId);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((m) => m.localId !== localId);
    });
  }

  function submit() {
    setError(null);
    if (rating < 1) {
      setError("Pick a rating first.");
      return;
    }
    if (!body.trim()) {
      setError("Write a short review.");
      return;
    }
    if (media.some((m) => m.uploading)) {
      setError("Wait for media uploads to finish.");
      return;
    }
    const cleanMedia: ReviewMediaInput[] = media
      .filter((m) => !m.error && m.publicUrl)
      .map((m) => ({ kind: m.kind, url: m.publicUrl }));
    startTransition(async () => {
      const r = await createReview({
        engagementId,
        rating,
        body: body.trim(),
        media: cleanMedia,
      });
      if (r.error) setError(r.error);
      else {
        setRating(0);
        setBody("");
        for (const m of media) URL.revokeObjectURL(m.previewUrl);
        setMedia([]);
        onDone?.();
        router.refresh();
      }
    });
  }

  const active = hoverRating || rating;

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--fg)]">
        How was working with{" "}
        <span className="font-medium">{counterpartyName}</span>?
      </p>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={pending}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            className="press-shrink p-0.5"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                n <= active
                  ? "fill-[var(--accent)] text-[var(--accent)]"
                  : "text-[var(--fg-subtle)]"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 font-mono text-xs text-[var(--fg-subtle)] tabular-nums">
          {rating > 0 ? `${rating}/5` : "tap a star"}
        </span>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 2000))}
        placeholder="What did they deliver? What was great? What could be better? Other founders will read this."
        rows={4}
        disabled={pending}
        className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />

      {/* Media strip */}
      {media.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {media.map((m) => (
            <div
              key={m.localId}
              className="relative h-20 w-20 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface-2)] group"
            >
              {m.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[var(--fg-muted)]">
                  <Video className="h-6 w-6" />
                </div>
              )}
              {m.uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                </div>
              )}
              {m.error && (
                <div className="absolute inset-0 bg-[var(--danger)]/30 flex items-center justify-center p-1 text-[9px] text-white text-center">
                  {m.error}
                </div>
              )}
              <button
                type="button"
                onClick={() => removeMedia(m.localId)}
                disabled={pending}
                aria-label="Remove media"
                className="press-shrink absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            accept="image/*,video/*"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pending || media.length >= MAX_MEDIA}
            className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)] disabled:opacity-40"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Add media
            <span className="font-mono text-[10px] text-[var(--fg-subtle)]">
              {media.length}/{MAX_MEDIA}
            </span>
          </button>
          <span className="font-mono text-[10px] text-[var(--fg-subtle)]">
            {2000 - body.length} chars
          </span>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !body.trim() || rating < 1}
          className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-40"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Star className="h-4 w-4" />
          )}
          Post review
        </button>
      </div>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
