import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/features/wallet/presentation/cashfree_checkout_page.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Cashfree UPI Checkout Widget Tests', () {
    testWidgets('CashfreeCheckoutPage initializes with UPI parameters and renders amount and coins', (tester) async {
      bool verifierCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          home: CashfreeCheckoutPage(
            paymentSessionId: 'test_session_cf_order_test123',
            providerOrderId: 'cf_order_test123',
            sandbox: true,
            amountInr: 15,
            coins: 15,
            paymentMethod: 'PhonePe',
            upiAppPackage: 'com.phonepe.app',
            verifyPayment: (orderId) async {
              verifierCalled = true;
              return true;
            },
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify that amount ₹15 and coins +15 are clearly rendered
      expect(find.text('₹15'), findsOneWidget);
      expect(find.text('+15'), findsOneWidget);
      expect(find.text('Friendoo Coin Recharge'), findsOneWidget);

      // Tap Complete Payment
      final payButton = find.text('Pay ₹15 & Add Coins');
      expect(payButton, findsOneWidget);
      await tester.tap(payButton);
      await tester.pumpAndSettle();

      expect(verifierCalled, isTrue);
    });
  });
}

