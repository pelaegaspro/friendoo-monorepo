-- 20260820_000009_authoritative_billing_reaper.sql
-- Production-Grade Real-Time Billing State Machine, Asymmetric Participant Liveness,
-- Strict Full-Minute Reconciliation, and Hardened Double-Entry Ledger.
-- Generated for Review. (DO NOT APPLY DIRECTLY TO PRODUCTION UNTIL EXPLICITLY APPROVED)

-- 1. Schema Enhancements: Exact Numeric Precision & Heartbeat Liveness Tracking
alter table public.wallets 
  alter column coin_balance type numeric(10,2) using coin_balance::numeric(10,2);

alter table public.wallet_transactions 
  alter column coin_amount type numeric(10,2) using coin_amount::numeric(10,2),
  alter column balance_after type numeric(10,2) using balance_after::numeric(10,2);

alter table public.calls 
  alter column total_coins_deducted type numeric(10,2) using total_coins_deducted::numeric(10,2),
  add column if not exists billed_minute_count integer not null default 0 check (billed_minute_count >= 0),
  add column if not exists host_coins_earned numeric(10,2) not null default 0 check (host_coins_earned >= 0),
  add column if not exists platform_coins_earned numeric(10,2) not null default 0 check (platform_coins_earned >= 0),
  add column if not exists caller_heartbeat_at timestamptz default now(),
  add column if not exists host_heartbeat_at timestamptz default now();

create index if not exists calls_active_heartbeat_idx on public.calls(status, caller_heartbeat_at, host_heartbeat_at)
  where status in ('accepted', 'active');

-- 2. Auditable Double-Entry Platform Revenue Ledger Table
create table if not exists public.platform_revenue_ledger (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete restrict,
  minute_sequence integer not null check (minute_sequence > 0),
  caller_id uuid not null references public.profiles(id),
  host_id uuid not null references public.hosts(id),
  gross_coins numeric(10,2) not null check (gross_coins > 0),
  host_coins numeric(10,2) not null check (host_coins >= 0),
  platform_coins numeric(10,2) not null check (platform_coins >= 0),
  host_share_pct numeric(4,2) not null default 0.70,
  idempotency_key text unique not null,
  created_at timestamptz not null default now(),
  constraint ledger_exact_split_invariant check (gross_coins = host_coins + platform_coins),
  unique (call_id, minute_sequence)
);

create index if not exists platform_revenue_call_seq_idx on public.platform_revenue_ledger(call_id, minute_sequence);
create index if not exists platform_revenue_created_idx on public.platform_revenue_ledger(created_at desc);

-- 3. Strict RLS Security Lockdown on All Financial Tables
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.platform_revenue_ledger enable row level security;
alter table public.calls enable row level security;
alter table public.call_events enable row level security;

alter table public.wallets force row level security;
alter table public.wallet_transactions force row level security;
alter table public.platform_revenue_ledger force row level security;

-- Drop any permissive write policies and custom policies for idempotency
drop policy if exists "users can view their wallet" on public.wallets;
drop policy if exists "users can view their wallet transactions" on public.wallet_transactions;
drop policy if exists "admin can view platform revenue ledger" on public.platform_revenue_ledger;
drop policy if exists "users_select_own_wallet" on public.wallets;
drop policy if exists "users_select_own_transactions" on public.wallet_transactions;
drop policy if exists "admin_select_platform_ledger" on public.platform_revenue_ledger;

-- Read-only client policies (Zero client write permissions on financial ledgers)
create policy "users_select_own_wallet"
  on public.wallets for select to authenticated
  using (auth.uid() = user_id);

create policy "users_select_own_transactions"
  on public.wallet_transactions for select to authenticated
  using (auth.uid() = user_id);

create policy "admin_select_platform_ledger"
  on public.platform_revenue_ledger for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 4. Monotonic Participant-Specific Heartbeat Ping RPC
