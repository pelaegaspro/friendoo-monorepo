-- Migration: 20260826_000030_secure_trigger_search_path_and_presence_clock.sql
-- Enforces:
-- 1. Explicit pinned search_path ('public, auth, pg_temp') on SECURITY DEFINER trigger functions to prevent search_path hijacking:
--    - public.guard_host_protected_columns()
--    - public.guard_user_presence_columns()
-- 2. Database-level validation against future timestamp spoofing on public.user_presence (rejects last_seen_at > now() + interval '1 minute').

-- 1. Recreate guard_host_protected_columns with explicit search_path
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

-- 2. Recreate guard_user_presence_columns with explicit search_path and future timestamp check
create or replace function public.guard_user_presence_columns()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.role() = 'authenticated' and current_user = 'authenticated' then
    -- Prevent user_id identity alteration
    if new.user_id <> old.user_id then
      raise exception 'Cannot change user_presence identifier';
    end if;

    -- Prevent future timestamp manipulation (online ghosting attack)
    if new.last_seen_at > now() + interval '1 minute' then
      raise exception 'last_seen_at cannot be in the future';
    end if;
  end if;

  return new;
end;
$$;

