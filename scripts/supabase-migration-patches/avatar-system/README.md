# Friendoo Avatar System Patch

This package adds a privacy-first avatar workflow to Friendoo. Users receive a deterministic generated illustrated identity by default. A host can upload a display-avatar candidate, but it remains private until an operational admin approves it. The Supabase migration records review decisions with before/after audit state and emits an Odoo-ready operational event.

## Contents

| Path | Purpose |
|---|---|
| `20260816_000009_avatar_system.sql` | Live Supabase schema, Storage bucket/policies, private submission RPC, and auditable administrative review RPC. |
| `flutter/lib/widgets/friendoo_avatar.dart` | Deterministic generated avatar, approved-image display, call-only audio-orb mode, and online/busy indicator. |
| `flutter/lib/services/avatar_review_service.dart` | Authenticated Flutter upload and review-submission service; it never embeds a service-role key. |
| `assets/*.png` | Contemporary Desi-inspired reference starter avatars for visual QA, onboarding previews, and design documentation. These are not required by the deterministic Flutter renderer. |
| `FRIENDOO_DESI_AVATAR_ART_DIRECTION.md` | Inclusive art direction for extending the Desi-inspired illustrated pack without stereotypes or real-person likenesses. |

## Local installation

Copy the migration to the local workspace:

```powershell
Copy-Item .\scripts\supabase-migration-patches\avatar-system\20260816_000009_avatar_system.sql .\supabase\migrations\
```

The migration is already applied to Supabase project `gjbhsogarwqkkftzijhf`. Do **not** apply it a second time to production. Keep the local migration file for source-control history.

Copy the Flutter files into the local app:

```powershell
Copy-Item .\scripts\supabase-migration-patches\avatar-system\flutter\lib\widgets\friendoo_avatar.dart .\flutter_app\lib\widgets\
Copy-Item .\scripts\supabase-migration-patches\avatar-system\flutter\lib\services\avatar_review_service.dart .\flutter_app\lib\services\
```

The Flutter app requires `supabase_flutter`, which is already part of the Friendoo Supabase integration. Do not add `SUPABASE_SERVICE_ROLE_KEY` or `AGORA_APP_CERTIFICATE` to Flutter.

## Profile mapping

Use the following fields returned from the `profiles` table:

```dart
FriendooAvatar(
  avatarSeed: profile['avatar_seed'] as String,
  avatarKind: profile['avatar_kind'] as String,
  avatarStatus: profile['avatar_status'] as String,
  approvedAvatarUrl: signedAvatarUrl, // only for server-authorized approved images
  showPresence: true,
  isOnline: isOnline,
)
```

For an anonymity-preserving call experience, switch the same component to its abstract audio mode:

```dart
FriendooAvatar(
  avatarSeed: profile['avatar_seed'] as String,
  audioOrb: true,
  size: 152,
)
```

## Host image submission

`AvatarReviewService` uploads an original file to the private path `profile/{profile_id}/source/{timestamp}.{ext}` and calls `submit_avatar_for_review`. Flutter may read its own source file but never receives a public URL for another profile’s source image.

An admin panel or a trusted server process must create a reviewed display variant at `profile/{profile_id}/display/{asset}.webp` and invoke:

```text
admin_review_avatar_submission(
  actor admin profile id,
  submission id,
  approved | rejected | disabled,
  display path only when approved,
  review note,
  idempotent request id
)
```

The RPC writes `admin_audit_logs` before/after state and `operational_events` for downstream Odoo synchronization.

## Important privacy behavior

The app displays an uploaded image only when `avatar_kind = uploaded` and `avatar_status = approved`. In every other state, including pending and rejected submissions, it renders the deterministic generated avatar from `avatar_seed`. This protects hosts and users from unreviewed image exposure.

## Desi-inspired visual pack

The default visual starter pack is contemporary Desi-inspired, using gulabi, marigold, indigo, peacock teal, and electric purple. Flutter’s deterministic `FriendooAvatar` palette aligns to those colors, while the supplied illustrated files are useful for onboarding previews and design QA. See `FRIENDOO_DESI_AVATAR_ART_DIRECTION.md` before producing additional assets.
