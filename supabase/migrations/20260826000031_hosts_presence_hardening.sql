-- Migration: 20260826000031_hosts_presence_hardening.sql
-- Consolidated forward migration packaging:
-- 1. Adds gender (text) and languages (text[]) to public.hosts (from 000028).
-- 2. Enforces strict row-level security on public.hosts and public.user_presence (from 000029).
-- 3. Attaches search_path-hardened trigger guarding server-authoritative host columns (id, rates, rating, total_ratings, is_star) (from 000029 & 000030).
-- 4. Attaches search_path-hardened trigger guarding user_presence user_id and validating last_seen_at <= now() + 1 minute (from 000029 & 000030).

-- ============================================================================
-- 1. Host Metadata Columns
-- ============================================================================
alter table public.hosts
  add column if not exists gender text,
  add column if not exists languages text[];

-- ============================================================================
-- 2. Enable Row Level Security
-- ============================================================================
alter table public.hosts enable row level security;
alter table public.user_presence enable row level security;

-- ============================================================================
-- 3. Scoped RLS Policies for public.hosts
-- ============================================================================
drop policy if exists "authenticated users can view hosts" on public.hosts;
drop policy if exists "hosts_select_policy" on public.hosts;
drop policy if exists "hosts_update_own_profile" on public.hosts;
drop policy if exists "hosts_insert_policy" on public.hosts;
drop policy if exists "hosts_delete_policy" on public.hosts;

create policy "authenticated users can view hosts"
  on public.hosts
  for select
  to authenticated
  using (true);

create policy "hosts_update_own_profile"
  on public.hosts
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================================
-- 4. Scoped RLS Policies for public.user_presence
-- ============================================================================
drop policy if exists "authenticated users can view presence" on public.user_presence;
drop policy if exists "users can view presence" on public.user_presence;
drop policy if exists "users can insert their own presence" on public.user_presence;
drop policy if exists "users can update their own presence" on public.user_presence;
drop policy if exists "presence_select_policy" on public.user_presence;
drop policy if exists "presence_insert_policy" on public.user_presence;
drop policy if exists "presence_update_policy" on public.user_presence;

create policy "authenticated users can view presence"
  on public.user_presence
  for select
  to authenticated
  using (true);

create policy "users can insert their own presence"
  on public.user_presence
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own presence"
  on public.user_presence
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- 5. Hardened Column-Guard Trigger Functions
-- ============================================================================
create or replace function public.guard_host_protected_columns()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
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

create or replace function public.guard_user_presence_columns()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.role() = 'authenticated' and current_user = 'authenticated' then
    -- Prevent user_id alteration
    if new.user_id <> old.user_id then
      raise exception 'Cannot change user_presence identifier';
    end if;

    -- Prevent future timestamp spoofing (allows up to 1 minute of forward clock drift)
    if new.last_seen_at > now() + interval '1 minute' then
      raise exception 'last_seen_at cannot be in the future';
    end if;
  end if;

  return new;
end;
$$;

-- ============================================================================
-- 6. Attach Triggers
-- ============================================================================
drop trigger if exists tr_guard_host_protected_columns on public.hosts;
create trigger tr_guard_host_protected_columns
  before update on public.hosts
  for each row
  execute function public.guard_host_protected_columns();

drop trigger if exists tr_guard_user_presence_columns on public.user_presence;
create trigger tr_guard_user_presence_columns
  before update on public.user_presence
  for each row
  execute function public.guard_user_presence_columns();

