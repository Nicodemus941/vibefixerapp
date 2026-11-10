-- ============================================
-- Authentic network, part 2: give first DMs
-- ============================================
-- A cold DM is the first message between two members who have never
-- exchanged a message, have no match, have no deal, and do not follow
-- each other (mutual follow). For a cold DM the database requires:
--   * the sender has at least one active offer (give before you ask),
--   * the first line says how the sender can help, 20 characters or more,
--   * no more than 10 cold DMs per member per day (UTC),
-- and attaches the sender's top offer so the recipient sees it.
-- For every message:
--   * nothing across a block, either way,
--   * the same text (40+ characters, whitespace and case ignored) can go
--     to at most 3 people in 24 hours. A 4th person is refused. Pairs with
--     a deal are exempt (the app posts fixed deal notices in those threads).
-- Errors are raised as plain English sentences (no dashes) so the app
-- can show them as is.
--
-- cold_dm_quota used to be a monthly Vault tier allowance. Loop has no
-- tiers, so it is replaced by a daily counter the app can read to show
-- "N new conversations left today".

-- ---------- columns ----------
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_cold BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES offers(id) ON DELETE SET NULL;

-- ---------- cold_dm_quota: daily, no tiers ----------
DROP TABLE IF EXISTS cold_dm_quota;
CREATE TABLE cold_dm_quota (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  used INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);
ALTER TABLE cold_dm_quota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cold_dm_quota_read_own" ON cold_dm_quota FOR SELECT
  USING (auth.uid() = user_id);
-- Writes only happen inside the SECURITY DEFINER trigger below.

