-- ============================================
-- LOOP: Reviews — 1 per engagement, post-release only
-- ============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('seeker','provider')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(engagement_id, reviewer_id)
);
CREATE INDEX reviews_reviewee_idx ON reviews(reviewee_id, created_at DESC);
CREATE INDEX reviews_engagement_idx ON reviews(engagement_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_read_authenticated" ON reviews FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "reviews_insert_participant_released" ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM engagements e
      WHERE e.id = reviews.engagement_id
        AND e.escrow_status = 'released'
        AND (e.seeker_id = auth.uid() OR e.provider_id = auth.uid())
        AND CASE WHEN reviews.reviewer_role = 'seeker'
              THEN e.seeker_id = auth.uid() AND e.provider_id = reviews.reviewee_id
              ELSE e.provider_id = auth.uid() AND e.seeker_id = reviews.reviewee_id
            END
    )
  );

-- ============================================
-- Recompute reviewee.reputation_score on insert.
-- We use a simple average of all received ratings * 20 (so 5→100, 1→20).
-- ============================================
CREATE OR REPLACE FUNCTION update_reputation_score_for(uid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  SELECT avg(rating) INTO avg_rating FROM reviews WHERE reviewee_id = uid;
  IF avg_rating IS NULL THEN
    UPDATE profiles SET reputation_score = 0 WHERE id = uid;
  ELSE
    UPDATE profiles SET reputation_score = ROUND(avg_rating * 20, 1) WHERE id = uid;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION trg_review_inserted()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM update_reputation_score_for(NEW.reviewee_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_recompute ON reviews;
CREATE TRIGGER trg_review_recompute
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION trg_review_inserted();

-- ============================================
-- Notification: new_review
-- ============================================
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_kind_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_kind_check
  CHECK (kind IN (
    'new_match','new_message','new_reaction','match_accepted',
    'new_comment','new_document','document_signed','new_review'
  ));

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS related_review_id UUID REFERENCES reviews(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO notifications (user_id, kind, actor_id, related_review_id, payload)
  VALUES (
    NEW.reviewee_id,
    'new_review',
    NEW.reviewer_id,
    NEW.id,
    jsonb_build_object('rating', NEW.rating, 'preview', left(NEW.body, 140))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_notify ON reviews;
CREATE TRIGGER trg_review_notify
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION notify_new_review();

-- ============================================
-- Realtime
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
