-- Backend 2 staging-only security alert queue for payment and webhook integrity events.
-- This migration does not deliver external notifications; it records deduplicated,
-- reviewable alerts for a separately configured trusted notification destination.

create table if not exists public.staging_security_alert_rules (
  rule_key text primary key check (char_length(rule_key) between 3 and 100),
  source_kind text not null check (source_kind in ('security_audit_event', 'webhook_event')),
  event_type text,
  outcome text,
  webhook_status text,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
  title text not null check (char_length(title) between 3 and 160),
  deduplication_window_seconds integer not null default 3600
    check (deduplication_window_seconds between 60 and 86400),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (source_kind = 'security_audit_event' and event_type is not null and outcome is not null and webhook_status is null)
    or (source_kind = 'webhook_event' and event_type is null and outcome is null and webhook_status is not null)
  )
);

create table if not exists public.staging_security_alerts (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null references public.staging_security_alert_rules(rule_key) on delete restrict,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
  title text not null,
  source_kind text not null check (source_kind in ('security_audit_event', 'webhook_event')),
  source_event_id uuid not null,
  source_event_type text,
  source_outcome text,
  target_type text,
  target_id text,
  deduplication_key text not null check (char_length(deduplication_key) = 32),
  state text not null default 'open' check (state in ('open', 'acknowledged', 'resolved')),
  occurrence_count integer not null default 1 check (occurrence_count >= 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (rule_key, deduplication_key)
);

create index if not exists staging_security_alerts_open_idx
  on public.staging_security_alerts (state, severity, last_seen_at desc);
create index if not exists staging_security_alerts_source_idx
  on public.staging_security_alerts (source_kind, source_event_id);

alter table public.staging_security_alert_rules enable row level security;
alter table public.staging_security_alert_rules force row level security;
alter table public.staging_security_alerts enable row level security;
alter table public.staging_security_alerts force row level security;

revoke all on public.staging_security_alert_rules from public, anon, authenticated;
revoke all on public.staging_security_alerts from public, anon, authenticated;
grant select, insert, update, delete on public.staging_security_alert_rules to service_role;
grant select, insert, update, delete on public.staging_security_alerts to service_role;

insert into public.staging_security_alert_rules (
  rule_key,
  source_kind,
  event_type,
  outcome,
  webhook_status,
  severity,
  title,
  deduplication_window_seconds
) values
  ('cashfree_webhook_failed', 'security_audit_event', 'cashfree.webhook.failed', 'failed', null, 'high', 'Cashfree webhook processing failed', 900),
  ('cashfree_webhook_duplicate', 'security_audit_event', 'cashfree.webhook.duplicate', 'duplicate', null, 'medium', 'Cashfree webhook replay rejected', 3600),
  ('cashfree_confirm_rejected', 'security_audit_event', 'cashfree.confirm.rejected', 'rejected', null, 'high', 'Cashfree payment confirmation rejected', 900),
  ('cashfree_confirm_failed', 'security_audit_event', 'cashfree.confirm.failed', 'failed', null, 'high', 'Cashfree payment confirmation failed', 900),
  ('cashfree_webhook_ledger_failed', 'webhook_event', null, null, 'failed', 'high', 'Cashfree webhook ledger entry failed', 900)
on conflict (rule_key) do update
set
  source_kind = excluded.source_kind,
  event_type = excluded.event_type,
  outcome = excluded.outcome,
  webhook_status = excluded.webhook_status,
  severity = excluded.severity,
  title = excluded.title,
  deduplication_window_seconds = excluded.deduplication_window_seconds,
  is_enabled = true,
  updated_at = now();

create or replace function public.emit_staging_security_alert(
  p_source_kind text,
  p_source_event_id uuid,
  p_event_type text,
  p_outcome text,
  p_webhook_status text,
  p_target_type text,
  p_target_id text,
  p_occurred_at timestamptz,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rule public.staging_security_alert_rules%rowtype;
  v_bucket timestamptz;
  v_deduplication_key text;
begin
  for v_rule in
    select *
    from public.staging_security_alert_rules
    where is_enabled
      and source_kind = p_source_kind
      and (event_type is null or event_type = p_event_type)
      and (outcome is null or outcome = p_outcome)
      and (webhook_status is null or webhook_status = p_webhook_status)
  loop
    v_bucket := to_timestamp(
      floor(extract(epoch from p_occurred_at) / v_rule.deduplication_window_seconds)
      * v_rule.deduplication_window_seconds
    );
    v_deduplication_key := md5(
      v_rule.rule_key || ':' || coalesce(p_target_id, p_source_event_id::text) || ':' || v_bucket::text
    );

    insert into public.staging_security_alerts (
      rule_key,
      severity,
      title,
      source_kind,
      source_event_id,
      source_event_type,
      source_outcome,
      target_type,
      target_id,
      deduplication_key,
      metadata
    ) values (
      v_rule.rule_key,
      v_rule.severity,
      v_rule.title,
      p_source_kind,
      p_source_event_id,
      p_event_type,
      coalesce(p_outcome, p_webhook_status),
      p_target_type,
      p_target_id,
      v_deduplication_key,
      coalesce(p_metadata, '{}'::jsonb)
    )
    on conflict (rule_key, deduplication_key) do update
      set occurrence_count = public.staging_security_alerts.occurrence_count + 1,
          last_seen_at = now(),
          source_event_id = excluded.source_event_id,
          source_event_type = excluded.source_event_type,
          source_outcome = excluded.source_outcome,
          target_type = excluded.target_type,
          target_id = excluded.target_id,
          metadata = excluded.metadata;
  end loop;
end;
$$;

create or replace function public.capture_security_audit_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.emit_staging_security_alert(
    'security_audit_event',
    new.id,
    new.event_type,
    new.outcome,
    null,
    new.target_type,
    new.target_id,
    new.created_at,
    jsonb_build_object('request_fingerprint_present', new.request_fingerprint is not null)
  );
  return new;
end;
$$;

create or replace function public.capture_webhook_failure_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'failed' and (tg_op = 'INSERT' or old.status is distinct from 'failed') then
    perform public.emit_staging_security_alert(
      'webhook_event',
      new.id,
      new.event_type,
      null,
      new.status,
      'payment_order',
      new.provider_order_id,
      new.updated_at,
      jsonb_build_object('provider', new.provider, 'attempt_count', new.attempt_count)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists security_audit_alert_after_insert on public.security_audit_events;
create trigger security_audit_alert_after_insert
  after insert on public.security_audit_events
  for each row execute function public.capture_security_audit_alert();

drop trigger if exists webhook_failure_alert_after_insert_or_update on public.webhook_events;
create trigger webhook_failure_alert_after_insert_or_update
  after insert or update of status on public.webhook_events
  for each row execute function public.capture_webhook_failure_alert();

revoke all on function public.emit_staging_security_alert(text, uuid, text, text, text, text, text, timestamptz, jsonb) from public, anon, authenticated;
revoke all on function public.capture_security_audit_alert() from public, anon, authenticated;
revoke all on function public.capture_webhook_failure_alert() from public, anon, authenticated;
grant execute on function public.emit_staging_security_alert(text, uuid, text, text, text, text, text, timestamptz, jsonb) to service_role;
