# Friendoo Architecture Audit and Regression Matrix (Superseded)

> Superseded by [Friendoo Current Architecture Audit](friendoo-current-architecture-audit.md).
> The old native Android/Firebase tree is legacy, not an active production path;
> the current architecture uses Flutter and two intentionally separate Supabase
> projects.

Audit date: 2026-08-26

Scope: read-only inventory of the existing repository before further feature or
bug changes. Existing working-tree changes were preserved and are not treated
as audit conclusions unless verified from source.

## Executive findings

1. The repository contains two materially different application/backend paths:
   - `Friendoo/`: native Android/Kotlin with Firebase Auth, Firestore, Storage,
     Firebase callable/HTTP Functions, Cashfree, and Agora.
   - `flutter_app/`: Flutter/Riverpod with Supabase Auth, Postgres/RLS,
     Supabase Edge Functions, Cashfree, Agora, and VideoSDK with Agora fallback.
2. The Firebase and Supabase schemas are not the same. Firebase uses collections
   such as `users`, `hosts`, `calls`, and `transactions`; Supabase uses tables
   such as `profiles`, `hosts`, `calls`, `wallets`, `wallet_transactions`, and
   `payment_orders`.
3. Financial authority is implemented server-side in both paths, but duplicated
   implementations create migration, deployment, and behavior-drift risk.
4. The existing test inventory is strongest around Supabase/domain regressions.
   Firebase rules, native Android lifecycle, real payment, real Agora, and
   production Supabase integration coverage are not demonstrated by the local
   test suite.
5. `supabase db push` is currently operationally blocked by remote migration
   history that contains versions missing from the local migration directory.
   This must be resolved deliberately; do not repair migration history blindly.

## Dependency map

### Native Android path

```text
Compose screens / Activities
  -> ViewModels
  -> repositories and use cases
  -> FirebaseAuth / Firestore / Storage / Firebase Functions
  -> Cloud Functions and scheduled Tasks
  -> Firestore collections, FCM, Cashfree, Agora
```

Key locations:

- Entry/navigation: `Friendoo/app/src/main/java/com/friendoo/app/presentation/MainActivity.kt`,
  `presentation/Navigation.kt`, `presentation/home/HomeScreen.kt`.
- Authentication: `presentation/auth/*`, `data/repository/AuthRepository.kt`,
  `data/remote/firebase/FirebaseAuthSource.kt`.
- Discover/hosts: `presentation/discover/*`, `DiscoverViewModel.kt`,
  `data/repository/HostRepository.kt`, Firestore `hosts`.
- Calls: `presentation/call/*`, `CallViewModel.kt`,
  `data/repository/CallRepository.kt`, `domain/usecase/InitiateCallUseCase.kt`,
  `core/agora/AgoraManager.kt`, Functions `calls/callEngine.ts` and
  `calls/callBilling.ts`.
- Wallet/payments: `presentation/wallet/*`, `WalletViewModel.kt`,
  `data/repository/WalletRepository.kt`, `core/payment/CashfreeManager.kt`,
  Firebase Functions `wallet/*`.
- Host earnings/withdrawal: `HostWalletRepository.kt`,
  `HostWalletViewModel.kt`, `wallet/payoutFunctions.ts`.
- Persistence/lifecycle: `data/local/UserPreferences.kt`, DataStore,
  `core/lifecycle/AppLifecycleObserver.kt`, FCM service and notification helper.

### Flutter/Supabase path

```text
FriendooApp / AuthGate / Flutter pages
  -> Riverpod providers and controllers
  -> feature repositories/services
  -> Supabase Auth / Postgres RLS / Realtime / Edge Functions
  -> Postgres RPCs and tables
  -> Cashfree, Agora, VideoSDK
```

Key locations:

- Entry/session: `flutter_app/lib/main.dart`,
  `flutter_app/lib/app/friendoo_app.dart`.
- Auth/profile: `features/auth/data/auth_repository.dart`,
  `features/profile/data/profile_repository.dart`.
- Discover/presence: `features/discover/data/host_repository.dart`,
  `features/presence/data/presence_service.dart`.
- Calls: `features/calls/application/call_controller.dart`,
  `features/calls/data/call_repository.dart`, `rtc_audio_service.dart`,
  `videosdk_audio_service.dart`, `agora_audio_service.dart`.
