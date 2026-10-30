import 'package:flutter/material.dart';

class CloudBannerAd {
  const CloudBannerAd({
    required this.id,
    required this.title,
    this.campaignType = 'user_offer',
    this.campaignClass = 'friendoo_offer',
    this.sponsorName,
    this.targetAudience = 'all',
    this.badgeText = 'SPECIAL OFFER',
    required this.headline,
    required this.subtitle,
    this.imageUrl,
    this.gradientColors = const ['#4F46E5', '#7C3AED', '#DB2777'],
    this.actionType = 'recharge',
    this.actionUrl,
    this.placement = 'user_top_banner',
    this.promoCoins,
    this.promoPriceInr,
    this.originalPriceInr,
    this.promoBonusLabel,
    this.showAsPopup = false,
    this.isActive = true,
    this.priority = 0,
    this.clickCount = 0,
    this.impressionCount = 0,
  });

  final String id;
  final String title;
  final String campaignType; // 'user_offer', 'host_incentive', 'flash_package', 'sponsor_ad'
  final String campaignClass; // 'friendoo_offer', 'sponsored_ad'
  final String? sponsorName;
  final String targetAudience; // 'all', 'users', 'hosts', 'new_users', 'priority_users'
  final String badgeText;
  final String headline;
  final String subtitle;
  final String? imageUrl;
  final List<String> gradientColors;
  final String actionType; // 'recharge', 'link', 'none'
  final String? actionUrl;
  final String placement; // 'user_top_banner', 'host_top_banner', 'account_settings', 'pop_up_modal', 'all'
  final int? promoCoins;
  final int? promoPriceInr;
  final int? originalPriceInr;
  final String? promoBonusLabel;
  final bool showAsPopup;
  final bool isActive;
  final int priority;
  final int clickCount;
  final int impressionCount;

  bool get isSponsored =>
      campaignClass == 'sponsored_ad' ||
      campaignType == 'sponsor_ad' ||
      (sponsorName != null && sponsorName!.trim().isNotEmpty);

  List<Color> get parsedGradientColors {
    if (gradientColors.isEmpty) {
      return const [Color(0xFF4F46E5), Color(0xFF7C3AED), Color(0xFFDB2777)];
    }
    return gradientColors.map((hex) {
      final clean = hex.replaceAll('#', '').trim();
      if (clean.length == 6) {
        final val = int.tryParse('FF$clean', radix: 16);
        if (val != null) return Color(val);
      } else if (clean.length == 8) {
        final val = int.tryParse(clean, radix: 16);
        if (val != null) return Color(val);
      }
      return const Color(0xFF6366F1);
    }).toList();
  }

  factory CloudBannerAd.fromMap(Map<String, dynamic> map) {
    List<String> parseColors(dynamic raw) {
      if (raw is List) {
        return raw.map((e) => e.toString()).toList();
      }
      return const ['#4F46E5', '#7C3AED', '#DB2777'];
    }

    final rawClass = map['campaign_class']?.toString();
    final rawType = map['campaign_type']?.toString() ?? 'user_offer';
    final sponsor = map['sponsor_name']?.toString() ?? map['advertiser_name']?.toString();
    final isSpon = rawClass == 'sponsored_ad' || rawType == 'sponsor_ad' || (sponsor != null && sponsor.isNotEmpty);

    return CloudBannerAd(
      id: map['id']?.toString() ?? '',
      title: map['title']?.toString() ?? 'Special Offer',
      campaignType: rawType,
      campaignClass: rawClass ?? (isSpon ? 'sponsored_ad' : 'friendoo_offer'),
      sponsorName: sponsor,
      targetAudience: map['target_audience']?.toString() ?? 'all',
      badgeText: map['badge_text']?.toString() ?? (isSpon ? 'SPONSORED' : 'SPECIAL OFFER'),
      headline: map['headline']?.toString() ?? 'Talk More, Connect Freely!',
      subtitle:
          map['subtitle']?.toString() ?? 'Get bonus coins on talk packs today.',
      imageUrl: map['image_url']?.toString(),
      gradientColors: parseColors(map['gradient_colors']),
      actionType: map['action_type']?.toString() ?? 'recharge',
      actionUrl: map['action_url']?.toString() ?? map['destination_url']?.toString(),
      placement: map['placement']?.toString() ?? 'user_top_banner',
      promoCoins: (map['promo_coins'] as num?)?.toInt(),
      promoPriceInr: (map['promo_price_inr'] as num?)?.toInt(),
      originalPriceInr: (map['original_price_inr'] as num?)?.toInt(),
      promoBonusLabel: map['promo_bonus_label']?.toString(),
      showAsPopup: map['show_as_popup'] as bool? ?? false,
      isActive: map['is_active'] as bool? ?? true,
      priority: (map['priority'] as num?)?.toInt() ?? 0,
      clickCount: (map['click_count'] as num?)?.toInt() ?? (map['current_clicks'] as num?)?.toInt() ?? 0,
      impressionCount: (map['impression_count'] as num?)?.toInt() ?? (map['current_impressions'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'campaign_type': campaignType,
      'campaign_class': campaignClass,
      'sponsor_name': sponsorName,
      'target_audience': targetAudience,
      'badge_text': badgeText,
      'headline': headline,
      'subtitle': subtitle,
      'image_url': imageUrl,
      'gradient_colors': gradientColors,
      'action_type': actionType,
      'action_url': actionUrl,
      'placement': placement,
      'promo_coins': promoCoins,
      'promo_price_inr': promoPriceInr,
      'original_price_inr': originalPriceInr,
      'promo_bonus_label': promoBonusLabel,
      'show_as_popup': showAsPopup,
      'is_active': isActive,
      'priority': priority,
    };
  }

  static const defaultAd = CloudBannerAd(
    id: 'default_promo_1',
    title: 'Find a Host',
    campaignType: 'discover',
    campaignClass: 'friendoo_offer',
    targetAudience: 'users',
    badgeText: 'DISCOVER HOSTS',
    headline: 'Choose someone to call',
    subtitle: 'Browse hosts by language, availability and call rate.',
    gradientColors: ['#4F46E5', '#7C3AED', '#DB2777'],
    actionType: 'none',
    placement: 'user_top_banner',
    showAsPopup: false,
    isActive: true,
    priority: 100,
  );

  static const defaultHostSurgeAd = CloudBannerAd(
    id: 'default_host_dashboard_tip',
    title: 'Host Dashboard',
    campaignType: 'host_incentive',
    campaignClass: 'friendoo_offer',
    targetAudience: 'hosts',
    badgeText: 'HOST TOOLS',
    headline: 'Track your calls and earnings',
    subtitle: 'View your recent activity from the host dashboard.',
    gradientColors: ['#D97706', '#F59E0B', '#EF4444'],
    actionType: 'none',
    placement: 'host_top_banner',
    showAsPopup: false,
    isActive: true,
    priority: 30,
  );
}
