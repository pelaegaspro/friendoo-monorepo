-- Friendoo CRM/Admin migration: Supabase is the product source of truth.
-- All operational changes are server-side, auditable, and emitted through an Odoo-ready outbox.

create table if not exists public.host_applications (
  id uuid primary key default gen_random_uuid(),
  application_profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 80),
  phone text,
  city text,
  languages text[] not null default '{}',
  bio text,
  submitted_payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  subject text not null check (char_length(subject) between 1 and 180),
  category text not null default 'general',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_for_user', 'resolved', 'closed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id),
  name text not null check (char_length(name) between 1 and 120),
  channel text not null check (channel in ('push', 'email', 'in_app')),
  audience_filter jsonb not null default '{}'::jsonb,
  title text,
  body text not null check (char_length(body) between 1 and 3000),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  delivery_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fraud_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  alert_type text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'reviewing', 'dismissed', 'resolved')),
  evidence jsonb not null default '{}'::jsonb,
  assigned_to uuid references public.profiles(id) on delete set null,
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text not null,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  request_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.operational_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_type text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  sync_status text not null default 'pending' check (sync_status in ('pending', 'processing', 'delivered', 'failed', 'dead_letter')),
  available_at timestamptz not null default now(),
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.odoo_sync_logs (
  id uuid primary key default gen_random_uuid(),
  operational_event_id uuid not null references public.operational_events(id) on delete cascade,
  attempt integer not null default 1 check (attempt > 0),
  status text not null check (status in ('delivered', 'failed')),
  external_reference text,
  response_code integer,
  response_body jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.host_payouts
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text;

alter table public.host_payouts
  alter column provider set default 'manual_review';

create index if not exists host_applications_status_created_idx on public.host_applications (status, created_at desc);
create index if not exists support_tickets_status_priority_idx on public.support_tickets (status, priority, created_at desc);
create index if not exists fraud_alerts_status_severity_idx on public.fraud_alerts (status, severity, created_at desc);
create index if not exists admin_audit_logs_resource_idx on public.admin_audit_logs (resource_type, resource_id, created_at desc);
create index if not exists operational_events_sync_idx on public.operational_events (sync_status, available_at, created_at);
create index if not exists odoo_sync_logs_event_idx on public.odoo_sync_logs (operational_event_id, created_at desc);

create or replace function public.set_friendoo_operational_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists host_applications_updated_at on public.host_applications;
create trigger host_applications_updated_at before update on public.host_applications for each row execute function public.set_friendoo_operational_updated_at();
drop trigger if exists support_tickets_updated_at on public.support_tickets;
create trigger support_tickets_updated_at before update on public.support_tickets for each row execute function public.set_friendoo_operational_updated_at();
drop trigger if exists crm_campaigns_updated_at on public.crm_campaigns;
create trigger crm_campaigns_updated_at before update on public.crm_campaigns for each row execute function public.set_friendoo_operational_updated_at();
drop trigger if exists fraud_alerts_updated_at on public.fraud_alerts;
create trigger fraud_alerts_updated_at before update on public.fraud_alerts for each row execute function public.set_friendoo_operational_updated_at();
drop trigger if exists operational_events_updated_at on public.operational_events;
create trigger operational_events_updated_at before update on public.operational_events for each row execute function public.set_friendoo_operational_updated_at();

create or replace function public.require_friendoo_admin(p_actor_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
begin
  select role into v_role from public.profiles where id = p_actor_id;
  if v_role is distinct from 'admin'::public.app_role then
    raise exception 'ADMIN_ACCESS_REQUIRED';
  end if;
end;
$$;

create or replace function public.enqueue_friendoo_operational_event(
  p_event_key text,
  p_event_type text,
  p_aggregate_type text,
  p_aggregate_id text,
  p_actor_id uuid,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.operational_events (event_key, event_type, aggregate_type, aggregate_id, actor_id, payload)
  values (p_event_key, p_event_type, p_aggregate_type, p_aggregate_id, p_actor_id, coalesce(p_payload, '{}'::jsonb))
  on conflict (event_key) do nothing;
end;
$$;

create or replace function public.admin_adjust_wallet(
  p_actor_id uuid,
  p_user_id uuid,
  p_coin_delta integer,
  p_reason text,
  p_idempotency_key text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_existing integer;
begin
  perform public.require_friendoo_admin(p_actor_id);
  if p_coin_delta = 0 then raise exception 'COIN_DELTA_REQUIRED'; end if;
  if coalesce(char_length(trim(p_reason)), 0) = 0 then raise exception 'REASON_REQUIRED'; end if;
  if coalesce(char_length(trim(p_idempotency_key)), 0) = 0 then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;

  select balance_after into v_existing from public.wallet_transactions where idempotency_key = p_idempotency_key;
  if found then return v_existing; end if;

  insert into public.wallets (user_id, coin_balance)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  select coin_balance into v_balance from public.wallets where user_id = p_user_id for update;
  if not found then raise exception 'USER_NOT_FOUND'; end if;
  if v_balance + p_coin_delta < 0 then raise exception 'INSUFFICIENT_COINS'; end if;

  update public.wallets set coin_balance = v_balance + p_coin_delta, updated_at = now() where user_id = p_user_id;
  v_balance := v_balance + p_coin_delta;

  insert into public.wallet_transactions (user_id, type, coin_amount, balance_after, idempotency_key, metadata)
  values (p_user_id, 'adjustment', p_coin_delta, v_balance, p_idempotency_key,
          jsonb_build_object('reason', p_reason, 'actor_id', p_actor_id));

  insert into public.admin_audit_logs (actor_id, action, resource_type, resource_id, after_state)
  values (p_actor_id, 'wallet.adjusted', 'profile', p_user_id::text,
          jsonb_build_object('coin_delta', p_coin_delta, 'balance_after', v_balance, 'reason', p_reason));

  perform public.enqueue_friendoo_operational_event(
    'wallet-adjustment:' || p_idempotency_key,
    'wallet.adjusted', 'profile', p_user_id::text, p_actor_id,
    jsonb_build_object('coin_delta', p_coin_delta, 'balance_after', v_balance, 'reason', p_reason)
  );
  return v_balance;
end;
$$;

create or replace function public.admin_set_profile_ban(
  p_actor_id uuid,
  p_user_id uuid,
  p_is_banned boolean,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before boolean;
begin
  perform public.require_friendoo_admin(p_actor_id);
  select is_banned into v_before from public.profiles where id = p_user_id for update;
  if not found then raise exception 'USER_NOT_FOUND'; end if;
  update public.profiles set is_banned = p_is_banned, updated_at = now() where id = p_user_id;
  insert into public.admin_audit_logs (actor_id, action, resource_type, resource_id, before_state, after_state)
  values (p_actor_id, case when p_is_banned then 'profile.banned' else 'profile.unbanned' end, 'profile', p_user_id::text,
          jsonb_build_object('is_banned', v_before), jsonb_build_object('is_banned', p_is_banned, 'reason', p_reason));
  perform public.enqueue_friendoo_operational_event(
    'profile-ban:' || p_user_id::text || ':' || p_is_banned::text,
    case when p_is_banned then 'profile.banned' else 'profile.unbanned' end,
    'profile', p_user_id::text, p_actor_id, jsonb_build_object('reason', p_reason)
  );
end;
$$;

create or replace function public.admin_review_host_application(
  p_actor_id uuid,
  p_application_id uuid,
  p_decision text,
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_application public.host_applications%rowtype;
begin
  perform public.require_friendoo_admin(p_actor_id);
  if p_decision not in ('approved', 'rejected', 'suspended') then raise exception 'INVALID_DECISION'; end if;
  select * into v_application from public.host_applications where id = p_application_id for update;
  if not found then raise exception 'HOST_APPLICATION_NOT_FOUND'; end if;

  update public.host_applications
  set status = p_decision, reviewed_by = p_actor_id, reviewed_at = now(), review_note = p_note
  where id = p_application_id;

  if p_decision = 'approved' then
    if v_application.application_profile_id is null then raise exception 'APPLICATION_PROFILE_REQUIRED'; end if;
    update public.profiles set role = 'host'::public.app_role, updated_at = now() where id = v_application.application_profile_id;
    insert into public.hosts (id, bio, is_available)
    values (v_application.application_profile_id, coalesce(v_application.bio, ''), false)
    on conflict (id) do update set bio = excluded.bio, updated_at = now();
    insert into public.host_earnings (host_id) values (v_application.application_profile_id) on conflict (host_id) do nothing;
  end if;

  insert into public.admin_audit_logs (actor_id, action, resource_type, resource_id, after_state)
  values (p_actor_id, 'host_application.' || p_decision, 'host_application', p_application_id::text,
          jsonb_build_object('note', p_note));
  perform public.enqueue_friendoo_operational_event(
    'host-application:' || p_application_id::text || ':' || p_decision,
    'host_application.' || p_decision, 'host_application', p_application_id::text, p_actor_id,
    jsonb_build_object('application_profile_id', v_application.application_profile_id, 'note', p_note)
  );
  return p_decision;
end;
$$;

create or replace function public.admin_review_host_payout(
  p_actor_id uuid,
  p_payout_id uuid,
  p_decision text,
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payout public.host_payouts%rowtype;
begin
  perform public.require_friendoo_admin(p_actor_id);
  if p_decision not in ('approved', 'rejected') then raise exception 'INVALID_DECISION'; end if;
  select * into v_payout from public.host_payouts where id = p_payout_id for update;
  if not found then raise exception 'PAYOUT_NOT_FOUND'; end if;
  if v_payout.status <> 'pending'::public.host_payout_status then raise exception 'PAYOUT_NOT_PENDING'; end if;

  if p_decision = 'approved' then
    update public.host_payouts
    set status = 'processing'::public.host_payout_status, reviewed_by = p_actor_id, reviewed_at = now(), review_note = p_note,
        provider = 'manual_review', updated_at = now()
    where id = p_payout_id;
  else
    update public.host_payouts
    set status = 'cancelled'::public.host_payout_status, reviewed_by = p_actor_id, reviewed_at = now(), review_note = p_note,
        updated_at = now()
    where id = p_payout_id;
    update public.host_earnings
    set pending_payout_paise = pending_payout_paise - v_payout.amount_paise,
        available_paise = available_paise + v_payout.amount_paise,
        updated_at = now()
    where host_id = v_payout.host_id;
  end if;

  insert into public.admin_audit_logs (actor_id, action, resource_type, resource_id, after_state)
  values (p_actor_id, 'host_payout.' || p_decision, 'host_payout', p_payout_id::text,
          jsonb_build_object('amount_paise', v_payout.amount_paise, 'note', p_note));
  perform public.enqueue_friendoo_operational_event(
    'host-payout:' || p_payout_id::text || ':' || p_decision,
    'host_payout.' || p_decision, 'host_payout', p_payout_id::text, p_actor_id,
    jsonb_build_object('host_id', v_payout.host_id, 'amount_paise', v_payout.amount_paise, 'note', p_note)
  );
  return case when p_decision = 'approved' then 'processing' else 'cancelled' end;
end;
$$;

create or replace function public.record_host_payout_provider_result(
  p_payout_id uuid,
  p_success boolean,
  p_provider text,
  p_provider_transfer_id text default null,
  p_provider_reference_id text default null,
  p_failure_reason text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payout public.host_payouts%rowtype;
begin
  select * into v_payout from public.host_payouts where id = p_payout_id for update;
  if not found then raise exception 'PAYOUT_NOT_FOUND'; end if;
  if v_payout.status <> 'processing'::public.host_payout_status then raise exception 'PAYOUT_NOT_PROCESSING'; end if;

  if p_success then
    update public.host_payouts
    set status = 'paid'::public.host_payout_status, provider = p_provider, provider_transfer_id = p_provider_transfer_id,
        provider_reference_id = p_provider_reference_id, paid_at = now(), processed_at = now(), updated_at = now()
    where id = p_payout_id;
    update public.host_earnings set pending_payout_paise = pending_payout_paise - v_payout.amount_paise, updated_at = now() where host_id = v_payout.host_id;
  else
    update public.host_payouts
    set status = 'failed'::public.host_payout_status, provider = p_provider, provider_transfer_id = p_provider_transfer_id,
        provider_reference_id = p_provider_reference_id, failure_reason = p_failure_reason, processed_at = now(), updated_at = now()
    where id = p_payout_id;
    update public.host_earnings
    set pending_payout_paise = pending_payout_paise - v_payout.amount_paise,
        available_paise = available_paise + v_payout.amount_paise, updated_at = now()
    where host_id = v_payout.host_id;
  end if;

  perform public.enqueue_friendoo_operational_event(
    'host-payout-result:' || p_payout_id::text || ':' || case when p_success then 'paid' else 'failed' end,
    case when p_success then 'host_payout.paid' else 'host_payout.failed' end,
    'host_payout', p_payout_id::text, null,
    jsonb_build_object('provider', p_provider, 'provider_transfer_id', p_provider_transfer_id,
                       'provider_reference_id', p_provider_reference_id, 'failure_reason', p_failure_reason)
  );
  return case when p_success then 'paid' else 'failed' end;
end;
$$;

alter table public.host_applications enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.crm_campaigns enable row level security;
alter table public.fraud_alerts enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.operational_events enable row level security;
alter table public.odoo_sync_logs enable row level security;

revoke all on function public.require_friendoo_admin(uuid) from public, anon, authenticated;
revoke all on function public.enqueue_friendoo_operational_event(text, text, text, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.admin_adjust_wallet(uuid, uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_profile_ban(uuid, uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.admin_review_host_application(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_review_host_payout(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.record_host_payout_provider_result(uuid, boolean, text, text, text, text) from public, anon, authenticated;

grant execute on function public.admin_adjust_wallet(uuid, uuid, integer, text, text) to service_role;
grant execute on function public.admin_set_profile_ban(uuid, uuid, boolean, text) to service_role;
grant execute on function public.admin_review_host_application(uuid, uuid, text, text) to service_role;
grant execute on function public.admin_review_host_payout(uuid, uuid, text, text) to service_role;
grant execute on function public.record_host_payout_provider_result(uuid, boolean, text, text, text, text) to service_role;