- Wallet/payments: `features/wallet/data/wallet_repository.dart`,
  `presentation/coin_packages_page.dart`, payment method/checkout pages.
- Backend call functions: `supabase/functions/call-initiate`, `call-accept`,
  `call-end`, `call-billing`, `call-reaper`, and `agora-token`/
  `videosdk-token`.
- Backend payment functions: `payment-create`, `payment-confirm`,
  `cashfree-webhook`, `payu-webhook`.
- Authoritative database behavior: `supabase/migrations/`, particularly the
  call/billing, revenue-sharing, withdrawal, and security-hardening migrations.

### User-to-settlement flow

```text
User authenticates
  -> profile/role resolved
  -> discover reads available host
  -> call-initiate creates ringing call and applies server checks
  -> host accepts
  -> Agora/VideoSDK token issued by backend
  -> call becomes active
  -> server billing/reaper evaluates elapsed time and wallet atomically
  -> wallet transaction and host earnings ledger are settled
  -> call ends/refunds/reconciliation run idempotently
  -> host withdrawal is validated and moved to pending/completed/failed
```

The native Firebase path and Flutter Supabase path each implement variants of
this flow. Cross-stack account identity, call IDs, balances, and settlement
behavior are therefore a release-blocking integration concern.

## Sources of truth and audit questions

| State | Current authoritative source | Client direct write? | Main risk / verification needed |
|---|---|---:|---|
| Auth session | Firebase Auth or Supabase Auth, depending on app | No | Two auth systems and persisted-session drift |
| User role/profile | Firestore `users` or Supabase `profiles` | Restricted | Role/cache mismatch across sessions |
| User wallet | Firestore user document or Supabase `wallets` | No in rules/RLS | Must verify no client balance mutation and no cross-user reads |
| Wallet ledger | Firebase `transactions`/`coinTransactions` or Supabase `wallet_transactions` | No | Duplicate provider callbacks and schema divergence |
| Recharge status | Cashfree provider + server payment order/ledger | No | Redirect must never settle; webhook/confirm must be idempotent |
| Call state | Server call document/RPC | No | Firebase and Supabase state machines can diverge |
| Call duration | Backend billing/reaper timestamps | No | Agora callbacks are signals, not billing authority |
| Host earnings | Server settlement ledger | No | Double settlement and refund reversal |
| Withdrawal | Server payout record and provider result | No | Duplicate requests, insufficient balance, retry handling |
| Host availability | Backend host/presence records | Limited/guarded | Presence expiry and app-kill cleanup |
| RTC state | Agora/VideoSDK client plus backend call state | Client signals only | Reconnect/background/termination synchronization |

## Idempotency and concurrency review targets

Server-side idempotency mechanisms are present in the reviewed Firebase wallet,
withdrawal, payment, and call code, and in the Supabase payment/call migrations.
They still require execution tests against the deployed systems.

Mandatory test keys/claims:

- Recharge: same provider order, same provider payment ID, duplicate webhook,
  delayed webhook after client confirmation.
- Call start: same request repeated while ringing; same host locked twice.
- Call end/billing: caller and host end simultaneously; reaper races client end;
  duplicate billing tick; retry after timeout.
- Withdrawal: same idempotency key repeated; two different requests racing for
  the same host balance; provider result replay.
- Profile/presence: logout/login during fetch; app restart with stale local
  profile; heartbeat after process death.

## Regression matrix

Legend: `Present` means a local test or source-level harness exists; `Not
verified` means the behavior is not proven by this audit; `Blocked` means an
environment or deployment prerequisite prevents execution.

