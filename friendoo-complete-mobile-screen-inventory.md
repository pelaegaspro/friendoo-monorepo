# Friendoo Complete Mobile Screen Inventory

**Prepared by Manus AI**

## Recommendation

The approved V2 workflow contains **33 core screens**. That number is suitable for a tightly scoped call-first MVP, but it is **not** the complete visual-design scope of the Friendoo app. It compresses several important destinations into combined screens or variants, and it does not provide dedicated boards for account details, legal policy pages, payment-method management, transaction details, payouts, or support tickets.

For a complete, responsive mobile product design, I recommend designing **67 standalone mobile screen boards**. This total comprises the **33 approved core workflow boards** plus **34 supporting account, policy, finance, host-operation, and support boards**. Additionally, the design system should include reusable transient states—such as bottom sheets, confirmation dialogs, empty states, and offline recovery—rather than treating every small modal as a separate page.

> **Design rule:** Count every navigation destination with its own title, back action, deep-link possibility, or durable content as a screen. Count short-lived confirmations, permission prompts, filter sheets, toast messages, and loading treatments as reusable states unless they need a full dedicated layout.

## What the current Flutter app already exposes

The current Flutter application is a useful starting shell, but it is not yet a complete 67-screen product. It currently contains a phone-authentication entry flow and one authenticated shell that switches between four user tabs—Discover, Calls, Wallet, and Profile—and four host-mode tabs—Dashboard, Requests, Earnings, and Host Profile. The active-call and call-summary experiences currently appear as overlays or dialogs. The approved V2 specification therefore remains the correct basis for the full screen-design scope. [1]

| Scope | Recommended boards | Purpose |
| --- | ---: | --- |
| Authentication, onboarding, and legal | 9 | Establish identity, profile, permissions, and clear policy access. |
| Host discovery, trust, and safety | 8 | Help a user find a suitable host and make an informed, safe decision. |
| Wallet, payment, and transaction detail | 11 | Make credits, payment outcomes, and financial records transparent. |
| User call lifecycle and call records | 18 | Cover every meaningful request, connection, billing, recovery, and receipt outcome. |
| Host access, availability, earnings, and payouts | 11 | Support a separate, server-authorized host operating flow. |
| Profile, privacy, security, and support | 10 | Give users durable account controls and post-call help routes. |
| **Total responsive screen boards** | **67** | **Full visual-design scope for the current product definition.** |

## 1. Authentication, onboarding, and legal — 9 screens

| ID | Screen | Primary purpose | Core navigation |
| --- | --- | --- | --- |
| A01 | Splash and secure-session restore | Restore authentication and an active call only from authoritative state. | Launch destination. |
| A02 | Welcome and entry | Explain the call-first value proposition and direct a new or returning user. | Continue → Phone login. |
| A03 | Phone-number login | Capture and validate the phone number. | Send code → OTP verification. |
| A04 | OTP verification | Verify the one-time code with resend and change-number actions. | Success → Profile setup or Discover. |
| A05 | Code expired | Recover from an expired or rate-limited OTP safely. | Request new code / change number. |
| A06 | Profile setup | Capture name, optional avatar, interests, and languages. | Continue → Permission preferences. |
| A07 | Permission preferences | Explain optional notifications, contacts, and photo permissions. | Continue → Discover. |
| A08 | Terms of service | Provide an independently scrollable legal destination with acceptance metadata where required. | Back → prior onboarding or Account legal centre. |
| A09 | Privacy policy | Provide an independently scrollable privacy-policy destination. | Back → prior onboarding or Account legal centre. |

## 2. Host discovery, trust, and safety — 8 screens

| ID | Screen | Primary purpose | Core navigation |
| --- | --- | --- | --- |
| D01 | Host discovery | Browse approved, eligible, available hosts with rate, language, trust, and availability signals. | Host profile / Search / Filters. |
| D02 | Search hosts | Search with recent and suggested searches rather than a blank state. | Result → Host profile. |
| D03 | Host filters | Filter availability, language, interests, price, and schedule using backend-supported values. | Apply → Discovery. |
| D04 | Host profile detail | Present a host’s identity, verification cues, languages, rate, availability expectation, and concise description. | View terms / Safety actions. |
| D05 | Host trust and guidelines | Explain verification, boundaries, acceptable conduct, and safety expectations. | Continue → Pricing and availability. |
| D06 | Availability and call terms | Present rate, minimum reservation, estimated costs, boundaries, and availability. | Continue → Call cost confirmation. |
| D07 | Safety action centre | Offer report, block, support, and boundary information before or after a call. | Report / Block confirmation. |
| D08 | Report submitted and block confirmation | Confirm the submitted safety action and state its concrete effect. | Return to profile, discovery, or support. |

