# FRIENDOO — STAGING EXECUTION MANDATE

The Friendoo architecture, database schema, and Flutter application codebase are now **STRICTLY FROZEN**.

---

## 🎯 Current Operational Status

```text
CODE / ARCHITECTURE             🟢 FROZEN
AUTOMATED TESTS                 🟢 PASS (9/9 suites)
STATIC ANALYSIS                 🟢 PASS (0 issues)
A-Z IMPLEMENTATION AUDIT        🟢 COMPLETE
SUPABASE STAGING                🟡 NOT VERIFIED
ANDROID HARDWARE                🟡 NOT VERIFIED
BLUETOOTH / RTC                 🟡 NOT VERIFIED
PAYMENT WEBHOOK                 🟡 NOT VERIFIED
FINANCIAL RECONCILIATION        🟡 STAGING PENDING
5% CANARY                       🔴 NOT AUTHORIZED
```

---

## 🚫 Hard Change Control Invariants

**DO NOT:**
* Create new migrations.
* Redesign billing or settlement.
* Change wallet logic.
* Change revenue split (60/40).
* Change the 15-coin minimum.
* Change the 5-second grace period.
* Change the $3 \times 15$-second user inactivity policy.
* Change the host silence / 3-strike suspension policy.
* Add new product features.
* Refactor RTC.
* Change CRM architecture.

---

## ⚖️ Critical Policy Independence Enforced

```text
1. USER INACTIVITY (In-Call Behavior):
   • 3 qualifying 15-second intervals in ONE call
   • Triggers: `USER_TIME_WASTING_POLICY_TRIGGERED`
   • Outcome: Host ends call, 0 user refund, 0 host earnings, compensating reversal to platform
   • New call starts with: `user_inactivity_count = 0`

2. HOST SILENCE (Lifetime Host Quality):
   • 3 qualifying host violations across the host's lifetime on `hosts.silence_warning_count`
   • Triggers: `report_host_silence_violation`
   • Outcome: Host suspended (`is_suspended = true`), affected caller receives 100% direct refund
   • Zero funds diverted to admin vault
```

**Never merge their counters, events, or financial outcomes.**

---

## 🚦 Required Staging Execution Sequence

```text
1. Deploy existing migration (20260824_000019) to Supabase Staging.
2. Execute Gate 1: Real PostgreSQL T=61s concurrency race.
3. Execute Gate 2: Physical Android Bluetooth / RTC matrix.
4. Execute Gate 3: Payment webhook idempotency and process-death tests.
5. Collect unified forensic correlation-ID traces.
6. Verify P0 violations = 0.
7. Compare P1 metrics against the established staging baseline.
8. Produce the standardized PASS/FAIL Staging Report.
```

---

## 🔗 Unified Correlation-ID Tracing Standard

Every staging test must capture:
```text
test_id
  ↓
call_id
  ↓
user_id / host_id
  ↓
RTC session ID
  ↓
Supabase events
  ↓
wallet transactions
  ↓
platform ledger
  ↓
final state
```

---

## 📋 Standard Staging Execution Report Format

Upon executing staging tests, the report must be formatted as follows:

```text
==================================================
FRIENDOO STAGING EXECUTION VERDICT
==================================================

STAGING VERDICT:
PASS / FAIL / NOT VERIFIED / BLOCKED

Gate 1 (PostgreSQL Staging Concurrency at T=61s):
PASS / FAIL / NOT VERIFIED

Gate 2 (Physical Android RTC / Bluetooth Matrix):
PASS / FAIL / NOT VERIFIED

Gate 3 (Payment Webhook Idempotency & Process Death):
PASS / FAIL / NOT VERIFIED

P0 count:
P1 count:
P2 count:

Financial reconciliation:
PASS / FAIL / NOT VERIFIED

RTC telemetry verification:
PASS / FAIL / NOT VERIFIED

Payment idempotency:
PASS / FAIL / NOT VERIFIED

5% Production Canary:
AUTHORIZED / NOT AUTHORIZED
==================================================
```

> [!CAUTION]
> **Canary Rule:** Never authorize the 5% canary unless Gate 1 PASS, Gate 2 PASS, Gate 3 PASS, Financial Reconciliation PASS, $\text{P0} = 0$, and no unexplained P1 anomalies exist.
