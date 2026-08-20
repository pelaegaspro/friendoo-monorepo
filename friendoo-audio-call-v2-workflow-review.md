# Friendoo Audio-Call Reference V2 — Validation

## Verdict

**V2 is correct enough to become the implementation reference for Friendoo’s core MVP.** It resolves every previous P0 workflow gap: closed-request outcomes, minimum-credit reservation, in-call low-balance handling, server-controlled host access, payment-result states, and just-in-time microphone access. The product is now clearly call-first rather than a generic social app. [1]

> **Implementation gate:** the board defines the intended user experience. The backend must still make the database—not Flutter UI, presence, or local timers—the final authority for host role, availability, call session, reservation, charge, release, refund, and safety status.

## Resolved issues

| Earlier gap | V2 status | Evidence |
| --- | --- | --- |
| Declined, timed-out, and cancelled requests | **Resolved** | Screen 22 presents all three outcomes and confirms the reservation release. [1] |
| Minimum-funds reservation | **Resolved** | Wallet, consent, pending request, transactions, and closed outcomes consistently distinguish a reservation from a final charge. [1] |
| Low-balance state during a call | **Resolved** | Screen 28 warns before the next billable interval cannot be covered and provides top-up or safe-end choices. [1] |
| Host authorization | **Resolved** | Screens 24–25 describe an approval path and a server-approved host dashboard, rather than a client-side mode switch. [1] |
| Payment processing and terminal outcomes | **Resolved** | Screens 16–17 distinguish processing, credited, pending review, and failed/cancelled outcomes. [1] |
| Microphone request timing | **Resolved** | The preference screen explicitly excludes microphone permission; the OS request happens at connection time, with denial recovery. [1] |
| App/session restoration | **Resolved** | The reconnect screen says to query the authoritative session after a lost connection or app backgrounding. [1] |
| Pre-call safety context | **Resolved** | Host profile and dedicated safety actions provide report, block, boundaries, and support before a call. [1] |

## Remaining corrections

No remaining issue blocks design implementation, but resolve these before the relevant feature is released.

| Priority | Remaining issue | Correction |
| --- | --- | --- |
| **P1** | **Top-up “Cancel” during processor confirmation is unsafe wording.** A payment may still settle after the user leaves the screen. | Replace **Cancel** with **Close** or **I’ll check later**. Persist an idempotent payment attempt and show its final state from the server. |
| **P1** | **The receipt does not explain a call exceeding the $4.00 reservation.** A $6.96 final charge is shown, but the user should see the $4.00 reservation applied and the additional $2.96 collected. | Add a receipt breakdown: `Reservation applied $4.00`, `Additional connected-time charge $2.96`, `Final charge $6.96`, and `Released remainder $0.00`. |
| **P1** | **Failure copy mixes “reservation released” and “refund pending.”** These have distinct financial meanings. | Use explicit variants: `Reservation released—no final charge` or `Charge made—refund pending`. Never show both as one ambiguous result. |
| **P1** | **Report/block appears user-focused.** The final history/support screen has a shared role label, but it does not explicitly show a host reporting or blocking a caller. | Add role-specific labels and report reasons for both users and hosts, plus confirmation and contact-prevented outcomes. |
| **P1** | **Host catalogue sample data may conflict with the marketplace policy.** The board includes both Maya and Noah as hosts. | If production policy permits only verified female hosts, align sample content, filter logic, and backend eligibility enforcement accordingly. |
| **P2** | **Account controls are not explicitly represented.** Profile, privacy, sign-out, account deletion, and notification settings are compressed out of the 33 screens. | Add them as secondary routes or specify them in the Flutter route contract; they need not displace the core call flow. |
| **P2** | **Top-up during a live call needs platform behavior defined.** | Decide whether the call remains active while an external payment sheet is open, whether billing is paused, and how the UI recovers if the user returns late or payment fails. |

## Required implementation contract

| Domain | Server-side rule |
| --- | --- |
| **Host discovery** | Return only eligible, approved, and currently valid hosts. Treat presence as a display aid, not final availability authority. |
| **Call request** | Create one idempotent request and reservation after validating role, host availability, price, and wallet balance in one atomic operation. |
| **Request closure** | Cancellation, decline, and timeout must close the same request once and release the reservation once. |
| **Connection and billing** | Begin billable time only after the authoritative connected condition is met. Never calculate final duration or charge solely from a device timer. |
| **In-call balance** | Apply the documented rule for ongoing funded intervals, warn before a non-funded interval, and end cleanly if funds cannot cover continuation. |
| **Settlement** | End once, persist immutable session/ledger events, calculate the final charge, release any remainder, and create a durable receipt. |
| **Payments** | Credit a wallet only after verified provider confirmation. Webhook retries and return-to-app flows must be idempotent. |
| **Roles and safety** | Enforce host approval, block state, report access, and data visibility through database authorization; do not trust client role or permission flags. |

## Final recommendation

**Approve V2 for Flutter route planning and design implementation.** Resolve the five P1 details while building the corresponding flows, and keep all money and session transitions behind server-side, idempotent database operations. Do not add Kubernetes, microservices, gRPC, GraphQL, or other infrastructure complexity before the core call, wallet, and settlement metrics demonstrate a concrete need.

## Reference

[1]: ./friendoo-audio-call-33-screen-reference-v2.html "Supplied Friendoo audio-call 33-screen reference V2"
