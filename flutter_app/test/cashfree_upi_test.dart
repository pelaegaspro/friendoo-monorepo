import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_cashfree_pg_sdk/api/cferrorresponse/cferrorresponse.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpaymentgateway/cfpaymentgatewayservice.dart';
import 'package:friendoo/features/wallet/presentation/cashfree_checkout_page.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  void paymentTest(String description, WidgetTesterCallback callback) {
    testWidgets(
      description,
      callback,
      variant: TargetPlatformVariant.only(TargetPlatform.android),
    );
  }

  const channel = MethodChannel('flutter_cashfree_pg_sdk');
  late List<MethodCall> calls;
  setUp(() {
    calls = [];
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
          calls.add(call);
          return null;
        });
  });
  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });
  Widget checkout({
    String method = 'upi',
    String? app = 'com.phonepe.app',
    String session = 'session_valid',
    Future<bool> Function(String)? verify,
  }) => MaterialApp(
    home: CashfreeCheckoutPage(
      paymentSessionId: session,
      providerOrderId: 'order_123',
      sandbox: true,
      amountInr: 15,
      coins: 15,
      paymentMethod: method,
      upiAppPackage: app,
      verifyPayment: verify ?? (_) async => false,
    ),
  );
  paymentTest('selected UPI app launches directly without hosted checkout', (
    tester,
  ) async {
    await tester.pumpWidget(checkout());
    await tester.pumpAndSettle();
    expect(calls.where((c) => c.method == 'doUPIPayment'), hasLength(1));
    expect(
      jsonEncode(calls.firstWhere((c) => c.method == 'doUPIPayment').arguments),
      contains('com.phonepe.app'),
    );
    expect(
      calls.any((c) => c.method == 'doWebPayment' || c.method == 'doPayment'),
      isFalse,
    );
  });
  paymentTest('UPI without a selected app uses only the UPI chooser', (
    tester,
  ) async {
    await tester.pumpWidget(checkout(app: null));
    await tester.pumpAndSettle();
    expect(calls.where((c) => c.method == 'doUPIPaymentWithUI'), hasLength(1));
  });
  paymentTest(
    'integrity failure never falls back to hosted or simulated payment',
    (tester) async {
      await tester.pumpWidget(checkout());
      await tester.pumpAndSettle();
      CFPaymentGatewayService.onError!(
        CFErrorResponse(
          'FAILED',
          'NOT_AVAILABLE is not a trusted source',
          'error',
          'error',
        ),
        'order_123',
      );
      await tester.pumpAndSettle();
      expect(find.textContaining('supported store version'), findsOneWidget);
      expect(calls.any((c) => c.method == 'doWebPayment'), isFalse);
    },
  );
  paymentTest('card selection opens inline card form instead of UPI', (
    tester,
  ) async {
    await tester.pumpWidget(checkout(method: 'card'));
    await tester.pumpAndSettle();
    expect(find.text('Cardholder name'), findsOneWidget);
    expect(find.text('CVV'), findsOneWidget);
    expect(calls.where((c) => c.method != 'response'), isEmpty);
    await tester.ensureVisible(find.text('Pay securely'));
    await tester.tap(find.text('Pay securely'));
    await tester.pumpAndSettle();
    expect(find.text('Required'), findsOneWidget);
    expect(calls.where((c) => c.method != 'response'), isEmpty);
  });
  paymentTest('invalid test sessions cannot credit a wallet', (tester) async {
    var verified = false;
    await tester.pumpWidget(
      checkout(
        session: 'test_session_fake',
        verify: (_) async {
          verified = true;
          return true;
        },
      ),
    );
    await tester.pumpAndSettle();
    expect(find.textContaining('valid payment session'), findsOneWidget);
    expect(verified, isFalse);
    expect(calls, isEmpty);
  });
  paymentTest('SDK success still requires server confirmation', (tester) async {
    var checks = 0;
    await tester.pumpWidget(
      checkout(
        verify: (_) async {
          checks++;
          return false;
        },
      ),
    );
    await tester.pumpAndSettle();
    CFPaymentGatewayService.verifyPayment!('order_123');
    for (var i = 0; i < 5; i++) {
      await tester.pump(const Duration(seconds: 1));
    }
    expect(checks, 4);
    expect(find.textContaining('Payment is not confirmed'), findsOneWidget);
    expect(find.byType(CashfreeCheckoutPage), findsOneWidget);
  });
}
