"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import {
  getAvatarUploadUrl,
  removeAvatar,
  setAvatarUrl,
} from "../actions";

export function AvatarUploader({
  displayName,
  initialUrl,
}: {
  displayName: string;
  initialUrl: string | null;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function onFile(file: File) {
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("That's not an image.");
      return;
    }
    startTransition(async () => {
      const r = await getAvatarUploadUrl({ filename: file.name });
      if (!r.uploadUrl || !r.publicUrl) {
        setError(r.error ?? "could not get upload url");
        return;
      }
      const put = await fetch(r.uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type, "x-upsert": "true" },
        body: file,
      });
      if (!put.ok) {
        setError(`upload failed (${put.status})`);
        return;
      }
      const persist = await setAvatarUrl(r.publicUrl);
      if (persist.error) setError(persist.error);
      else {
        setUrl(`${r.publicUrl.split("?")[0]}?v=${Date.now()}`);
        router.refresh();
      }
    });
  }

  function remove() {
    if (!confirm("Remove your photo?")) return;
    startTransition(async () => {
      const r = await removeAvatar();
      if (r.error) setError(r.error);
      else {
        setUrl(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={displayName} url={url} size="xl" />
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.currentTarget.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={pending}
          className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)] disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {url ? "Replace photo" : "Upload photo"}
        </button>
        {url && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--danger)] hover:bg-white/[0.05]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      </div>
    </div>
  );
}
