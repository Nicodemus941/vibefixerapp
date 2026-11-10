-- ============================================
-- Feed parity, part 8: polls
-- ============================================
-- 2 to 4 options, runs 1, 3 or 7 days, one vote per user (final).
-- Counts are only returned once the viewer has voted, the poll has ended,
-- or the viewer wrote the post.

CREATE OR REPLACE FUNCTION poll_options_ok(opts TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT array_length(opts, 1) BETWEEN 2 AND 4
    AND NOT EXISTS (
      SELECT 1 FROM unnest(opts) o
      WHERE o IS NULL OR char_length(btrim(o)) NOT BETWEEN 1 AND 80
    );
$$;

CREATE TABLE IF NOT EXISTS post_polls (
  post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  options TEXT[] NOT NULL CHECK (poll_options_ok(options)),
  duration_days SMALLINT NOT NULL CHECK (duration_days IN (1, 3, 7)),
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ends_at is derived, never client supplied.
CREATE OR REPLACE FUNCTION set_poll_ends_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.created_at := now();
  NEW.ends_at := now() + make_interval(days => NEW.duration_days);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_polls_ends_at ON post_polls;
CREATE TRIGGER trg_post_polls_ends_at
  BEFORE INSERT ON post_polls
  FOR EACH ROW EXECUTE FUNCTION set_poll_ends_at();

ALTER TABLE post_polls ENABLE ROW LEVEL SECURITY;

-- Visible when the post is visible (posts RLS handles blocks).
CREATE POLICY "post_polls_read" ON post_polls FOR SELECT
  USING (EXISTS (SELECT 1 FROM posts p WHERE p.id = post_polls.post_id));

-- Only the author, only on a fresh, non repost post.
CREATE POLICY "post_polls_insert_author" ON post_polls FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_polls.post_id
        AND p.user_id = auth.uid()
        AND p.repost_of_id IS NULL
        AND p.created_at > now() - interval '10 minutes'
    )
  );

CREATE TABLE IF NOT EXISTS poll_votes (
  post_id UUID NOT NULL REFERENCES post_polls(post_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  option_index SMALLINT NOT NULL CHECK (option_index BETWEEN 0 AND 3),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll_votes_read_own" ON poll_votes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "poll_votes_insert_own" ON poll_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND viewer_is_active()
    AND EXISTS (
      SELECT 1 FROM post_polls pp
      WHERE pp.post_id = poll_votes.post_id
        AND pp.ends_at > now()
        AND poll_votes.option_index < array_length(pp.options, 1)
    )
  );

-- Batch poll state for the feed.
CREATE OR REPLACE FUNCTION poll_results(post_ids UUID[])
RETURNS TABLE (
  post_id UUID,
  options TEXT[],
  ends_at TIMESTAMPTZ,
  my_vote SMALLINT,
  total_votes BIGINT,
  counts BIGINT[],
  show_results BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH visible AS (
    SELECT pp.*, p.user_id AS author_id
    FROM post_polls pp
    JOIN posts p ON p.id = pp.post_id
    WHERE auth.uid() IS NOT NULL
      AND pp.post_id = ANY(post_ids)
      AND NOT users_blocked(auth.uid(), p.user_id)
  ),
  mine AS (
    SELECT v.post_id, v.option_index FROM poll_votes v
    WHERE v.user_id = auth.uid() AND v.post_id = ANY(post_ids)
  ),
  tallies AS (
    SELECT v.post_id, v.option_index, count(*) AS n
    FROM poll_votes v
    WHERE v.post_id = ANY(post_ids)
    GROUP BY 1, 2
  )
  SELECT
    vis.post_id,
    vis.options,
    vis.ends_at,
    m.option_index AS my_vote,
    coalesce((SELECT sum(t.n) FROM tallies t WHERE t.post_id = vis.post_id), 0)::BIGINT AS total_votes,
    CASE WHEN m.option_index IS NOT NULL OR vis.ends_at <= now() OR vis.author_id = auth.uid()
      THEN ARRAY(
        SELECT coalesce((SELECT t.n FROM tallies t WHERE t.post_id = vis.post_id AND t.option_index = i - 1), 0)::BIGINT
        FROM generate_series(1, array_length(vis.options, 1)) AS i
        ORDER BY i
      )
      ELSE NULL
    END AS counts,
    (m.option_index IS NOT NULL OR vis.ends_at <= now() OR vis.author_id = auth.uid()) AS show_results
  FROM visible vis
  LEFT JOIN mine m ON m.post_id = vis.post_id;
$$;
REVOKE ALL ON FUNCTION poll_results(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION poll_results(UUID[]) TO authenticated;
