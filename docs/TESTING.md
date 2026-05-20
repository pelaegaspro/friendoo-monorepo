# Friendoo — Manual Testing Guide

## Prerequisites
- Firebase project: `friendoo-v1`
- Two test devices (or browser tabs) with different phone numbers
- Cashfree sandbox credentials configured
- Cloud Functions deployed: `firebase deploy --only functions`
- Firestore rules deployed: `firebase deploy --only firestore:rules`

---

## 1. Minimum Coins Check Before Call

**Steps:**
1. Sign in as a user with < 15 coins (check Firestore `users/{uid}.coinBalance`)
2. Go to Discover screen
3. Tap "Call" on any online host card

**Expected:**
- ✅ Coin packages bottom sheet opens
- ✅ Toast shows: "You need at least 15 coins to start a call. Top up now!"
- ✅ No call document created in Firestore

**Negative test:**
- Top up to 20+ coins → tap Call → call screen opens normally

---

## 2. Support Reply Notification

**Steps:**
1. From CRM (`/crm`), open a support ticket and send a reply with `sendInApp: true`
2. On the main app, open Notifications tab

**Expected:**
- ✅ Purple-tinted card appears with 🎫 icon
- ✅ Title: "Support Team replied"
- ✅ Body shows the reply message
- ✅ "View Ticket" link visible if ticketId present
- ✅ Timestamp shows relative time

---

## 3. Special Offers Banner in Wallet

**Steps:**
1. From CRM or Firestore console, write to `offers/{uid}`:
   ```json
   { "bonusCoins": 50, "active": true, "expiresAt": <timestamp 24h from now> }
   ```
2. Open Wallet page in main app

**Expected:**
- ✅ Gold/amber banner appears below balance card
- ✅ Shows "Buy any pack and get 50 extra coins FREE!"
- ✅ Shows expiry countdown in hours

**Negative test:**
- Set `active: false` → banner disappears
- Set `expiresAt` to past → banner disappears

---

## 4. Host Card on Discover Screen

**Steps:**
1. Ensure a user has `isHost: true`, `hostStatus: 'approved'`, `isOnline: true` in Firestore
2. Open Discover screen as a different user

**Expected:**
- ✅ Host appears as a vertical card (3:4 aspect ratio)
- ✅ Green pulsing dot in top-right corner
- ✅ Name, city, languages shown
- ✅ ⭐ rating + 🪙 coins/min pill visible
- ✅ Chat and Call buttons at bottom

**Online filter:**
- Tap "🟢 Online" filter → only online hosts shown

---

## 5. Host Presence Toggle

**Steps:**
1. Sign in as a host user (`isHost: true`)
2. Look for floating button at bottom-right (above bottom nav)

**Expected:**
- ✅ Green wifi icon when online, grey wifi-off when offline
- ✅ Tap to toggle → Firestore `users/{uid}.isOnline` updates
- ✅ Toast: "You're now Online!" or "You're now Offline"
- ✅ Closing browser tab → sets `isOnline: false`

---

## 6. Host Earnings Tab

**Steps:**
1. Sign in as a host user
2. Check bottom navigation

**Expected:**
- ✅ "Wallet" tab replaced with "Earnings" tab (TrendingUp icon)
- ✅ Tap Earnings → shows total earned, stats, recent earnings list
- ✅ Non-host users still see "Wallet" tab

---

## 7. Host Self-Application Flow

**Steps:**
1. Sign in as a regular user
2. Go to Profile → Edit Profile → scroll to bottom
3. Tap "Apply Now" under "Earn with Friendoo"

**Expected:**
- ✅ 3-step form with progress bar
- ✅ Step 1: name, age, city, languages
- ✅ Step 2: selfie upload (required), lifestyle photos (optional)
- ✅ Step 3: two checkboxes + submit
- ✅ On submit: `hostApplications` doc created, `users/{uid}.hostStatus = 'pending'`
- ✅ Success screen with green checkmark

**Re-visit:**
- Visit `/apply-host` again → shows "Under Review" screen

---

## 8. Host Earning Credit (Cloud Function)

**Steps:**
1. Start a call between a user and a host
2. Wait 60+ seconds (one billing tick)
3. Check Firestore `coinTransactions` for host's uid

