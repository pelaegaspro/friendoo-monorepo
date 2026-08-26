import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/friendoo_models.dart';
import '../../profile/data/profile_repository.dart';
import '../../wallet/data/wallet_repository.dart';
import '../../wallet/presentation/coin_packages_page.dart';
import '../application/call_controller.dart';
import 'call_report_bottom_sheet.dart';

class LiveCallOverlay extends ConsumerStatefulWidget {
  const LiveCallOverlay({
    super.key,
    required this.call,
    this.hostName = 'Verified Host',
  });

  final CallSession call;
  final String hostName;

  @override
  ConsumerState<LiveCallOverlay> createState() => _LiveCallOverlayState();
}

class _LiveCallOverlayState extends ConsumerState<LiveCallOverlay>
    with SingleTickerProviderStateMixin {
  late Timer _timer;
  int _secondsElapsed = 0;
  int? _initialCoinBalance;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  bool _autoEnding = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.25).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      setState(() {
        _secondsElapsed++;
      });

      _checkBalanceLimit();
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void _checkBalanceLimit() {
    final activeProfile = ProfileRepository.currentActiveProfile;
    final isHost =
        activeProfile?.isHost == true ||
        activeProfile?.id == widget.call.hostId;
    if (isHost) return;

    final startCoins = _initialCoinBalance;
    if (startCoins == null) return;
    final rate = widget.call.ratePerMinute > 0 ? widget.call.ratePerMinute : 5;
    final maxSeconds = (startCoins ~/ rate) * 60;
    final remainingSeconds = maxSeconds - _secondsElapsed;

    if (remainingSeconds <= 0 && !_autoEnding) {
      _autoEnding = true;
      ref
          .read(activeCallProvider.notifier)
          .endActiveCall(reason: 'balance_exhausted');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.orange,
          content: Text('Call ended — your coin balance was fully used.'),
        ),
      );
    }
  }

  String _formatTimer(int totalSecs) {
    final clamped = totalSecs < 0 ? 0 : totalSecs;
    final hours = clamped ~/ 3600;
    final mins = (clamped % 3600) ~/ 60;
    final secs = clamped % 60;
    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
    }
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final isMuted = ref.watch(callMuteStateProvider);
    final isSpeaker = ref.watch(callSpeakerStateProvider);
    final wallet = ref.watch(walletStreamProvider).asData?.value;

    // Cache initial balance at start of call
    if (_initialCoinBalance == null && wallet != null) {
      _initialCoinBalance = wallet.coinBalance;
    }
    final startingCoins = _initialCoinBalance;
    final rate = widget.call.ratePerMinute > 0 ? widget.call.ratePerMinute : 5;

    // Maximum talk time in seconds calculated directly from user's coins
    final maxSeconds = startingCoins == null
        ? null
        : (startingCoins ~/ rate) * 60;
    final remainingSeconds = maxSeconds == null
        ? null
        : (maxSeconds - _secondsElapsed).clamp(0, maxSeconds);
    final availableMinutesLeft = remainingSeconds == null
        ? 'unavailable'
        : (remainingSeconds / 60).toStringAsFixed(1);

    // 5-Second Grace Period Rule:
    final bool isGracePeriod = _secondsElapsed <= 5;
    final int billedMinutes = isGracePeriod
        ? 0
        : (_secondsElapsed / 60).ceil().clamp(1, 99999);
    final int coinsSpent = billedMinutes * rate;
    final remainingCoins = startingCoins == null
        ? null
        : (startingCoins - coinsSpent).clamp(0, startingCoins);

    final bool isLowBalance =
        remainingSeconds != null &&
        remainingSeconds <= 60 &&
        remainingSeconds > 0;

    return Scaffold(
      backgroundColor: const Color(0xFF0B0E17),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0F172A), Color(0xFF1E1B4B), Color(0xFF0B0E17)],
            stops: [0.0, 0.45, 1.0],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Column(
              children: [
                // Top Header: Security Badge & Report Flag
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFF10B981).withValues(alpha: 0.6),
                          width: 1,
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.lock_outline_rounded,
                            color: Color(0xFF10B981),
                            size: 14,
                          ),
                          SizedBox(width: 6),
                          Text(
                            'SAFE & ANONYMOUS CALL',
                            style: TextStyle(
                              color: Color(0xFF10B981),
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.6,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton.filledTonal(
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.white.withValues(alpha: 0.1),
                        foregroundColor: Colors.white70,
                      ),
                      tooltip: 'Report Call',
                      icon: const Icon(Icons.flag_outlined, size: 20),
                      onPressed: () => CallReportBottomSheet.show(
                        context,
                        callId: widget.call.id,
                        autoEndCall: true,
                      ),
                    ),
                  ],
                ),

                const Spacer(flex: 1),

                // Center Pulsing Avatar with Radar Rings
                AnimatedBuilder(
                  animation: _pulseAnimation,
                  builder: (context, child) {
                    return Stack(
                      alignment: Alignment.center,
                      children: [
                        // Outer Radar Ring
                        Container(
                          width: 170 * _pulseAnimation.value,
                          height: 170 * _pulseAnimation.value,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFF6366F1).withValues(
                              alpha: (0.2 / _pulseAnimation.value).clamp(
                                0.0,
                                0.2,
                              ),
                            ),
                          ),
                        ),
                        // Middle Radar Ring
                        Container(
                          width: 140 * _pulseAnimation.value,
                          height: 140 * _pulseAnimation.value,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFF818CF8)
                                .withValues(alpha: 0.18),
                          ),
                        ),
                        // Main Luxury Avatar Box
                        Container(
                          width: 110,
                          height: 110,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF6366F1), Color(0xFFEC4899)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF6366F1)
                                    .withValues(alpha: 0.5),
                                blurRadius: 28,
                                spreadRadius: 4,
                              ),
                            ],
                          ),
                          child: Center(
                            child: Text(
                              widget.hostName.isNotEmpty
                                  ? widget.hostName
                                        .substring(0, 1)
                                        .toUpperCase()
                                  : 'H',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 44,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),

                const SizedBox(height: 20),

                // Host / Caller Name
                Text(
                  widget.hostName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 4),

                // Connection State
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFF10B981),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      'Voice Connected · HD Audio',
                      style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),

                const Spacer(flex: 1),

                // MAIN COUNTDOWN BOX (Counting down every second!)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 16,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isLowBalance
                          ? Colors.redAccent.withValues(alpha: 0.6)
                          : Colors.white.withValues(alpha: 0.12),
                      width: 1.5,
                    ),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'TALK TIME REMAINING',
                        style: TextStyle(
                          color: Color(0xFF818CF8),
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      // Huge Countdown Clock
                      Text(
                        remainingSeconds == null
                            ? '—'
                            : _formatTimer(remainingSeconds),
                        style: TextStyle(
                          fontSize: 42,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2.0,
                          color: isLowBalance
                              ? Colors.redAccent
                              : const Color(0xFF38BDF8),
                          fontFeatures: const [FontFeature.tabularFigures()],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'You can speak for ~$availableMinutesLeft mins (${_formatTimer(_secondsElapsed)} elapsed)',
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12.5,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                // LIVE COIN BALANCE PILL
                if (isGracePeriod)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.green, width: 1),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.shield_outlined,
                          color: Colors.green,
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '5s Grace Period (${5 - _secondsElapsed}s left) • 0 coins charged',
                          style: const TextStyle(
                            color: Colors.green,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.monetization_on_rounded,
                          color: Colors.amber,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          remainingCoins == null
                              ? 'Balance unavailable · $rate coins/min'
                              : '$remainingCoins Coins Left · $rate coins/min',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),

                // Low balance warning quick topup
                if (isLowBalance) ...[
                  const SizedBox(height: 10),
                  InkWell(
                    onTap: () =>
                        CoinPackagesPage.push(context, isCallRecharge: true),
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.redAccent.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.redAccent),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '⚠️ Low balance · ',
                            style: TextStyle(
                              color: Colors.redAccent,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Recharge Coins Now ➔',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],

                const Spacer(flex: 2),

                // CALL CONTROLS ROW: Mute, End Call (Red), Speaker
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    // MUTE BUTTON
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        InkWell(
                          onTap: () => ref
                              .read(activeCallProvider.notifier)
                              .toggleMute(),
                          borderRadius: BorderRadius.circular(36),
                          child: Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isMuted
                                  ? Colors.redAccent
                                  : Colors.white.withValues(alpha: 0.12),
                              border: Border.all(
                                color: isMuted
                                    ? Colors.redAccent
                                    : Colors.white24,
                                width: 1.5,
                              ),
                            ),
                            child: Icon(
                              isMuted
                                  ? Icons.mic_off_rounded
                                  : Icons.mic_rounded,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          isMuted ? 'Muted' : 'Mute',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),

                    // BIG RED END CALL BUTTON
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        InkWell(
                          onTap: () => ref
                              .read(activeCallProvider.notifier)
                              .endActiveCall(reason: 'user_hangup'),
                          borderRadius: BorderRadius.circular(44),
                          child: Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFFEF4444),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFEF4444)
                                      .withValues(alpha: 0.45),
                                  blurRadius: 20,
                                  spreadRadius: 3,
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.call_end_rounded,
                              color: Colors.white,
                              size: 38,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'End Call',
                          style: TextStyle(
                            color: Color(0xFFEF4444),
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),

                    // SPEAKER BUTTON
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        InkWell(
                          onTap: () => ref
                              .read(activeCallProvider.notifier)
                              .toggleSpeakerphone(),
                          borderRadius: BorderRadius.circular(36),
                          child: Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isSpeaker
                                  ? const Color(0xFF6366F1)
                                  : Colors.white.withValues(alpha: 0.12),
                              border: Border.all(
                                color: isSpeaker
                                    ? const Color(0xFF6366F1)
                                    : Colors.white24,
                                width: 1.5,
                              ),
                            ),
                            child: Icon(
                              isSpeaker
                                  ? Icons.volume_up_rounded
                                  : Icons.volume_down_rounded,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          isSpeaker ? 'Speaker On' : 'Speaker',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
