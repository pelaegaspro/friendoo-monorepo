-- Connecto-style in-app call availability.
-- Hosts are callable only while their app actively refreshes presence.
-- No push notification is used and a closed/inactive app is treated as offline.

alter table public.calls
  add column expires_at timestamptz not null default (now() + interval '30 seconds');

create index calls_ringing_expiry_idx
  on public.calls(status, expires_at)
  where status = 'ringing';

create or replace function public.create_friendoo_call(
  p_caller_id uuid,
  p_host_id uuid,
  p_call_type public.call_type,
  p_rtc_channel text
)
returns public.calls
language plpgsql
security definer
set search_path = public
as $$
declare
  v_call public.calls;
  v_rate integer;
  v_wallet public.wallets;
  v_host_state text;
  v_host_last_seen timestamptz;
begin
  if p_caller_id = p_host_id then
    raise exception 'A user cannot call themselves';
  end if;

  select * into v_wallet
  from public.wallets
  where user_id = p_caller_id
  for update;

  if not found or v_wallet.is_frozen then
    raise exception 'Wallet is unavailable';
  end if;

  select state, last_seen_at
  into v_host_state, v_host_last_seen
  from public.user_presence
  where user_id = p_host_id
  for update;

  -- The Flutter host app writes a heartbeat every 20 seconds while active.
  -- A heartbeat older than 45 seconds means the app is closed or inactive.
  if v_host_state is distinct from 'online'
     or v_host_last_seen is null
     or v_host_last_seen < now() - interval '45 seconds' then
    raise exception 'Host is offline';
  end if;

  select case
    when p_call_type = 'audio' then rate_per_audio_minute
    else rate_per_video_minute
  end into v_rate
  from public.hosts
  where id = p_host_id and is_available = true
  for update;

  if v_rate is null then
    raise exception 'Host is unavailable';
  end if;

  if v_wallet.coin_balance < v_rate then
    raise exception 'Insufficient coin balance';
  end if;

  insert into public.calls (
    caller_id, host_id, call_type, status, rtc_channel, rate_per_minute, expires_at
  ) values (
    p_caller_id,
    p_host_id,
    p_call_type,
    'ringing',
    p_rtc_channel,
    v_rate,
    now() + interval '30 seconds'
  ) returning * into v_call;

  insert into public.call_events (call_id, actor_id, event_type)
  values (v_call.id, p_caller_id, 'call_ringing');

  update public.user_presence
  set state = 'busy', last_seen_at = now()
  where user_id = p_caller_id;

  return v_call;
end;
$$;

create or replace function public.accept_friendoo_call(
  p_call_id uuid,
  p_host_id uuid
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
  if v_call.host_id <> p_host_id then
    raise exception 'Only the host can accept this call';
  end if;
  if v_call.status <> 'ringing' then
    raise exception 'Call is not ringing';
  end if;
  if v_call.expires_at <= now() then
    update public.calls
    set status = 'missed', ended_at = now(), end_reason = 'ring_timeout'
    where id = p_call_id
    returning * into v_call;
    insert into public.call_events (call_id, actor_id, event_type)
    values (p_call_id, p_host_id, 'call_missed');
    raise exception 'Call has expired';
  end if;

  update public.calls
  set status = 'accepted', accepted_at = now(), started_at = now(), last_billed_at = now()
  where id = p_call_id
  returning * into v_call;

  insert into public.call_events (call_id, actor_id, event_type)
  values (p_call_id, p_host_id, 'call_accepted');

  update public.user_presence
  set state = 'in_call', last_seen_at = now()
  where user_id in (v_call.caller_id, v_call.host_id);

  return v_call;
end;
$$;

create or replace function public.expire_unanswered_friendoo_calls()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with expired as (
    update public.calls
    set status = 'missed', ended_at = now(), end_reason = 'ring_timeout'
    where status = 'ringing' and expires_at <= now()
    returning id, caller_id, host_id
  ), events as (
    insert into public.call_events (call_id, event_type)
    select id, 'call_missed' from expired
    returning call_id
  )
  select count(*) into v_count from expired;
  return v_count;
end;
$$;

revoke all on function public.expire_unanswered_friendoo_calls() from public, anon, authenticated;
