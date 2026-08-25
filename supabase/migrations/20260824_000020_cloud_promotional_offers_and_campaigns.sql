-- Migration: 20260824_000020_cloud_promotional_offers_and_campaigns.sql
-- Server-Authoritative Cloud Advertisement & In-App Offer Management System
-- Integrates with CRM Segments, Double-Entry Payment Accounting, Emergency Kill Switches, and Auditable Funnel Analytics.

-- 1. Extend Platform Financial Settings with Emergency Marketing Kill Switches
alter table public.platform_financial_settings
  add column if not exists kill_switch_promotions boolean not null default false,
  add column if not exists kill_switch_banners boolean not null default false;

-- 2. Server-Authoritative Promotional Offers Table
create table if not exists public.promotional_offers (
  id uuid primary key default gen_random_uuid(),
  offer_code text unique check (char_length(trim(offer_code)) between 2 and 50),
  title text not null check (char_length(trim(title)) between 2 and 120),
  description text check (char_length(description) <= 500),
  offer_type text not null default 'LIMITED_TIME' check (
    offer_type in (
      'WELCOME', 'FIRST_RECHARGE', 'LOW_BALANCE', 'RETURNING_USER',
      'INACTIVE_USER', 'HIGH_VALUE_USER', 'POST_CALL', 'WEEKEND',
      'LIMITED_TIME', 'CUSTOM'
    )
  ),
  package_id text references public.coin_packages(id) on delete set null,
  coin_amount integer not null check (coin_amount > 0),
  cash_price_inr numeric(10,2) not null check (cash_price_inr > 0),
  original_price_inr numeric(10,2) not null check (original_price_inr >= cash_price_inr),
  discount_label text,
  target_segment text not null default 'all_users' check (
    target_segment in (
      'all_users', 'new_users', 'never_purchased', 'never_called',
      'low_balance', 'inactive_users', 'returning_users', 'high_value_users', 'hosts'
    )
  ),
  placement text not null default 'WALLET' check (
    placement in ('HOME', 'DISCOVERY', 'WALLET', 'POST_CALL', 'PROFILE')
  ),
  start_at timestamptz not null default now(),
  end_at timestamptz,
  is_enabled boolean not null default true,
  priority integer not null default 0,
  max_redemptions integer default null check (max_redemptions is null or max_redemptions > 0),
  current_redemptions integer not null default 0 check (current_redemptions >= 0),
  per_user_limit integer not null default 1 check (per_user_limit > 0),
  banner_image_url text,
  cta_text text not null default 'Claim Offer' check (char_length(trim(cta_text)) between 1 and 40),
  deep_link text default 'friendoo://recharge',
  impression_count bigint not null default 0,
  click_count bigint not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_schedule check (end_at is null or end_at > start_at)
);

create index if not exists promotional_offers_status_idx 
  on public.promotional_offers (is_enabled, priority desc, start_at, end_at);
create index if not exists promotional_offers_segment_idx 
  on public.promotional_offers (target_segment, placement);

-- 3. Immutable Offer Redemptions Ledger Table
create table if not exists public.offer_redemptions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.promotional_offers(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  payment_order_id uuid references public.payment_orders(id) on delete set null,
  coins_credited integer not null check (coins_credited > 0),
  amount_paid_inr numeric(10,2) not null check (amount_paid_inr >= 0),
  idempotency_key text unique not null,
  created_at timestamptz not null default now()
);

create index if not exists offer_redemptions_user_offer_idx 
  on public.offer_redemptions (user_id, offer_id);
create index if not exists offer_redemptions_created_idx 
  on public.offer_redemptions (created_at desc);

-- 4. Enable Row Level Security
alter table public.promotional_offers enable row level security;
alter table public.promotional_offers force row level security;
alter table public.offer_redemptions enable row level security;
alter table public.offer_redemptions force row level security;

-- Policies for promotional_offers
drop policy if exists "public_view_active_offers" on public.promotional_offers;
create policy "public_view_active_offers"
  on public.promotional_offers
  for select
  to authenticated, anon
  using (
    is_enabled = true
    and start_at <= now()
    and (end_at is null or end_at >= now())
  );

drop policy if exists "admin_manage_promotional_offers" on public.promotional_offers;
create policy "admin_manage_promotional_offers"
  on public.promotional_offers
  for all
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin'::public.app_role)
  with check ((select role from public.profiles where id = auth.uid()) = 'admin'::public.app_role);

