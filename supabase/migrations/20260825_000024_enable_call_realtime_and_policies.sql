-- Friendoo Migration: Enable realtime publication and RLS policies on calls table for instant host ringing

-- 1. Enable RLS on calls
alter table public.calls enable row level security;

-- 2. Drop existing restrictive policies if any and allow authenticated / anon test calls
drop policy if exists "calls_select_policy" on public.calls;
drop policy if exists "calls_insert_policy" on public.calls;
drop policy if exists "calls_update_policy" on public.calls;

create policy "calls_select_policy" on public.calls
  for select
  using (true);

create policy "calls_insert_policy" on public.calls
  for insert
  with check (true);

create policy "calls_update_policy" on public.calls
  for update
  using (true);

-- 3. Add public.calls to supabase_realtime publication
alter publication supabase_realtime add table public.calls;

-- 4. Enable replica identity full for real-time streams
alter table public.calls replica identity full;

-- 5. Helper function for instant test call creation with security definer
create or replace function public.instant_start_call(
  p_caller_id uuid,
  p_host_id uuid,
  p_call_type text default ''audio''
)
returns public.calls
language plpgsql
security definer
as $$
declare
  v_call public.calls;
  v_channel text;
begin
  v_channel := ''friendoo_'' || gen_random_uuid()::text;
  
  insert into public.calls (
    id, caller_id, host_id, call_type, status, rtc_channel, rate_per_minute
  ) values (
    gen_random_uuid(), p_caller_id, p_host_id, p_call_type::public.call_type, ''ringing'', v_channel, 5
  ) returning * into v_call;
  
  return v_call;
end;
$$;
