-- ============================================
-- Accounts part 1: owner sign up alerts
-- ============================================
-- Every new member queues exactly one owner alert. A profile row is
-- created by handle_new_user() inside the auth.users insert for every
-- sign up path (password, magic link, OAuth), so an AFTER INSERT trigger
-- on profiles fires reliably. The unique dedupe_key makes repeats
-- impossible even if the trigger ran twice.
--
-- The sender (/api/cron/owner-alerts, every 5 minutes) waits until the
-- member verifies their email or 30 minutes pass, so "verified yes/no"
-- in the alert is meaningful. No backfill: existing members are not
-- alerted.

CREATE TABLE IF NOT EXISTS public.owner_alert_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL DEFAULT 'new_signup' CHECK (kind IN ('new_signup')),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dedupe_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','sending','sent','failed')),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS owner_alert_outbox_queued_idx
  ON public.owner_alert_outbox (created_at)
  WHERE status IN ('queued','sending');

-- RLS on, no policies: no client access at all. Only the service role
-- (cron route) and SECURITY DEFINER functions touch it.
ALTER TABLE public.owner_alert_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.owner_alert_outbox FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.enqueue_owner_signup_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.owner_alert_outbox (kind, user_id, dedupe_key)
  VALUES ('new_signup', NEW.id, 'new_signup:' || NEW.id::text)
  ON CONFLICT (dedupe_key) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block a sign up because the alert could not be queued.
  RAISE WARNING 'owner alert enqueue failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_owner_signup_alert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_owner_signup_alert ON public.profiles;
CREATE TRIGGER trg_owner_signup_alert
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_owner_signup_alert();

-- Claim up to p_limit alerts that are ready. Rows stuck in 'sending' for
-- 15 minutes (a crashed run) are picked up again while attempts < 3.
CREATE OR REPLACE FUNCTION public.claim_owner_alerts(p_limit INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  display_name TEXT,
  signed_up_at TIMESTAMPTZ,
  verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  WITH picked AS (
    SELECT o.id
    FROM public.owner_alert_outbox o
    JOIN auth.users u ON u.id = o.user_id
    WHERE o.attempts < 3
      AND (
        o.status = 'queued'
        OR (o.status = 'sending' AND o.claimed_at < now() - interval '15 minutes')
      )
      AND (u.email_confirmed_at IS NOT NULL OR o.created_at < now() - interval '30 minutes')
    ORDER BY o.created_at
    LIMIT GREATEST(1, LEAST(p_limit, 200))
    FOR UPDATE OF o SKIP LOCKED
  ),
  claimed AS (
    UPDATE public.owner_alert_outbox o
    SET status = 'sending', claimed_at = now(), attempts = o.attempts + 1
    FROM picked
    WHERE o.id = picked.id
    RETURNING o.id, o.user_id
  )
  SELECT c.id, c.user_id, u.email::text, p.display_name, u.created_at,
         (u.email_confirmed_at IS NOT NULL)
  FROM claimed c
  JOIN auth.users u ON u.id = c.user_id
  LEFT JOIN public.profiles p ON p.id = c.user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_owner_alerts(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_owner_alerts(INT) TO service_role;

CREATE OR REPLACE FUNCTION public.finish_owner_alert(
  p_id UUID,
  p_ok BOOLEAN,
  p_error TEXT DEFAULT NULL,
  p_final BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.owner_alert_outbox
  SET status = CASE
        WHEN p_ok THEN 'sent'
        WHEN p_final OR attempts >= 3 THEN 'failed'
        ELSE 'queued'
      END,
      sent_at = CASE WHEN p_ok THEN now() ELSE sent_at END,
      last_error = CASE WHEN p_ok THEN NULL ELSE left(p_error, 1000) END
  WHERE id = p_id AND status = 'sending';
$$;
REVOKE ALL ON FUNCTION public.finish_owner_alert(UUID, BOOLEAN, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_owner_alert(UUID, BOOLEAN, TEXT, BOOLEAN) TO service_role;
