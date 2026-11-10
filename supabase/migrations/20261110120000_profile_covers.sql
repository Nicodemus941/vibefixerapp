-- ============================================
-- LOOP: Profile cover images (Fable redesign, 2026-11-10)
-- NOT APPLIED. Review, then apply with the Supabase CLI / dashboard.
--
-- Adds profiles.cover_url and a public "covers" storage bucket that
-- mirrors the avatars bucket policies: public read, owner write under
-- {user_id}/..., 5 MB max, jpeg/png/webp only.
--
-- The app tolerates this migration not being applied yet: it reads
-- cover_url in a separate query and falls back to a brand gradient.
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cover_url TEXT
    CHECK (cover_url IS NULL OR cover_url ~* '^https://');

-- Bucket: public read through the public object URL.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Path convention: covers/{user_id}/cover-{timestamp}.{ext}
-- (also used for group covers: covers/{user_id}/group-{group_id}-{ts}.{ext},
--  the group row itself is still guarded by groups_update_owner).
DROP POLICY IF EXISTS "covers_storage_insert_own" ON storage.objects;
CREATE POLICY "covers_storage_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'covers'
    AND owner = auth.uid()
    AND split_part(name, '/', 1) = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "covers_storage_update_own" ON storage.objects;
CREATE POLICY "covers_storage_update_own" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'covers'
    AND owner = auth.uid()
  )
  WITH CHECK (
    bucket_id = 'covers'
    AND owner = auth.uid()
    AND split_part(name, '/', 1) = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "covers_storage_delete_own" ON storage.objects;
CREATE POLICY "covers_storage_delete_own" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'covers'
    AND owner = auth.uid()
  );
