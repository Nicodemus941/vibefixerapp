-- ============================================
-- LOOP: Notifications — what changed since you were away
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN (
    'new_match','new_message','new_reaction','match_accepted'
  )),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  related_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  related_match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  related_conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  payload JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX notifications_user_unread_idx
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX notifications_user_idx
  ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_read_own" ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Triggers — auto-fill notifications on key events
-- ============================================

-- New match: notify both seeker and provider.
CREATE OR REPLACE FUNCTION notify_new_match()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO notifications (user_id, kind, actor_id, related_match_id, payload)
  VALUES
    (NEW.seeker_id, 'new_match', NEW.provider_id, NEW.id,
      jsonb_build_object('match_score', NEW.match_score)),
    (NEW.provider_id, 'new_match', NEW.seeker_id, NEW.id,
      jsonb_build_object('match_score', NEW.match_score));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_match_notify ON matches;
CREATE TRIGGER trg_match_notify
  AFTER INSERT ON matches
  FOR EACH ROW EXECUTE FUNCTION notify_new_match();

-- New message: notify the recipient (not the sender).
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  c RECORD;
  recipient UUID;
BEGIN
  SELECT participant_a, participant_b INTO c
  FROM conversations WHERE id = NEW.conversation_id;
  recipient := CASE WHEN c.participant_a = NEW.sender_id THEN c.participant_b ELSE c.participant_a END;
  IF recipient IS NULL OR recipient = NEW.sender_id THEN RETURN NEW; END IF;

  INSERT INTO notifications (user_id, kind, actor_id, related_conversation_id, payload)
  VALUES (
    recipient,
    'new_message',
    NEW.sender_id,
    NEW.conversation_id,
    jsonb_build_object('preview', left(NEW.body, 140))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_message_notify ON messages;
CREATE TRIGGER trg_message_notify
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

-- New reaction: notify the post author (not the reactor).
CREATE OR REPLACE FUNCTION notify_new_reaction()
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
    'new_reaction',
    NEW.user_id,
    NEW.post_id,
    jsonb_build_object('reaction_kind', NEW.kind)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reaction_notify ON post_reactions;
CREATE TRIGGER trg_reaction_notify
  AFTER INSERT ON post_reactions
  FOR EACH ROW EXECUTE FUNCTION notify_new_reaction();

-- Match accepted: notify the *other* side.
CREATE OR REPLACE FUNCTION notify_match_accepted()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.seeker_status = 'accepted' AND COALESCE(OLD.seeker_status, '') != 'accepted' THEN
    INSERT INTO notifications (user_id, kind, actor_id, related_match_id)
    VALUES (NEW.provider_id, 'match_accepted', NEW.seeker_id, NEW.id);
  END IF;
  IF NEW.provider_status = 'accepted' AND COALESCE(OLD.provider_status, '') != 'accepted' THEN
    INSERT INTO notifications (user_id, kind, actor_id, related_match_id)
    VALUES (NEW.seeker_id, 'match_accepted', NEW.provider_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_match_accept_notify ON matches;
CREATE TRIGGER trg_match_accept_notify
  AFTER UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION notify_match_accepted();

-- ============================================
-- Add notifications to realtime publication
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
