import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/banner_ad_model.dart';
import '../../../core/models/friendoo_models.dart';
import '../../../core/supabase/supabase_provider.dart';
import 'backend2_promo_repository.dart';

final bannerAdRepositoryProvider = Provider<BannerAdRepository>((ref) {
  return BannerAdRepository(ref.watch(supabaseProvider));
});

final activeBannerAdsStreamProvider = StreamProvider<List<CloudBannerAd>>((
  ref,
) {
  final repo = ref.watch(bannerAdRepositoryProvider);
  return repo.watchActiveBannerAds();
});

final placementBannerAdProvider = Provider.family<CloudBannerAd, String>((
  ref,
  placement,
) {
  final adsList = ref.watch(placementBannerAdsListProvider(placement));
  return adsList.first;
});

final placementBannerAdsListProvider =
    Provider.family<List<CloudBannerAd>, String>((ref, placement) {
      final adsAsync = ref.watch(activeBannerAdsStreamProvider);
      final ads = adsAsync.asData?.value ?? [];

      final matching = ads
          .where(
            (ad) =>
                ad.isActive &&
                (ad.placement == placement ||
                    ad.placement == 'all' ||
                    (placement == 'host_top_banner' &&
                        ad.campaignType == 'host_incentive') ||
                    (placement == 'user_top_banner' &&
                        (ad.placement == 'user_top_banner' ||
                            ad.placement == 'discover'))),
          )
          .toList();

      if (matching.isNotEmpty) {
        matching.sort((a, b) => b.priority.compareTo(a.priority));
        return matching;
      }

      if (placement == 'user_top_banner' || placement == 'discover') {
        final backend2Cards = ref
            .watch(discoverPromoCardsStreamProvider)
            .asData
            ?.value;
        if (backend2Cards != null && backend2Cards.isNotEmpty) {
          return backend2Cards;
        }
        return defaultFourDiscoverPromoCards;
      }

      if (placement == 'host_top_banner') {
        return const [CloudBannerAd.defaultHostSurgeAd];
      }

      if (placement == 'host_bottom_banner') {
        return const [
          CloudBannerAd(
            id: 'host_dashboard_tip',
            title: 'Host Dashboard',
            headline: 'Track your calls and earnings',
            subtitle: 'View your recent activity from the host dashboard.',
            badgeText: 'HOST TOOLS',
            campaignType: 'host_incentive',
            placement: 'host_bottom_banner',
            actionType: 'none',
            priority: 100,
            isActive: true,
            gradientColors: ['#6366F1', '#8B5CF6', '#DB2777'],
          ),
        ];
      }

      return const [CloudBannerAd.defaultAd];
    });

final activePopupOfferProvider = Provider<CloudBannerAd?>((ref) {
  final adsAsync = ref.watch(activeBannerAdsStreamProvider);
  final ads = adsAsync.asData?.value ?? [];

  final popups = ads
      .where(
        (ad) =>
            ad.isActive && (ad.showAsPopup || ad.placement == 'pop_up_modal'),
      )
      .toList();

  if (popups.isNotEmpty) {
    popups.sort((a, b) => b.priority.compareTo(a.priority));
    return popups.first;
  }

  return null;
});

final activeFlashPackageProvider = Provider<CoinPackage?>((ref) {
  final adsAsync = ref.watch(activeBannerAdsStreamProvider);
  final ads = adsAsync.asData?.value ?? [];

  final flashAds = ads
      .where(
        (ad) =>
            ad.isActive &&
            (ad.campaignType == 'flash_package' || ad.promoCoins != null) &&
            ad.promoCoins != null &&
            ad.promoPriceInr != null,
      )
      .toList();

  if (flashAds.isNotEmpty) {
    flashAds.sort((a, b) => b.priority.compareTo(a.priority));
    final best = flashAds.first;
    return CoinPackage(
      id: 'promo_flash_${best.id}',
      coins: best.promoCoins!,
      amountInr: best.promoPriceInr!,
      bonus: best.promoBonusLabel ?? '⚡ FLASH SALE: ${best.promoCoins} COINS',
    );
  }

  return null;
});

class BannerAdRepository {
  const BannerAdRepository(this._client);

  final SupabaseClient _client;

  Future<List<CloudBannerAd>> fetchActiveBannerAds() async {
    // 1. Try fetching from ad_campaigns with advertisers
    try {
      final campaignsData = await _client
          .from('ad_campaigns')
          .select('*, advertisers(display_name)')
          .eq('status', 'live')
          .order('priority', ascending: false);

      if (campaignsData.isNotEmpty) {
        return campaignsData.map((row) {
          final map = Map<String, dynamic>.from(row as Map);
          if (map['advertisers'] is Map) {
            map['sponsor_name'] = map['advertisers']['display_name'];
          }
          return CloudBannerAd.fromMap(map);
        }).toList();
      }
    } catch (_) {
      // Fall through to banner_ads compatibility read
    }

    // 2. Compatibility read from banner_ads
    try {
      final data = await _client
          .from('banner_ads')
          .select()
          .eq('is_active', true)
          .order('priority', ascending: false);

      final fetched = (data as List)
          .map(
            (row) =>
                CloudBannerAd.fromMap(Map<String, dynamic>.from(row as Map)),
          )
          .toList();

      if (fetched.isNotEmpty) {
        return fetched;
      }
      return const [CloudBannerAd.defaultAd, CloudBannerAd.defaultHostSurgeAd];
    } catch (_) {
      return const [CloudBannerAd.defaultAd, CloudBannerAd.defaultHostSurgeAd];
    }
  }

  Stream<List<CloudBannerAd>> watchActiveBannerAds() async* {
    final ads = await fetchActiveBannerAds();
    yield ads;
  }

  Future<void> recordImpression(
    String adId, {
    String placement = 'banner',
  }) async {
    if (adId.isEmpty || adId.startsWith('default_')) return;
    final hourTimestamp = DateTime.now().toUtc().toIso8601String().substring(
      0,
      13,
    );
    final idempotencyKey =
        'imp_${adId}_${_client.auth.currentUser?.id ?? "anon"}_${placement}_$hourTimestamp';
    try {
      final recorded = await _client.rpc(
        'record_ad_delivery_event',
        params: {
          'p_campaign_id': adId,
          'p_event_type': 'impression',
          'p_placement': placement,
          'p_idempotency_key': idempotencyKey,
        },
      );
      if (recorded == true) return;
    } catch (_) {}

    // Fallback to legacy record_ad_event
    try {
      await _client.rpc(
        'record_ad_event',
        params: {'p_ad_id': adId, 'p_event_type': 'impression'},
      );
    } catch (_) {}
  }

  Future<void> recordClick(String adId, {String placement = 'banner'}) async {
    if (adId.isEmpty || adId.startsWith('default_')) return;
    final minuteTimestamp = DateTime.now().toUtc().toIso8601String().substring(
      0,
      16,
    );
    final idempotencyKey =
        'clk_${adId}_${_client.auth.currentUser?.id ?? "anon"}_${placement}_$minuteTimestamp';
    try {
      final recorded = await _client.rpc(
        'record_ad_delivery_event',
        params: {
          'p_campaign_id': adId,
          'p_event_type': 'click',
          'p_placement': placement,
          'p_idempotency_key': idempotencyKey,
        },
      );
      if (recorded == true) return;
    } catch (_) {}

    // Fallback to legacy record_ad_event
    try {
      await _client.rpc(
        'record_ad_event',
        params: {'p_ad_id': adId, 'p_event_type': 'click'},
      );
    } catch (_) {}
  }
}
