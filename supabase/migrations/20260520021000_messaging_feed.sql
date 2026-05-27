-- ============================================
-- LOOP: Messaging + Feed Extension
-- ============================================

-- ---------- CONVERSATIONS ----------
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  participant_a UUID NOT NULL REFERENCES profiles(id),
  participant_b UUID NOT NULL REFERENCES profiles(id),
  origin TEXT NOT NULL CHECK (origin IN ('match','cold_vault','engagement')),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_a, participant_b, match_id)
);
CREATE INDEX conv_participants_idx ON conversations(participant_a, participant_b);

-- ---------- MESSAGES ----------
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_ai_drafted BOOLEAN DEFAULT FALSE,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX msg_conv_idx ON messages(conversation_id, created_at DESC);

-- ---------- COLD DM QUOTA (Vault tier) ----------
CREATE TABLE cold_dm_quota (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  limit_count INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- FEED EVENTS (the entire feed lives here) ----------
CREATE TABLE feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'match_closed','open_need','deal_shipped','top_closer','reciprocity_streak','new_vault_member'
  )),
  primary_user_id UUID REFERENCES profiles(id),
  secondary_user_id UUID REFERENCES profiles(id),
  related_engagement UUID REFERENCES engagements(id),
  related_need UUID REFERENCES needs(id),
  headline TEXT NOT NULL,
  amount NUMERIC,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public','tier_pro','tier_vault')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX feed_created_idx ON feed_events(created_at DESC);
CREATE INDEX feed_visibility_idx ON feed_events(visibility);

-- ---------- AUTO-GENERATE FEED EVENTS ----------
-- When a deal closes, post to feed
CREATE OR REPLACE FUNCTION post_deal_closed_event()
RETURNS trigger AS $$
BEGIN
  IF NEW.escrow_status = 'released' AND OLD.escrow_status = 'held' THEN
    INSERT INTO feed_events (event_type, primary_user_id, secondary_user_id, related_engagement, headline, amount)
    VALUES (
      'deal_shipped',
      NEW.provider_id,
      NEW.seeker_id,
      NEW.id,
      'Deal shipped: $' || NEW.amount::TEXT || ' delivered',
      NEW.amount
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

CREATE TRIGGER trg_deal_closed
AFTER UPDATE ON engagements
FOR EACH ROW EXECUTE FUNCTION post_deal_closed_event();

-- When an urgent need is posted, push to feed
CREATE OR REPLACE FUNCTION post_open_need_event()
RETURNS trigger AS $$
BEGIN
  IF NEW.urgency IN ('now','this_week') THEN
    INSERT INTO feed_events (event_type, primary_user_id, related_need, headline)
    VALUES (
      'open_need',
      NEW.user_id,
      NEW.id,
      'Open need: ' || NEW.title
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

CREATE TRIGGER trg_need_posted_feed
AFTER INSERT ON needs
FOR EACH ROW EXECUTE FUNCTION post_open_need_event();

-- ---------- RLS ----------
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_dm_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv_read_participant" ON conversations FOR SELECT
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE POLICY "msg_read_participant" ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
  ));

CREATE POLICY "msg_write_participant" ON messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
  ));

CREATE POLICY "feed_read_by_tier" ON feed_events FOR SELECT
  USING (
    visibility = 'public'
    OR (visibility = 'tier_pro' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tier IN ('pro','vault')))
    OR (visibility = 'tier_vault' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tier = 'vault'))
  );

CREATE POLICY "cold_dm_quota_read_own" ON cold_dm_quota FOR SELECT
  USING (auth.uid() = user_id);