create or replace function public.ping_friendoo_call_heartbeat(
  p_call_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
begin
  v_actor_id := auth.uid();
  if v_actor_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  update public.calls
  set caller_heartbeat_at = case when caller_id = v_actor_id then now() else caller_heartbeat_at end,
      host_heartbeat_at = case when host_id = v_actor_id then now() else host_heartbeat_at end
  where id = p_call_id
    and status in ('accepted', 'active')
    and (caller_id = v_actor_id or host_id = v_actor_id);
end;
$$;

-- 5. Active Minute Billing Worker (Idempotent & Mutually Exclusive)
create or replace function public.bill_active_friendoo_calls()
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
  v_host_share_pct numeric(4,2) := 0.70;
  v_caller_idem_key text;
  v_host_idem_key text;
  v_plat_idem_key text;
begin
  for v_call in
    select * from public.calls
    where status in ('accepted', 'active')
      and (
        last_billed_at is null or 
        last_billed_at <= now() - interval '1 minute'
      )
    for update skip locked
  loop
    -- Check participant liveness before billing: if either party is dead (>25s), skip and let reaper handle termination
    if v_call.caller_heartbeat_at < now() - interval '25 seconds' or v_call.host_heartbeat_at < now() - interval '25 seconds' then
      continue;
    end if;

    v_next_seq := v_call.billed_minute_count + 1;
    v_gross_coins := v_call.rate_per_minute::numeric(10,2);
    v_host_coins := round(v_gross_coins * v_host_share_pct, 2);
    v_platform_coins := v_gross_coins - v_host_coins; -- Exact invariant: gross = host + platform

    -- Lock and validate caller wallet
    select * into v_caller_wallet from public.wallets where user_id = v_call.caller_id for update;
    if not found then
      raise exception 'FATAL: Caller wallet not found for user %', v_call.caller_id;
    end if;

    -- Strict Full-Minute Requirement: If balance < rate, terminate immediately with ZERO partial charges for this minute
    if v_caller_wallet.coin_balance < v_gross_coins or v_caller_wallet.is_frozen then
      update public.calls
      set status = 'ended',
          ended_at = now(),
          end_reason = 'insufficient_coins'
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

    -- Lock and validate host wallet
    select * into v_host_wallet from public.wallets where user_id = v_call.host_id for update;
    if not found then
      raise exception 'FATAL: Host wallet not found for user %', v_call.host_id;
    end if;

    v_caller_idem_key := 'call:' || v_call.id::text || ':caller_min:' || v_next_seq::text;
    v_host_idem_key   := 'call:' || v_call.id::text || ':host_min:' || v_next_seq::text;
    v_plat_idem_key   := 'call:' || v_call.id::text || ':plat_min:' || v_next_seq::text;

    -- 1. Debit caller wallet
    update public.wallets
    set coin_balance = coin_balance - v_gross_coins
    where user_id = v_call.caller_id
    returning * into v_caller_wallet;

    insert into public.wallet_transactions (
      user_id, type, coin_amount, balance_after, call_id, idempotency_key, metadata
    ) values (
      v_call.caller_id, 'debit', -v_gross_coins, v_caller_wallet.coin_balance, v_call.id, v_caller_idem_key,
      jsonb_build_object('reason', 'call_minute', 'minute_sequence', v_next_seq, 'rate', v_gross_coins)
    ) on conflict (idempotency_key) do nothing;

    -- 2. Credit host wallet (70% share)
    update public.wallets
    set coin_balance = coin_balance + v_host_coins
    where user_id = v_call.host_id
    returning * into v_host_wallet;

    insert into public.wallet_transactions (
      user_id, type, coin_amount, balance_after, call_id, idempotency_key, metadata
    ) values (
      v_call.host_id, 'credit', v_host_coins, v_host_wallet.coin_balance, v_call.id, v_host_idem_key,
      jsonb_build_object('reason', 'host_call_earning', 'minute_sequence', v_next_seq, 'split_pct', v_host_share_pct)
    ) on conflict (idempotency_key) do nothing;

    -- 3. Record platform retained revenue (30%)
    insert into public.platform_revenue_ledger (
      call_id, minute_sequence, caller_id, host_id, gross_coins, host_coins, platform_coins, host_share_pct, idempotency_key
    ) values (
      v_call.id, v_next_seq, v_call.caller_id, v_call.host_id, v_gross_coins, v_host_coins, v_platform_coins, v_host_share_pct, v_plat_idem_key
    ) on conflict (idempotency_key) do nothing;

    -- 4. Advance call billing record
    update public.calls
    set status = 'active',
        billed_minute_count = v_next_seq,
        total_coins_deducted = total_coins_deducted + v_gross_coins,
        host_coins_earned = host_coins_earned + v_host_coins,
        platform_coins_earned = platform_coins_earned + v_platform_coins,
        last_billed_at = now()
    where id = v_call.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- 6. Server-Authoritative Call Termination & Final Reconciliation
create or replace function public.end_friendoo_call(
  p_call_id uuid,
  p_actor_id uuid default null,
  p_reason text default 'user_hangup'
)
returns public.calls
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user uuid;
  v_call public.calls;
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
  v_host_share_pct numeric(4,2) := 0.70;
  v_final_reason text;
  v_caller_idem_key text;
  v_host_idem_key text;
  v_plat_idem_key text;
  v_reconciled_gross numeric(10,2) := 0;
  v_reconciled_host numeric(10,2) := 0;
  v_reconciled_plat numeric(10,2) := 0;
begin
  -- Derive actor from auth context if called from client
  v_auth_user := auth.uid();
  if v_auth_user is not null then
    p_actor_id := v_auth_user;
  end if;

  select * into v_call from public.calls where id = p_call_id for update;

  if not found then
    raise exception 'Call not found';
  end if;

  if p_actor_id is not null and p_actor_id not in (v_call.caller_id, v_call.host_id) then
    raise exception 'FORBIDDEN: Not a call participant';
  end if;

  -- Idempotent check: if already ended, return existing call state
  if v_call.status in ('ended', 'missed', 'rejected') then
    return v_call;
  end if;

  -- Call was in ringing state (never accepted)
  if v_call.started_at is null then
    update public.calls
    set status = case when p_reason in ('rejected', 'declined') then 'rejected'::public.call_status else 'missed'::public.call_status end,
        ended_at = now(),
        end_reason = left(p_reason, 100)
    where id = p_call_id
    returning * into v_call;

    update public.user_presence
    set state = 'online', last_seen_at = now()
    where user_id in (v_call.caller_id, v_call.host_id);

    return v_call;
  end if;

  -- Asymmetric Liveness Effective Duration Computation:
  -- The billable call duration is strictly bounded by the earliest disconnection time
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

  -- 5-Second Grace Period Enforcement in PostgreSQL & Exact Completed-Minute Billing
  if v_duration_sec <= 5 then
    v_total_minutes := 0;
    v_final_reason := 'grace_period';
  else
    v_total_minutes := floor(v_duration_sec / 60.0)::integer;
    v_final_reason := p_reason;
  end if;

  v_unbilled_minutes := v_total_minutes - v_call.billed_minute_count;

  -- Final Minute Reconciliation: strictly full minutes, atomic & idempotent
  if v_unbilled_minutes > 0 then
    v_gross_coins := v_call.rate_per_minute::numeric(10,2);
    v_host_coins := round(v_gross_coins * v_host_share_pct, 2);
    v_platform_coins := v_gross_coins - v_host_coins;

    for v_i in 1..v_unbilled_minutes loop
      v_seq := v_call.billed_minute_count + v_i;

      select * into v_caller_wallet from public.wallets where user_id = v_call.caller_id for update;
      select * into v_host_wallet from public.wallets where user_id = v_call.host_id for update;

      if not found or v_caller_wallet is null or v_host_wallet is null then
        raise exception 'FATAL: Participant wallet not found during reconciliation';
      end if;

      -- If caller has insufficient balance for a full minute, do NOT partial bill; break and stop
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
        jsonb_build_object('reason', 'host_final_reconciliation', 'minute_sequence', v_seq)
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
      billed_minute_count = v_call.billed_minute_count + (v_reconciled_gross / v_call.rate_per_minute)::integer,
      total_coins_deducted = total_coins_deducted + v_reconciled_gross,
      host_coins_earned = host_coins_earned + v_reconciled_host,
      platform_coins_earned = platform_coins_earned + v_reconciled_plat
  where id = p_call_id
  returning * into v_call;

  insert into public.call_events (call_id, actor_id, event_type, payload)
  values (p_call_id, p_actor_id, 'call_ended', jsonb_build_object(
    'reason', v_final_reason,
    'duration_seconds', v_duration_sec,
    'billed_minutes', v_call.billed_minute_count,
    'coins_deducted', v_call.total_coins_deducted,
    'host_coins_earned', v_call.host_coins_earned
  ));

  update public.user_presence
  set state = 'online', last_seen_at = now()
  where user_id in (v_call.caller_id, v_call.host_id);

  return v_call;
end;
$$;

-- 7. Asymmetric Zombie Call Reaper Function
create or replace function public.reap_stale_friendoo_calls()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_call record;
  v_reaped_count integer := 0;
begin
  for v_call in
    select id, caller_id from public.calls
    where status in ('accepted', 'active')
      and (
        caller_heartbeat_at < now() - interval '25 seconds' or
        host_heartbeat_at < now() - interval '25 seconds'
      )
    for update skip locked
  loop
    perform public.end_friendoo_call(v_call.id, null, 'heartbeat_timeout');
    v_reaped_count := v_reaped_count + 1;
  end loop;

  return v_reaped_count;
end;
$$;

-- 8. Execution Security & Grant Permissions
revoke all on function public.ping_friendoo_call_heartbeat(uuid) from public, anon;
grant execute on function public.ping_friendoo_call_heartbeat(uuid) to authenticated, service_role;

revoke all on function public.end_friendoo_call(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.end_friendoo_call(uuid, uuid, text) to service_role;

revoke all on function public.bill_active_friendoo_calls() from public, anon, authenticated;
grant execute on function public.bill_active_friendoo_calls() to service_role;

revoke all on function public.reap_stale_friendoo_calls() from public, anon, authenticated;
grant execute on function public.reap_stale_friendoo_calls() to service_role;
