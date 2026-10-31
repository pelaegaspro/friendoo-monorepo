import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/core/models/friendoo_models.dart';
import 'package:friendoo/features/discover/data/host_repository.dart';
import 'package:friendoo/features/support/data/admin_support_notification_service.dart';

void main() {
  group('Fixed Rates & Host Payout Economics', () {
    test('Standard host caller rate is 5 and star host caller rate is 7', () {
      expect(HostProfile.standardHostRate, equals(5));
      expect(HostProfile.starHostRate, equals(7));
    });

    test('Standard host payout is 2.50 INR/min and star host payout is 4.00 INR/min', () {
      expect(HostProfile.standardHostPayout, equals(2.50));
      expect(HostProfile.starHostPayout, equals(4.00));

      const standardHost = HostProfile(
        id: 'h1',
        displayName: 'Standard Host',
        bio: 'Bio',
        ratePerAudioMinute: 5,
        isAvailable: true,
        isStar: false,
      );

      const starHost = HostProfile(
        id: 'h2',
        displayName: 'Star Host',
        bio: 'Bio',
        ratePerAudioMinute: 7,
        isAvailable: true,
        isStar: true,
      );

      expect(standardHost.hostPayoutPerMinute, equals(2.50));
      expect(standardHost.effectiveRatePerMinute, equals(5));

      expect(starHost.hostPayoutPerMinute, equals(4.00));
      expect(starHost.effectiveRatePerMinute, equals(7));
    });

    test('applyStarHostQuota guarantees every regional language has at least 1 star host', () {
      const mockHosts = [
        HostProfile(
          id: '1',
          displayName: 'Priya (Tamil)',
          bio: 'Bio',
          ratePerAudioMinute: 5,
          isAvailable: true,
          isStar: false,
          languages: ['Tamil'],
          rating: 4.95,
          totalCalls: 300,
        ),
        HostProfile(
          id: '2',
          displayName: 'Ananya (Malayalam)',
          bio: 'Bio',
          ratePerAudioMinute: 5,
          isAvailable: true,
          isStar: false,
          languages: ['Malayalam'],
          rating: 4.90,
          totalCalls: 280,
        ),
        HostProfile(
          id: '3',
          displayName: 'Kavya (Telugu)',
          bio: 'Bio',
          ratePerAudioMinute: 5,
          isAvailable: true,
          isStar: false,
          languages: ['Telugu'],
          rating: 4.85,
          totalCalls: 100,
        ),
        HostProfile(
          id: '4',
          displayName: 'Sneha (Kannada)',
          bio: 'Bio',
          ratePerAudioMinute: 5,
          isAvailable: true,
          isStar: false,
          languages: ['Kannada'],
          rating: 4.80,
          totalCalls: 90,
        ),
        HostProfile(
          id: '5',
          displayName: 'Tanvi (Marathi)',
          bio: 'Bio',
          ratePerAudioMinute: 5,
          isAvailable: true,
          isStar: false,
          languages: ['Marathi'],
          rating: 4.75,
          totalCalls: 80,
        ),
      ];

      final processed = HostRepository.applyStarHostQuota(mockHosts);

      // Verify every language represented has at least one host with isStar == true
      final languages = ['Tamil', 'Malayalam', 'Telugu', 'Kannada', 'Marathi'];
      for (final lang in languages) {
        final hasStarForLang = processed.any(
          (h) => h.isStar && h.languages.contains(lang),
        );
        expect(hasStarForLang, isTrue, reason: 'Language $lang must have at least 1 star host');
      }

      // Verify ratePerAudioMinute is 7 for star hosts and 5 for standard hosts
      for (final host in processed) {
        if (host.isStar) {
          expect(host.ratePerAudioMinute, equals(7));
          expect(host.hostPayoutPerMinute, equals(4.00));
        } else {
          expect(host.ratePerAudioMinute, equals(5));
          expect(host.hostPayoutPerMinute, equals(2.50));
        }
      }
    });

    test('AdminSupportNotice state copy and resolution', () {
      const notice = AdminSupportNotice(
        hasActiveNotice: true,
        message: 'Please review your bank details for withdrawal clearance.',
        sender: 'Friendoo Support Specialist 🛡️',
      );

      expect(notice.hasActiveNotice, isTrue);
      expect(notice.message, contains('bank details'));

      final resolved = AdminSupportNotice.empty;
      expect(resolved.hasActiveNotice, isFalse);
      expect(resolved.message, isNull);
    });
  });
}
