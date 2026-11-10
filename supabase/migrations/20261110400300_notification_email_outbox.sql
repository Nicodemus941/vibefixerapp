-- ============================================
-- Accounts part 3: notification email outbox
-- ============================================
-- A notification insert queues an email row when the recipient's
-- preference allows email. /api/cron/send-emails drains it:
--   immediate (every 5 minutes): urgent kinds always, plus every other
--     kind for members who did not choose the daily summary. At most one
--     email per member per 10 minutes; newer items wait and batch.
--   digest (daily 13:00 UTC): non urgent kinds for members who chose the
--     daily summary, one email each.
-- Eligibility is checked when queued AND again when claimed, so pausing
-- emails, unsubscribing, a suspension, a block or reading the item in
-- the app before the email goes out all stop it. Deleted members cascade
-- away with their profile.

CREATE TABLE IF NOT EXISTS public.notification_email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL UNIQUE REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','sending','sent','failed','skipped')),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS notification_email_outbox_pending_idx
  ON public.notification_email_outbox (created_at)
  WHERE status IN ('queued','sending');
CREATE INDEX IF NOT EXISTS notification_email_outbox_user_idx
  ON public.notification_email_outbox (user_id, status);

ALTER TABLE public.notification_email_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_email_outbox FROM anon, authenticated;

-- Last time each member was emailed, for the throttle and digest gap.
CREATE TABLE IF NOT EXISTS public.notification_email_state (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_immediate_sent_at TIMESTAMPTZ,
  last_digest_sent_at TIMESTAMPTZ
);
ALTER TABLE public.notification_email_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_email_state FROM anon, authenticated;

-- May this member get an email about this kind from this actor?
CREATE OR REPLACE FUNCTION public.notification_email_allowed(
  p_user UUID,
  p_kind TEXT,
  p_actor UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT
    -- member exists and is not suspended
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = p_user AND COALESCE(p.reciprocity_status, 'active') <> 'suspended'
    )
    -- has a verified, active login
    AND EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = p_user
        AND u.email IS NOT NULL
        AND u.email_confirmed_at IS NOT NULL
        AND u.deleted_at IS NULL
        AND (u.banned_until IS NULL OR u.banned_until < now())
    )
    -- not paused, not unsubscribed
    AND NOT EXISTS (
      SELECT 1 FROM public.notification_settings s
      WHERE s.user_id = p_user AND (s.emails_paused OR s.unsubscribed_at IS NOT NULL)
    )
    -- wants email for this kind
    AND COALESCE(
      (SELECT np.email FROM public.notification_preferences np
       WHERE np.user_id = p_user AND np.kind = p_kind),
      public.notification_default_email(p_kind)
    )
    -- no block between them, either direction
    AND NOT public.users_blocked(p_user, p_actor);
