-- Existing project helper; it may run internally but must not be exposed via the public RPC API.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
