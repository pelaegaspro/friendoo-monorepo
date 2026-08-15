-- Supabase source of truth for CRM operational configuration documents.
create table if not exists public.crm_configuration_documents (
  id text primary key check (char_length(trim(id)) between 1 and 120),
  payload jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_configuration_documents_updated_at_idx
  on public.crm_configuration_documents(updated_at desc);

alter table public.crm_configuration_documents enable row level security;

drop policy if exists "admins manage CRM configuration documents" on public.crm_configuration_documents;
create policy "admins manage CRM configuration documents"
  on public.crm_configuration_documents
  for all
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin'::public.app_role)
  with check ((select role from public.profiles where id = auth.uid()) = 'admin'::public.app_role);

create or replace trigger crm_configuration_documents_updated_at
before update on public.crm_configuration_documents
for each row execute function public.set_friendoo_operational_updated_at();
