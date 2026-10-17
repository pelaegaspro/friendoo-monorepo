import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/notification_model.dart';
import '../../../core/supabase/supabase_provider.dart';
import '../../profile/data/profile_repository.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(ref.watch(supabaseProvider));
});

final notificationsStreamProvider = StreamProvider<List<PushNotificationItem>>((
  ref,
) {
  final repo = ref.watch(notificationRepositoryProvider);
  final isHost = ref.watch(isHostNotificationsProvider);
  return repo.watchNotifications(isHost: isHost);
});

/// Resolves whether the current session is a host session.
final isHostNotificationsProvider = Provider<bool>((ref) {
  final profile = ref.watch(currentUserProfileStreamProvider).asData?.value;
  if (profile != null) return profile.isHost;
  final activeProfile = ProfileRepository.currentActiveProfile;
  if (activeProfile != null) return activeProfile.isHost;
  final client = ref.watch(supabaseProvider);
  final meta = client.auth.currentUser?.userMetadata;
  return meta?['is_host'] as bool? ?? false;
});

final latestNotificationProvider = Provider<PushNotificationItem?>((ref) {
  final listAsync = ref.watch(notificationsStreamProvider);
  final list = listAsync.asData?.value ?? [];
  return list.isNotEmpty ? list.first : null;
});

class NotificationRepository {
  NotificationRepository(this._client);

  final SupabaseClient _client;
  static final StreamController<void> _refreshSignal =
      StreamController<void>.broadcast();

  void notifyRefresh() {
    _refreshSignal.add(null);
  }

  Stream<List<PushNotificationItem>> watchNotifications({
    bool? isHost,
  }) async* {
    yield await fetchNotifications(isHost: isHost);

    yield* _refreshSignal.stream.asyncMap((_) async {
      return await fetchNotifications(isHost: isHost);
    });
  }

