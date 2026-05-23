"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AvatarUploader({
  initialUrl,
  fallbackInitial,
}: {
  initialUrl: string | null;
  fallbackInitial: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Please choose an image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr("Image must be under 5 MB.");
      return;
    }
    setErr(null);
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setErr("Sign in to upload.");
      setBusy(false);
      return;
    }

    const resized = await resizeSquare(file, 384);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    // Stable path per user so we don't accumulate garbage objects.
    const path = `${auth.user.id}/avatar.${ext === "png" ? "png" : "jpg"}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, resized, {
        contentType: resized.type || "image/jpeg",
        cacheControl: "0",
        upsert: true,
      });
    if (upErr) {
      setErr(upErr.message);
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    // Bust the cache so the new image shows up immediately.
    const busted = `${data.publicUrl}?v=${Date.now()}`;

    const { error: profErr } = await supabase
      .from("profiles")
      .update({ avatar_url: busted })
      .eq("id", auth.user.id);
    if (profErr) {
      setErr(profErr.message);
      setBusy(false);
      return;
    }
    setUrl(busted);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  async function clearAvatar() {
    setBusy(true);
    setErr(null);
    const supabase = createSupabaseBrowserClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setBusy(false);
      return;
    }
    await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", auth.user.id);
    setUrl(null);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Profile photo"
          className="h-20 w-20 rounded-full border object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-brand)] text-2xl font-semibold text-white">
          {fallbackInitial}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="ak-btn ak-btn-ghost border text-sm disabled:opacity-50"
        >
          {busy ? "Uploading…" : url ? "Change photo" : "Upload photo"}
        </button>
        {url && (
          <button
            type="button"
            disabled={busy}
            onClick={clearAvatar}
            className="text-xs font-medium text-[var(--color-bad)] hover:underline disabled:opacity-50"
          >
            Remove
          </button>
        )}
        {err && (
          <p className="text-xs text-[var(--color-bad)]">{err}</p>
        )}
      </div>
    </div>
  );
}

async function resizeSquare(file: File, size: number): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    // Center-crop to a square, then scale down.
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.88),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}
