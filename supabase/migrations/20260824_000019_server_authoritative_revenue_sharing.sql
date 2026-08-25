-- Migration: 20260824_000019_server_authoritative_revenue_sharing.sql
-- Hardened Server-Authoritative Host Revenue Split, Anti-Concurrency Locking,
-- Server-Side Inactivity Clock & Auditable Compensating Reversal Ledger.

-- 1. Schema Extensions for Inactivity Tracking & Concurrency Locks
alter table public.calls
  add column if not exists last_user_speech_at timestamptz default now(),
  add column if not exists user_inactivity_count integer not null default 0 check (user_inactivity_count >= 0 and user_inactivity_count <= 3),
  add column if not exists is_time_wasting_settled boolean not null default false,
  add column if not exists settlement_state text not null default 'pending' check (settlement_state in ('pending', 'settled', 'reconciled', 'time_wasting_settled', 'refunded'));

-- 2. Server-Authoritative Financial Configuration Table
create table if not exists public.platform_financial_settings (
  id text primary key check (id = 'active'),
  host_revenue_percent integer not null default 60 check (host_revenue_percent >= 0 and host_revenue_percent <= 100),
  platform_revenue_percent integer not null default 40 check (platform_revenue_percent >= 0 and platform_revenue_percent <= 100),
  min_call_balance_coins integer not null default 15 check (min_call_balance_coins > 0),
  grace_period_seconds integer not null default 5 check (grace_period_seconds >= 0),
  inactivity_threshold_seconds integer not null default 15 check (inactivity_threshold_seconds > 0),
  rtc_cost_coins_per_minute numeric(6,3) not null default 0.080, -- Approx ₹0.38 at 1 coin = ₹5
  payment_fee_percent numeric(4,2) not null default 0.020, -- 2% payment gateway fee
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint sum_to_100 check (host_revenue_percent + platform_revenue_percent = 100)
);

insert into public.platform_financial_settings (
  id, host_revenue_percent, platform_revenue_percent, min_call_balance_coins, grace_period_seconds, inactivity_threshold_seconds, rtc_cost_coins_per_minute, payment_fee_percent
) values ('active', 60, 40, 15, 5, 15, 0.080, 0.020)
on conflict (id) do update set
  host_revenue_percent = excluded.host_revenue_percent,
  platform_revenue_percent = excluded.platform_revenue_percent,
  min_call_balance_coins = excluded.min_call_balance_coins,
  grace_period_seconds = excluded.grace_period_seconds,
  inactivity_threshold_seconds = excluded.inactivity_threshold_seconds,
  rtc_cost_coins_per_minute = excluded.rtc_cost_coins_per_minute,
  payment_fee_percent = excluded.payment_fee_percent,
  updated_at = now();

alter table public.platform_financial_settings enable row level security;
alter table public.platform_financial_settings force row level security;

drop policy if exists "admin_manage_financial_settings" on public.platform_financial_settings;
create policy "admin_manage_financial_settings"
  on public.platform_financial_settings
  for all
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin'::public.app_role)
  with check ((select role from public.profiles where id = auth.uid()) = 'admin'::public.app_role);

drop policy if exists "public_read_financial_settings" on public.platform_financial_settings;
create policy "public_read_financial_settings"
  on public.platform_financial_settings
  for select
  to authenticated
  using (true);

