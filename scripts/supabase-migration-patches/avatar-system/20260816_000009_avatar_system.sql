-- Friendoo privacy-first avatar system
-- Generated avatars are the default. Uploaded host images remain private until an admin-approved display variant is selected.

alter table public.profiles
  add column if not exists avatar_kind text not null default 'generated',
  add column if not exists avatar_seed text,
  add column if not exists avatar_status text not null default 'generated',
  add column if not exists avatar_updated_at timestamptz not null default now();

update public.profiles
set avatar_seed = coalesce(avatar_seed, md5(id::text || ':friendoo-avatar-v1'))
where avatar_seed is null;

alter table public.profiles
  alter column avatar_seed set default md5(gen_random_uuid()::text || clock_timestamp()::text),
  alter column avatar_seed set not null;

alter table public.profiles
  drop constraint if exists profiles_avatar_kind_check,
  add constraint profiles_avatar_kind_check
    check (avatar_kind in ('generated', 'uploaded', 'audio_orb')),
  drop constraint if exists profiles_avatar_status_check,
  add constraint profiles_avatar_status_check
    check (avatar_status in ('generated', 'pending_review', 'approved', 'rejected', 'disabled'));

create table if not exists public.profile_avatar_submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  source_path text not null,
  display_path text,
  status text not null default 'pending',
  submission_note text,
  review_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_avatar_submissions_status_check
    check (status in ('pending', 'approved', 'rejected', 'withdrawn', 'disabled')),
  constraint profile_avatar_submissions_source_path_check
    check (source_path like ('profile/' || profile_id::text || '/source/%')),
  constraint profile_avatar_submissions_display_path_check
    check (display_path is null or display_path like ('profile/' || profile_id::text || '/display/%'))
);

create unique index if not exists profile_avatar_submissions_one_pending_per_profile
  on public.profile_avatar_submissions(profile_id)
  where status = 'pending';

create index if not exists profile_avatar_submissions_review_queue_idx
  on public.profile_avatar_submissions(status, created_at asc);

alter table public.profile_avatar_submissions enable row level security;

-- Existing profiles RLS policies remain the source of truth for public profile visibility. Avatar submissions are private.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profile_avatar_submissions'
      and policyname = 'Users read their own avatar submissions'
  ) then
    create policy "Users read their own avatar submissions"
      on public.profile_avatar_submissions
      for select to authenticated
      using (profile_id = auth.uid());
  end if;
end
$$;

-- Private bucket. The mobile client may write and read only its own source image path.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users upload their own avatar source'
  ) then
    create policy "Users upload their own avatar source"
      on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = 'profile'
        and (storage.foldername(name))[2] = auth.uid()::text
        and (storage.foldername(name))[3] = 'source'
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users read their own avatar source'
  ) then
    create policy "Users read their own avatar source"
      on storage.objects
      for select to authenticated
      using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = 'profile'
        and (storage.foldername(name))[2] = auth.uid()::text
        and (storage.foldername(name))[3] = 'source'
      );
  end if;
end
$$;

