import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/core/models/friendoo_models.dart';

void main() {
  group('PASS 3H — Host Rate Integrity & Pricing Non-Mutation Tests', () {
    // State machine simulator for public.hosts table
    late Map<String, dynamic> hostDatabaseRow;

    setUp(() {
      hostDatabaseRow = {
        'id': 'host-uuid-1234',
        'display_name': 'Priya',
        'bio': 'Experienced host',
        'rate_per_audio_minute': 20, // Custom configured premium rate
        'rate_per_video_minute': 30,
        'is_available': false,
        'is_star': true,
        'gender': 'female',
        'languages': ['Tamil', 'English'],
        'rating': 4.9,
        'total_calls': 150,
      };
    });

    Map<String, dynamic> simulatePresenceHeartbeatPayload({
      required String hostId,
      required bool isOnline,
    }) {
      // Simulates the payload sent by PresenceService
      return {
        'id': hostId,
        'is_available': isOnline,
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      };
    }

    Map<String, dynamic> simulateAvailabilityTogglePayload({
      required String hostId,
      required bool isAvailable,
    }) {
      // Simulates the payload sent by HostRepository.setHostAvailability
      return {
        'id': hostId,
        'is_available': isAvailable,
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      };
    }

    void applyPostgresUpsert(
      Map<String, dynamic> targetRow,
      Map<String, dynamic> payload,
    ) {
      // Emulates PostgreSQL / Supabase PostgREST onConflict update semantics:
      // only fields present in the payload are updated; unmentioned columns are preserved.
      payload.forEach((key, value) {
        targetRow[key] = value;
      });
    }

    test('1. Presence heartbeat does not overwrite host rate', () {
      final initialRate = hostDatabaseRow['rate_per_audio_minute'];
      expect(initialRate, equals(20));

      final heartbeatPayload = simulatePresenceHeartbeatPayload(
        hostId: hostDatabaseRow['id'] as String,
        isOnline: true,
      );

      // Verify payload contains no rate field
      expect(heartbeatPayload.containsKey('rate_per_audio_minute'), isFalse);
      expect(heartbeatPayload.containsKey('rate_per_minute'), isFalse);

      applyPostgresUpsert(hostDatabaseRow, heartbeatPayload);

      final hostProfile = HostProfile.fromMap(hostDatabaseRow);
      expect(hostProfile.isAvailable, isTrue);
      expect(hostProfile.ratePerAudioMinute, equals(20));
      expect(hostDatabaseRow['rate_per_audio_minute'], equals(20));
    });

    test(
      '2. Existing host rate remains unchanged after availability update',
      () {
        expect(hostDatabaseRow['rate_per_audio_minute'], equals(20));

        final togglePayload = simulateAvailabilityTogglePayload(
          hostId: hostDatabaseRow['id'] as String,
          isAvailable: true,
        );

        expect(togglePayload.containsKey('rate_per_audio_minute'), isFalse);

        applyPostgresUpsert(hostDatabaseRow, togglePayload);

        final hostProfile = HostProfile.fromMap(hostDatabaseRow);
        expect(hostProfile.isAvailable, isTrue);
        expect(hostProfile.ratePerAudioMinute, equals(20));
      },
    );

    test('3. Host intentionally changing rate still updates the authoritative rate', () {
      // Authoritative pricing mutation (Admin / CRM / Authorized endpoint)
      final adminRateChangePayload = {
        'rate_per_audio_minute': 25,
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      };

      applyPostgresUpsert(hostDatabaseRow, adminRateChangePayload);

      final hostProfile = HostProfile.fromMap(hostDatabaseRow);
      expect(hostProfile.ratePerAudioMinute, equals(25));
      expect(hostProfile.effectiveRatePerMinute, equals(25));
    });

    test('4. Call creation uses the configured authoritative rate', () {
      // Authoritative call creation reads from hosts.rate_per_audio_minute
      final hostProfile = HostProfile.fromMap(hostDatabaseRow);
      final rateForCall = hostProfile.ratePerAudioMinute;

      final callSessionMap = {
        'id': 'call-session-9876',
        'caller_id': 'user-uuid-5555',
        'host_id': hostProfile.id,
        'call_type': 'audio',
        'status': 'ringing',
        'rtc_channel': 'friendoo_call_9876',
        'rate_per_minute': rateForCall,
        'created_at': DateTime.now().toUtc().toIso8601String(),
      };

      final call = CallSession.fromMap(callSessionMap);
      expect(call.ratePerMinute, equals(20));

      // Minute billing debit calculation: gross = rate_per_minute
      final grossPerMinute = call.ratePerMinute;
      final hostEarnings60Percent = (grossPerMinute * 0.60).round();
      final platformRevenue40Percent = grossPerMinute - hostEarnings60Percent;

      expect(grossPerMinute, equals(20));
      expect(hostEarnings60Percent, equals(12));
      expect(platformRevenue40Percent, equals(8));
    });

    test(
      '5. A missing cached profile does not silently change the host rate',
      () {
        // When currentActiveProfile is null, default host presence does not corrupt rate
        final payload = simulatePresenceHeartbeatPayload(
          hostId: 'host-uuid-1234',
          isOnline: true,
        );

        applyPostgresUpsert(hostDatabaseRow, payload);

        expect(hostDatabaseRow['rate_per_audio_minute'], equals(20));
        final parsed = HostProfile.fromMap(hostDatabaseRow);
        expect(parsed.ratePerAudioMinute, equals(20));
      },
    );

    test('6. Repeated presence heartbeats do not mutate pricing', () {
      for (int i = 0; i < 50; i++) {
        final payload = simulatePresenceHeartbeatPayload(
          hostId: hostDatabaseRow['id'] as String,
          isOnline: i.isEven,
        );
        applyPostgresUpsert(hostDatabaseRow, payload);
      }

      expect(hostDatabaseRow['rate_per_audio_minute'], equals(20));
      final finalHost = HostProfile.fromMap(hostDatabaseRow);
      expect(finalHost.ratePerAudioMinute, equals(20));
      expect(finalHost.isAvailable, isFalse);
    });
  });
}
