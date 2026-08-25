# Friendoo CEO-to-CEO Architecture Handoff Prompt

Copy the prompt below into the next CEO's briefing, an advisor review, or an AI strategy session.

---

## Prompt

You are the incoming CEO of Friendoo. You are receiving the company from the founding CEO and must understand the product, architecture, operating model, risks, and next decisions before changing direction.

Treat this document as a transition brief, not as proof that every feature is production-ready. Separate verified implementation from planned work, mock data, migration artifacts, and claims that still require operational confirmation.

Your first responsibility is to establish one source of truth for product behavior, infrastructure, money movement, user safety, and production readiness.

### 1. Company and Product Mission

Friendoo is an India-first anonymous social audio platform. Users discover verified female hosts and spend in-app coins to have voice conversations. Hosts apply, pass verification, become visible to users, receive calls, and earn through paid call time. The product is designed around regional languages, privacy, safety, real-time calling, and a host earning marketplace.

The core promise is:

- Users can have genuine conversations in their preferred Indian language.
- Users do not need to expose their phone number to hosts (100% anonymous calling).
- Hosts are verified before public discovery.
- Users pay through a transparent coin system.
- Hosts receive tracked earnings and payouts.
- Moderation, grievance redressal, and reporting are part of the core product, not an afterthought.

The primary product loop is:

`discover host -> check availability -> buy coins -> initiate call -> connect audio -> bill by minute -> end call -> record outcome -> retain user or host`

The host loop is:

`apply -> verify -> approve -> set availability -> receive calls -> earn -> request payout -> remain compliant`

The operations loop is:

`observe users, hosts, calls, payments, reports, fraud alerts -> take action -> preserve auditability -> improve conversion, safety, and retention`

### 2. User Roles

Recognize these roles and permissions:

- **Anonymous or standard user:** browses hosts, sees availability, maintains a wallet, buys coin packages via UPI Intent, starts calls, reports abuse, and views personal history.
- **Host:** has a host profile, languages, rate, availability state, presence heartbeat, call history, earnings, strike/warning status, and payout information.
- **Admin:** verifies hosts, manages users, packages, reports, payouts, notifications, settings, and operational actions.
- **CRM operator:** analyzes user segments, revenue, support tickets, fraud alerts, hosts, campaigns, funnels, and configuration.
- **System services:** billing jobs, payment webhooks, RTC token generation, notification delivery, and database triggers/functions.

Never assume an admin or CRM operator is allowed to perform user money movement directly. Every money-changing operation must remain server-authorized, idempotent, auditable, and protected by role checks.

### 3. Current Repository and Application Topology

The repository contains several products and historical implementation tracks:

- `flutter_app/`: current Flutter application for the consumer mobile experience. It uses Flutter, Riverpod, Supabase, VideoSDK.live (~₹0.38/min) & Agora RTC (dual fallback), dotenv configuration, permissions, URL launching, and UUID support.
- `admin/`: separate Next.js 14 App Router and TypeScript operations console. It contains admin authentication, dashboard pages, user and host operations, payments, payouts, calls, reports, notifications, packages, advertisements, surveillance, and settings.
- `crm/`: separate Next.js 14 App Router and TypeScript customer intelligence console. It contains dashboard analytics, users and segments, hosts, revenue, support, campaigns, fraud, funnel, and configuration pages.
- `functions/`: Node 20 Firebase Cloud Functions code for older or parallel production capabilities.
- `supabase/`: SQL migrations for the newer Supabase architecture. These define profiles, wallets, hosts, presence, calls, call events, coin packages, transactions, payment orders, reports, RLS policies, and server-side database functions.
- `supabase/functions/`: Deno Edge Functions for `videosdk-token` (HMAC-SHA256 JWT generation) and `agora-token`.
- `Friendoo/`: Android-native project and historical Android implementation surface.
- `scripts/`, `docs/`, and `flutter_app/_migration_source/`: migration, reference, generated, or historical material.

The most important architectural diligence question is whether Friendoo is currently Firebase-backed, Supabase-backed, or running a controlled hybrid migration. Existing documentation describes Firebase while current Flutter and dashboard code also contains Supabase paths. Confirm the deployed runtime, database of record, auth provider, payment webhook target, RTC token source, and active deployment for every environment before making architectural changes.

### 4. Consumer Application & Pluggable RTC Architecture

The Flutter app is organized by feature:

