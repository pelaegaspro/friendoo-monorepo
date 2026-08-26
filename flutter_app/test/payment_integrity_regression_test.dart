import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

String _source(String relativePath) {
  return File('../$relativePath').readAsStringSync();
}

String _functionBody(String source, String functionName) {
  final start = source.indexOf(functionName);
  expect(start, greaterThanOrEqualTo(0), reason: '$functionName must exist');
  final end = source.indexOf('\n\$\$;', start);
  expect(end, greaterThan(start), reason: '$functionName must have a SQL body');
  return source.substring(start, end);
}

void main() {
  group('critical payment and refund integrity safeguards', () {
    test('silence refunds are permanently marked on the locked call before a second report can credit it', () {
      final migration = _source(
        'supabase/migrations/20260826_000026_payment_and_refund_integrity.sql',
      );
      final refundFunction = _functionBody(
        migration,
        'create or replace function public.report_host_silence_violation',
      );

      expect(
        migration,
        contains('add column if not exists host_silence_reported_at'),
      );
      expect(refundFunction, contains('for update'));
      expect(
        refundFunction,
        contains('v_call.host_silence_reported_at is not null'),
      );
      expect(refundFunction, contains('set host_silence_reported_at = now()'));
      expect(
        refundFunction,
        isNot(contains('on conflict (idempotency_key) do nothing')),
      );
    });

    test('only the first successfully settled order receives the first-purchase bonus', () {
      final migration = _source(
        'supabase/migrations/20260826_000026_payment_and_refund_integrity.sql',
      );
      final creditFunction = _functionBody(
        migration,
        'create or replace function public.credit_friendoo_payment',
      );

      expect(
        creditFunction,
        contains('where user_id = v_order.user_id for update'),
      );
      expect(creditFunction, contains("and status = 'success'"));
      expect(
        creditFunction,
        contains('v_bonus_coins := round(v_order.coins * 0.5)'),
      );
      expect(creditFunction, contains("'first_purchase_bonus_coins'"));
    });

    test('payment credit never turns a duplicate ledger conflict into a second wallet credit', () {
      final migration = _source(
        'supabase/migrations/20260826_000026_payment_and_refund_integrity.sql',
      );
      final creditFunction = _functionBody(
        migration,
        'create or replace function public.credit_friendoo_payment',
      );

      expect(
        creditFunction,
        contains('on conflict (idempotency_key) do nothing'),
      );
      expect(
        creditFunction,
        contains("raise exception 'Duplicate payment ledger entry'"),
      );
      expect(
        creditFunction.indexOf(
          "raise exception 'Duplicate payment ledger entry'",
        ),
        greaterThan(
          creditFunction.indexOf('insert into public.wallet_transactions'),
        ),
      );
      expect(
        creditFunction.indexOf('update public.wallets'),
        greaterThan(
          creditFunction.indexOf(
            "raise exception 'Duplicate payment ledger entry'",
          ),
        ),
      );
    });

    test('checkout completion requires a server-side Cashfree confirmation, not a redirect URL', () {
      final checkout = _source(
        'flutter_app/lib/features/wallet/presentation/cashfree_checkout_page.dart',
      );
      final repository = _source(
        'flutter_app/lib/features/wallet/data/wallet_repository.dart',
      );

      expect(checkout, contains('required this.providerOrderId'));
      expect(checkout, contains('required this.verifyPayment'));
      expect(
        checkout,
        contains('await widget.verifyPayment(widget.providerOrderId)'),
      );
      expect(repository, contains("'payment-confirm'"));
    });

    test('all card and UPI choices use hosted Cashfree checkout at the server amount', () {
      final paymentPage = _source(
        'flutter_app/lib/features/wallet/presentation/select_payment_method_page.dart',
      );

      expect(paymentPage, isNot(contains('PayThroughCardPage')));
      expect(paymentPage, isNot(contains('0.18')));
      expect(paymentPage, contains("paymentMethod: 'card'"));
      expect(paymentPage, contains('providerOrderId: providerOrderId'));
    });

    test('a failed server call-end request retains the active local call for recovery', () {
      final controller = _source(
        'flutter_app/lib/features/calls/application/call_controller.dart',
      );
      final start = controller.indexOf('Future<void> endActiveCall');
      final end = controller.indexOf('\n  void _watch', start);
      expect(start, greaterThanOrEqualTo(0));
      expect(end, greaterThan(start));
      final endCallBody = controller.substring(start, end);

      expect(endCallBody, isNot(contains('} finally {')));
      expect(
        endCallBody.indexOf('.endCall(current.id, reason: reason)'),
        lessThan(endCallBody.indexOf('lastEndedCallSummaryProvider')),
      );
      expect(
        endCallBody.indexOf('.endCall(current.id, reason: reason)'),
        lessThan(endCallBody.indexOf('_stopWatchingAndLeave()')),
      );
    });

    test('admin coin adjustment has no direct wallet overwrite fallback', () {
      final adminData = _source('admin/lib/admin/data.ts');
      final adminRoute = _source('admin/app/api/admin/users/addCoins/route.ts');

      expect(adminData, contains("supabase.rpc('admin_adjust_wallet'"));
      expect(adminData, isNot(contains("from('wallets').upsert")));
      expect(adminData, contains('throw error'));
      expect(adminRoute, contains('idempotencyKey'));
    });

    test('CRM coin adjustment uses the audited atomic wallet RPC', () {
      final crmRoute = _source('crm/app/api/crm/users/addCoins/route.ts');

      expect(crmRoute, contains('admin_adjust_wallet'));
      expect(crmRoute, contains('p_idempotency_key'));
      expect(crmRoute, isNot(contains('.from("wallets")')));
      expect(crmRoute, isNot(contains('.from("wallet_transactions")')));
    });
  });
}
