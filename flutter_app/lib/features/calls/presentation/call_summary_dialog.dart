import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/friendoo_app.dart';
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
      barrierColor: Colors.black.withValues(alpha: 0.75),
      transitionDuration: const Duration(milliseconds: 250),
      pageBuilder: (context, anim1, anim2) {
        return CallSummaryDialog(summary: summary, isHost: isHost);
      },
      transitionBuilder: (context, anim1, anim2, child) {
        final curved = CurvedAnimation(
          parent: anim1,
          curve: Curves.easeOutBack,
        );
        return ScaleTransition(
          scale: Tween<double>(begin: 0.9, end: 1.0).animate(curved),
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
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 20),
          child: Container(
            width: double.infinity,
            constraints: const BoxConstraints(maxWidth: 380),
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF141728),
                  Color(0xFF0F111E),
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
                      onTap: _skipFeedback,
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
                const SizedBox(height: 16),

                // 2. Top Icon Badge
                Container(
                  width: 58,
                  height: 58,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1F2236),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFFFF2A85).withValues(alpha: 0.6),
                      width: 1.8,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFF2A85).withValues(alpha: 0.3),
                        blurRadius: 18,
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
                const SizedBox(height: 14),

                // 3. Title & Subtitle
                const Text(
                  'Call Summary',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Call ended',
                  style: TextStyle(
                    color: Color(0xFF9CA3AF),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 18),

                // 4. Metric Card (Role-Aware: Coins Charged vs Host Earnings)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF171A2D),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.08),
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          // Duration Column
                          Expanded(
                            child: Row(
                              children: [
                                Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFC084FC)
                                        .withValues(alpha: 0.15),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.access_time_filled_rounded,
                                    color: Color(0xFFC084FC),
                                    size: 19,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Duration',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          color: Color(0xFF9CA3AF),
                                          fontSize: 12,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      FittedBox(
                                        fit: BoxFit.scaleDown,
                                        alignment: Alignment.centerLeft,
                                        child: Text(
                                          _formatDuration(widget.summary.durationSeconds),
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 19,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Vertical divider
                          Container(
                            height: 36,
                            width: 1,
                            color: Colors.white.withValues(alpha: 0.12),
                            margin: const EdgeInsets.symmetric(horizontal: 8),
                          ),

                          // Financial Column: User Coins vs Host Earnings
                          Expanded(
                            child: isHost
                                ? Row(
                                    children: [
                                      Container(
                                        width: 36,
                                        height: 36,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF10B981)
                                              .withValues(alpha: 0.15),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                          Icons.account_balance_wallet_rounded,
                                          color: Color(0xFF10B981),
                                          size: 19,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            const Text(
                                              'Earnings',
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: TextStyle(
                                                color: Color(0xFF9CA3AF),
                                                fontSize: 12,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            FittedBox(
                                              fit: BoxFit.scaleDown,
                                              alignment: Alignment.centerLeft,
                                              child: Text(
                                                '₹${hostEarningsRupees.toStringAsFixed(2)}',
                                                style: const TextStyle(
                                                  color: Color(0xFF34D399),
                                                  fontSize: 19,
                                                  fontWeight: FontWeight.w800,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  )
                                : Row(
                                    children: [
                                      Container(
                                        width: 36,
                                        height: 36,
                                        decoration: BoxDecoration(
                                          color: Colors.amber
                                              .withValues(alpha: 0.15),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Center(
                                          child: Text('🪙',
                                              style: TextStyle(fontSize: 17)),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            const Text(
                                              'Coins Charged',
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: TextStyle(
                                                color: Color(0xFF9CA3AF),
                                                fontSize: 12,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            FittedBox(
                                              fit: BoxFit.scaleDown,
                                              alignment: Alignment.centerLeft,
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  const Text('🪙 ',
                                                      style: TextStyle(fontSize: 15)),
                                                  Text(
                                                    '$coinsDeducted',
                                                    style: const TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 19,
                                                      fontWeight: FontWeight.w800,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Metric Subtext
                      Text(
                        isHost
                            ? (widget.summary.wasGracePeriod
                                  ? '🛡️ Call cancelled (<5s) · ₹0.00 earned'
                                  : '${widget.summary.billedMinutes} min completed · ₹${hostEarningsRupees.toStringAsFixed(2)} earned ($hostEarnedCoins coins)')
                            : (widget.summary.wasGracePeriod
                                  ? '🛡️ 5-Second Grace Period — Free Call'
                                  : '${widget.summary.billedMinutes} min billed @ 5 coins/min'),
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: widget.summary.wasGracePeriod
                              ? const Color(0xFF34D399)
                              : const Color(0xFF9CA3AF),
                          fontSize: 11.5,
                          fontWeight: widget.summary.wasGracePeriod
                              ? FontWeight.w700
                              : FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // 5. Rating Section
                const Text(
                  'Rate your experience',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 15.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Your feedback helps us improve',
                  style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
                ),
                const SizedBox(height: 12),

                // 5 Pink Stars
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    final starIndex = index + 1;
                    final isFilled = starIndex <= _rating;
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _rating = starIndex;
                        });
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Icon(
                          Icons.star_rounded,
                          size: 36,
                          color: isFilled
                              ? const Color(0xFFFF2A85)
                              : const Color(0xFF2A2E44),
                        ),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 18),

                // 6. Feedback Text Input
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF141727),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.08),
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
                          ),
                        ),
                      ),
                    ],
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
                const SizedBox(height: 20),

                // 7. Action Buttons (Skip & Done)
                Row(
                  children: [
                    // Skip Button
                    Expanded(
                      child: GestureDetector(
                        onTap: _skipFeedback,
                        child: Container(
                          height: 48,
                          decoration: BoxDecoration(
                            color: const Color(0xFF1A1D2E),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.12),
                            ),
                          ),
                          child: const Center(
                            child: Text(
                              'Skip',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),

                    // Done Button
                    Expanded(
                      child: GestureDetector(
                        onTap: _submitted ? null : _submitFeedback,
                        child: Container(
                          height: 48,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFFF2A85), Color(0xFFFF4365)],
                            ),
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFFF2A85)
                                    .withValues(alpha: 0.4),
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
                                      fontWeight: FontWeight.bold,
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
    );
  }
}
