import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('deployed migration source defines the pending Cashfree reservation RPC', () {
    final migration = File(
      '../supabase/migrations/20260828_000027_cashfree_pending_payment_rpc.sql',
    ).readAsStringSync();

    expect(
      migration,
      contains(
        'create or replace function public.create_friendoo_pending_payment',
      ),
    );
    expect(
      migration,
      contains(
        "grant execute on function public.create_friendoo_pending_payment",
      ),
    );
  });

  test('wallet realtime stream uses the wallets table primary key', () {
    final source = File('lib/features/wallet/data/wallet_repository.dart')
        .readAsStringSync();

    expect(source, contains("stream(primaryKey: ['user_id'])"));
    expect(source, isNot(contains("stream(primaryKey: ['id'])")));
  });

  test('wallet header distinguishes loading from unavailable balance', () {
    final source = File('lib/app/friendoo_ui.dart').readAsStringSync();

    expect(source, contains('walletAsync.isLoading'));
    expect(source, contains('Loading balance'));
  });

  test('wallet UI constrains fixed content for narrow screens', () {
    final source = File('lib/app/friendoo_ui.dart').readAsStringSync();

    expect(source, contains('Flexible('));
    expect(source, contains('maxLines: 1'));
    expect(source, contains('TextOverflow.ellipsis'));
  });

  test('fallback packages use IDs that exist in the active catalog', () {
    final source = File('lib/features/wallet/data/wallet_repository.dart')
        .readAsStringSync();

    expect(source, contains("id: 'base_15'"));
    expect(source, contains("id: 'offer_500'"));
    expect(source, isNot(contains("id: 'pkg_starter_49'")));
  });
}
