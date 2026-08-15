# Friendoo Supabase Migration Patch Bundle

This bundle preserves the Supabase CRM/Admin migration work while the local desktop connection is unavailable. It contains deterministic Node.js patch scripts that write the migrated route files into an existing Friendoo workspace, plus the local migration history file for the **already-applied** `crm_configuration_documents` table.

> The patch files contain **no credentials**. Keep `SUPABASE_SERVICE_ROLE_KEY` and `AGORA_APP_CERTIFICATE` out of Git and out of Flutter client code.

## Apply later on the local workspace

From the root of the local Friendoo repository, copy the `scripts/supabase-migration-patches/` folder from this Git revision and run the scripts in this order:

```powershell
node scripts/supabase-migration-patches/mark_admin_dynamic.js .
node scripts/supabase-migration-patches/fix_admin_client_directive.js .
node scripts/supabase-migration-patches/migrate_admin_reports_supabase.js .
node scripts/supabase-migration-patches/add_admin_payout_provider_result.js .
node scripts/supabase-migration-patches/fix_crm_login_lint.js .
node scripts/supabase-migration-patches/migrate_crm_campaigns_supabase.js .
node scripts/supabase-migration-patches/fix_crm_campaign_list_lint.js .
node scripts/supabase-migration-patches/migrate_crm_support_fraud_supabase.js .
node scripts/supabase-migration-patches/fix_crm_read_route_imports.js .
node scripts/supabase-migration-patches/migrate_crm_remaining_core_routes.js .
node scripts/supabase-migration-patches/fix_crm_remaining_read_imports.js .
```

The scripts assume that the preceding Supabase operational foundation is already present locally: `supabaseServer.ts` for both panels, `@supabase/supabase-js` in both panel manifests, and the operational migration `20260816_000007_crm_admin_odoo_operations.sql`. Those changes are already installed in the active local Friendoo workspace described in this task.

The new migration `20260816_000008_crm_configuration_documents.sql` was successfully applied to the live project **gjbhsogarwqkkftzijhf** and is included for local migration-history parity. Do not reapply it manually to the same live project.

## Validation after local synchronization

Run the following commands locally after pulling the commit and applying the patch scripts:

```powershell
cd admin; npm run build
cd ..\crm; npm run build
```

The migration scripts replace Firebase access for Admin reports, campaign operations, support tickets, fraud alerts, CRM configuration, direct messages/offers, user journeys, revenue statistics, user lists, and wallet-based support coin refunds. The payout provider-result endpoint records before/after audit state through the server-side Supabase RPC workflow.
