# Friendoo Avatar System — PRD, Architecture Spec & Implementation Plan

---

## SECTION A — PRODUCT REQUIREMENTS DOCUMENT

### 1. Product Overview

Friendoo is an India-first anonymous audio-call social app. Users spend coins to have voice conversations with verified hosts. Users remain anonymous; only hosts are admin-verified before public visibility.

### 2. Problem Statement

The avatar system has 6 different rendering components across Android, web, and admin. Seeds are inconsistent: some derive from `alias` (mutable), some from `userId` (stable), some from `displayName` (mutable). The same user can render a different avatar on discovery versus call screen versus profile. Changing a user's alias silently changes their avatar on surfaces that seed from alias.

### 3. Goals

- Define one canonical field (`avatarSeed`) as the single source of truth for avatar generation.
- Ensure the same user/host renders the same avatar on every surface across all platforms.
- Avatar must not change when alias changes.
- Avatar must not change on app restart or re-login.
- All platforms must use DiceBear v9 `open-peeps` PNG style.

### 4. Non-Goals

- No real photo uploads for anonymous users.
- No avatar customization UI (future feature).
- No chat features.
- No booking system.
- No changes to payment or billing logic.

### 5. User Roles

| Role | Avatar behavior |
|------|----------------|
| Anonymous User | DiceBear from `avatarSeed` (immutable, set at signup) |
| Host | DiceBear from `avatarSeed` (immutable, set at host creation) |
| Admin | No avatar change; admin panel shows DiceBear from `avatarSeed` for consistency |

### 6. Core Flows

1. **User signup** → `avatarSeed` generated from `uid`, written to `users/{uid}.avatarSeed`.
2. **Host creation** → `avatarSeed` generated from `uid`, written to `users/{uid}` and `hosts/{hostId}`.
3. **Discovery** → Avatar rendered from `avatarSeed`.
4. **Call (incoming/outgoing/active)** → Avatar rendered from peer's `avatarSeed`.
5. **Profile** → Avatar rendered from own `avatarSeed`.
6. **Alias change** → Avatar unchanged (seed is independent of alias).

### 7. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | `avatarSeed` field exists on `users/{uid}` and `hosts/{hostId}`. |
| FR-2 | `avatarSeed` is set once at creation and never changes. |
| FR-3 | All avatar rendering reads `avatarSeed` and passes it to DiceBear v9 `open-peeps` PNG. |
| FR-4 | No surface uses alias, displayName, or photoURL as avatar seed. |
| FR-5 | If `avatarSeed` is missing, derive from `uid` once, persist it, and render. |
| FR-6 | If DiceBear image fails to load, show a neutral placeholder (gray circle). |
| FR-7 | Avatar URL is never stored in Firestore; derived client-side from `avatarSeed`. |

### 8. Non-Functional Requirements

- Avatar image loads within 2 seconds on 3G.
- Cached by Coil (Android) and browser cache (web/admin).
- No Firestore reads for avatar URL derivation.

### 9. Data Model Requirements

See Section C.

### 10. Admin/Moderation Requirements

- Admin panel displays host/user avatars using `avatarSeed`.
- Admin cannot change `avatarSeed` through the UI.
- Admin migration script can backfill `avatarSeed` for existing documents.

### 11. Success Metrics

- 100% of avatar renders use `avatarSeed` as seed.
- Zero avatar mismatches across platforms for the same user.
- Zero avatar changes after alias rename.

### 12. Risks and Open Questions

| Risk | Mitigation |
|------|------------|
| Existing users lack `avatarSeed` | Migration script derives from `uid` and persists |
| DiceBear API downtime | Local placeholder fallback |
| Two `FriendooAvatar` functions in Android | Remove initials-based one, keep DiceBear-based one |

### 13. Out of Scope

- Photo-based avatars for users.
- Avatar style selection UI.
- Chat features.
- Booking/scheduling.

---

## SECTION B — AVATAR ARCHITECTURE SPEC

### 1. Canonical Field Name

**`avatarSeed`** — a non-empty string, immutable after creation.

Stored on:
- `users/{uid}.avatarSeed`
- `hosts/{hostId}.avatarSeed`

### 2. Generation Rule

```
avatarSeed = uid  (the Firebase Auth UID or the document ID)
```

