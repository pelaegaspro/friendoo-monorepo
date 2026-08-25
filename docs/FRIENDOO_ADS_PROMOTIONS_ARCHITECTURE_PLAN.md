# Friendoo Ads and Promotions Architecture Plan

Status: DRAFT - premise gate required before implementation
Date: 2026-08-24
Scope: Fix the ads/promotions UI and enable safe third-party sponsored ads plus first-party promotional offers.

## Executive Decision

Build one marketing operations system with two clearly separated campaign classes:

1. **Friendoo promotion:** a server-authoritative offer that changes or advertises Friendoo coin pricing, host incentives, or retention rewards.
2. **Sponsored advertisement:** paid placement for an external advertiser, with advertiser identity, creative review, schedule, placement, budget, destination validation, delivery limits, and reporting.

Keep one delivery surface in the Flutter app, but never mix the financial meaning of an offer with the commercial meaning of a sponsored ad. A sponsored ad may link externally; it must not silently change wallet balances, coin prices, or call billing.

Recommendation: extend the existing Supabase-backed `banner_ads`, `promotional_offers`, and `crm_campaigns` model with an explicit sponsored campaign layer and a shared moderation/analytics contract.

## CEO Review

### Problem

Friendoo already has useful ad and offer UI:

- Admin cloud ad management at `admin/app/admin/(panel)/ads/page.tsx`.
- Flutter banner rendering at `flutter_app/lib/features/ads/presentation/cloud_banner_ad_widget.dart`.
- Flutter interactive ad dialog at `flutter_app/lib/features/ads/presentation/interactive_5s_ad_dialog.dart`.
- Flutter ad loading and click/impression events at `flutter_app/lib/features/ads/data/banner_ad_repository.dart`.
- Admin ad API routes at `admin/app/api/admin/ads/`.
- Supabase banner schema at `supabase/migrations/20260823_000015_cloud_banner_ads.sql` and `20260823_000016_flash_offers_and_host_incentives.sql`.
- Server-authoritative offer schema and eligibility RPC at `supabase/migrations/20260824_000020_cloud_promotional_offers_and_campaigns.sql`.
- CRM campaign creation and queued delivery events at `crm/app/api/crm/campaigns/`.

The gap is not the absence of a banner. The gap is that the current `banner_ads` shape is both a creative record and a promotion record, while third-party advertising needs a commercial, compliance, and delivery lifecycle.

### Current Premises

| Premise | Assessment | Required proof |
|---|---|---|
| Third parties will pay for Friendoo audience access | Reasonable but unverified | Obtain advertiser interviews or signed pilot commitments |
| A simple external-link banner is enough for v1 | Unsafe | Add approval, destination checks, schedule, frequency, and reporting |
| Existing banner UI can be reused | Valid | Keep the renderer contract stable and add metadata |
| Promotions and sponsored ads can share one table without type separation | False | Explicit campaign class and server validation are required |
| Client-submitted price/coin fields are trustworthy | False | Eligibility and redemption must remain server-authoritative |
| Firebase and Supabase are both active | Unknown | Verify production deployment and database of record before rollout |

### 12-Month Ideal

`advertiser or internal operator -> approved campaign -> audience/placement policy -> eligible delivery -> measured impression/click/conversion -> billing or redemption ledger -> safety review -> reporting`

The system should eventually support self-serve advertiser intake, but v1 should remain operator-managed. A self-serve advertiser portal adds identity verification, invoicing, refunds, legal terms, creative moderation, and abuse handling. It is a separate product, not a form field.

## Existing Code Leverage Map