  Future<List<PushNotificationItem>> fetchNotifications({
    bool? isHost,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) return const [];

    // Strictly resolve host status. Hosts should NEVER receive buyer coin purchase promos.
    bool hostResolved = isHost ?? (ProfileRepository.currentActiveProfile?.isHost ?? false);
    if (!hostResolved) {
      try {
        final hostRow = await _client
            .from('hosts')
            .select('id')
            .eq('id', user.id)
            .maybeSingle()
            .timeout(const Duration(seconds: 3));
        if (hostRow != null) {
          hostResolved = true;
        }
      } catch (_) {}
    }

    final List<PushNotificationItem> results = [];

    // 1. Fetch live calls from the database
    try {
      final callField = hostResolved ? 'host_id' : 'caller_id';
      final callRows = await _client
          .from('calls')
          .select(
            'id, caller_id, host_id, status, duration_seconds, coins_charged, host_earnings_inr, created_at',
          )
          .eq(callField, user.id)
          .order('created_at', ascending: false)
          .limit(20)
          .timeout(const Duration(seconds: 5), onTimeout: () => []);

      for (final row in (callRows as List)) {
        final map = Map<String, dynamic>.from(row as Map);
        final status = map['status']?.toString() ?? '';
        final createdAt = DateTime.tryParse(
          map['created_at']?.toString() ?? '',
        );
        final durationSec = (map['duration_seconds'] as num?)?.toInt() ?? 0;
        final durationStr = durationSec > 0
            ? '${(durationSec ~/ 60)}m ${(durationSec % 60)}s'
            : '0s';

        if (status == 'completed') {
          results.add(
            PushNotificationItem(
              id: 'call_${map['id']}',
              title: hostResolved ? '📞 Call Completed' : '📞 Voice Call Completed',
              body: hostResolved
                  ? 'Call duration: $durationStr • Earned ₹${map['host_earnings_inr'] ?? 0}'
                  : 'Call duration: $durationStr • Charged ${map['coins_charged'] ?? 0} coins',
              type: 'call',
              actionType: hostResolved ? 'open_lounge' : 'recharge',
              createdAt: createdAt,
            ),
          );
        } else if (status == 'missed' ||
            status == 'rejected' ||
            status == 'cancelled') {
          results.add(
            PushNotificationItem(
              id: 'call_${map['id']}',
              title: '📵 Missed Call',
              body: hostResolved
                  ? 'You missed an incoming caller request.'
                  : 'Your call request was not connected.',
              type: 'call',
              actionType: 'none',
              createdAt: createdAt,
            ),
          );
        }
      }
    } catch (_) {}

    // 2. Fetch live wallet transactions from the database
    try {
      final txRows = await _client
          .from('wallet_transactions')
          .select('id, amount, transaction_type, description, created_at')
          .eq('user_id', user.id)
          .order('created_at', ascending: false)
          .limit(20)
          .timeout(const Duration(seconds: 5), onTimeout: () => []);

      for (final row in (txRows as List)) {
        final map = Map<String, dynamic>.from(row as Map);
        final amount = (map['amount'] as num?)?.toInt() ?? 0;
        final createdAt = DateTime.tryParse(
          map['created_at']?.toString() ?? '',
        );
        final desc = map['description']?.toString() ?? '';

        results.add(
          PushNotificationItem(
            id: 'tx_${map['id']}',
            title: hostResolved
                ? (amount >= 0 ? '💰 Earnings Credited' : '💸 Payout Processed')
                : (amount >= 0 ? '💰 Coins Credited' : '🪙 Coins Debited'),
            body: desc.isNotEmpty
                ? desc
                : (hostResolved
                    ? (amount >= 0
                        ? '+$amount INR added to host earnings'
                        : '$amount INR withdrawn')
                    : (amount >= 0
                        ? '+$amount coins added to your wallet'
                        : '$amount coins used')),
            type: hostResolved ? 'host_surge' : 'recharge',
            actionType: hostResolved ? 'host_payout' : 'recharge',
            createdAt: createdAt,
          ),
        );
      }
    } catch (_) {}

    // 3. Fetch live notifications table if present
    try {
      final notifRows = await _client
          .from('notifications')
          .select()
          .order('created_at', ascending: false)
          .limit(10)
          .timeout(const Duration(seconds: 5), onTimeout: () => []);

      for (final row in (notifRows as List)) {
        final map = Map<String, dynamic>.from(row as Map);
        results.add(PushNotificationItem.fromMap(map));
      }
    } catch (_) {}

    // 4. Fetch live coin package promotional offers for callers ONLY (NEVER FOR HOSTS)
    if (!hostResolved) {
      try {
        final pkgRows = await _client
            .from('coin_packages')
            .select(
              'id, coins, amount_inr, promotion_label, first_purchase_bonus_coins',
            )
            .eq('is_active', true)
            .not('promotion_label', 'is', null)
            .order('display_rank', ascending: true)
            .limit(2)
            .timeout(const Duration(seconds: 5), onTimeout: () => []);

        for (final row in (pkgRows as List)) {
          final map = Map<String, dynamic>.from(row as Map);
          final promoLabel = map['promotion_label']?.toString() ?? '';
          final bonusCoins =
              (map['first_purchase_bonus_coins'] as num?)?.toInt() ?? 0;
          final coins = (map['coins'] as num?)?.toInt() ?? 0;
          final inr = (map['amount_inr'] as num?)?.toInt() ?? 0;

          if (promoLabel.isNotEmpty) {
            results.add(
              PushNotificationItem(
                id: 'pkg_promo_${map['id']}',
                title: '🎁 $promoLabel',
                body:
                    'Get $coins Coins + $bonusCoins Bonus for only ₹$inr. Active in store.',
                type: 'offer',
                actionType: 'recharge',
                promoCoins: coins,
                promoPriceInr: inr,
                discountBadge: 'BONUS OFFER',
                bonusLabel: '+$bonusCoins Bonus Coins',
                createdAt: DateTime.now(),
              ),
            );
          }
        }
      } catch (_) {}
    }

    // Sort chronologically descending (newest first)
    results.sort((a, b) {
      final aDate = a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      final bDate = b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
      return bDate.compareTo(aDate);
    });

    return results;
  }
}
