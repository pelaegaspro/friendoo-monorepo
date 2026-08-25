-- Friendoo Backend 1 Migration: Ensure UUID 00000000-0000-0000-0000-007604991136 and 00000000-0000-0000-0000-008870947891 exist in database

-- 1. Insert Host 7604991136 profile
insert into public.profiles (id, phone, role, display_name, is_host)
values ('00000000-0000-0000-0000-007604991136'::uuid, '+917604991136', 'host'::public.app_role, 'Testing Host', true)
on conflict (id) do update set
  role = 'host'::public.app_role,
  display_name = 'Testing Host',
  is_host = true,
  phone = '+917604991136';

-- 2. Insert Host record
insert into public.hosts (id, bio, rate_per_audio_minute, rate_per_video_minute, is_available, rating, total_ratings, gender, languages)
values (
  '00000000-0000-0000-0000-007604991136'::uuid,
  'Friendly listener & cheerful conversationalist on Friendoo.',
  5,
  10,
  true,
  5.00,
  1,
  'female',
  array['Tamil', 'Hindi', 'English']
)
on conflict (id) do update set
  is_available = true,
  gender = 'female',
  languages = array['Tamil', 'Hindi', 'English'];

-- 3. Insert Host Earnings
insert into public.host_earnings (host_id, total_earnings_inr)
values ('00000000-0000-0000-0000-007604991136'::uuid, 0)
on conflict (host_id) do nothing;

-- 4. Insert VIP Tester User 8870947891 profile
insert into public.profiles (id, phone, role, display_name, is_host)
values ('00000000-0000-0000-0000-008870947891'::uuid, '+918870947891', 'user'::public.app_role, 'VIP Tester', false)
on conflict (id) do update set
  role = 'user'::public.app_role,
  display_name = 'VIP Tester',
  is_host = false,
  phone = '+918870947891';

-- 5. Insert VIP Tester Wallet with 999999 coins
insert into public.wallets (user_id, coin_balance, is_frozen)
values ('00000000-0000-0000-0000-008870947891'::uuid, 999999, false)
on conflict (user_id) do update set
  coin_balance = 999999,
  is_frozen = false;
