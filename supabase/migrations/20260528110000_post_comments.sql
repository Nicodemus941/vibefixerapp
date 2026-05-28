-- ============================================
-- LOOP: Comments on posts
-- ============================================

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX post_comments_post_idx ON post_comments(post_id, created_at ASC);
CREATE INDEX post_comments_user_idx ON post_comments(user_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_comments_read_authenticated" ON post_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "post_comments_insert_own" ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_comments_delete_own" ON post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Extend the notifications enum to include comments + add the trigger.
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_kind_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_kind_check
  CHECK (kind IN (
    'new_match','new_message','new_reaction','match_accepted','new_comment'
  ));

CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  post_author UUID;
BEGIN
  SELECT user_id INTO post_author FROM posts WHERE id = NEW.post_id;
  IF post_author IS NULL OR post_author = NEW.user_id THEN RETURN NEW; END IF;

  INSERT INTO notifications (user_id, kind, actor_id, related_post_id, payload)
  VALUES (
    post_author,
    'new_comment',
    NEW.user_id,
    NEW.post_id,
    jsonb_build_object('preview', left(NEW.body, 140))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_notify ON post_comments;
CREATE TRIGGER trg_comment_notify
  AFTER INSERT ON post_comments
  FOR EACH ROW EXECUTE FUNCTION notify_new_comment();

-- Realtime — append post_comments so clients can stream new comments.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
