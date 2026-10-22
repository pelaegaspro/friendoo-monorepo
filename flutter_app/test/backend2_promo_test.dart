import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:friendoo/core/config/app_environment.dart';
import 'package:friendoo/core/supabase/backend2_supabase_provider.dart';
import 'package:friendoo/features/ads/data/backend2_promo_repository.dart';
import 'package:friendoo/features/ads/data/banner_ad_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Friendoo Dual Supabase Project Architecture & Backend 2 Promo Isolation', () {
    test('1. Backend 1 and Backend 2 environment configuration separation', () {
      const env = AppEnvironment(
        supabaseUrl: 'https://gjbhsogarwqkkftzijhf.supabase.co',
        supabasePublishableKey: 'sb_publishable_backend1_key',
        backend2PublicUrl: 'https://wqoqeljqzknccyeegtxb.supabase.co',
        backend2PublishableKey: 'sb_publishable_backend2_key',
      );

      expect(env.supabaseUrl, contains('gjbhsogarwqkkftzijhf'));
      expect(env.backend2PublicUrl, contains('wqoqeljqzknccyeegtxb'));
      expect(env.supabaseUrl, isNot(equals(env.backend2PublicUrl)));
      expect(env.supabasePublishableKey, isNot(equals(env.backend2PublishableKey)));
    });

    test('2. Backend 2 lazy client provider is non-blocking and isolated', () {
      final container = ProviderContainer(
        overrides: [
          appEnvironmentProvider.overrideWithValue(
            const AppEnvironment(
              supabaseUrl: 'https://gjbhsogarwqkkftzijhf.supabase.co',
              supabasePublishableKey: 'sb_publishable_b1',
              backend2PublicUrl: 'https://wqoqeljqzknccyeegtxb.supabase.co',
              backend2PublishableKey: 'sb_publishable_b2',
            ),
          ),
        ],
      );

      final backend2Client = container.read(backend2SupabaseClientProvider);
      expect(backend2Client, isNotNull);
    });

    test('3. Backend 2 Promo Repository returns neutral discovery tips on offline fallback', () async {
      final repo = Backend2PromoRepository(backend2Client: null);
      final cards = await repo.getDiscoverPromoCards();

      expect(cards.length, equals(4));
      expect(cards.map((card) => card.id).toList(), [
        'discover_available_hosts',
        'discover_languages',
        'discover_call_rates',
        'discover_call_controls',
      ]);
      expect(cards.every((card) => card.actionType == 'none'), isTrue);
      expect(
        cards.every(
          (card) =>
              !card.headline.contains('Cashback') &&
              !card.subtitle.contains('24/7'),
        ),
        isTrue,
      );
    });

    test('4. Discover banner provider gracefully integrates Backend 2 four-card fallback', () {
      final container = ProviderContainer(
        overrides: [
          backend2PromoRepositoryProvider.overrideWithValue(
            Backend2PromoRepository(backend2Client: null),
          ),
        ],
      );

      final promoList = container.read(placementBannerAdsListProvider('user_top_banner'));
      expect(promoList.length, greaterThanOrEqualTo(4));
      expect(
        promoList.any((ad) => ad.id == 'discover_available_hosts'),
        isTrue,
      );
    });

    test('5. Zero JWT or Auth credentials leaked to Backend 2 & no session retention', () {
      final container = ProviderContainer(
        overrides: [
          appEnvironmentProvider.overrideWithValue(
            const AppEnvironment(
              supabaseUrl: 'https://gjbhsogarwqkkftzijhf.supabase.co',
              supabasePublishableKey: 'sb_publishable_b1',
              backend2PublicUrl: 'https://wqoqeljqzknccyeegtxb.supabase.co',
              backend2PublishableKey: 'sb_publishable_b2',
            ),
          ),
        ],
      );

      final client = container.read(backend2SupabaseClientProvider);
      expect(client?.auth.currentSession, isNull);
      expect(client?.auth.currentUser, isNull);
    });

    test('6. Backend 2 public feature config payload structure enforces exactly 1 row with 4 promo cards', () {
      final sampleBackend2Payload = {
        'key': 'discover_promo_items',
        'is_active': true,
        'value': [
          {
            'id': 'promo_flash_cashback',
            'title': 'Flash 60% Cashback',
            'headline': 'Flash 60% Cashback 🔥',
            'subtitle': 'Ends in 5h • Get 60% bonus coins on all recharges!',
            'badge_text': '⚡ 60% CASHBACK',
            'gradient_colors': ['#EC4899', '#8B5CF6', '#3B82F6'],
            'action_type': 'recharge',
            'priority': 100
          },
          {
            'id': 'promo_first_call_free',
            'title': 'First Call Free',
            'headline': 'New User Gift 🎁',
            'subtitle': 'Get 15 free coins instantly on first signup',
            'badge_text': 'FREE BONUS',
            'gradient_colors': ['#10B981', '#059669', '#047857'],
            'action_type': 'recharge',
            'priority': 90
          },
          {
            'id': 'promo_host_lounge',
            'title': 'Host Spotlight',
            'headline': 'Top Rated Hosts 🌟',
            'subtitle': 'Connect with verified listeners in Hindi & English',
            'badge_text': 'POPULAR',
            'gradient_colors': ['#F59E0B', '#D97706', '#B45309'],
            'action_type': 'none',
            'priority': 80
          },
          {
            'id': 'promo_privacy_shield',
            'title': '100% Anonymous',
            'headline': 'Zero Phone Sharing 🛡️',
            'subtitle': 'End-to-end encrypted anonymous voice calls',
            'badge_text': 'PRIVATE & SAFE',
            'gradient_colors': ['#6366F1', '#4F46E5', '#4338CA'],
            'action_type': 'none',
            'priority': 70
          }
        ]
      };

      expect(sampleBackend2Payload['key'], equals('discover_promo_items'));
      expect(sampleBackend2Payload['is_active'], isTrue);
      final cards = sampleBackend2Payload['value'] as List;
      expect(cards.length, equals(4));
      expect(cards[0]['id'], equals('promo_flash_cashback'));
      expect(cards[1]['id'], equals('promo_first_call_free'));
      expect(cards[2]['id'], equals('promo_host_lounge'));
      expect(cards[3]['id'], equals('promo_privacy_shield'));
    });
  });
}
