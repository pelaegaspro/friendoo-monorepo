-- Keep only host metadata that is actually read and edited by the app.
-- Presence is authoritative in public.user_presence; star status is derived
-- by the client quota rule and is not persisted here.

alter table public.hosts
  add column if not exists gender text,
  add column if not exists languages text[];
