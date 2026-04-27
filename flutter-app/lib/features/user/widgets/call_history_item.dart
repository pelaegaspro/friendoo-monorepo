import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/date_utils.dart' as app_date;
import '../../../models/call_model.dart';

class CallHistoryItem extends StatelessWidget {
  final CallModel call;
  final String hostName;
  final bool isUser;

  const CallHistoryItem({
    super.key,
    required this.call,
    required this.hostName,
    this.isUser = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: call.type == 'video'
                  ? AppTheme.primary.withValues(alpha: 0.1)
                  : AppTheme.accent.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              call.type == 'video' ? Icons.videocam : Icons.phone,
              color: call.type == 'video' ? AppTheme.primary : AppTheme.accent,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  hostName,
                  style: TextStyle(
                    color: AppTheme.text,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${call.type == 'video' ? 'Video' : 'Audio'} call - ${app_date.DateUtils.formatDuration(call.durationSeconds)}',
                  style: TextStyle(
                    color: AppTheme.subtext,
                    fontSize: 12,
                  ),
                ),
                Text(
                  app_date.DateUtils.formatTimestamp(call.createdAt),
                  style: TextStyle(
                    color: AppTheme.subtext,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (isUser)
                Text(
                  '-${call.coinsDeducted} coins',
                  style: TextStyle(
                    color: AppTheme.error,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                )
              else
                Text(
                  '+${call.hostCoinsEarned} coins',
                  style: TextStyle(
                    color: AppTheme.success,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              if (!call.callRated)
                Container(
                  margin: const EdgeInsets.only(top: 4),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'Rate',
                    style: TextStyle(
                      color: AppTheme.primary,
                      fontSize: 10,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

