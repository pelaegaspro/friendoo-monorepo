-- Migration: Add city column to profiles table and support city in profile creation & update RPCs

alter table public.profiles
  add column if not exists city text;

-- 1. Update update_own_profile to allow authenticated users to update their city
create or replace function public.update_own_profile(
  p_display_name text default null,
  p_about text default null,
  p_preferred_languages text[] default null,
  p_city text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_about text;
  v_city text;
  v_languages text[];
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if p_display_name is null and p_about is null and p_preferred_languages is null and p_city is null then
    raise exception 'NO_PROFILE_CHANGES_REQUESTED';
  end if;

  if p_display_name is not null then
    v_name := trim(p_display_name);
    if char_length(v_name) not between 1 and 50 then
      raise exception 'INVALID_DISPLAY_NAME';
    end if;
  end if;

  if p_about is not null then
    v_about := trim(p_about);
    if char_length(v_about) > 150 then
      raise exception 'INVALID_ABOUT';
    end if;
  end if;

  if p_city is not null then
    v_city := trim(p_city);
    if char_length(v_city) > 60 then
      raise exception 'INVALID_CITY';
    end if;
  end if;

  if p_preferred_languages is not null then
    if cardinality(p_preferred_languages) not between 1 and 6
      or exists (
        select 1
        from unnest(p_preferred_languages) as language
        where language is null
           or char_length(trim(language)) not between 1 and 40
      ) then
      raise exception 'INVALID_PREFERRED_LANGUAGES';
    end if;

    select array_agg(language order by language)
      into v_languages
      from (
        select distinct trim(language) as language
        from unnest(p_preferred_languages) as language
      ) normalized;
  end if;

  update public.profiles
     set display_name = coalesce(v_name, display_name),
         about = coalesce(v_about, about),
         city = coalesce(v_city, city),
         preferred_languages = coalesce(v_languages, preferred_languages),
         updated_at = now()
   where id = auth.uid()
  returning * into v_profile;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  return v_profile;
end;
$$;

revoke all on function public.update_own_profile(text, text, text[], text) from public, anon;
grant execute on function public.update_own_profile(text, text, text[], text) to authenticated, service_role;

-- 2. Update complete_initial_profile to record city upon initial profile completion
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
         avatar_selected_at = now(),
         display_name = normalized_name,
         city = coalesce(normalized_city, city),
         updated_at = now()
   where id = auth.uid()
     and avatar_selected_at is null
  returning profiles.avatar_path, profiles.avatar_selected_at, profiles.display_name, profiles.city;

  if not found then
    raise exception 'Avatar selection already locked';
  end if;
end;
$$;

revoke all on function public.complete_initial_profile(text, text, text) from public, anon;
grant execute on function public.complete_initial_profile(text, text, text) to authenticated, service_role;

