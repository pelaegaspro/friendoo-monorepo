# QA Audit Report: Friendoo Billing State Machine & Agora RTC Lifecycle

**Execution Date:** August 20, 2026  
**Target:** 48-Hour Paid Beta Validation (5 Hosts, 20 Paid ₹50 Calls)  
**QA Mode:** Strict Audit & Ledger Verification (No Architectural Compromise)  
**Overall Verdict:** ⚠️ **BLOCKED FOR PAID TESTING UNTIL 4 CRITICAL DISCREPANCIES ARE PATCHED**

---

## 1. Executive Summary & 8-Scenario Scorecard

| Scenario ID | Test Scenario | Expected Outcome | Actual Codebase Behavior | Status | Severity |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **SC-01** | Happy Path (3 Min Call) | 15 coins caller debit, 10.5 host credit | Caller debited 10 coins (min 3 skipped); Host credited **0 coins** | ❌ **FAIL** | **P0 Critical** |
| **SC-02** | 5s Grace Period Hangup | 0 coins debited, marked `grace_period` | Client shows 0, but DB has no grace logic (races with cron) | ❌ **FAIL** | **P1 High** |
| **SC-03** | Mid-Minute Hangup (75s) | 10 coins caller debit (2 ceil mins) | Client computes 10, DB only charges 5 coins (50% leakage) | ❌ **FAIL** | **P0 Critical** |
| **SC-04** | Sudden App Kill / Crash | Reconcile up to last heartbeat | **Zombie drain:** Cron drains caller wallet to 0 indefinitely | ❌ **FAIL** | **P0 Critical** |
| **SC-05** | Network Drop & Reconnect | Audio auto-resumes, call stays active | Agora reconnects, but presence state has no DB timestamp ping | ⚠️ **PARTIAL** | **P2 Medium** |
| **SC-06** | Balance Exhaustion | Disconnect at zero bal with `insufficient_coins` | Successfully terminates call and sets terminal event | ✅ **PASS** | **Verified** |
| **SC-07** | Duplicate RPC Idempotency | `idempotency_key` deduplicates | Epoch minute bucket vulnerable to clock flip / NTP jitter | ⚠️ **PARTIAL** | **P1 High** |
| **SC-08** | Host Decline / Timeout | 0 coins debited, caller presence reset | 0 coins debited; no server ringing timeout (call hangs ringing) | ⚠️ **PARTIAL** | **P2 Medium** |

---

## 2. Detailed Scenario-by-Scenario Audit & Failure Analysis

