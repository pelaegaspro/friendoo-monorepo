-- Remove the email-pattern-based administrator bypass and prohibit direct
-- client mutation of advertising records. Ad engagement is authenticated and
-- limited to active ads through a narrowly scoped RPC.

drop policy if exists "Admins full management on banner ads" on public.banner_ads;

alter table public.banner_ads force row level security;
revoke insert, update, delete on public.banner_ads from anon, authenticated;

create or replace function public.record_ad_event(
  p_ad_id uuid,
  p_event_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if p_event_type not in ('click', 'impression') then
    raise exception 'INVALID_AD_EVENT_TYPE';
  end if;

  if p_event_type = 'click' then
    update public.banner_ads
       set click_count = click_count + 1,
           updated_at = now()
     where id = p_ad_id
       and is_active = true;
  else
    update public.banner_ads
       set impression_count = impression_count + 1,
           updated_at = now()
     where id = p_ad_id
       and is_active = true;
  end if;

  if not found then
    raise exception 'ACTIVE_AD_NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.record_ad_event(uuid, text) from public, anon;
grant execute on function public.record_ad_event(uuid, text) to authenticated, service_role;
