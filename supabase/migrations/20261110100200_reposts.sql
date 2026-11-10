-- ============================================
-- Feed parity, part 3: reposts and quote reposts
-- ============================================
-- A plain repost is a posts row with repost_of_id set and no content of
-- its own (body ''), so it flows through feed_for_user like any post and
-- the feed can render "X reposted". A quote repost is a normal post with
-- quoted_post_id set.
--
-- Neither column has a foreign key on purpose: when the original is
-- deleted the reference is left dangling and the UI renders "This post is
-- unavailable" instead of silently dropping the repost or the quote.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS repost_of_id UUID,
  ADD COLUMN IF NOT EXISTS quoted_post_id UUID;

CREATE INDEX IF NOT EXISTS posts_repost_of_idx ON posts(repost_of_id)
  WHERE repost_of_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS posts_quoted_idx ON posts(quoted_post_id)
  WHERE quoted_post_id IS NOT NULL;

-- One plain repost per user per original.
CREATE UNIQUE INDEX IF NOT EXISTS posts_one_repost_per_user
  ON posts(user_id, repost_of_id) WHERE repost_of_id IS NOT NULL;

ALTER TABLE posts ADD CONSTRAINT posts_repost_or_quote CHECK (
  repost_of_id IS NULL OR quoted_post_id IS NULL
);
ALTER TABLE posts ADD CONSTRAINT posts_plain_repost_empty CHECK (
  repost_of_id IS NULL OR (
    char_length(body) = 0
    AND jsonb_array_length(media) = 0
    AND document IS NULL
    AND link_preview IS NULL
  )
);

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_body_check;
ALTER TABLE posts ADD CONSTRAINT posts_body_check CHECK (
  char_length(body) <= 3000
  AND (
    char_length(body) >= 1
    OR repost_of_id IS NOT NULL
    OR jsonb_array_length(media) > 0
    OR document IS NOT NULL
  )
);

-- Validate the target at insert time and keep references immutable.
--  * target must exist (so a deleted post can't be reposted)
--  * no reposting group posts (they may be private) or into groups
--  * no reposting across a block
--  * reposting a plain repost re-points at the original
--  * plain reposts inherit kind, hashtags and embedding so they rank and
--    filter like the original
CREATE OR REPLACE FUNCTION validate_post_refs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_id UUID;
  t RECORD;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.repost_of_id IS DISTINCT FROM OLD.repost_of_id
       OR NEW.quoted_post_id IS DISTINCT FROM OLD.quoted_post_id THEN
      RAISE EXCEPTION 'repost references are immutable' USING ERRCODE = '22023';
    END IF;
    RETURN NEW;
  END IF;

  target_id := coalesce(NEW.repost_of_id, NEW.quoted_post_id);
  IF target_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.group_id IS NOT NULL THEN
    RAISE EXCEPTION 'reposts are not allowed in groups' USING ERRCODE = '22023';
  END IF;

  SELECT id, user_id, kind, hashtags, embedding, group_id, repost_of_id
    INTO t FROM posts WHERE id = target_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'post_unavailable' USING ERRCODE = 'P0002';
  END IF;

  -- Point at the original, never at another plain repost.
  IF t.repost_of_id IS NOT NULL THEN
    SELECT id, user_id, kind, hashtags, embedding, group_id, repost_of_id
      INTO t FROM posts WHERE id = t.repost_of_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'post_unavailable' USING ERRCODE = 'P0002';
    END IF;
    IF NEW.repost_of_id IS NOT NULL THEN
      NEW.repost_of_id := t.id;
    ELSE
      NEW.quoted_post_id := t.id;
    END IF;
  END IF;

  IF t.group_id IS NOT NULL THEN
    RAISE EXCEPTION 'group posts cannot be reposted' USING ERRCODE = '22023';
  END IF;
  IF users_blocked(NEW.user_id, t.user_id) THEN
    RAISE EXCEPTION 'post_unavailable' USING ERRCODE = 'P0002';
  END IF;

  IF NEW.repost_of_id IS NOT NULL THEN
    NEW.body := '';
    NEW.kind := t.kind;
    NEW.hashtags := t.hashtags;
    NEW.embedding := t.embedding;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_validate_refs ON posts;
CREATE TRIGGER trg_posts_validate_refs
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION validate_post_refs();

-- Notify the original author.
CREATE OR REPLACE FUNCTION notify_new_repost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_id UUID := coalesce(NEW.repost_of_id, NEW.quoted_post_id);
  original_author UUID;
BEGIN
  IF target_id IS NULL THEN RETURN NEW; END IF;
  SELECT user_id INTO original_author FROM posts WHERE id = target_id;
  IF original_author IS NULL OR original_author = NEW.user_id THEN RETURN NEW; END IF;
  IF users_blocked(original_author, NEW.user_id) THEN RETURN NEW; END IF;

  INSERT INTO notifications (user_id, kind, actor_id, related_post_id, payload)
  VALUES (
    original_author,
    'new_repost',
    NEW.user_id,
    target_id,
    jsonb_build_object(
      'quote', NEW.quoted_post_id IS NOT NULL,
      'repost_id', NEW.id,
      'preview', CASE WHEN NEW.quoted_post_id IS NOT NULL THEN left(NEW.body, 140) END
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_repost_notify ON posts;
CREATE TRIGGER trg_posts_repost_notify
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION notify_new_repost();

-- Repost counts (plain + quote) for a batch of posts, respecting blocks.
CREATE OR REPLACE FUNCTION post_repost_counts(post_ids UUID[])
RETURNS TABLE (post_id UUID, reposts BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(p.repost_of_id, p.quoted_post_id) AS post_id, count(*) AS reposts
  FROM posts p
  WHERE auth.uid() IS NOT NULL
    AND coalesce(p.repost_of_id, p.quoted_post_id) = ANY(post_ids)
    AND NOT users_blocked(auth.uid(), p.user_id)
  GROUP BY 1;
$$;
REVOKE ALL ON FUNCTION post_repost_counts(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION post_repost_counts(UUID[]) TO authenticated;
