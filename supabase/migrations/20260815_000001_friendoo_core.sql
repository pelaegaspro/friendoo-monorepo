-- Friendoo core migration: Supabase replacement for Firebase Auth, Firestore,
-- Storage, Realtime-backed call state, and wallet metadata.
-- Edge Functions own all money movement, call state transitions, and RTC tokens.

create extension if not exists pgcrypto;

create type public.app_role as enum ('user', 'host', 'admin');
create type public.call_status as enum ('ringing', 'accepted', 'active', 'ended', 'missed', 'rejected');
create type public.call_type as enum ('audio', 'video');
create type public.wallet_transaction_type as enum ('credit', 'debit', 'refund', 'adjustment');
create type public.payment_status as enum ('pending', 'success', 'failed', 'disputed', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  display_name text not null default 'Friendoo user' check (char_length(display_name) between 1 and 80),
  avatar_path text,
  about text check (char_length(about) <= 500),
  role public.app_role not null default 'user',
  is_banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  coin_balance integer not null default 0 check (coin_balance >= 0),
  is_frozen boolean not null default false,
  frozen_reason text,
  updated_at timestamptz not null default now()
);

create table public.hosts (
  id uuid primary key references public.profiles(id) on delete cascade,
  bio text check (char_length(bio) <= 500),
  rate_per_audio_minute integer not null default 5 check (rate_per_audio_minute > 0),
  rate_per_video_minute integer not null default 10 check (rate_per_video_minute > 0),
  is_available boolean not null default false,
  rating numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
  total_ratings integer not null default 0 check (total_ratings >= 0),
  updated_at timestamptz not null default now()
);

create table public.user_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  state text not null check (state in ('online', 'offline', 'busy', 'in_call')),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  caller_id uuid not null references public.profiles(id),
  host_id uuid not null references public.hosts(id),
  call_type public.call_type not null default 'audio',
  status public.call_status not null default 'ringing',
  rtc_channel text not null unique,
  rate_per_minute integer not null check (rate_per_minute > 0),
  anonymous boolean not null default true,
  created_at timestamptz not null default now(),
  ringing_at timestamptz not null default now(),
  accepted_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  end_reason text,
  total_coins_deducted integer not null default 0 check (total_coins_deducted >= 0),
  last_billed_at timestamptz,
  constraint call_participants_must_differ check (caller_id <> host_id)
);

create index calls_caller_created_idx on public.calls(caller_id, created_at desc);
create index calls_host_status_idx on public.calls(host_id, status, created_at desc);
create index calls_active_billing_idx on public.calls(status, last_billed_at)
  where status in ('accepted', 'active');

create table public.call_events (
  id bigint generated always as identity primary key,
  call_id uuid not null references public.calls(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index call_events_call_created_idx on public.call_events(call_id, created_at);

create table public.coin_packages (
  id text primary key,
  coins integer not null check (coins > 0),
  amount_inr integer not null check (amount_inr > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  type public.wallet_transaction_type not null,
  coin_amount integer not null check (coin_amount <> 0),
  balance_after integer not null check (balance_after >= 0),
  call_id uuid references public.calls(id),
  payment_order_id uuid,
  idempotency_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index wallet_transactions_user_created_idx on public.wallet_transactions(user_id, created_at desc);

create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  package_id text not null references public.coin_packages(id),
  provider text not null default 'cashfree',
  provider_order_id text not null unique,
  status public.payment_status not null default 'pending',
  amount_inr integer not null check (amount_inr > 0),
  coins integer not null check (coins > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payment_orders_user_created_idx on public.payment_orders(user_id, created_at desc);

create table public.device_installations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('android', 'ios', 'web')),
  push_token text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, push_token)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  reported_user_id uuid not null references public.profiles(id),
  call_id uuid references public.calls(id),
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved')),
  check (reporter_id <> reported_user_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger wallets_set_updated_at before update on public.wallets
for each row execute function public.set_updated_at();
create trigger hosts_set_updated_at before update on public.hosts
for each row execute function public.set_updated_at();
create trigger user_presence_set_updated_at before update on public.user_presence
for each row execute function public.set_updated_at();
create trigger payment_orders_set_updated_at before update on public.payment_orders
for each row execute function public.set_updated_at();
create trigger device_installations_set_updated_at before update on public.device_installations
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, display_name)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'Friendoo user')
  );
  insert into public.wallets (user_id) values (new.id);
  insert into public.user_presence (user_id, state) values (new.id, 'offline');
  return new;
end;
$$;

create trigger auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.hosts enable row level security;
alter table public.user_presence enable row level security;
alter table public.calls enable row level security;
alter table public.call_events enable row level security;
alter table public.coin_packages enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.payment_orders enable row level security;
alter table public.device_installations enable row level security;
alter table public.reports enable row level security;

create policy "authenticated users can view profiles"
on public.profiles for select to authenticated using (true);

create policy "authenticated users can view hosts"
on public.hosts for select to authenticated using (true);

create policy "authenticated users can view presence"
on public.user_presence for select to authenticated using (true);
create policy "users can upsert their own presence"
on public.user_presence for insert to authenticated with check (auth.uid() = user_id);
create policy "users can update their own presence"
on public.user_presence for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "participants can view their calls"
on public.calls for select to authenticated using (auth.uid() = caller_id or auth.uid() = host_id);

create policy "participants can view call events"
on public.call_events for select to authenticated using (
  exists (
    select 1 from public.calls
    where calls.id = call_events.call_id
      and (calls.caller_id = auth.uid() or calls.host_id = auth.uid())
  )
);

create policy "authenticated users can view active coin packages"
on public.coin_packages for select to authenticated using (is_active = true);

create policy "users can view their wallet"
on public.wallets for select to authenticated using (auth.uid() = user_id);
create policy "users can view their wallet transactions"
on public.wallet_transactions for select to authenticated using (auth.uid() = user_id);
create policy "users can view their payment orders"
on public.payment_orders for select to authenticated using (auth.uid() = user_id);

create policy "users manage only their own device installations"
on public.device_installations for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can create reports"
on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
create policy "users can view their own reports"
on public.reports for select to authenticated using (auth.uid() = reporter_id);

insert into public.coin_packages (id, coins, amount_inr)
values
  ('starter_100', 100, 99),
  ('value_550', 550, 499),
  ('plus_1200', 1200, 999)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "public avatar access"
on storage.objects for select using (bucket_id = 'avatars');
create policy "users upload only their own avatar folder"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update only their own avatar folder"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete only their own avatar folder"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Required before clients can subscribe to call rows through Postgres Changes.
alter publication supabase_realtime add table public.calls;
