import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/call_controller.dart';
import '../data/call_repository.dart';

class CallSummaryDialog extends ConsumerStatefulWidget {
  const CallSummaryDialog({super.key, required this.summary});

  final LastEndedCallSummary summary;

  static Future<void> show(BuildContext context, LastEndedCallSummary summary) {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => CallSummaryDialog(summary: summary),
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
      ref.read(lastEndedCallSummaryProvider.notifier).state = null;
      if (mounted) Navigator.of(context).pop();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _submitted = false;
        _submitError = 'We could not save your feedback. Please try again.';
      });
    }
  }

  void _skipFeedback() {
    ref.read(lastEndedCallSummaryProvider.notifier).state = null;
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      title: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: widget.summary.wasGracePeriod
                  ? Colors.green.withValues(alpha: 0.15)
                  : colors.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(
              widget.summary.wasGracePeriod
                  ? Icons.verified_user_rounded
                  : Icons.phone_callback_rounded,
              color: widget.summary.wasGracePeriod
                  ? Colors.green
                  : colors.primary,
              size: 32,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            widget.summary.wasGracePeriod
                ? 'Call Cancelled (Free)'
                : 'Call Summary',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: colors.surfaceContainerHighest.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Column(
                        children: [
                          Text(
                            'Duration',
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: colors.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _formatDuration(widget.summary.durationSeconds),
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        height: 36,
                        width: 1,
                        color: colors.outlineVariant.withValues(alpha: 0.5),
                      ),
                      Column(
                        children: [
                          Text(
                            'Coins Charged',
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: colors.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(
                                Icons.monetization_on_rounded,
                                color: Colors.amber,
                                size: 18,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${widget.summary.coinsDeducted}',
                                style: theme.textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: widget.summary.wasGracePeriod
                                      ? Colors.green
                                      : null,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                  if (widget.summary.wasGracePeriod) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        '🛡️ 5-Second Grace Period — No coins charged',
                        style: TextStyle(
                          color: Colors.green,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ] else ...[
                    const SizedBox(height: 8),
                    Text(
                      '${widget.summary.billedMinutes} min billed @ 5 coins/min',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colors.onSurfaceVariant,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Rate your experience',
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                final starValue = index + 1;
                return IconButton(
                  iconSize: 32,
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  icon: Icon(
                    starValue <= _rating
                        ? Icons.star_rounded
                        : Icons.star_outline_rounded,
                    color: starValue <= _rating ? Colors.amber : colors.outline,
                  ),
                  onPressed: () => setState(() => _rating = starValue),
                );
              }),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _feedbackController,
              decoration: InputDecoration(
                hintText: 'Leave a note or feedback (optional)',
                hintStyle: TextStyle(
                  fontSize: 13,
                  color: colors.onSurfaceVariant,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
              ),
            ),
            if (_submitError != null) ...[
              const SizedBox(height: 10),
              Text(
                _submitError!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.red,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ],
        ),
      ),
      actionsAlignment: MainAxisAlignment.center,
      actions: [
        TextButton(
          onPressed: _submitted ? null : _skipFeedback,
          child: const Text('Skip'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          onPressed: _submitted ? null : _submitFeedback,
          child: const Text('Done'),
        ),
      ],
    );
  }
}
