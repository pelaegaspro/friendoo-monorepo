import 'package:flutter/material.dart';

class PushNotificationItem {
  const PushNotificationItem({
    required this.id,
    required this.title,
    required this.body,
    this.type = 'general',
    this.targetAudience = 'all',
    this.userId,
    this.actionType = 'none',
    this.actionUrl,
    this.promoCoins,
    this.promoPriceInr,
    this.originalPriceInr,
    this.discountBadge,
    this.bonusLabel,
    this.expiresInMinutes,
    this.isRead = false,
    this.createdAt,
  });

  final String id;
  final String title;
  final String body;
  final String type; // 'flash_sale', 'offer', 'host_surge', 'recharge', 'call', 'general'
  final String targetAudience;
  final String? userId;
  final String actionType; // 'recharge', 'open_lounge', 'link', 'none'
  final String? actionUrl;
  final int? promoCoins;
  final int? promoPriceInr;
  final int? originalPriceInr;
  final String? discountBadge;
  final String? bonusLabel;
  final int? expiresInMinutes;
  final bool isRead;
  final DateTime? createdAt;

  bool get isFlashSale => type == 'flash_sale' || discountBadge != null;

  int get computedCoins => promoCoins ?? 500;
  int get computedPriceInr => promoPriceInr ?? 149;
  String get computedBonus => bonusLabel ?? '+250 Bonus Coins';

  IconData get icon {
    switch (type) {
      case 'flash_sale':
        return Icons.bolt_rounded;
      case 'offer':
        return Icons.local_offer_rounded;
      case 'host_surge':
        return Icons.local_fire_department_rounded;
      case 'recharge':
        return Icons.monetization_on_rounded;
      case 'call':
        return Icons.phone_in_talk_rounded;
      default:
        return Icons.notifications_active_rounded;
    }
  }

  Color get accentColor {
    switch (type) {
      case 'flash_sale':
        return const Color(0xFFFFB703);
      case 'offer':
        return const Color(0xFFFF2A85);
      case 'host_surge':
        return const Color(0xFFF59E0B);
      case 'recharge':
        return const Color(0xFF10B981);
      case 'call':
        return const Color(0xFF6366F1);
      default:
        return const Color(0xFF8B5CF6);
    }
  }

  List<Color> get bannerGradient {
    switch (type) {
      case 'flash_sale':
        return const [Color(0xFF2A1500), Color(0xFF13141F)];
      case 'offer':
        return const [Color(0xFF2B0A1C), Color(0xFF13141F)];
      case 'host_surge':
        return const [Color(0xFF281900), Color(0xFF13141F)];
      case 'recharge':
        return const [Color(0xFF04241B), Color(0xFF13141F)];
      default:
        return const [Color(0xFF191B32), Color(0xFF13141F)];
    }
  }

  factory PushNotificationItem.fromMap(Map<String, dynamic> map) {
    return PushNotificationItem(
      id: map['id']?.toString() ?? '',
      title: map['title']?.toString() ?? '',
      body: map['body']?.toString() ?? '',
      type: map['type']?.toString() ?? 'general',
      targetAudience: map['target_audience']?.toString() ?? 'all',
      userId: map['user_id']?.toString(),
      actionType: map['action_type']?.toString() ?? 'none',
      actionUrl: map['action_url']?.toString(),
      promoCoins: (map['promo_coins'] as num?)?.toInt() ??
          (map['metadata'] is Map ? (map['metadata']['promo_coins'] as num?)?.toInt() : null),
      promoPriceInr: (map['promo_price_inr'] as num?)?.toInt() ??
          (map['metadata'] is Map ? (map['metadata']['promo_price_inr'] as num?)?.toInt() : null),
      originalPriceInr: (map['original_price_inr'] as num?)?.toInt() ??
          (map['metadata'] is Map ? (map['metadata']['original_price_inr'] as num?)?.toInt() : null),
      discountBadge: map['discount_badge']?.toString() ??
          (map['metadata'] is Map ? map['metadata']['discount_badge']?.toString() : null),
      bonusLabel: map['bonus_label']?.toString() ??
          (map['metadata'] is Map ? map['metadata']['bonus_label']?.toString() : null),
      expiresInMinutes: (map['expires_in_minutes'] as num?)?.toInt() ??
          (map['metadata'] is Map ? (map['metadata']['expires_in_minutes'] as num?)?.toInt() : null),
      isRead: map['is_read'] as bool? ?? false,
      createdAt: map['created_at'] != null
          ? DateTime.tryParse(map['created_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'body': body,
      'type': type,
      'target_audience': targetAudience,
      'user_id': userId,
      'action_type': actionType,
      'action_url': actionUrl,
      'promo_coins': promoCoins,
      'promo_price_inr': promoPriceInr,
      'original_price_inr': originalPriceInr,
      'discount_badge': discountBadge,
      'bonus_label': bonusLabel,
      'expires_in_minutes': expiresInMinutes,
      'is_read': isRead,
    };
  }
}
