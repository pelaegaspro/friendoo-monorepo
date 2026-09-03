-- Durable security observability and Cashfree webhook replay protection.

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('cashfree')),
  event_fingerprint text not null check (char_length(event_fingerprint) between 32 and 128),
  event_type text not null check (char_length(event_type) between 1 and 100),
  provider_order_id text,
  status text not null default 'received' check (status in ('received', 'processed', 'ignored', 'failed')),
  attempt_count integer not null default 1 check (attempt_count >= 1),
  metadata jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (provider, event_fingerprint)
);

create index if not exists webhook_events_provider_order_idx
  on public.webhook_events (provider, provider_order_id, received_at desc);

create table if not exists public.security_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (char_length(event_type) between 1 and 120),
  outcome text not null check (outcome in ('accepted', 'rejected', 'duplicate', 'failed')),
  actor_id uuid references public.profiles(id) on delete set null,
  target_type text,
  target_id text,
  request_fingerprint text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_audit_events_type_created_idx
  on public.security_audit_events (event_type, created_at desc);
create index if not exists security_audit_events_actor_created_idx
  on public.security_audit_events (actor_id, created_at desc);

alter table public.webhook_events enable row level security;
alter table public.webhook_events force row level security;
alter table public.security_audit_events enable row level security;
alter table public.security_audit_events force row level security;

-- Neither table is exposed to client roles; Edge Functions use the service role.
revoke all on public.webhook_events from public, anon, authenticated;
revoke all on public.security_audit_events from public, anon, authenticated;

create or replace function public.reserve_webhook_event(
  p_provider text,
  p_event_fingerprint text,
  p_event_type text,
  p_provider_order_id text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.webhook_events%rowtype;
begin
  if p_provider <> 'cashfree' then
    raise exception 'UNSUPPORTED_WEBHOOK_PROVIDER';
  end if;

  select * into v_event
  from public.webhook_events
  where provider = p_provider and event_fingerprint = p_event_fingerprint
  for update;

  if found then
    if v_event.status in ('processed', 'ignored') then
      return jsonb_build_object('accepted', false, 'duplicate', true, 'event_id', v_event.id, 'status', v_event.status);
    end if;

    if v_event.status = 'received' and v_event.updated_at > now() - interval '5 minutes' then
      return jsonb_build_object('accepted', false, 'duplicate', true, 'event_id', v_event.id, 'status', v_event.status);
    end if;

    update public.webhook_events
    set status = 'received',
        attempt_count = attempt_count + 1,
        event_type = p_event_type,
        provider_order_id = p_provider_order_id,
        metadata = p_metadata,
        updated_at = now()
    where id = v_event.id;

    return jsonb_build_object('accepted', true, 'duplicate', false, 'event_id', v_event.id, 'status', 'received');
  end if;

  insert into public.webhook_events (
    provider, event_fingerprint, event_type, provider_order_id, metadata
  ) values (
    p_provider, p_event_fingerprint, p_event_type, p_provider_order_id, coalesce(p_metadata, '{}'::jsonb)
  ) returning * into v_event;

  return jsonb_build_object('accepted', true, 'duplicate', false, 'event_id', v_event.id, 'status', v_event.status);
end;
$$;

create or replace function public.complete_webhook_event(
  p_provider text,
  p_event_fingerprint text,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('processed', 'ignored', 'failed') then
    raise exception 'INVALID_WEBHOOK_STATUS';
  end if;

  update public.webhook_events
  set status = p_status,
      processed_at = case when p_status in ('processed', 'ignored') then now() else processed_at end,
      updated_at = now()
  where provider = p_provider and event_fingerprint = p_event_fingerprint;
end;
$$;

revoke all on function public.reserve_webhook_event(text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.complete_webhook_event(text, text, text) from public, anon, authenticated;
grant execute on function public.reserve_webhook_event(text, text, text, text, jsonb) to service_role;
grant execute on function public.complete_webhook_event(text, text, text) to service_role;
