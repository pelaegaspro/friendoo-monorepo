# Friendoo Audio-Call 33-Screen Reference — Workflow Validation

## Verdict

**This is a major and correct improvement.** The revised board now reflects Friendoo’s real product loop—host discovery, transparent call terms, wallet funding, consent, audio-call state, reconciliation, support, and host operations—rather than the generic social-network flow in the earlier reference. It is a **strong product and Flutter UI specification candidate**, but it is **not fully implementation-ready** until the remaining P0/P1 gaps below are resolved. [1]

> The reference correctly states the call lifecycle as `IDLE → REQUESTING → ACCEPTED / REJECTED → CONNECTING → CONNECTED → ENDING → COMPLETED / FAILED`. The screen inventory, however, currently renders only the **accepted** path in full. [1]

## What is now correct

| Product area | Validation | Evidence in the updated board |
| --- | --- | --- |
| **Call-first product focus** | Correct | The overview and 33-screen inventory are explicitly organized around host discovery, calls, wallet funding, settlement, recovery, and host operations. [1] |
| **Host discovery and informed choice** | Correct | Screens 9–13 show available hosts, filters, profile trust information, rates, minimum duration, availability, boundaries, and safety actions before a call. [1] |
| **Wallet and monetary transparency** | Largely correct | Wallet, top-up, payment-method, transaction-history, cost-confirmation, insufficient-balance, receipt, and refund screens are included (screens 14–19 and 27–29). [1] |
| **Primary call lifecycle** | Largely correct | Pending request, host incoming request, acceptance, connecting, active call, reconnecting, end confirmation, receipt, and failed/refund flows are present (screens 20–28). [1] |
| **Host operations** | Correct baseline | Incoming decision, availability control, and host earnings are now represented (screens 21–22 and 30–31). [1] |
| **Just-in-time microphone context** | Good intent | The dedicated microphone screen explains why access is required and allows deferral. [1] |
| **Safety and support** | Good baseline | The host profile provides report/block/boundaries actions, while support includes call/billing and safety routes. [1] |
| **Flutter architecture alignment** | Good conceptual fit | The UI repeatedly describes server-confirmed funds, no duplicate charge, held/reconciled sessions, and reconnect recovery—appropriate constraints for Riverpod state driven by authoritative Supabase/server outcomes. [1] |

## Required corrections before implementation

