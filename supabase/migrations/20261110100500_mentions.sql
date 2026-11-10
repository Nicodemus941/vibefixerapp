-- ============================================
-- Feed parity, part 6: @mentions in posts and comments
-- ============================================
-- Bodies store mentions as @[Display Name](user-uuid). post_mentions is the
-- index of who was mentioned where; inserting a row notifies the
-- mentioned user. Nobody can mention across a block.

CREATE TABLE IF NOT EXISTS post_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (author_id <> mentioned_user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS post_mentions_post_unique
  ON post_mentions(post_id, mentioned_user_id) WHERE comment_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS post_mentions_comment_unique
  ON post_mentions(comment_id, mentioned_user_id) WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS post_mentions_mentioned_idx
  ON post_mentions(mentioned_user_id, created_at DESC);

ALTER TABLE post_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_mentions_read_party" ON post_mentions FOR SELECT
  USING (auth.uid() = author_id OR auth.uid() = mentioned_user_id);

CREATE POLICY "post_mentions_insert_author" ON post_mentions FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND viewer_is_active()
    AND NOT blocked_with_viewer(mentioned_user_id)
    AND (
      (comment_id IS NULL AND EXISTS (
        SELECT 1 FROM posts p
        WHERE p.id = post_mentions.post_id AND p.user_id = auth.uid()
      ))
      OR
      (comment_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM post_comments c
        WHERE c.id = post_mentions.comment_id
          AND c.post_id = post_mentions.post_id
          AND c.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "post_mentions_delete_author" ON post_mentions FOR DELETE
  USING (auth.uid() = author_id);

CREATE OR REPLACE FUNCTION notify_mention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  preview TEXT;
BEGIN
  IF users_blocked(NEW.author_id, NEW.mentioned_user_id) THEN RETURN NEW; END IF;

  IF NEW.comment_id IS NOT NULL THEN
    SELECT left(body, 140) INTO preview FROM post_comments WHERE id = NEW.comment_id;
  ELSE
    SELECT left(body, 140) INTO preview FROM posts WHERE id = NEW.post_id;
  END IF;

  INSERT INTO notifications (user_id, kind, actor_id, related_post_id, payload)
  VALUES (
    NEW.mentioned_user_id,
    'mention',
    NEW.author_id,
    NEW.post_id,
    jsonb_build_object(
      'preview', preview,
      'in_comment', NEW.comment_id IS NOT NULL,
      'comment_id', NEW.comment_id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_mentions_notify ON post_mentions;
CREATE TRIGGER trg_post_mentions_notify
  AFTER INSERT ON post_mentions
  FOR EACH ROW EXECUTE FUNCTION notify_mention();

-- Autocomplete: people the viewer can mention (not self, not blocked
-- either way). People the viewer follows rank first.
CREATE OR REPLACE FUNCTION mention_candidates(q TEXT, limit_count INT DEFAULT 6)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  company_name TEXT,
  avatar_url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT pr.id, pr.display_name, pr.company_name, pr.avatar_url
  FROM profiles pr
  WHERE auth.uid() IS NOT NULL
    AND char_length(coalesce(q, '')) BETWEEN 1 AND 60
    AND pr.id <> auth.uid()
    AND pr.display_name ILIKE
      '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%'
    AND NOT users_blocked(auth.uid(), pr.id)
  ORDER BY
    EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = auth.uid() AND f.following_id = pr.id) DESC,
    (pr.display_name ILIKE replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%') DESC,
    pr.display_name ASC
  LIMIT least(greatest(coalesce(limit_count, 6), 1), 10);
$$;
REVOKE ALL ON FUNCTION mention_candidates(TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION mention_candidates(TEXT, INT) TO authenticated;
