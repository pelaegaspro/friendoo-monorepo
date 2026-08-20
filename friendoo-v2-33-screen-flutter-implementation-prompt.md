# Friendoo V2 — 33-Screen Flutter Implementation Prompt

Copy the complete prompt below into your coding assistant. It is written for an existing Flutter/Riverpod/Supabase codebase and intentionally requires the assistant to inspect the current repository before making changes.

---

## Copy-Ready Prompt

```text
You are a senior Flutter engineer working in the existing Friendoo repository. Implement the approved **Friendoo V2 call-first workflow** as production-oriented Flutter screens and state contracts.

Do not start by replacing the app architecture. First inspect the current repository, `pubspec.yaml`, app entry point, navigation, Riverpod providers, Supabase setup, existing call integration, environment configuration, database migrations, and all relevant test conventions. Read `AGENTS.md` or equivalent repository instructions before changing anything. The existing codebase and deployed Supabase configuration are the source of truth; this prompt is a functional and UX specification, not a license to ignore existing conventions.

# Product objective

Friendoo is an audio-call platform. A user must be able to:

1. authenticate with a phone number and one-time code;
2. browse eligible and currently available hosts;
3. view a host’s trust information, terms, rate, minimum reservation, and boundaries;
4. confirm consent and create a single safe call request;
5. reserve the minimum required wallet amount before the host responds;
6. connect to an audio session only after authoritative acceptance;
7. see a clear live-call state, balance estimate, reconnection handling, and safe end action;
8. receive a precise settlement outcome, receipt, released reservation, or refund status;
9. report or block safely before or after a session; and
10. allow hosts to manage server-authorized availability, incoming requests, earnings, and payouts.

The product is **call-first**. Do not add social feeds, groups, stories, events, generic chat, Kubernetes, microservices, GraphQL, gRPC, SQS, or custom caching unless the existing repository already depends on them and they are necessary for this implementation.

# Non-negotiable engineering rules

1. Preserve the existing Flutter, Riverpod, and Supabase architecture. Do not migrate frameworks, state management, or backend providers.
2. Never trust client-controlled balances, host IDs, prices, rates, durations, roles, availability, payment results, or call-state flags.
3. The database/server is the final authority for session state, wallet state, role eligibility, availability, settlement, refunds, and blocking.
4. Do not expose service-role keys, payment secrets, call-provider secrets, or privileged API tokens in Flutter.
5. Do not weaken Row Level Security or make tables publicly writable to “fix” a permission problem.
6. Use server-side atomic operations, transactions/RPC, and idempotency keys for every multi-record financial or call-session transition.
7. Realtime presence is a UI signal only. It must not be treated as the financial or call-session authority.
8. Build loading, empty, retryable error, permission-denied, disconnected, timeout, and terminal-result states. Do not silently swallow exceptions.
9. Avoid N+1 queries. Paginate host discovery and call history. Subscribe only to the current call/session and narrowly scoped availability data.
10. Follow the existing styling system. If none exists, implement a small reusable V2 token system rather than hard-coding random values in each screen.

# Approved V2 visual direction

Implement native Flutter UI; do not embed or render the supplied HTML reference. The design direction is a calm, premium mobile experience built around:

- 390 × 844 mobile reference canvas;
- deep navy `#101D31` / near-black `#18181B` for active call and immersive states;
- soft off-white `#F5F7FA` / white surfaces for standard screens;
- indigo primary `#5D65F3`;
- teal success/availability `#27C9BA`;
- orange warning `#FFAE6C`;
- pink/red safety/error `#E85D78`;
- dark text `#0D1828`; muted text `#718097`;
- 12–16 px rounded input/surface geometry, clear type hierarchy, generous vertical spacing, and accessible contrast;
- one obvious primary action per screen; destructive actions must be visually distinct and confirmed when appropriate.

Use semantic labels, sufficiently large tap targets, screen-reader-friendly status messages, and non-colour-only states. Ensure every live timer, transaction state, and dynamic call status is accessible.

