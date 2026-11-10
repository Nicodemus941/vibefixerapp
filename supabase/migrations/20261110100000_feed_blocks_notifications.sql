-- ============================================
-- Feed parity, part 1: two-way blocks on feed content + notification kinds
-- ============================================
-- Until now a block only hid the blocked user's posts from the blocker's
-- feed (one direction, feed RPC only). Posts, comments and reactions were
-- still readable both ways through plain table reads. This migration:
--   1. Adds blocked_with_viewer(other) so RLS can check a block in either
--      direction without exposing the blocks table (blocks RLS only lets
--      the blocker read their own rows).
--   2. Rewrites the SELECT policies on posts / post_comments /
--      post_reactions to hide rows across a block, both ways.
--   3. Widens notifications.kind for mentions, comment replies and reposts.
--   4. Re-creates notify_new_reaction / notify_new_comment as SECURITY
--      DEFINER. notifications has no INSERT policy, so the old invoker
--      triggers made a reaction or comment on someone else's post fail
--      with an RLS error. They also now skip blocked pairs.

CREATE OR REPLACE FUNCTION public.blocked_with_viewer(other UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT other IS NOT NULL
    AND auth.uid() IS NOT NULL
    AND other <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM blocks b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = other)
         OR (b.blocker_id = other AND b.blocked_id = auth.uid())
    );
$$;
-- Supabase default privileges grant EXECUTE to anon/authenticated
-- explicitly, so revoke from those roles too, not just PUBLIC.
REVOKE ALL ON FUNCTION public.blocked_with_viewer(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.blocked_with_viewer(UUID) TO authenticated;

-- Pair check for SECURITY DEFINER triggers (not granted to clients, so a
-- user can't probe whether two other people blocked each other).
CREATE OR REPLACE FUNCTION public.users_blocked(a UUID, b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT a IS NOT NULL AND b IS NOT NULL AND a <> b AND EXISTS (
    SELECT 1 FROM blocks bl
    WHERE (bl.blocker_id = a AND bl.blocked_id = b)
       OR (bl.blocker_id = b AND bl.blocked_id = a)
  );
$$;
REVOKE ALL ON FUNCTION public.users_blocked(UUID, UUID) FROM PUBLIC, anon, authenticated;

-- ---------- RLS: hide content across a block ----------
DROP POLICY IF EXISTS "posts_read_authenticated" ON posts;
CREATE POLICY "posts_read_authenticated" ON posts FOR SELECT
  USING (auth.uid() IS NOT NULL AND NOT blocked_with_viewer(user_id));

DROP POLICY IF EXISTS "post_comments_read_authenticated" ON post_comments;
CREATE POLICY "post_comments_read_authenticated" ON post_comments FOR SELECT
  USING (auth.uid() IS NOT NULL AND NOT blocked_with_viewer(user_id));

DROP POLICY IF EXISTS "post_reactions_read_authenticated" ON post_reactions;
CREATE POLICY "post_reactions_read_authenticated" ON post_reactions FOR SELECT
  USING (auth.uid() IS NOT NULL AND NOT blocked_with_viewer(user_id));

-- ---------- notification kinds ----------
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_kind_check
  CHECK (kind IN (
    'new_match','match_accepted','new_message','new_reaction','new_comment',
    'new_document','document_signed','new_review','new_dispute','dispute_resolved',
    'new_follower',
    'mention','comment_reply','new_repost'
  ));

-- ---------- reaction + comment notifications (definer, block aware) ----------
CREATE OR REPLACE FUNCTION notify_new_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  post_author UUID;
BEGIN
  SELECT user_id INTO post_author FROM posts WHERE id = NEW.post_id;
  IF post_author IS NULL OR post_author = NEW.user_id THEN RETURN NEW; END IF;
  IF users_blocked(post_author, NEW.user_id) THEN RETURN NEW; END IF;

  INSERT INTO notifications (user_id, kind, actor_id, related_post_id, payload)
  VALUES (
    post_author,
    'new_reaction',
    NEW.user_id,
    NEW.post_id,
    jsonb_build_object('reaction_kind', NEW.kind)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  post_author UUID;
BEGIN
  SELECT user_id INTO post_author FROM posts WHERE id = NEW.post_id;
  IF post_author IS NULL OR post_author = NEW.user_id THEN RETURN NEW; END IF;
  IF users_blocked(post_author, NEW.user_id) THEN RETURN NEW; END IF;

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
