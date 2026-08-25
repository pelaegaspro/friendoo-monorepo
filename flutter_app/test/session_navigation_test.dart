import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/app/friendoo_app.dart';
import 'package:friendoo/core/models/friendoo_models.dart';

void main() {
  test(
    'host profiles resolve to host navigation after a session is restored',
    () {
      const host = UserProfile(
        id: 'host-1',
        phone: '9999999999',
        displayName: 'Aanya',
        preferredLanguages: ['Tamil'],
        isHost: true,
      );

      expect(resolveIsHostNavigation(host), isTrue);
      expect(resolveIsHostNavigation(null), isFalse);
    },
  );
}