# Required route and state conventions

Use the existing routing approach. If there is no route system, introduce typed routes conservatively. Use explicit domain state rather than only booleans. For example, model a call as a sealed state or equivalent:

- `idle`
- `creatingRequest`
- `requestPending`
- `requestClosed(reason: cancelled | declined | timedOut)`
- `accepted`
- `connecting`
- `connected`
- `reconnecting`
- `ending`
- `completed`
- `failed`

Model wallet and payment state separately from call state. A failed top-up, a wallet reservation, a final charge, and a refund are not interchangeable states.

Use Riverpod providers/notifiers aligned with the existing project. If equivalent providers are absent, create narrowly scoped providers such as:

- `authSessionProvider`
- `phoneAuthControllerProvider`
- `hostDiscoveryProvider(filters)`
- `hostProfileProvider(hostId)`
- `walletProvider`
- `walletTransactionsProvider(filter)`
- `callSessionControllerProvider`
- `currentCallSessionProvider`
- `hostAvailabilityProvider`
- `hostDashboardProvider`
- `paymentTopUpControllerProvider`
- `supportActionsControllerProvider`

Keep business logic in controllers/repositories/use cases, not in widgets. Dispose subscriptions and timers on lifecycle changes. Never let a local timer become the settlement source of truth.

# Required backend contracts

Before creating new tables or functions, inspect the live schema and migrations. Reuse existing entities when possible. If absent, introduce minimal migrations and server operations for the following conceptual model:

| Concern | Required authoritative records / operations |
| --- | --- |
| Identity and role | User profile, host profile, host approval/application status, verified host eligibility, block relationships. |
| Availability | Server-managed host availability and an availability version or current state that can safely reject stale requests. |
| Call session | A unique call session/request with caller, host, quoted rate, minimum reservation, expiry, state, server timestamps, provider/session identifiers, and terminal reason. |
| Wallet | Wallet account and immutable ledger events. Distinguish available balance, reservation, final charge, reservation release, top-up credit, refund, and payout/earnings as appropriate. |
| Payments | An idempotent top-up attempt, trusted payment-provider reference, verification status, and final wallet-credit event. |
| Safety | Report, report reason, reporter, target, session reference when applicable, block record, and immutable moderation/audit information. |

Create or adapt server-authoritative operations equivalent to the following. Names must match existing conventions and should not be copied blindly if the codebase already uses different names:

1. `create_call_request(host_id, idempotency_key)`
   - Validate current caller identity, approved host eligibility, live availability, quoted terms, block relationships, and available wallet balance.
   - Create exactly one request and minimum reservation atomically.
   - Return the authoritative session and wallet summary.

2. `cancel_call_request(session_id, idempotency_key)`
   - Permit cancellation only from valid request states.
   - Close once and release the reservation once.

3. `respond_to_call_request(session_id, decision, idempotency_key)`
   - Permit only an eligible host to accept or decline a current request.
   - On decline, close and release reservation exactly once.

4. `get_or_restore_call_session(session_id)`
   - Return authoritative state after app foregrounding, reconnecting, or process restart.

5. `end_call_session(session_id, idempotency_key)`
   - End once, calculate authoritative billable connected time, settle the final charge, release unused reserved funds, write ledger events, and return a durable receipt.

6. `create_top_up_attempt(amount, idempotency_key)` and trusted payment webhook processing
   - Never credit wallet in Flutter before verified provider confirmation.
   - Make retries and webhook deliveries idempotent.

7. `submit_report(...)` and `block_account(...)`
   - Support both user-to-host and host-to-user safety actions.
   - Enforce access and never expose another user’s private moderation data.

If audio-provider tokens are generated server-side, use a trusted server function/Edge Function. Do not issue unrestricted provider credentials to the client.

# 33 required screens

