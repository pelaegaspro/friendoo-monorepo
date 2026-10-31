-- Migration: 20261101_000042_support_realtime_earnings_and_banner_ads.sql
-- 1. Align support_tickets check constraints to prevent status/priority mismatch errors
-- 2. Update reconcile_active_call_minutes to credit host_earnings.available_paise
-- 3. Create public.banner_ads table and seed default promotional campaigns

-- 1. Update support_tickets constraints
alter table public.support_tickets drop constraint if exists support_tickets_status_check;
alter table public.support_tickets add constraint support_tickets_status_check
  check (status in ('open', 'in_progress', 'waiting_for_user', 'resolved', 'closed', 'active'));

alter table public.support_tickets drop constraint if exists support_tickets_priority_check;
alter table public.support_tickets add constraint support_tickets_priority_check
  check (priority in ('low', 'normal', 'medium', 'high', 'urgent'));

-- 2. Update reconcile_active_call_minutes to credit host_earnings.available_paise synchronously
create or replace function public.reconcile_active_call_minutes()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_call public.calls;
  v_caller_wallet public.wallets;
  v_host_wallet public.wallets;
  v_count integer := 0;
  v_next_seq integer;
  v_gross_coins numeric(10,2);
  v_host_coins numeric(10,2);
  v_platform_coins numeric(10,2);
  v_host_share_pct numeric;
  v_plat_share_pct numeric;
  v_min_balance integer;
  v_grace_sec integer;
  v_inactivity_sec integer;
  v_rtc_cost numeric;
  v_fee_pct numeric;
  v_caller_idem_key text;
  v_host_idem_key text;
  v_plat_idem_key text;
  v_host_paise bigint;