| Area | Regression cases | Status |
|---|---|---|
| Authentication | New signup; existing login; logout; login again; invalid credentials; session expiry; account recreation; app restart | Partial / not verified end-to-end |
| Profile | Create; edit; avatar select/persist; logout/login persistence; user load; host load | Partial; avatar/profile tests present |
| Discover | Host load; pagination; refresh; availability; host navigation; offline; empty/loading/error | Partial; source and widget coverage only |
| Wallet | Initial balance; refresh; transaction history; logout/login persistence; cross-account isolation | Partial; wallet/session regressions need integration execution |
| Recharge | Success; failure; cancellation; duplicate callback; killed app; network failure; retry | Partial; payment integrity tests present, provider execution not verified |
| Audio call | Host selection; request; session; token; caller/host join; audio; timer; user/host end; reconnect; route; permissions; background; lock; minimize; recreation; kill; interruption | Not verified on real devices/end-to-end |
| Billing | Exact duration; unit rounding; partial duration; insufficient coins; depletion; duplicate end; duplicate billing; network/backend retry; Agora timing mismatch | Partial source/regression tests; deployed concurrency not verified |
| Earnings | Correct split; multiple calls; duplicate settlement; failure/cancel; refund; persistence | Partial local revenue tests; production execution not verified |
| Withdrawal | Minimum; valid/invalid details; duplicate; insufficient balance; pending/completed/failed; persistence | Source tests/backend code present; deployed provider not verified |
| Security | Cross-wallet read/write; wallet inflation; earnings mutation; fake calls; duration manipulation; double settlement; private data; unauthorized RTC token; role boundary | Firebase rules test harness present; Supabase/RLS and deployed auth matrix not fully executed |
| Lifecycle | Foreground/background; locked; minimized; activity recreation; killed process; network loss/restore; Bluetooth disconnect/reconnect; permission revoke; interruption | Not verified on physical Android lifecycle matrix |
| Cost/operations | Listener disposal; repeated reads; pagination; large documents; function retries; scheduled billing cost | Source audit required; no production telemetry evidence in repo |

## Existing verification inventory

Local tests found:

- Flutter: avatar packs, backend promotions, card input, payment integrity,
  production hardening, profile/avatar persistence, promotional offers,
  revenue split, session navigation, and widget tests.
- Firebase rules: `test/firestore_rules_test.js`.
- Backend scripts: authoritative state machine, Cashfree integration,
  webhook delivery, and real Postgres staging probes.
- Native Android: Maestro directory exists, but a complete executable lifecycle
  result was not established in this audit.

Checks still required:

1. Run all Flutter tests and analyze.
2. Build/test `functions` TypeScript and run backend scripts with safe test
   credentials or emulators.
3. Run Firebase rules tests with the emulator.
4. Run Supabase migrations/RLS tests against a disposable local or staging DB.
5. Execute two-device call/lifecycle tests using the deployed token and billing
   path.
6. Resolve Supabase migration-history drift before treating `db push` as a
   release operation.

## First concrete bug record: cross-session wallet flicker

**Bug ID:** FRND-WALLET-001  
**Feature:** Wallet/discover balance  
**Environment:** Flutter web/Android debug, Supabase session restore  
**Expected:** User `8870947891` consistently sees 1000 coins.  
**Actual:** 1000 appears initially, then changes/blinks to 0.  
**Earliest suspected failure:** stale cached profile/session identity was used
while the authenticated Supabase session was restored; the wallet realtime
subscription also previously used the wrong primary key (`id` instead of
`user_id`).  
**Affected components:** `main.dart`, profile repository, wallet repository,
Riverpod wallet stream.  
**Current mitigation in working tree:** wallet is keyed only by the current
authenticated user; profile loading no longer starts from the previous static
profile; wallet realtime uses `user_id`.  
**Regression needed:** sign in as user, restart, sign out, sign in as host,
restart again, and assert both profile role and wallet ID/balance remain paired;
also assert no intermediate stale-account value is emitted.

## Priority risks

- **P0/P1 architectural:** two backend authorities can produce incompatible
  identity, wallet, call, and settlement semantics.
- **P0 financial:** duplicate payment, call-end, billing, and payout effects
  must be tested against deployed services, not only source-level code.
- **P1 reliability:** native lifecycle/background and RTC reconnection matrix is
  not proven.
- **P1 operations:** Supabase migration history is not aligned with the local
  migration directory, so deployment cannot currently be considered repeatable.
- **P2 cost:** realtime listeners and polling need measured disposal/read counts
  in both stacks.

## Audit status

`DONE_WITH_CONCERNS`: inventory, dependency map, sources-of-truth review, and
regression matrix are documented. No new production code was changed for this
audit. Full integration, security, concurrency, lifecycle, and deployed
payment/RTC verification remain outstanding.