-- ---------- send log for the copy paste check ----------
CREATE TABLE IF NOT EXISTS message_send_log (
  id BIGSERIAL PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS message_send_log_lookup_idx
  ON message_send_log(sender_id, body_hash, created_at DESC);
ALTER TABLE message_send_log ENABLE ROW LEVEL SECURITY;
-- No policies: clients can neither read nor write it. Only the
-- definer triggers touch it. Rows older than a day are pruned on insert.

-- ---------- helpers ----------
-- Whitespace and case do not make a message original.
CREATE OR REPLACE FUNCTION public.message_fingerprint(body TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT md5(lower(regexp_replace(btrim(coalesce(body, '')), '\s+', ' ', 'g')));
$$;

-- Mirrors isColdDm() in src/lib/cold-dm.ts.
CREATE OR REPLACE FUNCTION public.dm_pair_is_cold(sender UUID, recipient UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT NOT (
    -- any message already exchanged, in any conversation, either way
    EXISTS (
      SELECT 1
      FROM conversations c
      JOIN messages m ON m.conversation_id = c.id
      WHERE (c.participant_a = least(sender, recipient) AND c.participant_b = greatest(sender, recipient))
         OR (c.participant_a = greatest(sender, recipient) AND c.participant_b = least(sender, recipient))
    )
    -- a match between them
    OR EXISTS (
      SELECT 1 FROM matches mt
      WHERE (mt.seeker_id = sender AND mt.provider_id = recipient)
         OR (mt.seeker_id = recipient AND mt.provider_id = sender)
    )
    -- a deal between them
    OR EXISTS (
      SELECT 1 FROM engagements e
      WHERE (e.seeker_id = sender AND e.provider_id = recipient)
         OR (e.seeker_id = recipient AND e.provider_id = sender)
    )
    -- they follow each other
    OR (
      EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = sender AND f.following_id = recipient)
      AND EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = recipient AND f.following_id = sender)
    )
  );
$$;
REVOKE ALL ON FUNCTION public.dm_pair_is_cold(UUID, UUID) FROM PUBLIC, anon, authenticated;

-- What the composer needs to know before the first message: is this a
-- cold DM, does the viewer have an offer, and how many are left today.
CREATE OR REPLACE FUNCTION public.viewer_dm_status(other UUID)
RETURNS TABLE (
  is_cold BOOLEAN,
  has_offer BOOLEAN,
  cold_left_today INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  me UUID := auth.uid();
BEGIN
  IF me IS NULL OR other IS NULL OR other = me THEN RETURN; END IF;
  IF users_blocked(me, other) THEN RETURN; END IF;
  RETURN QUERY SELECT
    dm_pair_is_cold(me, other),
    EXISTS (SELECT 1 FROM offers o WHERE o.user_id = me AND o.is_active),
    greatest(0, 10 - coalesce(
      (SELECT q.used FROM cold_dm_quota q
       WHERE q.user_id = me AND q.day = (now() AT TIME ZONE 'utc')::DATE), 0))::INT;
END;
$$;
REVOKE ALL ON FUNCTION public.viewer_dm_status(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.viewer_dm_status(UUID) TO authenticated;

-- ---------- BEFORE INSERT: checks ----------
CREATE OR REPLACE FUNCTION public.guard_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  conv RECORD;
  recipient UUID;
  first_line TEXT;
  used_today INT;
  fp TEXT;
  norm_len INT;
  other_recipients INT;
  top_offer UUID;
BEGIN
  SELECT participant_a, participant_b INTO conv
  FROM conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'That conversation no longer exists.';
  END IF;
  IF NEW.sender_id = conv.participant_a THEN
    recipient := conv.participant_b;
  ELSIF NEW.sender_id = conv.participant_b THEN
    recipient := conv.participant_a;
  ELSE
    RAISE EXCEPTION 'You are not part of this conversation.';
  END IF;

  IF users_blocked(NEW.sender_id, recipient) THEN
    RAISE EXCEPTION 'You can not message this member.';
  END IF;

  -- Set by the trigger only, never trusted from the client.
  NEW.is_cold := false;

  IF dm_pair_is_cold(NEW.sender_id, recipient) THEN
    IF NOT EXISTS (SELECT 1 FROM offers o WHERE o.user_id = NEW.sender_id AND o.is_active) THEN
      RAISE EXCEPTION 'Add at least one offer before you message someone new. On Loop you give before you ask.';
    END IF;

    first_line := btrim(split_part(NEW.body, E'\n', 1));
    IF char_length(first_line) < 20 THEN
      RAISE EXCEPTION 'Start with how you can help them, in at least 20 characters.';
    END IF;

    SELECT q.used INTO used_today FROM cold_dm_quota q
    WHERE q.user_id = NEW.sender_id AND q.day = (now() AT TIME ZONE 'utc')::DATE;
    IF coalesce(used_today, 0) >= 10 THEN
      RAISE EXCEPTION 'You have started 10 new conversations today. You can start more tomorrow.';
    END IF;

    -- Attach an offer the sender owns. If the client picked one, it must
    -- be theirs and active; otherwise use their newest active offer.
    IF NEW.offer_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM offers o WHERE o.id = NEW.offer_id AND o.user_id = NEW.sender_id AND o.is_active
    ) THEN
      NEW.offer_id := NULL;
    END IF;
    IF NEW.offer_id IS NULL THEN
      SELECT o.id INTO top_offer FROM offers o
      WHERE o.user_id = NEW.sender_id AND o.is_active
      ORDER BY o.created_at DESC LIMIT 1;
      NEW.offer_id := top_offer;
    END IF;
    NEW.is_cold := true;
  ELSE
    -- Offers are only attached to the opening of a cold conversation.
    NEW.offer_id := NULL;
  END IF;

  -- Anti copy paste. Short notes ("thanks, talk soon") are exempt, and so
  -- are pairs with a deal, whose threads get the app's fixed deal notices.
  norm_len := char_length(regexp_replace(btrim(NEW.body), '\s+', ' ', 'g'));
  IF norm_len >= 40 AND NOT EXISTS (
    SELECT 1 FROM engagements e
    WHERE (e.seeker_id = NEW.sender_id AND e.provider_id = recipient)
       OR (e.seeker_id = recipient AND e.provider_id = NEW.sender_id)
  ) THEN
    fp := message_fingerprint(NEW.body);
    SELECT count(DISTINCT l.recipient_id) INTO other_recipients
    FROM message_send_log l
    WHERE l.sender_id = NEW.sender_id
      AND l.body_hash = fp
      AND l.recipient_id <> recipient
      AND l.created_at > now() - INTERVAL '24 hours';
    IF other_recipients >= 3 THEN
      RAISE EXCEPTION 'You already sent this exact message to 3 people today. Write this person a note of their own.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_guard ON messages;
CREATE TRIGGER trg_messages_guard
  BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION guard_message_insert();

-- ---------- AFTER INSERT: bookkeeping ----------
-- Done after the row is stored so a failed insert never uses up quota.
CREATE OR REPLACE FUNCTION public.record_message_send()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  recipient UUID;
BEGIN
  SELECT CASE WHEN c.participant_a = NEW.sender_id THEN c.participant_b ELSE c.participant_a END
  INTO recipient
  FROM conversations c WHERE c.id = NEW.conversation_id;

  IF char_length(regexp_replace(btrim(NEW.body), '\s+', ' ', 'g')) >= 40 THEN
    INSERT INTO message_send_log (sender_id, recipient_id, body_hash)
    VALUES (NEW.sender_id, recipient, message_fingerprint(NEW.body));
    DELETE FROM message_send_log
    WHERE sender_id = NEW.sender_id AND created_at < now() - INTERVAL '24 hours';
  END IF;

  IF NEW.is_cold THEN
    INSERT INTO cold_dm_quota (user_id, day, used)
    VALUES (NEW.sender_id, (now() AT TIME ZONE 'utc')::DATE, 1)
    ON CONFLICT (user_id, day)
    DO UPDATE SET used = cold_dm_quota.used + 1, updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_record ON messages;
CREATE TRIGGER trg_messages_record
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION record_message_send();

-- ---------- start_or_get_dm: refuse across a block ----------
CREATE OR REPLACE FUNCTION start_or_get_dm(
  other_user_id UUID,
  conv_origin TEXT DEFAULT 'post'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  me UUID;
  a UUID;
  b UUID;
  conv_id UUID;
BEGIN
  me := auth.uid();
  IF me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF me = other_user_id THEN RAISE EXCEPTION 'cannot DM yourself'; END IF;
  IF NOT viewer_is_active() THEN
    RAISE EXCEPTION 'reciprocity_suspended';
  END IF;
  IF users_blocked(me, other_user_id) THEN
    RAISE EXCEPTION 'You can not message this member.';
  END IF;

  IF me < other_user_id THEN a := me; b := other_user_id;
  ELSE                       a := other_user_id; b := me; END IF;

  SELECT id INTO conv_id
  FROM conversations
  WHERE participant_a = a AND participant_b = b AND match_id IS NULL
  ORDER BY created_at ASC LIMIT 1;

  IF conv_id IS NULL THEN
    INSERT INTO conversations (participant_a, participant_b, origin, match_id)
    VALUES (a, b, conv_origin, NULL) RETURNING id INTO conv_id;
  END IF;
  RETURN conv_id;
END;
$$;
