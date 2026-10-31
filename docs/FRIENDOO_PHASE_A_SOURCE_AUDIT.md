# Friendoo Phase A — Source Code Audit

**Audit date:** 2026-10-31  
**Scope:** Repository discovery and source-level architecture audit only. No production code or database migration was changed in this phase.

## Executive finding

Friendoo is a mixed monorepo with multiple historical implementations. The currently authoritative product path identifiable from the repository is a Flutter/Dart mobile client using Riverpod and Supabase, backed by Supabase Postgres, Realtime, Edge Functions, and Storage. Separate Next.js 16 admin and CRM applications also target Supabase. The repository additionally contains legacy or transitional Firebase, Kotlin/Android, and Vite/React artifacts. The root README describes the older Firebase/Kotlin/Agora architecture and must not be treated as current runtime documentation without reconciliation.

The attachment describes a native Android/Kotlin + Firebase + GCP + WebRTC + Cashfree system. That description is not consistent with the active Flutter/Supabase implementation found in the repository. The codebase contains both `flutter_webrtc` and `agora_rtc_engine`; the Flutter call repository still invokes an `agora-token` Edge Function, while a substantial `webrtc_audio_service.dart` implements Supabase Realtime signaling. Therefore, RTC provider ownership is currently ambiguous and must be resolved before a production cutover or deletion of legacy paths.

## Evidence inspected

- `flutter_app/pubspec.yaml`: Flutter SDK, Riverpod, Supabase, `flutter_webrtc`, `agora_rtc_engine`, Cashfree SDK, Google Play billing, ads, and routing dependencies.
- `flutter_app/lib/main.dart`: dotenv loading, Supabase PKCE initialization, Riverpod bootstrapping.
- `flutter_app/lib/core/config/app_environment.dart`: Supabase URL/publishable key configuration and fallback behavior.
- `flutter_app/lib/features/calls/data/call_repository.dart`: Edge Function call lifecycle, Agora credential path, Supabase call streams/polling.
- `flutter_app/lib/features/calls/data/webrtc_audio_service.dart`: WebRTC media, Supabase Realtime broadcast signaling, ICE restart, stats, and connection state.
- `flutter_app/lib/features/wallet/data/wallet_repository.dart`: wallet reads, payment-create/payment-confirm, withdrawal RPC, client-side host earnings display.
- `supabase/migrations/20260815_000001_friendoo_core.sql`: core tables, enums, indexes, RLS, storage, and initial policies.
- `supabase/migrations/20260815_000002_friendoo_call_operations.sql`: transactional call RPCs and minute billing primitive.
- `supabase/migrations/20260824_000019_server_authoritative_revenue_sharing.sql`: financial settings, inactivity policy, revenue split, telemetry/reversal logic.
- `supabase/migrations/20260826_000025_security_and_integrity_hardening.sql`: call RLS and mutation hardening.
- `supabase/functions/call-initiate`, `call-accept`, `call-end`: authenticated Edge Function call boundary.
- `supabase/functions/cashfree-webhook`: Cashfree signature, timestamp, fingerprint reservation, and payment RPC path.
- `admin/package.json`, `crm/package.json`, and admin/CRM source inventory.

## Repository inventory

| Area | Location | Verified status |
|---|---|---|
| Flutter client | `flutter_app/` | Active-looking client with Supabase/Riverpod feature modules and tests |
| Admin dashboard | `admin/` | Next.js application with dashboard, users, hosts, calls, payments, payouts, reports, support, fraud, ads, and API routes |
| CRM dashboard | `crm/` | Next.js application with customer/host/call/revenue/support/fraud/campaign screens and Supabase helpers |
| Backend | `supabase/functions/` | Supabase Edge Functions for calls, payments, payouts, host applications, verification, and tokens |
| Database | `supabase/migrations/` | Large ordered migration history with RLS and server-side RPCs |
| Legacy backend | `functions/` | Firebase Cloud Functions package remains in repository; active ownership not proven |
| Legacy Android | `Friendoo/` | Kotlin/Android artifact remains; active ownership not proven |
| Legacy web | root/`src`-style documentation and `public/` | Root documentation claims Vite/React/Firebase/Agora, but root manifests were not found in the bounded inventory |
| Tests | `flutter_app/test/`, `e2e/`, `test/`, function/webhook tests | Present; execution results not yet collected in Phase A |

## Verified runtime architecture

```text
Flutter client
  ├─ Supabase Auth (PKCE)
  ├─ Supabase PostgREST / Realtime / Storage
  ├─ Supabase Edge Functions
  │    ├─ call-initiate / call-accept / call-end / call-reaper
  │    ├─ call-billing / payment-create / payment-confirm
  │    ├─ cashfree-webhook / cashfree-payout-webhook
  │    ├─ agora-token / videosdk-token
  │    └─ host, support, payout, campaign functions
  ├─ WebRTC implementation with Supabase broadcast signaling
  └─ Legacy/parallel Agora integration still present

Admin and CRM Next.js applications
  ├─ HMAC/session helpers and server-side Supabase service-role access
  ├─ privileged API routes and dashboard pages
  └─ shared Supabase database and operational tables

Supabase Postgres
  ├─ profiles, hosts, presence, calls, call_events
  ├─ wallets, wallet_transactions, payment_orders
  ├─ host earnings/payouts and platform ledger
  ├─ CRM/support/fraud/campaign/audit/observability entities
  └─ RLS plus security-definer RPCs
```

