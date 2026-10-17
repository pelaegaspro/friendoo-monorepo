import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'wallet_repository.dart';

/// Connecto-style platform fee configuration
class PlatformFeeBreakdown {
  final int baseAmount;
  final int standardFee;
  final int feeCharged;
  final bool isFree;
  final String freeReason;
  final int totalPayable;

  const PlatformFeeBreakdown({
    required this.baseAmount,
    required this.standardFee,
    required this.feeCharged,
    required this.isFree,
    required this.freeReason,
    required this.totalPayable,
  });
}

class PlatformFeePolicy {
  /// Standard platform fee charged on payments after the introductory free period
  static const int standardPlatformFeeInr = 3;

  /// Calculate platform fee breakdown based on buyer history & promotion
  static PlatformFeeBreakdown calculate({
    required int baseAmountInr,
    required bool isFirstTimeBuyer,
    bool forcePromoFree = false,
  }) {
    final isFree = isFirstTimeBuyer || forcePromoFree;
    final feeCharged = isFree ? 0 : standardPlatformFeeInr;
    final totalPayable = baseAmountInr + feeCharged;

    return PlatformFeeBreakdown(
      baseAmount: baseAmountInr,
      standardFee: standardPlatformFeeInr,
      feeCharged: feeCharged,
      isFree: isFree,
      freeReason: isFirstTimeBuyer
          ? 'Limited Time: 1st Recharge Free'
          : 'Limited Time Promotional Waiver',
      totalPayable: totalPayable,
    );
  }
}

/// Provider that returns the current platform fee breakdown for a specific package amount
final platformFeeBreakdownProvider =
    Provider.family<PlatformFeeBreakdown, int>((ref, baseAmountInr) {
  final isFirstTime =
      ref.watch(isFirstTimeBuyerProvider).asData?.value ?? true;
  return PlatformFeePolicy.calculate(
    baseAmountInr: baseAmountInr,
    isFirstTimeBuyer: isFirstTime,
  );
});
