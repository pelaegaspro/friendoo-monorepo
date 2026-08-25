import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/banner_ad_model.dart';
import '../../../core/supabase/backend2_supabase_provider.dart';

/// Rock-solid curated 4-card fallback for Discover Promo Carousel
/// Used if Backend 2 is offline, in cold-start, or network fails.
const List<CloudBannerAd> defaultFourDiscoverPromoCards = [
  CloudBannerAd(
    id: 'promo_flash_cashback',
    title: 'Flash 60% Cashback',
    headline: 'Flash 60% Cashback 🔥',
    subtitle: 'Ends in 5h • Get 60% bonus coins on all recharges!',
    badgeText: '⚡ 60% CASHBACK',
    gradientColors: ['#EC4899', '#8B5CF6', '#3B82F6'],
    actionType: 'recharge',
    priority: 100,
    isActive: true,
  ),
  CloudBannerAd(
    id: 'promo_first_call_free',
    title: 'First Call Free',
    headline: 'New User Gift 🎁',
    subtitle: 'Get 15 free coins instantly on first signup',
    badgeText: 'FREE BONUS',
    gradientColors: ['#10B981', '#059669', '#047857'],
    actionType: 'recharge',
    priority: 90,
    isActive: true,
  ),
  CloudBannerAd(
    id: 'promo_host_lounge',
    title: 'Host Spotlight',
    headline: 'Top Rated Hosts 🌟',
    subtitle: 'Connect with verified listeners in Hindi & English',
    badgeText: 'POPULAR',
    gradientColors: ['#F59E0B', '#D97706', '#B45309'],
    actionType: 'none',
    priority: 80,
    isActive: true,
  ),
  CloudBannerAd(
    id: 'promo_privacy_shield',
    title: '100% Anonymous',
    headline: 'Zero Phone Sharing 🛡️',
    subtitle: 'End-to-end encrypted anonymous voice calls',
    badgeText: 'PRIVATE & SAFE',
    gradientColors: ['#6366F1', '#4F46E5', '#4338CA'],
    actionType: 'none',
    priority: 70,
    isActive: true,
  ),
];

class Backend2PromoRepository {
  Backend2PromoRepository({required SupabaseClient? backend2Client})
    : _client = backend2Client;

  final SupabaseClient? _client;

  /// Fetches public discover promo items from Backend 2 table `public.public_feature_config`.
  /// Performs strict payload validation and falls back to `defaultFourDiscoverPromoCards`.
  Future<List<CloudBannerAd>> getDiscoverPromoCards() async {
    if (_client == null) {
      return defaultFourDiscoverPromoCards;
    }

    try {
      final response = await _client
          .from('public_feature_config')
          .select('key, value, is_active')
          .eq('key', 'discover_promo_items')
          .eq('is_active', true)
          .maybeSingle()
          .timeout(const Duration(seconds: 3));

      if (response == null || response['value'] == null) {
        return defaultFourDiscoverPromoCards;
      }

      final rawValue = response['value'];
      if (rawValue is! List) {
        return defaultFourDiscoverPromoCards;
      }

      final validatedCards = <CloudBannerAd>[];
      for (final item in rawValue) {
        if (item is Map<String, dynamic>) {
          final id = item['id']?.toString() ?? '';
          final headline = item['headline']?.toString() ?? '';
          final subtitle = item['subtitle']?.toString() ?? '';

          if (id.isNotEmpty && headline.isNotEmpty && subtitle.isNotEmpty) {
            final gradientList =
                (item['gradient_colors'] as List?)
                    ?.map((e) => e.toString())
                    .toList() ??
                const ['#EC4899', '#8B5CF6', '#3B82F6'];

            validatedCards.add(
              CloudBannerAd(
                id: id,
                title: item['title']?.toString() ?? headline,
                headline: headline,
                subtitle: subtitle,
                badgeText: item['badge_text']?.toString() ?? 'SPECIAL OFFER',
                gradientColors: gradientList,
                actionType: item['action_type']?.toString() ?? 'none',
                actionUrl: item['action_url']?.toString(),
                priority: (item['priority'] as num?)?.toInt() ?? 0,
                isActive: true,
              ),
            );
          }
        }
      }

      if (validatedCards.isEmpty) {
        return defaultFourDiscoverPromoCards;
      }

      // Sort by priority descending
      validatedCards.sort((a, b) => b.priority.compareTo(a.priority));
      return validatedCards;
    } catch (e) {
      debugPrint('Backend 2 promo cards fetch notice (using fallback): $e');
      return defaultFourDiscoverPromoCards;
    }
  }

  /// Real-time stream of discover promo cards with fallback
  Stream<List<CloudBannerAd>> watchDiscoverPromoCards() async* {
    yield await getDiscoverPromoCards();
  }
}

final backend2PromoRepositoryProvider = Provider<Backend2PromoRepository>((
  ref,
) {
  final client = ref.watch(backend2SupabaseClientProvider);
  return Backend2PromoRepository(backend2Client: client);
});

final discoverPromoCardsStreamProvider = StreamProvider<List<CloudBannerAd>>((
  ref,
) {
  final repo = ref.watch(backend2PromoRepositoryProvider);
  return repo.watchDiscoverPromoCards();
});
