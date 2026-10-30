-- 24/7 Support Desk & Incident Scenario Telemetry Migration

-- 1. Ensure RLS policies on support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can insert own support tickets" ON public.support_tickets;
CREATE POLICY "users can insert own support tickets"
  ON public.support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "users can view own support tickets" ON public.support_tickets;
CREATE POLICY "users can view own support tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "service role manages support tickets" ON public.support_tickets;
CREATE POLICY "service role manages support tickets"
  ON public.support_tickets
  FOR ALL
  TO service_role
  USING (true);

-- 2. Ensure RLS policies on support_messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can insert messages on own tickets" ON public.support_messages;
CREATE POLICY "users can insert messages on own tickets"
  ON public.support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.reporter_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "users can view messages on own tickets" ON public.support_messages;
CREATE POLICY "users can view messages on own tickets"
  ON public.support_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.reporter_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service role manages support messages" ON public.support_messages;
CREATE POLICY "service role manages support messages"
  ON public.support_messages
  FOR ALL
  TO service_role
  USING (true);

-- 3. Unified RPC for 24/7 Support Ticket Submission with Scenario Telemetry
CREATE OR REPLACE FUNCTION public.submit_support_ticket(
  p_subject text,
  p_category text,
  p_priority text DEFAULT 'medium',
  p_scenario text DEFAULT 'general',
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_message text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_ticket_id uuid;
  v_user_id uuid := auth.uid();
  v_phone text := '';
  v_name text := '';
  v_city text := '';
  v_role text := 'user';
  v_coin_balance numeric := 0;
  v_enriched_metadata jsonb;
BEGIN
  IF v_user_id IS NOT NULL THEN
    -- Capture authenticated caller profile details
    SELECT
      COALESCE(phone, ''),
      COALESCE(display_name, 'Anonymous Caller'),
      COALESCE(city, ''),
      COALESCE(role, 'user')
    INTO v_phone, v_name, v_city, v_role
    FROM public.profiles
    WHERE id = v_user_id;

    -- Capture current wallet coin balance
    SELECT COALESCE(coin_balance, 0)
    INTO v_coin_balance
    FROM public.wallets
    WHERE user_id = v_user_id;
  ELSE
    v_name := COALESCE(p_metadata->>'reporter_name', 'Guest User');
    v_phone := COALESCE(p_metadata->>'reporter_phone', '');
  END IF;

  -- Enrich metadata with scenario tags and caller profile telemetry
  v_enriched_metadata := COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
    'scenario', p_scenario,
    'reporter_name', v_name,
    'reporter_phone', v_phone,
    'reporter_city', v_city,
    'reporter_role', v_role,
    'reporter_coin_balance', v_coin_balance,
    'submitted_at', now()
  );

  INSERT INTO public.support_tickets (
    reporter_id,
    subject,
    category,
    priority,
    status,
    metadata
  ) VALUES (
    v_user_id,
    p_subject,
    p_category,
    p_priority,
    'open',
    v_enriched_metadata
  )
  RETURNING id INTO v_ticket_id;

  -- If an initial message body was supplied, record it in support_messages
  IF p_message IS NOT NULL AND length(trim(p_message)) > 0 THEN
    INSERT INTO public.support_messages (
      ticket_id,
      author_id,
      body,
      is_internal
    ) VALUES (
      v_ticket_id,
      v_user_id,
      trim(p_message),
      false
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'ticket_id', v_ticket_id,
    'status', 'open'
  );
END;
$$;

