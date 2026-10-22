-- Migration: Host Application & Onboarding
-- Allows authenticated users to apply as a host with Name, Age, Language, City, and Payout (UPI/Bank) details.

create or replace function public.submit_host_application(
  p_name text,
  p_age integer,
  p_city text,
  p_languages text[],
  p_bio text default '',
  p_payout_type text default 'upi',
  p_payout_details jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user_phone text;
  v_app_id uuid;
  v_payload jsonb;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select phone into v_user_phone from public.profiles where id = v_user_id;

  v_payload := jsonb_build_object(
    'age', p_age,
    'city', p_city,
    'payout_type', p_payout_type,
    'payout_details', p_payout_details,
    'submitted_at', now()
  );

  insert into public.host_applications (
    application_profile_id,
    display_name,
    phone,
    city,
    languages,
    bio,
    submitted_payload,
    status
  ) values (
    v_user_id,
    p_name,
    v_user_phone,
    p_city,
    p_languages,
    p_bio,
    v_payload,
    'pending'
  )
  returning id into v_app_id;

  update public.profiles
  set
    display_name = coalesce(nullif(p_name, ''), display_name),
    updated_at = now()
  where id = v_user_id;

  return jsonb_build_object(
    'success', true,
    'application_id', v_app_id,
    'message', 'Application submitted successfully'
  );
end;
$$;

grant execute on function public.submit_host_application to authenticated;

drop policy if exists "Users can read own host applications" on public.host_applications;
create policy "Users can read own host applications"
  on public.host_applications
  for select
  to authenticated
  using (application_profile_id = auth.uid());

