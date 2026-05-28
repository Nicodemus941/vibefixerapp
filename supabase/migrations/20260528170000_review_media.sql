-- ============================================
-- LOOP: Media (images + videos) on reviews
-- ============================================

CREATE TABLE review_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image','video')),
  url TEXT NOT NULL,
  width INT,
  height INT,
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX review_media_review_idx ON review_media(review_id, position);

ALTER TABLE review_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_media_read_authenticated" ON review_media FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "review_media_insert_uploader" ON review_media FOR INSERT
  WITH CHECK (
    auth.uid() = uploader_id
    AND EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.id = review_media.review_id
        AND r.reviewer_id = auth.uid()
    )
  );

CREATE POLICY "review_media_delete_uploader" ON review_media FOR DELETE
  USING (auth.uid() = uploader_id);

-- ============================================
-- Storage bucket — public read, RLS-scoped insert.
-- Path convention: review-media/{review_id}/{filename}
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-media', 'review-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "review_media_storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'review-media'
    AND owner = auth.uid()
  );

CREATE POLICY "review_media_storage_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'review-media'
    AND owner = auth.uid()
  );