-- Policies for offer_redemptions
drop policy if exists "users_view_own_redemptions" on public.offer_redemptions;
create policy "users_view_own_redemptions"
  on public.offer_redemptions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "admin_view_all_redemptions" on public.offer_redemptions;
create policy "admin_view_all_redemptions"
  on public.offer_redemptions
  for select
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin'::public.app_role);

-- 5. Seed Default Starter Flash Deal & Welcome Offer
insert into public.promotional_offers (
  offer_code, title, description, offer_type, coin_amount, cash_price_inr,
  original_price_inr, discount_label, target_segment, placement, priority, per_user_limit
) values 
(
  'WELCOME50',
  'Welcome Special: 50 Coins for ₹39',
  'Exclusive introductory deal for new Friendoo users. Save 20% on talk time!',
  'WELCOME',
  50,
  39.00,
  49.00,
  '20% OFF',
  'new_users',
  'WALLET',
  100,
  1
),
(
  'FIRSTRECHARGE70',
  'First Recharge Super Pack: 70 Coins for ₹49',
  'Get +40% extra bonus coins on your very first talk recharge.',
  'FIRST_RECHARGE',
  70,
  49.00,
  69.00,
  '+40% BONUS',
  'never_purchased',
  'HOME',
  90,
  1
),
(
  'LOWBAL150',
  'Low Balance Booster: 150 Coins for ₹99',
  'Keep conversations going! Special discounted booster pack.',
  'LOW_BALANCE',
  150,
  99.00,
  149.00,
  '33% OFF',
  'low_balance',
  'POST_CALL',
  80,
  2
)
on conflict (offer_code) do nothing;