-- 3. Dynamic Financial Config Helper
create or replace function public.get_platform_revenue_split(
  out o_host_pct numeric,
  out o_plat_pct numeric,
  out o_min_balance integer,
  out o_grace_sec integer,
  out o_inactivity_sec integer,
  out o_rtc_cost_coins numeric,
  out o_payment_fee_pct numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rec record;
begin
  select * into v_rec from public.platform_financial_settings where id = 'active' limit 1;
  if not found or v_rec is null then
    o_host_pct := 0.60;
    o_plat_pct := 0.40;
    o_min_balance := 15;
    o_grace_sec := 5;
    o_inactivity_sec := 15;
    o_rtc_cost_coins := 0.080;
    o_payment_fee_pct := 0.020;
  else
    o_host_pct := (v_rec.host_revenue_percent::numeric / 100.0);
    o_plat_pct := (v_rec.platform_revenue_percent::numeric / 100.0);
    o_min_balance := v_rec.min_call_balance_coins;
    o_grace_sec := v_rec.grace_period_seconds;
    o_inactivity_sec := v_rec.inactivity_threshold_seconds;
    o_rtc_cost_coins := v_rec.rtc_cost_coins_per_minute;
    o_payment_fee_pct := v_rec.payment_fee_percent;
  end if;
end;
$$;

-- 4. Server-Authoritative Inactivity Clock & Telemetry Distinguisher
create or replace function public.report_call_audio_telemetry(
  p_call_id uuid,
  p_actor_id uuid,
  p_is_user_speaking boolean,
  p_has_technical_fault boolean default false,
  p_technical_fault_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_call public.calls;
  v_now timestamptz := now();
  v_silence_duration_sec integer;
  v_inactivity_threshold integer;
  v_new_count integer;
  v_host_pct numeric;
  v_plat_pct numeric;
  v_min_bal integer;
  v_grace_sec integer;
  v_inactivity_sec integer;
  v_rtc_cost numeric;
  v_fee_pct numeric;
begin
  -- Lock call row to serialize telemetry and billing
  select * into v_call from public.calls where id = p_call_id for update;
  if not found then
    raise exception 'Call not found';
  end if;

  if p_actor_id not in (v_call.caller_id, v_call.host_id) then
    raise exception 'FORBIDDEN: Actor not in call';
  end if;

  if v_call.status in ('ended', 'missed', 'rejected') then
    return jsonb_build_object('status', 'call_already_ended');
  end if;

  -- 1. Explicit Technical Fault Handling (Network / Bluetooth / OS restriction != time wasting)
  if p_has_technical_fault then
    insert into public.call_events (call_id, actor_id, event_type, payload)
    values (p_call_id, p_actor_id, 'audio_telemetry_technical_fault', jsonb_build_object(
      'reason', coalesce(p_technical_fault_reason, 'unspecified_hardware_or_network_fault'),
      'server_timestamp', v_now
    ));
    return jsonb_build_object('status', 'technical_fault_recorded_no_penalty');
  end if;

  -- 2. User Speaking: Reset continuous silence clock
  if p_is_user_speaking then
    update public.calls
    set last_user_speech_at = v_now
    where id = p_call_id;

    insert into public.call_events (call_id, actor_id, event_type, payload)
    values (p_call_id, p_actor_id, 'user_speech_active', jsonb_build_object(
      'continuous_timer_reset', true,
      'current_inactivity_occurrences', v_call.user_inactivity_count,
      'server_timestamp', v_now
    ));

    return jsonb_build_object(
      'status', 'speech_active_timer_reset',
      'inactivity_count', v_call.user_inactivity_count
    );
  end if;

  -- 3. Inactivity Evaluation against Server-Authoritative Clock
  select o_inactivity_sec into v_inactivity_threshold from public.get_platform_revenue_split();

  v_silence_duration_sec := extract(epoch from (v_now - coalesce(v_call.last_user_speech_at, v_call.started_at, v_now)))::integer;
  if v_silence_duration_sec < 0 then
    v_silence_duration_sec := 0;
  end if;

  -- Verify continuous 15s server elapsed time
  if v_silence_duration_sec >= v_inactivity_threshold then
    v_new_count := v_call.user_inactivity_count + 1;

    -- Reset the speech timestamp so subsequent 15s requires another separate interval
    update public.calls
    set user_inactivity_count = v_new_count,
        last_user_speech_at = v_now
    where id = p_call_id;

    insert into public.call_events (call_id, actor_id, event_type, payload)
    values (p_call_id, p_actor_id, 'no_qualifying_audio_15s_occurrence_' || v_new_count, jsonb_build_object(
      'occurrence_index', v_new_count,
      'telemetry_fact', 'no_qualifying_audio_detected_15s',
      'server_silence_duration_sec', v_silence_duration_sec,
      'server_timestamp', v_now
    ));

    -- Occurrence #3 in ONE call -> Trigger Time-Wasting Policy Classification & Termination
    if v_new_count >= 3 then
      insert into public.call_events (call_id, actor_id, event_type, payload)
      values (p_call_id, p_actor_id, 'user_time_wasting_policy_triggered', jsonb_build_object(
        'policy_verdict', 'USER_TIME_WASTING_POLICY_TRIGGERED',
        'qualifying_occurrences_total', v_new_count,
        'server_timestamp', v_now
      ));

      -- Terminate call immediately with 'user_time_wasting'
      -- CRITICAL RULE: Settle ONLY coins already accrued on the billing clock (never manufacture a new minute)
      perform public.end_friendoo_call(p_call_id, p_actor_id, 'user_time_wasting');
      -- Perform exact, auditable host earnings reversal to platform ledger
      perform public.settle_user_time_wasting_reversal(p_call_id);

      return jsonb_build_object(
        'status', 'user_time_wasting_terminated',
        'occurrences', v_new_count,
        'policy_verdict', 'USER_TIME_WASTING_POLICY_TRIGGERED',
        'settlement_action', 'HOST_REVERSED_TO_PLATFORM'
      );
    end if;

    return jsonb_build_object('status', 'occurrence_recorded', 'count', v_new_count);
  end if;

  return jsonb_build_object('status', 'silence_under_threshold', 'elapsed_sec', v_silence_duration_sec);
end;
$$;

-- 5. Auditable Host Reversal Engine for Time-Wasting Penalty
-- Net Invariant: User: -TotalBilled, Host: 0, Platform: +TotalBilled
create or replace function public.settle_user_time_wasting_reversal(
  p_call_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_call public.calls;
  v_host_wallet public.wallets;
  v_disputed_coins numeric;
  v_host_reversal_coins numeric;
  v_host_reversal_key text;
  v_plat_adjustment_key text;
begin
  select * into v_call from public.calls where id = p_call_id for update;
  if not found then
    raise exception 'Call not found';
  end if;

  if v_call.is_time_wasting_settled then
    return jsonb_build_object('status', 'already_settled', 'call_id', p_call_id);
  end if;

  v_disputed_coins := coalesce(v_call.total_coins_deducted, 0);
  v_host_reversal_coins := coalesce(v_call.host_coins_earned, 0);

  -- 1. Reverse host earnings from host wallet if any previous minutes were credited
  if v_host_reversal_coins > 0 then
    select * into v_host_wallet from public.wallets where user_id = v_call.host_id for update;

    update public.wallets
    set coin_balance = greatest(0, coin_balance - v_host_reversal_coins)
    where user_id = v_call.host_id
    returning * into v_host_wallet;

    v_host_reversal_key := 'call:' || v_call.id::text || ':host_time_wasting_reversal';

    insert into public.wallet_transactions (
      user_id, type, coin_amount, balance_after, call_id, idempotency_key, metadata
    ) values (
      v_call.host_id, 'adjustment', -v_host_reversal_coins, v_host_wallet.coin_balance, v_call.id, v_host_reversal_key,
      jsonb_build_object(
        'reason', 'user_time_wasting_host_reversal',
        'settlement_type', 'USER_TIME_WASTING_ADMIN_SETTLEMENT',
        'original_host_earned', v_host_reversal_coins
      )
    ) on conflict (idempotency_key) do nothing;
  end if;

  -- 2. Allocate the reversed host portion to Platform Revenue Ledger
  if v_host_reversal_coins > 0 then
    v_plat_adjustment_key := 'call:' || v_call.id::text || ':plat_time_wasting_reversal_credit';

    insert into public.platform_revenue_ledger (
      call_id, minute_sequence, caller_id, host_id, gross_coins, host_coins, platform_coins, host_share_pct, idempotency_key
    ) values (
      v_call.id, 9999, v_call.caller_id, v_call.host_id, v_host_reversal_coins, 0, v_host_reversal_coins, 0.00, v_plat_adjustment_key
    ) on conflict (idempotency_key) do nothing;
  end if;

  -- 3. Atomically update call record to final net position: Host = 0, Platform = Total Deducted
  update public.calls
  set is_time_wasting_settled = true,
      settlement_state = 'time_wasting_settled',
      host_coins_earned = 0,
      platform_coins_earned = v_disputed_coins
  where id = p_call_id;

  insert into public.call_events (call_id, actor_id, event_type, payload)
  values (v_call.id, v_call.caller_id, 'user_time_wasting_settlement_completed', jsonb_build_object(
    'gross_coins', v_disputed_coins,
    'host_final_coins', 0,
    'platform_final_coins', v_disputed_coins,
    'user_refund_coins', 0,
    'host_reversed_coins', v_host_reversal_coins
  ));

  return jsonb_build_object(
    'success', true,
    'settlement_type', 'USER_TIME_WASTING_ADMIN_SETTLEMENT',
    'net_user_debit', v_disputed_coins,
    'net_host_earning', 0,
    'net_platform_revenue', v_disputed_coins
  );
end;
$$;

-- 6. Batch Active Minute Reconciler with Strict Liveness & Concurrency Locks
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

    -- 2. Credit host with configured share
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

-- 7. Final Call Settlement & Reconciler with Concurrency Row-Locks
create or replace function public.end_friendoo_call(
  p_call_id uuid,
  p_actor_id uuid default null,
  p_reason text default 'normal_hangup'
)
returns public.calls
language plpgsql
security definer
set search_path = public
as $$
declare
  v_call public.calls;
  v_auth_user uuid;
  v_caller_wallet public.wallets;
  v_host_wallet public.wallets;
  v_effective_end timestamptz;
  v_duration_sec integer;
  v_total_minutes integer;
  v_unbilled_minutes integer;
  v_seq integer;
  v_i integer;
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
  v_final_reason text;
  v_caller_idem_key text;
  v_host_idem_key text;
  v_plat_idem_key text;
  v_reconciled_gross numeric(10,2) := 0;
  v_reconciled_host numeric(10,2) := 0;
  v_reconciled_plat numeric(10,2) := 0;
begin
  select o_host_pct, o_plat_pct, o_min_balance, o_grace_sec, o_inactivity_sec, o_rtc_cost_coins, o_payment_fee_pct
  into v_host_share_pct, v_plat_share_pct, v_min_balance, v_grace_sec, v_inactivity_sec, v_rtc_cost, v_fee_pct
  from public.get_platform_revenue_split();

  v_auth_user := auth.uid();
  if v_auth_user is not null then
    p_actor_id := v_auth_user;
  end if;

  -- Acquire exclusive row lock to serialize multiple concurrent end-call attempts
  select * into v_call from public.calls where id = p_call_id for update;
  if not found then
    raise exception 'Call not found';
  end if;

  if p_actor_id is not null and p_actor_id not in (v_call.caller_id, v_call.host_id) then
    raise exception 'FORBIDDEN: Not a call participant';
  end if;

  -- Idempotency check: if already ended, return existing call state immediately
  if v_call.status in ('ended', 'missed', 'rejected') then
    return v_call;
  end if;

  -- Ringing call never accepted
  if v_call.started_at is null then
    update public.calls
    set status = case when p_reason in ('rejected', 'declined') then 'rejected'::public.call_status else 'missed'::public.call_status end,
        ended_at = now(),
        end_reason = left(p_reason, 100),
        settlement_state = 'settled'
    where id = p_call_id
    returning * into v_call;

    update public.user_presence
    set state = 'online', last_seen_at = now()
    where user_id in (v_call.caller_id, v_call.host_id);

    return v_call;
  end if;

  if p_reason = 'heartbeat_timeout' then
    v_effective_end := least(
      coalesce(v_call.caller_heartbeat_at, v_call.started_at),
      coalesce(v_call.host_heartbeat_at, v_call.started_at)
    );
  else
    v_effective_end := now();
  end if;

  v_duration_sec := extract(epoch from (v_effective_end - v_call.started_at))::integer;
  if v_duration_sec < 0 then
    v_duration_sec := 0;
  end if;

  -- 5-Second Grace Period & Ceiling-based per-minute billing
  if v_duration_sec <= v_grace_sec then
    v_total_minutes := 0;
    v_final_reason := 'grace_period';
  else
    -- Standard ceiling billing on elapsed legitimate call clock
    v_total_minutes := ceil(v_duration_sec / 60.0)::integer;
    v_final_reason := p_reason;
  end if;

  v_unbilled_minutes := v_total_minutes - v_call.billed_minute_count;

  -- Final Minute Reconciliation: strictly full minutes, atomic & idempotent
  if v_unbilled_minutes > 0 then
    v_gross_coins := v_call.rate_per_minute::numeric(10,2);
    -- Deterministic rounding
    v_host_coins := round(v_gross_coins * v_host_share_pct, 2);
    v_platform_coins := v_gross_coins - v_host_coins;

    for v_i in 1..v_unbilled_minutes loop
      v_seq := v_call.billed_minute_count + v_i;

      select * into v_caller_wallet from public.wallets where user_id = v_call.caller_id for update;
      select * into v_host_wallet from public.wallets where user_id = v_call.host_id for update;

      if not found or v_caller_wallet is null or v_host_wallet is null then
        raise exception 'FATAL: Participant wallet not found during reconciliation';
      end if;

      if v_caller_wallet.coin_balance < v_gross_coins then
        exit;
      end if;

      v_caller_idem_key := 'call:' || v_call.id::text || ':caller_min:' || v_seq::text;
      v_host_idem_key   := 'call:' || v_call.id::text || ':host_min:' || v_seq::text;
      v_plat_idem_key   := 'call:' || v_call.id::text || ':plat_min:' || v_seq::text;

      -- Debit caller
      update public.wallets
      set coin_balance = coin_balance - v_gross_coins
      where user_id = v_call.caller_id
      returning * into v_caller_wallet;

      insert into public.wallet_transactions (
        user_id, type, coin_amount, balance_after, call_id, idempotency_key, metadata
      ) values (
        v_call.caller_id, 'debit', -v_gross_coins, v_caller_wallet.coin_balance, v_call.id, v_caller_idem_key,
        jsonb_build_object('reason', 'call_final_reconciliation', 'minute_sequence', v_seq)
      ) on conflict (idempotency_key) do nothing;

      -- Credit host
      update public.wallets
      set coin_balance = coin_balance + v_host_coins
      where user_id = v_call.host_id
      returning * into v_host_wallet;

      insert into public.wallet_transactions (
        user_id, type, coin_amount, balance_after, call_id, idempotency_key, metadata
      ) values (
        v_call.host_id, 'credit', v_host_coins, v_host_wallet.coin_balance, v_call.id, v_host_idem_key,
        jsonb_build_object('reason', 'host_final_reconciliation', 'minute_sequence', v_seq, 'host_share_pct', v_host_share_pct)
      ) on conflict (idempotency_key) do nothing;

      -- Platform revenue ledger
      insert into public.platform_revenue_ledger (
        call_id, minute_sequence, caller_id, host_id, gross_coins, host_coins, platform_coins, host_share_pct, idempotency_key
      ) values (
        v_call.id, v_seq, v_call.caller_id, v_call.host_id, v_gross_coins, v_host_coins, v_platform_coins, v_host_share_pct, v_plat_idem_key
      ) on conflict (idempotency_key) do nothing;

      v_reconciled_gross := v_reconciled_gross + v_gross_coins;
      v_reconciled_host  := v_reconciled_host + v_host_coins;
      v_reconciled_plat  := v_reconciled_plat + v_platform_coins;
    end loop;
  end if;

  -- Transition call to ended
  update public.calls
  set status = 'ended',
      ended_at = now(),
      end_reason = left(v_final_reason, 100),
      settlement_state = 'settled',
      billed_minute_count = v_call.billed_minute_count + (v_reconciled_gross / v_call.rate_per_minute)::integer,
      total_coins_deducted = total_coins_deducted + v_reconciled_gross,
      host_coins_earned = host_coins_earned + v_reconciled_host,
      platform_coins_earned = platform_coins_earned + v_reconciled_plat
  where id = p_call_id
  returning * into v_call;

  insert into public.call_events (call_id, actor_id, event_type, payload)
  values (p_call_id, p_actor_id, 'call_ended', jsonb_build_object(
    'end_reason', v_final_reason,
    'total_duration_sec', v_duration_sec,
    'billed_minute_count', v_call.billed_minute_count,
    'total_coins_deducted', v_call.total_coins_deducted,
    'host_coins_earned', v_call.host_coins_earned,
    'platform_coins_earned', v_call.platform_coins_earned
  ));

  update public.user_presence
  set state = 'online', last_seen_at = now()
  where user_id in (v_call.caller_id, v_call.host_id);

  return v_call;
end;
$$;

-- 8. Contribution Margin Financial Analytics RPC (Mathematically Rigorous)
create or replace function public.get_platform_financial_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gross numeric := 0;
  v_host_earn numeric := 0;
  v_plat_rev numeric := 0;
  v_refunds numeric := 0;
  v_time_wasting_coins numeric := 0;
  v_paid_mins integer := 0;
  v_total_rtc_cost numeric := 0;
  v_total_payment_fees numeric := 0;
  v_contribution_margin numeric := 0;
  v_config record;
begin
  select * into v_config from public.platform_financial_settings where id = 'active' limit 1;

  select
    coalesce(sum(gross_coins), 0),
    coalesce(sum(host_coins), 0),
    coalesce(sum(platform_coins), 0),
    count(distinct (call_id, minute_sequence))
  into v_gross, v_host_earn, v_plat_rev, v_paid_mins
  from public.platform_revenue_ledger
  where minute_sequence <> 9999;

  select coalesce(sum(coin_amount), 0)
  into v_refunds
  from public.wallet_transactions
  where type = 'refund';

  select coalesce(sum(platform_coins), 0)
  into v_time_wasting_coins
  from public.platform_revenue_ledger
  where minute_sequence = 9999;

  -- Exact Contribution Margin Formulation:
  -- Platform Revenue + Time-Wasting Settlements - RTC Cost (~₹0.38/min) - Payment Fees (2%) - Refunds
  v_total_rtc_cost := v_paid_mins * coalesce(v_config.rtc_cost_coins_per_minute, 0.080);
  v_total_payment_fees := v_gross * coalesce(v_config.payment_fee_percent, 0.020);
  v_contribution_margin := (v_plat_rev + v_time_wasting_coins) - v_total_rtc_cost - v_total_payment_fees - v_refunds;

  return jsonb_build_object(
    'gross_call_coins', v_gross,
    'host_earnings_coins', v_host_earn,
    'platform_revenue_coins', v_plat_rev,
    'time_wasting_settlement_coins', v_time_wasting_coins,
    'refund_coins', v_refunds,
    'estimated_rtc_cost_coins', round(v_total_rtc_cost, 2),
    'estimated_payment_fees_coins', round(v_total_payment_fees, 2),
    'contribution_margin_coins', round(v_contribution_margin, 2),
    'total_paid_minutes', v_paid_mins,
    'contribution_margin_per_paid_minute', case when v_paid_mins > 0 then round(v_contribution_margin / v_paid_mins, 2) else 0 end,
    'host_revenue_percent', coalesce(v_config.host_revenue_percent, 60),
    'platform_revenue_percent', coalesce(v_config.platform_revenue_percent, 40)
  );
end;
$$;
