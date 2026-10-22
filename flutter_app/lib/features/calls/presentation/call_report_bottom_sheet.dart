import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/friendoo_models.dart';
import '../../discover/presentation/desi_avatar.dart';
import '../application/call_controller.dart';
import '../data/call_repository.dart';

class CallReportBottomSheet extends ConsumerStatefulWidget {
  const CallReportBottomSheet({
    super.key,
    required this.callId,
    this.autoEndCall = true,
  });

  final String callId;
  final bool autoEndCall;

  static Future<void> show(
    BuildContext context, {
    required String callId,
    bool autoEndCall = true,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) =>
          CallReportBottomSheet(callId: callId, autoEndCall: autoEndCall),
    );
  }

  static Future<void> showReportPicker(
    BuildContext context, {
    required List<CallHistoryItem> calls,
    required bool isHost,
  }) async {
    if (calls.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isHost
                ? 'No recent callers available to report.'
                : 'No recent host conversations to report.',
          ),
        ),
      );
      return;
    }

    final selectedCall = await showModalBottomSheet<CallHistoryItem>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE5E7EB),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.shield_outlined,
                    color: Color(0xFFDC2626),
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isHost ? 'Report a User' : 'Report a Host',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF111827),
                        ),
                      ),
                      Text(
                        isHost
                            ? 'Choose a user from your recent calls.'
                            : 'Choose a host from your recent calls.',
                        style: const TextStyle(
                          fontSize: 12.5,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 340),
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: calls.length,
                separatorBuilder: (_, _) => const Divider(height: 1),
                itemBuilder: (ctx, idx) {
                  final call = calls[idx];
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    leading: DesiAvatar(
                      seed: call.otherPartyName,
                      gender: DesiGender.female,
                      size: 44,
                    ),
                    title: Text(
                      call.otherPartyName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: Color(0xFF111827),
                      ),
                    ),
                    subtitle: Text(
                      '${call.formattedDateTime} • ${call.formattedDuration}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                    trailing: const Icon(
                      Icons.chevron_right_rounded,
                      color: Color(0xFF9CA3AF),
                    ),
                    onTap: () => Navigator.of(ctx).pop(call),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );

    if (selectedCall != null && context.mounted) {
      await show(context, callId: selectedCall.id, autoEndCall: false);
    }
  }

  @override
  ConsumerState<CallReportBottomSheet> createState() =>
      _CallReportBottomSheetState();
}

class _CallReportBottomSheetState extends ConsumerState<CallReportBottomSheet> {
  final _detailsController = TextEditingController();
  String _selectedReason = 'Harassment or Abusive Language';
  bool _isSubmitting = false;

  static const _reasons = [
    'Other caller was silent or did not respond',
    'Harassment or Abusive Language',
    'Asked for Money / UPI / Offline Payment',
    'Spam, Scams or Solicitation',
    'Distorted Audio / Echo Loop',
    'Safety or Privacy Violation',
    'Other Inappropriate Behavior',
  ];

  @override
  void dispose() {
    _detailsController.dispose();
    super.dispose();
  }

  Future<void> _submitReport() async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _isSubmitting = true);
    try {
      if (widget.autoEndCall) {
        await ref
            .read(activeCallProvider.notifier)
            .reportAndEndActiveCall(
              reason: _selectedReason,
              details: _detailsController.text.trim(),
            );
      } else {
        await ref
            .read(callRepositoryProvider)
            .submitCallReport(
              callId: widget.callId,
              reason: _selectedReason,
              details: _detailsController.text.trim(),
            );
      }

      if (mounted) {
        Navigator.of(context).pop();
        messenger.showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF10B981),
            content: Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Colors.white),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Report submitted for review.',
                  ),
                ),
              ],
            ),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        messenger.showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFFDC2626),
            content: Text('Unable to submit the report. Please try again.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(
        24,
        20,
        24,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: colors.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: colors.errorContainer,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.report_problem_rounded,
                    color: colors.error,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Report Live Call',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Reports are sent to the safety team for review.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              'Select Issue Reason',
              style: theme.textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _reasons.map((reason) {
                final isSelected = _selectedReason == reason;
                return ChoiceChip(
                  label: Text(reason),
                  selected: isSelected,
                  selectedColor: colors.errorContainer,
                  labelStyle: TextStyle(
                    color: isSelected
                        ? colors.onErrorContainer
                        : colors.onSurface,
                    fontWeight: isSelected
                        ? FontWeight.bold
                        : FontWeight.normal,
                    fontSize: 13,
                  ),
                  onSelected: (_) {
                    setState(() => _selectedReason = reason);
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 18),
            TextField(
              controller: _detailsController,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: 'Additional details (optional)',
                hintText: 'Describe what happened...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
            const SizedBox(height: 22),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: colors.error,
                foregroundColor: colors.onError,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              onPressed: _isSubmitting ? null : _submitReport,
              icon: _isSubmitting
                  ? const SizedBox.square(
                      dimension: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.shield_rounded),
              label: Text(
                widget.autoEndCall
                    ? 'Submit Report & End Call'
                    : 'Submit Report',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: _isSubmitting
                  ? null
                  : () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
          ],
        ),
      ),
    );
  }
}
