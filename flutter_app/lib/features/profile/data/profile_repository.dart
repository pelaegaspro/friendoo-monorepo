import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/friendoo_models.dart';
import '../../../core/supabase/supabase_provider.dart';

final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => ProfileRepository(ref.watch(supabaseProvider)),
);

class ProfileRepository {
  const ProfileRepository(this._client);

  final SupabaseClient _client;

  static const _fallbackLanguages = ['Tamil', 'Hindi', 'English'];

  Future<UserProfile?> fetchCurrentUserProfile() async {
    final user = _client.auth.currentUser;
    if (user == null) return null;

    try {
      final row = await _client
          .from('profiles')
          .select()
          .eq('id', user.id)
          .maybeSingle();

      if (row == null) {
        return UserProfile(
          id: user.id,
          phone: user.phone ?? '',
          displayName:
              user.userMetadata?['display_name'] as String? ?? 'Friendoo User',
          preferredLanguages: _fallbackLanguages,
        );
      }
      return UserProfile.fromMap(row);
    } catch (_) {
      return UserProfile(
        id: user.id,
        phone: user.phone ?? '',
        displayName: 'Friendoo User',
        preferredLanguages: _fallbackLanguages,
      );
    }
  }

  Stream<UserProfile?> watchCurrentUserProfile() {
    final user = _client.auth.currentUser;
    if (user == null) return Stream.value(null);

    return _client
        .from('profiles')
        .stream(primaryKey: ['id'])
        .eq('id', user.id)
        .map((rows) {
          if (rows.isEmpty) {
            return UserProfile(
              id: user.id,
              phone: user.phone ?? '',
              displayName: 'Friendoo User',
              preferredLanguages: _fallbackLanguages,
            );
          }
          return UserProfile.fromMap(rows.first);
        });
  }

  Future<void> updateDisplayName(String name) async {
    final user = _client.auth.currentUser;
    if (user == null) return;
    await _client
        .from('profiles')
        .update({'display_name': name})
        .eq('id', user.id);
  }

  Future<void> updatePreferredLanguages(List<String> languages) async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    final normalized = languages
        .map((language) => language.trim())
        .where((language) => language.isNotEmpty)
        .toSet()
        .toList();
    if (normalized.isEmpty) return;

    await _client
        .from('profiles')
        .update({'preferred_languages': normalized})
        .eq('id', user.id);
  }
}
