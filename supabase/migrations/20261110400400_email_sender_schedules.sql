-- ============================================
-- Accounts part 4: run the 5 minute senders from Supabase
-- ============================================
-- Vercel Hobby only allows daily crons, so vercel.json keeps just the
-- daily digest. pg_cron calls the two 5 minute senders instead, posting
-- to the site with the same bearer secret Vercel uses (CRON_SECRET).
--
-- The secret lives in Supabase Vault under the name 'loop_cron_secret'
-- and must equal CRON_SECRET in Vercel. Create it once in the SQL editor:
--   SELECT vault.create_secret('<same value as CRON_SECRET>', 'loop_cron_secret',
--                              'Bearer secret for loopfounders.com/api/cron');
-- Rotate it with vault.update_secret(<id>, '<new value>').
-- Until the secret exists, the jobs run but make no request at all.

-- pg_cron is already enabled by 20260528080000_reactions_realtime_cron.sql.
CREATE EXTENSION IF NOT EXISTS pg_cron;
-- pg_net provides net.http_post (async HTTP from Postgres).
CREATE EXTENSION IF NOT EXISTS pg_net;
-- Vault ships enabled on Supabase; this is a no op there.
CREATE EXTENSION IF NOT EXISTS supabase_vault;

CREATE OR REPLACE FUNCTION public.loop_cron_ping(p_route TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  secret TEXT;
  request_id BIGINT;
BEGIN
  -- Only the two sender routes, never an arbitrary URL.
  IF p_route NOT IN ('send-emails', 'owner-alerts') THEN
    RAISE EXCEPTION 'unknown cron route %', p_route;
  END IF;

  SELECT ds.decrypted_secret INTO secret
  FROM vault.decrypted_secrets ds
  WHERE ds.name = 'loop_cron_secret'
  LIMIT 1;

  IF secret IS NULL OR length(trim(secret)) = 0 THEN
    RETURN NULL; -- no secret yet: do nothing, send no request
  END IF;

  SELECT net.http_post(
    url := 'https://loopfounders.com/api/cron/' || p_route,
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || trim(secret),
      'Content-Type', 'application/json'
    ),
    timeout_milliseconds := 55000
  ) INTO request_id;

  RETURN request_id;
END;
$$;
REVOKE ALL ON FUNCTION public.loop_cron_ping(TEXT) FROM PUBLIC, anon, authenticated;

-- Idempotent schedules: drop any previous job with the same name first.
DO $$
DECLARE
  job RECORD;
BEGIN
  FOR job IN
    SELECT jobid FROM cron.job
    WHERE jobname IN ('loop_send_emails_5min', 'loop_owner_alerts_5min')
  LOOP
    PERFORM cron.unschedule(job.jobid);
  END LOOP;

  PERFORM cron.schedule(
    'loop_send_emails_5min',
    '*/5 * * * *',
    $cron$SELECT public.loop_cron_ping('send-emails');$cron$
  );
  PERFORM cron.schedule(
    'loop_owner_alerts_5min',
    '*/5 * * * *',
    $cron$SELECT public.loop_cron_ping('owner-alerts');$cron$
  );
END $$;
