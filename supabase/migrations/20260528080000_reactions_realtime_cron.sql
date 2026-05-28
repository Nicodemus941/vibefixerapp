-- ============================================
-- LOOP: Post reactions + realtime publication + reciprocity cron
-- ============================================

-- ---------- post_reactions ----------
CREATE TABLE post_reactions (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'fire'
    CHECK (kind IN ('fire','handshake','in')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, user_id, kind)
);
CREATE INDEX post_reactions_post_idx ON post_reactions(post_id);
CREATE INDEX post_reactions_user_idx ON post_reactions(user_id);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_reactions_read_authenticated" ON post_reactions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "post_reactions_write_own" ON post_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_reactions_delete_own" ON post_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ---------- realtime publication ----------
-- Add messages + post_reactions to the supabase_realtime publication so the
-- client can subscribe to INSERT events. (Supabase auto-creates this publication.)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;
  END IF;
EXCEPTION WHEN duplicate_object THEN
  -- Tables already added — no-op.
  NULL;
END $$;

-- ---------- reciprocity enforcer schedule ----------
-- Enable pg_cron and schedule enforce_reciprocity() to run hourly.
-- Supabase exposes pg_cron via the cron schema.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Idempotent: drop any existing schedule with this name before re-creating.
DO $$
DECLARE
  job_id BIGINT;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'loop_reciprocity_hourly';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
  PERFORM cron.schedule(
    'loop_reciprocity_hourly',
    '17 * * * *',         -- every hour at minute 17, off-peak
    $cron$SELECT public.enforce_reciprocity();$cron$
  );
END $$;
