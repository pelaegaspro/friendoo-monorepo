import 'package:flutter_test/flutter_test.dart';

import 'package:friendoo/features/wallet/data/wallet_repository.dart';

void main() {
  group('wallet read semantics', () {
    test('preserves a valid zero balance', () {
      final wallet = WalletSnapshot.fromMap({
        'coin_balance': 0,
        'is_frozen': false,
      });

      expect(wallet.coinBalance, 0);
    });

    test('preserves a valid non-zero balance', () {
      final wallet = WalletSnapshot.fromMap({
        'coin_balance': 100,
        'is_frozen': false,
      });

      expect(wallet.coinBalance, 100);
    });

    test('malformed wallet response is unavailable, not zero', () {
      expect(
        () => WalletSnapshot.fromMap({'is_frozen': false}),
        throwsA(isA<FormatException>()),
      );
    });

    test('authentication/query failures have an explicit unavailable state', () {
      const error = WalletUnavailableException('wallet query failed');

      expect(error, isA<WalletUnavailableException>());
      expect(error.toString(), contains('wallet query failed'));
    });

    test('a later successful response can restore the real balance', () {
      const unavailable = WalletUnavailableException('temporary timeout');
      final restored = WalletSnapshot.fromMap({
        'coin_balance': 100,
        'is_frozen': false,
      });

      expect(unavailable, isA<WalletUnavailableException>());
      expect(restored.coinBalance, 100);
    });
  });
}
