# Gemini prompt: Explain Friendoo end to end

Copy everything between the prompt delimiters below into Gemini while the Friendoo repository is available to it.

--- BEGIN SINGLE PROMPT ---

You are a senior software architect, product engineer, and technical educator. I need you to understand the **actual Friendoo repository in front of you** and then explain the product and codebase end to end in one comprehensive, coherent response. Do not make code changes. This is an architecture and implementation walkthrough, not a generic product pitch.

## How to investigate

1. Start by inspecting the repository tree, Git state, and the real entry points/configuration for each application. Do not assume that the root README accurately describes the current checkout.
2. Read the current architecture audit and authoritative architecture docs, then verify their claims against source code, package manifests, Supabase migrations/functions, tests, and deployment configuration.
3. Trace important flows through the code rather than inferring them from filenames. At minimum trace authentication/session restoration, onboarding/profile setup, host discovery/presence, call initiation and RTC join/fallback, call termination and billing, coin purchase/settlement, and at least one admin/CRM operation.
4. Use exact repository-relative paths, named functions/classes, and line numbers where available. Link each material claim to its source. Distinguish source-code facts from documentation claims, plans, tests, and inferences.
5. If a doc conflicts with code or another doc, state the conflict, cite both sides, and say what still needs verification. Do not silently reconcile contradictions.
6. Do not expose, copy, or infer secrets, credentials, private keys, signing secrets, access tokens, or sensitive environment-file values. Refer to required variable names only when useful. Never claim that a service is deployed or production-ready solely because code exists.
7. Do not run destructive operations, deploy, or modify files. This request is read-only.

## Product context

Friendoo is an India-focused social audio calling and host marketplace product. Users discover hosts, see availability and profile details, purchase in-app coins, and spend coins on calls. Hosts apply and are reviewed, become discoverable after approval, receive calls, earn a share of call revenue, and can request payouts. The platform also includes user safety/reporting, support, fraud operations, promotions, notifications, and administrative controls.

Explain the product through its three connected journeys:

- **Caller:** sign in → complete profile/onboarding → browse/filter hosts → check availability → recharge wallet → request a call → connect audio → end/report call → review call outcome, wallet, and history.
- **Host:** apply → admin review/approval → maintain profile and availability/presence → receive/accept calls → earn from eligible calls → request/receive payout → remain in good standing.
- **Operations:** review hosts/users/calls/payments/reports/fraud/support → take authorized actions → preserve financial integrity, safety, and an audit trail.

Explain the main actors and trust boundaries: mobile user, host, admin operator, CRM operator, Supabase Auth/Postgres/RLS/RPCs/Edge Functions, payment provider, RTC provider(s), and external notification/ads services. Explain which actions must be server-authoritative and why.

## Repository reality to verify

The likely current runtime topology is:

```text
Flutter mobile app
  ├── Operational Supabase project (auth, Postgres, RLS, Realtime, Edge Functions)
  ├── Separate public-only Supabase project for Discover promo configuration
  ├── VideoSDK and/or Agora/WebRTC RTC services — inspect actual selection and fallback
  ├── Cashfree/payment flows plus any platform billing such as Google Play
  └── ads, permissions, notifications, local preferences

Next.js admin console ── server-side operational Supabase access
Next.js CRM console   ── server-side operational Supabase access

Supabase migrations and Edge Functions ── operational backend

Firebase-era native Android source and Firebase Cloud Functions ── retained legacy
```

This diagram is a hypothesis to validate, not permission to assume. The repository contains several generations and references:

- `flutter_app/` appears to be the active cross-platform client. Its feature code is under `flutter_app/lib/`, tests under `flutter_app/test/`, and app/dependency configuration in `flutter_app/pubspec.yaml`.
- `supabase/migrations/` defines the database evolution; `supabase/functions/` contains server endpoints. Trace the exact database/RPC path for important writes.
- Backend 1 is the operational Friendoo database. Backend 2 is intentionally limited to public Discover promotional/banner configuration. Verify the separation in the provider/repository code and architecture audit. Do not imply Backend 2 contains operational user or financial data.
- `admin/` and `crm/` are separate Next.js applications with separate routes and server-side libraries. Read their manifests rather than repeating possibly stale framework versions from docs.
- `Friendoo/` and `functions/` are retained Firebase-era Android/Cloud Functions source according to the architecture audit. Treat them as legacy unless source references, build/deploy configuration, or current application paths prove otherwise. Do not recommend deploying them as the active backend.
- `firebase-blueprint.json`, APKs, ZIP archives, generated/reference designs, and migration-source folders may be useful historical artifacts, but are not automatically the running product or canonical implementation.
- Root `README.md` and some product handoff/release docs may describe older architectures or unverified statuses. Explicitly identify stale statements, especially claims about a root Vite app, Firebase being the active production backend, or old admin framework versions.
- The repository root may not have a root `package.json`; confirm actual package/build boundaries instead of assuming a single monolithic app.

## Areas your explanation must cover

### 1. Executive summary

In a short opening, explain what Friendoo is, who uses it, how it makes money, and what the repository currently contains. State your confidence and name the biggest uncertainty about what is actually deployed.

### 2. System map and repository guide

Explain each important top-level directory, what owns what, and which parts are active runtime, backend, operations tooling, docs/design/reference, migration support, or legacy. Give useful paths so a new engineer knows where to start. Include relevant entry points and app manifests. Do not enumerate every asset or generated file.

### 3. Mobile app architecture

Explain how `flutter_app/lib/main.dart` initializes the app and how configuration, Supabase, Riverpod, routing, localization, and feature modules fit together. Describe the data/presentation/application boundaries visible in the code. Cover the purpose of the major areas:

- `features/auth/` and onboarding
- `features/discover/` and host/promo data
- `features/presence/`
- `features/calls/` and call controller/repository/RTC services
- `features/wallet/` and payment integrations
- `features/profile/`, host application, blocking/reporting/settings
- notifications, rewards, and ads
- `core/` shared models, config, Supabase providers, permissions, theme, and services

Describe the important application states and UI-to-repository-to-backend paths, citing actual symbols. Explain behavior for loading, errors, permissions, reconnect, app lifecycle, and session restoration where implemented. Clearly label incomplete or unverified behavior.

### 4. Backend and data architecture

Explain the operational Supabase project and the strictly separate public promo project, including the client/provider boundary. Describe the key database concepts found in migrations: profiles, hosts, presence, calls/events, wallets, append-only transactions/ledger, coin packages, payment orders, reports/notifications, host earnings/withdrawals, and admin/CRM operational data. Adjust this list to match the actual schema.

Explain how migrations establish schema, constraints, grants, triggers/RPCs, Realtime policies, and Row Level Security. Identify the authoritative database functions/RPCs used for financial and call-state changes. Explain how Edge Functions authenticate/authorize requests, use privileged server clients, validate inputs, and call database operations. Never infer that a migration has been applied remotely from its presence locally.

Summarize key Supabase Edge Function groups and their responsibilities, including calls/tokens/billing/reaping, Cashfree/payment confirmation/webhooks, Play billing verification if active, host applications, and website-related functions. For each critical flow, show the sequence and identify where idempotency, authorization, and state transitions live.

### 5. End-to-end product flows

Trace these as numbered sequences, from user action through client, network endpoint/repository, database transaction/RPC, external provider, and resulting UI/state:

1. Login and session/profile restoration.
2. Host discovery and online/available state.
3. Call request, host acceptance, RTC token issuance, provider join, realtime updates, and cleanup.
4. Call billing, termination/reaper behavior, ledger/earnings effects, refunds or special outcomes.
5. Coin purchase: order creation → provider checkout → signed webhook/confirmation → idempotent wallet credit → UI refresh.
6. Host application/approval and payout path.
7. User safety report/block and the corresponding operational/admin handling.

