-- 20261028_000035_advertisers_and_campaigns.sql
-- Production Ads and Promotions System: Advertisers, Campaigns, and Idempotent Events

-- 1. Advertisers Table
create table if not exists public.advertisers (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  contact_email text not null,
  website_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'suspended', 'archived')),
  billing_customer_ref text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Ad Campaigns Table
create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid references public.advertisers(id) on delete set null,
  campaign_class text not null default 'friendoo_offer' check (campaign_class in ('friendoo_offer', 'sponsored_ad')),
  campaign_type text not null default 'user_offer',
  name text not null,
  headline text not null,
  subtitle text not null,
  badge_text text default 'SPECIAL OFFER',
  image_url text,
  gradient_colors text[] default array['#4F46E5', '#7C3AED', '#DB2777'],
  action_type text not null default 'recharge' check (action_type in ('recharge', 'link', 'none')),
  action_url text,
  destination_url text,
  placement text not null default 'user_top_banner',
  target_segment text not null default 'all',
  target_audience text not null default 'all',
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'approved', 'live', 'paused', 'expired', 'exhausted', 'archived')),
  is_active boolean not null default true,
  priority integer not null default 0,
  daily_impression_cap integer,
  total_impression_cap integer,
  current_impressions bigint not null default 0,
  current_clicks bigint not null default 0,
  budget_inr numeric(12, 2),
  spent_inr numeric(12, 2) not null default 0.00,
  promo_coins integer,
  promo_price_inr integer,
  original_price_inr integer,
  promo_bonus_label text,
  show_as_popup boolean not null default false,
  start_at timestamptz not null default now(),
  end_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Delivery Events Table with Unique Idempotency Key
create table if not exists public.ad_delivery_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  placement text not null default 'user_top_banner',
  event_type text not null check (event_type in ('impression', 'click', 'conversion', 'dismiss')),
  idempotency_key text not null unique,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_ad_campaigns_status_placement on public.ad_campaigns(status, placement, priority desc);
create index if not exists idx_ad_delivery_events_campaign on public.ad_delivery_events(campaign_id, event_type);
create index if not exists idx_ad_delivery_events_idempotency on public.ad_delivery_events(idempotency_key);

-- RLS
alter table public.advertisers enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_delivery_events enable row level security;

-- Advertisers RLS: Public read approved, Admins full access
create policy "Anyone can view approved advertisers"
  on public.advertisers for select
  using (status = 'approved');

create policy "Admins full management on advertisers"
  on public.advertisers for all
  using (auth.role() = 'service_role' or auth.jwt()->>'role' = 'service_role' or auth.jwt()->>'email' like '%admin%');

-- Ad Campaigns RLS: Anyone can view live campaigns
create policy "Anyone can view live ad campaigns"
  on public.ad_campaigns for select
  using (status = 'live' or is_active = true);

create policy "Admins full management on ad campaigns"
  on public.ad_campaigns for all
  using (auth.role() = 'service_role' or auth.jwt()->>'role' = 'service_role' or auth.jwt()->>'email' like '%admin%');

-- Delivery Events RLS: Insert allowed, Admins view all
create policy "Anyone can record delivery events"
  on public.ad_delivery_events for insert
  with check (true);

create policy "Admins can view delivery events"
  on public.ad_delivery_events for select
  using (auth.role() = 'service_role' or auth.jwt()->>'role' = 'service_role' or auth.jwt()->>'email' like '%admin%');

-- 4. Idempotent Delivery Event RPC
create or replace function public.record_ad_delivery_event(
  p_campaign_id uuid,
  p_event_type text,
  p_placement text,
  p_idempotency_key text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted boolean := false;
begin
  -- Validate that campaign is live or active
  if not exists (
    select 1 from public.ad_campaigns
    where id = p_campaign_id and (status = 'live' or is_active = true)
  ) then
    return false;
  end if;

  -- Insert event with idempotency check
  insert into public.ad_delivery_events (campaign_id, user_id, placement, event_type, idempotency_key)
  values (p_campaign_id, auth.uid(), coalesce(p_placement, 'banner'), p_event_type, p_idempotency_key)
  on conflict (idempotency_key) do nothing
  returning true into v_inserted;

  if v_inserted then
    if p_event_type = 'click' then
      update public.ad_campaigns
      set current_clicks = current_clicks + 1, updated_at = now()
      where id = p_campaign_id;
    elsif p_event_type = 'impression' then
      update public.ad_campaigns
      set current_impressions = current_impressions + 1, updated_at = now()
      where id = p_campaign_id;
    end if;
    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.record_ad_delivery_event(uuid, text, text, text) to authenticated, anon, service_role;

