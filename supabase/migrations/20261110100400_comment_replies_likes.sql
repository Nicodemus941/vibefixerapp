-- ============================================
-- Feed parity, part 5: one level of comment replies + comment likes
-- ============================================

ALTER TABLE post_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS post_comments_parent_idx ON post_comments(parent_comment_id, created_at ASC)
  WHERE parent_comment_id IS NOT NULL;

-- Replies must target a top level comment on the same post, and nobody
-- can comment across a block (with the post author or the parent author).
CREATE OR REPLACE FUNCTION validate_post_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  parent RECORD;
  post_author UUID;
BEGIN
  SELECT user_id INTO post_author FROM posts WHERE id = NEW.post_id;
  IF post_author IS NULL THEN
    RAISE EXCEPTION 'post_unavailable' USING ERRCODE = 'P0002';
  END IF;
  IF users_blocked(NEW.user_id, post_author) THEN
    RAISE EXCEPTION 'post_unavailable' USING ERRCODE = 'P0002';
  END IF;

  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT id, post_id, user_id, parent_comment_id INTO parent
      FROM post_comments WHERE id = NEW.parent_comment_id;
    IF NOT FOUND OR parent.post_id <> NEW.post_id THEN
      RAISE EXCEPTION 'comment_unavailable' USING ERRCODE = 'P0002';
    END IF;
    -- Flatten: replying to a reply attaches to its top level comment.
    IF parent.parent_comment_id IS NOT NULL THEN
      NEW.parent_comment_id := parent.parent_comment_id;
      SELECT id, post_id, user_id, parent_comment_id INTO parent
        FROM post_comments WHERE id = NEW.parent_comment_id;
    END IF;
    IF users_blocked(NEW.user_id, parent.user_id) THEN
      RAISE EXCEPTION 'comment_unavailable' USING ERRCODE = 'P0002';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_comments_validate ON post_comments;
CREATE TRIGGER trg_post_comments_validate
  BEFORE INSERT ON post_comments
  FOR EACH ROW EXECUTE FUNCTION validate_post_comment();

-- Commenting requires an active account.
DROP POLICY IF EXISTS "post_comments_insert_own" ON post_comments;
CREATE POLICY "post_comments_insert_own" ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND viewer_is_active());

-- Notify: reply -> parent comment author; any comment -> post author
-- (once, even when the post author also wrote the parent comment).
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  post_author UUID;
  parent_author UUID;
BEGIN
  SELECT user_id INTO post_author FROM posts WHERE id = NEW.post_id;

  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT user_id INTO parent_author FROM post_comments WHERE id = NEW.parent_comment_id;
    IF parent_author IS NOT NULL
       AND parent_author <> NEW.user_id
       AND NOT users_blocked(parent_author, NEW.user_id) THEN
      INSERT INTO notifications (user_id, kind, actor_id, related_post_id, payload)
      VALUES (
        parent_author, 'comment_reply', NEW.user_id, NEW.post_id,
        jsonb_build_object('preview', left(NEW.body, 140), 'comment_id', NEW.id)
      );
    END IF;
  END IF;

  IF post_author IS NOT NULL
     AND post_author <> NEW.user_id
     AND post_author IS DISTINCT FROM parent_author
     AND NOT users_blocked(post_author, NEW.user_id) THEN
    INSERT INTO notifications (user_id, kind, actor_id, related_post_id, payload)
    VALUES (
      post_author, 'new_comment', NEW.user_id, NEW.post_id,
      jsonb_build_object('preview', left(NEW.body, 140), 'comment_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ---------- comment likes ----------
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);
CREATE INDEX IF NOT EXISTS comment_likes_user_idx ON comment_likes(user_id);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comment_likes_read" ON comment_likes FOR SELECT
  USING (auth.uid() IS NOT NULL AND NOT blocked_with_viewer(user_id));

-- The EXISTS runs under post_comments RLS, so a comment hidden by a block
-- can't be liked.
CREATE POLICY "comment_likes_insert_own" ON comment_likes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND viewer_is_active()
    AND EXISTS (SELECT 1 FROM post_comments c WHERE c.id = comment_likes.comment_id)
  );

CREATE POLICY "comment_likes_delete_own" ON comment_likes FOR DELETE
  USING (auth.uid() = user_id);
