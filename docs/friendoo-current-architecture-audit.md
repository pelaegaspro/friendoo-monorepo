# Friendoo Current Architecture Audit

Audit date: 2026-08-26  
Status: `DONE_WITH_CONCERNS` — architecture corrected and cleanup inventory
completed; cleanup/build verification remains in progress.

This document supersedes the earlier assumption that Firebase is an active
Friendoo production backend. The active client is Flutter and the active
backend architecture is two intentionally separate Supabase projects.

## Current architecture

```text
Flutter app
  -> Backend 1 Supabase client
  -> Backend 1 Postgres/RLS + Realtime + Edge Functions
  -> VideoSDK primary RTC
  -> Agora fallback only

Flutter Discover promo reader
  -> isolated Backend 2 Supabase public client
  -> Backend 2 public_feature_config only
```

### Database 1 — operational Friendoo backend

- Technology: Supabase Auth, PostgreSQL, RLS, Realtime, Edge Functions.
- Project reference: `gjbhsogarwqkkftzijhf`.
- Purpose: all authenticated and financially authoritative product behavior.
- Tables include `profiles`, `wallets`, `wallet_transactions`, `coin_packages`,
  `payment_orders`, `hosts`, `user_presence`, `calls`, `call_events`, reports,
  notifications, host earnings/payout tables, and CRM/operational tables.
- Read paths: Flutter repositories through `supabaseProvider`; CRM/admin server
  routes through the server Supabase client.
- Write paths: authenticated RPCs/Edge Functions for calls, billing, payment
  settlement, withdrawals, and profile operations; privileged server client for
  admin operations; RLS protects direct client reads/writes.
- Authority: Auth owns identity; Postgres/RPCs own wallet, call, billing,
  earnings, and payout state.

### Database 2 — public Discover configuration backend

- Technology: separate Supabase PostgreSQL project with public/publishable-key
  read access.
- Project reference: `wqoqeljqzknccyeegtxb`.
- Purpose: public Discover promo/banner configuration only.
- Table: `public_feature_config` (the local reference migration defines the
  `discover_promo_items` key and its public payload).
- Read path: `Backend2PromoRepository` via an isolated client with no session
  persistence, no auto-refresh, and no Backend 1 JWT forwarding.
- Write path: operations/admin configuration deployment, not the mobile client.
- Authority: only promo presentation data. It is not authoritative for users,
  hosts, wallets, payments, calls, earnings, or withdrawals.

### Data movement between databases

There is intentionally no operational synchronization. Backend 2 returns public
promo configuration; the Flutter client combines it with a local fallback when
Backend 2 is unavailable. No user, host, wallet, transaction, call, earnings, or
withdrawal record is copied between the databases.

| Entity | DB 1 | DB 2 | Authority | Sync mechanism | Risk |
|---|---|---|---|---|---|
| Users/profiles | Yes | No | DB 1 | None | Wrongly adding DB 2 user data |
| Hosts/availability | Yes | No | DB 1 | None | Public promo must not imply availability |
| Wallet/coins | Yes | No | DB 1 | None | Financial isolation required |
| Transactions/payments | Yes | No | DB 1 | Cashfree webhook/confirm | Duplicate settlement/retry |
| Calls/billing | Yes | No | DB 1 | RTC events to server state | Provider callback mismatch |
| Earnings/withdrawals | Yes | No | DB 1 | Server RPC/provider result | Double payout/settlement |
| Discover promos | No | Yes | DB 2 | Client read + local fallback | Stale marketing content only |

## RTC audit

- Primary: `VideoSdkAudioService`, selected by `RtcProviderType.videosdk`.
- Fallback: `AgoraAudioService`, selected only after VideoSDK join failure.
- Decision point: `CallController._joinAudio`.
- Tokens: `videosdk-token` for primary and `agora-token` for fallback; neither
  token endpoint should expose secret credentials to the client.
- Billing authority: Backend 1 Postgres/RPC/reaper state, never either RTC SDK.
- Required regression: verify VideoSDK initializes first, Agora is not touched on
  success, and failover cannot create a second call or reset billing duration.

