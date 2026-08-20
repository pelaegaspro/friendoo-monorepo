import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/friendoo_models.dart';
import '../../wallet/data/wallet_repository.dart';
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
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
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
    final startCoins = _initialCoinBalance ?? 50;
    final maxSeconds = (startCoins ~/ widget.call.ratePerMinute) * 60;
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
    final mins = clamped ~/ 60;
    final secs = clamped % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final isMuted = ref.watch(callMuteStateProvider);
    final isSpeaker = ref.watch(callSpeakerStateProvider);
    final wallet = ref.watch(walletStreamProvider).asData?.value;

    // Cache initial balance at start of call (fallback to 50 if zero/mock)
    if (_initialCoinBalance == null && wallet != null) {
      _initialCoinBalance = wallet.coinBalance > 0 ? wallet.coinBalance : 50;
    }
    final startingCoins = _initialCoinBalance ?? 50;

    // Available duration from coins (e.g. 50 coins @ 5 coins/min = 10 mins = 600s)
    final maxSeconds = (startingCoins ~/ widget.call.ratePerMinute) * 60;
    final remainingSeconds = (maxSeconds - _secondsElapsed).clamp(0, maxSeconds);

    // 5-Second Grace Period Rule:
    // If <= 5s: 0 coins charged
    // If > 5s: billed per minute (e.g., 10s = 1 min charged = 5 coins)
    final bool isGracePeriod = _secondsElapsed <= 5;
    final int billedMinutes =
        isGracePeriod ? 0 : (_secondsElapsed / 60).ceil().clamp(1, 999);
    final int coinsSpent = billedMinutes * widget.call.ratePerMinute;
    final int remainingCoins =
        (startingCoins - coinsSpent).clamp(0, startingCoins);

    final bool isLowBalance = remainingSeconds <= 60 && remainingSeconds > 0;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            colors.surface,
            colors.surfaceContainerHighest.withOpacity(0.95),
            const Color(0xFF101322),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.45),
            blurRadius: 28,
            offset: const Offset(0, -6),
          ),
        ],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle Bar
            Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: colors.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 14),

            // Top Status Bar: Live Indicator & Report Button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.18),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF10B981), width: 1),
                  ),
                  child: Row(
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
                      const SizedBox(width: 8),
                      const Text(
                        'LIVE CALL',
                        style: TextStyle(
                          color: Color(0xFF10B981),
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton.filledTonal(
                  style: IconButton.styleFrom(
                    backgroundColor: colors.errorContainer.withOpacity(0.7),
                    foregroundColor: colors.error,
                  ),
                  tooltip: 'Report Call',
                  icon: const Icon(Icons.flag_rounded, size: 20),
                  onPressed: () => CallReportBottomSheet.show(
                    context,
                    callId: widget.call.id,
                    autoEndCall: true,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Pulsing Avatar with Waves
            AnimatedBuilder(
              animation: _pulseAnimation,
              builder: (context, child) {
                return Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 110 * _pulseAnimation.value,
                      height: 110 * _pulseAnimation.value,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isLowBalance
                            ? Colors.redAccent.withOpacity(0.15)
                            : colors.primary.withOpacity(0.14),
                      ),
                    ),
                    Container(
                      width: 90,
                      height: 90,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isLowBalance
                              ? [Colors.orange, Colors.redAccent]
                              : [colors.primary, colors.secondary],
                        ),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          widget.hostName.isNotEmpty
                              ? widget.hostName.substring(0, 1).toUpperCase()
                              : 'H',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 34,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 14),

            // Host Name
            Text(
              widget.hostName,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),

            // PRIMARY COUNTDOWN TIMER (Remaining Time)
            Text(
              _formatTimer(remainingSeconds),
              style: theme.textTheme.displaySmall?.copyWith(
                fontWeight: FontWeight.w800,
                letterSpacing: 1.5,
                color: isLowBalance
                    ? Colors.redAccent
                    : isGracePeriod
                        ? Colors.greenAccent[700]
                        : colors.primary,
              ),
            ),
            Text(
              'Remaining Talk Time (${_formatTimer(_secondsElapsed)} elapsed)',
              style: theme.textTheme.bodySmall?.copyWith(
                color: colors.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 12),

            // GRACE PERIOD OR COIN BALANCE BADGE
            if (isGracePeriod)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.14),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.green, width: 1),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.verified_user_rounded,
                        color: Colors.green, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      '5s Grace Period (${5 - _secondsElapsed}s) • Free if ended now',
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
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: colors.surfaceVariant.withOpacity(0.6),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.monetization_on_rounded,
                        color: Colors.amber, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      '$remainingCoins Coins Remaining • Min $billedMinutes charged ($coinsSpent coins)',
                      style: theme.textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),

            // Low Balance Warning
            if (isLowBalance) ...[
              const SizedBox(height: 10),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  '⚠️ Less than 1 minute remaining before call ends',
                  style: TextStyle(
                    color: Colors.redAccent,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Action Controls Row: Mute, Speaker, Hangup
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Mute Mic Button
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton.filledTonal(
                      iconSize: 26,
                      style: IconButton.styleFrom(
                        padding: const EdgeInsets.all(16),
                        backgroundColor: isMuted
                            ? colors.errorContainer
                            : colors.surfaceVariant,
                        foregroundColor:
                            isMuted ? colors.error : colors.onSurface,
                      ),
                      onPressed: () =>
                          ref.read(activeCallProvider.notifier).toggleMute(),
                      icon: Icon(
                          isMuted ? Icons.mic_off_rounded : Icons.mic_rounded),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      isMuted ? 'Muted' : 'Mute',
                      style: theme.textTheme.labelSmall,
                    ),
                  ],
                ),

                // Speaker Button
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton.filledTonal(
                      iconSize: 26,
                      style: IconButton.styleFrom(
                        padding: const EdgeInsets.all(16),
                        backgroundColor: isSpeaker
                            ? colors.primaryContainer
                            : colors.surfaceVariant,
                        foregroundColor:
                            isSpeaker ? colors.primary : colors.onSurface,
                      ),
                      onPressed: () =>
                          ref.read(activeCallProvider.notifier).toggleSpeaker(),
                      icon: Icon(
                        isSpeaker
                            ? Icons.volume_up_rounded
                            : Icons.volume_down_rounded,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      isSpeaker ? 'Speaker' : 'Earpiece',
                      style: theme.textTheme.labelSmall,
                    ),
                  ],
                ),

                // End Call Button
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton.filled(
                      iconSize: 28,
                      style: IconButton.styleFrom(
                        padding: const EdgeInsets.all(18),
                        backgroundColor: colors.error,
                        foregroundColor: colors.onError,
                      ),
                      onPressed: () =>
                          ref.read(activeCallProvider.notifier).endActiveCall(),
                      icon: const Icon(Icons.call_end_rounded),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'End Call',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colors.error,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