- Created once at account creation (user signup or host creation via admin).
- Never derived from alias, displayName, or any mutable field.
- Never changes unless an explicit admin migration runs.

### 3. Rendering Rule

All platforms, all surfaces:
```
avatarUrl = getDiceBearUrl(avatarSeed)
```

No exceptions. No fallbacks to initials, photoURL, or alias.

### 4. DiceBear URL Contract

**API version:** v9
**Style:** `open-peeps`
**Format:** `PNG`

**Web helper (TypeScript):**
```typescript
export function getDiceBearUrl(seed: string, size: number = 128): string {
  return `https://api.dicebear.com/9.x/open-peeps/png?seed=${encodeURIComponent(seed)}&size=${size}`;
}
```

**Android helper (Kotlin):**
```kotlin
fun getDiceBearUrl(seed: String, size: Int = 128): String {
    return "https://api.dicebear.com/9.x/open-peeps/png?seed=${java.net.URLEncoder.encode(seed, "UTF-8")}&size=$size"
}
```

### 5. Fallback Policy

| Scenario | Behavior |
|----------|----------|
| `avatarSeed` present, image loads | Show DiceBear image |
| `avatarSeed` present, image fails | Show gray circle placeholder |
| `avatarSeed` missing | Derive from `uid`, persist to Firestore, then render |

No initials. No colored circles with letters. No `ui-avatars.com`.

### 6. Caching Policy

- `avatarSeed` is stored in Firestore.
- Full URL is derived client-side, never stored.
- Coil (Android) and browser cache (web) handle image caching.

### 7. Migration Plan

For existing users/hosts without `avatarSeed`:
1. Read `uid` from document.
2. Set `avatarSeed = uid`.
3. Write back to Firestore.
4. This runs once per document; idempotent.

### 8. Acceptance Criteria

- [ ] Same user renders identical avatar on: discovery, profile, incoming call, active call, call history, blocked list, admin panel.
- [ ] Changing alias does not change avatar.
- [ ] App restart does not change avatar.
- [ ] Missing `avatarSeed` does not crash UI.
- [ ] DiceBear failure shows gray placeholder, not initials.

---

## SECTION C — DATA MODEL CHANGES

### users/{uid}

```
{
  uid: string,                    // Firebase Auth UID (document ID)
  avatarSeed: string,             // NEW — immutable, set at creation, equals uid
  alias: string,                  // mutable display alias
  avatarColor: string,            // kept for backward compat, not used for avatars
  coinBalance: number,
  freeMinutes: number,
  totalSpent: number,
  milestones: string[],
  isHost: boolean,
  isOnline: boolean,
  onboardingCompleted: boolean,
  phone: string,
  createdAt: Timestamp
}
```

### hosts/{hostId}

```
{
  uid: string,                    // equals document ID
  avatarSeed: string,             // NEW — immutable, set at creation, equals uid
  alias: string,
  avatarColor: string,            // kept for backward compat
  bio: string,
  ageGroup: string,
  vibeTags: string[],
  category: string,
  gender: string,
  isStarHost: boolean,
  starRank: number | null,
  starLanguage: string | null,
  avgRating: number,
  ratingCount: number,
  ratePerAudioMinute: number,
  ratePerVideoMinute: number,
  languages: string[],
  isOnline: boolean,
  callStatus: "available" | "busy" | "offline",
  totalCalls: number,
  walletBalance: number,
  totalEarned: number,
  upiId: string,
  upiVerified: boolean,
  verified: boolean,
  createdAt: Timestamp
}
```

### calls/{callId}

```
{
  callerId: string,
  receiverId: string,
  fromUserId: string,
  toUserId: string,
  status: string,
  callType: "audio" | "video",
  agoraChannel: string,
  ratePerMinute: number,
  coinsSpent: number,
  anonymous: boolean,
  createdAt: Timestamp,
  ringingAt: Timestamp,
  endedAt: Timestamp | null,
  endReason: string | null
}
```

No avatar fields on call documents. Avatars are resolved from user/host documents client-side.

### reports/{reportId}

```
{
  reporterId: string,
  reportedId: string,
  reportedAlias: string,
  reason: string,
  description: string | null,
  status: "pending" | "under_review" | "resolved" | "rejected",
  createdAt: Timestamp
}
```

### config/moderation-config

```
{
  reportReasons: string[],        // ["Harassment","Spam","Inappropriate content","Fake profile","Other"]
  languages: string[],            // ["Hindi","English","Tamil","Telugu","Bengali","Marathi","Kannada","Malayalam","Urdu","Punjabi"]
  interests: string[],            // ["Cricket","Music","Gaming","Travel","Fitness","Art","Tech","Cooking","Movies","Anime"]
  welcomeBonusCoins: number,     // 50
  minCoinBalanceToStartCall: number, // 20
  maxCallDurationMinutes: number  // 60
}
```

---

## SECTION D — IMPLEMENTATION PLAN

### Step 1: Backend — Cloud Functions avatarSeed on user creation

**Objective:** Ensure every new user document gets `avatarSeed = uid` at creation.

**Files:**
- `functions/src/triggers/welcomeBonus.ts` — add `avatarSeed: uid` to the user document update.
- `functions/src/calls/callBilling.ts` — no change (doesn't touch avatar).

**Risk:** Low. Additive field.

**Rollback:** Remove `avatarSeed` field from new documents.

### Step 2: Backend — Admin host creation sets avatarSeed

**Objective:** Ensure admin-created hosts get `avatarSeed`.

**Files:**
- `admin/lib/actions/hostActions.ts` — add `avatarSeed: uid` to both `users/{uid}` and `hosts/{hostId}` writes.

**Risk:** Low.

**Rollback:** Remove field.

### Step 3: Backend — Migration script for existing users

**Objective:** Backfill `avatarSeed` for existing users and hosts.

**Files:**
- `scripts/migrate-avatar-seed.cjs` — new script.

**Logic:**
```
for each doc in users/:
  if avatarSeed missing:
    set avatarSeed = doc.id

