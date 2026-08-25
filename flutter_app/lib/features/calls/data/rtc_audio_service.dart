import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

import 'agora_audio_service.dart';
import 'videosdk_audio_service.dart';

enum RtcProviderType {
  /// VideoSDK.live (~₹0.38/min Indian domestic audio pricing)
  videosdk,

  /// Agora RTC (~$0.99/1k mins fallback)
  agora,
}

/// Abstract contract for pluggable RTC Audio Providers
abstract class RtcAudioService {
  bool get isMuted;
  bool get isSpeaker;

  Future<void> join({
    required String appIdOrToken,
    required String channelOrRoomId,
    required String uid,
    String? token,
    Map<String, dynamic>? extra,
  });

  Future<void> setMuted(bool muted);

  Future<void> setSpeakerphone(bool enabled);

  Future<void> leave();

  Future<void> dispose();
}

/// Active RTC Provider Selector (Default: Agora RTC for high quality audio)
final rtcProviderTypeProvider = StateProvider<RtcProviderType>(
  (ref) => RtcProviderType.agora,
);

/// Pluggable RTC Audio Service Provider
final rtcAudioServiceProvider = Provider<RtcAudioService>((ref) {
  final providerType = ref.watch(rtcProviderTypeProvider);
  final RtcAudioService service = switch (providerType) {
    RtcProviderType.videosdk => VideoSdkAudioService(),
    RtcProviderType.agora => AgoraAudioService(),
  };

  ref.onDispose(service.dispose);
  return service;
});
