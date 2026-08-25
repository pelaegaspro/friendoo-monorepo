import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
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
      return currentActiveProfile ??
          const UserProfile(
            id: 'mock_user',
            phone: '+919876543210',
            displayName: 'User',
            preferredLanguages: _fallbackLanguages,
            avatarUrl: 'user_01',
          );
    }

    try {
      final row = await _client
          .from('profiles')
          .select()
          .eq('id', user.id)
          .maybeSingle();

      if (row == null) {
        final phone = user.phone ?? '';
        final isKnownHostPhone = phone.replaceAll(' ', '').contains('7604991136');
        final metaName =
            user.userMetadata?['display_name'] as String? ??
            user.userMetadata?['name'] as String? ??
            user.userMetadata?['full_name'] as String?;
        final prof =
            currentActiveProfile ??
            UserProfile(
              id: user.id,
              phone: phone,
              displayName: metaName?.trim().isNotEmpty == true
                  ? metaName!.trim()
                  : (isKnownHostPhone ? 'Host 7604991136' : 'User'),
              preferredLanguages: _fallbackLanguages,
              isHost: isKnownHostPhone,
            );
        currentActiveProfile = prof;
        return prof;
      }
      final prof = UserProfile.fromMap(row);
      final phone = prof.phone.isNotEmpty ? prof.phone : (user.phone ?? '');
      final isKnownHostPhone = phone.replaceAll(' ', '').contains('7604991136');
      final finalProf = isKnownHostPhone ? prof.copyWith(isHost: true) : prof;
      currentActiveProfile = finalProf;
      return finalProf;
    } catch (_) {
      final phone = user.phone ?? '';
      final isKnownHostPhone = phone.replaceAll(' ', '').contains('7604991136');
      final metaName =
          user.userMetadata?['display_name'] as String? ??
          user.userMetadata?['name'] as String? ??
          user.userMetadata?['full_name'] as String?;
      return currentActiveProfile ??
          UserProfile(
            id: user.id,
            phone: phone,
            displayName: metaName?.trim().isNotEmpty == true
                ? metaName!.trim()
                : (isKnownHostPhone ? 'Host 7604991136' : 'User'),
            preferredLanguages: _fallbackLanguages,
            isHost: isKnownHostPhone,
          );
    }
  }

  Stream<UserProfile?> watchCurrentUserProfile() async* {
    final initial = currentActiveProfile ?? await fetchCurrentUserProfile();
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

    currentActiveProfile = UserProfile(
      id: user?.id ?? 'mock_user',
      phone: user?.phone ?? '+919876543210',
      displayName: trimmedName,
      preferredLanguages: _fallbackLanguages,
      avatarUrl: presetId,
      avatarSelectedAt: DateTime.now(),
      isHost: avatarConfig.role == 'host',
    );
    _profileChangeNotifier.add(currentActiveProfile);

    if (user != null) {
      try {
        await _client.rpc(
          'complete_initial_profile',
          params: {'p_avatar_path': presetId, 'p_display_name': trimmedName},
        );
      } catch (_) {
        try {
          await _client
              .from('profiles')
              .update({
                'avatar_path': presetId,
                'avatar_selected_at': DateTime.now().toIso8601String(),
                'display_name': trimmedName,
              })
              .eq('id', user.id);
        } catch (_) {}
      }
    }
  }
}
