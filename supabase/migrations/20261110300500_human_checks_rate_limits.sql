-- ============================================
-- Authentic network, part 5: human checks, rate limits, bot reports
-- ============================================
-- Minimum viable "a person is behind this account":
--   * Posting, commenting and messaging need a confirmed email
--     (auth.users.email_confirmed_at). Magic link and GitHub sign ins
--     confirm it, so real members never notice.
--   * Cloudflare Turnstile runs on sign up and on a member's first DM.
--     The app verifies the token and records a row in human_verifications.
--     The database only insists on that row once the owner turns on
--     platform_settings.require_human_check (off by default, so nothing
--     breaks before the Turnstile keys are set in the environment).
--   * At most 20 posts and 100 comments per member per rolling 24 hours.
--   * Reports get a category so "bot or spam" reports can be triaged first.
-- These run as BEFORE INSERT triggers, so they also apply to rows the app
-- writes with the service role (posts are inserted that way).

-- ---------- settings ----------
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
-- No client policies. Change it in SQL:
--   UPDATE platform_settings SET value = 'true' WHERE key = 'require_human_check';
INSERT INTO platform_settings (key, value)
VALUES ('require_human_check', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ---------- human_verifications ----------
CREATE TABLE IF NOT EXISTS human_verifications (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL DEFAULT 'turnstile' CHECK (method IN ('turnstile')),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE human_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "human_verifications_read_own" ON human_verifications FOR SELECT
  USING (auth.uid() = user_id);
-- Written only by the server with the service role after a token checks out.

-- ---------- helpers ----------
CREATE OR REPLACE FUNCTION public.member_email_confirmed(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = uid AND u.email_confirmed_at IS NOT NULL
  );
$$;
REVOKE ALL ON FUNCTION public.member_email_confirmed(UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.human_check_required()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce((SELECT value = 'true'::jsonb FROM platform_settings WHERE key = 'require_human_check'), false);
$$;
REVOKE ALL ON FUNCTION public.human_check_required() FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS posts_user_created_idx ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS post_comments_user_created_idx ON post_comments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages(sender_id);

-- ---------- posts ----------
CREATE OR REPLACE FUNCTION public.guard_post_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT member_email_confirmed(NEW.user_id) THEN
    RAISE EXCEPTION 'Confirm your email before you post, comment or message.';
  END IF;
  IF (SELECT count(*) FROM posts p
      WHERE p.user_id = NEW.user_id AND p.created_at > now() - INTERVAL '24 hours') >= 20 THEN
    RAISE EXCEPTION 'You have reached 20 posts in 24 hours. Try again later.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_posts_guard ON posts;
CREATE TRIGGER trg_posts_guard
  BEFORE INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION guard_post_insert();

-- ---------- comments ----------
CREATE OR REPLACE FUNCTION public.guard_comment_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT member_email_confirmed(NEW.user_id) THEN
    RAISE EXCEPTION 'Confirm your email before you post, comment or message.';
  END IF;
  IF (SELECT count(*) FROM post_comments c
      WHERE c.user_id = NEW.user_id AND c.created_at > now() - INTERVAL '24 hours') >= 100 THEN
    RAISE EXCEPTION 'You have reached 100 comments in 24 hours. Try again later.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_post_comments_guard ON post_comments;
CREATE TRIGGER trg_post_comments_guard
  BEFORE INSERT ON post_comments
  FOR EACH ROW EXECUTE FUNCTION guard_comment_insert();

-- ---------- messages ----------
-- Runs before trg_messages_guard (trigger names fire in alphabetical order).
CREATE OR REPLACE FUNCTION public.verify_message_sender()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT member_email_confirmed(NEW.sender_id) THEN
    RAISE EXCEPTION 'Confirm your email before you post, comment or message.';
  END IF;
  IF human_check_required()
     AND NOT EXISTS (SELECT 1 FROM human_verifications h WHERE h.user_id = NEW.sender_id)
     AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.sender_id = NEW.sender_id) THEN
    RAISE EXCEPTION 'Please confirm you are a person before your first message.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_messages_aa_verify ON messages;
CREATE TRIGGER trg_messages_aa_verify
  BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION verify_message_sender();

-- ---------- reports: bot or spam ----------
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_category_check;
ALTER TABLE reports
  ADD CONSTRAINT reports_category_check CHECK (category IN ('general', 'bot_spam'));
CREATE INDEX IF NOT EXISTS reports_category_status_idx ON reports(category, status, created_at DESC);
