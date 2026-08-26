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

  static const _fallbackLanguages = ['Tamil', 'Hindi', 'English'];
  static UserProfile? currentActiveProfile;
  static final _profileChangeNotifier =
      StreamController<UserProfile?>.broadcast();

  /// Clears the static session cache. Must be called on sign-out so the next
  /// user who logs in does not briefly see the previous user's profile data.
  static void clearSession() {
    currentActiveProfile = null;
    _profileChangeNotifier.add(null);
  }

  Future<UserProfile?> fetchCurrentUserProfile() async {
    final user = _client.auth.currentUser;
    if (user == null) {
      return currentActiveProfile;
    }

    try {
      final row = await _client
          .from('profiles')
          .select()
          .eq('id', user.id)
          .maybeSingle();

      final phone = user.phone ?? '';
      final metaName =
          user.userMetadata?['display_name'] as String? ??
          user.userMetadata?['name'] as String? ??
          user.userMetadata?['full_name'] as String?;

      if (row == null) {
        final prof = UserProfile(
          id: user.id,
          phone: phone,
          displayName: metaName?.trim().isNotEmpty == true
              ? metaName!.trim()
              : 'User',
          preferredLanguages: _fallbackLanguages,
          avatarUrl: 'user_01',
          isHost: false,
        );
        currentActiveProfile = prof;
        return prof;
      }

      final prof = UserProfile.fromMap(row);
      final finalPhone = prof.phone.isNotEmpty ? prof.phone : phone;
      final finalProf = prof.copyWith(phone: finalPhone);
      currentActiveProfile = finalProf;
      return finalProf;
    } catch (_) {
      final phone = user.phone ?? '';
      final metaName =
          user.userMetadata?['display_name'] as String? ??
          user.userMetadata?['name'] as String? ??
          user.userMetadata?['full_name'] as String?;

      return UserProfile(
        id: user.id,
        phone: phone,
        displayName: metaName?.trim().isNotEmpty == true
            ? metaName!.trim()
            : 'User',
        preferredLanguages: _fallbackLanguages,
        avatarUrl: 'user_01',
        isHost: false,
      );
    }
  }

  Stream<UserProfile?> watchCurrentUserProfile() async* {
    // Always resolve the profile for the current auth session. Reusing the
    // static cache here can render the previous phone's role/profile while
    // Supabase is restoring or switching sessions.
    final initial = await fetchCurrentUserProfile();
    if (initial != null) {
      yield initial;
    }
    yield* _profileChangeNotifier.stream;
  }

  Future<void> updateDisplayName(String name) async {
    final trimmed = name.trim();
    if (currentActiveProfile != null) {
      currentActiveProfile = UserProfile(
        id: currentActiveProfile!.id,
        phone: currentActiveProfile!.phone,
        displayName: trimmed.isNotEmpty
            ? trimmed
            : currentActiveProfile!.displayName,
        preferredLanguages: currentActiveProfile!.preferredLanguages,
        avatarUrl: currentActiveProfile!.avatarUrl,
        avatarSelectedAt: currentActiveProfile!.avatarSelectedAt,
        isHost: currentActiveProfile!.isHost,
      );
      _profileChangeNotifier.add(currentActiveProfile);
    }

    final user = _client.auth.currentUser;
    if (user == null) return;
    try {
      await _client
          .from('profiles')
          .update({'display_name': trimmed})
          .eq('id', user.id);
    } catch (_) {}
  }

  Future<void> updateEditableProfile({
    required String displayName,
    required String about,
    required int age,
  }) async {
    final trimmedName = displayName.trim();
    final trimmedAbout = about.trim();
    if (trimmedName.isEmpty || trimmedName.length > 50) {
      throw ArgumentError('Name must contain between 1 and 50 characters.');
    }
    if (trimmedAbout.length > 150) {
      throw ArgumentError('Bio must contain at most 150 characters.');
    }
    if (age < 18 || age > 100) {
      throw ArgumentError('Age must be between 18 and 100.');
    }

    await updateDisplayName(trimmedName);
    final user = _client.auth.currentUser;
    if (user != null) {
      await _client
          .from('profiles')
          .update({'display_name': trimmedName, 'about': trimmedAbout})
          .eq('id', user.id);
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('friendoo_profile_about', trimmedAbout);
    await prefs.setInt('friendoo_profile_age', age);
  }

  Future<void> updatePreferredLanguages(List<String> languages) async {
    final normalized = languages
        .map((language) => language.trim())
        .where((language) => language.isNotEmpty)
        .toSet()
        .toList();
    if (normalized.isEmpty) return;

    if (currentActiveProfile != null) {
      currentActiveProfile = UserProfile(
        id: currentActiveProfile!.id,
        phone: currentActiveProfile!.phone,
        displayName: currentActiveProfile!.displayName,
        preferredLanguages: normalized,
        avatarUrl: currentActiveProfile!.avatarUrl,
        avatarSelectedAt: currentActiveProfile!.avatarSelectedAt,
        isHost: currentActiveProfile!.isHost,
      );
      _profileChangeNotifier.add(currentActiveProfile);
    }

    final user = _client.auth.currentUser;
    if (user == null) return;

    try {
      await _client
          .from('profiles')
          .update({'preferred_languages': normalized})
          .eq('id', user.id);
    } catch (_) {}
  }

  Future<void> updateAvatarConfig(FriendooAvatarConfig config) async {
    final presetId = config.presetId;
    if (presetId == null || presetId.isEmpty) {
      throw ArgumentError.value(
        presetId,
        'presetId',
        'An avatar preset is required.',
      );
    }

    if (currentActiveProfile != null) {
      currentActiveProfile = UserProfile(
        id: currentActiveProfile!.id,
        phone: currentActiveProfile!.phone,
        displayName: currentActiveProfile!.displayName,
        preferredLanguages: currentActiveProfile!.preferredLanguages,
        avatarUrl: presetId,
        avatarSelectedAt: DateTime.now(),
        isHost: currentActiveProfile!.isHost,
      );
      _profileChangeNotifier.add(currentActiveProfile);
    }

    final user = _client.auth.currentUser;
    if (user == null) return;

    try {
      await _client.rpc(
        'select_initial_avatar',
        params: {'p_avatar_path': presetId},
      );
    } catch (_) {
      try {
        await _client
            .from('profiles')
            .update({
              'avatar_path': presetId,
              'avatar_selected_at': DateTime.now().toIso8601String(),
            })
            .eq('id', user.id);
      } catch (_) {}
    }
  }

  Future<void> completeInitialProfile({
    required FriendooAvatarConfig avatarConfig,
    required String displayName,
  }) async {
    final presetId = avatarConfig.presetId;
    if (presetId == null || presetId.isEmpty) {
      throw ArgumentError.value(
        presetId,
        'presetId',
        'An avatar preset is required.',
      );
    }

    final user = _client.auth.currentUser;
    final trimmedName = displayName.trim().isNotEmpty
        ? displayName.trim()
        : 'User';
    final effectivePhone = user?.phone ?? currentActiveProfile?.phone;
    if (user == null || effectivePhone == null || effectivePhone.isEmpty) {
      throw StateError(
        'A verified Supabase user is required to save a profile.',
      );
    }
    final isHostRole = avatarConfig.role == 'host';
    final effectiveId = user.id;

    currentActiveProfile = UserProfile(
      id: effectiveId,
      phone: effectivePhone,
      displayName: trimmedName,
      preferredLanguages: _fallbackLanguages,
      avatarUrl: presetId,
      avatarSelectedAt: DateTime.now(),
      isHost: isHostRole,
    );
    _profileChangeNotifier.add(currentActiveProfile);

    // Save locally to SharedPreferences for instant persistent launch
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('friendoo_saved_phone', effectivePhone);
      await prefs.setString('friendoo_saved_display_name', trimmedName);
      await prefs.setString('friendoo_saved_avatar_url', presetId);
      await prefs.setString('friendoo_saved_user_id', effectiveId);
      await prefs.setBool('friendoo_saved_is_host', isHostRole);
      await prefs.setBool('friendoo_saved_has_entered', true);
    } catch (_) {}

    // Save to Supabase profiles database table
    try {
      await _client.from('profiles').upsert({
        'id': effectiveId,
        'phone': effectivePhone,
        'display_name': trimmedName,
        'avatar_path': presetId,
        'avatar_selected_at': DateTime.now().toIso8601String(),
        'is_host': isHostRole,
      });
    } catch (_) {}
  }
}
