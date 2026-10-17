import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:friendoo/features/calls/data/rtc_audio_service.dart';
import 'package:friendoo/features/calls/data/webrtc_audio_service.dart';

void main() {
  group('WebRtcAudioService & Provider Tests', () {
    test('Default RTC provider is webrtc for 100% free calling', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      final defaultType = container.read(rtcProviderTypeProvider);
      expect(defaultType, equals(RtcProviderType.webrtc));

      final activeService = container.read(rtcAudioServiceProvider);
      expect(activeService, isA<WebRtcAudioService>());
    });

    test('Initial WebRTC state is disconnected, unmuted, with speaker enabled', () {
      final service = WebRtcAudioService();
      addTearDown(service.dispose);

      expect(service.connectionState, equals(RtcConnectionState.disconnected));
      expect(service.isMuted, isFalse);
      expect(service.isSpeaker, isTrue);
    });

    test('setMuted updates isMuted state', () async {
      final service = WebRtcAudioService();
      addTearDown(service.dispose);

      await service.setMuted(true);
      expect(service.isMuted, isTrue);

      await service.setMuted(false);
      expect(service.isMuted, isFalse);
    });

    test('leave resets state to disconnected', () async {
      final service = WebRtcAudioService();
      addTearDown(service.dispose);

      await service.leave();
      expect(service.connectionState, equals(RtcConnectionState.disconnected));
    });
  });
}

