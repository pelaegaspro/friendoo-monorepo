import 'package:flutter/material.dart';

class CloudBannerAd {
  const CloudBannerAd({
    required this.id,
    required this.title,
    this.campaignType = 'user_offer',
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
  final String
  campaignType; // 'user_offer', 'host_incentive', 'flash_package', 'sponsor_ad'
  final String
  targetAudience; // 'all', 'users', 'hosts', 'new_users', 'priority_users'
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

    return CloudBannerAd(
      id: map['id']?.toString() ?? '',
      title: map['title']?.toString() ?? 'Special Offer',
      campaignType: map['campaign_type']?.toString() ?? 'user_offer',
      targetAudience: map['target_audience']?.toString() ?? 'all',
      badgeText: map['badge_text']?.toString() ?? 'SPECIAL OFFER',
      headline: map['headline']?.toString() ?? 'Talk More, Connect Freely!',
      subtitle:
          map['subtitle']?.toString() ?? 'Get bonus coins on talk packs today.',
      imageUrl: map['image_url']?.toString(),
      gradientColors: parseColors(map['gradient_colors']),
      actionType: map['action_type']?.toString() ?? 'recharge',
      actionUrl: map['action_url']?.toString(),
      placement: map['placement']?.toString() ?? 'user_top_banner',
      promoCoins: (map['promo_coins'] as num?)?.toInt(),
      promoPriceInr: (map['promo_price_inr'] as num?)?.toInt(),
      originalPriceInr: (map['original_price_inr'] as num?)?.toInt(),
      promoBonusLabel: map['promo_bonus_label']?.toString(),
      showAsPopup: map['show_as_popup'] as bool? ?? false,
      isActive: map['is_active'] as bool? ?? true,
      priority: (map['priority'] as num?)?.toInt() ?? 0,
      clickCount: (map['click_count'] as num?)?.toInt() ?? 0,
      impressionCount: (map['impression_count'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'campaign_type': campaignType,
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
    title: 'Find Your Companion',
    campaignType: 'user_offer',
    targetAudience: 'users',
    badgeText: '🌟 DISCOVER & CONNECT',
    headline: "Find someone you'd love to talk with",
    subtitle: 'Verified friendly voice hosts available 24/7 in your preferred language.',
    gradientColors: ['#4F46E5', '#7C3AED', '#DB2777'],
    actionType: 'none',
    placement: 'user_top_banner',
    showAsPopup: false,
    isActive: true,
    priority: 100,
  );

  static const defaultHostSurgeAd = CloudBannerAd(
    id: 'default_host_surge',
    title: 'Host Peak Hour Surge Incentive',
    campaignType: 'host_incentive',
    targetAudience: 'hosts',
    badgeText: 'PEAK HOUR SURGE • +₹10/MIN',
    headline: 'Earn 2X Extra from 8 PM - 11 PM! 🔥',
    subtitle:
        'High caller volume active right now. Stay online to maximize payout.',
    gradientColors: ['#D97706', '#F59E0B', '#EF4444'],
    actionType: 'none',
    placement: 'host_top_banner',
    showAsPopup: false,
    isActive: true,
    priority: 30,
  );

  static const defaultFlashCashbackAd = CloudBannerAd(
    id: 'default_flash_60_cashback',
    title: 'Flash 60% Cashback',
    campaignType: 'flash_package',
    targetAudience: 'all',
    badgeText: '⚡ 60% CASHBACK • ENDS IN 5H',
    headline: 'Flash 60% Cashback 🔥',
    subtitle: 'Ends in 5h • Get 60% bonus coins on all recharges!',
    gradientColors: ['#FFB703', '#FF2A85', '#6366F1'],
    actionType: 'recharge',
    placement: 'all',
    promoCoins: 500,
    promoPriceInr: 149,
    originalPriceInr: 299,
    promoBonusLabel: '+60% Cashback Coins',
    showAsPopup: false,
    isActive: true,
    priority: 120,
  );

  static const defaultFlashCoinAd = CloudBannerAd(
    id: 'default_flash_popup',
    title: 'Flash Coin Drop',
    campaignType: 'flash_package',
    targetAudience: 'users',
    badgeText: '⚡ 50% OFF FLASH DROP',
    headline: '500 Coins + 250 Bonus for ₹149! 🔥',
    subtitle:
        'Limited midnight drop! Claim 2X bonus coins before the timer expires.',
    gradientColors: ['#FFB703', '#FF2A85', '#6366F1'],
    actionType: 'recharge',
    placement: 'pop_up_modal',
    promoCoins: 500,
    promoPriceInr: 149,
    originalPriceInr: 299,
    promoBonusLabel: '+250 Bonus Coins (50% OFF)',
    showAsPopup: true,
    isActive: true,
    priority: 50,
  );
}
