-- ============================================
-- Accounts part 2: notification preferences
-- ============================================
-- notification_preferences: one optional row per (member, kind). A
--   missing row means the default from notification_default(), which
--   mirrors KIND_INFO in src/lib/notification-kinds.ts.
-- notification_settings: one optional row per member for the daily
--   summary choice, the master "Pause all emails" switch and one click
--   unsubscribes.
-- notifications.in_app: false hides a row from the bell and the
--   notifications page (it can still be emailed). A notification that is
--   off for both in app and email is not stored at all.

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN (
    'new_match','match_accepted','new_message','new_reaction','new_comment',
    'new_document','document_signed','new_review','new_dispute','dispute_resolved',
    'new_follower','mention','comment_reply','new_repost'
  )),
  in_app BOOLEAN NOT NULL DEFAULT true,
  email BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_preferences_select_own" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notification_preferences_insert_own" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notification_preferences_update_own" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notification_preferences_delete_own" ON public.notification_preferences
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_digest BOOLEAN NOT NULL DEFAULT false,
  emails_paused BOOLEAN NOT NULL DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_settings_select_own" ON public.notification_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notification_settings_insert_own" ON public.notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notification_settings_update_own" ON public.notification_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Defaults per kind. Keep in sync with KIND_INFO.
CREATE OR REPLACE FUNCTION public.notification_default_email(p_kind TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT p_kind IN (
    'new_message','mention','comment_reply','new_comment',
    'new_match','match_accepted',
    'new_document','document_signed','new_review','new_dispute','dispute_resolved'
  );
$$;

-- Sent right away (throttled) rather than in the daily summary.
CREATE OR REPLACE FUNCTION public.notification_kind_urgent(p_kind TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT p_kind IN (
    'new_message','mention','comment_reply',
    'new_match','match_accepted',
    'new_document','document_signed','new_review','new_dispute','dispute_resolved'
  );
$$;

-- Carry over the old JSON prefs on profiles. They were never enforced and
-- there was no email yet, so a kind someone switched off becomes "no
-- email" (in app stays on) and a daily or weekly digest choice becomes
-- the daily summary. profiles.notification_prefs is left in place.
INSERT INTO public.notification_preferences (user_id, kind, in_app, email)
SELECT p.id, k.key, true, false
FROM public.profiles p
CROSS JOIN LATERAL jsonb_each(p.notification_prefs) AS k(key, value)
WHERE k.key IN ('new_match','new_message','new_reaction','match_accepted',
                'new_comment','new_document','document_signed','new_review')
  AND k.value = 'false'::jsonb
ON CONFLICT (user_id, kind) DO NOTHING;

INSERT INTO public.notification_settings (user_id, email_digest)
SELECT p.id, true
FROM public.profiles p
WHERE p.notification_prefs->>'email_digest' IN ('daily','weekly')
ON CONFLICT (user_id) DO NOTHING;

-- ---------- in app switch on notifications ----------
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS in_app BOOLEAN NOT NULL DEFAULT true;

DROP INDEX IF EXISTS public.notifications_user_unread_idx;
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE read_at IS NULL AND in_app;

CREATE OR REPLACE FUNCTION public.apply_notification_in_app_pref()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  pref RECORD;
  wants_email BOOLEAN;
BEGIN
  SELECT np.in_app, np.email INTO pref
  FROM public.notification_preferences np
  WHERE np.user_id = NEW.user_id AND np.kind = NEW.kind;

  IF FOUND THEN
    NEW.in_app := pref.in_app;
    wants_email := pref.email;
  ELSE
    NEW.in_app := true;
    wants_email := public.notification_default_email(NEW.kind);
  END IF;

  IF NOT NEW.in_app AND NOT wants_email THEN
    RETURN NULL; -- off everywhere: do not store it
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_notification_in_app_pref() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notification_in_app_pref ON public.notifications;
CREATE TRIGGER trg_notification_in_app_pref
  BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.apply_notification_in_app_pref();

-- The bell and /notifications list only in app rows.
CREATE INDEX IF NOT EXISTS notifications_user_in_app_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE in_app;