Implement all screens below. Reuse shared screen shells, empty/error components, list rows, input fields, buttons, confirmation sheets, and status surfaces where appropriate. Use the exact business meaning even if the route/widget names follow the current codebase style.

## 1. Splash / restore

Purpose: restore an existing authenticated session and any active call state.

- Show a brief secure-session restoration state.
- Route to phone login when no valid session exists.
- When an active call may exist, call the authoritative restore endpoint before choosing the destination.
- Do not route based only on local cached flags.

## 2. Phone number login

Purpose: sign in without a password.

- Country selector, formatted phone entry, validation, privacy explanation, send-code action.
- Apply rate limiting / cooldown behavior from backend response.
- Keep full phone numbers private in UI logs and analytics.

## 3. Phone verification

Purpose: verify one-time SMS code.

- Six-digit code entry, autofill if supported, resend countdown, change-number action.
- Handle invalid code, expired code, excessive attempts, and offline state.

## 4. Code expired

Purpose: recover safely from an expired one-time code.

- Explain code expiry without misleading payment language.
- Offer request-new-code and change-phone-number actions.

## 5. Profile setup

Purpose: capture a minimal user profile.

- Name, optional photo, interests, language.
- Validate inputs; request photo permission only when photo selection begins.
- Permit safe continuation if photo is optional.

## 6. Permission preferences

Purpose: offer optional permissions without blocking onboarding.

- Notifications, contacts, and photo access are optional and contextual.
- Do not request microphone access here.
- Route users to OS settings only after a denial that cannot be resolved in-app.

## 7. Microphone denied recovery

Purpose: recover when a required microphone permission is denied.

- Explain why microphone access is necessary.
- Offer Open Settings and End Request Safely.
- On return from settings, re-check permission and authoritative call state.

## 8. Host discovery

Purpose: show an efficient, paginated list of eligible available hosts.

- Show verified status, languages, interests, rate, rating/trust signals, and availability.
- Query only approved hosts matching product policy.
- Include loading, empty, refresh, and pagination states.
- If marketplace policy restricts hosts by eligibility characteristics, enforce that in backend filters—not only sample labels in UI.

## 9. Host filters

Purpose: filter host search by availability, schedule, languages, rate, and interests.

- Filters must be serializable into a provider/query state.
- Apply and reset should not create unnecessary realtime subscriptions.
- Use only backend-supported filters and indexed fields.

## 10. Host profile

Purpose: give enough information to decide whether to call.

- Show host identity/trust signals, languages, availability expectation, rate, and profile summary.
- Primary action: View Call Terms.
- Secondary action: Report or Block.
- Never expose private host data or unverified “online” claims.

## 11. Availability & terms

Purpose: ensure user sees pricing and boundaries before consent.

- Show rate per connected minute, minimum reservation, maximum estimate explanation, availability, and boundaries.
- Explain that the reservation is not the final charge and that longer calls require funds.
- Primary action: Continue to Consent.

## 12. Contextual safety

Purpose: provide report, block, boundary, and support options before a call.

- Report reason selection and submitted confirmation.
- Block confirmation with clear future-contact effect.
- Do not imply that audio recording exists unless the product actually records audio and users have been correctly informed.

## 13. Wallet

Purpose: clearly distinguish available and reserved credits.

- Show available balance, reserved balance, recent ledger events, top-up action, and transaction-history route.
- Do not calculate final wallet values locally; use server response and narrow realtime refresh.

## 14. Top up

Purpose: choose credit amount and payment method.

- Preset amounts, payment-method picker, review action, fee disclosure if applicable.
- Validate amount and prevent duplicate submissions.

## 15. Payment method

Purpose: select or add a payment method through the approved payment integration.

- Show masked card/payment details only.
- Never capture raw payment details into app database or logs.
- Confirm payment through the payment provider flow.

## 16. Top-up processing

Purpose: show non-terminal payment confirmation state.

- Use wording such as “Close” or “I’ll check later,” not “Cancel,” once payment provider processing may continue.
- Persist an idempotent payment attempt and query status after return or app restart.

