-- ============================================
-- Feed parity, part 2: images, PDF documents, link previews, 3000 char posts
-- ============================================
-- posts.media     JSONB array (max 4) of {path, width, height, alt}
-- posts.document  JSONB {path, name, size} for a single PDF
-- posts.link_preview JSONB {url, title, description, image, site_name}
--                 fetched server-side at post time (never by the client)
-- Paths point into the public "post-media" bucket and must live under the
-- author's own {user_id}/ folder. A post carries images OR a document.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS media JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS document JSONB,
  ADD COLUMN IF NOT EXISTS link_preview JSONB;

ALTER TABLE posts ADD CONSTRAINT posts_media_shape CHECK (
  jsonb_typeof(media) = 'array' AND jsonb_array_length(media) <= 4
);
ALTER TABLE posts ADD CONSTRAINT posts_document_shape CHECK (
  document IS NULL OR jsonb_typeof(document) = 'object'
);
ALTER TABLE posts ADD CONSTRAINT posts_media_or_document CHECK (
  document IS NULL OR jsonb_array_length(media) = 0
);
ALTER TABLE posts ADD CONSTRAINT posts_link_preview_shape CHECK (
  link_preview IS NULL OR jsonb_typeof(link_preview) = 'object'
);

-- Longer posts (was 600). An image or document post may have no text.
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_body_check;
ALTER TABLE posts ADD CONSTRAINT posts_body_check CHECK (
  char_length(body) <= 3000
  AND (
    char_length(body) >= 1
    OR jsonb_array_length(media) > 0
    OR document IS NOT NULL
  )
);

-- Every media/document path must sit in the author's own folder. Enforced
-- in the DB so a crafted request can't attach another user's upload.
CREATE OR REPLACE FUNCTION validate_post_media()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.media) LOOP
    IF jsonb_typeof(item) <> 'object'
       OR coalesce(item->>'path', '') !~ ('^' || NEW.user_id::TEXT || '/[a-z0-9-]+\.(jpg|jpeg|png|webp|gif)$') THEN
      RAISE EXCEPTION 'invalid media path' USING ERRCODE = '22023';
    END IF;
    IF char_length(coalesce(item->>'alt', '')) > 300 THEN
      RAISE EXCEPTION 'alt text too long' USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- link_preview is written by the server, but posts_update_own lets an
  -- author update their row directly, so validate it here as well.
  IF NEW.link_preview IS NOT NULL THEN
    IF coalesce(NEW.link_preview->>'url', '') !~* '^https?://'
       OR char_length(NEW.link_preview->>'url') > 2000
       OR (NEW.link_preview->>'image' IS NOT NULL AND NEW.link_preview->>'image' !~* '^https://') THEN
      RAISE EXCEPTION 'invalid link preview' USING ERRCODE = '22023';
    END IF;
  END IF;

  IF NEW.document IS NOT NULL THEN
    IF coalesce(NEW.document->>'path', '') !~ ('^' || NEW.user_id::TEXT || '/[a-z0-9-]+\.pdf$')
       OR char_length(coalesce(NEW.document->>'name', '')) NOT BETWEEN 1 AND 160 THEN
      RAISE EXCEPTION 'invalid document' USING ERRCODE = '22023';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_validate_media ON posts;
CREATE TRIGGER trg_posts_validate_media
  BEFORE INSERT OR UPDATE OF media, document, link_preview ON posts
  FOR EACH ROW EXECUTE FUNCTION validate_post_media();

-- ============================================
-- Storage: post-media bucket. Public read (images render in <img>),
-- owner-only write under {user_id}/..., 10 MB cap, images + PDF only.
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "post_media_storage_insert_own" ON storage.objects;
CREATE POLICY "post_media_storage_insert_own" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-media'
    AND owner = auth.uid()
    AND split_part(name, '/', 1) = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "post_media_storage_update_own" ON storage.objects;
CREATE POLICY "post_media_storage_update_own" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'post-media'
    AND owner = auth.uid()
    AND split_part(name, '/', 1) = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "post_media_storage_delete_own" ON storage.objects;
CREATE POLICY "post_media_storage_delete_own" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-media'
    AND owner = auth.uid()
  );