- `lib/features/auth/`: authentication, onboarding, and locked-in avatar setup.
- `lib/features/discover/`: host discovery, 3/10 Star Host podium algorithm, 3-state online/busy/offline badges, and host repository.
- `lib/features/calls/`: active call controller, call repository, pluggable `RtcAudioService` (VideoSDK.live + Agora RTC fallback), live call HUD with speaker/mute toggles, in-call quick top-up banner, and call summary receipt.
- `lib/features/wallet/`: wallet balance, transaction ledger, and native NPCI UPI checkout sheet.
- `lib/features/profile/`: statutory settings, DPDP 2023 Consent Manager, Rule 3(2) IT Grievance Redressal Desk, and Google Play Account Deletion.
- `lib/core/models/`: shared domain models such as users, hosts, calls, wallets, and credentials.
- `lib/core/supabase/`: Supabase client/provider boundary.

State management uses Riverpod. The active call controller (`call_controller.dart`) manages call initiation, acceptance, mute, speakerphone routing, call reporting, call termination, observation, and audio cleanup.

The consumer experience must preserve these invariants:

- A user cannot call themselves.
- A call requires a currently available, online, and non-suspended host.
- The caller must hold **at least 15 coins** to initiate any call.
- Call state changes must be server-controlled.
- RTC room tokens must never be generated on the client; they must be issued by the Supabase Edge Function (`videosdk-token` / `agora-token`).
- Ending a call must be safe to retry and must not double-charge.
- The caller and host must return to an accurate presence state after termination.
- Microphone, audio routing, and platform permissions must fail gracefully.

### 5. Call Billing & Financial Invariants

The Supabase migrations and application controller define the exact mathematical and operational rules for voice calling:

1. **Minimum Balance Gate:** Caller must have $\ge 15\text{ coins}$ in their wallet before a call can be initiated. If balance is lower, the call is blocked and routes to the recharge sheet.
2. **5-Second Free Grace Period:** Calls lasting $\le 5\text{ seconds}$ are charged **0 coins**.
3. **Ceiling Per-Minute Billing:** Calls reaching 6 seconds or more are billed using the ceiling function:
   $$\text{coins} = \begin{cases} 0 & \text{if } t \le 5\text{s} \\ \lceil \frac{t}{60} \rceil \times \text{rate} & \text{if } t > 5\text{s} \end{cases}$$
   - $6\text{s to } 60\text{s} = 1\text{ minute (5 coins)}$
   - $61\text{s (1:01 min) to } 120\text{s} = 2\text{ minutes (10 coins)}$
4. **Host Silence & Time-Wasting Rule:**
   - If a host stays muted, remains silent, or wastes call time, 100% of the coins deducted for that call are **refunded directly back to the caller's wallet**.
   - **Zero funds are diverted to an Admin Vault.**
   - The host receives an in-screen push warning strike (`⚠️ Inactivity Strike [X/3]`).
5. **Automatic 3-Strike Host Suspension:**
   - On the **3rd silence/inactivity strike**, the host profile is **automatically suspended** (`is_suspended = true`, `is_available = false`).

The main database entities are:

- `profiles`: identity, display name, phone, role, avatar path, and ban state.
- `wallets`: coin balance and freeze state.
- `hosts`: host rates, availability, rating, silence warning count, and suspension state.
- `user_presence`: online, offline, busy, and in-call state with heartbeat timestamps.
- `calls`: caller, host, type, status, RTC channel, rate, timestamps, and coins deducted.
- `call_events`: append-only operational events for a call.
- `coin_transactions`: credits, debits, refunds, adjustments, and idempotency keys.
- `payment_orders`: payment provider order state.
- `reports`: user safety reports.

The final source of truth for call billing must be the server transaction/database function, not Flutter timing.

### 6. Payments, UPI Intent & Payout Safety

The payment stack supports direct **NPCI UPI Intent** (`upi://pay?pa=...&pn=...&am=...&cu=INR`) for 1-tap checkout via PhonePe, Google Pay, Paytm, CRED, and BHIM alongside payment gateway integration (Cashfree).

The system enforces:

- Webhook signature verification and idempotency keys on all recharges.
- No client-side balance mutation; atomic database credit updates.
- TDS compliance (Section 194J/194H) and ₹100 minimum threshold for host payouts.
- Direct refunds to caller wallets on verified silence/technical faults with zero admin cut.
- Immutable ledger logging for every credit, debit, and adjustment.

### 7. Admin and CRM Architecture

The Admin and CRM apps are separate Next.js deployments with their own package manifests and Vercel configuration. Both are operational surfaces, not the consumer product.