| Need | Existing leverage | Decision |
|---|---|---|
| Admin creative editor | `admin/.../ads/page.tsx` | Repair into tabs for Offers and Sponsored Ads |
| Admin API auth | `admin/lib/admin/guard.ts` | Reuse |
| Server Supabase access | `admin/lib/supabaseServer.ts` | Reuse |
| Flutter banner renderer | `cloud_banner_ad_widget.dart` | Preserve stable display contract |
| Interactive external link | `interactive_5s_ad_dialog.dart` | Preserve only for approved sponsored creatives; validate URL server-side |
| First-party recharge CTA | `recharge_checkout_sheet.dart` | Preserve; offer values come from server eligibility |
| Impression/click RPC | `record_ad_event` | Extend with campaign/user/placement context and idempotency |
| CRM campaigns | `crm_campaigns` and delivery events | Reuse for push/in-app messages, do not use as the ad billing ledger |
| Offer eligibility | `validate_user_offer_eligibility` | Reuse for first-party promotions |
| Audit and operational events | `admin_audit_logs`, `operational_events` | Require for privileged campaign changes |

## Product and UI Plan

### Admin Ads Center

Replace the current single-form experience with an operations workspace:

- Header: `Ads & Promotions`, active campaigns, pending review, spend/revenue summary, emergency pause state.
- Segmented mode: `Friendoo Offers` and `Sponsored Ads`.
- Campaign table: status, advertiser, placement, audience, schedule, delivery, spend/redemptions, CTR, owner, last update.
- Create campaign drawer with steps:
  1. Campaign type and advertiser.
  2. Creative and destination.
  3. Audience and placement.
  4. Schedule, frequency, budget, and limits.
  5. Review, policy attestations, and save as draft.
- Preview panel for mobile home banner, discovery banner, wallet banner, post-call placement, popup, and external-link behavior.
- Explicit states: draft, pending review, approved, scheduled, live, paused, expired, rejected, exhausted, archived.
- Actions: save draft, submit review, approve, reject with reason, pause, resume, archive, emergency kill switch.
- Never hide whether the user is seeing a Friendoo offer or a paid sponsor.

### Flutter Consumer Surface

Keep the visual banner component but add clear sponsored treatment:

- Sponsored label and advertiser name for third-party content.
- First-party offer label for Friendoo promotions.
- Server-provided CTA and destination only.
- No sponsored popup during an active call, safety/report flow, payment confirmation, or permission prompt.
- Respect user promotional notification preference.
- Record impression only once per campaign/user/placement window.
- Record click before leaving the app, without blocking navigation.
- If the ad fails to load, show no broken external URL and no misleading offer state.

### CRM Surface

Add a campaign detail route or panel with:

- audience definition,
- delivery status,
- impressions, unique impressions, clicks, CTR,
- offer redemptions or sponsored conversion events,
- budget/spend and remaining cap where applicable,
- rejection/approval history,
- user safety complaints attributed to the campaign.

CRM can analyze and queue campaigns, but financial authorization and advertiser settlement must remain on the server/admin boundary.

## Backend Architecture

### Campaign Lifecycle

`draft -> pending_review -> approved -> scheduled -> live -> paused/expired/exhausted -> archived`

Rejection and emergency pause are terminal or controlled transitions with an actor, timestamp, reason, and audit record.

### Recommended Tables

#### `advertisers`

- `id uuid primary key`
- `legal_name text`
- `display_name text`
- `contact_email text`
- `website_url text`
- `status text`: `pending`, `approved`, `suspended`, `archived`
- `billing_customer_ref text null`
- `created_by uuid null`
- `created_at`, `updated_at`

#### `ad_campaigns`

- `id uuid primary key`
- `advertiser_id uuid null` for Friendoo-owned campaigns
- `campaign_class text`: `friendoo_offer`, `sponsored_ad`
- `name`, `headline`, `body`, `badge_text`
- `image_url`, `destination_url`, `deep_link`
- `placement text`: `home`, `discovery`, `wallet`, `post_call`, `profile`
- `target_segment text`
- `status text`
- `start_at`, `end_at`
- `priority integer`
- `frequency_cap_per_user integer`
- `daily_impression_cap integer null`
- `total_impression_cap integer null`
- `budget_inr numeric null` for sponsored campaigns
- `bid_model text null`: `flat`, `cpm`, `cpc`, `cpa`
- `rate_inr numeric null`
- `review_note text null`
- `approved_by uuid null`
- `approved_at timestamptz null`
- `created_by uuid null`
- timestamps

