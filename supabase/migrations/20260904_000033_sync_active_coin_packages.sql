-- Migration: 20260904_000033_sync_active_coin_packages.sql
-- Synchronizes all active coin packages and aliases between the Flutter client and database.
-- Hardens create_friendoo_pending_payment with multi-tier alias resolution so any client package naming scheme succeeds.

-- 1. Ensure bonus_label column exists on public.coin_packages
alter table public.coin_packages
  add column if not exists bonus_label text;

-- 2. Populate canonical coin packages and legacy catalog aliases
insert into public.coin_packages (id, coins, amount_inr, bonus_label, is_active)
values
  ('pkg_15', 15, 15, '⚡ 1 Min Quick Talk', true),
  ('pkg_25', 25, 25, '⚡ Quick Top-Up', true),
  ('pkg_50', 50, 50, '+6% Extra', true),
  ('pkg_100', 100, 100, '+15% Extra', true),
  ('pkg_140', 140, 140, '+20% Extra', true),
  ('pkg_200', 200, 200, '+25% Extra', true),
  ('pkg_300', 300, 300, '+ Extra 37% Cashback', true),
  ('pkg_500', 500, 500, '+ Extra 40% Cashback', true),
  ('pkg_900', 900, 900, '+ Extra 40% Cashback', true),
  -- Alternate / legacy aliases for backward compatibility
  ('base_15', 15, 15, '⚡ 1 Min Quick Talk', true),
  ('base_25', 25, 25, '⚡ Quick Top-Up', true),
  ('base_50', 50, 50, '+6% Extra', true),
  ('base_100', 100, 100, '+15% Extra', true),
  ('offer_140', 140, 140, '+20% Extra', true),
  ('offer_200', 200, 200, '+25% Extra', true),
  ('offer_300', 300, 300, '+ Extra 37% Cashback', true),
  ('offer_500', 500, 500, '+ Extra 40% Cashback', true),
  ('offer_900', 900, 900, '+ Extra 40% Cashback', true)
on conflict (id) do update set
  coins = excluded.coins,
  amount_inr = excluded.amount_inr,
  bonus_label = excluded.bonus_label,
  is_active = excluded.is_active;

-- 3. Resilient server-authoritative pending payment reservation RPC with alias normalization
create or replace function public.create_friendoo_pending_payment(
  p_user_id uuid,
  p_package_id text,
  p_provider_order_id text
)
returns public.payment_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_package public.coin_packages;
  v_order public.payment_orders;
begin
  -- Step 1: Direct match on active package
  select * into v_package
  from public.coin_packages
  where id = p_package_id and is_active = true;

  -- Step 2: Direct match on any package row by id
  if not found then
    select * into v_package
    from public.coin_packages
    where id = p_package_id;
  end if;

  -- Step 3: Resolve cross-prefix aliases (pkg_ <-> base_ / offer_)
  if not found then
    select * into v_package
    from public.coin_packages
    where (
      (p_package_id like 'pkg_%' and id in (
        replace(p_package_id, 'pkg_', 'base_'),
        replace(p_package_id, 'pkg_', 'offer_')
      ))
      or
      (p_package_id like 'base_%' and id = replace(p_package_id, 'base_', 'pkg_'))
      or
      (p_package_id like 'offer_%' and id = replace(p_package_id, 'offer_', 'pkg_'))
    )
    order by is_active desc, amount_inr
    limit 1;
  end if;

  -- Step 4: Numeric extraction fallback (e.g. pkg_140 -> 140)
  if not found and p_package_id ~ '^(?:pkg|base|offer)_([0-9]+)$' then
    declare
      v_num integer;
    begin
      v_num := (regexp_match(p_package_id, '^(?:pkg|base|offer)_([0-9]+)$'))[1]::integer;
      select * into v_package
      from public.coin_packages
      where (amount_inr = v_num or coins = v_num)
      order by is_active desc, amount_inr
      limit 1;
    end;
  end if;

  if v_package.id is null then
    raise exception 'Invalid or inactive coin package';
  end if;

  insert into public.payment_orders (
    user_id,
    package_id,
    amount_inr,
    coins,
    provider,
    provider_order_id,
    status
  ) values (
    p_user_id,
    v_package.id,
    v_package.amount_inr,
    v_package.coins,
    'cashfree',
    p_provider_order_id,
    'pending'
  )
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.create_friendoo_pending_payment(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.create_friendoo_pending_payment(uuid, text, text)
  to service_role;
