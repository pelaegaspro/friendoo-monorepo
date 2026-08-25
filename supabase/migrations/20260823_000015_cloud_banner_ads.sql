-- 20260823_000015_cloud_banner_ads.sql
-- Cloud-based In-App Banner Ads and Campaigns Managed by Admin

create table if not exists public.banner_ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  badge_text text default 'SPECIAL OFFER',
  headline text not null,
  subtitle text not null,
  image_url text,
  gradient_colors text[] default array['#4F46E5', '#7C3AED', '#DB2777'],
  action_type text not null default 'recharge', -- 'recharge', 'link', 'none'
  action_url text,
  placement text not null default 'account_settings', -- 'account_settings', 'discover', 'all'
  is_active boolean not null default true,
  priority integer not null default 0,
  click_count bigint not null default 0,
  impression_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.banner_ads enable row level security;

-- Policy: Anyone (anon/authenticated) can view active ads
create policy "Anyone can view active banner ads"
  on public.banner_ads for select
  using (is_active = true);

-- Policy: Service role & Admin full access
create policy "Admins full management on banner ads"
  on public.banner_ads for all
  using (auth.role() = 'service_role' or auth.jwt()->>'role' = 'service_role' or auth.jwt()->>'email' like '%admin%');

-- Seed default initial promotion
insert into public.banner_ads (
  title,
  badge_text,
  headline,
  subtitle,
  gradient_colors,
  action_type,
  placement,
  is_active,
  priority
) values (
  'First Recharge 50% Bonus',
  'SPECIAL OFFER • 50% BONUS',
  'Talk More, Connect Freely!',
  'Get up to 50% bonus coins on talk recharge packs today.',
  array['#4F46E5', '#7C3AED', '#DB2777'],
  'recharge',
  'account_settings',
  true,
  10
) on conflict do nothing;

-- Stored procedure to increment impressions and clicks
create or replace function public.record_ad_event(
  p_ad_id uuid,
  p_event_type text -- 'impression' or 'click'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_type = 'click' then
    update public.banner_ads
    set click_count = click_count + 1, updated_at = now()
    where id = p_ad_id;
  elsif p_event_type = 'impression' then
    update public.banner_ads
    set impression_count = impression_count + 1, updated_at = now()
    where id = p_ad_id;
  end if;
end;
$$;

grant execute on function public.record_ad_event(uuid, text) to authenticated, anon, service_role;
