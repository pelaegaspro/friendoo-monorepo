import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/friendoo_app.dart';
import '../../../core/widgets/apple_pressable.dart';
import '../../discover/data/host_repository.dart';
import '../../profile/data/profile_repository.dart';
import '../../wallet/data/wallet_repository.dart';
import '../application/call_controller.dart';
import '../data/call_repository.dart';
import 'live_call_overlay.dart';

class CallSummaryDialog extends ConsumerStatefulWidget {
  const CallSummaryDialog({super.key, required this.summary, this.isHost});

  final LastEndedCallSummary summary;
  final bool? isHost;

  static Future<void> show(
    BuildContext context,
    LastEndedCallSummary summary, {
    bool? isHost,
  }) {
    return showGeneralDialog<void>(
      context: context,
      barrierDismissible: false,
      barrierLabel: 'Call Summary',
      barrierColor: Colors.black.withValues(alpha: 0.78),
      transitionDuration: const Duration(milliseconds: 260),
      pageBuilder: (context, anim1, anim2) {
        return BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: CallSummaryDialog(summary: summary, isHost: isHost),
        );
      },
      transitionBuilder: (context, anim1, anim2, child) {
        final curved = CurvedAnimation(
          parent: anim1,
          curve: Curves.easeOutBack,
        );
        return ScaleTransition(
          scale: Tween<double>(begin: 0.92, end: 1.0).animate(curved),
          child: FadeTransition(opacity: anim1, child: child),
        );
      },
    );
  }

  @override
  ConsumerState<CallSummaryDialog> createState() => _CallSummaryDialogState();
}

class _CallSummaryDialogState extends ConsumerState<CallSummaryDialog> {
  int _rating = 5;
  final Set<String> _selectedCompliments = {'🎙️ Sweet Voice'};
  final _feedbackController = TextEditingController();
  bool _submitted = false;
  String? _submitError;

  bool get _isHostUser {
    if (widget.isHost != null) return widget.isHost!;
    final activeProfile = ProfileRepository.currentActiveProfile;
    final isHostFromProvider = ref.read(isHostModeProvider);
    return isHostFromProvider || activeProfile?.isHost == true;
  }

  @override
  void dispose() {
    _feedbackController.dispose();
    super.dispose();
  }