-- 6. Server RPC: Validate User Eligibility for an Offer
create or replace function public.validate_user_offer_eligibility(
  p_user_id uuid,
  p_offer_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.promotional_offers%rowtype;
  v_settings public.platform_financial_settings%rowtype;
  v_user_redemptions integer;
  v_user_profile public.profiles%rowtype;
  v_user_wallet public.wallets%rowtype;
  v_has_purchased boolean;
  v_call_count integer;
begin
  -- 1. Check Global Promotions Kill Switch
  select * into v_settings from public.platform_financial_settings where id = 'active';
  if v_settings.kill_switch_promotions then
    return jsonb_build_object('eligible', false, 'reason', 'PROMOTIONS_GLOBALLY_PAUSED');
  end if;

  -- 2. Fetch and Validate Offer State
  select * into v_offer from public.promotional_offers where id = p_offer_id;
  if not found then
    return jsonb_build_object('eligible', false, 'reason', 'OFFER_NOT_FOUND');
  end if;

  if not v_offer.is_enabled then
    return jsonb_build_object('eligible', false, 'reason', 'OFFER_DISABLED');
  end if;

  if now() < v_offer.start_at then
    return jsonb_build_object('eligible', false, 'reason', 'OFFER_NOT_STARTED');
  end if;

  if v_offer.end_at is not null and now() > v_offer.end_at then
    return jsonb_build_object('eligible', false, 'reason', 'OFFER_EXPIRED');
  end if;

  if v_offer.max_redemptions is not null and v_offer.current_redemptions >= v_offer.max_redemptions then
    return jsonb_build_object('eligible', false, 'reason', 'GLOBAL_REDEMPTION_LIMIT_REACHED');
  end if;

  -- 3. Check Per-User Redemption Limit
  select count(*) into v_user_redemptions
  from public.offer_redemptions
  where user_id = p_user_id and offer_id = p_offer_id;

  if v_user_redemptions >= v_offer.per_user_limit then
    return jsonb_build_object('eligible', false, 'reason', 'PER_USER_LIMIT_EXCEEDED');
  end if;

  -- 4. Check CRM Segment Eligibility
  select * into v_user_profile from public.profiles where id = p_user_id;
  if not found then
    return jsonb_build_object('eligible', false, 'reason', 'USER_NOT_FOUND');
  end if;

  select * into v_user_wallet from public.wallets where user_id = p_user_id;

  if v_offer.target_segment = 'new_users' then
    if v_user_profile.created_at < now() - interval '7 days' then
      return jsonb_build_object('eligible', false, 'reason', 'SEGMENT_MISMATCH_NOT_NEW_USER');
    end if;
  elsif v_offer.target_segment = 'never_purchased' then
    select exists(
      select 1 from public.payment_orders 
      where user_id = p_user_id and status = 'success'
    ) into v_has_purchased;
    if v_has_purchased then
      return jsonb_build_object('eligible', false, 'reason', 'SEGMENT_MISMATCH_ALREADY_PURCHASED');
    end if;
  elsif v_offer.target_segment = 'never_called' then
    select count(*) into v_call_count from public.calls where caller_id = p_user_id;
    if v_call_count > 0 then
      return jsonb_build_object('eligible', false, 'reason', 'SEGMENT_MISMATCH_ALREADY_CALLED');
    end if;
  elsif v_offer.target_segment = 'low_balance' then
    if v_user_wallet.coin_balance is not null and v_user_wallet.coin_balance >= 15 then
      return jsonb_build_object('eligible', false, 'reason', 'SEGMENT_MISMATCH_BALANCE_SUFFICIENT');
    end if;
  elsif v_offer.target_segment = 'hosts' then
    if v_user_profile.role <> 'host'::public.app_role then
      return jsonb_build_object('eligible', false, 'reason', 'SEGMENT_MISMATCH_NOT_HOST');
    end if;
  end if;

  return jsonb_build_object(
    'eligible', true,
    'offer_id', v_offer.id,
    'coin_amount', v_offer.coin_amount,
    'cash_price_inr', v_offer.cash_price_inr,
    'discount_label', v_offer.discount_label
  );
end;
$$;

-- 7. Server RPC: Atomic Offer Redemption Execution
create or replace function public.redeem_promotional_offer(
  p_user_id uuid,
  p_offer_id uuid,
  p_payment_order_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.promotional_offers%rowtype;
  v_eligibility jsonb;
  v_existing_redemption public.offer_redemptions%rowtype;
  v_user_wallet public.wallets%rowtype;
  v_new_balance integer;
begin
  if coalesce(char_length(trim(p_idempotency_key)), 0) = 0 then
    raise exception 'IDEMPOTENCY_KEY_REQUIRED';
  end if;

  -- 1. Idempotency Check: Return existing redemption if already processed
  select * into v_existing_redemption 
  from public.offer_redemptions 
  where idempotency_key = p_idempotency_key;

  if found then
    return jsonb_build_object(
      'success', true,
      'is_duplicate', true,
      'redemption_id', v_existing_redemption.id,
      'coins_credited', v_existing_redemption.coins_credited,
      'amount_paid_inr', v_existing_redemption.amount_paid_inr
    );
  end if;

  -- 2. Lock Offer Row FOR UPDATE to prevent concurrency race exceeding limits
  select * into v_offer 
  from public.promotional_offers 
  where id = p_offer_id 
  for update;

  if not found then
    raise exception 'OFFER_NOT_FOUND';
  end if;

  -- 3. Validate Eligibility Server-Side
  v_eligibility := public.validate_user_offer_eligibility(p_user_id, p_offer_id);
  if not (v_eligibility->>'eligible')::boolean then
    raise exception 'INELIGIBLE: %', (v_eligibility->>'reason');
  end if;

  -- 4. Lock and Credit User Wallet Atomically
  select * into v_user_wallet 
  from public.wallets 
  where user_id = p_user_id 
  for update;

  if not found then
    raise exception 'USER_WALLET_NOT_FOUND';
  end if;

  v_new_balance := v_user_wallet.coin_balance + v_offer.coin_amount;

  update public.wallets
  set coin_balance = v_new_balance, updated_at = now()
  where user_id = p_user_id;

  -- 5. Insert Immutable Wallet Ledger Transaction
  insert into public.wallet_transactions (
    user_id, type, coin_amount, balance_after, payment_order_id, idempotency_key, metadata
  ) values (
    p_user_id, 'credit', v_offer.coin_amount, v_new_balance, p_payment_order_id,
    'wallet-credit:' || p_idempotency_key,
    jsonb_build_object(
      'reason', 'promotional_offer_redemption',
      'offer_id', v_offer.id,
      'offer_code', v_offer.offer_code,
      'cash_price_inr', v_offer.cash_price_inr
    )
  ) on conflict (idempotency_key) do nothing;

  -- 6. Insert Offer Redemption Record
  insert into public.offer_redemptions (
    offer_id, user_id, payment_order_id, coins_credited, amount_paid_inr, idempotency_key
  ) values (
    v_offer.id, p_user_id, p_payment_order_id, v_offer.coin_amount, v_offer.cash_price_inr, p_idempotency_key
  ) returning * into v_existing_redemption;

  -- 7. Advance Offer Redemptions Counter
  update public.promotional_offers
  set current_redemptions = current_redemptions + 1, updated_at = now()
  where id = v_offer.id;

  return jsonb_build_object(
    'success', true,
    'is_duplicate', false,
    'redemption_id', v_existing_redemption.id,
    'coins_credited', v_offer.coin_amount,
    'new_coin_balance', v_new_balance,
    'amount_paid_inr', v_offer.cash_price_inr
  );
end;
$$;

-- 8. Admin Offer Analytics & Funnel RPC
create or replace function public.get_offer_campaign_analytics(
  p_offer_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.promotional_offers%rowtype;
  v_total_redemptions bigint := 0;
  v_gross_revenue numeric := 0;
  v_total_coins_issued bigint := 0;
  v_payment_fees numeric := 0;
  v_estimated_contrib_margin numeric := 0;
  v_impressions bigint := 0;
  v_clicks bigint := 0;
  v_ctr numeric := 0;
  v_conversion_rate numeric := 0;
begin
  if p_offer_id is not null then
    select * into v_offer from public.promotional_offers where id = p_offer_id;
    if found then
      v_impressions := coalesce(v_offer.impression_count, 0);
      v_clicks := coalesce(v_offer.click_count, 0);
      
      select 
        coalesce(count(*), 0),
        coalesce(sum(amount_paid_inr), 0),
        coalesce(sum(coins_credited), 0)
      into v_total_redemptions, v_gross_revenue, v_total_coins_issued
      from public.offer_redemptions
      where offer_id = p_offer_id;
    end if;
  else
    select 
      coalesce(sum(impression_count), 0),
      coalesce(sum(click_count), 0)
    into v_impressions, v_clicks
    from public.promotional_offers;

    select 
      coalesce(count(*), 0),
      coalesce(sum(amount_paid_inr), 0),
      coalesce(sum(coins_credited), 0)
    into v_total_redemptions, v_gross_revenue, v_total_coins_issued
    from public.offer_redemptions;
  end if;

  if v_impressions > 0 then
    v_ctr := round((v_clicks::numeric / v_impressions::numeric) * 100.0, 2);
    v_conversion_rate := round((v_total_redemptions::numeric / v_impressions::numeric) * 100.0, 2);
  end if;

  -- Payment fees assumption: 2% payment gateway cost
  v_payment_fees := round(v_gross_revenue * 0.02, 2);
  v_estimated_contrib_margin := v_gross_revenue - v_payment_fees;

  return jsonb_build_object(
    'impressions', v_impressions,
    'clicks', v_clicks,
    'click_through_rate_pct', v_ctr,
    'total_redemptions', v_total_redemptions,
    'conversion_rate_pct', v_conversion_rate,
    'gross_revenue_inr', v_gross_revenue,
    'coins_issued', v_total_coins_issued,
    'payment_fees_inr', v_payment_fees,
    'estimated_contribution_margin_inr', v_estimated_contrib_margin
  );
end;
$$;

-- 9. Admin Auditable Action Wrapper for Offers & Campaigns
create or replace function public.admin_mutate_promotional_offer(
  p_actor_id uuid,
  p_action text, -- 'CREATE', 'UPDATE', 'ACTIVATE', 'PAUSE', 'ARCHIVE'
  p_offer_id uuid,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result_id uuid;
  v_before_state jsonb := '{}'::jsonb;
begin
  perform public.require_friendoo_admin(p_actor_id);

  if p_action in ('UPDATE', 'ACTIVATE', 'PAUSE', 'ARCHIVE') then
    select to_jsonb(o) into v_before_state from public.promotional_offers o where id = p_offer_id;
  end if;

  if p_action = 'ACTIVATE' then
    update public.promotional_offers set is_enabled = true, updated_at = now() where id = p_offer_id returning id into v_result_id;
  elsif p_action = 'PAUSE' then
    update public.promotional_offers set is_enabled = false, updated_at = now() where id = p_offer_id returning id into v_result_id;
  elsif p_action = 'ARCHIVE' then
    update public.promotional_offers set is_enabled = false, end_at = now(), updated_at = now() where id = p_offer_id returning id into v_result_id;
  end if;

  -- Log in Admin Audit Trail
  insert into public.admin_audit_logs (
    actor_id, action, resource_type, resource_id, before_state, after_state
  ) values (
    p_actor_id, 'offer.' || lower(p_action), 'promotional_offer', coalesce(v_result_id, p_offer_id)::text,
    v_before_state, coalesce(p_payload, '{}'::jsonb)
  );

  return coalesce(v_result_id, p_offer_id);
end;
$$;

