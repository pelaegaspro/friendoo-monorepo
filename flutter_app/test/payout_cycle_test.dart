import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/features/profile/presentation/settings_pages.dart';

void main() {
  testWidgets('HostWithdrawalPage payout cycle selection and auto-fill functionality', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    const testBalance = 4500;

    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: HostWithdrawalPage(availableAmount: testBalance),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Verify both payout cycle tiles are present
    expect(find.text('Weekly Payout Cycle'), findsOneWidget);
    expect(find.text('Monthly Full Balance Settlement'), findsOneWidget);
    expect(find.text('Min ₹100'), findsOneWidget);
    expect(find.text('Full ₹4500'), findsOneWidget);

    TextField getAmountField() => tester.widget<TextField>(find.byType(TextField));

    // Initial amount defaults to availableAmount
    expect(getAmountField().controller?.text, '4500');

    // 1. Tap on preset chip ₹500
    await tester.tap(find.text('₹500'));
    await tester.pumpAndSettle();

    expect(getAmountField().controller?.text, '500');

    // 2. Tap on Monthly Full Balance Settlement
    await tester.tap(find.text('Monthly Full Balance Settlement'));
    await tester.pumpAndSettle();

    // Verify it automatically populated the full available amount
    expect(getAmountField().controller?.text, '4500');

    // 3. Tap on Weekly Payout Cycle
    await tester.tap(find.text('Weekly Payout Cycle'));
    await tester.pumpAndSettle();

    // Verify it resets to min limit ₹100 when toggled from full amount
    expect(getAmountField().controller?.text, '100');

    // 4. Tap on "Full Amount" chip
    await tester.tap(find.text('Full Amount'));
    await tester.pumpAndSettle();

    expect(getAmountField().controller?.text, '4500');
  });
}

