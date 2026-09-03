# Friendoo — MNC-Grade Release Engineering System & QA Specification

> **Engineering Mandate**: For a real-time peer-to-peer paid audio platform, testing cannot be *"run the app, make a call, see if it works"*. The catastrophic risks are **financial leakage, duplicate settlements, state desynchronization, unbilled audio channels, hostile client exploitation, and process termination crashes**.
> 
> **Release Gate Standard**: Passing unit tests alone does NOT grant production release approval. Any failure in a P0 gate results in an immediate **NO RELEASE**.

---

## 1. The Friendoo Release Gate Standard

```text
┌────────────────────────────────────────────────────────┐
│               FRIENDOO P0 RELEASE GATE                 │
├────────────────────────────┬───────────────────────────┤
│ Domain                     │ Status                    │
├────────────────────────────┼───────────────────────────┤
│ P0 Functional              │ PASS (State Machine)      │
│ P0 Security                │ PASS (Signed Tokens/RPCs) │
│ P0 Billing Idempotency     │ PASS (5 Production Gates) │
│ P0 Concurrency             │ PASS (Simulation Tested)  │
│ P0 RTC Audio & Transport   │ PASS (Iris WebRTC/Agora)  │
│ P0 Lifecycle Persistence   │ PASS (Background/Lock)    │
│ P0 Network Recovery        │ PARTIAL (Code implemented)│
│ P0 Real 2-Device E2E       │ PARTIAL (Live test needed)│
│ P0 Payment Integrity       │ PASS (Cashfree Replay)    │
│ P0 Database RLS            │ PARTIAL (Needs live pen)  │
│ P0 Crash / ANR Rate        │ UNKNOWN (Telemetry needed)│
│ P0 Scale & Load (>10k min) │ UNKNOWN (Stress needed)   │
├────────────────────────────┴───────────────────────────┤
│ VERDICT: CONDITIONAL STAGING — NO PRODUCTION RELEASE   │
│ Reason: Real-device E2E, physical carrier handover,    │
│ and production crash telemetry must be completed first.│
└────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Source Code Audit: The 27 QA Domains

| # | Domain | Monorepo Path | Current Status | Verification Evidence / Reason for Downgrade |
| :--- | :--- | :--- | :--- | :--- |
| **01** | **Authentication** | `lib/features/auth/`<br>`supabase/functions/` | **[PARTIAL]** | Fake phone/OTP bypass blocked in `security_hardening_regression_test.dart`. Live carrier SMS delivery rates in India (DND, route latency) remain unmeasured. |
| **02** | **User Profile** | `lib/features/profile/`<br>`profiles` table | **[ENFORCED]** | Verified in `security_hardening_regression_test.dart`: Direct client writes to `is_host` or `coin_balance` fail closed. All updates routed through atomic RPCs. |
| **03** | **Host Profile** | `lib/features/discover/`<br>`hosts` table | **[ENFORCED]** | Verified in `host_rate_integrity_test.dart`: Host rate clamped strictly [3, 100], immune to presence heartbeat overwrites. |
| **04** | **Host Approval/KYC**| `admin_portal/`<br>`host_applications` | **[PARTIAL]** | Admin dashboard approval flow exists, but automated Aadhaar/PAN verification is manual review; no automated fraud OCR guard. |
| **05** | **Host Presence** | `lib/features/presence/`<br>`presence_service.dart` | **[PARTIAL]** | Client heartbeats every 20s. If OS kills app, backend relies on scheduled reaper cron; 30s ghost availability window exists. |
| **06** | **Discovery** | `lib/features/discover/`<br>`host_repository.dart` | **[ENFORCED]** | Verified in `widget_test.dart`: Language filters and VIP Star Host quota allocation tested and stable. |
| **07** | **Call Request** | `lib/features/calls/`<br>`call-initiate/index.ts` | **[ENFORCED]** | Server-authoritative check: User must have $\ge 15$ coins. Direct client API bypass rejected. |
| **08** | **Incoming Call** | `lib/features/calls/`<br>`incoming_host_call_dialog.dart` | **[PARTIAL]** | In-app foreground dialog verified; background device wake when phone screen is locked requires FCM High Priority payload verification on real Android hardware. |
| **09** | **Audio RTC** | `agora_audio_service.dart`<br>`agora-token/index.ts` | **[PARTIAL]** | Token generation and audio transmission work; automated mid-call token renewal added in `agora_audio_service.dart`. Physical microphone echo tests needed on budget devices. |
| **10** | **Call Lifecycle** | `call_controller.dart`<br>`calls` table | **[ENFORCED]** | Verified in `mnc_release_qualification_test.dart`: 10 distinct states with irreversible terminal states (`ended`, `rejected`, `missed`). |
| **11** | **Network Recovery** | `agora_audio_service.dart`<br>`call_controller.dart` | **[PARTIAL]** | Handover detection (`connectionChangedClientIpAddressChanged`) and reconnecting states implemented; physical carrier Wi-Fi ↔ 4G tests pending. |
| **12** | **Android Lifecycle**| `MainActivity.kt`<br>`live_call_overlay.dart` | **[PARTIAL]** | Background and lock states don't cancel session; Android OEM battery optimization (Xiaomi, Samsung aggressive killer) requires native Foreground Service with Ongoing Call notification. |
| **13** | **Wallet** | `wallet_repository.dart`<br>`wallets` table | **[ENFORCED]** | Verified in `wallet_error_semantics_test.dart`: Zero balance preserved, optimistic rollback on failure. |
| **14** | **Billing** | `call-billing/index.ts`<br>`revenue_split_test.dart` | **[ENFORCED]** | Verified in `revenue_split_test.dart`: 60/40 split, <= 5s free grace period, 4-way hangup race idempotency. |
| **15** | **Host Earnings** | `admin/actions/payoutActions.ts`<br>`host_payout_requests` | **[PARTIAL]** | Database ledger and withdrawal requests verified; Decentro production webhook settlement pending banking go-live. |
| **16** | **Refunds** | `supabase/migrations/`<br>`wallets` ledger | **[ENFORCED]** | Gate B of `revenue_split_test.dart`: Compensating reversal for technical audio failure / inactivity verified. |
| **17** | **Payments/Webhooks**| `cashfree-webhook/index.ts`<br>`payment_integrity_regression_test.dart` | **[ENFORCED]** | Verified in `payment_integrity_regression_test.dart`: HMAC SHA256 signature verification, idempotency ledger against replay attacks. |
| **18** | **Notifications** | `notification_repository.dart` | **[PARTIAL]** | In-app notification cards work; push notification delivery across Indian cellular telcos requires APNs/FCM delivery telemetry. |
| **19** | **Reporting/Blocking**| `call_report_bottom_sheet.dart`<br>`reports` table | **[ENFORCED]** | Reporting immediately ends active call and inserts moderation ticket. |
| **20** | **Fraud / Abuse** | `security_audit_events`<br>`crm_backend/` | **[PARTIAL]** | Repeated short-call detection exists in CRM; automated real-time auto-ban trigger is pending threshold tuning. |
| **21** | **Database Security**| Supabase RLS Policies | **[PARTIAL]** | Static code analysis checks RLS presence; dynamic penetration testing with hostile user tokens against all RPC endpoints required. |
| **22** | **Cloud Functions** | `supabase/functions/` | **[ENFORCED]** | Verified in `security_hardening_regression_test.dart`: 16KB body cap, localhost/origin restrictions, service role isolation. |
| **23** | **Performance** | `flutter_app/lib/` | **[PARTIAL]** | Flutter UI profile shows 60fps local rendering; multi-room 10,000 concurrent user load test on backend unperformed. |
| **24** | **Cost / Read Spike** | `call_repository.dart`<br>`mnc_release_qualification_test.dart` | **[ENFORCED]** | Verified in `mnc_release_qualification_test.dart`: Local UI timer, maximum 3 database writes per call. Zero per-second DB amplification. |
| **25** | **Crash & ANR** | `flutter_app/android/` | **[UNKNOWN]** | No automated crashes in tests; production crash-free rate requires integration with Firebase Crashlytics / Sentry. |
| **26** | **Compatibility** | Android 7.0+ (API 24 to 34), Web | **[PARTIAL]** | Verified on Android 14 (phone `f50ec44`) and Edge Chromium; untested on Android Go / low-RAM (1GB-2GB) devices. |
| **27** | **Production Monitor**| `hostDashboardStatsProvider`<br>`security_audit_events` | **[PARTIAL]** | Realtime wallet updates work; automated PagerDuty/Slack escalation for webhook failures or billing drift not yet configured. |

---

## 3. The 10 Next Release-Engineering Actions

1. **Physical 2-Device E2E Call Test**:
   - Device A (Android physical phone `f50ec44`) dials Device B (Host on Edge or secondary Android).
   - Audio verification: Verify clear two-way audio path, latency $< 300\text{ms}$.
2. **Carrier Switch & Packet Loss Stress**:
   - While in active call on Android, toggle Wi-Fi OFF so phone switches to 4G Cellular.
   - Assert `LiveCallOverlay` displays "Reconnecting audio...", waveform gently pulses, and audio resumes within 3 seconds without call termination.
3. **Android Foreground Service & Wakelock**:
   - Add `android.permission.FOREGROUND_SERVICE_PHONE_CALL` and ongoing notification so the Android OS does not kill audio when the app is placed in background or phone screen locks.
4. **Automated RLS Adversarial Penetration Test Suite**:
   - Run automated scripts using anon/authenticated tokens attempting unauthorized reads and writes to other users' wallets and calls.
5. **Real Database Concurrency Collision Execution**:
   - Execute parallel k6/Python script firing 50 concurrent `call-initiate` requests to the same host ID in Supabase to prove zero race condition double-calls under live DB load.
6. **Token Expiry Renewal Verification**:
   - Set Agora token lifetime to 60s in staging; prove call stays alive past 180s via automated renewal.
7. **Crashlytics / Telemetry Setup**:
   - Instrument Sentry/Firebase Crashlytics to measure ANR and crash-free session metrics.
8. **Decentro Bank Payout Verification**:
   - Run Decentro sandbox bank account validation and penny-drop test.
9. **Low-Memory Device Profile**:
   - Run profile build on low-RAM device (2GB RAM) to verify waveform animation and image caching do not exceed 150MB heap.
10. **Automated Canary Health Watchdog**:
    - Deploy background cron checking `SUM(wallet_debits) == SUM(host_credits) + SUM(platform_revenue)` hourly.
