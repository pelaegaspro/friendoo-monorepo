import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/friendoo_models.dart';
import '../data/wallet_repository.dart';

class RechargeCheckoutSheet extends ConsumerStatefulWidget {
  const RechargeCheckoutSheet({
    super.key,
    required this.package,
  });

  final CoinPackage package;

  static Future<bool?> show(
    BuildContext context, {
    required CoinPackage package,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => RechargeCheckoutSheet(package: package),
    );
  }

  @override
  ConsumerState<RechargeCheckoutSheet> createState() =>
      _RechargeCheckoutSheetState();
}

class _RechargeCheckoutSheetState extends ConsumerState<RechargeCheckoutSheet> {
  String _selectedMethod = 'UPI (GPay / PhonePe / Paytm)';
  bool _isProcessing = false;

  static const _paymentMethods = [
    {
      'id': 'UPI (GPay / PhonePe / Paytm)',
      'title': 'Instant UPI Payment',
      'subtitle': 'Google Pay, PhonePe, Paytm, BHIM',
      'icon': Icons.flash_on_rounded,
      'badge': 'FASTEST',
    },
    {
      'id': 'Credit / Debit Card',
      'title': 'Debit / Credit Card',
      'subtitle': 'Visa, Mastercard, RuPay',
      'icon': Icons.credit_card_rounded,
      'badge': null,
    },
    {
      'id': 'Net Banking & Wallets',
      'title': 'Net Banking & Wallets',
      'subtitle': 'All major Indian banks',
      'icon': Icons.account_balance_rounded,
      'badge': null,
    },
  ];

  Future<void> _processPayment(bool isFirstTimeBuyer) async {
    setState(() => _isProcessing = true);
    await Future<void>.delayed(const Duration(milliseconds: 900));

    final success = await ref.read(walletRepositoryProvider).rechargeWallet(
          package: widget.package,
          paymentMethod: _selectedMethod,
          isFirstTimeBuyer: isFirstTimeBuyer,
        );

    ref.invalidate(walletStreamProvider);
    ref.invalidate(walletTransactionsProvider);
    ref.invalidate(isFirstTimeBuyerProvider);

    final finalCoins = isFirstTimeBuyer
        ? (widget.package.coins * 1.5).round()
        : widget.package.coins;

    if (mounted) {
      Navigator.of(context).pop(success);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFF10B981),
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  '🎉 +$finalCoins Coins added to your wallet successfully!',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final isFirstTimeBuyer =
        ref.watch(isFirstTimeBuyerProvider).asData?.value ?? false;

    final firstTimeBonusCoins =
        isFirstTimeBuyer ? (widget.package.coins * 0.5).round() : 0;
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
                    color: Colors.amber.withOpacity(0.18),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.monetization_on_rounded,
                      color: Colors.amber, size: 28),
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
                      color: const Color(0xFF8B5CF6).withOpacity(0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    const Icon(Icons.card_giftcard_rounded,
                        color: Colors.amber, size: 24),
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
                              color: Colors.white.withOpacity(0.9),
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
                    colors.primary.withOpacity(0.08),
                    colors.secondary.withOpacity(0.08),
                  ],
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: colors.primary.withOpacity(0.25)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              '$totalCoinsReceiving Coins',
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (isAbove800) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.amber.withOpacity(0.2),
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
                          ? colors.primaryContainer.withOpacity(0.3)
                          : colors.surfaceVariant.withOpacity(0.35),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected
                            ? colors.primary
                            : colors.outlineVariant.withOpacity(0.4),
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
                              Row(
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
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.green.withOpacity(0.15),
                                        borderRadius:
                                            BorderRadius.circular(8),
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
                          groupValue: _selectedMethod,
                          activeColor: colors.primary,
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
                Text(
                  '100% Secure Checkout via Cashfree Payment Gateway',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.green[800],
                    fontWeight: FontWeight.w600,
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
