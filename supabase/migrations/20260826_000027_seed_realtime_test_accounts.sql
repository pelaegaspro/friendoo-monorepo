-- DEVELOPMENT/QA ONLY. Do not apply this migration to production.
-- Creates deterministic accounts for two-device realtime call testing.

create extension if not exists pgcrypto;

do $$
declare
  v_user_id uuid;
  v_host_id uuid;
  v_test_password text := 'FriendooTest!123';
begin
  select id into v_user_id from auth.users where phone = '+918870947891' limit 1;
  if v_user_id is null then
    v_user_id := '00000000-0000-4000-8000-000000000101';
  end if;
  select id into v_host_id from auth.users where phone = '+917604991136' limit 1;
  if v_host_id is null then
    v_host_id := '00000000-0000-4000-8000-000000000102';
  end if;

  insert into auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    phone, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values
    (v_user_id, 'authenticated', 'authenticated', 'realtime-user@friendoo.test',
     crypt(v_test_password, gen_salt('bf')), now(), '+918870947891', now(),
     '{"provider":"phone","providers":["phone"]}'::jsonb,
     '{"display_name":"Realtime Test User"}'::jsonb, now(), now()),
    (v_host_id, 'authenticated', 'authenticated', 'realtime-host@friendoo.test',
     crypt(v_test_password, gen_salt('bf')), now(), '+917604991136', now(),
     '{"provider":"phone","providers":["phone"]}'::jsonb,
     '{"display_name":"Realtime Test Host"}'::jsonb, now(), now())
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    phone = excluded.phone,
    phone_confirmed_at = excluded.phone_confirmed_at,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  insert into public.profiles (id, phone, display_name, role)
  values
    (v_user_id, '+918870947891', 'Realtime Test User', 'user'),
    (v_host_id, '+917604991136', 'Realtime Test Host', 'host')
  on conflict (id) do update set
    phone = excluded.phone,
    display_name = excluded.display_name,
    role = excluded.role,
    updated_at = now();

  insert into public.wallets (user_id, coin_balance, is_frozen)
  values (v_user_id, 1000, false), (v_host_id, 0, false)
  on conflict (user_id) do update set
    coin_balance = excluded.coin_balance,
    is_frozen = false,
    updated_at = now();

  insert into public.user_presence (user_id, state, last_seen_at)
  values (v_user_id, 'online', now()), (v_host_id, 'online', now())
  on conflict (user_id) do update set state = excluded.state, last_seen_at = now();

  insert into public.hosts (
    id, bio, rate_per_audio_minute, rate_per_video_minute,
    is_available, rating, total_ratings
  ) values (
    v_host_id, 'Realtime test host', 5, 10, true, 5.00, 1
  ) on conflict (id) do update set
    is_available = true,
    rate_per_audio_minute = 5,
    rate_per_video_minute = 10,
    updated_at = now();
end $$;
