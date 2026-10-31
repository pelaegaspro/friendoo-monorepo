-- Migration: 20261101_000041_allow_profile_avatar_update_and_robust_onboarding.sql
-- Ensure complete_initial_profile idempotently persists display_name, city, and avatar_path
-- without throwing 'Avatar selection already locked' on retries or profile updates.

create or replace function public.complete_initial_profile(
  p_avatar_path text,
  p_display_name text,
  p_city text default null
)
returns table (
  avatar_path text,
  avatar_selected_at timestamptz,
  display_name text,
  city text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  profile_role text;
  normalized_name text := trim(coalesce(p_display_name, ''));
  normalized_city text := nullif(trim(coalesce(p_city, '')), '');
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if normalized_name = '' then
    raise exception 'A display name is required';
  end if;

  if p_avatar_path not in (
    'user_01', 'user_02', 'user_03', 'user_04', 'user_05',
    'user_06', 'user_07', 'user_08', 'user_09', 'user_10',
    'host_01', 'host_02', 'host_03', 'host_04', 'host_05',
    'host_06', 'host_07', 'host_08', 'host_09', 'host_10'
  ) then
    raise exception 'Invalid avatar selection';
  end if;

  select role::text
    into profile_role
    from public.profiles
   where id = auth.uid()
   for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if (profile_role = 'user' and p_avatar_path not like 'user_%')
      or (profile_role = 'host' and p_avatar_path not like 'host_%') then
    raise exception 'Avatar preset does not match the account role';
  end if;

  return query
  update public.profiles
     set avatar_path = p_avatar_path,
         avatar_selected_at = coalesce(profiles.avatar_selected_at, now()),
         display_name = normalized_name,
         city = coalesce(normalized_city, profiles.city),
         updated_at = now()
   where id = auth.uid()
  returning profiles.avatar_path, profiles.avatar_selected_at, profiles.display_name, profiles.city;

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;

revoke all on function public.complete_initial_profile(text, text, text) from public, anon;
grant execute on function public.complete_initial_profile(text, text, text) to authenticated, service_role;

