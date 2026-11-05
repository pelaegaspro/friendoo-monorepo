import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/friendoo_models.dart';
import '../../wallet/data/wallet_repository.dart';

class DailyStreakRewardDialog extends ConsumerStatefulWidget {
  const DailyStreakRewardDialog({super.key, this.currentStreakDay = 1});

  final int currentStreakDay;

  static Future<void> show(BuildContext context, {int currentStreakDay = 1}) {
    HapticFeedback.mediumImpact();
    return showDialog<void>(
      context: context,
      barrierDismissible: true,
      barrierColor: Colors.black.withValues(alpha: 0.85),
      builder: (_) =>
          DailyStreakRewardDialog(currentStreakDay: currentStreakDay),
    );
  }

  @override
  ConsumerState<DailyStreakRewardDialog> createState() =>
      _DailyStreakRewardDialogState();
}

class _DailyStreakRewardDialogState
    extends ConsumerState<DailyStreakRewardDialog>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  bool _isClaiming = false;
  bool _claimed = false;

  static const _streakDays = [
    {'day': 1, 'coins': 5, 'badge': '+5'},
    {'day': 2, 'coins': 10, 'badge': '+10'},
    {'day': 3, 'coins': 15, 'badge': '+15'},
    {'day': 4, 'coins': 20, 'badge': '+20'},
    {'day': 5, 'coins': 25, 'badge': '+25'},
    {'day': 6, 'coins': 35, 'badge': '+35'},
    {'day': 7, 'coins': 50, 'badge': 'MEGA 👑'},
  ];

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _claimReward(int coins) async {
    setState(() => _isClaiming = true);
    HapticFeedback.heavyImpact();

    // Credit coins to the user
    final package = CoinPackage(
      id: 'streak_day_${widget.currentStreakDay}',
      coins: coins,
      amountInr: 0,
      bonus: 'Daily Login Reward',
    );

    await ref
        .read(walletRepositoryProvider)
        .rechargeWallet(
          package: package,
          paymentMethod: 'Daily Login Streak',
          isFirstTimeBuyer: false,
        );

    ref.invalidate(walletStreamProvider);
    ref.invalidate(walletTransactionsProvider);

    if (!mounted) return;

    setState(() {
      _isClaiming = false;
      _claimed = true;
    });

    await Future<void>.delayed(const Duration(milliseconds: 1200));
    if (mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFF10B981),
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  '$coins daily reward coins added.',
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
    final todayReward = _streakDays[(widget.currentStreakDay - 1).clamp(0, 6)];
    final coinsToClaim = todayReward['coins'] as int;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        width: double.infinity,
        constraints: const BoxConstraints(maxWidth: 390),
        decoration: BoxDecoration(
          color: const Color(0xFF111322),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
            color: const Color(0xFFFFB703).withValues(alpha: 0.5),
            width: 1.8,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFFFB703).withValues(alpha: 0.3),
              blurRadius: 36,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Top Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFFB703), Color(0xFFFF2A85)],
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.local_fire_department_rounded,
                          size: 14,
                          color: Color(0xFF0E1020),
                        ),
                        SizedBox(width: 4),
                        Text(
                          '7-DAY STREAK',
                          style: TextStyle(
                            color: Color(0xFF0E1020),
                            fontSize: 10.5,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.close_rounded,
                        size: 16,
                        color: Colors.white70,
                      ),
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),

              const SizedBox(height: 10),

              // Crown Icon
              ScaleTransition(
                scale: _pulseAnimation,
                child: Container(
                  width: 68,
                  height: 68,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFFB703), Color(0xFFFF2A85)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFFB703).withValues(alpha: 0.4),
                        blurRadius: 20,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.monetization_on_rounded,
                    color: Colors.white,
                    size: 36,
                  ),
                ),
              ),

              const SizedBox(height: 14),

              const Text(
                'Daily Login Coin Wheel',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.4,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Check in every day to claim bonus voice coins!',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.75),
                  fontSize: 12.5,
                ),
              ),

              const SizedBox(height: 20),

              // 7 Days Grid
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: 7,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                  childAspectRatio: 0.85,
                ),
                itemBuilder: (context, index) {
                  final dayData = _streakDays[index];
                  final dayNum = dayData['day'] as int;
                  final isToday = dayNum == widget.currentStreakDay;
                  final isPast = dayNum < widget.currentStreakDay;

                  return Container(
                    decoration: BoxDecoration(
                      color: isToday
                          ? const Color(0xFFFFB703).withValues(alpha: 0.22)
                          : (isPast
                                ? Colors.white.withValues(alpha: 0.05)
                                : const Color(0xFF1A1D30)),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isToday
                            ? const Color(0xFFFFB703)
                            : (isPast
                                  ? const Color(0xFF10B981)
                                        .withValues(alpha: 0.5)
                                  : Colors.white.withValues(alpha: 0.1)),
                        width: isToday ? 1.8 : 1,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Day $dayNum',
                          style: TextStyle(
                            color: isToday
                                ? const Color(0xFFFFB703)
                                : Colors.white60,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Icon(
                          isPast
                              ? Icons.check_circle_rounded
                              : (dayNum == 7
                                    ? Icons.workspace_premium_rounded
                                    : Icons.monetization_on_rounded),
                          size: 20,
                          color: isPast
                              ? const Color(0xFF10B981)
                              : (isToday
                                    ? const Color(0xFFFFB703)
                                    : Colors.white38),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          isPast ? 'Claimed' : '+${dayData['coins']}',
                          style: TextStyle(
                            color: isPast
                                ? const Color(0xFF10B981)
                                : (isToday ? Colors.white : Colors.white70),
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),

              const SizedBox(height: 22),

              // Claim Action Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isClaiming || _claimed
                      ? null
                      : () => _claimReward(coinsToClaim),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFFB703),
                    foregroundColor: const Color(0xFF0E1020),
                    elevation: 8,
                    shadowColor: const Color(0xFFFFB703).withValues(alpha: 0.4),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: _isClaiming
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Color(0xFF0E1020),
                          ),
                        )
                      : Text(
                          _claimed
                              ? 'Claimed'
                              : 'Claim Day ${widget.currentStreakDay} (+$coinsToClaim Coins) ➔',
                          style: const TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
