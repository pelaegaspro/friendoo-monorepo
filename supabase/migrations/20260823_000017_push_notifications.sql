-- 20260823_000017_push_notifications.sql
-- Create push notifications table and enable real-time delivery

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  type text not null default 'general', -- 'offer', 'host_surge', 'recharge', 'call', 'general'
  target_audience text not null default 'all', -- 'all', 'users', 'hosts', 'user'
  user_id uuid references auth.users(id) on delete cascade,
  action_type text default 'none', -- 'recharge', 'open_lounge', 'link', 'none'
  action_url text,
  metadata jsonb default '{}'::jsonb,
  is_read boolean default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policy: Users can read notifications addressed to them, to all, or to their role
create policy "Users can read their targeted notifications"
  on public.notifications
  for select
  using (
    target_audience in ('all', 'users', 'hosts')
    or user_id = auth.uid()
    or auth.role() = 'service_role'
  );

-- Policy: Admin service role can insert and manage all notifications
create policy "Service role manages notifications"
  on public.notifications
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Enable real-time streaming for notifications
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- Seed a welcome notification
insert into public.notifications (title, body, type, target_audience, action_type)
values (
  'Welcome to Friendoo! 🎉',
  'Connect with verified friendly hosts in your preferred language anytime.',
  'general',
  'all',
  'none'
)
on conflict do nothing;
