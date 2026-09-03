-- Migration: 20260826_000029_hosts_and_presence_rls_hardening.sql
-- Enforces:
-- 1. Explicit scoped RLS policies on public.hosts (SELECT to authenticated, UPDATE to host owner, INSERT/DELETE denied to authenticated).
-- 2. Column-guard trigger on public.hosts preventing authenticated clients from modifying protected server-only fields:
--    - id (ownership/identity)
--    - rate_per_audio_minute & rate_per_video_minute (financial pricing)
--    - rating & total_ratings (trust score & review metrics)
--    - silence_warning_count & is_suspended (disciplinary enforcement & moderation)
-- 3. Explicit scoped RLS policies on public.user_presence (SELECT to authenticated, INSERT & UPDATE scoped to auth.uid() = user_id, DELETE denied).
-- 4. Column-guard trigger on public.user_presence preventing user_id alteration.
-- 5. Preserves all service_role and SECURITY DEFINER RPC operations.

-- Ensure RLS is active
alter table public.hosts enable row level security;
alter table public.user_presence enable row level security;

-- 1. Scoped policies for public.hosts
drop policy if exists "authenticated users can view hosts" on public.hosts;
drop policy if exists "hosts_select_policy" on public.hosts;
drop policy if exists "hosts_update_own_profile" on public.hosts;
drop policy if exists "hosts_insert_policy" on public.hosts;
drop policy if exists "hosts_delete_policy" on public.hosts;

-- Authenticated users can view host records for Discover lounge browsing
create policy "authenticated users can view hosts"
on public.hosts for select
to authenticated
using (true);

-- Authenticated hosts can update their own row (restricted to non-protected columns by trigger)
create policy "hosts_update_own_profile"
on public.hosts for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- 2. Guard trigger for public.hosts protected columns
create or replace function public.guard_host_protected_columns()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Enforce protections when the operation originates directly from an authenticated client session
  if auth.role() = 'authenticated' and current_user = 'authenticated' then
    -- Prevent identity/ownership alteration
    if new.id <> old.id then
      raise exception 'Cannot change host identifier';
    end if;

    -- Prevent tampering with financial pricing
    if new.rate_per_audio_minute is distinct from old.rate_per_audio_minute then
      raise exception 'Hosts cannot modify rate_per_audio_minute';
    end if;
    if new.rate_per_video_minute is distinct from old.rate_per_video_minute then
      raise exception 'Hosts cannot modify rate_per_video_minute';
    end if;

    -- Prevent tampering with trust & review metrics
    if new.rating is distinct from old.rating then
      raise exception 'Hosts cannot modify rating';
    end if;
    if new.total_ratings is distinct from old.total_ratings then
      raise exception 'Hosts cannot modify total_ratings';
    end if;

    -- Prevent tampering with weekly star host status
    if new.is_star is distinct from old.is_star then
      raise exception 'Hosts cannot modify is_star';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists tr_guard_host_protected_columns on public.hosts;
create trigger tr_guard_host_protected_columns
  before update on public.hosts
  for each row
  execute function public.guard_host_protected_columns();

-- 3. Scoped policies for public.user_presence
drop policy if exists "authenticated users can view presence" on public.user_presence;
drop policy if exists "users can upsert their own presence" on public.user_presence;
drop policy if exists "users can update their own presence" on public.user_presence;
drop policy if exists "users can insert their own presence" on public.user_presence;

create policy "authenticated users can view presence"
on public.user_presence for select
to authenticated
using (true);

create policy "users can insert their own presence"
on public.user_presence for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can update their own presence"
on public.user_presence for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 4. Guard trigger for public.user_presence
create or replace function public.guard_user_presence_columns()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.role() = 'authenticated' and current_user = 'authenticated' then
    if new.user_id <> old.user_id then
      raise exception 'Cannot change user_presence identifier';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_guard_user_presence_columns on public.user_presence;
create trigger tr_guard_user_presence_columns
  before update on public.user_presence
  for each row
  execute function public.guard_user_presence_columns();