For each, include relevant source paths and functions. If the code does not establish a step, say that rather than filling the gap with an assumption.

### 6. Admin and CRM

Explain the difference in purpose and permissions between `admin/` and `crm/`. Cover the Next.js route/page structure, API routes, server/client Supabase boundaries, session/auth handling, and how privileged actions should be protected. Summarize representative workflows: host verification, user management, packages/ads/settings, calls/reports/payments/payouts for admin; analytics, segmentation/journey, support, campaigns, fraud, funnel, and config for CRM. Verify actual features in code; mark docs-only or demo features as such.

### 7. Money, call lifecycle, and safety invariants

Identify the rules that protect users and money, and cite where each is actually enforced:

- server authority for wallet balance, ledger entries, rates, call state, earnings, and payouts
- client-supplied values that must not be trusted
- duplicate/retry/race handling for payment events and call termination/billing
- RLS and role checks for private data and administrative actions
- host eligibility, availability, caller balance gates, and call state transitions
- webhook signature verification, replay/idempotency controls, and provider reconciliation
- reporting/blocking, host moderation, fraud alerts, privacy, and secret handling

Do not repeat thresholds, split percentages, grace periods, or policies from historical docs as facts unless you confirm them in the current migrations/source. If values conflict, list the discrepancy.

### 8. RTC and payment provider decisions

The repository may contain multiple RTC service implementations or different documented choices (VideoSDK, Agora, WebRTC). Trace the runtime provider selection in the current call controller/provider and explain:

- which provider is attempted first in current code
- what conditions trigger fallback
- how the server issues tokens
- how billing remains independent of client RTC timers/events
- whether retry/fallback can create duplicate sessions or reset billing
- what remains to verify on real devices

Also explain the payment routes actually used by the client (Cashfree, UPI, Google Play billing or others) and which endpoint/database ledger owns final settlement. Do not mistake an installed dependency for an active feature.

### 9. Tests, builds, deploys, and operational readiness

Map the available Flutter tests, Supabase function tests, admin/CRM tests, and build/lint commands from manifests and CI/config files. Explain what the tests establish and what they do not. Distinguish local test evidence from live provider, real-device, load, security, or production evidence. Summarize deployment surfaces and required environment variable *names* only as needed; do not reveal values. Flag migration-history or deployment caveats documented in the repo.

### 10. Conflicts, risks, and unknowns

End with a prioritized table:

| Priority | Topic | Verified evidence | Unknown/conflict | How to verify |
|---|---|---|---|---|

Include repository/documentation drift, Firebase legacy leftovers, actual deployed backend/provider selection, migration application state, live payment/webhook routing, RTC device/lifecycle behavior, RLS verification, and feature claims that are only in docs. Do not call something a vulnerability unless you can substantiate it from code; this is an explanation, not a speculative security audit.

## Required response format

Write one standalone, detailed explanation with these sections in order:

1. Executive summary
2. Product model and actors
3. Architecture diagram (Mermaid if supported, otherwise readable ASCII)
4. Repository map
5. Mobile client architecture
6. Backend/database architecture
7. End-to-end flows
8. Admin and CRM
9. Financial, call, and safety invariants
10. Tests/deployment/operational readiness
11. Conflicts and prioritized unknowns
12. “How a new engineer should navigate this repo” — a practical first-read path

Be comprehensive and teach the system to an engineer new to Friendoo. Use clear prose and diagrams where they help, not a raw file dump. Define domain terms such as host, coins, presence, RLS, RPC, Edge Function, RTC, webhook, and idempotency the first time they matter. Cite exact repository-relative paths and symbols throughout. Separate **verified implementation**, **documented intent**, **historical/legacy material**, and **unverified deployment state**. Finish with a compact glossary and a list of the five most important facts a new engineer must not get wrong.

--- END SINGLE PROMPT ---
