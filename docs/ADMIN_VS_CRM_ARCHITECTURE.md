# Friendoo: Admin Console vs. CRM Platform Architecture

## Executive Summary

Friendoo runs two distinct administrative services:
1. **Admin Console (`admin.friendoo.in` / port 3000)**: System governance, platform configuration, financial authorization, infrastructure health, and moderation.
2. **CRM Platform (`crm.friendoo.in` / port 3001)**: Customer lifecycle management, audience segmentation, marketing push campaigns, conversion funnels, and customer support.

This document establishes strict boundaries between what belongs under **Admin** vs. **CRM** to eliminate duplication, protect financial authorities, and enforce least-privilege operational roles.

---

## 1. Domain Separation Matrix

| Functional Area | **ADMIN CONSOLE** (Governance & Operations) | **CRM PLATFORM** (Customer & Growth) |
|---|---|---|
| **Primary Users** | Superadmin, DevOps, Chief of Finance, Trust & Safety Leads | Customer Support Agents, Marketing/Growth Leads, Host Talent Managers |
| **Financial Authority** | **FULL EXECUTION & RECONCILIATION**<br>• Approves Cashfree Host UPI Payouts<br>• Configures Coin Pack prices (₹39, ₹49, ₹99)<br>• Gateway reconciliation & transaction ledger | **READ-ONLY / DISPUTE INQUIRY**<br>• Customer refund request logging<br>• Customer Lifetime Value (LTV) analytics<br>• Churn recovery discount offers |
| **Host Management** | **SYSTEM GOVERNANCE & VERIFICATION**<br>• Host KYC review & Government ID approval<br>• Host legal agreements & payout bank accounts<br>• System-level ban / unban / suspension | **RELATIONSHIP & TALENT COACHING**<br>• Host performance scoring & talk time trends<br>• Community manager relationship notes<br>• Host onboarding coaching & retention |
| **Calls & Infrastructure** | **SYSTEM TELEMETRY & AVAILABILITY**<br>• Live Agora / WebRTC concurrent channels<br>• Edge Function health & Redis cache stats<br>• Maintenance mode global kill switch | **USER DISPUTE & AUDIT TRAIL**<br>• Customer call history for ticket resolution<br>• Call quality rating analysis (1-5 stars)<br>• Call duration & drop-off analytics |
| **Marketing & Advertising** | **IN-APP DISPLAY SLOTS**<br>• Cloud Ad Banner carousel slots<br>• Peak-Hour Surge multiplier schedules<br>• Third-party advertiser contracts & approvals | **CUSTOMER CAMPAIGNS & FUNNELS**<br>• Push notification & SMS journeys<br>• User segment builder (VIP, Low-Balance, Churn)<br>• Funnel drop-off analytics (Signup → Call) |
| **User & Customer Data** | **SECURITY & ACCOUNT GOVERNANCE**<br>• System status (Active, System Banned)<br>• Audit trail logs for admin actions<br>• Compliance & legal export | **LIFECYCLE & ENGAGEMENT**<br>• Customer support tickets & resolution<br>• User journey timeline (First recharge, calls)<br>• Customer satisfaction (CSAT) scoring |

---

## 2. Hard Boundaries (Zero Duplication Rule)

### What Must NEVER Be in CRM:
1. **Payout Approvals**: CRM agents must NEVER have access to approve bank/UPI withdrawals or execute financial transfers.
2. **Catalog Price Editing**: Base coin prices, recharge packages, and talk rates are defined only in Admin.
3. **Maintenance Mode & System Keys**: Infrastructure credentials, Redis configuration, and global platform kill switches are strictly Admin-only.

### What Must NEVER Be in Admin:
1. **Marketing Journeys & Push Blasts**: Broadcast campaigns, SMS queues, and conversion segment builders belong exclusively to CRM.
2. **Customer Support Ticket Handling**: Support chats, user journey timelines, and customer notes belong exclusively to CRM.
3. **Conversion Funnel Analytics**: Granular drop-off funnel steps belong in CRM.

---

## 3. The Shared Layer (What Is Shared)

Only three elements are shared across both services:
1. **Authentication & Authorization**: Both services authenticate against Supabase Auth and verify role credentials (`role = 'service_role'` or admin JWT).
2. **Database of Record**: Both services read from the primary Supabase PostgreSQL instance.
3. **Mutual Cross-Link Navigation**:
   - Admin sidebar provides a 1-click shortcut: `Switch to CRM Operations ↗`.
   - CRM sidebar provides a 1-click shortcut: `Switch to Admin Console ↗`.

