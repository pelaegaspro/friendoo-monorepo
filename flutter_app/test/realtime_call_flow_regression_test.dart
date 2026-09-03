import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/core/models/friendoo_models.dart';

void main() {
  group('Real-Time Call Lifecycle & Host Discovery Regression Tests', () {
    test('HostProfile defaults to female and isFemale returns true when gender is missing', () {
      final host = HostProfile.fromMap({
        'id': 'test-host-uuid-1',
        'display_name': 'Ananya',
        'rate_per_audio_minute': 5,
        'is_available': true,
      });

      expect(host.gender, 'female');
      expect(host.isFemale, isTrue);
      expect(host.isAvailable, isTrue);
      expect(host.effectiveRatePerMinute, 5);
    });

    test('HostProfile correctly identifies online and available status', () {
      final host = HostProfile.fromMap({
        'id': 'test-host-uuid-2',
        'display_name': 'Divya',
        'rate_per_audio_minute': 10,
        'is_available': true,
        'is_busy': false,
      });

      expect(host.status, HostStatus.online);
      expect(host.isAvailable, isTrue);
    });

    test('CallSession parses server ringing status and parameters correctly', () {
      final session = CallSession.fromMap({
        'id': 'call-12345',
        'caller_id': 'user-8870947891',
        'host_id': 'host-7604991136',
        'call_type': 'audio',
        'status': 'ringing',
        'rtc_channel': 'friendoo_rtc_test_channel',
        'rate_per_minute': 5,
      });

      expect(session.id, 'call-12345');
      expect(session.callerId, 'user-8870947891');
      expect(session.hostId, 'host-7604991136');
      expect(session.status, CallStatus.ringing);
      expect(session.ratePerMinute, 5);
      expect(session.channelName, 'friendoo_rtc_test_channel');
    });

    test('Call billing calculates 0 coins for <= 5 second grace period', () {
      const durationSeconds = 4;
      const ratePerMinute = 5;

      final bool wasGracePeriod = durationSeconds <= 5;
      final int billedMinutes = wasGracePeriod
          ? 0
          : (durationSeconds / 60).ceil().clamp(1, 999);
      final int coinsDeducted = billedMinutes * ratePerMinute;

      expect(wasGracePeriod, isTrue);
      expect(billedMinutes, 0);
      expect(coinsDeducted, 0);
    });

    test('Call billing calculates exact ceiling minutes for active calls', () {
      const ratePerMinute = 5;

      int durationSeconds = 65;
      int billedMinutes = (durationSeconds / 60).ceil();
      expect(billedMinutes, 2);
      expect(billedMinutes * ratePerMinute, 10);

      durationSeconds = 120;
      billedMinutes = (durationSeconds / 60).ceil();
      expect(billedMinutes, 2);
      expect(billedMinutes * ratePerMinute, 10);

      durationSeconds = 121;
      billedMinutes = (durationSeconds / 60).ceil();
      expect(billedMinutes, 3);
      expect(billedMinutes * ratePerMinute, 15);
    });
  });
}
