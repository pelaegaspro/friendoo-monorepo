import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/friendoo_models.dart';
import '../data/wallet_repository.dart';

import 'coin_packages_page.dart';
import 'select_payment_method_page.dart';
import 'cashfree_checkout_page.dart';

class RechargeCheckoutSheet extends ConsumerStatefulWidget {
  const RechargeCheckoutSheet({super.key, required this.package});

  final CoinPackage package;

  static Future<bool?> show(BuildContext context, {CoinPackage? package}) {
    if (package != null) {
      return SelectPaymentMethodPage.push(context, package: package);
    }
    return CoinPackagesPage.push(context);
  }

  @override
  ConsumerState<RechargeCheckoutSheet> createState() =>
      _RechargeCheckoutSheetState();
}

class _RechargeCheckoutSheetState extends ConsumerState<RechargeCheckoutSheet> {
  String _selectedMethod = 'Cashfree';
  bool _isProcessing = false;

  static const _paymentMethods = [
    {
      'id': 'Cashfree',
      'title': 'Cashfree Secure Checkout',
      'subtitle': 'UPI, cards, net banking and wallets',
      'icon': Icons.lock_rounded,
      'badge': 'SECURE',
    },
  ];

  Future<void> _processPayment(bool isFirstTimeBuyer) async {
    setState(() => _isProcessing = true);
    try {
      final order = await ref
          .read(walletRepositoryProvider)
          .rechargeWallet(
            package: widget.package,
            paymentMethod: _selectedMethod,
            isFirstTimeBuyer: isFirstTimeBuyer,
          );
      if (!mounted) return;
      final orderError = order?['error'] as String?;
      if (orderError != null) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(orderError)));
        return;
      }
      final sessionId = order?['payment_session_id'] as String?;
      final providerOrderId = order?['provider_order_id'] as String?;
      if (sessionId == null ||
          sessionId.isEmpty ||
          providerOrderId == null ||
          providerOrderId.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Unable to create a secure Cashfree payment order.'),
          ),
        );
        return;
      }
      final completed = await Navigator.of(context).push<bool>(
        MaterialPageRoute(
          builder: (_) => CashfreeCheckoutPage(
            paymentSessionId: sessionId,
            providerOrderId: providerOrderId,
            sandbox: order?['environment'] != 'production',
            verifyPayment: (orderId) => ref
                .read(walletRepositoryProvider)
                .confirmCashfreePayment(providerOrderId: orderId),
          ),
        ),
      );
      if (completed == true && mounted) Navigator.of(context).pop(true);
      ref.invalidate(walletStreamProvider);
      ref.invalidate(walletTransactionsProvider);
      ref.invalidate(isFirstTimeBuyerProvider);
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final isFirstTimeBuyer =
        ref.watch(isFirstTimeBuyerProvider).asData?.value ?? false;

    final firstTimeBonusCoins = isFirstTimeBuyer
        ? (widget.package.coins * 0.5).round()
        : 0;
    final totalCoinsReceiving = widget.package.coins + firstTimeBonusCoins;
    final approxMinutes = (totalCoinsReceiving / 5).round();
    final isAbove800 = widget.package.amountInr >= 800;

    return Container(
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: EdgeInsets.fromLTRB(
        24,
        18,
        24,
        MediaQuery.of(context).viewInsets.bottom + 28,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle Bar
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: colors.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),

            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.amber.withValues(alpha: 0.18),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.monetization_on_rounded,
                    color: Colors.amber,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Recharge Coins',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Instant recharge for audio voice lounge',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // FIRST-TIME BUYER PROMO BANNER
            if (isFirstTimeBuyer)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF8B5CF6).withValues(alpha: 0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.card_giftcard_rounded,
                      color: Colors.amber,
                      size: 24,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '1st Recharge Offer: +50% Extra Coins!',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            'You get +$firstTimeBonusCoins FREE bonus coins on this recharge.',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.9),
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

            // Order Summary Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    colors.primary.withValues(alpha: 0.08),
                    colors.secondary.withValues(alpha: 0.08),
                  ],
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: colors.primary.withValues(alpha: 0.25),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: [
                            Text(
                              '$totalCoinsReceiving Coins',
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (isAbove800) ...[
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.amber.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text(
                                  '💎 EXTRA COINS',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.amber,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        if (widget.package.bonus != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            widget.package.bonus!,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: colors.primary,
                            ),
                          ),
                        ],
                        const SizedBox(height: 4),
                        Text(
                          '≈ $approxMinutes mins of talk time (at 5 coins/min)',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colors.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '₹${widget.package.amountInr}',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: colors.primary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),

            // Payment Methods Selection
            Text(
              'Select Payment Method',
              style: theme.textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ..._paymentMethods.map((m) {
              final isSelected = _selectedMethod == m['id'];
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () {
                    setState(() => _selectedMethod = m['id']! as String);
                  },
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? colors.primaryContainer.withValues(alpha: 0.3)
                          : colors.surfaceContainerHighest.withValues(
                              alpha: 0.35,
                            ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected
                            ? colors.primary
                            : colors.outlineVariant.withValues(alpha: 0.4),
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          m['icon'] as IconData,
                          color: isSelected
                              ? colors.primary
                              : colors.onSurfaceVariant,
                          size: 22,
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Wrap(
                                spacing: 8,
                                runSpacing: 4,
                                children: [
                                  Text(
                                    m['title']! as String,
                                    style: TextStyle(
                                      fontWeight: isSelected
                                          ? FontWeight.bold
                                          : FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                  ),
                                  if (m['badge'] != null) ...[
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.green.withValues(
                                          alpha: 0.15,
                                        ),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        m['badge']! as String,
                                        style: const TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.green,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              Text(
                                m['subtitle']! as String,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: colors.onSurfaceVariant,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Radio<String>(
                          value: m['id']! as String,
                          // ignore: deprecated_member_use
                          groupValue: _selectedMethod,
                          activeColor: colors.primary,
                          // ignore: deprecated_member_use
                          onChanged: (val) {
                            if (val != null) {
                              setState(() => _selectedMethod = val);
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),

            const SizedBox(height: 14),

            // Security Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.lock_rounded, size: 14, color: Colors.green[700]),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '100% Secure 256-Bit Encrypted Payments',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.green[800],
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Pay CTA Button
            FilledButton(
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
              onPressed: _isProcessing
                  ? null
                  : () => _processPayment(isFirstTimeBuyer),
              child: _isProcessing
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      'Pay ₹${widget.package.amountInr} & Get $totalCoinsReceiving Coins',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
