-- Migration: 20260824_000018_minimum_15_coins_and_host_silence_strikes.sql
-- Enforces:
-- 1. Minimum 15 coins wallet balance required to initiate any call.
-- 2. Host silence/muting penalty: 100% direct coin refund to caller's wallet (no amount diverted to admin vault).
-- 3. Automatic host suspension on Strike 3.

alter table public.hosts
  add column if not exists silence_warning_count integer not null default 0,
  add column if not exists is_suspended boolean not null default false;

-- Update initiate_friendoo_call with 15 coins minimum requirement
create or replace function public.initiate_friendoo_call(
  p_caller_id uuid,
  p_host_id uuid,
  p_call_type text,
  p_rtc_channel text
)
returns public.calls
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.wallets;
  v_rate integer;
  v_call public.calls;
  v_host_record public.hosts;
begin
  if auth.uid() <> p_caller_id then
    raise exception 'Unauthorized';
  end if;

  select * into v_host_record
  from public.hosts
  where id = p_host_id;

  if v_host_record.id is null or v_host_record.is_available = false or v_host_record.is_suspended = true then
    raise exception 'Host is currently unavailable or suspended';
  end if;

  select * into v_wallet
  from public.wallets
  where user_id = p_caller_id
  for update;

  if v_wallet.user_id is null or v_wallet.is_frozen then
    raise exception 'Wallet is unavailable';
  end if;

  -- MNC Rule: Minimum 15 coins required to start a call
  if v_wallet.coin_balance < 15 then
    raise exception 'Minimum 15 coins required to start a call. Please recharge your wallet.';
  end if;

  select case
    when p_call_type = 'audio' then rate_per_audio_minute
    else rate_per_video_minute
  end into v_rate
  from public.hosts
  where id = p_host_id and is_available = true and is_suspended = false
  for update;

  if v_rate is null then
    raise exception 'Host is unavailable';
  end if;

  insert into public.calls (
    caller_id, host_id, call_type, status, rtc_channel, rate_per_minute, expires_at
  ) values (
    p_caller_id, p_host_id, p_call_type, 'ringing', p_rtc_channel, v_rate, now() + interval '45 seconds'
  ) returning * into v_call;

  insert into public.call_events (call_id, actor_id, event_type)
  values (v_call.id, p_caller_id, 'call_ringing');

  update public.user_presence
  set state = 'busy', last_seen_at = now()
  where user_id = p_caller_id;

  return v_call;
end;
$$;

-- RPC to report host silence/time-wasting, issue 100% direct refund to user (no admin cut), and strike host
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
  v_new_strike_count integer;
  v_is_suspended boolean := false;
  v_refund_coins integer := 0;
begin
  select * into v_call from public.calls where id = p_call_id;
  if not found then
    raise exception 'Call not found';
  end if;

  if v_call.caller_id <> p_reporter_id and v_call.host_id <> p_reporter_id then
    raise exception 'Unauthorized to report this call';
  end if;

  select * into v_host from public.hosts where id = v_call.host_id for update;
  if not found then
    raise exception 'Host not found';
  end if;

  -- 1. Direct 100% Coin Refund to Caller (No admin vault diversion)
  v_refund_coins := coalesce(v_call.total_coins_deducted, 0);
  if v_refund_coins > 0 then
    update public.wallets
    set coin_balance = coin_balance + v_refund_coins,
        updated_at = now()
    where user_id = v_call.caller_id;

    insert into public.coin_transactions (
      wallet_id, type, coin_amount, balance_after, metadata
    )
    select id, 'credit', v_refund_coins, coin_balance,
      jsonb_build_object(
        'description', '100% Full Refund: Host silent/muted during call',
        'call_id', v_call.id
      )
    from public.wallets where user_id = v_call.caller_id;
  end if;

  -- 2. Increment host silence strike count
  v_new_strike_count := v_host.silence_warning_count + 1;
  if v_new_strike_count >= 3 then
    v_is_suspended := true;
  end if;

  update public.hosts
  set silence_warning_count = v_new_strike_count,
      is_suspended = v_is_suspended,
      is_available = case when v_is_suspended then false else is_available end
  where id = v_call.host_id;

  -- 3. Log call event
  insert into public.call_events (call_id, actor_id, event_type, payload)
  values (v_call.id, p_reporter_id, 'host_silence_strike_issued', jsonb_build_object(
    'strike_number', v_new_strike_count,
    'is_suspended', v_is_suspended,
    'refund_coins_to_user', v_refund_coins,
    'details', p_details
  ));

  -- 4. Insert real-time push notification for the host
  insert into public.push_notifications (
    user_id, title, body, notification_type, action_route
  ) values (
    v_call.host_id,
    case when v_is_suspended then '🚨 Host Account Suspended' else '⚠️ Inactivity Strike [' || v_new_strike_count || '/3]' end,
    case when v_is_suspended
      then 'Your host account has been suspended due to 3 silence violations. The caller was refunded in full.'
      else 'You were reported for being silent/muted during a paid call. The user was refunded. Strike ' || v_new_strike_count || '/3.'
    end,
    'host_warning',
    '/earnings'
  );

  return jsonb_build_object(
    'success', true,
    'strike_count', v_new_strike_count,
    'is_suspended', v_is_suspended,
    'refunded_coins', v_refund_coins
  );
end;
$$;
