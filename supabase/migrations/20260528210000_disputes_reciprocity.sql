-- ============================================
-- LOOP: Disputes on engagements + reciprocity hard-block
-- ============================================

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  opener_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 4000),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','resolved_for_seeker','resolved_for_provider','withdrawn')),
  resolution_note TEXT,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX disputes_engagement_idx ON disputes(engagement_id);
CREATE INDEX disputes_status_idx ON disputes(status, created_at DESC);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Participants of the engagement (+ owner/admin) can read the dispute.
CREATE POLICY "disputes_read_participant_or_admin" ON disputes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM engagements e
            WHERE e.id = disputes.engagement_id
              AND (e.seeker_id = auth.uid() OR e.provider_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM profiles pr
               WHERE pr.id = auth.uid() AND pr.role IN ('owner','admin'))
  );

-- Either participant can open / withdraw their own dispute.
CREATE POLICY "disputes_insert_participant" ON disputes FOR INSERT
  WITH CHECK (
    auth.uid() = opener_id
    AND EXISTS (SELECT 1 FROM engagements e
                WHERE e.id = disputes.engagement_id
                  AND (e.seeker_id = auth.uid() OR e.provider_id = auth.uid())
                  AND e.escrow_status = 'held')
  );

-- Update: opener can withdraw; owner/admin can resolve.
CREATE POLICY "disputes_update_opener_or_admin" ON disputes FOR UPDATE
  USING (
    auth.uid() = opener_id
    OR EXISTS (SELECT 1 FROM profiles pr
               WHERE pr.id = auth.uid() AND pr.role IN ('owner','admin'))
  );

-- ============================================
-- Engagement → 'disputed' when an open dispute is filed; back to 'held'
-- when withdrawn; finalized to refunded/released on resolution.
-- ============================================
CREATE OR REPLACE FUNCTION disputes_sync_engagement()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE engagements SET escrow_status = 'disputed' WHERE id = NEW.engagement_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'withdrawn' AND OLD.status = 'open' THEN
      UPDATE engagements SET escrow_status = 'held' WHERE id = NEW.engagement_id;
    ELSIF NEW.status = 'resolved_for_seeker' THEN
      UPDATE engagements
      SET escrow_status = 'refunded', completed_at = COALESCE(completed_at, now())
      WHERE id = NEW.engagement_id;
    ELSIF NEW.status = 'resolved_for_provider' THEN
      UPDATE engagements
      SET escrow_status = 'released', completed_at = COALESCE(completed_at, now())
      WHERE id = NEW.engagement_id;
    END IF;
    IF NEW.status != 'open' AND NEW.resolved_at IS NULL THEN
      NEW.resolved_at := now();
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_disputes_sync ON disputes;
CREATE TRIGGER trg_disputes_sync
  AFTER INSERT OR UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION disputes_sync_engagement();

-- Notify the *other* participant + the platform owner about new disputes.
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_kind_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_kind_check
  CHECK (kind IN (
    'new_match','new_message','new_reaction','match_accepted',
    'new_comment','new_document','document_signed','new_review',
    'new_dispute','dispute_resolved'
  ));

CREATE OR REPLACE FUNCTION notify_new_dispute()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  eng RECORD;
  other UUID;
  owner_id UUID;
BEGIN
  SELECT seeker_id, provider_id, amount INTO eng
  FROM engagements WHERE id = NEW.engagement_id;
  other := CASE WHEN eng.seeker_id = NEW.opener_id THEN eng.provider_id ELSE eng.seeker_id END;

  INSERT INTO notifications (user_id, kind, actor_id, related_conversation_id, payload)
  VALUES (other, 'new_dispute', NEW.opener_id, NULL,
    jsonb_build_object('engagement_id', NEW.engagement_id, 'amount', eng.amount));

  -- Also ping the platform owner (admin queue).
  SELECT id INTO owner_id FROM profiles WHERE role = 'owner' LIMIT 1;
  IF owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, kind, actor_id, payload)
    VALUES (owner_id, 'new_dispute', NEW.opener_id,
      jsonb_build_object('engagement_id', NEW.engagement_id, 'amount', eng.amount));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dispute_notify ON disputes;
CREATE TRIGGER trg_dispute_notify
  AFTER INSERT ON disputes
  FOR EACH ROW EXECUTE FUNCTION notify_new_dispute();

CREATE OR REPLACE FUNCTION notify_dispute_resolved()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  eng RECORD;
BEGIN
  IF NEW.status NOT IN ('resolved_for_seeker','resolved_for_provider') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  SELECT seeker_id, provider_id INTO eng
  FROM engagements WHERE id = NEW.engagement_id;

  INSERT INTO notifications (user_id, kind, actor_id, payload)
  VALUES
    (eng.seeker_id, 'dispute_resolved', NEW.resolved_by,
      jsonb_build_object('engagement_id', NEW.engagement_id, 'status', NEW.status)),
    (eng.provider_id, 'dispute_resolved', NEW.resolved_by,
      jsonb_build_object('engagement_id', NEW.engagement_id, 'status', NEW.status));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dispute_resolved_notify ON disputes;
CREATE TRIGGER trg_dispute_resolved_notify
  AFTER UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION notify_dispute_resolved();

-- ============================================
-- Reciprocity hard-block at DB layer (UPDATE policies).
-- Suspended users still need basic read; but they can't insert posts /
-- messages / start dms / open engagements. We add a check via RLS
-- by introducing an additional WITH CHECK clause.
-- ============================================
CREATE OR REPLACE FUNCTION viewer_is_active() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT COALESCE(
    (SELECT reciprocity_status FROM profiles WHERE id = auth.uid()),
    'active'
  ) != 'suspended';
$$;
GRANT EXECUTE ON FUNCTION viewer_is_active() TO authenticated, anon;

-- Posts: deny new inserts when suspended (RLS uses an additional policy
-- joined via AND of existing policy + this).
DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own_active" ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND viewer_is_active());

DROP POLICY IF EXISTS "msg_write_participant" ON messages;
CREATE POLICY "msg_write_participant_active" ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
    AND viewer_is_active()
  );

-- start_or_get_dm + start_engagement_for_dm: re-guard to refuse suspended users.
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
