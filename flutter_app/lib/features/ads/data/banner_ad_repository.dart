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

final placementBannerAdsListProvider = Provider.family<List<CloudBannerAd>, String>((
  ref,
  placement,
) {
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
    final backend2Cards =
        ref.watch(discoverPromoCardsStreamProvider).asData?.value;
    if (backend2Cards != null && backend2Cards.isNotEmpty) {
      return backend2Cards;
    }
    return defaultFourDiscoverPromoCards;
  }

  if (placement == 'host_top_banner') {
    return const [
      CloudBannerAd(
        id: 'host_admob_banner_1',
        title: 'Google AdMob Network',
        headline: 'Google AdMob • Live Sponsor Ad',
        subtitle: 'High payout audio sponsor campaigns enabled on your lounge.',
        badgeText: 'GOOGLE ADMOB 📢',
        campaignType: 'sponsor_ad',
        placement: 'host_top_banner',
        actionType: 'link',
        actionUrl: 'https://admob.google.com',
        priority: 100,
        isActive: true,
        gradientColors: ['#4285F4', '#34A853', '#FBBC05'],
      ),
      CloudBannerAd(
        id: 'host_google_ad_1',
        title: 'Google Play Partner',
        headline: 'Google Play • Creator Deal',
        subtitle: 'Unlock creator tools & earnings boosters on your host account.',
        badgeText: 'GOOGLE PLAY ⚡',
        campaignType: 'sponsor_ad',
        placement: 'host_top_banner',
        actionType: 'link',
        actionUrl: 'https://play.google.com',
        priority: 95,
        isActive: true,
        gradientColors: ['#1A73E8', '#12B5CB', '#34A853'],
      ),
      CloudBannerAd.defaultHostSurgeAd,
    ];
  }

  if (placement == 'host_bottom_banner') {
    return const [
      CloudBannerAd(
        id: 'host_google_bottom_ad',
        title: 'Google Play Partner',
        headline: 'Google Play Pass • Sponsor Deal',
        subtitle: 'Explore 1,000+ top creator apps & tools with zero ads today.',
        badgeText: 'SPONSORED BY GOOGLE 🌟',
        campaignType: 'sponsor_ad',
        placement: 'host_bottom_banner',
        actionType: 'link',
        actionUrl: 'https://play.google.com/store/pass',
        priority: 100,
        isActive: true,
        gradientColors: ['#EA4335', '#FBBC05', '#34A853'],
      ),
      CloudBannerAd(
        id: 'host_admob_bottom_ad',
        title: 'Google AdMob Rewards',
        headline: 'AdMob Partner • Earn More Coins',
        subtitle: 'Get rewarded for active caller sessions and high engagement.',
        badgeText: 'ADMOB PARTNER 🔥',
        campaignType: 'sponsor_ad',
        placement: 'host_bottom_banner',
        actionType: 'link',
        actionUrl: 'https://admob.google.com',
        priority: 90,
        isActive: true,
        gradientColors: ['#4285F4', '#0F9D58', '#FF7043'],
      ),
    ];
  }

  return const [
    CloudBannerAd.defaultFlashCashbackAd,
    CloudBannerAd.defaultAd,
    CloudBannerAd(
      id: 'default_carousel_2',
      title: 'Mega Flash Sale ⚡',
      headline: 'Get +100 Extra Bonus Coins!',
      subtitle: 'Limited time offer on popular packs. Tap to recharge instantly.',
      badgeText: '🔥 50% EXTRA',
      campaignType: 'flash_package',
      placement: 'all',
      actionType: 'recharge',
      priority: 90,
      isActive: true,
      gradientColors: ['#8B5CF6', '#EC4899', '#F59E0B'],
      promoCoins: 200,
      promoPriceInr: 99,
      promoBonusLabel: '+100 Bonus Coins',
    ),
    CloudBannerAd(
      id: 'default_google_user_ad',
      title: 'Google Play Partner',
      headline: 'Google Play Pass • Special Offer',
      subtitle: 'Enjoy 1,000+ games & apps completely ad-free. Tap to view.',
      badgeText: 'GOOGLE AD ⚡',
      campaignType: 'sponsor_ad',
      placement: 'all',
      actionType: 'link',
      actionUrl: 'https://play.google.com/store/pass',
      priority: 80,
      isActive: true,
      gradientColors: ['#4285F4', '#34A853', '#EA4335'],
    ),
    CloudBannerAd(
      id: 'default_google_admob_ad',
      title: 'Google AdMob Deals',
      headline: 'Google AdMob • Verified Offer',
      subtitle: 'Discover trending entertainment & gaming offers across India.',
      badgeText: 'GOOGLE SPONSORED 📢',
      campaignType: 'sponsor_ad',
      placement: 'all',
      actionType: 'link',
      actionUrl: 'https://ads.google.com',
      priority: 70,
      isActive: true,
      gradientColors: ['#1A73E8', '#4285F4', '#34A853'],
    ),
  ];
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
      return const [
        CloudBannerAd.defaultFlashCashbackAd,
        CloudBannerAd.defaultAd,
        CloudBannerAd.defaultFlashCoinAd,
        CloudBannerAd.defaultHostSurgeAd,
      ];
    } catch (_) {
      return const [
        CloudBannerAd.defaultFlashCashbackAd,
        CloudBannerAd.defaultAd,
        CloudBannerAd.defaultFlashCoinAd,
        CloudBannerAd.defaultHostSurgeAd,
      ];
    }
  }

  Stream<List<CloudBannerAd>> watchActiveBannerAds() async* {
    final ads = await fetchActiveBannerAds();
    yield ads;
  }

  Future<void> recordImpression(String adId) async {
    if (adId.isEmpty || adId.startsWith('default_')) return;
    try {
      await _client.rpc(
        'record_ad_event',
        params: {'p_ad_id': adId, 'p_event_type': 'impression'},
      );
    } catch (_) {}
  }

  Future<void> recordClick(String adId) async {
    if (adId.isEmpty || adId.startsWith('default_')) return;
    try {
      await _client.rpc(
        'record_ad_event',
        params: {'p_ad_id': adId, 'p_event_type': 'click'},
      );
    } catch (_) {}
  }
}
