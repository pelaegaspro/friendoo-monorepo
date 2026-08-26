-- Security and integrity hardening for the Supabase call and wallet paths.

-- Calls are readable only by participants. All state changes go through the
-- authenticated Edge Functions / server-side RPCs.
drop policy if exists "calls_select_policy" on public.calls;
drop policy if exists "calls_insert_policy" on public.calls;
drop policy if exists "calls_update_policy" on public.calls;
drop policy if exists "participants can view their calls" on public.calls;

create policy "participants can view their calls"
  on public.calls for select to authenticated
  using (auth.uid() = caller_id or auth.uid() = host_id);

revoke all on table public.calls from anon, authenticated;
grant select on table public.calls to authenticated;

-- Keep the legacy test helper safe if it is still present. It cannot be used
-- to impersonate a caller or bypass host availability/rate/balance checks.
create or replace function public.instant_start_call(
  p_caller_id uuid,
  p_host_id uuid,
  p_call_type text default 'audio'
)
returns public.calls
language plpgsql
security definer
set search_path = public
as $$
declare
  v_call public.calls;
  v_rate integer;
  v_balance integer;
  v_channel text := 'friendoo_' || gen_random_uuid()::text;
begin
  if auth.uid() is null or auth.uid() <> p_caller_id then
    raise exception 'Unauthorized caller';
  end if;
  if p_caller_id = p_host_id then
    raise exception 'A user cannot call themselves';
  end if;
  if p_call_type not in ('audio', 'video') then
    raise exception 'Invalid call type';
  end if;

  select coin_balance into v_balance
  from public.wallets
  where user_id = p_caller_id and not is_frozen
  for update;
  if not found then
    raise exception 'Wallet is unavailable';
  end if;

  select case when p_call_type = 'audio' then rate_per_audio_minute
              else rate_per_video_minute end
    into v_rate
  from public.hosts
  where id = p_host_id and is_available = true;
  if v_rate is null then
    raise exception 'Host is unavailable';
  end if;
  if v_balance < v_rate then
    raise exception 'Insufficient coin balance';
  end if;

  insert into public.calls (caller_id, host_id, call_type, status, rtc_channel, rate_per_minute)
  values (p_caller_id, p_host_id, p_call_type::public.call_type, 'ringing', v_channel, v_rate)
  returning * into v_call;
  insert into public.call_events (call_id, actor_id, event_type)
  values (v_call.id, p_caller_id, 'call_ringing');
  return v_call;
end;
$$;

revoke all on function public.instant_start_call(uuid, uuid, text) from public, anon;
grant execute on function public.instant_start_call(uuid, uuid, text) to authenticated;

-- The original function referenced the nonexistent coin_transactions table.
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
  v_wallet public.wallets;
begin
  if auth.uid() is null or auth.uid() <> p_reporter_id then
    raise exception 'Unauthorized reporter';
  end if;
  select * into v_call from public.calls where id = p_call_id for update;
  if not found or v_call.caller_id <> p_reporter_id then
    raise exception 'Unauthorized to report this call';
  end if;
  select * into v_host from public.hosts where id = v_call.host_id for update;
  if not found then raise exception 'Host not found'; end if;

  v_refund_coins := coalesce(v_call.total_coins_deducted, 0);
  if v_refund_coins > 0 then
    update public.wallets
    set coin_balance = coin_balance + v_refund_coins, updated_at = now()
    where user_id = v_call.caller_id
    returning * into v_wallet;
    insert into public.wallet_transactions
      (user_id, type, coin_amount, balance_after, call_id, idempotency_key, metadata)
    values
      (v_call.caller_id, 'refund', v_refund_coins, v_wallet.coin_balance, v_call.id,
       'call:' || v_call.id::text || ':host-silence-refund',
       jsonb_build_object('description', 'Host silence refund', 'details', p_details))
    on conflict (idempotency_key) do nothing;
  end if;

  v_new_strike_count := coalesce(v_host.silence_warning_count, 0) + 1;
  v_is_suspended := v_new_strike_count >= 3;
  update public.hosts
  set silence_warning_count = v_new_strike_count,
      is_suspended = v_is_suspended,
      is_available = case when v_is_suspended then false else is_available end
  where id = v_call.host_id;
  insert into public.call_events (call_id, actor_id, event_type, payload)
  values (v_call.id, p_reporter_id, 'host_silence_strike_issued',
    jsonb_build_object('strike_number', v_new_strike_count,
      'is_suspended', v_is_suspended, 'refund_coins_to_user', v_refund_coins,
      'details', p_details));
  return jsonb_build_object('success', true, 'strike_count', v_new_strike_count,
    'is_suspended', v_is_suspended, 'refunded_coins', v_refund_coins);
end;
$$;

-- Client telemetry is an untrusted assertion and must not drive settlement.
-- Leave the function available to trusted server jobs only until provider-side
-- audio telemetry is implemented.
revoke all on function public.report_call_audio_telemetry(uuid, uuid, boolean, boolean, text)
  from public, anon, authenticated;
grant execute on function public.report_call_audio_telemetry(uuid, uuid, boolean, boolean, text)
  to service_role;