### SC-01: Happy Path (3-Minute Call, 180s Duration)
- **Files Inspected:**
  - [`20260815_000002_friendoo_call_operations.sql:106-145`](file:///D:/AllBackup/friendoo/supabase/migrations/20260815_000002_friendoo_call_operations.sql#L106-L145) (`end_friendoo_call`)
  - [`20260815_000002_friendoo_call_operations.sql:147-203`](file:///D:/AllBackup/friendoo/supabase/migrations/20260815_000002_friendoo_call_operations.sql#L147-L203) (`bill_active_friendoo_calls`)
- **Observed Behavior:**
  - Caller starts call at $T=0$. Cron debits 5 coins at $T=60s$ (min 1) and 5 coins at $T=120s$ (min 2).
  - Caller hangs up at $T=180s$. `end_friendoo_call` only updates `status = 'ended', ended_at = now()`.
  - **Discrepancy 1.1 (Under-Billing):** Minute 3 ($120s \rightarrow 180s$) is **never billed**. Caller only paid 10 coins instead of 15.
  - **Discrepancy 1.2 (Host Unpaid):** `bill_active_friendoo_calls` has zero host credit logic. The host wallet is never credited.
- **Root Cause:** `end_friendoo_call` lacks a final minute delta reconciliation step, and the SQL function lacks a host revenue credit transaction.

---

### SC-02: 5-Second Grace Period Cancellation
- **Files Inspected:**
  - [`flutter_app/lib/features/calls/application/call_controller.dart:120-125`](file:///D:/AllBackup/friendoo/flutter_app/lib/features/calls/application/call_controller.dart#L120-L125)
  - [`20260815_000002_friendoo_call_operations.sql:106-145`](file:///D:/AllBackup/friendoo/supabase/migrations/20260815_000002_friendoo_call_operations.sql#L106-L145)
- **Observed Behavior:**
  - Caller hangs up at 4 seconds. Client UI displays `wasGracePeriod = true`, `coinsDeducted = 0`.
  - However, the server function `end_friendoo_call` has **no duration check or grace period enforcement**.
  - If a client is delayed or cron runs, the database state machine does not explicitly stamp `end_reason = 'grace_period'`.
- **Root Cause:** Grace period rule exists only in client-side Flutter Dart code and is completely absent from PostgreSQL RPCs.

---

### SC-03: Mid-Minute Hangup (e.g. 75 Seconds Duration)
- **Files Inspected:**
  - [`flutter_app/lib/features/calls/application/call_controller.dart:123`](file:///D:/AllBackup/friendoo/flutter_app/lib/features/calls/application/call_controller.dart#L123)
  - [`20260815_000002_friendoo_call_operations.sql:147-203`](file:///D:/AllBackup/friendoo/supabase/migrations/20260815_000002_friendoo_call_operations.sql#L147-L203)
- **Observed Behavior:**
  - At $T=60s$, cron bills minute 1 (5 coins).
  - At $T=75s$, caller hangs up. Flutter client calculates `ceil(75 / 60) = 2 minutes` (10 coins) and displays a 10-coin deduction summary.
  - Server `end_friendoo_call` executes and leaves `total_coins_deducted = 5`.
  - **Accounting Mismatch:** The client summary claims 10 coins was charged, but the database wallet only debited 5 coins.

---

### SC-04: Sudden App Kill / Crash (Zombie Call Drain)
- **Files Inspected:**
  - [`20260815_000002_friendoo_call_operations.sql:147-203`](file:///D:/AllBackup/friendoo/supabase/migrations/20260815_000002_friendoo_call_operations.sql#L147-L203)
- **Observed Behavior:**
  - Caller terminates the app process at $T=2m 10s$. No `endCall` RPC is sent.
  - The call status remains `'active'` in PostgreSQL.
  - Cron `bill_active_friendoo_calls` runs every 60 seconds and **continues debiting 5 coins every minute indefinitely** until the caller's wallet reaches zero.
  - **Financial Risk:** If a user with 500 coins crashes, they lose all 500 coins over the next 100 minutes.
- **Root Cause:** No heartbeat timeout mechanism or reaper function exists in the database.

---

### SC-07: Duplicate / Out-of-Order RPC Idempotency
- **Files Inspected:**
  - [`20260815_000002_friendoo_call_operations.sql:188`](file:///D:/AllBackup/friendoo/supabase/migrations/20260815_000002_friendoo_call_operations.sql#L188)
- **Observed Behavior:**
  - `idempotency_key` is generated as:
    ```sql
    v_call.id::text || ':' || floor(extract(epoch from now()) / 60)::text
    ```
  - If a billing cron runs near a minute boundary (e.g. 12:00:59.990 and 12:01:00.010), the epoch minute changes.
  - Retries or network lag can cause two different idempotency keys to be generated for the same logical minute.
- **Root Cause:** Non-deterministic time-bucket idempotency keys instead of deterministic sequence numbering (`call:<id>:min:<seq>`).

---

## 3. Discrepancy & Bug Summary Table

```
======================================================================================================
BUG ID   SEVERITY   MODULE                   DESCRIPTION OF DEFECT
======================================================================================================
BUG-01   P0         supabase/call_operations end_friendoo_call skips final unbilled minute (revenue leak)
BUG-02   P0         supabase/call_operations bill_active_friendoo_calls does not credit host wallet (0 host earnings)
BUG-03   P0         supabase/call_operations No heartbeat reaper -> killed app drains caller wallet to 0
BUG-04   P1         supabase/call_operations 5-second grace period is client-only (missing on server)
BUG-05   P1         supabase/call_operations Epoch minute idempotency key vulnerable to minute-flip double debit
BUG-06   P2         supabase/call_operations Ringing calls have no server timeout (hangs if host ignores)
======================================================================================================
```

---

## 4. Remediation Plan (Required Before Paid Beta)

To guarantee 100% server-authoritative reliability during the 20 paid test calls, the following SQL migration (`20260820_000009_authoritative_billing_reaper.sql`) must be applied:

1. **Deterministic Idempotent Sequence & Configurable Host Split:**
   - Add `billed_minute_count integer default 0` to `calls`.
   - Add `host_coins_earned numeric(10,2) default 0` to `calls`.
   - In `bill_active_friendoo_calls`: debit caller `rate`, credit host `rate * 0.70` (3.50 coins), and write `idempotency_key = 'call:' || call_id || ':min:' || seq`.
2. **Server-Authoritative Grace Period & Final Minute Reconciliation:**
   - In `end_friendoo_call`:
     - If `duration <= 5s` $\rightarrow$ 0 coins, `end_reason = 'grace_period'`.
     - If `duration > 5s` $\rightarrow$ compute `v_unbilled = ceil(duration / 60) - billed_minute_count`, debit/credit remaining minutes atomically.
3. **Heartbeat Timestamp & Zombie Reaper (`reap_stale_friendoo_calls`):**
   - Add `last_heartbeat_at timestamptz default now()` to `calls`.
   - Reaper marks calls `ended` with `end_reason = 'heartbeat_timeout'` if `last_heartbeat_at < now() - interval '25 seconds'`, reconciling up to the last heartbeat timestamp.
