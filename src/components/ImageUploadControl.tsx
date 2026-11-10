"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

// Generic "pick an image, upload it to a signed Supabase URL, then save
// the path" control. The server actions decide the bucket, the path and
// who is allowed; this component only moves bytes.

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploadControl({
  label,
  hasImage,
  requestUpload,
  commit,
  remove,
  removeConfirm = "Remove this image?",
  size = "md",
  tone = "default",
}: {
  label: string;
  hasImage: boolean;
  requestUpload: (
    contentType: string,
  ) => Promise<{ uploadUrl?: string; objectPath?: string; error?: string }>;
  commit: (objectPath: string) => Promise<{ error?: string }>;
  remove?: () => Promise<{ error?: string }>;
  removeConfirm?: string;
  size?: "sm" | "md";
  /** "overlay" renders light buttons for use on top of a cover image. */
  tone?: "default" | "overlay";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const inputId = useId();

  function onFile(file: File) {
    setError(null);
    if (!TYPES.includes(file.type)) {
      setError("Use a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 5 MB.");
      return;
    }
    startTransition(async () => {
      const ticket = await requestUpload(file.type);
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
      const saved = await commit(ticket.objectPath);
      if (saved.error) setError(saved.error);
      else router.refresh();
    });
  }

  function onRemove() {
    if (!remove) return;
    if (!confirm(removeConfirm)) return;
    startTransition(async () => {
      const r = await remove();
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  const btn =
    tone === "overlay"
      ? "bg-[var(--surface-1)]/95 text-[var(--fg)] border border-[var(--border)] shadow-[var(--shadow-2)] hover:bg-[var(--surface-1)]"
      : "bg-[var(--surface-1)] text-[var(--fg)] border border-[var(--border-strong)] hover:bg-[var(--surface-2)]";
  const h = size === "sm" ? "h-9 px-3 text-[13px]" : "h-11 px-4 text-sm";

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.currentTarget.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className={`press-shrink inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors disabled:opacity-50 ${btn} ${h}`}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ImagePlus className="h-4 w-4" aria-hidden />
          )}
          {hasImage ? `Change ${label}` : `Add ${label}`}
        </button>
        {hasImage && remove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={pending}
            aria-label={`Remove ${label}`}
            className={`press-shrink inline-flex items-center justify-center rounded-full transition-colors hover:text-[var(--danger)] disabled:opacity-50 ${btn} ${
              size === "sm" ? "h-9 w-9" : "h-11 w-11"
            }`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className={`text-xs ${
            tone === "overlay"
              ? "rounded-md bg-[var(--surface-1)] px-2 py-1 text-[var(--danger)]"
              : "text-[var(--danger)]"
          }`}
        >
          {error}
        </p>
      )}
    </div>
  );
}
