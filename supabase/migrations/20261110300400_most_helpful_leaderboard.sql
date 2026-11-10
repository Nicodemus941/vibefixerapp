-- ============================================
-- Authentic network, part 4: "Most helpful this month"
-- ============================================
-- The leaderboard ranks help given and reviews received. No money
-- totals, no follower or reaction counts.
--
-- What the data supports, and the weights:
--   * deals delivered as provider (engagement released this month)   x3
--   * needs answered with "I can help" where the person with the need
--     replied in that conversation (new help_offers table)             x2
--   * reviews received this month                                      x1
-- "Comment replies marked helpful" does not exist in the schema, so it
-- is not counted.

-- ---------- conversations can start from "I can help" ----------
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_origin_check;
ALTER TABLE conversations
  ADD CONSTRAINT conversations_origin_check
  CHECK (origin IN ('match','cold_vault','engagement','post','profile','help'));

-- ---------- help_offers ----------
CREATE TABLE IF NOT EXISTS help_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  helper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  need_author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (helper_id, post_id),
  CHECK (helper_id <> need_author_id)
);
CREATE INDEX IF NOT EXISTS help_offers_helper_created_idx ON help_offers(helper_id, created_at DESC);
CREATE INDEX IF NOT EXISTS help_offers_post_idx ON help_offers(post_id);

ALTER TABLE help_offers ENABLE ROW LEVEL SECURITY;
-- The helper and the person with the need can see the row. Rows are only
-- created through offer_help() below.
CREATE POLICY "help_offers_read_party" ON help_offers FOR SELECT
  USING (
    (auth.uid() = helper_id OR auth.uid() = need_author_id)
    AND NOT blocked_with_viewer(CASE WHEN auth.uid() = helper_id THEN need_author_id ELSE helper_id END)
  );

-- ---------- offer_help(post) ----------
-- "I can help" on a need: opens (or reuses) the DM with the author and
-- records the offer of help. Returns the conversation id. The first
-- message still goes through the give first rules on messages.
CREATE OR REPLACE FUNCTION public.offer_help(target_post UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  me UUID := auth.uid();
  p RECORD;
  conv_id UUID;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Sign in to offer help.'; END IF;

  SELECT id, user_id, kind, group_id INTO p FROM posts WHERE id = target_post;
  IF NOT FOUND OR p.kind <> 'need' THEN
    RAISE EXCEPTION 'That need is no longer available.';
  END IF;
  IF p.user_id = me THEN
    RAISE EXCEPTION 'This is your own need.';
  END IF;
  IF users_blocked(me, p.user_id) THEN
    RAISE EXCEPTION 'That need is no longer available.';
  END IF;

  conv_id := start_or_get_dm(p.user_id, 'help');

  INSERT INTO help_offers (helper_id, post_id, need_author_id, conversation_id)
  VALUES (me, p.id, p.user_id, conv_id)
  ON CONFLICT (helper_id, post_id) DO NOTHING;

  RETURN conv_id;
END;
$$;
REVOKE ALL ON FUNCTION public.offer_help(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.offer_help(UUID) TO authenticated;

-- ---------- leaderboard ----------
CREATE OR REPLACE FUNCTION public.leaderboard_most_helpful(limit_count INT DEFAULT 20)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  deals_delivered BIGINT,
  needs_helped BIGINT,
  reviews_received BIGINT,
  avg_rating NUMERIC,
  score BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH month_start AS (
    SELECT (date_trunc('month', now() AT TIME ZONE 'utc') AT TIME ZONE 'utc') AS t
  ),
  deals AS (
    SELECT e.provider_id AS uid, count(*) AS n
    FROM engagements e, month_start ms
    WHERE e.escrow_status = 'released' AND e.completed_at >= ms.t
    GROUP BY e.provider_id
  ),
  helps AS (
    SELECT h.helper_id AS uid, count(*) AS n
    FROM help_offers h, month_start ms
    WHERE h.created_at >= ms.t
      AND EXISTS (
        SELECT 1 FROM messages m
        WHERE m.conversation_id = h.conversation_id
          AND m.sender_id = h.need_author_id
          AND m.created_at > h.created_at
      )
    GROUP BY h.helper_id
  ),
  revs AS (
    SELECT r.reviewee_id AS uid, count(*) AS n, avg(r.rating)::NUMERIC AS avg_rating
    FROM reviews r, month_start ms
    WHERE r.created_at >= ms.t
    GROUP BY r.reviewee_id
  ),
  ids AS (
    SELECT uid FROM deals UNION SELECT uid FROM helps UNION SELECT uid FROM revs
  )
  SELECT
    pr.id,
    pr.display_name,
    pr.company_name,
    pr.avatar_url,
    coalesce(d.n, 0),
    coalesce(h.n, 0),
    coalesce(r.n, 0),
    round(r.avg_rating, 1),
    (coalesce(d.n, 0) * 3 + coalesce(h.n, 0) * 2 + coalesce(r.n, 0))::BIGINT AS score
  FROM ids
  JOIN profiles pr ON pr.id = ids.uid
  LEFT JOIN deals d ON d.uid = ids.uid
  LEFT JOIN helps h ON h.uid = ids.uid
  LEFT JOIN revs r ON r.uid = ids.uid
  WHERE coalesce(pr.reciprocity_status, 'active') <> 'suspended'
    AND (auth.uid() IS NULL OR NOT blocked_with_viewer(pr.id))
  ORDER BY score DESC, coalesce(r.avg_rating, 0) DESC, pr.display_name ASC
  LIMIT least(greatest(coalesce(limit_count, 20), 1), 50);
$$;
REVOKE ALL ON FUNCTION public.leaderboard_most_helpful(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leaderboard_most_helpful(INT) TO authenticated;

-- The old boards ranked money and volume. They are no longer used by the
-- app; keep them callable only by the service role for reporting.
-- Revoke every overload: production has (INT) while the old migration file
-- declared (INT, INT).
DO $$
DECLARE f REGPROCEDURE;
BEGIN
  FOR f IN
    SELECT p.oid::REGPROCEDURE FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN ('leaderboard_top_closers', 'leaderboard_top_earners')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
  END LOOP;
END;
$$;