create or replace function public.submit_avatar_for_review(
  p_source_path text,
  p_submission_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_submission_id uuid;
begin
  if v_actor_id is null then
    raise exception 'Authenticated user is required';
  end if;

  if p_source_path is null
     or p_source_path !~ ('^profile/' || v_actor_id::text || '/source/[A-Za-z0-9._/-]+$') then
    raise exception 'Avatar source path must belong to the authenticated profile';
  end if;

  update public.profile_avatar_submissions
  set status = 'withdrawn',
      updated_at = now()
  where profile_id = v_actor_id
    and status = 'pending';

  insert into public.profile_avatar_submissions (
    profile_id,
    source_path,
    status,
    submission_note
  ) values (
    v_actor_id,
    p_source_path,
    'pending',
    nullif(trim(p_submission_note), '')
  ) returning id into v_submission_id;

  update public.profiles
  set avatar_status = 'pending_review',
      avatar_updated_at = now(),
      updated_at = now()
  where id = v_actor_id;

  insert into public.operational_events (
    event_key,
    event_type,
    aggregate_type,
    aggregate_id,
    actor_id,
    payload
  ) values (
    'avatar-submitted:' || v_submission_id::text,
    'profile.avatar.submitted',
    'profile',
    v_actor_id::text,
    v_actor_id,
    jsonb_build_object(
      'submission_id', v_submission_id,
      'profile_id', v_actor_id,
      'source_path', p_source_path
    )
  );

  return v_submission_id;
end;
$$;

create or replace function public.admin_review_avatar_submission(
  p_actor_id uuid,
  p_submission_id uuid,
  p_decision text,
  p_display_path text default null,
  p_review_note text default null,
  p_request_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.profile_avatar_submissions%rowtype;
  v_before jsonb;
  v_after jsonb;
  v_next_status text;
begin
  if p_decision not in ('approved', 'rejected', 'disabled') then
    raise exception 'Avatar decision must be approved, rejected, or disabled';
  end if;

  if not exists (
    select 1 from public.profiles actor
    where actor.id = p_actor_id and actor.role = 'admin'
  ) then
    raise exception 'Operational admin role is required';
  end if;

  select * into v_submission
  from public.profile_avatar_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Avatar submission not found';
  end if;

  if v_submission.status <> 'pending' then
    raise exception 'Only pending avatar submissions can be reviewed';
  end if;

  if p_decision = 'approved' then
    if p_display_path is null
       or p_display_path !~ ('^profile/' || v_submission.profile_id::text || '/display/[A-Za-z0-9._/-]+$') then
      raise exception 'Approved avatar display path must belong to the submitted profile';
    end if;
    v_next_status := 'approved';
  elsif p_decision = 'rejected' then
    v_next_status := 'rejected';
  else
    v_next_status := 'disabled';
  end if;

  select jsonb_build_object(
    'avatar_kind', avatar_kind,
    'avatar_path', avatar_path,
    'avatar_status', avatar_status,
    'avatar_updated_at', avatar_updated_at
  ) into v_before
  from public.profiles
  where id = v_submission.profile_id
  for update;

  update public.profile_avatar_submissions
  set status = v_next_status,
      display_path = case when p_decision = 'approved' then p_display_path else null end,
      review_note = nullif(trim(p_review_note), ''),
      reviewed_by = p_actor_id,
      reviewed_at = now(),
      updated_at = now()
  where id = v_submission.id;

  update public.profiles
  set avatar_kind = case when p_decision = 'approved' then 'uploaded' else 'generated' end,
      avatar_path = case when p_decision = 'approved' then p_display_path else null end,
      avatar_status = v_next_status,
      avatar_updated_at = now(),
      updated_at = now()
  where id = v_submission.profile_id;

  select jsonb_build_object(
    'avatar_kind', avatar_kind,
    'avatar_path', avatar_path,
    'avatar_status', avatar_status,
    'avatar_updated_at', avatar_updated_at
  ) into v_after
  from public.profiles
  where id = v_submission.profile_id;

  insert into public.admin_audit_logs (
    actor_id,
    action,
    resource_type,
    resource_id,
    before_state,
    after_state,
    request_id
  ) values (
    p_actor_id,
    'review_profile_avatar',
    'profile_avatar_submission',
    v_submission.id::text,
    coalesce(v_before, '{}'::jsonb),
    coalesce(v_after, '{}'::jsonb),
    p_request_id
  );

  insert into public.operational_events (
    event_key,
    event_type,
    aggregate_type,
    aggregate_id,
    actor_id,
    payload
  ) values (
    'avatar-reviewed:' || v_submission.id::text,
    'profile.avatar.reviewed',
    'profile',
    v_submission.profile_id::text,
    p_actor_id,
    jsonb_build_object(
      'submission_id', v_submission.id,
      'profile_id', v_submission.profile_id,
      'decision', p_decision,
      'before_state', coalesce(v_before, '{}'::jsonb),
      'after_state', coalesce(v_after, '{}'::jsonb)
    )
  );

  return v_submission.id;
end;
$$;

revoke all on function public.submit_avatar_for_review(text, text) from public;
grant execute on function public.submit_avatar_for_review(text, text) to authenticated, service_role;

revoke all on function public.admin_review_avatar_submission(uuid, uuid, text, text, text, uuid) from public;
grant execute on function public.admin_review_avatar_submission(uuid, uuid, text, text, text, uuid) to service_role;
