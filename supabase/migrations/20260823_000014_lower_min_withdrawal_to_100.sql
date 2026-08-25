-- 20260823_000014_lower_min_withdrawal_to_100.sql
-- Lower minimum host withdrawal limit from ₹500 to ₹100.

create or replace function public.request_host_withdrawal(
  p_amount_inr numeric(10,2),
  p_payout_method_type text,
  p_payout_details jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_id uuid;
  v_amount_paise bigint;
  v_earnings public.host_earnings%rowtype;
  v_existing_payout public.host_payouts%rowtype;
  v_new_payout public.host_payouts%rowtype;
begin
  -- 1. Identify and authenticate host
  v_host_id := auth.uid();
  if v_host_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  -- 2. Validate parameters (Minimum withdrawal limit is ₹100.00)
  if p_amount_inr is null or p_amount_inr < 100.00 then
    raise exception 'MINIMUM_WITHDRAWAL_LIMIT_100';
  end if;

  if p_payout_method_type not in ('upi', 'bank_account') then
    raise exception 'INVALID_PAYOUT_METHOD_TYPE';
  end if;

  if p_idempotency_key is null or trim(p_idempotency_key) = '' then
    raise exception 'IDEMPOTENCY_KEY_REQUIRED';
  end if;

  v_amount_paise := (p_amount_inr * 100)::bigint;

  -- 3. Idempotency Check: if this key already exists, return existing record
  select * into v_existing_payout
  from public.host_payouts
  where idempotency_key = p_idempotency_key;

  if found then
    return jsonb_build_object(
      'success', true,
      'is_duplicate', true,
      'payout_id', v_existing_payout.id,
      'status', v_existing_payout.status,
      'amount_inr', v_existing_payout.amount_inr
    );
  end if;

  -- 4. Row-Level Lock on host_earnings to eliminate race conditions
  select * into v_earnings
  from public.host_earnings
  where host_id = v_host_id
  for update;

  if not found then
    -- If no record yet, create an initial record with 0 balance
    insert into public.host_earnings (host_id, available_paise, total_earned_paise)
    values (v_host_id, 0, 0)
    returning * into v_earnings;
  end if;

  -- 5. Authoritative Balance Check
  if v_earnings.available_paise < v_amount_paise then
    raise exception 'INSUFFICIENT_WITHDRAWAL_BALANCE';
  end if;

  -- 6. Atomic Balance Deductions
  update public.host_earnings
  set
    available_paise = available_paise - v_amount_paise,
    pending_payout_paise = pending_payout_paise + v_amount_paise,
    updated_at = now()
  where host_id = v_host_id
  returning * into v_earnings;

  -- 7. Insert Persistent Payout Record
  insert into public.host_payouts (
    host_id,
    amount_paise,
    amount_inr,
    status,
    payout_method_type,
    payout_details,
    idempotency_key
  ) values (
    v_host_id,
    v_amount_paise,
    p_amount_inr,
    'pending'::public.host_payout_status,
    p_payout_method_type,
    p_payout_details,
    p_idempotency_key
  )
  returning * into v_new_payout;

  return jsonb_build_object(
    'success', true,
    'is_duplicate', false,
    'payout_id', v_new_payout.id,
    'status', v_new_payout.status,
    'amount_inr', v_new_payout.amount_inr,
    'available_inr_remaining', (v_earnings.available_paise / 100.0)
  );
end;
$$;

revoke all on function public.request_host_withdrawal(numeric, text, jsonb, text) from public, anon;
grant execute on function public.request_host_withdrawal(numeric, text, jsonb, text) to authenticated, service_role;