$$;
REVOKE ALL ON FUNCTION public.notification_email_allowed(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.enqueue_notification_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.notification_email_allowed(NEW.user_id, NEW.kind, NEW.actor_id) THEN
    INSERT INTO public.notification_email_outbox (notification_id, user_id, kind)
    VALUES (NEW.id, NEW.user_id, NEW.kind)
    ON CONFLICT (notification_id) DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never fail the action that caused the notification.
  RAISE WARNING 'notification email enqueue failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enqueue_notification_email() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notification_email ON public.notifications;
CREATE TRIGGER trg_notification_email
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_notification_email();

-- Claim rows for one sender run. p_mode is 'immediate' or 'digest'.
CREATE OR REPLACE FUNCTION public.claim_notification_emails(
  p_mode TEXT,
  p_limit INT DEFAULT 200
)
RETURNS TABLE (
  outbox_id UUID,
  notification_id UUID,
  user_id UUID,
  email TEXT,
  display_name TEXT,
  kind TEXT,
  actor_id UUID,
  actor_name TEXT,
  related_post_id UUID,
  related_conversation_id UUID,
  payload JSONB,
  notification_created_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
#variable_conflict use_column
BEGIN
  IF p_mode NOT IN ('immediate','digest') THEN
    RAISE EXCEPTION 'bad mode %', p_mode;
  END IF;

  -- 1. Retire rows that should no longer go out.
  WITH doomed AS (
    SELECT o.id,
      CASE
        WHEN n.read_at IS NOT NULL THEN 'read in app'
        WHEN o.created_at < now() - interval '3 days' THEN 'too old'
        ELSE 'not allowed'
      END AS reason
    FROM public.notification_email_outbox o
    JOIN public.notifications n ON n.id = o.notification_id
    WHERE o.status = 'queued'
      AND (
        n.read_at IS NOT NULL
        OR o.created_at < now() - interval '3 days'
        OR NOT public.notification_email_allowed(o.user_id, o.kind, n.actor_id)
      )
    LIMIT 2000
    FOR UPDATE OF o SKIP LOCKED
  )
  UPDATE public.notification_email_outbox o
  SET status = 'skipped', last_error = doomed.reason
  FROM doomed
  WHERE o.id = doomed.id;

  -- 2. Claim what is due in this mode.
  RETURN QUERY
  WITH picked AS (
    SELECT o.id
    FROM public.notification_email_outbox o
    LEFT JOIN public.notification_settings s ON s.user_id = o.user_id
    LEFT JOIN public.notification_email_state st ON st.user_id = o.user_id
    WHERE o.attempts < 3
      AND (
        o.status = 'queued'
        OR (o.status = 'sending' AND o.claimed_at < now() - interval '15 minutes')
      )
      AND CASE
        WHEN p_mode = 'immediate' THEN
          (public.notification_kind_urgent(o.kind) OR NOT COALESCE(s.email_digest, false))
          AND (st.last_immediate_sent_at IS NULL OR st.last_immediate_sent_at < now() - interval '10 minutes')
        ELSE
          NOT public.notification_kind_urgent(o.kind)
          AND COALESCE(s.email_digest, false)
          AND (st.last_digest_sent_at IS NULL OR st.last_digest_sent_at < now() - interval '20 hours')
      END
    ORDER BY o.created_at
    LIMIT GREATEST(1, LEAST(p_limit, 500))
    FOR UPDATE OF o SKIP LOCKED
  ),
  claimed AS (
    UPDATE public.notification_email_outbox o
    SET status = 'sending', claimed_at = now(), attempts = o.attempts + 1
    FROM picked
    WHERE o.id = picked.id
    RETURNING o.id, o.notification_id, o.user_id
  )
  SELECT
    c.id,
    c.notification_id,
    c.user_id,
    u.email::text,
    p.display_name,
    n.kind,
    n.actor_id,
    a.display_name,
    n.related_post_id,
    n.related_conversation_id,
    n.payload,
    n.created_at,
    CASE WHEN p_mode = 'immediate' THEN st.last_immediate_sent_at ELSE st.last_digest_sent_at END
  FROM claimed c
  JOIN public.notifications n ON n.id = c.notification_id
  JOIN auth.users u ON u.id = c.user_id
  LEFT JOIN public.profiles p ON p.id = c.user_id
  LEFT JOIN public.profiles a ON a.id = n.actor_id
  LEFT JOIN public.notification_email_state st ON st.user_id = c.user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_notification_emails(TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notification_emails(TEXT, INT) TO service_role;

-- Put deferred rows back without spending an attempt.
CREATE OR REPLACE FUNCTION public.release_notification_emails(p_ids UUID[])
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.notification_email_outbox
  SET status = 'queued', attempts = GREATEST(attempts - 1, 0), claimed_at = NULL
  WHERE id = ANY(p_ids) AND status = 'sending';
$$;
REVOKE ALL ON FUNCTION public.release_notification_emails(UUID[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_notification_emails(UUID[]) TO service_role;

CREATE OR REPLACE FUNCTION public.finish_notification_emails(
  p_ids UUID[],
  p_ok BOOLEAN,
  p_mode TEXT,
  p_error TEXT DEFAULT NULL,
  p_final BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.notification_email_outbox
  SET status = CASE
        WHEN p_ok THEN 'sent'
        WHEN p_final OR attempts >= 3 THEN 'failed'
        ELSE 'queued'
      END,
      sent_at = CASE WHEN p_ok THEN now() ELSE sent_at END,
      last_error = CASE WHEN p_ok THEN NULL ELSE left(p_error, 1000) END
  WHERE id = ANY(p_ids) AND status = 'sending';

  IF p_ok THEN
    INSERT INTO public.notification_email_state AS st (user_id, last_immediate_sent_at, last_digest_sent_at)
    SELECT DISTINCT o.user_id,
      CASE WHEN p_mode = 'immediate' THEN now() END,
      CASE WHEN p_mode = 'digest' THEN now() END
    FROM public.notification_email_outbox o
    WHERE o.id = ANY(p_ids)
    ON CONFLICT (user_id) DO UPDATE SET
      last_immediate_sent_at = COALESCE(EXCLUDED.last_immediate_sent_at, st.last_immediate_sent_at),
      last_digest_sent_at = COALESCE(EXCLUDED.last_digest_sent_at, st.last_digest_sent_at);
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.finish_notification_emails(UUID[], BOOLEAN, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_notification_emails(UUID[], BOOLEAN, TEXT, TEXT, BOOLEAN) TO service_role;
