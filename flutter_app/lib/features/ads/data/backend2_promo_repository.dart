import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/banner_ad_model.dart';
import '../../../core/supabase/backend2_supabase_provider.dart';

/// Multi-purpose dynamic discovery carousel cards (Flash sales, 3rd party ads like Hamam, AdMob campaigns)
const List<CloudBannerAd> defaultFourDiscoverPromoCards = [
  CloudBannerAd(
    id: 'promo_flash_weekend',
    title: 'Weekend Flash Sale',
    headline: '₹99 Recharge gets +100 Bonus Coins',
    subtitle: 'Limited time caller bonus credited instantly.',
    badgeText: 'FLASH SALE',
    campaignType: 'flash_package',
    promoCoins: 220,
    promoPriceInr: 99,
    promoBonusLabel: '+100 Bonus Coins',
    gradientColors: ['#7C3AED', '#EC4899', '#F43F5E'],
    actionType: 'recharge',
    priority: 100,
    isActive: true,
  ),
  CloudBannerAd(
    id: 'promo_hamam_soap',
    title: 'Hamam Pure Neem Soap',
    headline: 'Traditional Neem & Tulsi Protection',
    subtitle: 'Natural skin protection for you and your family.',
    badgeText: 'SPONSORED',
    campaignClass: 'sponsored_ad',
    sponsorName: 'Hamam',
    actionType: 'link',
    actionUrl: 'https://www.hul.co.in/brands/skin-cleansing/hamam/',
    gradientColors: ['#065F46', '#047857', '#10B981'],
    priority: 95,
    isActive: true,
  ),
  CloudBannerAd(
    id: 'promo_stream_rewards',
    title: 'Hotstar & Entertainment Deals',
    headline: 'Exclusive Streaming & Call Perks',
    subtitle: 'Explore premium partner offers curated for Friendoo callers.',
    badgeText: 'SPECIAL OFFER',
    actionType: 'link',
    actionUrl: 'https://www.hotstar.com',
    gradientColors: ['#1E1B4B', '#312E81', '#4338CA'],
    priority: 90,
    isActive: true,
  ),
  CloudBannerAd(
    id: 'discover_call_safety',
    title: '24/7 Verified Support',
    headline: '100% Private, Safe & Encrypted Calls',
    subtitle: 'Tap Help & Support anytime for instant dispute resolution.',
    badgeText: 'VERIFIED DESK',
    gradientColors: ['#0F172A', '#1E293B', '#334155'],
    actionType: 'none',
    priority: 85,
    isActive: true,
  ),
];

class Backend2PromoRepository {
  Backend2PromoRepository({required SupabaseClient? backend2Client})
    : _client = backend2Client;

  final SupabaseClient? _client;

  Stream<List<CloudBannerAd>> watchDiscoverPromoCards() {
    final client = _client;
    if (client == null) {
      return Stream.value(defaultFourDiscoverPromoCards);
    }

    try {
      return client
          .from('banner_ads')
          .stream(primaryKey: ['id'])
          .map((rows) {
            final cards = rows
                .map((row) => CloudBannerAd.fromMap(row))
                .where((ad) => ad.isActive && (ad.placement == 'user_top_banner' || ad.placement == 'discover' || ad.placement == 'all'))
                .toList();

            if (cards.isEmpty) return defaultFourDiscoverPromoCards;
            cards.sort((a, b) => b.priority.compareTo(a.priority));
            return cards;
          })
          .handleError((dynamic error) {
            if (kDebugMode) {
              debugPrint('watchDiscoverPromoCards stream error: $error');
            }
            return defaultFourDiscoverPromoCards;
          });
    } catch (e) {
      return Stream.value(defaultFourDiscoverPromoCards);
    }
  }
}

final backend2PromoRepositoryProvider = Provider<Backend2PromoRepository?>((ref) {
  final client = ref.watch(backend2SupabaseClientProvider);
  return Backend2PromoRepository(backend2Client: client);
});

final discoverPromoCardsStreamProvider = StreamProvider<List<CloudBannerAd>>((ref) {
  final repo = ref.watch(backend2PromoRepositoryProvider);
  if (repo == null) {
    return Stream.value(defaultFourDiscoverPromoCards);
  }
  return repo.watchDiscoverPromoCards();
});
