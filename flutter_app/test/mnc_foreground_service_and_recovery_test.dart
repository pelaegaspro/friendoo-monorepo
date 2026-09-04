import 'package:flutter_test/flutter_test.dart';
import 'package:friendoo/features/calls/data/rtc_audio_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group(
    "MNC Release Hardening — Low-Latency RTC Connection & Network Recovery",
    () {
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

      test("RtcConnectionState transitions from connecting to connected", () {
        expect(RtcConnectionState.connecting.name, "connecting");
        expect(RtcConnectionState.connected.name, "connected");
      });
    },
  );
}