## Firebase cleanup inventory

| Location | Classification | Action |
|---|---|---|
| `flutter_app/lib`, `flutter_app/pubspec.yaml` | No active Firebase dependency found | Preserve Supabase implementation |
| `Friendoo/` native Android | Dead legacy Firebase application | Remove after exact-path review |
| `functions/` | Dead legacy Firebase Functions | Remove after exact-path review |
| `admin/lib/firestore`, `admin/lib/firebase*`, old dashboard hooks/routes | Dead/partially migrated admin code | Remove or migrate only affected active routes |
| `admin` current `/admin` routes and `crm` | Active Supabase operations code | Preserve and verify |
| `firebase.json`, `.firebaserc`, rules, Firebase workflows | Dead deployment artifacts | Remove |
| `docs/`, migration source, scripts | Historical/dead references | Retain only if explicitly marked historical; remove executable Firebase paths |

No Firebase compatibility layer should be added. Any remaining reference after
cleanup must be classified as historical documentation or a proven dead artifact.

## Regression priorities

### P0 — financial/security

- Duplicate Cashfree webhook/confirmation must credit once.
- Duplicate call-end/billing/reaper races must settle once.
- Wallet, ledger, earnings, and payout operations must remain server-authoritative.
- RLS must prevent cross-user wallet/private-call access and direct balance writes.

### P1 — core product

- Auth/session restoration must pair the current user with the current profile and
  wallet.
- VideoSDK primary call path must work; Agora fallback must preserve one session.
- App kill/background/network reconnect must not orphan or overbill calls.
- Supabase migration history must be deployable and repeatable.

### P2/P3

- Discover promo staleness/fallback, loading states, and UI polish.

## Verification plan

- Flutter: `flutter analyze`, full `flutter test`, device call/lifecycle tests.
- Backend: Supabase Edge Function type checks and deployed RPC/RLS probes.
- Admin/CRM: production Supabase build and route tests.
- Security: authenticated/unauthenticated RLS matrix, direct mutation attempts.
- Concurrency: duplicate payment, duplicate termination, reaper races.
- RTC: VideoSDK success/failure, Agora fallback, reconnect, audio route,
  background, screen lock, and process death.

## Known blockers

- Local Firebase Jest dependencies are not installed; those tests are obsolete
  once Firebase cleanup is complete and should not be used as production proof.
- The local Firebase Functions package is obsolete and should not be deployed.
- Earlier `supabase db push` reported remote migration versions missing locally;
  migration history must be reconciled deliberately before deployment.

## Cleanup update

The following proven-dead Firebase-only admin/deployment artifacts were removed:

- Legacy admin dashboard routes, components, hooks, Firebase auth/client/server
  adapters, and Firestore repositories.
- Root Firebase deployment configuration, Firestore/Storage rules, and legacy
  Android/Firebase CI workflows.
- CRM Firebase Admin adapter and Firebase-specific type/configuration text.

The native `Friendoo/` Android tree and `functions/` Firebase backend remain in
the working tree as explicitly classified legacy source, because deleting those
large directories would be a separate destructive cleanup operation. They are
not referenced by the active Flutter, admin, CRM, or Supabase runtime paths.

# FORENSIC REVIEW

Review date: 2026-08-26

## P0 ERRORS

1. `admin/lib/admin/data.ts:426-433` falls back from the protected
   `admin_adjust_wallet` RPC to an unconditional wallet upsert that sets the
   balance to `amountCoins`, and still returns success. An RPC outage can erase
   the existing balance; the fallback also bypasses the ledger.
2. `crm/app/api/crm/users/addCoins/route.ts:27-50` performs a read/compute/write
   wallet mutation followed by a separate ledger insert, ignores both write
   errors, has no idempotency key, and selects nonexistent `wallets.id` (the
   table primary key is `user_id`). Concurrent requests can overwrite balances,
   duplicate ledger entries, or leave wallet and ledger inconsistent.
