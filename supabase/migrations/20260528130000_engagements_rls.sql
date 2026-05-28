-- ============================================
-- LOOP: Engagement write policies
-- ============================================
-- engagements + matches RLS read policies exist from earlier migrations;
-- but write policies were never added. Add insert/update policies so
-- a participant can create + mark deals through the UI.

CREATE POLICY "engagements_insert_participant" ON engagements FOR INSERT
  WITH CHECK (auth.uid() = seeker_id OR auth.uid() = provider_id);

CREATE POLICY "engagements_update_participant" ON engagements FOR UPDATE
  USING (auth.uid() = seeker_id OR auth.uid() = provider_id);

-- ============================================
-- start_engagement_for_dm(other_user_id, amount):
-- Helper to create an engagement in the context of a DM with someone.
-- Returns the new engagement id. The caller becomes the seeker (the
-- one paying for the work) by default — flip with as_provider=true if
-- the caller is the one delivering.
-- ============================================

CREATE OR REPLACE FUNCTION start_engagement_for_dm(
  other_user_id UUID,
  amount NUMERIC,
  delivery_due_at TIMESTAMPTZ DEFAULT NULL,
  as_provider BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  me UUID;
  seeker UUID;
  provider UUID;
  fee NUMERIC;
  new_id UUID;
BEGIN
  me := auth.uid();
  IF me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF me = other_user_id THEN RAISE EXCEPTION 'cannot engage yourself'; END IF;
  IF amount IS NULL OR amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;

  IF as_provider THEN
    seeker := other_user_id;
    provider := me;
  ELSE
    seeker := me;
    provider := other_user_id;
  END IF;

  -- Loop's take: 7% midpoint between the 5-8% range from the pricing page.
  fee := ROUND(amount * 0.07, 2);

  INSERT INTO engagements (
    seeker_id, provider_id, amount, platform_fee, escrow_status, delivery_due_at
  )
  VALUES (
    seeker, provider, amount, fee, 'held', delivery_due_at
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION start_engagement_for_dm(UUID, NUMERIC, TIMESTAMPTZ, BOOLEAN) TO authenticated;