Admin responsibilities include:

- Password-protected access and role-based views.
- User directory, host approvals, KYC verifications, and strike reviews.
- Coin package management and promotional pricing.
- Live calls monitoring, reports, and trust & safety triage.
- Payment reconciliations, refund audits, and payout approvals.
- Real-time broadcast push notifications and app settings.

CRM responsibilities include:

- Operational dashboard KPIs and cohort retention analysis.
- User segmentation (activation, first call, repeat caller, churn risk).
- Host leaderboard, earnings tracking, and availability heatmaps.
- Revenue analytics, contribution margin, and campaign delivery.
- Fraud alerts and dispute reconciliation.

### 8. Statutory Compliance & Security Model

Friendoo adheres to Indian statutory mandates and platform policies:

1. **Digital Personal Data Protection (DPDP) Act 2023:**
   - Explicit Granular Consent Manager for microphone, storage, and analytics.
   - Right to Erasure / Google Play-compliant self-serve **Account Deletion**.
2. **Information Technology Rules 2021 (Rule 3(2)):**
   - Statutory **Grievance Redressal Officer Desk** with published officer identity, contact details, physical address, mandatory 24-hour acknowledgment SLA, and 15-day resolution timeline.
3. **Security Invariants:**
   - Least-privilege access via Row Level Security (RLS).
   - Server-only service credentials; cryptographic HMAC-SHA256 JWT tokens for VideoSDK RTC.
   - Screen recording and screenshot prevention flags on mobile.

### 9. Avatar and Identity Consistency

Friendoo enforces deterministic, permanent avatar identity:

- The canonical seed is `avatarSeed`, derived immutably and locked on first setup.
- The same user/host renders the exact same avatar across discovery, profiles, incoming calls, live calls, call history, Admin, and CRM.
- No random regenerating avatars across app sessions.

### 10. Production Truth Checklist

Before approving a roadmap, produce a one-page production truth table with these columns:

`Capability | Current code path | Deployed service | Database of record | Owner | Monitoring | Known failure mode | Verified on date`

At minimum, include:

- Authentication and session renewal.
- Profile creation and one-time avatar lock.
- Host application, KYC, and approval.
- Host presence heartbeat and 3-state badge sync.
- 15-coin wallet balance pre-call gate.
- VideoSDK.live (~₹0.38/min) primary audio routing & Agora fallback.
- 5-second grace period and ceiling per-minute billing.
- Direct caller refunds for host silence and automatic 3-strike suspension.
- Cashfree & NPCI UPI Intent order creation and webhook crediting.
- DPDP 2023 Consent Manager & IT Rule 3(2) Grievance Desk.
- Host withdrawal processing and TDS compliance.
- Admin and CRM operational dashboards.

### 11. CEO Priorities for the Next 90 Days

#### Days 0-15: Establish truth and protect users
- Confirm the active production deployment and database of record.
- Verify VideoSDK token issuance, 15-coin balance gate, ceiling billing, and 100% direct refund on silence reports.
- Verify DPDP consent and Grievance Desk compliance.
- Establish incident ownership and operational on-call paths.

#### Days 16-45: Make the core loop reliable
- Improve host supply quality and response rates during peak evening hours.
- Optimize WebRTC audio connection speed across tier-2/3 Indian mobile networks.
- Ensure wallet and call state converge seamlessly across reconnects and app kills.
- Complete deterministic avatar consistency across all user and host surfaces.

#### Days 46-90: Improve retention and economics
- Segment users by regional language, first call conversion, and repeat recharge frequency.
- Expand the 3/10 Star Host system and Host Target Quest Ladders for retention.
- Run controlled experiments on pricing, starter packages (₹49 for 50 coins), and daily login streak rewards.
- Audit unit economics: contribution margin per completed audio minute against ₹0.38/min RTC costs.

### 12. Metrics the CEO Must Own

North-star metrics:
- Completed paid conversation minutes.
- Weekly retained paying users.
- Weekly active earning hosts.
- Contribution margin per completed minute (Revenue minus Host Split, RTC ₹0.38/min, Payment Gateway fees, and TDS).
- Safe successful call rate ($\ge 98.5\%$).

Funnel metrics:
- Install to OTP signup.
- Signup to avatar lock & discovery lounge.
- Host view to call initiation.
- Call request to WebRTC audio connection.
- 5s grace hangup rate vs completed call rate.
- First call to first recharge (₹49 starter).
- First recharge to repeat paid call.