3. Both `admin/lib/supabaseServer.ts:50-55,84-99` and
   `crm/lib/supabaseServer.ts:50-55,84-99` can use a mock client and allow an
   admin check to pass when Supabase configuration or the verification query is
   unavailable. This makes privileged routes report successful mutations in a
   misconfigured or degraded deployment.

## P1 ERRORS

1. `flutter_app/lib/app/friendoo_ui.dart:3078-3084` derives the displayed
   `FRND-xxxx` identifier from `profiles.phone`, while
   `profile_repository.dart:71-74` prefers that database phone over the
   authenticated phone. A stale/mismatched profile phone therefore shows the
   wrong ID, matching the `7604991136`/`FRND-9482` symptom.
2. `flutter_app/lib/features/discover/data/host_repository.dart:57-87` selects
   `is_star`, `gender`, and `languages` from `hosts`, but the active core schema
   defines none of those columns (`supabase/migrations/20260815_000001_friendoo_core.sql:33-42`).
   Both the primary and fallback queries can fail, producing an empty Discover
   host list.
3. The realtime test-account migration inserts the same nonexistent host
   columns at `supabase/migrations/20260826_000027_seed_realtime_test_accounts.sql:63-72`.
   It is labelled development-only, but if applied, the migration fails rather
   than provisioning the requested test host.
4. `wallet_repository.dart:90-103` and its stream setup convert any Supabase,
   RLS, schema, or network failure into a valid-looking zero balance. This is a
   direct cause of the reported 1000/140/0 blinking behavior and hides the
   actual backend fault.
5. `host_repository.dart:94-115`, `presence_service.dart:59-88`, and
   `call_repository.dart:129-166` prefer the static cached profile ID over
   `auth.currentUser.id`. After account switching/session restoration, writes
   and subscriptions can target the previous account. Errors are commonly
   swallowed, making the mismatch difficult to detect.
6. The active schema policy `authenticated users can view profiles` uses
   `using (true)` at `supabase/migrations/20260815_000001_friendoo_core.sql:205-206`.
   This exposes every profile row, including phone numbers and ban state, to
   every authenticated user. That is broader than the public discovery data
   requirement.
7. The repository still cannot be safely deployed with `supabase db push`:
   the remote project reports migration versions missing locally. The local
   `000027` test seed is also not executable against the active schema.

## P2 ERRORS

1. `videosdk-token` and `agora-token` correctly authorize call participants,
   but VideoSDK tokens live for 24 hours (`videosdk-token/index.ts:8-17`) while
   Agora tokens live for one hour. The lifetime is unnecessarily broad for a
   single call and increases replay exposure if a token leaks.
2. `call_controller.dart:247-271` catches every VideoSDK join failure and
   switches to Agora. The requested fallback exists, but the failed provider is
   not explicitly left/disposed before the fallback join; this needs a device
   test for duplicate audio sessions and route leaks.
3. `profile_repository.dart:76-93`, call streams, presence, and host writes
   swallow backend errors. The UI can display synthetic profile/empty-call/
   offline states instead of an actionable failure.
4. Root `README.md`, `docs/TESTING.md`, `docs/index.html`, `public/index.html`,
   `public/docs/*`, and several infrastructure documents still describe or
   execute Firebase. They are not referenced by the active Flutter/Supabase
   path, but executable static pages and the `Friendoo/`/`functions/` trees are
   dead deployable artifacts and should not remain ambiguous.

## P3 ERRORS

1. The obsolete Firebase Jest test harness (`test/firestore_rules_test.js`) and
   Firebase Functions package are not runnable in the current environment and
   test a removed backend.
2. Flutter `production_hardening_test.dart` and `revenue_split_test.dart` mostly
   test local constants and toy in-memory models, not Postgres transactions,
   RLS, Edge Functions, Cashfree signatures, or concurrent requests.

## CODE-LEVEL ERRORS

