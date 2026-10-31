-- Migration: 20261101_000043_revenue_split_and_host_languages_sync.sql
-- 1. Create get_platform_revenue_split function to support reconcile_active_call_minutes
-- 2. Grant permissions to service_role and authenticated

create or replace function public.get_platform_revenue_split(
  out o_host_pct numeric,
  out o_plat_pct numeric,
  out o_min_balance integer,
  out o_grace_sec integer,
  out o_inactivity_sec integer,
  out o_rtc_cost_coins numeric,
  out o_payment_fee_pct numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  o_host_pct := 0.60;
  o_plat_pct := 0.40;
  o_min_balance := 5;
  o_grace_sec := 5;
  o_inactivity_sec := 15;
  o_rtc_cost_coins := 0.080;
  o_payment_fee_pct := 0.020;
end;
$$;

revoke all on function public.get_platform_revenue_split() from public, anon;
grant execute on function public.get_platform_revenue_split() to authenticated, service_role;