Marketplace metrics:
- Online host hours during peak lounge windows (7 PM – 1 AM).
- Host call acceptance rate and average pickup delay.
- Host silence/muting dispute rate per 1,000 calls.
- Host earnings per active hour and payout turnaround.

Trust & Compliance metrics:
- Reports per 1,000 paid minutes.
- Grievance Desk 24-hour acknowledgment SLA compliance ($100\%$).
- Host strike rate and automatic 3-strike suspension enforcement.
- Direct refund processing time ($< 1\text{ second}$).

### 13. Non-Negotiable Engineering Rules

- Never deduct coins on calls $\le 5\text{ seconds}$ (free grace period).
- Never initiate a call if wallet balance $< 15\text{ coins}$.
- Always bill $6\text{s}-60\text{s}$ as 1 minute and $61\text{s}$ as 2 minutes (ceiling rule).
- Never divert silence penalty funds to an admin vault; always issue a 100% direct refund to the caller.
- Automatically suspend hosts on their 3rd silence strike.
- Never trust client timing for money movement.
- Never expose service-role credentials or VideoSDK Secret Keys in client bundles.
- Do not use mutable aliases as identity seeds.
- Prefer small, reversible changes with automated tests and a production verification step.

### 14. Questions the Incoming CEO Must Answer

1. Who is the highest-value user segment today: language (Hindi, Tamil, Telugu), city tier, or usage pattern?
2. Is the strongest wedge regional-language companionship, casual conversation, or evening stress relief?
3. What is the true gross margin per minute at ₹0.38/min VideoSDK RTC cost versus ₹5.00/min user spend?
4. Are hosts supply-constrained, demand-constrained, or retention-constrained?
5. What causes a user to make a second paid call?
6. What is the largest known source of financial leakage?
7. What is the largest known safety or regulatory risk?
8. Which feature should be pruned to keep the audio lounge experience ultra-fast and simple?
9. What must be true in 12 months for Friendoo to be a durable, profitable, and compliant Indian consumer business?

### 15. Required Output From the Next CEO

1. A verified architecture diagram showing Flutter client, Supabase backend, VideoSDK RTC, NPCI UPI payments, and Admin/CRM consoles.
2. A production truth table with owners and automated monitoring.
3. A risk register ranked by user safety, financial integrity, DPDP/IT Act legal exposure, and technical stability.
4. A 90-day operating plan with no more than five company-level priorities.
5. A metric tree connecting business outcomes to product and infrastructure KPIs.
6. A test plan for authentication, RTC calling, 5s grace ceiling billing, direct user refunds, 3-strike host suspensions, and grievance workflows.

End every recommendation with:
- The user or business problem it solves.
- The empirical evidence supporting it.
- The smallest implementation step.
- The owner.
- The success metric.
- The rollback or containment plan.

Your job is not to make Friendoo look complete. Your job is to make it truthful, safe, economically sound, fast enough to use, and capable of learning from real users.

---

## Repository Evidence Referenced

- [docs/avatar-prd-and-spec.md](avatar-prd-and-spec.md)
- [flutter_app/lib/features/calls/data/rtc_audio_service.dart](../flutter_app/lib/features/calls/data/rtc_audio_service.dart)
- [flutter_app/lib/features/calls/data/videosdk_audio_service.dart](../flutter_app/lib/features/calls/data/videosdk_audio_service.dart)
- [flutter_app/lib/features/calls/application/call_controller.dart](../flutter_app/lib/features/calls/application/call_controller.dart)
- [flutter_app/lib/features/calls/presentation/live_call_overlay.dart](../flutter_app/lib/features/calls/presentation/live_call_overlay.dart)
- [flutter_app/lib/features/calls/presentation/call_report_bottom_sheet.dart](../flutter_app/lib/features/calls/presentation/call_report_bottom_sheet.dart)
- [flutter_app/lib/features/wallet/presentation/recharge_checkout_sheet.dart](../flutter_app/lib/features/wallet/presentation/recharge_checkout_sheet.dart)
- [flutter_app/lib/features/profile/presentation/settings_pages.dart](../flutter_app/lib/features/profile/presentation/settings_pages.dart)
- [supabase/functions/videosdk-token/index.ts](../supabase/functions/videosdk-token/index.ts)
- [supabase/migrations/20260824_000018_minimum_15_coins_and_host_silence_strikes.sql](../supabase/migrations/20260824_000018_minimum_15_coins_and_host_silence_strikes.sql)
