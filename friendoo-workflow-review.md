# Friendoo 33-Screen Reference — Workflow Review

**Verdict: partially correct as a generic social-community prototype, but not correct as the production workflow for Friendoo’s current audio-call product.**

## Review scope

This review assesses the supplied `friendoo-33-screen-reference.html` as a product-flow reference. The file declares itself a **“Reference only”** board and renders 33 visual mock screens from a JavaScript array. The only implemented interaction in the HTML is the board’s screen-search filter; the screen buttons, navigation icons, and actions do not route anywhere or execute product logic. Therefore, the assessment validates the **intended information architecture and journeys**, not a functioning Flutter build. [1]

## Overall assessment

The reference is well structured for a general-purpose social app. It covers a coherent sequence from account creation to profile setup, discovery, friendship, messaging, communities, events, notifications, posting, and settings. It is visually consistent and most core consumer-social concepts are represented.

However, Friendoo is an audio-call platform where a user discovers a host, starts an audio call, and consumes balance under authoritative session and payment rules. That conversion-critical journey is not represented. The single voice-call mockup sits inside the generic chat set and shows only an undifferentiated “Calling…” state. It does not show host availability, call price, wallet sufficiency, consent/acceptance, connection state, in-call duration, billing, completion, failure, cancellation, or support/refund handling. [1]

> **Conclusion:** keep the visual system and reusable social features, but do not treat this screen list as the product workflow to implement unchanged.

## What is correct

| Area | Assessment | Evidence in the reference |
| --- | --- | --- |
| Onboarding foundation | **Good** | Splash, welcome, account creation, email verification, username, interests, and photo capture are shown in a logical order (screens 1–7). [1] |
| Social discovery | **Good for a friendship/community app** | Home feed, people discovery, universal search, requests, profiles, contacts, and invites provide a plausible acquisition loop (screens 8–15). [1] |
| Conversation features | **Mostly good** | Inbox, one-to-one chat, new-message picker, group chat, and notification concepts are present (screens 16–19 and 23). [1] |
| Community layer | **Good as an optional retention feature** | Groups, events, posts, comments, stories, saved posts, and notifications form a coherent community ecosystem (screens 20–31). [1] |
| Account control | **Partially good** | Edit profile, privacy settings, blocked accounts, hidden words, notifications, help, and sign-out are surfaced (screens 13 and 27, 32–33). [1] |
| Visual direction | **Good** | The styles consistently use a calm card system, recognizable hierarchy, repeated patterns for rows, buttons, avatars, tabs, and navigation. [1] |

## What is wrong or missing for Friendoo

| Priority | Gap | Why it makes the workflow incorrect | Required change |
| --- | --- | --- | --- |
| **P0** | No dedicated host-discovery journey | “Discover people” treats every profile as a mutual social connection. Friendoo needs users to find available hosts, understand who they are, and decide whether to call. | Replace or augment screens 9–12 with **Host Discovery**, **Host Filters**, **Host Profile**, and **Host Availability** states. Show availability, language/interests, call rate or offer terms, trust badges, and a clear primary call action. |
| **P0** | No wallet / credit system | The user cannot see a balance, buy credits, inspect a charge, or recover from insufficient funds. The current flow contains no monetization screens at all. | Add **Wallet**, **Top-up / payment**, **Transaction history**, **Insufficient balance**, and **call-cost confirmation** screens. Wallet mutations must remain server-authoritative and idempotent in the Flutter/Supabase implementation. |
| **P0** | Call flow is incomplete | Screen 19 only says “Calling…” and exposes controls. It does not model acceptance, timeout, connection, duration, cost, end state, or reconciliation. | Design an explicit call state machine: `IDLE → REQUESTING → ACCEPTED/REJECTED → CONNECTING → CONNECTED → ENDING → COMPLETED/FAILED`. Include cancellation, timeout, reconnecting, user/host disconnect, and post-call receipt states. |
| **P0** | No host-side experience | The reference covers only one generic social role. A production call platform requires a host’s availability controls, incoming-call decision, earnings visibility, schedule, and call-state recovery. | Specify a separate **Host mode** or host app flow with availability toggle, incoming-call screen, accept/decline/timeout, session state, earnings, and support reporting. |
| **P0** | Safety is only a settings page | “Privacy & safety” shows visibility preferences and blocked accounts, but the journey lacks immediate report/block actions at the profile, chat, group, post, and live-call levels. | Add contextual **Report**, **Block**, **Mute**, **Safety confirmation**, and **post-call report** journeys. Provide safety outcomes and avoid relying on settings as the only reporting route. |
| **P1** | Permissions are absent | Profile photo, contact invites, notifications, location-based discovery/events, and microphone use all require permission states, denials, and recovery paths. | Add permission primers and OS-denied fallback screens for contacts, notifications, photos/camera, microphone, and location. |
| **P1** | Authentication is incomplete | The email code screen exists, but there is no sign-in, password reset, sign-out confirmation, session-expired state, or account deletion journey. | Add **Sign in**, **Forgot password**, **Reset success**, **Expired/invalid code**, **Session expired**, **Delete account**, and re-authentication screens as relevant to the chosen auth model. |
| **P1** | Social state changes are not resolved | Screens show “Add,” “Join,” “I am interested,” and “Share post,” but not pending, accepted, declined, joined, published, failed, undo, or duplicate-action states. | Define the state change and destination for every primary action, including optimistic UI, server rejection, empty and retry states. |
| **P1** | Navigation is ambiguous | The shared bottom navigation uses home, search, create, chat, and profile, but groups and events appear to share the search state. Notifications are not a persistent destination. | Establish a navigation map. Either make **Discover** a hub for People / Hosts / Groups / Events or promote high-frequency features to clear destinations. Add badge behavior and a route-back policy. |
| **P2** | Feature scope is too broad for a first release | Feed, stories, groups, group chats, events, posts, saved posts, and comments create a large moderation, real-time, and content-ranking surface before the core paid call loop is proven. | Treat these as later retention modules. Prioritize a compact MVP around onboarding, host discovery, wallet, call lifecycle, history, and safety. |