#### `ad_creatives`

- `id`, `campaign_id`, `version`
- `headline`, `subtitle`, `image_url`, `cta_text`
- `destination_url`
- `review_status`, `review_note`
- `created_at`

#### `ad_delivery_events`

- `id`
- `campaign_id`, `creative_id`, `user_id null`
- `placement`, `event_type`: `impression`, `click`, `conversion`, `dismiss`
- `idempotency_key unique`
- `metadata jsonb`
- `created_at`

#### `ad_spend_ledger`

- `id`, `campaign_id`, `event_id`
- `billing_model`, `amount_inr`
- `currency`
- `status`: `pending`, `posted`, `voided`
- `idempotency_key unique`
- `created_at`

#### `offer_redemptions`

Keep the existing table for Friendoo offer wallet crediting. Do not combine it with advertiser spend events.

### Compatibility Strategy

Do not immediately delete `banner_ads` or `promotional_offers`. Add a compatibility read model or migration fields, then move delivery reads to `ad_campaigns` after dual-read verification. Existing Flutter `CloudBannerAd` can remain the presentation DTO while a server mapper supplies `sponsorName`, `campaignClass`, `campaignId`, `approvedDestination`, and delivery metadata.

## Security and Policy Boundaries

- Only approved admins can create or modify campaigns.
- Only a separate review permission can approve sponsored creative.
- Advertiser destinations allow only HTTPS, approved app deep links, or explicitly reviewed marketplace links.
- Reject executable schemes, open redirects, tracking URLs that hide the final destination, and destinations that violate platform policy.
- Do not allow third-party creative to alter coin amount, price, wallet balance, billing, call state, or permissions.
- Apply global kill switches for promotions and banners before selecting any campaign.
- Enforce audience, schedule, frequency, and budget server-side.
- Do not expose advertiser billing secrets, service-role keys, or internal moderation notes to Flutter.
- Store consent and notification preference separately from ad eligibility.
- Keep event ingestion idempotent and rate-limited.
- Add a report-ad action and campaign attribution to safety reports.

## API Contract

Admin:

- `GET /api/admin/ad-campaigns`
- `POST /api/admin/ad-campaigns`
- `PATCH /api/admin/ad-campaigns/:id`
- `POST /api/admin/ad-campaigns/:id/submit-review`
- `POST /api/admin/ad-campaigns/:id/approve`
- `POST /api/admin/ad-campaigns/:id/pause`
- `POST /api/admin/ad-campaigns/:id/archive`
- `GET /api/admin/ad-campaigns/:id/analytics`

Consumer:

- `GET /api or Supabase RPC for eligible campaigns by placement`
- `POST /api or RPC for idempotent delivery event`
- `POST /api or RPC for offer eligibility`
- `POST /api or RPC for offer redemption`

CRM:

- Use existing campaign routes for messages and segment operations.
- Add read-only campaign analytics and delivery status; do not duplicate admin approval logic.

Every mutation returns a stable resource ID, status, and audit/event reference. Errors must say what failed and whether the operator can retry.

## Failure and Rescue Registry

| Failure | User impact | Rescue |
|---|---|---|
| Invalid sponsor URL | Unsafe or broken navigation | Reject before approval; keep previous approved creative live |
| Campaign expires during display | Stale offer claim | Revalidate eligibility at CTA/redemption |
| Duplicate impression/click | Inflated analytics | Unique idempotency key per event window |
| Budget exhausted | Overspend | Atomic server-side cap check before delivery |
| Kill switch enabled | Campaign should disappear quickly | Check kill switch in eligibility query and cache short TTL |
| Sponsor suspended | Unsafe campaign remains visible | Server excludes all campaigns for suspended advertiser |
| External destination unavailable | Broken user journey | Show an in-app fallback and record destination failure |
| Wallet offer tampering | Incorrect credit | Server RPC reads canonical offer values |
| Database/backend mismatch | Different console/app behavior | Production truth table and single delivery API |
| Moderation complaint | Harm or trust loss | Attribute campaign, pause campaign, review advertiser |

