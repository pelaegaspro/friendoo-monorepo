-- Friendoo Backend 1 Migration: Register VIP Tester User +918870947891
-- Ensures the phone number +918870947891 is set to user role and has 999,999 coins for testing calls.

do $$
declare
  v_user_id uuid;
begin
  -- Check if auth user already exists for +918870947891
  select id into v_user_id from auth.users where phone in ('+918870947891', '8870947891') limit 1;

  if v_user_id is not null then
    -- Ensure profile role is 'user'
    update public.profiles
    set role = 'user'::public.app_role,
        display_name = 'VIP Tester',
        updated_at = now()
    where id = v_user_id;

    -- Upsert wallet with 999,999 coins
    insert into public.wallets (user_id, coin_balance, is_frozen)
    values (v_user_id, 999999, false)
    on conflict (user_id) do update
    set coin_balance = 999999,
        is_frozen = false,
        updated_at = now();

    -- Add credit transaction record
    insert into public.wallet_transactions (user_id, type, coin_amount, balance_after)
    values (v_user_id, 'credit'::public.wallet_transaction_type, 999999, 999999);
  end if;
end $$;

-- Trigger to auto-grant 999,999 testing coins to +918870947891 on sign up
create or replace function public.auto_credit_tester_phone()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.phone in ('+918870947891', '8870947891') then
    new.role := 'user'::public.app_role;
    insert into public.wallets (user_id, coin_balance, is_frozen)
    values (new.id, 999999, false)
    on conflict (user_id) do update set coin_balance = 999999, updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_credit_tester_phone on public.profiles;
create trigger trg_auto_credit_tester_phone
after insert or update on public.profiles
for each row
execute function public.auto_credit_tester_phone();
