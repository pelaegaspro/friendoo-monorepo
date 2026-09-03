import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test(
    'Cashfree checkout delegates payment presentation to the official SDK',
    () {
      final checkoutSource = File(
        'lib/features/wallet/presentation/cashfree_checkout_page.dart',
      ).readAsStringSync();

      expect(
        checkoutSource,
        contains(
          'flutter_cashfree_pg_sdk/api/cfpaymentgateway/cfpaymentgatewayservice.dart',
        ),
      );
    },
  );

  test('Cashfree checkout normalizes nullable SDK error messages', () {
    final checkoutSource = File(
      'lib/features/wallet/presentation/cashfree_checkout_page.dart',
    ).readAsStringSync();

    expect(
      checkoutSource,
      contains("errorResponse.getMessage()?.trim() ?? ''"),
    );
  });

  test(
    'Cashfree order creation uses the documented API idempotency header',
    () {
      final orderSource = File('../supabase/functions/payment-create/index.ts')
          .readAsStringSync();

      expect(orderSource, contains("'x-api-version': '2026-01-01'"));
      expect(orderSource, contains("'x-idempotency-key': order.id"));
    },
  );

  test('Cashfree order confirmation uses the current API version', () {
    final confirmationSource = File(
      '../supabase/functions/payment-confirm/index.ts',
    ).readAsStringSync();

    expect(confirmationSource, contains("'x-api-version': '2026-01-01'"));
  });

  test('Cashfree webhook accepts the current payload type field', () {
    final webhookSource = File(
      '../supabase/functions/cashfree-webhook/index.ts',
    ).readAsStringSync();

    expect(webhookSource, contains('type?: string'));
    expect(webhookSource, contains('payload.type ?? payload.event'));
  });
}
