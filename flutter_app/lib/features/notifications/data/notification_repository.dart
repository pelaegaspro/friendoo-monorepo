import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/notification_model.dart';
import '../../../core/supabase/supabase_provider.dart';

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
  static final StreamController<List<PushNotificationItem>> _localBroadcaster =
      StreamController<List<PushNotificationItem>>.broadcast();

  static const defaultFlashSaleNotification = PushNotificationItem(
    id: 'flash_sale_midnight_01',
    title: '⚡ FLASH COIN SALE: 50% OFF!',
    body: 'Grab 500 Coins + 250 Bonus for ₹149 (Save ₹150)! Offer expires in 15 mins.',
    type: 'flash_sale',
    targetAudience: 'users',
    actionType: 'recharge',
    promoCoins: 500,
    promoPriceInr: 149,
    originalPriceInr: 299,
    discountBadge: '⚡ 50% OFF FLASH',
    bonusLabel: '+250 Bonus Coins',
    expiresInMinutes: 15,
    isRead: false,
  );

  static const defaultWelcomeNotification = PushNotificationItem(
    id: 'welcome_01',
    title: 'Welcome to Friendoo Voice Lounge! 🎉',
    body: 'Enjoy high-quality, 100% anonymous calling with verified female hosts.',
    type: 'general',
    targetAudience: 'all',
    actionType: 'open_lounge',
    isRead: false,
  );

  static const defaultHostSurgeNotification = PushNotificationItem(
    id: 'host_surge_01',
    title: '🔥 Peak Hour Host Surge (8PM - 11PM)',
    body: 'Earn 2X bonus earnings on every completed voice call tonight!',
    type: 'host_surge',
    targetAudience: 'hosts',
    actionType: 'none',
    isRead: false,
  );

  Stream<List<PushNotificationItem>> watchNotifications({
    bool isHost = false,
  }) async* {
    final list = isHost
        ? [defaultHostSurgeNotification, defaultWelcomeNotification]
        : [defaultFlashSaleNotification, defaultWelcomeNotification];
    yield list;
  }

  /// Triggers a local simulated flash coin sale notification into the stream
  void triggerLocalFlashSale({
    int coins = 500,
    int priceInr = 149,
    int originalPriceInr = 299,
    String badge = '⚡ FLASH DROP 50% OFF',
  }) {
    final notif = PushNotificationItem(
      id: 'flash_sale_${DateTime.now().millisecondsSinceEpoch}',
      title: '⚡ FLASH COIN DROP: $badge',
      body:
          'Get $coins Coins + 250 Bonus for only ₹$priceInr! Tap to claim now.',
      type: 'flash_sale',
      targetAudience: 'users',
      actionType: 'recharge',
      promoCoins: coins,
      promoPriceInr: priceInr,
      originalPriceInr: originalPriceInr,
      discountBadge: badge,
      bonusLabel: '+250 Bonus Coins',
      expiresInMinutes: 10,
      createdAt: DateTime.now(),
    );

    _localBroadcaster.add([notif]);
  }

  Future<List<PushNotificationItem>> fetchNotifications() async {
    try {
      final data = await _client
          .from('notifications')
          .select()
          .order('created_at', ascending: false)
          .limit(30);

      return (data as List)
          .map(
            (row) => PushNotificationItem.fromMap(
              Map<String, dynamic>.from(row as Map),
            ),
          )
          .toList();
    } catch (_) {
      return [defaultFlashSaleNotification, defaultWelcomeNotification];
    }
  }
}
