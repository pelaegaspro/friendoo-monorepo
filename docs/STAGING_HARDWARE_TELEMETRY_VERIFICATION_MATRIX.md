# FRIENDOO — STAGING HARDWARE & TELEMETRY VERIFICATION MATRIX

**Date:** 2026-08-24  
**Authoritative Stack:** Flutter + Supabase + VideoSDK.live (~₹0.38/min) + Agora RTC (Fallback)  
**Status:** Staging-Hardened & Code Frozen

---

## 🎯 Purpose & Scope

This document specifies the rigorous physical-device and backend concurrency verification gates required prior to authorizing a 5% canary deployment.

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                    STAGING GATE VERIFICATION PROTOCOL                     │
├───────────────────────────────────────────────────────────────────────────┤
│ • Gate 1: Supabase PostgreSQL Concurrency (T=61s 4-Way Race)              │
│ • Gate 2: Physical Android Hardware & Audio Telemetry Matrix             │
│ • Gate 3: Payment Webhook Idempotency & Process Death Recovery            │
│ • Gate 4: Promotional Offer Lifecycle & Server Atomicity                  │
│ • P0 Count Gate: 0 (Zero Tolerance)                                       │
│ • P1 Count Gate: 0 Unexplained Anomalies                                  │
│ • 5% Canary Authorization: GATED ON PASS ACROSS GATES 1-4                 │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 🚦 The 4 Mandatory Staging Gates

### Gate 1: PostgreSQL Concurrency Race at $T=61\text{s}$
* **Trigger:** Active Minute Reconciler + Caller Hangup + Inactivity Strike #3 + Server Reaper.
* **Pass Condition:**
  - Exactly **1 terminal state** recorded in `calls.status`.
  - Exactly **1 financial settlement** recorded in `platform_revenue_ledger`.
  - **Zero** duplicate wallet deductions on caller.
  - **Zero** duplicate host credits.
  - Compensating reversal correctly credits platform and zeroes host payout for the disputed interval.

---

### Gate 2: Physical Android Hardware & Audio Telemetry Matrix
* **Physical Tests:**
  1. Bluetooth Disconnect at $T=14\text{s}$ $\rightarrow$ Must trigger `audio_telemetry_technical_fault`, NOT user inactivity strike.
  2. Microphone Permission Revocation $\rightarrow$ Marked as technical fault.
  3. App Backgrounding / Screen Lock $\rightarrow$ Foreground audio service maintains audio transport.
  4. Network Packet Loss (>30%) $\rightarrow$ RTC reconnection buffer (15s) engages gracefully.
  5. Process Death $\rightarrow$ Asymmetric liveness timeout reaps call safely.

---

### Gate 3: Payment Webhook Idempotency & Process Death Recovery
* **Payment Tests:**
  1. Duplicate Webhook Deliveries ($3\times$) $\rightarrow$ Exactly 1 wallet credit via `idempotency_key`.
  2. Webhook Arriving After App Killed $\rightarrow$ Server-authoritative balance update succeeds in DB.
  3. Delayed Webhook (>1 hour) $\rightarrow$ Order processed or refunded per policy without double credits.

---

### Gate 4: Promotional Offer Lifecycle & Server Atomicity
* **Offer Tests:**
  1. Offer Selection $\rightarrow$ Server validates eligibility (`validate_user_offer_eligibility`).
  2. Payment Order Creation $\rightarrow$ Locked catalog price (`cash_price_inr`) and coins.
  3. Webhook Confirmation $\rightarrow$ Atomic redemption (`redeem_promotional_offer`).
  4. Race Condition $\rightarrow$ Double-click purchase or concurrent redemptions yield exactly 1 credit.
  5. Offer Expiry $\rightarrow$ Expired offers reject new checkout but honor locked orders safely.

---

## 🔗 Unified Correlation Trace Standard

Every test execution must record and preserve:

$$\text{test\_id} \rightarrow \text{correlation\_id} \rightarrow \text{call/order\_id} \rightarrow \text{user/host\_id} \rightarrow \text{RTC session} \rightarrow \text{Supabase events} \rightarrow \text{wallet transactions} \rightarrow \text{platform ledger} \rightarrow \text{final state}$$

---

## 📊 Baseline Metric Formulas & Denominators

$$\text{RTC Failure Rate} = \frac{\text{Failed RTC Connection Attempts}}{\text{Total RTC Connection Attempts}} \quad (\text{Threshold: } \le 1.5\%)$$

$$\text{Call Refund Rate} = \frac{\text{Refunded Paid Calls}}{\text{Total Paid Calls}} \quad (\text{Threshold: } \le 2.0\%)$$

$$\text{Contribution Margin} = \text{Platform Share} - \text{RTC Cost} - \text{Payment Fee (2\%)} - \text{Variable Refunds}$$

---

## 🏆 Staging Verdict Standard

```text
==================================================
FRIENDOO STAGING EXECUTION VERDICT
==================================================

Gate 1 (PostgreSQL Concurrency at T=61s):   PASS / FAIL / NOT VERIFIED
Gate 2 (Physical Android RTC / Bluetooth):  PASS / FAIL / NOT VERIFIED
Gate 3 (Payment Webhook Idempotency):       PASS / FAIL / NOT VERIFIED
Gate 4 (Promotional Offer Atomicity):       PASS / FAIL / NOT VERIFIED

P0 count:
P1 count:

5% Production Canary:
AUTHORIZED / NOT AUTHORIZED
==================================================
```
