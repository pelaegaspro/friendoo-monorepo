import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/friendoo_ui.dart';
import '../../../core/models/friendoo_models.dart';
import '../../../core/models/notification_model.dart';
import '../../wallet/presentation/recharge_checkout_sheet.dart';
import '../../profile/presentation/settings_pages.dart';
import '../data/notification_repository.dart';

void showLiveNotificationsSheet(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (sheetContext) => const _LiveNotificationsSheetContent(),
  );
}

class _LiveNotificationsSheetContent extends ConsumerStatefulWidget {
  const _LiveNotificationsSheetContent();

  @override
  ConsumerState<_LiveNotificationsSheetContent> createState() =>
      _LiveNotificationsSheetContentState();
}

class _LiveNotificationsSheetContentState
    extends ConsumerState<_LiveNotificationsSheetContent> {
  bool _isRefreshing = false;

  String _formatTimeAgo(DateTime? dt) {
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  Future<void> _handleRefresh() async {
    if (_isRefreshing) return;
    setState(() => _isRefreshing = true);
    ref.read(notificationRepositoryProvider).notifyRefresh();
    ref.invalidate(notificationsStreamProvider);
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) {
      setState(() => _isRefreshing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final notificationsAsync = ref.watch(notificationsStreamProvider);

    return SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.75,
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: FriendooUiColors.softViolet,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.notifications_active_rounded,
                      color: FriendooUiColors.violet,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Notifications & Alerts',
                      style: Theme.of(context).textTheme.titleLarge
                          ?.copyWith(fontWeight: FontWeight.w900, fontSize: 18),
                    ),
                  ),
                  IconButton(
                    icon: _isRefreshing
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(
                            Icons.refresh_rounded,
                            size: 20,
                            color: FriendooUiColors.muted,
                          ),
                    onPressed: _isRefreshing ? null : _handleRefresh,
                    tooltip: 'Refresh',
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Content Area
              Flexible(
                child: notificationsAsync.when(
                  data: (items) {
                    if (items.isEmpty) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(
                          vertical: 36,
                          horizontal: 16,
                        ),
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: const BoxDecoration(
                                  color: FriendooUiColors.softViolet,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.notifications_none_rounded,
                                  size: 36,
                                  color: FriendooUiColors.violet,
                                ),
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'No Notifications Yet',
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 16,
                                  color: FriendooUiColors.ink,
                                ),
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                'Live alerts for calls, wallet credits, and transactions will appear here automatically.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: FriendooUiColors.muted,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }

                    return ListView.separated(
                      shrinkWrap: true,
                      itemCount: items.length,
                      separatorBuilder: (_, _) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final item = items[index];
                        final timeAgo = _formatTimeAgo(item.createdAt);

                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                            vertical: 6,
                            horizontal: 4,
                          ),
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: item.accentColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              item.icon,
                              color: item.accentColor,
                              size: 22,
                            ),
                          ),
                          title: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  item.title,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                              if (timeAgo.isNotEmpty)
                                Text(
                                  timeAgo,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: FriendooUiColors.muted,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                            ],
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 3),
                            child: Text(
                              item.body,
                              style: const TextStyle(
                                fontSize: 12.5,
                                color: Color(0xFF4B5563),
                                height: 1.3,
                              ),
                            ),
                          ),
                          onTap: () {
                            final isHost = ref.read(
                              isHostNotificationsProvider,
                            );
                            if (item.actionType == 'recharge') {
                              if (isHost) {
                                // Host never enters recharge/payment flows
                                Navigator.of(context).pop();
                                return;
                              }
                              Navigator.of(context).pop();
                              RechargeCheckoutSheet.show(
                                context,
                                package: CoinPackage(
                                  id: item.id
                                      .replaceFirst('pkg_promo_', '')
                                      .replaceFirst('promo_', ''),
                                  coins: item.computedCoins,
                                  amountInr: item.computedPriceInr,
                                  bonus: item.bonusLabel ?? '',
                                ),
                              );
                            } else if (item.actionType == 'host_payout') {
                              Navigator.of(context).pop();
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => const HostWithdrawalPage(),
                                ),
                              );
                            } else if (item.actionType == 'open_lounge') {
                              Navigator.of(context).pop();
                            }
                          },
                        );
                      },
                    );
                  },
                  loading: () => const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(
                      child: CircularProgressIndicator(strokeWidth: 2.5),
                    ),
                  ),
                  error: (e, _) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'Unable to load live notifications',
                            style: TextStyle(
                              fontSize: 13,
                              color: FriendooUiColors.muted,
                            ),
                          ),
                          TextButton(
                            onPressed: _handleRefresh,
                            child: const Text('Try Again'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: const StadiumBorder(),
                  ),
                  child: const Text('Close'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
