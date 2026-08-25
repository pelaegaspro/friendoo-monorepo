import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/core/models/friendoo_models.dart';

void main() {
  test('reads the deployed avatar_path and one-time selection marker for users', () {
    final profile = UserProfile.fromMap({
      'id': 'user-1',
      'phone': '9999999999',
      'display_name': 'Arjun',
      'preferred_languages': ['Tamil'],
      'avatar_path': 'user_03',
      'avatar_selected_at': '2026-08-23T10:00:00.000Z',
      'role': 'user',
    });

    expect(profile.avatarUrl, 'user_03');
    expect(profile.isAvatarSelectionLocked, isTrue);
    expect(profile.isHost, isFalse);
  });

  test('reads the deployed avatar_path for hosts', () {
    final host = HostProfile.fromMap({
      'id': 'host-1',
      'display_name': 'Aanya',
      'bio': 'Friendly host',
      'rate_per_audio_minute': 5,
      'is_available': true,
      'is_star': false,
      'gender': 'female',
      'languages': ['Tamil'],
      'avatar_path': 'host_04',
    });

    expect(host.avatarUrl, 'host_04');
  });
}
