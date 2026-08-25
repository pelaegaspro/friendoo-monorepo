-- 20260823_000016_flash_offers_and_host_incentives.sql
-- Expand banner_ads with Flash Package Deals, Host Peak-Hour Incentives, and Audience Priority Targeting

alter table public.banner_ads
  add column if not exists campaign_type text not null default 'user_offer', -- 'user_offer', 'host_incentive', 'flash_package', 'sponsor_ad'
  add column if not exists target_audience text not null default 'all', -- 'all', 'users', 'hosts', 'new_users', 'priority_users'
  add column if not exists promo_coins integer,
  add column if not exists promo_price_inr integer,
  add column if not exists original_price_inr integer,
  add column if not exists promo_bonus_label text,
  add column if not exists show_as_popup boolean not null default false;

-- Seed default Top Banners and Host Peak-Hour Incentive
insert into public.banner_ads (
  title,
  campaign_type,
  target_audience,
  badge_text,
  headline,
  subtitle,
  gradient_colors,
  action_type,
  placement,
  promo_coins,
  promo_price_inr,
  original_price_inr,
  promo_bonus_label,
  show_as_popup,
  is_active,
  priority
) values 
(
  'User Top Flash Sale 50 Coins for ₹39',
  'flash_package',
  'users',
  'FLASH DEAL • ₹39 ONLY',
  'Get 50 Coins for Just ₹39! ⚡',
  'Limited-time introductory talk offer. Save 20% on your first recharge.',
  array['#4F46E5', '#7C3AED', '#DB2777'],
  'recharge',
  'user_top_banner',
  50,
  39,
  49,
  '50 Coins for ₹39',
  false,
  20
),
(
  'Host Peak Hour Surge Incentive',
  'host_incentive',
  'hosts',
  'PEAK HOUR SURGE • +₹10/MIN',
  'Earn 2X Extra from 8 PM - 11 PM! 🔥',
  'High caller volume active right now. Stay online to maximize tonight’s payout.',
  array['#D97706', '#F59E0B', '#EF4444'],
  'none',
  'host_top_banner',
  null,
  null,
  null,
  null,
  false,
  30
)
on conflict do nothing;
