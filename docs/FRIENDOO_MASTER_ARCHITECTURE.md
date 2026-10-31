# Friendoo Master Architecture — Verified Baseline

**Status:** Phase A discovery baseline  
**Date:** 2026-10-31  
**Authority:** Repository evidence; deployed services still require verification.

## 1. Architecture decision record

The repository does not support treating the attachment's native Android/Kotlin + Firebase description as the current authoritative architecture. The current client path is Flutter/Dart with Riverpod and Supabase. Next.js admin and CRM applications also use Supabase. Kotlin/Firebase/GCP materials remain in the monorepo as legacy or parallel artifacts until runtime ownership is proven.

## 2. Systems

### Mobile client

`flutter_app/` is a Flutter application. `main.dart` loads `assets/.env`, initializes Supabase with PKCE, restores local language/session-related preferences, initializes ads, and starts a Riverpod-scoped app. Feature areas include auth, discovery, calls, profile/host application, presence, notifications, support, rewards, ads, and wallet/payments.

### Backend

The preferred backend path is Supabase:

- Postgres schema and functions under `supabase/migrations/`.
- Edge Functions under `supabase/functions/`.
- Supabase Auth for sessions.
- PostgREST for typed table reads and selected writes.
- Realtime for call, wallet, and signaling-related streams.
- Storage for avatars.

The database migrations explicitly state that Edge Functions own money movement, call transitions, and RTC tokens. This is consistent with the security requirement that Android/client state must not authorize billing.

### Admin and CRM

`admin/` and `crm/` are separate Next.js applications. Both use Supabase JavaScript clients. The admin application has dashboard pages and API routes for users, hosts, calls, payments, packages, payouts, reports, support, notifications, advertising, and fraud/surveillance. CRM has user/host/call/revenue/support/fraud/campaign screens and server session helpers.

### Legacy/parallel systems

The repository contains `Friendoo/` Kotlin/Android, `functions/` Firebase Cloud Functions, root Firebase configuration, and older documentation claiming Vite/React/Firebase/Agora. These must be classified as legacy, staging, or active through deployment evidence before modification or removal.

## 3. Call architecture

The server boundary is:

1. Authenticated Flutter client invokes `call-initiate`.
2. Edge Function authenticates the Supabase user and invokes a service-role RPC.
3. RPC locks wallet/host rows, validates wallet/availability/rate, inserts a call and event, and updates presence.
4. Host invokes `call-accept`; the server verifies host ownership and state.
5. Participants observe call rows/events through RLS-protected reads, Realtime, and polling fallback.
6. RTC credentials/signaling are obtained through provider-specific code paths.
7. Client invokes `call-end`; the server serializes terminal state and later billing/reconciliation functions settle balances.

The RTC layer is currently not single-provider: WebRTC with Supabase broadcast signaling and Agora credential acquisition both exist. This is an architectural decision requiring explicit resolution.

## 4. Money movement architecture

Wallet balance and ledger rows are in Postgres. The inspected migrations use row locks, immutable-ish transaction records, unique idempotency keys, and server-side RPCs for call debits, payment credits, refunds, withdrawals, and platform revenue. Cashfree webhook handling validates provider signatures and timestamps, reserves a fingerprint, and calls `credit_friendoo_payment` rather than crediting coins from a client callback.

The platform settings migration currently seeds a 15-coin minimum, five-second grace period, 60/40 host/platform split, and 15-second inactivity threshold. The attachment's 70/30 split is not the value verified in the inspected current migration and must not be applied without a business decision and deployed-data verification.

## 5. Trust boundaries

- Client-provided host IDs, call IDs, payment callbacks, telemetry, balances, rates, and roles are untrusted.
- Edge Functions authenticate requests and use privileged clients only for narrowly scoped server operations.
- Postgres RPCs enforce row locks, participant checks, availability, balance checks, and idempotency.
- RLS protects participant and owner reads.
- Admin/CRM service-role access must be paired with server-derived actor verification on every privileged operation.

## 6. Source-of-truth rules for future work

1. Deployed Supabase schema/policies/functions override migration assumptions.
2. Runtime service wiring overrides unused provider implementations.
3. Server-side ledger and financial settings override client-computed presentation values.
4. Current tests and production behavior override stale README claims.
5. New tables or APIs require an explicit gap and ownership decision; do not duplicate entities already represented by later migrations.