## Test Diagram

| Codepath | Test |
|---|---|
| Admin creates Friendoo offer | API validation and database integration test |
| Admin creates sponsored campaign | API validation rejects missing advertiser, URL, dates, placement, and creative |
| Review approval | Authorization test and audit log assertion |
| Campaign schedule | Time-bound eligibility tests using fixed clocks |
| Audience targeting | Segment eligibility tests for users, hosts, new, low-balance, and priority segments |
| Flutter banner mapping | Widget test for sponsored label, CTA, image fallback, and placement |
| External click | URL allowlist test and navigation intent test |
| Impression event | Once-per-window and duplicate idempotency tests |
| Offer redemption | Server-authoritative coin/price, per-user cap, global cap, replay protection |
| Kill switch | Integration test that active campaigns disappear when enabled |
| Budget cap | Concurrent event test proves no overspend |
| Expiry during checkout | Redemption revalidation test |
| Sponsor suspension | Eligibility excludes suspended advertiser |
| Admin/CRM analytics | Event totals, CTR, conversion, spend, and attribution tests |
| Failure recovery | Network retry, timeout, stale cache, and partial API failure tests |

## Phased Implementation

### Phase 1: Fix the existing UI and contracts

- Split Admin Ads Center into Friendoo Offers and Sponsored Ads modes.
- Add explicit sponsored metadata to the Flutter banner DTO.
- Improve loading, empty, error, paused, expired, and rejected states.
- Preserve current first-party recharge flows.
- Add unit/widget coverage for rendering and navigation.

### Phase 2: Add server campaign lifecycle

- Add advertiser and campaign tables.
- Add approval/status transitions and audit records.
- Add destination validation and placement policy.
- Add eligible-campaign RPC/API with kill switches and caps.
- Migrate existing banner records into the compatibility model.

### Phase 3: Add delivery analytics and offer hardening

- Add idempotent impression/click/conversion events.
- Add frequency and budget enforcement.
- Add CRM analytics panel.
- Revalidate offer eligibility and pricing at redemption.
- Add campaign-attributed user reports and emergency pause workflow.

### Phase 4: Controlled third-party pilot

- Operator-created campaigns only.
- One or two approved advertisers.
- Home/discovery placements only; no active-call or payment-confirmation placements.
- Manual invoice/settlement until spend ledger is proven.
- Weekly safety, conversion, and user-retention review.

## Not In Scope Yet

- Self-serve advertiser signup and billing portal.
- Programmatic ad auctions.
- Third-party ad SDKs.
- Personalized behavioral ad profiling without explicit consent.
- Ads during active calls, safety flows, permission prompts, or checkout confirmation.
- Changing core call prices based on an ad payload.
- Mixing sponsor spend with user wallet accounting.
- Declaring production readiness before Firebase/Supabase ownership is verified.

## Success Metrics

- Admin can create, preview, approve, pause, and report both campaign classes.
- 100% of live sponsored campaigns have an approved advertiser and destination.
- Zero client-authorized wallet or price changes from ad payloads.
- Duplicate event rate below 0.1% after idempotency.
- Campaign pause/kill switch reflected in eligible delivery within the agreed cache window.
- Sponsored CTR and conversion are attributable by campaign and creative version.
- No increase in call abandonment, report rate, or payment failure after pilot launch.
- First-party offer redemption remains server-authoritative and replay-safe.

## Required Premise Confirmation

Before implementation, confirm this premise:

> Third-party ads should be operator-managed paid campaigns in v1, with manual approval and settlement, while Friendoo offers remain server-authoritative wallet/promotion features. Self-serve advertiser onboarding is deferred until the pilot proves demand and safety.

## Review Status

- CEO review: initial strategy and scope complete; premise confirmation required.
- Design review: initial UI direction complete; detailed review follows premise confirmation.
- Engineering review: initial architecture and test map complete; migration plan follows premise confirmation.
- DX review: deferred; this is an internal operator-facing change, but admin setup documentation will be required.
