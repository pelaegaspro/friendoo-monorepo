-- Server-authoritative allowlist for user-editable profile fields.

alter table public.profiles
  add column if not exists preferred_languages text[] not null default array['Tamil', 'Hindi', 'English'];

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- Do not permit direct browser/client updates. Privileged role, ban, phone, and
-- ownership fields remain writable only by controlled server/admin operations.
revoke update on public.profiles from anon, authenticated;

create or replace function public.update_own_profile(
  p_display_name text default null,
  p_about text default null,
  p_preferred_languages text[] default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_about text;
  v_languages text[];
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if p_display_name is null and p_about is null and p_preferred_languages is null then
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

revoke all on function public.update_own_profile(text, text, text[]) from public, anon;
grant execute on function public.update_own_profile(text, text, text[]) to authenticated;
