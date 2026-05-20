## Friendoo Firestore schema (Wallet + Audio/Video Calls)

This document defines the Firestore collections/documents needed for:
- Coin Wallet (Cashfree topups)
- 1:1 private Audio & Video Calls (Agora RTC) with coin-based billing

### users/{userId}

Add these fields to the existing user document:
- `coinBalance` (number): current available coins. Default `0`.
- `anonymousModeEnabled` (boolean, optional): user preference for anonymous calls.

Notes:
- `coinBalance` is mutated **only** by privileged server code (Cloud Functions) using Firestore transactions.

---

### coinPackages/{packageId}

Stores purchasable coin packages. Seed these in Firestore.

Fields:
- `id` (string): same as `packageId` (redundant, optional)
- `active` (boolean)
- `currency` (`"INR"`)
- `priceInr` (number): e.g. `49`, `99`, `199`, `499`
- `coins` (number): e.g. `100`, `220`, `500`, `1400`
- `displayName` (string): e.g. `"Starter"`, `"Popular"`, etc.
- `sortOrder` (number): ordering in UI
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

Required seed packages:
- 49 INR = 100 coins
- 99 INR = 220 coins
- 199 INR = 500 coins
- 499 INR = 1400 coins

Suggested indexes:
- `active ASC, sortOrder ASC`

---

### coinTransactions/{txId}

Append-only ledger of coin movements (topups, call charges, refunds).

Fields:
- `id` (string): same as `txId` (redundant, optional)
- `userId` (string)
- `type` (`"topup" | "call_debit" | "gift_sent" | "gift_received" | "refund" | "bonus"`)
- `amountCoins` (number): positive for credit, negative for debit
- `balanceBefore` (number): user balance before applying this transaction
- `balanceAfter` (number): user balance after applying this transaction
- `status` (`"pending" | "succeeded" | "failed" | "reversed"`)
- `reason` (string, optional)
- `endReason` (string, optional) // e.g. for call-related entries

Cashfree fields (for topups):
- `cashfreeOrderId` (string, optional)
- `packageId` (string, optional)
- `amountInr` (number, optional)
- `currency` (`"INR"`, optional)

Call fields:
- `callId` (string, optional)
- `callType` (`"audio" | "video"`, optional) // matches the call's type for billing audit
- `ratePerMinute` (number, optional) // coins per minute at charge time
- `minutesBilled` (number, optional)

Timestamps:
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- `processedAt` (timestamp, optional) // e.g. webhook processed time

Suggested indexes:
- `userId ASC, createdAt DESC`
- `userId ASC, type ASC, createdAt DESC`
- `callId ASC, createdAt DESC`

Example: `call_debit` (per-minute billing)

```json
{
  "userId": "callerUid",
  "type": "call_debit",
  "status": "success",
  "callId": "call_123",
  "amountCoins": -5,
  "balanceBefore": 42,
  "balanceAfter": 37,
  "ratePerMinute": 5,
  "minutesBilled": 1,
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>"
}
```

Example: `topup` (Cashfree, credited on webhook)

```json
{
  "userId": "userUid",
  "type": "topup",
  "status": "success",
  "packageId": "pkg_99",
  "cashfreeOrderId": "order_ABC",
  "amountInr": 99,
  "currency": "INR",
  "amountCoins": 220,
  "balanceBefore": 100,
  "balanceAfter": 320,
  "processedAt": "<serverTimestamp>",
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>"
}
```

---

### calls/{callId}

Call signaling + history for a 1:1 audio or video call.

Fields:
- `id` (string): same as `callId` (redundant, optional)
- `fromUserId` (string)
- `toUserId` (string)
- `callType` (`"audio" | "video"`): determines billing rate and UI rendering
- `agoraChannel` (string)
- `agoraToken` (string, optional) // if you mint server-side tokens

Signaling / lifecycle:
- `status` (`"ringing" | "active" | "ended" | "missed" | "rejected"`)
- `createdAt` (timestamp)
- `ringingAt` (timestamp, optional)
- `acceptedAt` (timestamp, optional)
- `endedAt` (timestamp, optional)
- `endReason` (`"hangup" | "missed" | "rejected" | "insufficient_coins" | "error"`, optional)

Billing:
- `ratePerMinute` (number) // e.g. 5
- `coinsSpent` (number) // total deducted for this call
- `lastBilledAt` (timestamp, optional) // for scheduled per-minute deduction

Anonymous mode (per call):
- `anonymous` (boolean)
- `fromDisplayName` (string, optional) // only when not anonymous
- `toDisplayName` (string, optional) // only when not anonymous
- `aiAvatarId` (string, optional) // used by UI when anonymous

Device/notifications:
- `toFcmTokens` (string[], optional) // optional denormalization for push

Suggested indexes:
- `toUserId ASC, createdAt DESC`
- `fromUserId ASC, createdAt DESC`
- `status ASC, createdAt DESC` (optional for admin/debug)

---

### hosts/{hostId} (billing-relevant fields)

The `hosts` collection must include billing rate fields used by Cloud Functions:

- `coinsPerMinute` (number): audio call rate per minute. Default `5`.
- `ratePerVideoMinute` (number): video call rate per minute. Default `10`.
- `ratePerAudioMinute` (number): audio rate shown in client UI. Default `5`.

Note: `coinsPerMinute` is the server-side authority for audio billing (read by `deductCallCoins`).
For video billing, `ratePerVideoMinute` is used. Both are read server-side only — never trust client-supplied rates.

---

## Payment Flow (Cashfree)

### End-to-end flow

1. Client calls `createCashfreeOrder({ packageId })` Cloud Function
2. Function reads `coinPackages/{packageId}`, creates Cashfree order, creates **pending** `coinTransactions` doc
3. Function returns `{ orderId, paymentSessionId, coins }`
4. Client opens Cashfree checkout with `paymentSessionId`
5. User completes payment
6. Cashfree sends webhook to `cashfreeWebhook` HTTP function
7. Webhook verifies signature, finds pending transaction by `cashfreeOrderId`
8. Webhook runs Firestore transaction: credits `coinBalance`, updates transaction to `success`

### Idempotency

- Pending transaction is created BEFORE returning to client (step 2)
- Webhook checks for existing `success` transaction before crediting (step 7)
- If transaction already `success`, webhook returns `already_processed`
- No double-credit possible even if webhook fires multiple times

### Security

- `customer_id` on Cashfree order must match `userId` on the pending transaction
- Webhook signature verified with HMAC-SHA256
- Client never sends coin amount — server reads from `coinPackages`

### Environment variables

- `CASHFREE_APP_ID` — Cashfree client ID
- `CASHFREE_SECRET_KEY` — Cashfree client secret
- `CASHFREE_WEBHOOK_SECRET` — Webhook signature verification secret
- `CASHFREE_ENV` — `sandbox` or `production`

### Dispute handling

- `DISPUTE_OPENED` webhook freezes user wallet (`walletFrozen: true`)
- `DISPUTE_RESOLVED` webhook unfreezes wallet
- All disputes logged to `fraudAlerts` collection

