-- ============================================
-- LOOP: Allow DMs initiated from a post or profile
-- ============================================

-- Expand the conversations.origin CHECK to include 'post' and 'profile'.
-- Triggered when a user clicks "Message" on a feed post or profile card.
ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_origin_check;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_origin_check
  CHECK (origin IN ('match','cold_vault','engagement','post','profile'));

-- Bound message body length so the UI/textarea limit isn't hopeful (4 KB hard cap).
ALTER TABLE messages
  ADD CONSTRAINT messages_body_length_check
  CHECK (char_length(body) BETWEEN 1 AND 4000);

-- ============================================
-- start_or_get_dm(other_user_id, origin):
-- Normalizes participants so (A, B) and (B, A) collapse to one row.
-- Returns the conversation id. SECURITY DEFINER so a user can create
-- a conversation referencing another profile they wouldn't otherwise
-- be allowed to INSERT against (RLS lets you insert your own side
-- but a DM has two sides; defining function bypasses RLS safely).
-- ============================================

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
  IF me IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF me = other_user_id THEN
    RAISE EXCEPTION 'cannot DM yourself';
  END IF;

  -- Normalize: lexicographically smaller UUID is participant_a.
  IF me < other_user_id THEN
    a := me; b := other_user_id;
  ELSE
    a := other_user_id; b := me;
  END IF;

  -- match_id is NULL for post/profile-originated DMs; the UNIQUE constraint
  -- treats NULLs as distinct, so look it up with IS NULL explicitly.
  SELECT id INTO conv_id
  FROM conversations
  WHERE participant_a = a
    AND participant_b = b
    AND match_id IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF conv_id IS NULL THEN
    INSERT INTO conversations (participant_a, participant_b, origin, match_id)
    VALUES (a, b, conv_origin, NULL)
    RETURNING id INTO conv_id;
  END IF;

  RETURN conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION start_or_get_dm(UUID, TEXT) TO authenticated;

-- ============================================
-- Bump last_message_at when a message is inserted
-- (so the inbox list orders correctly).
-- ============================================

CREATE OR REPLACE FUNCTION bump_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_bump_conv ON messages;
CREATE TRIGGER trg_messages_bump_conv
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION bump_conversation_last_message();