**Expected:**
- ✅ `coinTransactions` doc with `type: 'hostearning'`, `amountCoins: floor(rate * 0.7)`
- ✅ Host's `coinBalance` incremented
- ✅ Caller's `coinBalance` decremented by full rate

---

## 9. Low Balance Push Notification

**Steps:**
1. User has coinBalance = 20
2. Make a call that deducts coins until balance drops below 15
3. Check device for push notification

**Expected:**
- ✅ Push: "🪙 Running low on coins! Top up now to keep calling."
- ✅ Only fires if user made a call in last 24h

---

## 10. Welcome Bonus

**Steps:**
1. Create a new Firebase Auth user (new phone number)
2. Complete onboarding → profile created in Firestore

**Expected:**
- ✅ `coinTransactions` doc with `type: 'bonus'`, `amountCoins: 50`
- ✅ `users/{uid}.coinBalance = 50`

---

## 11. Fraud Detection

**High top-up alert:**
1. Simulate top-up transactions totalling > ₹1000 in one day for a user
2. Check `fraudAlerts` collection

**Expected:**
- ✅ `fraudAlerts` doc with `type: 'high_topup'`, `severity: 'high'`

**Dropped call refund flag:**
1. Start a call, end it within 30 seconds with `endReason: 'insufficientbalance'`
2. Check `fraudAlerts` collection

**Expected:**
- ✅ `fraudAlerts` doc with `type: 'call_refund_needed'`, `severity: 'medium'`

---

## 12. Admin — Add Host

**Steps:**
1. Open admin panel → Hosts → Add Host
2. Fill form with phone, name, rate, languages, photo

**Expected:**
- ✅ Firebase Auth user created
- ✅ `users/{uid}` doc with `isHost: true`, `hostStatus: 'approved'`
- ✅ Host appears on main app Discover screen

---

## 13. Admin — Ban User

**Steps:**
1. Open admin panel → Users → find user → Ban
2. On main app, that user should be signed out

**Expected:**
- ✅ `users/{uid}.isBanned = true` in Firestore
- ✅ Main app detects change via real-time listener → signs out
- ✅ Toast: "Your account has been suspended."

---

## 14. Admin — Approve Host Application

**Steps:**
1. User submits host application via `/apply-host`
2. Admin panel → Host Applications → Approve

**Expected:**
- ✅ `hostApplications/{appId}.status = 'approved'`
- ✅ `users/{uid}.isHost = true`, `hostStatus = 'approved'`
- ✅ FCM push sent to user: "🎉 You're approved as a Friendoo Host!"
- ✅ In-app notification created

---

## 15. CRM — Live Stats Dashboard

**Steps:**
1. Open CRM → Dashboard

**Expected:**
- ✅ Total Users, Total Hosts, Active Calls, Online Hosts all load
- ✅ Today's Revenue calculated from `coinTransactions` type:topup
- ✅ Open Tickets count from `supportTickets`

---

## 16. CRM — Campaign Send

**Steps:**
1. CRM → Campaigns → Create campaign
2. Select segment, write title/body, send

**Expected:**
- ✅ FCM push delivered to segment users (check device)
- ✅ In-app notification created for each user
- ✅ Campaign doc updated: `status: 'sent'`, `deliveredCount`

---

## 17. CRM — Support Reply

**Steps:**
1. CRM → Support → open a ticket → reply with message
2. Enable "Send Push" and "Send In-App"

**Expected:**
- ✅ FCM push: "Friendoo Support" + message preview
- ✅ In-app notification with `type: 'support_reply'`
- ✅ Main app Notifications shows purple 🎫 card

---

## 18. CRM — Refund

**Steps:**
1. CRM → Support → open ticket → Refund 20 coins

**Expected:**
- ✅ `users/{uid}.coinBalance` incremented by 20
- ✅ `coinTransactions` doc with `type: 'refund'`
- ✅ Ticket updated with refund message

---

## Build Verification

```bash
# Main app
cd D:/Friendoo
npm run build

# Admin
cd D:/Friendoo/admin
npm run build

# CRM
cd D:/Friendoo/crm
npm run build

# Cloud Functions
cd D:/Friendoo/functions
npm run lint

# Flutter
cd D:/Friendoo
flutter analyze --no-pub
```

All must pass with 0 errors.
