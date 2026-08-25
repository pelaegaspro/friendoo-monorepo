-- Friendoo Backend 1 Migration: Register and approve host +917604991136
-- Ensures the phone number +917604991136 is promoted to host role,
-- has an active host entry in public.hosts, and initializes host earnings.

do $$
declare
  v_user_id uuid;
begin
  -- 1. Check if auth user already exists for +917604991136
  select id into v_user_id from auth.users where phone in ('+917604991136', '7604991136') limit 1;

  if v_user_id is not null then
    -- Update profile to host role
    update public.profiles
    set role = 'host'::public.app_role,
        updated_at = now()
    where id = v_user_id;

    -- Upsert host record
    insert into public.hosts (id, bio, rate_per_audio_minute, rate_per_video_minute, is_available, rating, total_ratings)
    values (
      v_user_id,
      'Friendly listener & cheerful conversationalist on Friendoo.',
      5,
      10,
      true,
      5.00,
      1
    )
    on conflict (id) do update
    set is_available = true,
        updated_at = now();

    -- Upsert host earnings
    insert into public.host_earnings (host_id)
    values (v_user_id)
    on conflict (host_id) do nothing;
  end if;
end $$;

-- 2. Create trigger to automatically promote +917604991136 to host upon new sign up
create or replace function public.auto_promote_special_host_phone()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.phone in ('+917604991136', '7604991136') then
    new.role := 'host'::public.app_role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_promote_special_host_phone on public.profiles;
create trigger trg_auto_promote_special_host_phone
before insert or update on public.profiles
for each row
execute function public.auto_promote_special_host_phone();