| FILE/LINE | PROBLEM | WHY | IMPACT | FIX |
|---|---|---|---|---|
| `flutter_app/lib/app/friendoo_ui.dart:3078-3084` | Public ID uses DB phone | DB profile phone may be stale | Wrong user identity shown | Derive display identity from the current authenticated user and reconcile profile data server-side |
| `flutter_app/lib/features/discover/data/host_repository.dart:57-87` | Invalid host columns | Columns are absent from the active schema | Discover shows no hosts | Align query/model/migration schema and surface query errors |
| `flutter_app/lib/features/wallet/data/wallet_repository.dart:90-103` | Any read error becomes zero | Failure is indistinguishable from a real zero balance | Blinking/false zero and unsafe call decisions | Preserve error state; only render zero for a confirmed empty wallet |
| `admin/lib/admin/data.ts:426-433` | Unsafe financial fallback | Direct overwrite is not atomic or auditable | Balance loss/inflation | Fail closed and use the server RPC only |
| `crm/app/api/crm/users/addCoins/route.ts:27-50` | Non-atomic direct wallet mutation | Read/compute/write races and no ledger transaction | Financial inconsistency | Use the audited idempotent RPC and check every result |
| `admin/lib/supabaseServer.ts:53-55,97-99` | Mock/allow-on-error admin behavior | Misconfiguration becomes apparent success | Privileged operations can be unaudited or fake | Fail closed in non-test deployments |

## ARCHITECTURAL / SECURITY / FINANCIAL / RTC / DATABASE ERRORS

- The intended RTC ownership is correct: VideoSDK is selected first and Agora
  is fallback; billing remains in Supabase functions/RPCs. The missing proof is
  provider-failure lifecycle testing, not an observed provider-specific billing
  path.
- Wallet settlement RPCs use row locks/idempotency, but the admin and CRM
  mutation paths bypass that guarantee in their fallbacks/direct route.
- Database 1/Database 2 isolation is present in the active Flutter code; no
  user, host, wallet, call, or payment synchronization into Database 2 was
  found.
- RLS protects wallet rows from ordinary cross-user reads/writes, but the broad
  profile select policy exposes private profile fields.

## TESTING GAPS

- No executed Supabase production RLS matrix for anonymous, user, host, admin,
  and cross-user access.
- No deployed Edge Function tests for duplicate Cashfree webhook,
  payment-confirm, call-end, billing, reaper, or refund races.
- No real two-device VideoSDK-success/Agora-fallback test with app background,
  process death, reconnect, and audio-route changes.
- Existing named production tests provide false confidence because several only
  assert source text or local toy arithmetic.

## FALSE CLAIMS

| CLAIM | ACTUAL | EVIDENCE |
|---|---|---|
| Firebase is the active production backend | Active Flutter runtime uses Supabase; Firebase remains in dead native/functions/static artifacts | `flutter_app/lib/main.dart:15-22`; Firebase scan of `Friendoo/`, `functions/`, `public/` |
| Wallet mutations are universally server-authoritative | Core payment/call RPCs are server-authoritative, but admin fallback and CRM add-coins route mutate wallets directly | `admin/lib/admin/data.ts:426-433`; `crm/app/api/crm/users/addCoins/route.ts:27-50` |
| Deterministic realtime test accounts are provisioned | The seed migration references absent `hosts` columns and cannot complete | `supabase/migrations/20260826_000027_seed_realtime_test_accounts.sql:63-72`; core schema `:33-42` |
| Production hardening tests prove production safety | Most tests use local constants, source-string assertions, or in-memory sets | `flutter_app/test/production_hardening_test.dart:3-19`; `payment_integrity_regression_test.dart:17-26` |

## SAFE ITEMS

- No active Firebase import/dependency was found in Flutter application code,
  active admin routes, CRM routes, or Supabase functions.
- RTC token endpoints do not return provider secrets and verify that the caller
  is a call participant (`videosdk-token/index.ts:67-75`, `agora-token/index.ts:22-30`).
- Cashfree webhook signature and timestamp checks are implemented
  (`cashfree-webhook/index.ts:33-52`).