| Priority | Issue | Why it matters | Required correction |
| --- | --- | --- | --- |
| **P0** | **Missing user-visible reject and request-timeout outcome** | The state map includes `REJECTED`, and the host can decline, but the user journey has no “host declined,” “host did not respond,” or “you cancelled” destination. A generic failed/refund screen is not the same outcome and could be misleading. | Add one reusable **Request closed** screen with variants for **declined**, **timed out**, and **cancelled**. State clearly whether a temporary reservation was released and offer **try another host**. |
| **P0** | **No visible temporary credit reservation** | The pending screen says “Your funds are not charged yet,” while the product must prevent a user from initiating overlapping calls or spending the same credits twice. A final charge is not the same as a temporary reserve. | On request creation, atomically create a server-side **reservation** for the minimum authorised amount, display it in Wallet as “Reserved,” and release it on cancel, decline, expiry, or failed connection. Use “not finally charged yet,” not “not charged.” |
| **P0** | **Post-minimum billing/funds-exhaustion rules are unclear** | The flow shows a 5-minute minimum and a $4.00 estimate but does not say how a longer call is authorised, when billing pauses, or what happens as wallet funds run out. | Define one explicit rule: for example, reserve the minimum, bill only authoritative connected time, warn before the next billable interval cannot be covered, and end safely when funds are exhausted. Add a low-balance in-call warning and terminal outcome. |
| **P0** | **Host access is treated as a profile switch** | Screen 33 exposes “Switch to host mode,” but there is no host application, verification, approval, suspension, or role-authorization state. This must not be a client-side toggle. | Make Host mode available only after a server-authorized role check. Add a host onboarding/approval state if the business requires it, and hide the option from ordinary user accounts. |
| **P1** | **Incoming-call copy is inconsistent** | Screen 21’s header data says “Maya wants to talk,” although the host screen body says “Alex wants to talk.” The host should see the caller’s identity. | Change the header to **“Alex wants to talk”** (or the relevant caller) and keep the caller, rate, minimum duration, and expiry timer consistent. |
| **P1** | **Top-up has no completion, cancellation, or payment-failure outcome** | The board reaches “Confirm payment,” but does not show pending processor confirmation, success, failure, cancellation, or a duplicate-payment-safe retry. | Add one **Top-up processing** state and result variants for **credited**, **failed/cancelled**, and **pending review** if applicable. Do not credit the wallet until a trusted server-side payment confirmation is received. |
| **P1** | **Permissions are duplicated and partly premature** | The permission centre offers microphone access, then a separate microphone-permission screen appears. This conflicts with the stated just-in-time permission principle. | Keep notifications and optional contacts in a preference centre; defer the operating-system microphone request until **after Call request** or immediately before **Connecting**. Add a microphone-denied recovery screen with settings guidance. |
| **P1** | **Reconnect/recovery is not complete** | Reconnecting is present, which is excellent, but users need recovery after app backgrounding, process restart, a stale availability signal, and an already-ended server session. | Add a reusable **Restoring active call** / **Session no longer active** state. The client must query the authoritative call session rather than assume the local timer or call flag remains valid. |
| **P1** | **Safety controls need symmetric, contextual outcomes** | Users can report/block a host, but the host workflow does not show report/block caller actions. Neither role has report reasons, confirmation, or the subsequent “contact prevented” state. | Add report categories, a submitted confirmation, block confirmation, and role-symmetric report/block actions during or after a call. Support should describe reviewing a **concern about a session**, not imply reviewing unrecorded call audio. |
| **P1** | **Dangling “Message first” action** | The host profile exposes “Message first,” but no pre-call message flow exists in the 33 screens. | Either remove this action from the MVP reference or add the associated message thread, permissions, safety, and moderation states. |
| **P2** | **Visual utility classes are missing** | `list-line`, `split`, and `stat` are used in the HTML but are not defined in the stylesheet. The wallet terms, receipt rows, and host dashboard statistics will not lay out as intended in the reference board. | Add styles for these classes, or replace them with existing `row`/grid patterns. This does not change workflow logic, but it should be fixed before using the board as a visual source. [1] |
| **P2** | **Host catalogue content must match the real host policy** | The board calls the catalogue “hosts” yet includes Maya and Noah. If Friendoo’s product policy is restricted to verified female hosts, that sample data and all filters need to reflect the policy consistently. | Use role-verified catalogue data and enforce eligibility server-side; treat the UI label or sample persona as a product-policy decision, not a client-side convention. |

## Corrected call transaction contract

The visual flow should map to the following authoritative transaction contract. Widgets may display the status, but they must not calculate or commit the balance, rate, duration, final charge, role, or availability independently.

| Event | Server-authoritative effect | User-visible state |
| --- | --- | --- |
| User requests a call | Validate host role/availability and wallet; create one idempotent session and temporary minimum reservation. | **Request sent** with expiry timer and the reservation amount. |
| User cancels, host declines, or timer expires | Close the request once, release reservation, update host/user availability as appropriate. | **Request closed** with outcome and released-reservation confirmation. |
| Host accepts | Transition only the current valid request into accepted/connecting. | **Connecting your call** for both parties. |
| Both parties connect | Start billable duration only when the authoritative connection rule is fulfilled. | **Connected** with live duration, rate, and estimate. |
| Connection is lost | Pause or apply the documented billing rule once; attempt recovery from the server session. | **Reconnecting** with safe-end option. |
| Call ends | End idempotently, calculate final billable duration, settle charge/reservation/refund, persist receipt. | **Call complete** or a precise failed/refund outcome. |

## Navigation and scope recommendation

The five-tab structure—Home, Hosts, Wallet, Calls, Profile—is appropriate for a call-first MVP. The primary entry should be **Hosts**, not a social feed. Host-specific paths should sit behind server-authorized role gates rather than appearing as a general account-mode switch.

The current 33 screens are sufficient for an initial design system and route map once the P0 items are added. Do **not** add feeds, groups, stories, events, or broad community features until activation, call connection success, billing reconciliation, safety handling, and host availability are operating reliably. Those features would widen the real-time and moderation surface without resolving the core conversion loop.

## Implementation verdict

**Yes—this updated workflow is substantially correct for Friendoo and should replace the earlier generic social-app reference.** Before implementation starts, resolve the four P0 issues: request closing states, temporary reservation, longer-call/funds-exhaustion rules, and server-authorized host access. After that, the 33-screen board can become the basis for Flutter routes, Riverpod state contracts, and backend/API state transitions.

## Reference

[1]: ./friendoo-audio-call-33-screen-reference.html "Supplied Friendoo audio-call 33-screen HTML reference"
