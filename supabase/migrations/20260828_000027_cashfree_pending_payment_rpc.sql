-- Cashfree sandbox/payment-order fix.
-- Creates the missing server-only reservation RPC without changing balances.

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
  select * into v_package
  from public.coin_packages
  where id = p_package_id and is_active = true;

  if not found then
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
