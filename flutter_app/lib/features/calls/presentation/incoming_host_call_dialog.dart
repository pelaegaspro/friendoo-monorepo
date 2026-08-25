import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/friendoo_models.dart';
import '../application/host_call_guard.dart';

enum IncomingCallDecision { accept, decline, goOffline }

class IncomingHostCallDialog extends ConsumerStatefulWidget {
  const IncomingHostCallDialog({super.key, required this.call});

  final CallSession call;

  static Future<IncomingCallDecision?> show(
    BuildContext context, {
    required CallSession call,
  }) {
    return showDialog<IncomingCallDecision>(
      context: context,
      barrierDismissible: false,
      builder: (_) => IncomingHostCallDialog(call: call),
    );
  }

  @override
  ConsumerState<IncomingHostCallDialog> createState() =>
      _IncomingHostCallDialogState();
}

class _IncomingHostCallDialogState
    extends ConsumerState<IncomingHostCallDialog> {
  Timer? _autoAttendTimer;
  int _countdownSeconds = 4;
  bool _isAutoAttending = false;

  @override
  void initState() {
    super.initState();
    final guard = ref.read(hostCallGuardProvider);

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
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final guard = ref.watch(hostCallGuardProvider);

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      icon: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _isAutoAttending
              ? Colors.amber.withValues(alpha: 0.18)
              : colors.primaryContainer,
          shape: BoxShape.circle,
        ),
        child: Icon(
          _isAutoAttending
              ? Icons.ring_volume_rounded
              : Icons.phone_in_talk_rounded,
          size: 38,
          color: _isAutoAttending ? Colors.amber[800] : colors.primary,
        ),
      ),
      title: Text(
        _isAutoAttending ? 'Auto-Attending Call ⚡' : 'Incoming Voice Call 📞',
        textAlign: TextAlign.center,
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'A user is calling you for 1-on-1 audio lounge.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),

            // Rate Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: colors.secondaryContainer.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Rate: ${widget.call.ratePerMinute} coins/min (₹${(widget.call.ratePerMinute * 0.5).toStringAsFixed(2)}/min)',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: colors.onSecondaryContainer,
                  fontSize: 12,
                ),
              ),
            ),
            const SizedBox(height: 14),

            // AUTO ATTEND WARNING & TIMER
            if (_isAutoAttending) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.amber, width: 1),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.timer_rounded,
                          color: Colors.amber,
                          size: 18,
                        ),
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
                      '5/5 daily skips reached. Calls are auto-attended while Online.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 11, color: Colors.brown),
                    ),
                  ],
                ),
              ),
            ] else ...[
              // NORMAL SKIP QUOTA BADGE
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: colors.surfaceContainerHighest.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.swipe_right_alt_rounded,
                      size: 16,
                      color: colors.onSurfaceVariant,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Daily Skips: ${guard.skippedToday} / 5 used (${guard.remainingSkips} left)',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
      actionsAlignment: MainAxisAlignment.spaceEvenly,
      actions: [
        if (_isAutoAttending) ...[
          // Go Offline button to stop auto-attend
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              side: const BorderSide(color: Colors.redAccent),
            ),
            onPressed: () =>
                Navigator.of(context).pop(IncomingCallDecision.goOffline),
            icon: const Icon(
              Icons.pause_circle_filled_rounded,
              color: Colors.redAccent,
              size: 18,
            ),
            label: const Text(
              'Go Offline',
              style: TextStyle(
                color: Colors.redAccent,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: Colors.green,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            onPressed: () =>
                Navigator.of(context).pop(IncomingCallDecision.accept),
            icon: const Icon(Icons.call_rounded, size: 18),
            label: const Text('Attend Now'),
          ),
        ] else ...[
          // Normal Decline and Accept
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            onPressed: () =>
                Navigator.of(context).pop(IncomingCallDecision.decline),
            icon: const Icon(
              Icons.call_end_rounded,
              color: Colors.redAccent,
              size: 18,
            ),
            label: Text(
              'Skip (${guard.remainingSkips} left)',
              style: const TextStyle(color: Colors.redAccent),
            ),
          ),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            onPressed: () =>
                Navigator.of(context).pop(IncomingCallDecision.accept),
            icon: const Icon(Icons.call_rounded, size: 18),
            label: const Text('Accept'),
          ),
        ],
      ],
    );
  }
}
