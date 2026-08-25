-- ============================================================================
-- BACKEND 2 REFERENCE MIGRATION: 20260825_000001_backend2_public_feature_config.sql
-- Project: friendoo-backend-2 (Project Ref: wqoqeljqzknccyeegtxb)
--
-- IMPORTANT ARCHITECTURAL DIRECTIVE:
-- This migration belongs EXCLUSIVELY to Backend 2 (Discover Promo Configuration).
-- DO NOT apply this migration to Backend 1 (Auth, Calls, Agora, Wallets, CRM).
-- Backend 2 contains ONLY public_feature_config and ZERO private/operational tables.
-- ============================================================================

create table if not exists public.public_feature_config (
  key text primary key,
  value jsonb not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Enable strict Row Level Security
alter table public.public_feature_config enable row level security;

-- Public read-only policy for active configurations
create policy "Public read access for public_feature_config"
  on public.public_feature_config
  for select
  using (is_active = true);

-- Seed discover_promo_items with 4 curated promo cards
insert into public.public_feature_config (key, value, is_active)
values (
  'discover_promo_items',
  '[
    {
      "id": "promo_flash_cashback",
      "title": "Flash 60% Cashback",
      "headline": "Flash 60% Cashback 🔥",
      "subtitle": "Ends in 5h • Get 60% bonus coins on all recharges!",
      "badge_text": "⚡ 60% CASHBACK",
      "gradient_colors": ["#EC4899", "#8B5CF6", "#3B82F6"],
      "action_type": "recharge",
      "priority": 100
    },
    {
      "id": "promo_first_call_free",
      "title": "First Call Free",
      "headline": "New User Gift 🎁",
      "subtitle": "Get 15 free coins instantly on first signup",
      "badge_text": "FREE BONUS",
      "gradient_colors": ["#10B981", "#059669", "#047857"],
      "action_type": "recharge",
      "priority": 90
    },
    {
      "id": "promo_host_lounge",
      "title": "Host Spotlight",
      "headline": "Top Rated Hosts 🌟",
      "subtitle": "Connect with verified listeners in Hindi & English",
      "badge_text": "POPULAR",
      "gradient_colors": ["#F59E0B", "#D97706", "#B45309"],
      "action_type": "none",
      "priority": 80
    },
    {
      "id": "promo_privacy_shield",
      "title": "100% Anonymous",
      "headline": "Zero Phone Sharing 🛡️",
      "subtitle": "End-to-end encrypted anonymous voice calls",
      "badge_text": "PRIVATE & SAFE",
      "gradient_colors": ["#6366F1", "#4F46E5", "#4338CA"],
      "action_type": "none",
      "priority": 70
    }
  ]'::jsonb,
  true
)
on conflict (key) do update set
  value = excluded.value,
  is_active = excluded.is_active,
  updated_at = now();

