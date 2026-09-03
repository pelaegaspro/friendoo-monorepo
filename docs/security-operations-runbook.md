# Friendoo Security Operations Runbook

## Purpose

This runbook covers operational controls that complement the application-level hardening in the Friendoo repository. It must be followed before deploying migrations `20260826_000027_security_observability_and_webhook_replay.sql` through `20260827_000032_staging_security_alert_monitoring.sql`, or the corresponding Edge Function and portal revisions.

## Required Secrets and Configuration

| Environment variable | Requirement | Purpose |
| --- | --- | --- |
| `ADMIN_SESSION_SECRET` | At least 32 random characters; unique per environment | Signs short-lived Admin Portal sessions. |
| `CRM_SESSION_SECRET` | At least 32 random characters; unique per environment | Signs short-lived CRM sessions and Edge Middleware validation. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server/Edge Function secret only; never public or client-side | Required for explicitly privileged operations. |
| `OPERATIONAL_ADMIN_PROFILE_ID` | Existing active profile with database role `admin` | Auditable actor for server-side administrative operations. |
| `APP_ALLOWED_ORIGINS` | Optional comma-separated HTTPS origin allowlist | Adds approved browser origins to Edge Function CORS responses. |
| `CASHFREE_ENVIRONMENT` | `sandbox` on staging and `production` only on production | Selects the appropriate Cashfree credential pair. |

Do not place any of these values in Flutter assets, `NEXT_PUBLIC_*` variables, client-side source, GitHub repository secrets exposed to pull requests, or browser storage.

## Required Deployment Order

Apply database changes to the isolated staging backend first, in this order:

1. Apply `20260826_000027_security_observability_and_webhook_replay.sql`.
2. Apply `20260826_000028_profile_mutation_allowlist.sql`.
3. Apply `20260826_000029_host_mutation_allowlist.sql` after confirming every client availability/language write uses the new RPCs.
4. Apply `20260826_000030_legacy_rpc_execution_least_privilege.sql` and verify administrative, financial, reconciliation, promotion, analytics, and settlement RPCs have no `anon` or `authenticated` execution grant unless the function enforces caller ownership through `auth.uid()`.
5. Apply `20260826_000031_banner_ads_and_ad_event_authorization.sql` and verify forced RLS, no direct client DML on `banner_ads`, no email-pattern administrator policy, and authenticated-only `record_ad_event` validation for active ads and allowed event types.
6. Apply `20260827_000032_staging_security_alert_monitoring.sql` to Backend 2 only. It creates forced-RLS, service-role-only alert rules and a deduplicated alert queue for Cashfree webhook failures, replay rejections, payment confirmation rejections, payment confirmation failures, and failed webhook ledger records.
7. Deploy the updated shared HTTP helper with `payment-create`, `payment-confirm`, `cashfree-webhook`, `call-initiate`, `call-accept`, `call-end`, `agora-token`, `videosdk-token`, and the disabled/fail-closed `payu-webhook` revision as one compatibility set.
8. Configure the required secrets and the staging Cashfree webhook URL.
9. Deploy Admin and CRM only after their `SUPABASE_SERVICE_ROLE_KEY`, operational actor, and dedicated session secrets are present. Both portals require Next.js 16.3.3, strict ESLint CLI configuration, and `proxy.ts` session enforcement that is compatible with the Edge runtime.
10. Verify one valid sandbox payment, an unpaid redirect, an invalid signature, an oversized webhook, an exact duplicate webhook event, an unauthorised host availability update, a valid host availability/language update, denied direct banner-ad modification, accepted authenticated ad-event recording only for an active ad and allowed event type, and an alert-queue record for every induced payment/webhook failure signal.
11. Inspect `webhook_events`, `security_audit_events`, and `staging_security_alerts` to confirm one immutable processing record, one settlement only, and deduplicated open alert records.
12. Promote only after the same checks pass in a production-equivalent controlled window.

## Monitoring and Alerting

Backend 2 staging includes a protected, database-backed alert queue. It is not an external notification channel: an alert is generated and retained for operational review, but no email, chat, paging, or webhook delivery occurs until an approved destination and its credentials are configured separately. Do not route provider log drains to an Edge Function in the same Supabase project because that creates a feedback loop. Review open alerts through a service-role operational view or a separately authorised administration surface.

Create alerts from Supabase logs and the `security_audit_events` table for the following conditions:

| Signal | Threshold | Response |
| --- | --- | --- |
| `cashfree.webhook.failed` | Any production event | Investigate the order and replay only after validating the provider state. |
| `cashfree.webhook.duplicate` | Spike above normal baseline | Inspect provider retries and ensure wallet transactions remain unique. |
| `cashfree.confirm.rejected` | Repeated events per user/order | Review for client tampering or provider-state mismatch. |
| Privileged portal authentication failures | Repeated failures from a source | Rate-limit at the edge and investigate the account/source. |
| Missing service/session secret | Any deployment/runtime failure | Stop deployment; configure dedicated secrets rather than adding fallbacks. |
| Alert queue backlog | Any open high-severity alert older than 15 minutes | Acknowledge, investigate the linked source event, and resolve only after remediation. |
| CI dependency audit failure | Any high-severity production dependency | Patch, replace, or explicitly risk-accept with a documented expiry. |

## Privileged Account Controls

Enable MFA for GitHub organization owners, Supabase owners, Cloudflare administrators, Cashfree administrators, email administrators, and application administrators. Use distinct named accounts; do not share credentials. Protect production deployment environments and restrict who can approve them.

For the current Friendoo Supabase organization, organization-wide MFA enforcement is unavailable on its Free plan. Each Supabase organization owner must therefore enroll a TOTP factor directly in their account and retain a separately stored recovery factor. Organization-wide enforcement can be enabled only after the organization is on a supported paid plan and an MFA-enrolled owner enables it in organization security settings. Do not claim organization enforcement is active until that owner-held action is verified.

## Backups and Restore Tests

Enable provider backups for Supabase and export any application configuration required to reconstruct the service. At least quarterly, perform a documented restore to an isolated project, run an authenticated smoke test, and record the recovery time and data-point objective. A backup is not accepted as validated until the restore test completes.

On the current Supabase Free plan, an isolated provider-backup restore is not available. Do not substitute a schema-only branch, a migration replay, or a local synthetic database for a backup-restore drill. Record this as **not verified** until a paid plan with physical backups is available and a restore-to-new-project test has completed. Free-plan readiness work is limited to retaining migration history, deployment manifests, runbooks, and non-destructive authenticated checks.

## Release Checklist

Before release, verify that the CI action commit pins remain current, the production dependency audit passes, the Admin and CRM Next.js build, TypeScript, and strict ESLint CLI checks pass, response security headers are present on both portals, database migrations are applied in sequence, legacy privileged RPC grants are restricted as designed, direct banner-ad writes remain denied, Edge Function JWT/signature modes are correct, Cashfree production credentials are scoped only to production, host availability/language changes are authorised only through their RPCs, and no secrets or personal data were added to source control.
