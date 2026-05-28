-- ============================================
-- E2E follow-up: medium-severity bugs (#3, #4, #6)
-- ============================================

-- BUG #3: documents lacked an "awaiting_counterparty" state. Once the
-- creator signed, the document stayed `draft`, so the counterparty's
-- inbox couldn't show "you have a contract to sign" vs "the other
-- party is still drafting." Adds the state to the CHECK and to the
-- signature trigger so it flips automatically.

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check
  CHECK (status IN ('draft','awaiting_counterparty','signed','amended','void'));

CREATE OR REPLACE FUNCTION public.check_document_fully_signed()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  d RECORD;
  sig_count INT;
BEGIN
  SELECT id, creator_id, counterparty_id, status, parent_document_id
    INTO d
    FROM documents WHERE id = NEW.document_id;

  -- Once signed/amended/void, signatures don't move state further.
  IF d.status NOT IN ('draft','awaiting_counterparty') THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(DISTINCT user_id) INTO sig_count
  FROM document_signatures
  WHERE document_id = d.id
    AND user_id IN (d.creator_id, d.counterparty_id);

  IF sig_count >= 2 THEN
    UPDATE documents
    SET status = 'signed', signed_at = now()
    WHERE id = d.id;

    IF d.parent_document_id IS NOT NULL THEN
      UPDATE documents
      SET status = 'amended'
      WHERE id = d.parent_document_id
        AND status = 'signed';
    END IF;
  ELSIF sig_count = 1 AND d.status = 'draft' THEN
    -- First signature on a fresh draft → it's now waiting on the other side.
    UPDATE documents
    SET status = 'awaiting_counterparty'
    WHERE id = d.id;
  END IF;
  RETURN NEW;
END;
$$;

-- BUG #4: engagements carried two text columns for the Stripe payment
-- intent — `stripe_payment_intent` (from the initial marketplace
-- migration) and `stripe_payment_intent_id` (from the Stripe Connect
-- migration). All application code reads/writes the *_id form; the
-- other was zero-populated and a footgun for future readers.
ALTER TABLE engagements DROP COLUMN IF EXISTS stripe_payment_intent;

-- BUG #6: feed_for_user surfaced the viewer's own posts to themselves.
-- LinkedIn / Twitter / Threads all hide own posts from the home feed —
-- they're already on the user's own profile. Same fix in both branches
-- of the function (no embeddings vs has embeddings).

DROP FUNCTION IF EXISTS feed_for_user(UUID, TEXT, INT);

CREATE OR REPLACE FUNCTION feed_for_user(
  viewer_id UUID,
  tag_filter TEXT DEFAULT NULL,
  limit_count INT DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  body TEXT,
  hashtags TEXT[],
  kind TEXT,
  created_at TIMESTAMPTZ,
  similarity REAL,
  author_display_name TEXT,
  author_company_name TEXT,
  author_industry TEXT,
  author_avatar_url TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  avg_emb VECTOR(1536);
  need_count INT;
BEGIN
  SELECT COUNT(*) INTO need_count
  FROM needs WHERE needs.user_id = viewer_id AND embedding IS NOT NULL;

  IF need_count > 0 THEN
    SELECT avg(embedding) INTO avg_emb
    FROM needs WHERE needs.user_id = viewer_id AND embedding IS NOT NULL;
  END IF;

  IF avg_emb IS NULL THEN
    RETURN QUERY
    SELECT
      p.id, p.user_id, p.body, p.hashtags, p.kind, p.created_at,
      NULL::REAL AS similarity,
      pr.display_name, pr.company_name, pr.industry, pr.avatar_url
    FROM posts p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE (tag_filter IS NULL OR tag_filter = ANY(p.hashtags))
      AND p.user_id != viewer_id
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE b.blocker_id = viewer_id AND b.blocked_id = p.user_id
      )
      AND p.group_id IS NULL
    ORDER BY p.created_at DESC
    LIMIT limit_count;
  ELSE
    RETURN QUERY
    SELECT
      p.id, p.user_id, p.body, p.hashtags, p.kind, p.created_at,
      (1 - (p.embedding <=> avg_emb))::REAL AS similarity,
      pr.display_name, pr.company_name, pr.industry, pr.avatar_url
    FROM posts p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE p.embedding IS NOT NULL
      AND (tag_filter IS NULL OR tag_filter = ANY(p.hashtags))
      AND p.user_id != viewer_id
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE b.blocker_id = viewer_id AND b.blocked_id = p.user_id
      )
      AND p.group_id IS NULL
    ORDER BY p.embedding <=> avg_emb ASC, p.created_at DESC
    LIMIT limit_count;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION feed_for_user(UUID, TEXT, INT) TO authenticated, anon;