## Corrected primary workflow

The corrected product journey should be centered on the reason a user opens Friendoo: finding an available host and successfully completing a safe, correctly billed call. Social and community features may support retention, but should not displace this journey from the primary navigation.

| Step | User journey | Essential states / outcomes |
| --- | --- | --- |
| 1 | Launch and restore session | Splash → authenticated home, sign-in, or session-expired recovery. |
| 2 | Complete lightweight onboarding | Account → verification → identity/profile → interests. Defer non-essential permissions until their feature is invoked. |
| 3 | Browse available hosts | Search/filter hosts by availability and relevant attributes. Clearly distinguish a host from an ordinary social connection. |
| 4 | Inspect host profile | Show trustworthy profile information, availability, call terms, relevant boundaries, and actions to report/block. |
| 5 | Establish funds and consent | Show wallet balance and cost terms. If funds are insufficient, route to top-up; otherwise obtain clear confirmation before requesting a call. |
| 6 | Request and establish the call | Requesting → host accepted/rejected/timed out → connecting → connected. Show connection and billing information without relying on client-only state. |
| 7 | Manage the live session | Mute, speaker, end call, reconnecting, network loss, and authoritative session status. Safely handle backgrounding and duplicate actions. |
| 8 | Finish and reconcile | Completed/failed/cancelled outcome, duration, charge/refund result, session record, host availability update, rate/report/block options. |
| 9 | Retain responsibly | Call history, favourites, notifications, and—only after core reliability—social/community experiences such as groups and events. |

## Recommended screen plan

A practical implementation should not begin by building all 33 mockups. The following scope better matches the product’s core loop.

| Release slice | Recommended screens | Purpose |
| --- | --- | --- |
| **Core MVP** | Splash/session restore, sign-in, account setup, host list, host profile, wallet, top-up, call-cost confirmation, call request, incoming-call decision, connecting, active call, completed/failed call, call history, report/block | Validates the product’s core discovery-to-call-to-billing journey. |
| **Operational completion** | Permissions, invalid/expired verification, declined/timeout/reconnect states, transaction history, support/refund, notification settings, profile/settings | Makes the core loop resilient and supportable. |
| **Retention expansion** | Favourites, friend/social discovery, direct messages, feed/posts, groups, events, stories, saved posts | Add only if product metrics justify the added moderation and real-time complexity. |

## Flutter implementation implications

The HTML should be used as a **visual and content reference**, not as a direct navigation specification. In Flutter, model the core call lifecycle separately from widgets, with a server-authoritative session record and Riverpod state that represents loading, success, empty, retryable error, and terminal states. Do not expose call cost, balance, host availability, permissions, or end-of-call accounting as mutable client-only values.

For navigation, define typed routes and the transition contract for each primary action before implementing pages. For example, “Call now” must have deterministic branches for no balance, host unavailable, user cancellation, host rejection, request timeout, connection failure, and a connected call. Likewise, every create/join/add action needs explicit pending, success, failure, and duplicate-action behavior.

## Final decision

**The Codex workflow is visually polished and logically acceptable for a broad friendship/community app. It is not yet the correct workflow for Friendoo.** The main issue is not styling; it is product alignment. Rework the home/discovery/call/wallet/safety paths first, then retain only the social screens that materially support activation, trust, or retention.

## Reference

[1]: ./friendoo-33-screen-reference.html "Supplied Friendoo 33-screen HTML reference"
