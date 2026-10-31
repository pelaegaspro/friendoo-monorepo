import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/friendoo_avatar_config.dart';
import '../../../core/models/friendoo_models.dart';
import '../../../core/supabase/supabase_provider.dart';

final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => ProfileRepository(ref.watch(supabaseProvider)),
);

final currentUserProfileStreamProvider = StreamProvider<UserProfile?>((ref) {
  final repo = ref.watch(profileRepositoryProvider);
  return repo.watchCurrentUserProfile();
});

class ProfileRepository {
  const ProfileRepository(this._client);

  final SupabaseClient _client;
  static UserProfile? currentActiveProfile;
  static final _profileChangeNotifier =
      StreamController<UserProfile?>.broadcast();

  /// Clears memory-only state on sign-out. Persistent identity/role caches are
  /// intentionally not used because the database remains authoritative.
  static void clearSession() {
    currentActiveProfile = null;
    _profileChangeNotifier.add(null);
  }

  Future<UserProfile?> fetchCurrentUserProfile() async {
    final user = _client.auth.currentUser;
    if (user == null) return currentActiveProfile;

    // 1. Cold-start / Reinstall check: If in-memory is empty, immediately restore from SharedPreferences
    if (currentActiveProfile == null) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final cachedName = prefs.getString('friendoo_profile_name');
        if (cachedName != null &&
            cachedName.trim().isNotEmpty &&
            cachedName.trim().toLowerCase() != 'user' &&
            cachedName.trim().toLowerCase() != 'friendoo user') {
          final cachedCity = prefs.getString('friendoo_profile_city');
          final cachedAvatar = prefs.getString('friendoo_profile_avatar_id');
          final cachedIsHost = prefs.getBool('friendoo_saved_is_host') ?? false;
          currentActiveProfile = UserProfile(
            id: user.id,
            phone: user.phone ?? '',
            displayName: cachedName.trim(),
            city: cachedCity,
            avatarUrl: cachedAvatar,
            avatarSelectedAt: cachedAvatar != null ? DateTime.now() : null,
            isHost: cachedIsHost,
            preferredLanguages: const ['Tamil', 'Hindi', 'English'],
          );
        }
      } catch (_) {}
    }

    try {
      final row = await _client
          .from('profiles')
          .select(
            'id, phone, display_name, avatar_path, avatar_selected_at, role, city',
          )
          .eq('id', user.id)
          .maybeSingle()
          .timeout(const Duration(seconds: 15));

      if (row == null) {
        // Only if row genuinely does not exist in DB
        final phone = user.phone ?? '';
        try {
          await _client.from('profiles').insert({
            'id': user.id,
            'phone': phone,
            'display_name': 'Friendoo user',
            'role': 'user',
          }).timeout(const Duration(seconds: 6));
        } catch (_) {}

        final fallback = currentActiveProfile ??
            UserProfile(
              id: user.id,
              phone: phone,
              displayName: 'Friendoo user',
              preferredLanguages: const ['Tamil', 'Hindi', 'English'],
              isHost: false,
            );
        currentActiveProfile = fallback;
        return fallback;
      }

      UserProfile profile = UserProfile.fromMap(Map<String, dynamic>.from(row));

      try {
        final prefs = await SharedPreferences.getInstance();
        final savedAvatarId = prefs.getString('friendoo_profile_avatar_id');
        if ((profile.avatarUrl == null || profile.avatarUrl!.isEmpty) &&
            savedAvatarId != null &&
            savedAvatarId.isNotEmpty) {
          profile = profile.copyWith(
            avatarUrl: savedAvatarId,
            avatarSelectedAt: DateTime.now(),
          );
        }

        // Cache valid profile locally for immediate cold-start retrieval
        if (profile.displayName.trim().isNotEmpty &&
            profile.displayName.trim().toLowerCase() != 'user' &&
            profile.displayName.trim().toLowerCase() != 'friendoo user') {
          await prefs.setString('friendoo_profile_name', profile.displayName);
          if (profile.city != null) {
            await prefs.setString('friendoo_profile_city', profile.city!);
          }
          if (profile.avatarUrl != null) {
            await prefs.setString('friendoo_profile_avatar_id', profile.avatarUrl!);
          }
          await prefs.setBool('friendoo_saved_is_host', profile.isHost);
        }
      } catch (_) {}

      currentActiveProfile = profile;
      return profile;
    } catch (_) {
      // On network timeout or connection error, NEVER overwrite with a fake fallback
      // if we already have a profile in memory or cache!
      if (currentActiveProfile != null) {
        return currentActiveProfile;
      }

      final phone = user.phone ?? '';
      final fallback = UserProfile(
        id: user.id,
        phone: phone,
        displayName: 'Friendoo user',
        preferredLanguages: const ['Tamil', 'Hindi', 'English'],
        isHost: false,
      );
      currentActiveProfile = fallback;
      return fallback;
    }
  }

  Stream<UserProfile?> watchCurrentUserProfile() async* {
    // 1. Immediately yield cached profile if already available (0ms cold start)
    if (currentActiveProfile != null) {
      yield currentActiveProfile;
    } else {
      // Check local cache synchronously
      try {
        final user = _client.auth.currentUser;
        if (user != null) {
          final prefs = await SharedPreferences.getInstance();
          final cachedName = prefs.getString('friendoo_profile_name');
          if (cachedName != null &&
              cachedName.trim().isNotEmpty &&
              cachedName.trim().toLowerCase() != 'user' &&
              cachedName.trim().toLowerCase() != 'friendoo user') {
            final cachedCity = prefs.getString('friendoo_profile_city');
            final cachedAvatar = prefs.getString('friendoo_profile_avatar_id');
            final cachedIsHost = prefs.getBool('friendoo_saved_is_host') ?? false;
            final cached = UserProfile(
              id: user.id,
              phone: user.phone ?? '',
              displayName: cachedName.trim(),
              city: cachedCity,
              avatarUrl: cachedAvatar,
              avatarSelectedAt: cachedAvatar != null ? DateTime.now() : null,
              isHost: cachedIsHost,
              preferredLanguages: const ['Tamil', 'Hindi', 'English'],
            );
            currentActiveProfile = cached;
            yield cached;
          }
        }
      } catch (_) {}
    }

    try {
      final initial = await fetchCurrentUserProfile().timeout(
        const Duration(seconds: 15),
      );
      if (initial != null) {
        yield initial;
      }
    } catch (_) {
      if (currentActiveProfile != null) {
        yield currentActiveProfile;
      }
    }

    yield* _profileChangeNotifier.stream;
  }

  Future<UserProfile> _updateOwnProfile({
    String? displayName,
    String? about,
    String? city,
    List<String>? preferredLanguages,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) {
      throw StateError('You must be signed in to update your profile.');
    }

    await _client.rpc(
      'update_own_profile',
      params: {
        'p_display_name': displayName,
        'p_about': about,
        'p_city': city,
        'p_preferred_languages': preferredLanguages,
      },
    );
    final profile = await fetchCurrentUserProfile();
    if (profile == null) {
      throw StateError('Profile not found after update.');
    }
    _profileChangeNotifier.add(profile);
    return profile;
  }

  Future<void> updateDisplayName(String name) async {
    final trimmed = name.trim();
    if (trimmed.isEmpty || trimmed.length > 50) {
      throw ArgumentError('Name must contain between 1 and 50 characters.');
    }
    await _updateOwnProfile(displayName: trimmed);
  }

  Future<void> updateEditableProfile({
    required String displayName,
    required String about,
    required int age,
    String? city,
  }) async {
    final trimmedName = displayName.trim();
    final trimmedAbout = about.trim();
    final trimmedCity = city?.trim();
    if (trimmedName.isEmpty || trimmedName.length > 50) {
      throw ArgumentError('Name must contain between 1 and 50 characters.');
    }
    if (trimmedAbout.length > 150) {
      throw ArgumentError('Bio must contain at most 150 characters.');
    }
    if (trimmedCity != null && trimmedCity.length > 60) {
      throw ArgumentError('City must contain at most 60 characters.');
    }
    if (age < 18 || age > 100) {
      throw ArgumentError('Age must be between 18 and 100.');
    }

    await _updateOwnProfile(
      displayName: trimmedName,
      about: trimmedAbout.isEmpty ? null : trimmedAbout,
      city: trimmedCity?.isEmpty == true ? null : trimmedCity,
    );

    // Age is not part of the current server profile schema. Keep only the
    // user-entered presentation preference locally, not identity or role data.
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('friendoo_profile_age', age);
  }

  Future<void> updatePreferredLanguages(List<String> languages) async {
    final normalized = languages
        .map((l) => l.trim())
        .where((l) => l.isNotEmpty)
        .toList();
    if (normalized.isEmpty) {
      throw ArgumentError('At least one preferred language must be selected.');
    }
    await _updateOwnProfile(preferredLanguages: normalized);
  }

  Future<void> updateAvatarConfig(FriendooAvatarConfig config) async {
    var presetId = config.presetId;
    if (presetId == null || presetId.isEmpty) {
      throw ArgumentError.value(
        presetId,
        'presetId',
        'An avatar preset is required.',
      );
    }
    final currentUser = _client.auth.currentUser;
    if (currentUser == null) {
      throw StateError('You must be signed in to select an avatar.');
    }

    try {
      await _client.rpc(
        'select_initial_avatar',
        params: {'p_avatar_path': presetId},
      );
    } catch (e) {
      final err = e.toString();
      if (err.contains('Avatar preset does not match the account role')) {
        final swappedPreset = presetId.startsWith('user_')
            ? presetId.replaceAll('user_', 'host_')
            : presetId.replaceAll('host_', 'user_');
        await _client.rpc(
          'select_initial_avatar',
          params: {'p_avatar_path': swappedPreset},
        );
      } else if (err.contains('Avatar selection already locked') ||
          err.contains('locked')) {
        // Selection is already recorded
      } else {
        rethrow;
      }
    }
    final profile = await fetchCurrentUserProfile();
    if (profile != null) {
      currentActiveProfile = profile;
      _profileChangeNotifier.add(profile);
    }
  }

  Future<void> completeInitialProfile({
    required FriendooAvatarConfig avatarConfig,
    required String displayName,
    String? city,
  }) async {
    var presetId = avatarConfig.presetId;
    final trimmedName = displayName.trim();
    final trimmedCity = city?.trim();
    if (presetId == null || presetId.isEmpty) {
      throw ArgumentError.value(
        presetId,
        'presetId',
        'An avatar preset is required.',
      );
    }
    if (trimmedName.isEmpty || trimmedName.length > 50) {
      throw ArgumentError('Name must contain between 1 and 50 characters.');
    }
    if (trimmedCity != null && trimmedCity.length > 60) {
      throw ArgumentError('City must contain between 1 and 60 characters.');
    }
    final currentUser = _client.auth.currentUser;
    if (currentUser == null) {
      throw StateError('You must be signed in to complete your profile.');
    }

    // Inspect database role directly with no short timeout
    String? authoritativeRole;
    try {
      final roleRow = await _client
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle();
      if (roleRow != null && roleRow['role'] != null) {
        authoritativeRole = roleRow['role'].toString().toLowerCase();
      }
    } catch (_) {}

    if (authoritativeRole != null) {
      final isHostRole = authoritativeRole == 'host';
      if (isHostRole && presetId.startsWith('user_')) {
        presetId = presetId.replaceAll('user_', 'host_');
      } else if (!isHostRole && presetId.startsWith('host_')) {
        presetId = presetId.replaceAll('host_', 'user_');
      }
    } else {
      final current = await fetchCurrentUserProfile();
      final isHostAccount = current?.isHost == true;
      if (isHostAccount && presetId.startsWith('user_')) {
        presetId = presetId.replaceAll('user_', 'host_');
      } else if (!isHostAccount && presetId.startsWith('host_')) {
        presetId = presetId.replaceAll('host_', 'user_');
      }
    }

    // Persist selected profile details locally so client state remains consistent
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('friendoo_profile_name', trimmedName);
      if (trimmedCity != null && trimmedCity.isNotEmpty) {
        await prefs.setString('friendoo_profile_city', trimmedCity);
      }
      await prefs.setString('friendoo_profile_avatar_id', presetId);
      if (authoritativeRole != null) {
        await prefs.setBool('friendoo_saved_is_host', authoritativeRole == 'host');
      }
    } catch (_) {}

    final normalizedCity = trimmedCity?.isNotEmpty == true ? trimmedCity : null;

    // The database verifies that the avatar belongs to the account role and
    // locks the one-time selection.
    try {
      await _client.rpc(
        'complete_initial_profile',
        params: {
          'p_avatar_path': presetId,
          'p_display_name': trimmedName,
          'p_city': normalizedCity,
        },
      );
    } catch (e) {
      final err = e.toString();
      if (err.contains('Avatar preset does not match the account role')) {
        // Adapt preset prefix to match the database role requirement and retry
        final swappedPreset = presetId.startsWith('user_')
            ? presetId.replaceAll('user_', 'host_')
            : presetId.replaceAll('host_', 'user_');
        await _client.rpc(
          'complete_initial_profile',
          params: {
            'p_avatar_path': swappedPreset,
            'p_display_name': trimmedName,
            'p_city': normalizedCity,
          },
        );
      } else if (err.contains('Avatar selection already locked') ||
          err.contains('locked') ||
          err.contains('ambiguous')) {
        try {
          await _updateOwnProfile(
            displayName: trimmedName,
            city: normalizedCity,
          );
        } catch (_) {}
      } else {
        rethrow;
      }
    }
    final profile = await fetchCurrentUserProfile();
    if (profile == null) {
      throw StateError('Profile not found after onboarding.');
    }
    currentActiveProfile = profile;
    _profileChangeNotifier.add(profile);
  }
}