## 17. Top-up result states

Purpose: differentiate credited, pending review, and failed/cancelled outcomes.

- Credited: server-confirmed wallet credit and new balance.
- Pending review: do not retry automatically and explain how to check later.
- Failed/cancelled: no wallet credit; allow safe retry only if backend confirms no active attempt.

## 18. Transaction history

Purpose: list immutable wallet events.

- Support filters for all, reservations, charges, top-ups, and refunds.
- Render ledger event type, amount direction, timestamp, related host/session where allowed, and status.
- Paginate history.

## 19. Call cost confirmation

Purpose: acquire clear consent before creating a call request.

- Show host, available balance, minimum reservation, rate, and the statement that final charge may be higher if connected duration exceeds reservation.
- Primary action: Request and Reserve [amount].
- Disable while request creation is in progress.

## 20. Insufficient balance

Purpose: explain inability to make minimum reservation.

- Show available funds, required reservation, difference, top-up route, and choose-another-host route.
- Explicitly state that no reservation and no final charge were made.

## 21. Request sent + reserved

Purpose: show a pending host decision with an authoritative reservation.

- Show request expiry countdown derived from server expiry timestamp.
- Show reserved amount as “not finally charged.”
- Primary action: Cancel and Release [amount].
- Subscribe only to this specific call session while the screen is active.

## 22. Request closed outcomes

Purpose: render distinct terminal request outcomes.

- Variants: host declined, request timed out, user cancelled.
- Each must show reservation released once and offer Try Another Host.
- Avoid calling all outcomes “failed”; record a precise terminal reason.

## 23. Incoming call (host)

Purpose: allow an eligible host to accept or decline.

- Show caller identity permitted by privacy rules, rate, confirmed minimum reservation, and response expiry timer.
- Host earnings begin only when authoritative connection begins.
- Actions must use idempotency and tolerate duplicate taps or stale sessions.

## 24. Host authorization

Purpose: gate host functionality by server-approved role.

- Show not-active role, identity-verification requirement, host guidelines, and application status if applicable.
- Only approved accounts can access host availability, incoming paid requests, or earnings.
- Never use a client-side “switch role” flag as authorization.

## 25. Host availability + earnings

Purpose: offer server-controlled host operations.

- Show approved status, availability toggle, active requests, earnings summary, and payout status.
- Availability changes must use a server operation and handle conflicts such as an active session.
- Ensure stale local availability cannot create acceptances after a host is no longer eligible.

## 26. Connecting

Purpose: establish a secure audio session.

- Request microphone permission here, just before connection.
- Show connection status and a safe end action.
- Obtain audio-provider token/session configuration only from trusted server-side logic.
- Do not start billable duration until authoritative connected condition is reached.

## 27. Active audio call

Purpose: host the active voice session.

- Show connected status, current duration, rate, estimated remaining balance, mute, speaker, and end action.
- The duration may be a UI display, but server timestamps/session updates decide settlement.
- Use robust app lifecycle handling for backgrounding, network switch, participant departure, and process recovery.

## 28. Low balance warning

Purpose: prevent an unclear or abrupt end when future billing cannot be covered.

- Explain estimated time or next billing interval based on trusted server calculation.
- Offer top-up and safe end.
- Define product behavior for payment sheet opening during a call before implementing it; do not invent billing pauses.

## 29. Reconnecting / restore

Purpose: recover after network loss, backgrounding, or app restart.

- Query the authoritative session and render: still active, ended, failed, or no longer valid.
- Do not rely on a stale local timer or cache.
- Offer Keep Trying only within documented retry limits; offer End Safely.

## 30. End call confirmation

Purpose: prevent accidental termination.

- Show connected duration and estimated charge as estimates.
- Primary destructive action: End Call.
- After confirmation, call authoritative end/settlement operation once; display a dedicated progress state.

## 31. Call completed receipt

