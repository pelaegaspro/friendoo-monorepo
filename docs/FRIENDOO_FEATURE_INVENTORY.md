# Friendoo Feature Inventory — Phase A

**Status labels:** Verified in source, Partially verified, Present but authority unclear, Not verified.  
**Important:** Presence of a screen or model is not treated as proof of a production-ready end-to-end feature.

| Domain | Feature | Status | Evidence / caveat |
|---|---|---|---|
| Auth | Phone/session authentication | Verified in source | Supabase Auth is initialized with PKCE; auth repository and OTP screens exist. Deployment behavior still needs verification. |
| Profiles | User profile and avatar | Verified in source | Profiles, Storage avatar bucket, profile repository, onboarding/avatar screens, and profile mutation RPCs exist. |
| Discovery | Host listing, profiles, presence | Verified in source | Host repository, presence service, host tables, RLS hardening, and discovery UI exist. |
| Host | Host application/KYC workflow | Partially verified | Host application migrations/functions and admin pages exist; complete provider/document-review workflow needs end-to-end verification. |
| Host | Availability controls | Verified in source | Host availability RPCs and Flutter host application/profile UI exist. Exact deployed policy needs verification. |
| Calls | Call initiation | Verified in source | Authenticated Edge Function plus transactional RPC; minimum balance/availability checks are server-side. |
| Calls | Call acceptance | Verified in source | Authenticated Edge Function and host ownership/state check. |
| Calls | Call ending | Verified in source | Authenticated Edge Function and terminal-state idempotence in the inspected RPCs. |
| Calls | Call state observation | Partially verified | Supabase Realtime plus polling fallback exist, but client filters include `connecting`/`initiated` while the core enum lists other values. |
| Calls | WebRTC audio | Present but authority unclear | Full `flutter_webrtc` service with Supabase broadcast signaling, ICE restart, and stats exists. Actual injected runtime path is not yet proven. |
| Calls | Agora audio | Present but authority unclear | `agora_rtc_engine` dependency, Agora service, and `agora-token` invocation exist despite attachment saying Agora is not current. |
| Calls | Call telemetry | Partially verified | WebRTC service collects local stats; server telemetry/reversal migrations exist, but client telemetry RPC execution is revoked for authenticated clients in hardening migration. |
| Billing | Server-authoritative call billing | Verified in source | Billing/reaper/revenue migrations, locks, ledger/idempotency fields, and Edge Functions exist. Deployed cron/job configuration not verified. |
| Billing | 15-coin minimum | Verified in migration source | Financial settings migration seeds 15 coins; must verify deployed row. |
| Billing | Five-second grace period | Verified in migration source | Financial settings migration seeds five seconds; exact billing function behavior needs complete audit. |
| Billing | Six-second interval | Not verified | No inspected authoritative source proves a six-second interval. Do not assume attachment value is active. |
| Billing | 70/30 host/platform split | Not verified / conflict | Current inspected migration seeds 60/40, not 70/30. Client earnings display also uses 60%. |
| Wallet | Wallet balance and transactions | Verified in source | Wallet table, transaction table, RLS, realtime/polling client repository, and server RPCs exist. |
| Payments | Cashfree order creation | Verified in source | Flutter invokes `payment-create`; server-side payment order path exists. |
| Payments | Cashfree webhook verification | Verified in source | Signature, timestamp, payload limit, event fingerprint, duplicate reservation, and payment RPC path exist. |
| Payments | Payment confirmation | Verified in source | Flutter invokes `payment-confirm`; server behavior needs provider-console verification. |
| Payments | Google Play billing | Present in source | Flutter dependency/service and migration exist; full product verification and reconciliation are not yet audited. |
| Host finance | Earnings and withdrawals | Partially verified | Host earnings/payout tables, RPCs, admin pages, and Flutter withdrawal flow exist. Client-derived earnings presentation should use authoritative ledger data. |
| Support | Tickets/messages | Verified in source | Support tables, RLS migration, Flutter support UI, and admin/CRM support pages exist. |
| Moderation | Reports/blocking | Partially verified | Reports, blocked callers, call report UI, and support ticket fallback exist; investigation workflow and evidence retention need verification. |
| Fraud | Fraud alerts/risk workflows | Partially verified | Fraud tables, admin surveillance/fraud pages, and CRM detector code exist; signal quality and human approval flow are not yet proven. |
| Notifications | In-app/push notifications | Partially verified | Notification models/repository, push migration, and UI exist; provider delivery and consent handling need verification. |
| Marketing | Offers, campaigns, ads, referrals | Partially verified | Promotional/ad/campaign migrations and admin/CRM surfaces exist; conversion attribution and revenue impact not yet verified. |
| Admin | Dashboard metrics | Partially verified | Admin dashboard and chart API routes exist; requirement that all metrics use actual backend data needs query-by-query validation. |
| Admin | User/host/payment/payout management | Partially verified | Screens and API routes exist; route authorization and approval/dual-control behavior need systematic audit. |
| CRM | Customer/host directories and profiles | Present in source | CRM pages/components/types/data helpers exist; live data and authorization need verification. |
| CRM | Search/filter/export | Partially verified | CRM UI and data helpers exist; export authorization and data minimization require review. |
| RBAC | Staff roles/permissions | Partially verified | Database has admin role and admin checks; attachment's granular role matrix is not yet verified in current source. |
| Audit | Admin/security audit logs | Verified in source | Admin audit, operational events, webhook/security audit tables and helper functions exist. Coverage of every sensitive action is not verified. |
| Monitoring | Runtime/provider monitoring | Not verified | Source has observability/security tables and alert migrations, but live dashboards, alert routing, and provider metrics were not inspected. |

## Highest-priority gaps before implementation

1. Resolve WebRTC versus Agora ownership and trace runtime dependency injection.
2. Verify deployed Supabase schema, RLS, function grants, cron/reaper, and Edge Function secrets.
3. Reconcile call status vocabulary across database, Edge Functions, Flutter models, admin, and CRM.
4. Reconcile financial settings and client display logic; specifically confirm 60/40 versus requested 70/30 and actual interval/grace behavior.
5. Audit every admin/CRM privileged route for server-derived actor authorization and audit logging.
6. Replace silent error fallbacks on critical wallet/call paths with typed errors and observability.
7. Establish a single authoritative architecture document and mark root README legacy sections.
