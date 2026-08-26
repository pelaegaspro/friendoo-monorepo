-- Payment and refund integrity hardening.
-- This migration supersedes unsafe update-before-ledger ordering in prior functions.

alter table public.calls
  add column if not exists host_silence_reported_at timestamptz;

create or replace function public.report_host_silence_violation(
  p_call_id uuid,
  p_reporter_id uuid,
  p_details text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_call public.calls;
  v_host public.hosts;
  v_wallet public.wallets;
  v_new_strike_count integer;
  v_is_suspended boolean := false;
  v_refund_coins integer := 0;
  v_refund_key text;
begin
  if auth.uid() is null or auth.uid() <> p_reporter_id then
    raise exception 'Unauthorized reporter';
  end if;

  select * into v_call from public.calls where id = p_call_id for update;
  if not found or v_call.caller_id <> p_reporter_id then
    raise exception 'Unauthorized to report this call';
  end if;

  -- The call row lock and durable marker make this report idempotent.  The
  -- marker is set in this transaction before any wallet movement, so a second
  -- request cannot turn a ledger conflict into a second refund.
  if v_call.host_silence_reported_at is not null then
    return jsonb_build_object(
      'success', true,
      'already_reported', true,
      'refunded_coins', 0
    );
  end if;

  v_refund_key := 'call:' || v_call.id::text || ':host-silence-refund';

  -- Backfill the marker safely if an older deployment already issued the
  -- ledger refund before this marker existed.
  if exists (
    select 1
    from public.wallet_transactions
    where idempotency_key = v_refund_key
  ) then
    update public.calls
    set host_silence_reported_at = now()
    where id = v_call.id;

    return jsonb_build_object(
      'success', true,
      'already_reported', true,
      'refunded_coins', 0
    );
  end if;

  update public.calls
  set host_silence_reported_at = now()
  where id = v_call.id;

  select * into v_host from public.hosts where id = v_call.host_id for update;
  if not found then
    raise exception 'Host not found';
  end if;

  v_refund_coins := coalesce(v_call.total_coins_deducted, 0);
  if v_refund_coins > 0 then
    select * into v_wallet
    from public.wallets
    where user_id = v_call.caller_id
    for update;
    if not found then
      raise exception 'Wallet not found';
    end if;

    update public.wallets
    set coin_balance = v_wallet.coin_balance + v_refund_coins,
        updated_at = now()
    where user_id = v_call.caller_id
    returning * into v_wallet;

    insert into public.wallet_transactions
      (user_id, type, coin_amount, balance_after, call_id, idempotency_key, metadata)
    values
      (v_call.caller_id, 'refund', v_refund_coins, v_wallet.coin_balance, v_call.id,
       v_refund_key,
       jsonb_build_object('description', 'Host silence refund', 'details', p_details));
  end if;

  v_new_strike_count := coalesce(v_host.silence_warning_count, 0) + 1;
  v_is_suspended := v_new_strike_count >= 3;
  update public.hosts
  set silence_warning_count = v_new_strike_count,
      is_suspended = v_is_suspended,
      is_available = case when v_is_suspended then false else is_available end
  where id = v_call.host_id;

  insert into public.call_events (call_id, actor_id, event_type, payload)
  values (
    v_call.id,
    p_reporter_id,
    'host_silence_strike_issued',
    jsonb_build_object(
      'strike_number', v_new_strike_count,
      'is_suspended', v_is_suspended,
      'refund_coins_to_user', v_refund_coins,
      'details', p_details
    )
  );

  return jsonb_build_object(
    'success', true,
    'already_reported', false,
    'strike_count', v_new_strike_count,
    'is_suspended', v_is_suspended,
    'refunded_coins', v_refund_coins
  );
end;
$$;

-- Create the database order record before the provider order.  This eliminates
-- a provider order that has no local record if the database insert fails later.
create or replace function public.create_friendoo_pending_payment(
  p_user_id uuid,
  p_package_id text,
  p_provider_order_id text
)
returns public.payment_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_package public.coin_packages;
  v_order public.payment_orders;
begin
  select * into v_package
  from public.coin_packages
  where id = p_package_id and is_active = true;
  if not found then
    raise exception 'Invalid or inactive coin package';
  end if;

  insert into public.payment_orders (
    user_id,
    package_id,
    amount_inr,
    coins,
    provider,
    provider_order_id,
    status
  ) values (
    p_user_id,
    v_package.id,
    v_package.amount_inr,
    v_package.coins,
    'cashfree',
    p_provider_order_id,
    'pending'
  )
  returning * into v_order;

  return v_order;
end;
$$;

-- Settle only after a verified Cashfree payment.  The wallet is locked before
-- checking prior successful orders, so two concurrent successful orders cannot
-- both receive the first-purchase bonus.  The immutable ledger entry is inserted
-- before changing the wallet balance; a duplicate payment id aborts the transaction.
create or replace function public.credit_friendoo_payment(
  p_provider_order_id text,
  p_payment_id text,
  p_payment_method text
)
returns public.payment_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.payment_orders;
  v_wallet public.wallets;
  v_package_coins integer;
  v_bonus_coins integer := 0;
  v_credit_coins integer;
  v_has_prior_success boolean;
  v_transaction_id uuid;
begin
  select * into v_order
  from public.payment_orders
  where provider_order_id = p_provider_order_id
  for update;

  if not found then
    raise exception 'Payment order not found';
  end if;

  if v_order.status = 'success' then
    return v_order;
  end if;

  if v_order.status not in ('pending', 'failed') then
    raise exception 'Payment order cannot be credited from status %', v_order.status;
  end if;

  select * into v_wallet
  from public.wallets
  where user_id = v_order.user_id for update;
  if not found then
    raise exception 'Wallet not found';
  end if;

  -- Orders created before this migration may already include the 50% bonus in
  -- `coins`; do not add it again.  New orders keep the base package quantity.
  select coins into v_package_coins
  from public.coin_packages
  where id = v_order.package_id;

  if v_order.coins <= coalesce(v_package_coins, v_order.coins) then
    select exists (
      select 1
      from public.payment_orders
      where user_id = v_order.user_id
        and status = 'success'
    ) into v_has_prior_success;

    if not v_has_prior_success then
      v_bonus_coins := round(v_order.coins * 0.5);
    end if;
  end if;

  v_credit_coins := v_order.coins + v_bonus_coins;

  insert into public.wallet_transactions (
    user_id,
    type,
    coin_amount,
    balance_after,
    payment_order_id,
    idempotency_key,
    metadata
  ) values (
    v_order.user_id,
    'credit',
    v_credit_coins,
    v_wallet.coin_balance + v_credit_coins,
    v_order.id,
    'cashfree:' || p_payment_id,
    jsonb_build_object(
      'payment_method', p_payment_method,
      'first_purchase_bonus_coins', v_bonus_coins
    )
  ) on conflict (idempotency_key) do nothing
  returning id into v_transaction_id;

  if v_transaction_id is null then
    raise exception 'Duplicate payment ledger entry';
  end if;

  update public.wallets
  set coin_balance = v_wallet.coin_balance + v_credit_coins,
      updated_at = now()
  where user_id = v_order.user_id;

  update public.payment_orders
  set status = 'success'
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.create_friendoo_pending_payment(uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.credit_friendoo_payment(text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_friendoo_pending_payment(uuid, text, text)
  to service_role;
grant execute on function public.credit_friendoo_payment(text, text, text)
  to service_role;
