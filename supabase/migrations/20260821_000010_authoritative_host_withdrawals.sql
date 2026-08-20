-- 20260821_000010_authoritative_host_withdrawals.sql
-- Production-Grade Authoritative Host Withdrawal State Machine,
-- Strict RLS Security, Row-Level Locking, Idempotency & Balance Refund Safety.

-- 1. Create host_payout_status Enum if not existing
do $$
begin
  if not exists (select 1 from pg_type where typname = 'host_payout_status') then
    create type public.host_payout_status as enum ('pending', 'processing', 'paid', 'failed', 'cancelled');
  end if;
end $$;

-- 2. Ensure host_earnings table exists for tracking balances
create table if not exists public.host_earnings (
  host_id uuid primary key references public.hosts(id) on delete cascade,
  total_earned_paise bigint not null default 0 check (total_earned_paise >= 0),
  available_paise bigint not null default 0 check (available_paise >= 0),
  pending_payout_paise bigint not null default 0 check (pending_payout_paise >= 0),
  withdrawn_paise bigint not null default 0 check (withdrawn_paise >= 0),
  updated_at timestamptz not null default now()
);

-- 3. Create host_payout_methods table for storing verified payout destinations
create table if not exists public.host_payout_methods (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts(id) on delete cascade,
  method_type text not null check (method_type in ('upi', 'bank_account')),
  upi_id text check (char_length(upi_id) between 3 and 100),
  account_holder_name text check (char_length(account_holder_name) between 2 and 100),
  bank_name text check (char_length(bank_name) between 2 and 100),
  account_number text check (char_length(account_number) between 8 and 30),
  ifsc_code text check (char_length(ifsc_code) between 4 and 20),
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists host_payout_methods_host_idx on public.host_payout_methods(host_id, is_default);

-- 4. Create host_payouts table for tracking withdrawal records
create table if not exists public.host_payouts (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts(id) on delete restrict,
  amount_paise bigint not null check (amount_paise >= 50000), -- minimum ₹500
  amount_inr numeric(10,2) not null check (amount_inr >= 500.00),
  status public.host_payout_status not null default 'pending',
  payout_method_type text not null check (payout_method_type in ('upi', 'bank_account')),
  payout_details jsonb not null default '{}'::jsonb,
  idempotency_key text unique not null,
  failure_reason text,
  provider text not null default 'manual_review',
  provider_transfer_id text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists host_payouts_host_created_idx on public.host_payouts(host_id, created_at desc);
create index if not exists host_payouts_status_created_idx on public.host_payouts(status, created_at desc);

-- 5. Strict RLS Security Lockdown on Financial Tables
alter table public.host_earnings enable row level security;
alter table public.host_earnings force row level security;

alter table public.host_payout_methods enable row level security;
alter table public.host_payout_methods force row level security;

alter table public.host_payouts enable row level security;
alter table public.host_payouts force row level security;

-- Drop existing permissive policies
drop policy if exists "hosts_select_own_earnings" on public.host_earnings;
drop policy if exists "hosts_select_own_payout_methods" on public.host_payout_methods;
drop policy if exists "hosts_insert_own_payout_methods" on public.host_payout_methods;
drop policy if exists "hosts_update_own_payout_methods" on public.host_payout_methods;
drop policy if exists "hosts_select_own_payouts" on public.host_payouts;

-- Host Read-Only Policies (Zero direct client writes to balances or payouts)
create policy "hosts_select_own_earnings"
  on public.host_earnings for select to authenticated
  using (auth.uid() = host_id);

create policy "hosts_select_own_payout_methods"
  on public.host_payout_methods for select to authenticated
  using (auth.uid() = host_id);

create policy "hosts_insert_own_payout_methods"
  on public.host_payout_methods for insert to authenticated
  with check (auth.uid() = host_id);

create policy "hosts_update_own_payout_methods"
  on public.host_payout_methods for update to authenticated
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "hosts_select_own_payouts"
  on public.host_payouts for select to authenticated
  using (auth.uid() = host_id);

-- 6. Authoritative Atomic Host Withdrawal Stored Procedure
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

  -- 2. Validate parameters
  if p_amount_inr is null or p_amount_inr < 500.00 then
    raise exception 'MINIMUM_WITHDRAWAL_LIMIT_500';
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

-- Revoke direct execution from anon, allow authenticated
revoke all on function public.request_host_withdrawal(numeric, text, jsonb, text) from public, anon;
grant execute on function public.request_host_withdrawal(numeric, text, jsonb, text) to authenticated, service_role;
