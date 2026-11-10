-- ============================================
-- Authentic network, part 1: reply rate
-- ============================================
-- member_reply_stats(target) returns one aggregate row about how a member
-- answers people who reach out to them. Never message bodies, never ids.
--
-- Rules (mirrored in src/lib/reply-rate.ts):
--   * A conversation counts when someone other than the member sent its
--     first message, in the last 90 days.
--   * It counts as replied when the member sent a message within 7 days
--     of that first message.
--   * A conversation still inside its 7 day window and not yet answered
--     is left out, so nobody is punished for a message from this morning.
--   * Below 5 counted conversations the rate and median are NULL. The UI
--     then shows nothing.
--   * Across a block (either way) the caller gets nothing.

CREATE INDEX IF NOT EXISTS conv_participant_b_idx ON conversations(participant_b);
CREATE INDEX IF NOT EXISTS msg_conv_created_asc_idx ON messages(conversation_id, created_at, id);

CREATE OR REPLACE FUNCTION public.member_reply_stats(target UUID)
RETURNS TABLE (
  eligible INT,
  replied INT,
  reply_rate NUMERIC,
  median_reply_seconds NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  n_eligible INT;
  n_replied INT;
  med NUMERIC;
BEGIN
  IF target IS NULL THEN RETURN; END IF;
  IF auth.uid() IS NOT NULL AND blocked_with_viewer(target) THEN RETURN; END IF;

  WITH convs AS (
    SELECT c.id
    FROM conversations c
    WHERE c.participant_a = target OR c.participant_b = target
  ),
  firsts AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id, m.sender_id, m.created_at
    FROM messages m
    JOIN convs ON convs.id = m.conversation_id
    ORDER BY m.conversation_id, m.created_at, m.id
  ),
  inbound AS (
    SELECT
      f.created_at AS first_at,
      (
        SELECT min(m2.created_at)
        FROM messages m2
        WHERE m2.conversation_id = f.conversation_id
          AND m2.sender_id = target
          AND m2.created_at > f.created_at
      ) AS reply_at
    FROM firsts f
    WHERE f.sender_id <> target
      AND f.created_at > now() - INTERVAL '90 days'
  ),
  scored AS (
    SELECT
      first_at,
      reply_at,
      (reply_at IS NOT NULL AND reply_at <= first_at + INTERVAL '7 days') AS in_time
    FROM inbound
  ),
  counted AS (
    SELECT * FROM scored
    WHERE in_time OR first_at <= now() - INTERVAL '7 days'
  )
  SELECT
    count(*)::INT,
    count(*) FILTER (WHERE in_time)::INT,
    (percentile_cont(0.5) WITHIN GROUP (
       ORDER BY extract(epoch FROM (reply_at - first_at))
     ) FILTER (WHERE in_time))::NUMERIC
  INTO n_eligible, n_replied, med
  FROM counted;

  IF n_eligible < 5 THEN
    -- Not enough history to be fair. Say nothing about the member.
    RETURN QUERY SELECT 0, 0, NULL::NUMERIC, NULL::NUMERIC;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    n_eligible,
    n_replied,
    round(n_replied::NUMERIC / n_eligible, 4),
    CASE WHEN n_replied > 0 THEN round(med) ELSE NULL END;
END;
$$;

REVOKE ALL ON FUNCTION public.member_reply_stats(UUID) FROM PUBLIC;
-- The public card (/c) is readable without an account, and the result is
-- only an aggregate, so anon may call it too.
GRANT EXECUTE ON FUNCTION public.member_reply_stats(UUID) TO anon, authenticated;
