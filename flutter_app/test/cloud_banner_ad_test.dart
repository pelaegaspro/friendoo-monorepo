import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/core/models/banner_ad_model.dart';

void main() {
  group('CloudBannerAd Model Tests', () {
    test('Default Friendoo offer is not marked as sponsored', () {
      final ad = CloudBannerAd.fromMap({
        'id': 'test_offer_1',
        'title': 'Recharge Bonus',
        'campaign_class': 'friendoo_offer',
        'headline': 'Get 50% extra coins',
        'subtitle': 'Special discount for today',
        'action_type': 'recharge',
      });

      expect(ad.isSponsored, isFalse);
      expect(ad.campaignClass, equals('friendoo_offer'));
      expect(ad.sponsorName, isNull);
      expect(ad.actionType, equals('recharge'));
    });

    test('Sponsored campaign correctly identifies sponsor and sets isSponsored', () {
      final ad = CloudBannerAd.fromMap({
        'id': 'sponsor_ad_1',
        'title': 'Brand Promotion',
        'campaign_class': 'sponsored_ad',
        'sponsor_name': 'Acme Dating App',
        'headline': 'Meet friends nearby',
        'subtitle': 'Download our partner app',
        'action_type': 'link',
        'action_url': 'https://partner.com',
      });

      expect(ad.isSponsored, isTrue);
      expect(ad.campaignClass, equals('sponsored_ad'));
      expect(ad.sponsorName, equals('Acme Dating App'));
      expect(ad.badgeText, equals('SPONSORED'));
      expect(ad.actionType, equals('link'));
      expect(ad.actionUrl, equals('https://partner.com'));
    });

    test('Dual-read backwards compatibility preserves legacy banner_ads structure', () {
      final legacyMap = {
        'id': 'legacy_1',
        'title': 'Legacy Banner',
        'headline': 'Legacy Headline',
        'subtitle': 'Legacy Subtitle',
        'gradient_colors': ['#4F46E5', '#7C3AED'],
        'action_type': 'recharge',
        'priority': 10,
        'click_count': 5,
        'impression_count': 100,
      };

      final ad = CloudBannerAd.fromMap(legacyMap);
      expect(ad.id, equals('legacy_1'));
      expect(ad.isSponsored, isFalse);
      expect(ad.clickCount, equals(5));
      expect(ad.impressionCount, equals(100));
      expect(ad.parsedGradientColors.length, equals(2));
    });
  });
}