Purpose: provide precise post-call financial evidence.

- Show host, authoritative connected duration, reservation applied, additional connected-time charge if any, final charge, released remainder, new balance, and receipt reference.
- Example: Reservation applied $4.00; Additional connected-time charge $2.96; Final charge $6.96; Released remainder $0.00.
- Offer rate, report, or block without making rating mandatory.

## 32. Call failed / refund

Purpose: render exact financial and session failure outcomes.

- Variant A: “Reservation released — no final charge.”
- Variant B: “Charge made — refund pending” with refund status/reference.
- Do not merge these states into ambiguous wording.
- Provide Try Another Host and Open Support actions where appropriate.

## 33. Call history + support

Purpose: provide durable history and post-call action.

- Paginated call list with completed, refunded, timeout, or support status.
- View receipt, report/block, billing issue, and safety-concern actions.
- Make report/block role-symmetric: both users and hosts must have appropriate actions and reason taxonomy.

# Navigation

Use the existing application navigation. If it does not exist, implement a conservative authenticated shell with destinations equivalent to:

- Hosts / discovery
- Wallet
- Calls / history
- Profile / account

Do not invent a general social “home feed” for this scope. Keep host routes, wallet routes, and active-call routes independently restorable from deep links/app recovery where the existing architecture supports it.

# P1 requirements that must be implemented with the matching screens

1. **Payment-processing language and idempotency:** once a payment attempt can settle remotely, permit closing the screen but do not promise cancellation. Persist and re-query trusted result state.
2. **Receipt transparency:** separately show reservation applied, additional usage charge, final charge, and released remainder.
3. **Financial failure precision:** distinguish no-charge reservation release from a charge that has a refund pending.
4. **Role-symmetric safety:** implement report/block actions for users and hosts; show confirmation and the concrete contact-prevention result.
5. **Host policy alignment:** catalogue results and host eligibility must obey current business policy at backend level; do not rely on sample UI data.

# Testing and verification requirements

Use existing test tools and conventions. Add tests before or alongside business-logic changes. At minimum, cover:

- phone-code form validation, resend cooldown, expiry, and invalid-code states;
- host-list filters, pagination, loading, empty, and error states;
- user cannot reach host-only actions without authoritative role;
- user cannot create a call request if host is unavailable, blocked, not eligible, or wallet balance is insufficient;
- duplicate request/cancel/accept/end actions are idempotent;
- cancellation, decline, and timeout release a reservation exactly once;
- connection failure before billable connection creates no final charge;
- settlement applies reservation and additional usage only once;
- reconnection/restoration replaces stale local state with authoritative server state;
- top-up does not credit wallet until verified provider confirmation;
- report/block policies prevent unauthorized access and work for both roles;
- RLS/authorization tests deny cross-user wallet, call, host-role, and private support-data access.

Run the relevant formatter, static analysis, unit/widget/integration tests, and build checks. Report the exact commands run and their results. Do not claim a feature is complete merely because the project compiles.

# Delivery format

Work in small, reviewable commits. Before changing code, provide a short repository findings summary: actual architecture, existing equivalent services/providers/screens, relevant migrations and policies, and the smallest implementation plan. Then implement in this order:

1. domain models, route contracts, and server-authoritative state operations;
2. wallet/reservation and call-session lifecycle tests;
3. authentication/onboarding and host discovery;
4. wallet/top-up/transaction screens;
5. request, host decision, connecting, active-call, recovery, settlement, and receipt screens;
6. host authorization/dashboard and safety/support screens;
7. full verification and a concise change report.

If the current repository or deployed backend materially conflicts with this prompt, stop before risky migration/rewrite work. Explain the conflict, identify the smallest safe alternative, and request a decision.
```

---

## Reference

This prompt is based on the approved 33-screen V2 workflow reference. [1]

[1]: ./friendoo-audio-call-33-screen-reference-v2.html "Friendoo phone-login audio-call workflow reference V2"
