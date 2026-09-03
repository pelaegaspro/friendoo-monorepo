-- Server-authoritative host settings. Client apps may change only their own
-- availability and language list; pricing, star status, identity, and earnings
-- remain controlled by staff/server operations.

alter table public.hosts enable row level security;
alter table public.hosts force row level security;

revoke insert, update, delete on public.hosts from anon, authenticated;

create or replace function public.set_own_host_availability(
  p_is_available boolean
)
returns public.hosts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host public.hosts%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'host'::public.app_role
      and is_banned = false
  ) then
    raise exception 'HOST_ROLE_REQUIRED';
  end if;

  update public.hosts
     set is_available = p_is_available,
         last_seen_at = now(),
         updated_at = now()
   where id = auth.uid()
  returning * into v_host;

  if not found then
    raise exception 'HOST_RECORD_NOT_FOUND';
  end if;

  return v_host;
end;
$$;

create or replace function public.update_own_host_languages(
  p_languages text[]
)
returns public.hosts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_languages text[];
  v_host public.hosts%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'host'::public.app_role
      and is_banned = false
  ) then
    raise exception 'HOST_ROLE_REQUIRED';
  end if;

  if cardinality(p_languages) not between 1 and 6
    or exists (
      select 1
      from unnest(p_languages) as language
      where language is null
         or char_length(trim(language)) not between 1 and 40
    ) then
    raise exception 'INVALID_HOST_LANGUAGES';
  end if;

  select array_agg(language order by language)
    into v_languages
    from (
      select distinct trim(language) as language
      from unnest(p_languages) as language
    ) normalized;

  update public.hosts
     set languages = v_languages,
         updated_at = now()
   where id = auth.uid()
  returning * into v_host;

  if not found then
    raise exception 'HOST_RECORD_NOT_FOUND';
  end if;

  return v_host;
end;
$$;

revoke all on function public.set_own_host_availability(boolean) from public, anon;
revoke all on function public.update_own_host_languages(text[]) from public, anon;
grant execute on function public.set_own_host_availability(boolean) to authenticated, service_role;
grant execute on function public.update_own_host_languages(text[]) to authenticated, service_role;
