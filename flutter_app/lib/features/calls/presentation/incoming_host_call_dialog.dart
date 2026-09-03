import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/friendoo_models.dart';
import '../application/host_call_guard.dart';
import 'live_call_overlay.dart';

enum IncomingCallDecision { accept, decline, goOffline }

class IncomingHostCallDialog extends ConsumerStatefulWidget {
  const IncomingHostCallDialog({super.key, required this.call});

  final CallSession call;

  static Future<IncomingCallDecision?> show(
    BuildContext context, {
    required CallSession call,
  }) {
    return showGeneralDialog<IncomingCallDecision>(
      context: context,
      barrierDismissible: false,
      barrierLabel: 'Incoming Voice Call',
      barrierColor: Colors.black.withValues(alpha: 0.75),
      transitionDuration: const Duration(milliseconds: 250),
      pageBuilder: (context, anim1, anim2) {
        return IncomingHostCallDialog(call: call);
      },
      transitionBuilder: (context, anim1, anim2, child) {
        final curved = CurvedAnimation(parent: anim1, curve: Curves.easeOutBack);
        return ScaleTransition(
          scale: Tween<double>(begin: 0.9, end: 1.0).animate(curved),
          child: FadeTransition(
            opacity: anim1,
            child: child,
          ),
        );
      },
    );
  }

  @override
  ConsumerState<IncomingHostCallDialog> createState() =>
      _IncomingHostCallDialogState();
}

