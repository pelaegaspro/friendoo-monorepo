-- Restrict legacy SECURITY DEFINER RPCs to their required trust boundary.
-- User workflows retain authenticated-only access only when their function body
-- independently binds the operation to auth.uid().

revoke all on function public.admin_mutate_promotional_offer(uuid, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.get_offer_campaign_analytics(uuid) from public, anon, authenticated;
revoke all on function public.get_platform_financial_metrics() from public, anon, authenticated;
revoke all on function public.get_platform_revenue_split() from public, anon;
revoke all on function public.reconcile_active_call_minutes() from public, anon, authenticated;
revoke all on function public.redeem_promotional_offer(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.settle_user_time_wasting_reversal(uuid) from public, anon, authenticated;
revoke all on function public.validate_user_offer_eligibility(uuid, uuid) from public, anon, authenticated;
revoke all on function public.complete_initial_profile(text, text) from public, anon;
revoke all on function public.select_initial_avatar(text) from public, anon;
revoke all on function public.initiate_friendoo_call(uuid, uuid, text, text) from public, anon;
revoke all on function public.report_host_silence_violation(uuid, uuid, text) from public, anon;

grant execute on function public.complete_initial_profile(text, text) to authenticated, service_role;
grant execute on function public.select_initial_avatar(text) to authenticated, service_role;
grant execute on function public.initiate_friendoo_call(uuid, uuid, text, text) to authenticated, service_role;
grant execute on function public.instant_start_call(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.ping_friendoo_call_heartbeat(uuid) to authenticated, service_role;
grant execute on function public.report_host_silence_violation(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.get_platform_revenue_split() to authenticated, service_role;

grant execute on function public.admin_mutate_promotional_offer(uuid, text, uuid, jsonb) to service_role;
grant execute on function public.get_offer_campaign_analytics(uuid) to service_role;
grant execute on function public.get_platform_financial_metrics() to service_role;
grant execute on function public.reconcile_active_call_minutes() to service_role;
grant execute on function public.redeem_promotional_offer(uuid, uuid, uuid, text) to service_role;
grant execute on function public.settle_user_time_wasting_reversal(uuid) to service_role;
grant execute on function public.validate_user_offer_eligibility(uuid, uuid) to service_role;
