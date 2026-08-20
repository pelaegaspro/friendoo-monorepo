-- 20260820_000009_authoritative_billing_reaper.down.sql
-- Exact Rollback / Recovery Migration for 20260820_000009_authoritative_billing_reaper.sql

-- 1. Drop Platform Revenue Ledger and associated indexes/policies
drop table if exists public.platform_revenue_ledger cascade;

-- 2. Drop Heartbeat, Reaper, and Billing/End Functions before restoring
drop function if exists public.ping_friendoo_call_heartbeat(uuid);
drop function if exists public.reap_stale_friendoo_calls();
drop function if exists public.bill_active_friendoo_calls();
drop function if exists public.end_friendoo_call(uuid, uuid, text);

-- 3. Restore Previous Minimal Call Operations Functions
create or replace function public.bill_active_friendoo_calls()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_call public.calls;
  v_wallet public.wallets;
  v_count integer := 0;
begin
  for v_call in
    select * from public.calls
    where status in ('accepted', 'active')
      and last_billed_at <= now() - interval '1 minute'
    for update skip locked
  loop
    select * into v_wallet from public.wallets where user_id = v_call.caller_id for update;

    if v_wallet.coin_balance < v_call.rate_per_minute or v_wallet.is_frozen then
      update public.calls
      set status = 'ended', ended_at = now(), end_reason = 'insufficient_coins'
      where id = v_call.id;
      insert into public.call_events (call_id, event_type)
      values (v_call.id, 'call_ended_insufficient_coins');
      continue;
    end if;

    update public.wallets
    set coin_balance = coin_balance - v_call.rate_per_minute
    where user_id = v_call.caller_id
    returning * into v_wallet;

    insert into public.wallet_transactions (
      user_id, type, coin_amount, balance_after, call_id, idempotency_key, metadata
    ) values (
      v_call.caller_id,
      'debit',
      -v_call.rate_per_minute,
      v_wallet.coin_balance,
      v_call.id,
      v_call.id::text || ':' || floor(extract(epoch from now()) / 60)::text,
      jsonb_build_object('reason', 'call_minute')
    ) on conflict (idempotency_key) do nothing;

    update public.calls
    set status = 'active',
        last_billed_at = now(),
        total_coins_deducted = total_coins_deducted + v_call.rate_per_minute
    where id = v_call.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.end_friendoo_call(
  p_call_id uuid,
  p_actor_id uuid,
  p_reason text default 'user_hangup'
)
returns public.calls
language plpgsql
security definer
set search_path = public
as $$
declare
  v_call public.calls;
begin
  select * into v_call from public.calls where id = p_call_id for update;

  if not found then
    raise exception 'Call not found';
  end if;
  if p_actor_id not in (v_call.caller_id, v_call.host_id) then
    raise exception 'Not a call participant';
  end if;
  if v_call.status in ('ended', 'missed', 'rejected') then
    return v_call;
  end if;

  update public.calls
  set status = 'ended', ended_at = now(), end_reason = left(p_reason, 100)
  where id = p_call_id
  returning * into v_call;

  insert into public.call_events (call_id, actor_id, event_type, payload)
  values (p_call_id, p_actor_id, 'call_ended', jsonb_build_object('reason', p_reason));

  update public.user_presence
  set state = 'online', last_seen_at = now()
  where user_id in (v_call.caller_id, v_call.host_id);

  return v_call;
end;
$$;
