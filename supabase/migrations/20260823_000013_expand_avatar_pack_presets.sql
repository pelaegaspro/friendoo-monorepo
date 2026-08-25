-- Expand avatar presets to support the full 20-avatar role pack (10 user, 10 host)
-- while strictly enforcing one-time permanent avatar selection.

create or replace function public.select_initial_avatar(p_avatar_path text)
returns table (avatar_path text, avatar_selected_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  profile_role text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
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
         avatar_selected_at = now()
   where id = auth.uid()
     and avatar_selected_at is null
  returning profiles.avatar_path, profiles.avatar_selected_at;

  if not found then
    raise exception 'Avatar selection already locked';
  end if;
end;
$$;

create or replace function public.complete_initial_profile(
  p_avatar_path text,
  p_display_name text
)
returns table (
  avatar_path text,
  avatar_selected_at timestamptz,
  display_name text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  profile_role text;
  normalized_name text := trim(coalesce(p_display_name, ''));
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
         avatar_selected_at = now(),
         display_name = normalized_name
   where id = auth.uid()
     and avatar_selected_at is null
  returning profiles.avatar_path, profiles.avatar_selected_at, profiles.display_name;

  if not found then
    raise exception 'Avatar selection already locked';
  end if;
end;
$$;

revoke all on function public.select_initial_avatar(text) from public;
grant execute on function public.select_initial_avatar(text) to authenticated;

revoke all on function public.complete_initial_profile(text, text) from public;
grant execute on function public.complete_initial_profile(text, text) to authenticated;