- Payment credit and host-silence refund RPCs contain locking/idempotency
  safeguards, subject to deployment-history reconciliation.

## FINAL VERDICT

CRITICAL_PRODUCTION_RISK

# REMEDIATION LOG

## PASS 1

STATUS: PARTIAL_PASS_COMPLETE

ROOT CAUSE: Admin and CRM manual coin-credit paths had direct wallet mutation
fallbacks; CRM also used a read/compute/write sequence and ignored mutation
errors.

FILES CHANGED:

- `admin/lib/admin/data.ts`
- `admin/lib/supabaseServer.ts`
- `admin/app/api/admin/users/addCoins/route.ts`
- `admin/app/admin/(panel)/users/page.tsx`
- `crm/app/api/crm/users/addCoins/route.ts`
- `crm/app/crm/users/page.tsx`
- `crm/lib/supabaseServer.ts`
- `flutter_app/test/payment_integrity_regression_test.dart`

FIX: Both paths now use the existing atomic `admin_adjust_wallet` RPC, require
and propagate an idempotency key, and fail instead of overwriting balances or
pretending a failed mutation succeeded. The RPC remains the sole authoritative
financial operation.

TESTS ADDED/UPDATED: Added regression assertions that admin and CRM manual
credits contain no direct wallet/ledger fallback and require the audited RPC.

TEST RESULTS: Targeted Flutter payment-integrity tests passed (8 tests). Admin
production build passed. CRM production build passed. `git diff --check`
reported no whitespace errors.

REGRESSION RESULT: PASS for the corrected application paths. Real Supabase
concurrency, RLS, and failure/retry execution remains blocked by migration
history reconciliation and was not falsely marked passed.

REMAINING RISK: Other wallet-read error semantics, schema/discover defects,
identity mismatch, and Firebase cleanup remain for later controlled passes.

# PASS 2 — WALLET ERROR SEMANTICS

STATUS: PASS_WITH_INTEGRATION_BLOCKER

ROOT CAUSE: `WalletRepository.fetchCurrentWallet` returned a zero-valued
`WalletSnapshot` for unauthenticated sessions, missing rows, query exceptions,
and malformed responses. The realtime stream also fell back to a prior snapshot
when setup failed. Wallet UI components independently used `?? 0`, and the
wallet view displayed a fabricated `50 Coins` value on provider error.

AFFECTED FILES:

- `flutter_app/lib/features/wallet/data/wallet_repository.dart`
- `flutter_app/lib/app/friendoo_app.dart`
- `flutter_app/lib/app/friendoo_ui.dart`
- `flutter_app/lib/features/wallet/presentation/coin_packages_page.dart`
- `flutter_app/lib/features/calls/presentation/live_call_overlay.dart`
- `flutter_app/test/wallet_error_semantics_test.dart`

EXACT BEHAVIOR CHANGED: A confirmed database row with `coin_balance = 0`
continues to produce valid zero data. Missing authentication, missing wallet
rows, query/realtime failures, and malformed balances now produce
`WalletUnavailableException`, which propagates through Riverpod as an error.
Affected displays show loading/unavailable states instead of zero or a fake
balance. Call-time UI no longer treats an unavailable wallet as zero talk time
or auto-ends solely because the read failed.

TESTS ADDED: Valid zero balance, valid non-zero balance, malformed response,
explicit unavailable state, and restoration to a real balance are covered in
`wallet_error_semantics_test.dart`.

TEST RESULTS: Wallet semantic tests and payment-integrity tests passed (13
tests total). Full Flutter regression suite passed (89 tests). Affected Flutter
analysis produced no compile errors; existing warnings/infos remain. No wallet
mutation architecture was changed.

REGRESSION RESULT: PASS for repository parsing and provider-facing semantics.

REMAINING SUPABASE INTEGRATION BLOCKER: Live query failure, timeout,
authentication, RLS, realtime reconnect, and refresh-after-error tests remain
blocked because the remote Supabase migration history does not match the local
migration set. No claim of integration or concurrency coverage is made.
