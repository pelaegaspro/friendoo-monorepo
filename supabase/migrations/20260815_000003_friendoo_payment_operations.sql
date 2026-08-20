-- Atomic Cashfree payment handling. Invoked only from the verified webhook Edge Function.

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

  select * into v_wallet from public.wallets where user_id = v_order.user_id for update;

  update public.wallets
  set coin_balance = coin_balance + v_order.coins
  where user_id = v_order.user_id
  returning * into v_wallet;

  insert into public.wallet_transactions (
    user_id, type, coin_amount, balance_after, payment_order_id, idempotency_key, metadata
  ) values (
    v_order.user_id,
    'credit',
    v_order.coins,
    v_wallet.coin_balance,
    v_order.id,
    'cashfree:' || p_payment_id,
    jsonb_build_object('payment_method', p_payment_method)
  ) on conflict (idempotency_key) do nothing;

  update public.payment_orders
  set status = 'success'
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.set_friendoo_payment_status(
  p_provider_order_id text,
  p_status public.payment_status
)
returns public.payment_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.payment_orders;
begin
  update public.payment_orders
  set status = p_status
  where provider_order_id = p_provider_order_id
    and status <> 'success'
  returning * into v_order;

  if not found then
    select * into v_order from public.payment_orders where provider_order_id = p_provider_order_id;
  end if;
  if not found then
    raise exception 'Payment order not found';
  end if;
  return v_order;
end;
$$;

create or replace function public.freeze_friendoo_wallet_for_dispute(
  p_provider_order_id text,
  p_frozen boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.payment_orders;
begin
  select * into v_order from public.payment_orders where provider_order_id = p_provider_order_id;
  if not found then
    raise exception 'Payment order not found';
  end if;

  update public.wallets
  set is_frozen = p_frozen,
      frozen_reason = case when p_frozen then 'cashfree_dispute' else null end
  where user_id = v_order.user_id;
end;
$$;

revoke all on function public.credit_friendoo_payment(text, text, text) from public, anon, authenticated;
revoke all on function public.set_friendoo_payment_status(text, public.payment_status) from public, anon, authenticated;
revoke all on function public.freeze_friendoo_wallet_for_dispute(text, boolean) from public, anon, authenticated;