## Major discrepancies and risks

### Critical / high priority

1. **RTC provider conflict (High).** `pubspec.yaml` includes both `agora_rtc_engine` and `flutter_webrtc`; `call_repository.dart` requests Agora credentials, `call_controller.dart` pre-warms and joins through Agora services, while `webrtc_audio_service.dart` implements WebRTC signaling. The attachment says WebRTC is current and Agora must not be introduced, but repository evidence shows Agora is on an active call path, not merely a dormant dependency. Resolve the provider decision and trace every runtime service injection before removing or changing anything.
2. **Call state vocabulary drift (High).** The database enum in the core migration is `ringing`, `accepted`, `active`, `ended`, `missed`, `rejected`, while `call_repository.dart` filters incoming calls for `connecting` and `initiated`. Later migrations may add or transform state behavior, but this exact client/database mismatch can hide or mishandle calls unless proven by deployed schema inspection.
3. **Potential signaling exposure/reliability concern (High).** `webrtc_audio_service.dart` contains shared OpenRelay credentials in client code and uses public STUN/TURN configuration. Shared relay credentials are not suitable as a production trust boundary and may create availability, cost, and abuse risks. Production TURN credentials should be short-lived and minted server-side if TURN is required.
4. **Authoritative schema history is non-linear/duplicated (High).** Several migrations redefine the same functions and there are duplicate-looking date/sequence identifiers. Deployment order and the actual deployed schema must be checked before any new migration is authored.
5. **Admin authorization model needs end-to-end verification (High).** CRM server helpers enforce an operational admin profile lookup, but admin API route coverage and actor derivation must be audited route-by-route. A service-role client bypasses RLS; every privileged route must derive and verify the actor server-side rather than trust a request body or UI state.

### Medium priority

6. **Root README is stale (Medium).** It states Firebase, Firestore, Kotlin, and Agora as the primary architecture, while Flutter/Supabase is the active-looking path. This can cause unsafe implementation decisions.
7. **Fallback configuration may conceal misconfiguration (Medium).** `app_environment.dart` returns a hardcoded fallback Supabase URL and a placeholder publishable key when dotenv parsing fails. This is not a service-role secret, but fail-open-ish startup behavior can route a build to an unintended backend or mask a broken release configuration. Production builds should fail closed with an explicit configuration error.
8. **Error swallowing reduces diagnosability (Medium).** Several client repositories and streams catch and discard errors, returning empty data or zero balances. This protects UX from transient failure but can hide authorization, schema, or outage conditions and should be replaced with typed recoverable errors plus telemetry.
9. **Client-side earnings presentation is derived locally (Medium).** `wallet_repository.dart` computes host earnings using `coins * 0.6`. The database contains server-authoritative revenue settings and host ledger entities; display should read authoritative ledger results rather than independently reproducing financial rules.
10. **Unbounded/periodic polling coexists with Realtime (Medium).** Incoming calls, call state, and wallet state use both Realtime and recurring polling. This may be an intentional resilience fallback, but it needs lifecycle, backoff, deduplication, and cost verification.

### Low / documentation debt

11. Root README references directories and integrations not present in the bounded current root inventory.
12. The repository contains APKs, archives, generated output, and scratch folders that complicate source-of-truth discovery and should be explicitly classified.

## Security controls verified

- Supabase Auth is initialized with PKCE.
- Core wallet/call tables have RLS enabled.
- Call initiation, acceptance, and ending go through authenticated Edge Functions and server-side RPCs.
- Core call and wallet RPCs are revoked from anonymous/authenticated direct execution in early migrations; later migrations selectively grant hardened functions.
- Cashfree webhooks validate required headers, HMAC signature, timestamp tolerance, provider identifiers, duplicate fingerprints, and route payment crediting through a database RPC.
- Webhook events and security audit events are modeled in later migrations.
- Wallet and billing paths use row locks and idempotency keys in the inspected migrations.

## Security controls requiring verification

- Actual deployed RLS/policy state versus migration files.
- Whether all admin/CRM privileged actions require a server-derived, authenticated admin actor.
- Whether webhook replay reservation is atomic and whether failed reservations can be safely retried.
- Whether the Agora token function and any RTC token issuer are still reachable and correctly scoped.
- Whether client-visible profile/host/presence fields expose more information than required.
- Whether the open relay credentials remain in release builds and whether TURN service is authorized and monitored.

## Phase A blockers

- No live Supabase project inspection was performed in this phase; deployed schema and function configuration remain unverified.
- No production logs, observability dashboards, provider console, Cashfree account, or GCP/Firebase deployment state was inspected.
- Test and build commands were not yet executed; the next phase should run bounded static analysis and targeted tests after the source-of-truth decision is confirmed.
- The repository has a Git safe-directory ownership mismatch in the current execution identity, so Git history/status cannot be used until the workspace administrator resolves that local trust setting. No Git configuration was changed.

## Phase A conclusion

Do not implement the attachment's proposed Kotlin/Firebase migration or build new CRM entities blindly. The smallest safe next step is to reconcile the active Flutter/Supabase path, remove or formally classify legacy providers, inspect the deployed Supabase schema/policies, then document the authoritative data model and API contracts. Production changes should begin only after that reconciliation.
