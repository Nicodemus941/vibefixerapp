-- ============================================
-- LOOP: Avatars + per-user settings (notification preferences, etc.)
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{
    "new_match": true,
    "new_message": true,
    "new_reaction": true,
    "match_accepted": true,
    "new_comment": true,
    "new_document": true,
    "document_signed": true,
    "new_review": true,
    "email_digest": "off"
  }'::jsonb;

-- ============================================
-- Avatars storage bucket — public read, RLS-scoped insert by owner.
-- Path convention: avatars/{user_id}/avatar.{ext}
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_storage_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND owner = auth.uid()
    AND split_part(name, '/', 1) = auth.uid()::TEXT
  );

CREATE POLICY "avatars_storage_update_own" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND owner = auth.uid()
  );

CREATE POLICY "avatars_storage_delete_own" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND owner = auth.uid()
  );