class _IncomingHostCallDialogState
    extends ConsumerState<IncomingHostCallDialog>
    with SingleTickerProviderStateMixin {
  Timer? _autoAttendTimer;
  int _countdownSeconds = 4;
  bool _isAutoAttending = false;
  late AnimationController _waveController;

  @override
  void initState() {
    super.initState();
    final guard = ref.read(hostCallGuardProvider);

    _waveController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    // If host has exhausted 5 skips, trigger auto-attend countdown
    if (guard.mustAutoAttend) {
      _isAutoAttending = true;
      _autoAttendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (!mounted) return;
        if (_countdownSeconds <= 1) {
          timer.cancel();
          Navigator.of(context).pop(IncomingCallDecision.accept);
        } else {
          setState(() {
            _countdownSeconds--;
          });
        }
      });
    }
  }

  @override
  void dispose() {
    _autoAttendTimer?.cancel();
    _waveController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final guard = ref.watch(hostCallGuardProvider);
    final rateCoins = widget.call.ratePerMinute;
    final rateRupees = (rateCoins * 0.50).toStringAsFixed(2);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Container(
            width: double.infinity,
            constraints: const BoxConstraints(maxWidth: 390),
            padding: const EdgeInsets.fromLTRB(22, 20, 22, 24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF151829),
                  Color(0xFF0F111D),
                  Color(0xFF0A0C14),
                ],
              ),
              borderRadius: BorderRadius.circular(30),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.09),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.65),
                  blurRadius: 36,
                  spreadRadius: 4,
                  offset: const Offset(0, 14),
                ),
                BoxShadow(
                  color: const Color(0xFFFF2A85).withValues(alpha: 0.08),
                  blurRadius: 40,
                  spreadRadius: -4,
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // 1. Top Bar: Friendoo Logo + Close Button
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const FriendooCallLogo(),
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(IncomingCallDecision.decline),
                      child: Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.08),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close_rounded,
                          color: Color(0xFF9CA3AF),
                          size: 18,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // 2. Avatar with Audio Soundwaves & Glowing Ring
                AnimatedBuilder(
                  animation: _waveController,
                  builder: (context, _) {
                    final waveValue = _waveController.value;
                    return Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Left sound wave bars
                        _buildSideWaveform(waveValue, isLeft: true),
                        const SizedBox(width: 14),

                        // Center glowing avatar
                        Stack(
                          alignment: Alignment.center,
                          children: [
                            // Outer faint glow ring
                            Container(
                              width: 118,
                              height: 118,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: const Color(0xFFFF2A85)
                                      .withValues(alpha: 0.15 + (waveValue * 0.1)),
                                  width: 1.5,
                                ),
                              ),
                            ),
                            // Medium vibrant pink glowing ring
                            Container(
                              width: 102,
                              height: 102,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: const Color(0xFFFF2A85)
                                      .withValues(alpha: 0.7 + (waveValue * 0.25)),
                                  width: 2.2,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFFFF2A85)
                                        .withValues(alpha: 0.35 + (waveValue * 0.2)),
                                    blurRadius: 20 + (waveValue * 6),
                                    spreadRadius: 1,
                                  ),
                                ],
                              ),
                            ),
                            // Inner avatar circle
                            Container(
                              width: 90,
                              height: 90,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Color(0xFF202438),
                              ),
                              child: const Icon(
                                Icons.person_rounded,
                                color: Color(0xFF9CA3AF),
                                size: 48,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 14),

                        // Right sound wave bars
                        _buildSideWaveform(waveValue, isLeft: false),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 24),

                // 3. Title: "Incoming Voice Call 📞"
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Incoming ',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.4,
                      ),
                    ),
                    const Text(
                      'Voice Call',
                      style: TextStyle(
                        color: Color(0xFFFF4B72),
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.4,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Transform.rotate(
                      angle: 0.1,
                      child: const Icon(
                        Icons.phone_in_talk_rounded,
                        color: Color(0xFFFF4B72),
                        size: 22,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Subtitle
                const Text(
                  'A user is calling you for 1-on-1 audio lounge.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF9CA3AF),
                    fontSize: 14,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 16),

                // 4. Rate Pill: "🪙 Rate: 5 coins/min (₹2.50/min)"
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E2235),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.08),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('🪙', style: TextStyle(fontSize: 16)),
                      const SizedBox(width: 8),
                      Text(
                        'Rate: $rateCoins coins/min (₹$rateRupees/min)',
                        style: const TextStyle(
                          color: Color(0xFFE2E8F0),
                          fontSize: 13.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 5. Trust Badges: Direct Caller Connection | Safe & Private
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.phone_callback_rounded,
                      color: Color(0xFFFF4B72),
                      size: 15,
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      'Direct Caller Connection',
                      style: TextStyle(
                        color: Color(0xFFD1D5DB),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Container(
                      height: 14,
                      width: 1,
                      color: Colors.white.withValues(alpha: 0.16),
                      margin: const EdgeInsets.symmetric(horizontal: 12),
                    ),
                    const Icon(
                      Icons.verified_user_rounded,
                      color: Color(0xFF9CA3AF),
                      size: 15,
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      'Safe & Private',
                      style: TextStyle(
                        color: Color(0xFFD1D5DB),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 22),

                // 6. Auto-Attend Warning if Skips Exhausted
                if (_isAutoAttending) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.amber.withValues(alpha: 0.6)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.timer_rounded, color: Colors.amber, size: 18),
                            const SizedBox(width: 6),
                            Text(
                              'Answering in $_countdownSeconds seconds...',
                              style: const TextStyle(
                                color: Colors.amber,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Daily skip quota reached. Calls auto-attend while online.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 11, color: Color(0xFFFDE68A)),
                        ),
                      ],
                    ),
                  ),
                ],

                // 7. Action Buttons (Skip & Accept)
                if (_isAutoAttending) ...[
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () =>
                              Navigator.of(context).pop(IncomingCallDecision.goOffline),
                          child: Container(
                            height: 52,
                            decoration: BoxDecoration(
                              color: const Color(0xFF1B1E2E),
                              borderRadius: BorderRadius.circular(26),
                              border: Border.all(
                                color: Colors.redAccent.withValues(alpha: 0.6),
                              ),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.pause_circle_filled_rounded,
                                    color: Colors.redAccent, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'Go Offline',
                                  style: TextStyle(
                                    color: Colors.redAccent,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: GestureDetector(
                          onTap: () =>
                              Navigator.of(context).pop(IncomingCallDecision.accept),
                          child: Container(
                            height: 52,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFFF2A85), Color(0xFFFF4B72)],
                              ),
                              borderRadius: BorderRadius.circular(26),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFFF2A85).withValues(alpha: 0.4),
                                  blurRadius: 16,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.call_rounded, color: Colors.white, size: 22),
                                SizedBox(width: 8),
                                Text(
                                  'Attend Now',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ] else ...[
                  Row(
                    children: [
                      // Skip Button
                      Expanded(
                        child: GestureDetector(
                          onTap: () =>
                              Navigator.of(context).pop(IncomingCallDecision.decline),
                          child: Container(
                            height: 52,
                            decoration: BoxDecoration(
                              color: const Color(0xFF1B1E2E),
                              borderRadius: BorderRadius.circular(26),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.12),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.call_end_rounded,
                                  color: Color(0xFFFF4B72),
                                  size: 22,
                                ),
                                const SizedBox(width: 10),
                                Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Skip',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    Text(
                                      '(${guard.remainingSkips} left)',
                                      style: const TextStyle(
                                        color: Color(0xFF9CA3AF),
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),

                      // Accept Button
                      Expanded(
                        child: GestureDetector(
                          onTap: () =>
                              Navigator.of(context).pop(IncomingCallDecision.accept),
                          child: Container(
                            height: 52,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFFF2A85), Color(0xFFFF4B72)],
                              ),
                              borderRadius: BorderRadius.circular(26),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFFF2A85).withValues(alpha: 0.45),
                                  blurRadius: 18,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.call_rounded,
                                  color: Colors.white,
                                  size: 22,
                                ),
                                SizedBox(width: 8),
                                Text(
                                  'Accept',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 16.5,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: -0.2,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSideWaveform(double animationValue, {required bool isLeft}) {
    final baseHeights = isLeft ? [6.0, 14.0, 24.0, 16.0, 8.0] : [8.0, 16.0, 24.0, 14.0, 6.0];
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(baseHeights.length, (i) {
        final factor = (animationValue + (i * 0.15)) % 1.0;
        final h = baseHeights[i] * (0.6 + (factor * 0.5));
        return Container(
          width: 3,
          height: h,
          margin: const EdgeInsets.symmetric(horizontal: 2.5),
          decoration: BoxDecoration(
            color: const Color(0xFFFF2A85).withValues(alpha: 0.45 + (factor * 0.35)),
            borderRadius: BorderRadius.circular(2),
          ),
        );
      }),
    );
  }
}