## 3. Wallet, payment, and transaction detail — 11 screens

| ID | Screen | Primary purpose | Core navigation |
| --- | --- | --- | --- |
| W01 | Wallet overview | Separate available from reserved credits and show recent ledger activity. | Top up / Transaction history. |
| W02 | Choose top-up amount | Select a credit amount with clear fee disclosure where applicable. | Payment method. |
| W03 | Payment methods | Select a saved, masked payment method. | Add method / Continue to processing. |
| W04 | Add payment method | Launch only the approved provider flow; never collect raw card data into Friendoo. | Return → Payment methods. |
| W05 | Top-up processing | Show a non-terminal processing state with a safe “check later” action. | Wallet / pending result. |
| W06 | Top-up credited | Confirm a verified server-side wallet credit and updated balance. | Wallet / transaction detail. |
| W07 | Top-up pending review | Explain that the payment is still being verified and should not be retried automatically. | Wallet / support. |
| W08 | Top-up failed or cancelled | Show that no wallet credit occurred and give safe retry guidance. | Retry / Wallet. |
| W09 | Transaction history | List immutable reservations, charges, credits, payouts, and refunds with filtering. | Transaction detail. |
| W10 | Transaction detail | Show amount direction, ledger status, date, related session, and receipt reference. | Receipt / refund tracking / support. |
| W11 | Refund tracking | Show refund status, reference, expected next update, and support path where a financial charge occurred. | Transaction detail / Support ticket. |

## 4. User call lifecycle and call records — 18 screens

| ID | Screen | Primary purpose | Core navigation |
| --- | --- | --- | --- |
| C01 | Call cost confirmation | Capture informed consent using host, rate, balance, and minimum-reservation details. | Request and reserve. |
| C02 | Insufficient balance | Explain the available amount, required reservation, shortfall, and absence of a charge. | Top up / Choose another host. |
| C03 | Request sent and reservation held | Show authoritative pending state, expiry, and reserved—not-finally-charged—amount. | Cancel request. |
| C04 | Request declined | State the host decision and one-time reservation release. | Try another host. |
| C05 | Request timed out | Explain expiration and reservation release. | Try another host. |
| C06 | Request cancelled | Confirm the user cancellation and reservation release. | Discover / Call history. |
| C07 | Connecting | Show a secure connection progress state with a safe end action. | Active call / Recovery. |
| C08 | Microphone-access recovery | Explain microphone need after denial and allow settings or safe request exit. | System settings / End safely. |
| C09 | Active audio call | Present connection status, timer, trusted estimate, mute, speaker, safety, and end controls. | Low balance / End confirmation / Reconnect. |
| C10 | Low-balance warning | Explain the trusted remaining estimate or next billing interval. | Top up / End safely. |
| C11 | Reconnecting and restore | Restore from an authoritative call state after a network, lifecycle, or process interruption. | Resume / End safely / Receipt. |
| C12 | End-call confirmation | Prevent accidental termination and distinguish the estimate from final settlement. | End call. |
| C13 | Ending and settlement progress | Keep the user informed while the final server operation completes. | Receipt / failure outcome. |
| C14 | Call completed receipt | Itemize connected duration, reservation applied, additional charge, released amount, final balance, and reference. | Rate / Report / Call detail. |
| C15 | Call failed—reservation released | State clearly that no final charge happened. | Try another host / Support. |
| C16 | Call failed—refund pending | State clearly that a charge occurred and refund processing is pending. | Refund tracking / Support. |
| C17 | Call history | Show completed, cancelled, timed-out, failed, and refunded sessions. | Call detail. |
| C18 | Call detail and post-call action | Provide receipt access, rate, report/block, billing issue, and support actions for one session. | Receipt / Support ticket. |

## 5. Host access, availability, earnings, and payouts — 11 screens

