-- Loop is free while it grows (owner decision 2026-11-10): no platform fee on
-- paid engagements. Was ROUND(amount * 0.07, 2). Existing rows are untouched.
CREATE OR REPLACE FUNCTION public.start_engagement_for_dm(other_user_id uuid, amount numeric, delivery_due_at timestamp with time zone DEFAULT NULL::timestamp with time zone, as_provider boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

  fee := 0;

  INSERT INTO engagements (
    seeker_id, provider_id, amount, platform_fee, escrow_status, delivery_due_at
  )
  VALUES (
    seeker, provider, amount, fee, 'held', delivery_due_at
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$function$;
