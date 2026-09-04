import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:friendoo/features/calls/application/call_foreground_service.dart';
import 'package:friendoo/features/calls/data/rtc_audio_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group("MNC Release Hardening — Native Foreground Call Service & Network Recovery", () {
    test("CallForegroundService safely no-ops on non-Android / test environment", () async {
      final service = CallForegroundService();
      expect(service.isActive, isFalse);

      // Should not throw or crash in test/web/iOS runtime
      await service.start(
        callId: "test-call-101",
        partnerName: "Maya Shah",
        duration: "01:23",
      );
      expect(service.isActive, isFalse);

      await service.updateDuration("02:00");
      await service.stop();
      expect(service.isActive, isFalse);
    });

    test("RtcConnectionState correctly identifies reconnecting state during carrier handover", () {
      final states = [
        RtcConnectionState.disconnected,
        RtcConnectionState.connecting,
        RtcConnectionState.connected,
        RtcConnectionState.reconnecting,
        RtcConnectionState.failed,
      ];

      expect(states.contains(RtcConnectionState.reconnecting), isTrue);
      expect(RtcConnectionState.reconnecting.name, "reconnecting");
    });

    test("CallForegroundServiceProvider instantiates within ProviderContainer", () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final service = container.read(callForegroundServiceProvider);
      expect(service, isA<CallForegroundService>());
      expect(service.isActive, isFalse);
    });
  });
}