| ID | Screen | Primary purpose | Core navigation |
| --- | --- | --- | --- |
| H01 | Host authorization | Explain host eligibility, application state, verification, and guideline requirements. | Apply / View status. |
| H02 | Host application | Collect the minimal host-application information under server-authorized rules. | Submit → Verification status. |
| H03 | Host verification status | Present pending, approved, declined, or additional-information states. | Dashboard / Support. |
| H04 | Host dashboard and availability | Show approved status, server-managed availability, incoming-request count, earnings snapshot, and payout status. | Schedule / Incoming call / Earnings. |
| H05 | Availability and schedule settings | Let an approved host define availability windows and view conflicts. | Save → Host dashboard. |
| H06 | Incoming call request | Present permitted caller details, rate, confirmed reservation, and response deadline. | Accept / Decline. |
| H07 | Host earnings | Summarize available, pending, and paid earnings using server data. | Earnings detail / Payouts. |
| H08 | Earnings transaction detail | Explain one earning, adjustment, or chargeback event. | Call detail / Payout detail. |
| H09 | Payout method | Add or manage a masked, approved payout destination. | Payout history. |
| H10 | Payout history | List payout state, amount, destination summary, and date. | Payout detail. |
| H11 | Payout detail | Show one payout’s status, reference, components, and support path. | Support ticket. |

## 6. Profile, privacy, security, and support — 10 screens

| ID | Screen | Primary purpose | Core navigation |
| --- | --- | --- | --- |
| P01 | Profile and account | Provide a durable entry point for personal settings, legal, safety, and support. | Edit profile / Preferences / Help. |
| P02 | Edit profile | Edit personal display data, image, interests, and languages with validation. | Save → Profile. |
| P03 | Notification preferences | Manage call, payment, safety, and support notifications. | Save → Profile. |
| P04 | Privacy and data controls | Manage data disclosures, data-request information, and privacy choices without weakening safety records. | Privacy policy / Profile. |
| P05 | Blocked accounts | Review and remove blocks where policy permits. | Account profile / Host profile. |
| P06 | Account security | Manage authenticated phone number, sessions, recovery, and sign-out. | Phone verification / Profile. |
| P07 | Help centre | Surface searchable categories for calling, wallet, account, and safety help. | Article / Contact support. |
| P08 | Contact support | Create a support request with category, related transaction or call, and attachments where applicable. | Submit → Ticket detail. |
| P09 | Support ticket list | Present open and resolved support requests. | Ticket detail. |
| P10 | Support ticket detail | Show the ticket timeline, secure replies, related references, and closure state. | Return → Ticket list. |

## Reusable state and overlay library

The 67 boards should share a consistent library of short-lived interaction states. These are essential for a credible prototype, but should not inflate the page count unless a state needs a distinct navigation destination.

| Reusable state | Use across |
| --- | --- |
| Loading, empty, offline, retry, and permission-denied states | Discovery, wallet, history, support, and host areas. |
| Confirmation sheets | Block, report, cancel request, end call, remove payment method, and sign out. |
| Filter and sort sheet | Host discovery, transaction history, call history, payout history, and tickets. |
| In-app call controls | Mute, speaker, audio-route selection, and end safety controls. |
| Success and status surfaces | Top-up credited, report submitted, request cancelled, payout submitted, and ticket created. |
| Responsive navigation shell | Bottom navigation on phones; persistent navigation rail or centred app column on wide screens. |

## Responsive design rules for every board

Every screen should be designed from a **375 px narrow-phone baseline**, with a 390 × 844 reference board, a 430 px wide-phone check, and a wide/tablet check. Standard content should remain in a readable centre column rather than expanding edge to edge. The discovery grid may expand from two columns to three or four columns on wide layouts; operational forms, financial receipts, and policy pages should remain narrow and scanable. Primary actions must stay in the lower thumb zone, controls must be at least 44 × 44 logical pixels, and active-call controls must remain reachable in portrait and landscape.

## Delivery sequencing

| Design tranche | Boards | Purpose |
| --- | ---: | --- |
| **Tranche 1 — Core MVP** | 33 | The previously approved call-first flow, including auth, discovery, wallet, request, active call, settlement, host operations, and support. |
| **Tranche 2 — Full product completeness** | 34 | The added standalone policy, account, transaction-detail, payment-method, payout, and ticket-management boards in this inventory. |
| **Shared component/state library** | Not counted as boards | Dialogs, confirmations, filtering, loading, empty, error, offline, and permission states. |
| **Total design target** | **67** | The recommended responsive screen count for a complete Friendoo mobile product prototype. |

## References

[1] [Friendoo V2 — 33-Screen Flutter Implementation Prompt](./friendoo-v2-33-screen-flutter-implementation-prompt.md) — approved call-first product and route specification.
