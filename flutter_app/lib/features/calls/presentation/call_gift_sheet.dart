import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../wallet/data/wallet_repository.dart';
import '../../wallet/presentation/coin_packages_page.dart';
import '../data/call_repository.dart';

class CallGiftItem {
  const CallGiftItem({
    required this.id,
    required this.name,
    required this.emoji,
    required this.coins,
    required this.gradient,
    required this.description,
  });

  final String id;
  final String name;
  final String emoji;
  final int coins;
  final LinearGradient gradient;
  final String description;
}

const List<CallGiftItem> kAvailableCallGifts = [
  CallGiftItem(
    id: 'rose',
    name: 'Red Rose',
    emoji: '🌹',
    coins: 5,
    gradient: LinearGradient(
      colors: [Color(0xFFF43F5E), Color(0xFFE11D48)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    description: 'Sweet token of appreciation',
  ),
  CallGiftItem(
    id: 'chocolate',
    name: 'Chocolate',
    emoji: '🍫',
    coins: 10,
    gradient: LinearGradient(
      colors: [Color(0xFF854D0E), Color(0xFFA16207)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    description: 'Delicious friendly gesture',
  ),
  CallGiftItem(
    id: 'chai',
    name: 'Hot Chai',
    emoji: '☕',
    coins: 15,
    gradient: LinearGradient(
      colors: [Color(0xFFD97706), Color(0xFFB45309)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    description: 'Warm Desi conversation cup',
  ),
  CallGiftItem(
    id: 'heart',
    name: 'Love Heart',
    emoji: '💖',
    coins: 25,
    gradient: LinearGradient(
      colors: [Color(0xFFEC4899), Color(0xFFBE185D)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    description: 'Pure good vibes & warmth',
  ),
  CallGiftItem(
    id: 'crown',
    name: 'Royal Crown',
    emoji: '👑',
    coins: 50,
    gradient: LinearGradient(
      colors: [Color(0xFFEAB308), Color(0xFFCA8A04)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    description: 'Treat her like royalty',
  ),
  CallGiftItem(
    id: 'rocket',
    name: 'Super Rocket',
    emoji: '🚀',
    coins: 100,
    gradient: LinearGradient(
      colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    description: 'Ultimate fan celebration',
  ),
];

class CallGiftSheet extends ConsumerStatefulWidget {
  const CallGiftSheet({
    super.key,
    required this.callId,
    required this.hostId,
    required this.hostName,
    required this.onGiftSent,
  });

  final String callId;
  final String hostId;
  final String hostName;
  final void Function(CallGiftItem gift) onGiftSent;

  static Future<void> show(
    BuildContext context, {
    required String callId,
    required String hostId,
    required String hostName,
    required void Function(CallGiftItem gift) onGiftSent,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CallGiftSheet(
        callId: callId,
        hostId: hostId,
        hostName: hostName,
        onGiftSent: onGiftSent,
      ),
    );
  }

  @override
  ConsumerState<CallGiftSheet> createState() => _CallGiftSheetState();
}

class _CallGiftSheetState extends ConsumerState<CallGiftSheet> {
  CallGiftItem? _selectedGift;
  bool _isSending = false;

  Future<void> _sendGift(CallGiftItem gift) async {
    final wallet = ref.read(walletStreamProvider).asData?.value;
    final currentCoins = wallet?.coinBalance ?? 0;

    if (currentCoins < gift.coins) {
      HapticFeedback.heavyImpact();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Need ${gift.coins} coins (Balance: $currentCoins). Please recharge.'),
          action: SnackBarAction(
            label: 'Recharge',
            textColor: const Color(0xFFFFD166),
            onPressed: () {
              CoinPackagesPage.push(context, isCallRecharge: true);
            },
          ),
          backgroundColor: const Color(0xFF1E2235),
        ),
      );
      return;
    }

    setState(() {
      _selectedGift = gift;
      _isSending = true;
    });

    try {
      HapticFeedback.mediumImpact();
      await ref.read(callRepositoryProvider).sendCallGift(
        callId: widget.callId,
        hostId: widget.hostId,
        giftId: gift.id,
        giftName: gift.name,
        coins: gift.coins,
        emoji: gift.emoji,
      );

      // Refresh wallet balance
      ref.invalidate(walletStreamProvider);

      if (!mounted) return;
      Navigator.of(context).pop();
      widget.onGiftSent(gift);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSending = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not send gift: $e'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final wallet = ref.watch(walletStreamProvider).asData?.value;
    final currentCoins = wallet?.coinBalance ?? 0;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
        child: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF0D111A).withValues(alpha: 0.94),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.12),
              width: 1,
            ),
          ),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Pull Bar
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Header Row: Title + Coin Balance Capsule
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'Send a Gift',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text('🎁', style: TextStyle(fontSize: 18)),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Show appreciation to ${widget.hostName}',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.6),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),

                  // Wallet Badge
                  GestureDetector(
                    onTap: () {
                      CoinPackagesPage.push(context, isCallRecharge: true);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF7C3AED).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFF7C3AED).withValues(alpha: 0.4),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('🪙', style: TextStyle(fontSize: 13)),
                          const SizedBox(width: 4),
                          Text(
                            '$currentCoins',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.add_circle_rounded,
                            color: Color(0xFFEC4899),
                            size: 14,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 18),

              // Gifts Grid
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: kAvailableCallGifts.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 0.95,
                ),
                itemBuilder: (context, index) {
                  final gift = kAvailableCallGifts[index];
                  final bool isSelected = _selectedGift?.id == gift.id;
                  final bool canAfford = currentCoins >= gift.coins;

                  return GestureDetector(
                    onTap: _isSending ? null : () => _sendGift(gift),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 180),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? const Color(0xFF7C3AED).withValues(alpha: 0.25)
                            : Colors.white.withValues(alpha: 0.04),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: isSelected
                              ? const Color(0xFFEC4899)
                              : Colors.white.withValues(alpha: 0.08),
                          width: isSelected ? 1.8 : 1,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            gift.emoji,
                            style: const TextStyle(fontSize: 32),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            gift.name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 3),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: canAfford
                                  ? const Color(0xFFF59E0B).withValues(alpha: 0.18)
                                  : Colors.white.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text('🪙', style: TextStyle(fontSize: 9)),
                                const SizedBox(width: 2),
                                Text(
                                  '${gift.coins}',
                                  style: TextStyle(
                                    color: canAfford ? const Color(0xFFFBBF24) : Colors.white60,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),

              const SizedBox(height: 12),
              Center(
                child: Text(
                  'Gifts reward the host with real diamond earnings 💎',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.45),
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
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
