-- ============================================
-- LOOP: profile-media storage bucket (2026-11-10)
-- NOT APPLIED. Review, then apply with the Supabase CLI / dashboard.
--
-- Optional images on Featured items. Mirrors the covers bucket: public
-- read through the public object URL, owner write under {user_id}/...,
-- 5 MB max, jpeg/png/webp only.
--
-- Path convention: profile-media/{user_id}/featured-{timestamp}.{ext}
-- The server derives the public URL from a validated path; it never takes
-- a URL from the client. Account deletion removes {user_id}/ objects with
-- the service role (see src/app/account/actions.ts).
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-media',
  'profile-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "profile_media_insert_own" ON storage.objects;
CREATE POLICY "profile_media_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-media'
    AND owner = auth.uid()
    AND split_part(name, '/', 1) = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "profile_media_update_own" ON storage.objects;
CREATE POLICY "profile_media_update_own" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-media'
    AND owner = auth.uid()
  )
  WITH CHECK (
    bucket_id = 'profile-media'
    AND owner = auth.uid()
    AND split_part(name, '/', 1) = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "profile_media_delete_own" ON storage.objects;
CREATE POLICY "profile_media_delete_own" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-media'
    AND owner = auth.uid()
  );