for each doc in hosts/:
  if avatarSeed missing:
    set avatarSeed = doc.id
```

**Risk:** Low. Idempotent. Only writes to missing fields.

**Rollback:** Delete `avatarSeed` field.

### Step 4: Android — Fix AnonymousAvatar to use avatarSeed

**Objective:** Accept `avatarSeed` instead of `alias` as seed.

**Files:**
- `Friendoo/app/.../components/AnonymousAvatar.kt`

**Change:** Parameter `alias` → `avatarSeed`. Use `avatarSeed` as DiceBear seed.

**Risk:** All call sites must pass `avatarSeed` instead of `alias`.

**Rollback:** Revert parameter name.

### Step 5: Android — Remove initials-based FriendooAvatar

**Objective:** Delete the initials-based `FriendooAvatar` in `FriendooComponents.kt`. Keep only the DiceBear-based one in `AvatarHelper.kt`.

**Files:**
- `Friendoo/app/.../components/FriendooComponents.kt` — remove `FriendooAvatar` composable (initials version).

**Risk:** All call sites using initials-based `FriendooAvatar` must switch to `DiceBearAvatar` or the DiceBear-based `FriendooAvatar`.

**Rollback:** Restore removed function.

### Step 6: Android — Update all call sites to pass avatarSeed

**Objective:** Every avatar render passes `avatarSeed` from the user/host document.

**Files:**
- `DiscoverScreen.kt` — pass `host.avatarSeed` instead of `host.alias`.
- `HostCard.kt` — pass `host.avatarSeed`.
- `ProfileScreen.kt` — pass `user.avatarSeed`.
- `OnboardingScreen.kt` — pass `state.avatarSeed` (from uid).
- `CallScreen.kt` — pass peer's `avatarSeed`.
- `LeaderboardScreen.kt` — pass `host.avatarSeed`.
- `AvatarPickerScreen.kt` — pass `avatarSeed`.

**Risk:** Medium. Many files. Must ensure `avatarSeed` field is present in Host/User data classes.

**Rollback:** Revert each file.

### Step 7: Android — Update Host and User data classes

**Objective:** Add `avatarSeed` field to data models.

**Files:**
- `Friendoo/app/.../data/model/Host.kt` — add `avatarSeed` field, update `fromMap()`.
- `Friendoo/app/.../data/model/User.kt` — add `avatarSeed` field if User model exists.

**Risk:** Low.

**Rollback:** Remove field.

### Step 8: Web — Fix ActiveCallScreen undefined peerId bug

**Objective:** Derive peer ID correctly from call data.

**Files:**
- `components/call/ActiveCallScreen.tsx`

**Change:** Compute `peerId` from `call.fromUserId === userId ? call.toUserId : call.fromUserId`.

**Risk:** Low.

**Rollback:** Revert.

### Step 9: Web — Fix Discover.tsx and Requests.tsx seed

**Objective:** Use `u.uid` instead of `u.id` as DiceBear seed.

**Files:**
- `src/pages/Discover.tsx` — change seed to `u.uid`.
- `src/pages/Requests.tsx` — change seed to `req.fromUser.uid` (pass doc ID through).

**Risk:** Low.

**Rollback:** Revert.

### Step 10: Web — Fix dashboard DiceBear v7 → v9

**Objective:** Update DiceBear API version.

**Files:**
- `app/(main)/dashboard/page.tsx` — change URL from `7.x/avataaars/svg` to `9.x/open-peeps/png`.

**Risk:** Low. Visual change only.

**Rollback:** Revert URL.

### Step 11: Admin — Add DiceBear to user/host tables

**Objective:** Admin panel shows DiceBear avatars from `avatarSeed`.

**Files:**
- `admin/components/users/UsersTable.tsx`
- `admin/components/users/UserProfileModal.tsx`
- `admin/components/hosts/HostsTable.tsx`
- `admin/components/hosts/HostProfileModal.tsx`

**Change:** Replace photoURL/initials pattern with DiceBear from `avatarSeed`.

**Risk:** Low.

**Rollback:** Revert.

### Step 12: Config — Move hardcoded data to Firestore

**Objective:** Languages, interests, report reasons sourced from `config/moderation-config`.

**Files:**
- `components/onboarding/OnboardingStep.tsx`
- `src/pages/Settings.tsx`
- `src/pages/Onboarding.tsx`
- `app/(main)/profile/edit/page.tsx`
- `app/(main)/apply-host/page.tsx`
- `components/safety/ReportSheet.tsx`
- `src/components/ReportModal.tsx`

**Change:** Fetch from `config/moderation-config` instead of hardcoded arrays.

**Risk:** Medium. Requires Firestore read on first load.

**Rollback:** Restore hardcoded arrays.

### Step 13: Agora SDK review

**Objective:** Verify Agora SDK 4.2.2 compatibility with target API 34.

**Action:** Check Agora release notes. Update to 4.5.x only if 4.2.2 has known issues on API 34.

**Files:**
- `Friendoo/gradle/libs.versions.toml`

**Risk:** Medium. SDK update may require API changes.

**Rollback:** Pin to 4.2.2.

### Step 14: Testing

**Objective:** Verify all acceptance criteria.

See Section F.

---

## SECTION E — CODE GENERATION RULES

1. Preserve existing architecture.
2. Do not refactor unrelated modules.
3. Do not reintroduce chat features.
4. Do not change payment/business logic.
5. Do not use mutable alias as avatar seed.
6. Do not store derived URLs in Firestore.
7. Keep changes small, scoped, and reversible.

---

## SECTION F — ACCEPTANCE TEST CHECKLIST

| # | Test Case | Expected Result |
|---|-----------|-----------------|
| 1 | New anonymous user signup | `users/{uid}` has `avatarSeed = uid`. Avatar renders on all screens. |
| 2 | Existing user migration without `avatarSeed` | Migration script sets `avatarSeed = uid`. Avatar renders correctly after. |
| 3 | Host discovery card | Avatar matches host's `avatarSeed`. Same avatar on call screen. |
| 4 | Profile screen | Own avatar from own `avatarSeed`. |
| 5 | Incoming call | Caller's avatar from caller's `avatarSeed`. |
| 6 | Active call | Peer's avatar from peer's `avatarSeed`. Same as incoming/outgoing. |
| 7 | Call history | Each call shows correct peer avatar. |
| 8 | Blocked users list | Each blocked user shows correct avatar. |
| 9 | Admin/CRM user view | Avatar matches user's `avatarSeed`. |
| 10 | Alias change | Avatar unchanged. |
| 11 | Offline/failed avatar load | Gray circle placeholder shown. No crash. |
| 12 | Agora regression smoke test | Audio/video calls connect. No avatar-related crashes. |
| 13 | Hardcoded config replacement | Languages, interests, report reasons load from Firestore. |
