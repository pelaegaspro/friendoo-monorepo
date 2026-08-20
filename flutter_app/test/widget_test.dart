import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/core/models/friendoo_models.dart';
import 'package:friendoo/features/profile/presentation/settings_pages.dart';
import 'package:friendoo/features/wallet/data/wallet_repository.dart';

void main() {
  test('maps the persisted call status safely', () {
    expect(callStatusFromDatabase('active'), CallStatus.active);
    expect(callStatusFromDatabase('unknown_state'), CallStatus.ended);
  });

  test('WalletTransactionItem correctly displays amounts and titles', () {
    final itemDebit = WalletTransactionItem(
      id: 'tx_1',
      type: 'debit',
      coinAmount: -10,
      balanceAfter: 2450,
      createdAt: DateTime(2026, 5, 20, 19, 45),
      otherPartyName: 'Ananya S',
      durationFormatted: '12m 34s',
      amountInr: 62,
    );

    expect(itemDebit.title, 'Call with Ananya S');
    expect(itemDebit.subtitle, '20 May, 7:45 PM • 12m 34s');
    expect(itemDebit.displayAmountInr, 62);
    expect(itemDebit.isCredit, false);

    final itemCredit = WalletTransactionItem(
      id: 'tx_2',
      type: 'credit',
      coinAmount: 100,
      balanceAfter: 2550,
      createdAt: DateTime(2026, 5, 20, 17, 30),
      otherPartyName: 'Recharge',
      amountInr: 500,
      methodOrContext: 'UPI',
    );

    expect(itemCredit.title, 'Recharge');
    expect(itemCredit.subtitle, '20 May, 5:30 PM • UPI');
    expect(itemCredit.displayAmountInr, 500);
    expect(itemCredit.isCredit, true);
  });

  test('HostEarningsItem formats caller and amount correctly', () {
    final hostItem = HostEarningsItem(
      id: 'earn_1',
      userName: 'Ananya S',
      createdAt: DateTime(2026, 5, 20, 19, 45),
      durationFormatted: '12m 34s',
      amountEarnedInr: 62,
    );

    expect(hostItem.title, 'Call with Ananya S');
    expect(hostItem.subtitle, '20 May, 7:45 PM • 12m 34s');
    expect(hostItem.amountEarnedInr, 62);
    expect(hostItem.userInitials, 'AS');
  });

  test('CoinPackage models work as expected', () {
    const pkg = CoinPackage(
      id: 'pkg_popular_99',
      coins: 100,
      amountInr: 99,
      bonus: '+10 Bonus',
    );

    expect(pkg.coins, 100);
    expect(pkg.amountInr, 99);
    expect(pkg.bonus, '+10 Bonus');
  });

  testWidgets('HostPayoutBankDetailsPage renders as a dedicated page with expected fields', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: HostPayoutBankDetailsPage(),
      ),
    );

    expect(find.text('Payout & Bank Details'), findsOneWidget);
    expect(find.text('Settlements, UPI ID and bank accounts'), findsOneWidget);
    expect(find.text('UPI DETAILS (RECOMMENDED)'), findsOneWidget);
    expect(find.text('BANK ACCOUNT (DIRECT TRANSFER)'), findsOneWidget);
    expect(find.text('Edit Payout Account'), findsOneWidget);
  });

  testWidgets('HostWithdrawalPage renders in ProviderScope and displays all fields', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: HostWithdrawalPage(availableAmount: 5240),
        ),
      ),
    );

    expect(find.text('Withdraw Earnings'), findsOneWidget);
    expect(find.text('AVAILABLE FOR WITHDRAWAL'), findsOneWidget);
    expect(find.text('₹5,240'), findsOneWidget);
    expect(find.text('₹500'), findsOneWidget);
    expect(find.text('₹1000'), findsOneWidget);
    expect(find.text('₹2500'), findsOneWidget);
    expect(find.text('All'), findsOneWidget);
    expect(find.text('UPI Virtual Payment Address'), findsOneWidget);
    expect(find.text('Bank Account (Direct Transfer)'), findsOneWidget);
    expect(find.text('Confirm Withdrawal'), findsOneWidget);
  });

  test('HostWithdrawalRequestResult correctly holds financial status and error details', () {
    const successResult = HostWithdrawalRequestResult(
      success: true,
      isDuplicate: false,
      payoutId: 'payout_12345',
      status: 'pending',
      amountInr: 1000.0,
    );

    expect(successResult.success, true);
    expect(successResult.isDuplicate, false);
    expect(successResult.payoutId, 'payout_12345');
    expect(successResult.status, 'pending');
    expect(successResult.amountInr, 1000.0);

    const duplicateResult = HostWithdrawalRequestResult(
      success: true,
      isDuplicate: true,
      payoutId: 'payout_12345',
      status: 'pending',
      amountInr: 1000.0,
    );

    expect(duplicateResult.isDuplicate, true);

    const failureResult = HostWithdrawalRequestResult(
      success: false,
      isDuplicate: false,
      errorMessage: 'Minimum withdrawal amount is ₹500.',
    );

    expect(failureResult.success, false);
    expect(failureResult.errorMessage, 'Minimum withdrawal amount is ₹500.');
  });
}


