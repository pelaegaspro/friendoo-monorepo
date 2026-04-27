import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class CoinBalanceWidget extends StatelessWidget {
  final int coins;
  final bool showAddButton;
  final VoidCallback? onAddTap;

  const CoinBalanceWidget({
    super.key,
    required this.coins,
    this.showAddButton = false,
    this.onAddTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.monetization_on, color: AppTheme.warning, size: 16),
          const SizedBox(width: 4),
          Text(
            '$coins',
            style: const TextStyle(
              color: AppTheme.text,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
          if (showAddButton) ...[
            const SizedBox(width: 6),
            GestureDetector(
              onTap: onAddTap,
              child: const Icon(Icons.add_circle,
                  color: AppTheme.primary, size: 18),
            ),
          ],
        ],
      ),
    );
  }
}

class CoinBalanceMiniWidget extends StatelessWidget {
  final int coins;
  final VoidCallback? onTap;

  const CoinBalanceMiniWidget({super.key, required this.coins, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.monetization_on,
                color: AppTheme.warning, size: 14),
            const SizedBox(width: 4),
            Text(
              '$coins',
              style: const TextStyle(color: AppTheme.text, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}