begin
  select o_host_pct, o_plat_pct, o_min_balance, o_grace_sec, o_inactivity_sec, o_rtc_cost_coins, o_payment_fee_pct
  into v_host_share_pct, v_plat_share_pct, v_min_balance, v_grace_sec, v_inactivity_sec, v_rtc_cost, v_fee_pct
  from public.get_platform_revenue_split();

  for v_call in
    select * from public.calls
    where status in ('accepted', 'active')
      and (
        last_billed_at is null or 
        last_billed_at <= now() - interval '1 minute'
      )
    for update skip locked
  loop
    -- Disconnection liveness filter: skip if either party is dead (>25s)
    if v_call.caller_heartbeat_at < now() - interval '25 seconds' or v_call.host_heartbeat_at < now() - interval '25 seconds' then
      continue;
    end if;

    v_next_seq := v_call.billed_minute_count + 1;
    v_gross_coins := v_call.rate_per_minute::numeric(10,2);
    -- Deterministic rounding
    v_host_coins := round(v_gross_coins * v_host_share_pct, 2);
    v_platform_coins := v_gross_coins - v_host_coins; -- Invariant: gross = host + platform
    v_host_paise := round(v_host_coins * 100)::bigint;

    -- Lock caller wallet
    select * into v_caller_wallet from public.wallets where user_id = v_call.caller_id for update;
    if not found then
      raise exception 'FATAL: Caller wallet not found for user %', v_call.caller_id;
    end if;

    -- Strict Full-Minute Rule: Insufficient balance terminates with 0 partial charge for this minute
    if v_caller_wallet.coin_balance < v_gross_coins or v_caller_wallet.is_frozen then
      update public.calls
      set status = 'ended',
          ended_at = now(),
          end_reason = 'insufficient_coins',
          settlement_state = 'settled'
      where id = v_call.id;

      insert into public.call_events (call_id, actor_id, event_type, payload)
      values (v_call.id, v_call.caller_id, 'call_ended_insufficient_coins', jsonb_build_object(
        'remaining_balance', v_caller_wallet.coin_balance,
        'rate_required', v_gross_coins
      ));

      update public.user_presence
      set state = 'online', last_seen_at = now()
      where user_id in (v_call.caller_id, v_call.host_id);

      continue;
    end if;

    select * into v_host_wallet from public.wallets where user_id = v_call.host_id for update;
    if not found then
      raise exception 'FATAL: Host wallet not found for user %', v_call.host_id;
    end if;

    v_caller_idem_key := 'call:' || v_call.id::text || ':caller_min:' || v_next_seq::text;
    v_host_idem_key   := 'call:' || v_call.id::text || ':host_min:' || v_next_seq::text;
    v_plat_idem_key   := 'call:' || v_call.id::text || ':plat_min:' || v_next_seq::text;

    -- 1. Debit caller
    update public.wallets
    set coin_balance = coin_balance - v_gross_coins
    where user_id = v_call.caller_id
    returning * into v_caller_wallet;

    insert into public.wallet_transactions (
      user_id, type, coin_amount, balance_after, call_id, idempotency_key, metadata
    ) values (
      v_call.caller_id, 'debit', -v_gross_coins, v_caller_wallet.coin_balance, v_call.id, v_caller_idem_key,
      jsonb_build_object('reason', 'call_minute_debit', 'minute_sequence', v_next_seq, 'rate', v_call.rate_per_minute)
    ) on conflict (idempotency_key) do nothing;

    -- 2. Credit host with configured share in coins
    update public.wallets
    set coin_balance = coin_balance + v_host_coins
    where user_id = v_call.host_id
    returning * into v_host_wallet;

    insert into public.wallet_transactions (
      user_id, type, coin_amount, balance_after, call_id, idempotency_key, metadata
    ) values (
      v_call.host_id, 'credit', v_host_coins, v_host_wallet.coin_balance, v_call.id, v_host_idem_key,
      jsonb_build_object('reason', 'host_call_earning', 'minute_sequence', v_next_seq, 'host_share_pct', v_host_share_pct)
    ) on conflict (idempotency_key) do nothing;

    -- 2b. Synchronously increment host_earnings in paise so host can withdraw cash
    insert into public.host_earnings (host_id, available_paise, total_earned_paise)
    values (v_call.host_id, v_host_paise, v_host_paise)
    on conflict (host_id) do update
    set available_paise = host_earnings.available_paise + v_host_paise,
        total_earned_paise = host_earnings.total_earned_paise + v_host_paise,
        updated_at = now();

    -- 3. Log Platform Revenue double-entry ledger
    insert into public.platform_revenue_ledger (
      call_id, minute_sequence, caller_id, host_id, gross_coins, host_coins, platform_coins, host_share_pct, idempotency_key
    ) values (
      v_call.id, v_next_seq, v_call.caller_id, v_call.host_id, v_gross_coins, v_host_coins, v_platform_coins, v_host_share_pct, v_plat_idem_key
    ) on conflict (idempotency_key) do nothing;

    -- 4. Advance call billing state
    update public.calls
    set billed_minute_count = v_next_seq,
        total_coins_deducted = total_coins_deducted + v_gross_coins,
        host_coins_earned = host_coins_earned + v_host_coins,
        platform_coins_earned = platform_coins_earned + v_platform_coins,
        last_billed_at = now(),
        status = 'active'
    where id = v_call.id;

    insert into public.call_events (call_id, actor_id, event_type, payload)
    values (v_call.id, v_call.caller_id, 'call_minute_billed', jsonb_build_object(
      'minute_sequence', v_next_seq,
      'gross_coins', v_gross_coins,
      'host_coins', v_host_coins,
      'platform_coins', v_platform_coins,
      'host_share_pct', v_host_share_pct
    ));

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- 3. Create public.banner_ads table
create table if not exists public.banner_ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  campaign_type text not null default 'user_offer',
  campaign_class text not null default 'friendoo_offer',
  sponsor_name text,
  target_audience text not null default 'all',
  badge_text text not null default 'SPECIAL OFFER',
  headline text not null,
  subtitle text not null,
  image_url text,
  gradient_colors text[] default array['#4F46E5', '#7C3AED', '#DB2777'],
  action_type text not null default 'recharge',
  action_url text,
  placement text not null default 'user_top_banner',
  promo_coins integer,
  promo_price_inr numeric(10,2),
  original_price_inr numeric(10,2),
  promo_bonus_label text,
  show_as_popup boolean not null default false,
  is_active boolean not null default true,
  priority integer not null default 10,
  impressions_count bigint not null default 0,
  clicks_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.banner_ads enable row level security;

-- Policies for banner_ads
drop policy if exists "anyone_view_active_banner_ads" on public.banner_ads;
create policy "anyone_view_active_banner_ads"
  on public.banner_ads for select to public
  using (is_active = true);

drop policy if exists "service_role_manage_banner_ads" on public.banner_ads;
create policy "service_role_manage_banner_ads"
  on public.banner_ads for all to service_role
  using (true) with check (true);

-- Seed initial high-converting promotional banners
insert into public.banner_ads (
  title, campaign_type, campaign_class, badge_text, headline, subtitle, gradient_colors, action_type, promo_coins, promo_price_inr, original_price_inr, promo_bonus_label, priority
) values 
(
  'First Recharge 50% Bonus',
  'user_offer',
  'friendoo_offer',
  'FLASH OFFER',
  'Get +50% Bonus Coins Today',
  'Recharge ₹99 and receive 150 coins immediately. Talk with top Tamil & Hindi hosts.',
  array['#6366F1', '#8B5CF6', '#EC4899'],
  'recharge',
  150,
  99.00,
  149.00,
  '+50% EXTRA',
  100
),
(
  'Weekend Star Host Pass',
  'user_offer',
  'friendoo_offer',
  'STAR HOSTS',
  'Connect with Verified Stars',
  'First 15 seconds of every voice call are 100% free. Guaranteed crystal clear audio.',
  array['#0F172A', '#1E293B', '#334155'],
  'link',
  null,
  null,
  null,
  '100% FREE INTRO',
  90
)
on conflict do nothing;
