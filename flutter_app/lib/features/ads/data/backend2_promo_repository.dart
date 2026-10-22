import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/banner_ad_model.dart';
import '../../../core/supabase/backend2_supabase_provider.dart';

/// Neutral discovery tips used when no remote promotions are available.
const List<CloudBannerAd> defaultFourDiscoverPromoCards = [
  CloudBannerAd(
    id: 'discover_available_hosts',
    title: 'Find a host',
    headline: 'Choose someone to call',
    subtitle: 'Browse hosts who are available to take a call.',
    badgeText: 'DISCOVER',
    gradientColors: ['#EC4899', '#8B5CF6', '#3B82F6'],
    actionType: 'none',
    priority: 100,
    isActive: true,
  ),
  CloudBannerAd(
    id: 'discover_languages',
    title: 'Choose a language',
    headline: 'Find someone who speaks your language',
    subtitle: 'Check host profiles for spoken languages.',
    badgeText: 'LANGUAGES',
    gradientColors: ['#10B981', '#059669', '#047857'],
    actionType: 'none',
    priority: 90,
    isActive: true,
  ),
  CloudBannerAd(
    id: 'discover_call_rates',
    title: 'Check call rates',
    headline: 'Know the rate before you call',
    subtitle: 'Each host profile shows the per-minute rate.',
    badgeText: 'CALL RATES',
    gradientColors: ['#F59E0B', '#D97706', '#B45309'],
    actionType: 'none',
    priority: 80,
    isActive: true,
  ),
  CloudBannerAd(
    id: 'discover_call_controls',
    title: 'Call controls',
    headline: 'You control the call',
    subtitle: 'End a call or report a concern from the call screen.',
    badgeText: 'CALL SAFETY',
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
  /// Validates public promo items and falls back to neutral discovery tips.
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
