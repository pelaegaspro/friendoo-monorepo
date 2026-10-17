-- Migration: Add Google Play Billing purchase crediting function
-- Allows Friendoo users to purchase coin packages via Google Play In-App Purchase (IAP)
-- Handles idempotency, 50% first-time buyer bonus, ledger logging, and wallet balance updates.

create or replace function public.credit_google_play_purchase(
  p_user_id uuid,
  p_package_id text,
  p_order_id text,
  p_purchase_token text,
  p_amount_inr integer default null,
  p_coins integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_package public.coin_packages;
  v_wallet public.wallets;
  v_amount integer;
  v_coins integer;
  v_bonus_coins integer := 0;
  v_credit_coins integer;
  v_has_prior_success boolean;
  v_existing_order public.payment_orders;
  v_order_id uuid;
  v_transaction_id uuid;
  v_canonical_order_id text;
begin
  if p_user_id is null then
    raise exception 'User ID is required';
  end if;

  -- Canonical order reference
  v_canonical_order_id := coalesce(nullif(trim(p_order_id), ''), 'gplay_' || substr(md5(p_purchase_token), 1, 24));

  -- Check if order has already been credited
  select * into v_existing_order
  from public.payment_orders
  where provider_order_id = v_canonical_order_id
     or provider_order_id = 'gplay_' || p_order_id
  limit 1;

  if v_existing_order.id is not null and v_existing_order.status = 'success' then
    select * into v_wallet from public.wallets where user_id = p_user_id;
    return jsonb_build_object(
      'success', true,
      'already_credited', true,
      'coins_credited', v_existing_order.coins,
      'current_balance', coalesce(v_wallet.coin_balance, 0)
    );
  end if;

  -- Match coin package by id or known aliases
  select * into v_package
  from public.coin_packages
  where id = p_package_id
     or id = replace(p_package_id, 'friendoo_coins_', 'pkg_')
     or id = replace(p_package_id, 'coins_', 'pkg_')
     or id = 'pkg_' || p_package_id
  order by (id = p_package_id) desc
  limit 1;

  if v_package.id is not null then
    v_amount := v_package.amount_inr;
    v_coins := v_package.coins;
  else
    v_amount := coalesce(p_amount_inr, 50);
    v_coins := coalesce(p_coins, 50);
  end if;

  -- Lock wallet row
  select * into v_wallet
  from public.wallets
  where user_id = p_user_id
  for update;

  if not found then
    insert into public.wallets (user_id, coin_balance)
    values (p_user_id, 0)
    returning * into v_wallet;
  end if;

  -- Determine first-time buyer bonus (+50% coins)
  select exists (
    select 1
    from public.payment_orders
    where user_id = p_user_id
      and status = 'success'
  ) into v_has_prior_success;

  if not v_has_prior_success then
    v_bonus_coins := round(v_coins * 0.5);
  end if;

  v_credit_coins := v_coins + v_bonus_coins;

  -- Insert or update payment order
  insert into public.payment_orders (
    user_id,
    package_id,
    provider,
    provider_order_id,
    status,
    amount_inr,
    coins
  ) values (
    p_user_id,
    coalesce(v_package.id, p_package_id),
    'google_play',
    v_canonical_order_id,
    'success',
    v_amount,
    v_credit_coins
  )
  on conflict (provider_order_id) do update
  set status = 'success',
      coins = v_credit_coins,
      updated_at = now()
  returning id into v_order_id;

  -- Insert immutable ledger transaction entry
  insert into public.wallet_transactions (
    user_id,
    type,
    coin_amount,
    balance_after,
    payment_order_id,
    idempotency_key,
    metadata
  ) values (
    p_user_id,
    'credit',
    v_credit_coins,
    v_wallet.coin_balance + v_credit_coins,
    v_order_id,
    'gplay:' || v_canonical_order_id,
    jsonb_build_object(
      'provider', 'google_play',
      'package_id', coalesce(v_package.id, p_package_id),
      'order_id', p_order_id,
      'base_coins', v_coins,
      'bonus_coins', v_bonus_coins,
      'purchase_token_preview', substr(p_purchase_token, 1, 16) || '...'
    )
  )
  on conflict (idempotency_key) do nothing
  returning id into v_transaction_id;

  -- Update wallet coin balance
  update public.wallets
  set coin_balance = coin_balance + v_credit_coins,
      updated_at = now()
  where user_id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'already_credited', false,
    'coins_credited', v_credit_coins,
    'bonus_coins', v_bonus_coins,
    'new_balance', v_wallet.coin_balance + v_credit_coins
  );
end;
$$;

grant execute on function public.credit_google_play_purchase(uuid, text, text, text, integer, integer)
  to authenticated, service_role;