  String _formatDuration(int seconds) {
    final mins = seconds ~/ 60;
    final secs = seconds % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  Future<void> _submitFeedback() async {
    setState(() {
      _submitted = true;
      _submitError = null;
    });

    try {
      await ref
          .read(callRepositoryProvider)
          .submitCallRating(
            callId: widget.summary.callId,
            rating: _rating,
            feedback: _feedbackController.text.trim(),
            tags: _selectedCompliments.toList(),
          );
      _cleanupAndPop();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _submitted = false;
        _submitError = 'We could not save your feedback. Please try again.';
      });
    }
  }

  void _skipFeedback() {
    _cleanupAndPop();
  }

  void _cleanupAndPop() {
    ref.read(lastEndedCallSummaryProvider.notifier).state = null;
    ref.invalidate(walletStreamProvider);
    ref.invalidate(hostDashboardStatsProvider);
    ref.invalidate(hostRecentEarningsProvider);
    ref
        .read(walletRepositoryProvider)
        .fetchCurrentWallet()
        .then((fresh) {
          WalletRepository.notifyWalletChanged(fresh);
        })
        .catchError((_) {});
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final isHost = _isHostUser;
    final coinsDeducted = widget.summary.coinsDeducted;
    final hostEarnedCoins = (coinsDeducted * 0.60).round();
    final hostEarningsRupees = widget.summary.wasGracePeriod
        ? 0.0
        : (coinsDeducted * 0.60 * 0.50);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(32),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
              child: Container(
                width: double.infinity,
                constraints: const BoxConstraints(maxWidth: 384),
                padding: const EdgeInsets.fromLTRB(18, 20, 18, 22),
                decoration: BoxDecoration(
                  color: const Color(0xFF131626).withValues(alpha: 0.88),
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.14),
                    width: 0.85,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.55),
                      blurRadius: 36,
                      spreadRadius: 2,
                      offset: const Offset(0, 14),
                    ),
                    BoxShadow(
                      color: const Color(0xFFFF2A85).withValues(alpha: 0.08),
                      blurRadius: 40,
                      spreadRadius: -2,
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // 1. Top Bar: Friendoo Logo + Apple Frosted Close Button
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const FriendooCallLogo(),
                        ApplePressable(
                          onTap: _skipFeedback,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(18),
                            child: BackdropFilter(
                              filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                              child: Container(
                                width: 34,
                                height: 34,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.08),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.12),
                                    width: 0.75,
                                  ),
                                ),
                                child: const Icon(
                                  Icons.close_rounded,
                                  color: Color(0xFF94A3B8),
                                  size: 18,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // 2. Apple Ambient Emblem Badge
                    Container(
                      width: 58,
                      height: 58,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFF1D2034),
                        border: Border.all(
                          color: const Color(0xFFFF2A85).withValues(alpha: 0.65),
                          width: 1.8,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFFF2A85).withValues(alpha: 0.35),
                            blurRadius: 20,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.phone_callback_rounded,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // 3. Apple Typography Header
                    const Text(
                      'Call Summary',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Call ended • Verified session',
                      style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // 4. APPLE BENTO METRIC TILES (DURATION & COINS / EARNINGS)
                    Row(
                      children: [
                        // Bento Tile 1: Duration
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(20),
                            child: BackdropFilter(
                              filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 14,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.05),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.10),
                                    width: 0.75,
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.access_time_filled_rounded,
                                          color: const Color(0xFFC084FC)
                                              .withValues(alpha: 0.9),
                                          size: 14,
                                        ),
                                        const SizedBox(width: 5),
                                        const Text(
                                          'DURATION',
                                          style: TextStyle(
                                            color: Color(0xFF94A3B8),
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.w700,
                                            letterSpacing: 0.8,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        _formatDuration(widget.summary.durationSeconds),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 22,
                                          fontWeight: FontWeight.w800,
                                          fontFeatures: [
                                            FontFeature.tabularFigures(),
                                          ],
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      widget.summary.wasGracePeriod
                                          ? '🛡️ Free (<5s)'
                                          : '${widget.summary.billedMinutes} min billed',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        color: widget.summary.wasGracePeriod
                                            ? const Color(0xFF34D399)
                                            : const Color(0xFF94A3B8),
                                        fontSize: 11,
                                        fontWeight: widget.summary.wasGracePeriod
                                            ? FontWeight.w700
                                            : FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),

                        // Bento Tile 2: Coins Deducted or Host Earnings
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(20),
                            child: BackdropFilter(
                              filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 14,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.05),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.10),
                                    width: 0.75,
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(
                                          isHost
                                              ? Icons.account_balance_wallet_rounded
                                              : Icons.monetization_on_rounded,
                                          color: isHost
                                              ? const Color(0xFF10B981)
                                              : const Color(0xFFFBBF24),
                                          size: 14,
                                        ),
                                        const SizedBox(width: 5),
                                        Text(
                                          isHost ? 'HOST EARNED' : 'COINS CHARGED',
                                          style: const TextStyle(
                                            color: Color(0xFF94A3B8),
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.w700,
                                            letterSpacing: 0.8,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: isHost
                                          ? Text(
                                              '₹${hostEarningsRupees.toStringAsFixed(2)}',
                                              style: const TextStyle(
                                                color: Color(0xFF34D399),
                                                fontSize: 22,
                                                fontWeight: FontWeight.w800,
                                                fontFeatures: [
                                                  FontFeature.tabularFigures(),
                                                ],
                                              ),
                                            )
                                          : Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Text('🪙 ',
                                                    style: TextStyle(fontSize: 17)),
                                                Text(
                                                  '$coinsDeducted',
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 22,
                                                    fontWeight: FontWeight.w800,
                                                    fontFeatures: [
                                                      FontFeature.tabularFigures(),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      isHost
                                          ? (widget.summary.wasGracePeriod
                                              ? '₹0.00 (<5s)'
                                              : '$hostEarnedCoins coins')
                                          : (widget.summary.wasGracePeriod
                                              ? 'Grace Period'
                                              : '@ 5 coins/min'),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: Color(0xFF94A3B8),
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 22),

                    // 5. Tactile Apple Rating Bar
                    const Text(
                      'Rate your experience',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Your feedback helps us maintain quality',
                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                    ),
                    const SizedBox(height: 14),

                    // 5 Tactile Stars with Spring Pop
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        final starIndex = index + 1;
                        final isFilled = starIndex <= _rating;
                        return ApplePressable(
                          scale: 0.85,
                          onTap: () {
                            setState(() {
                              _rating = starIndex;
                            });
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 5),
                            child: Icon(
                              Icons.star_rounded,
                              size: 38,
                              color: isFilled
                                  ? const Color(0xFFFF2A85)
                                  : const Color(0xFF23273B),
                            ),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 14),

                    // Voice Compliment Badges (FRND / Chamet style)
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      alignment: WrapAlignment.center,
                      children: [
                        '🎙️ Sweet Voice',
                        '👂 Great Listener',
                        '✨ Positive Vibes',
                        '😂 Very Funny',
                        '💖 Super Polite',
                        '🌟 Warm & Friendly',
                      ].map((tag) {
                        final isSelected = _selectedCompliments.contains(tag);
                        return GestureDetector(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() {
                              if (isSelected) {
                                _selectedCompliments.remove(tag);
                              } else {
                                _selectedCompliments.add(tag);
                              }
                            });
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 160),
                            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? const Color(0xFF7C3AED).withValues(alpha: 0.35)
                                  : Colors.white.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isSelected
                                    ? const Color(0xFFEC4899)
                                    : Colors.white.withValues(alpha: 0.12),
                                width: 1,
                              ),
                            ),
                            child: Text(
                              tag,
                              style: TextStyle(
                                color: isSelected ? Colors.white : const Color(0xFF94A3B8),
                                fontSize: 11.5,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),

                    // 6. Frosted Feedback Input
                    ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.10),
                              width: 0.75,
                            ),
                          ),
                          child: Column(
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Padding(
                                    padding: EdgeInsets.only(top: 8),
                                    child: Icon(
                                      Icons.edit_outlined,
                                      color: Color(0xFF6B7280),
                                      size: 18,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: TextField(
                                      controller: _feedbackController,
                                      maxLength: 200,
                                      maxLines: 2,
                                      onChanged: (_) => setState(() {}),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 13.5,
                                      ),
                                      decoration: const InputDecoration(
                                        hintText: 'Leave a note or feedback (optional)',
                                        hintStyle: TextStyle(
                                          color: Color(0xFF6B7280),
                                          fontSize: 13,
                                        ),
                                        border: InputBorder.none,
                                        counterText: '',
                                        isDense: true,
                                        contentPadding: EdgeInsets.symmetric(
                                          vertical: 8,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              Align(
                                alignment: Alignment.bottomRight,
                                child: Text(
                                  '${_feedbackController.text.length}/200',
                                  style: const TextStyle(
                                    color: Color(0xFF6B7280),
                                    fontSize: 11,
                                    fontFeatures: [FontFeature.tabularFigures()],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    if (_submitError != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        _submitError!,
                        style: const TextStyle(
                          color: Colors.redAccent,
                          fontSize: 12,
                        ),
                      ),
                    ],
                    const SizedBox(height: 22),

                    // 7. Tactile Apple Action Buttons (Skip & Done)
                    Row(
                      children: [
                        // Skip Button (Apple Frosted Glass Pill)
                        Expanded(
                          child: ApplePressable(
                            onTap: _skipFeedback,
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(24),
                              child: BackdropFilter(
                                filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
                                child: Container(
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.08),
                                    borderRadius: BorderRadius.circular(24),
                                    border: Border.all(
                                      color: Colors.white.withValues(alpha: 0.14),
                                      width: 0.85,
                                    ),
                                  ),
                                  child: const Center(
                                    child: Text(
                                      'Skip',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: -0.2,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),

                        // Done Button (Radiant Apple Pink Pill)
                        Expanded(
                          child: ApplePressable(
                            onTap: _submitted ? null : _submitFeedback,
                            child: Container(
                              height: 48,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFFFF2A85), Color(0xFFFF4365)],
                                ),
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.20),
                                  width: 1.0,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFFFF2A85)
                                        .withValues(alpha: 0.40),
                                    blurRadius: 16,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Center(
                                child: _submitted
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                    : const Text(
                                        'Done',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 16,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: -0.2,
                                        ),
                                      ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
