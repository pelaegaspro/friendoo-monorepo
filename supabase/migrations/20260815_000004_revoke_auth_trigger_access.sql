-- The auth trigger runs as the database owner; API clients must never invoke it.
revoke all on function public.handle_new_user() from public, anon, authenticated;
