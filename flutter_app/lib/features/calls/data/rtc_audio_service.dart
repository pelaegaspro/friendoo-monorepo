import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

import 'agora_audio_service.dart';
import 'videosdk_audio_service.dart';
import 'webrtc_audio_service.dart';

enum RtcProviderType {
  /// 100% Free peer-to-peer WebRTC via Google STUN & Supabase Realtime
  webrtc,

  /// VideoSDK.live is an alternative audio transport.
  videosdk,

  /// Agora RTC fallback transport.
  agora,
}

/// Normalized RTC Connection States across all audio providers
enum RtcConnectionState {
  connecting,
  connected,
  reconnecting,
  disconnected,
  failed,
}

/// Abstract contract for pluggable RTC Audio Providers with carrier handover resilience
abstract class RtcAudioService {
  bool get isMuted;
  bool get isSpeaker;
  RtcConnectionState get connectionState;
  Stream<RtcConnectionState> get connectionStateStream;
  bool get isRemoteMuted;
  Stream<bool> get remoteMuteStream;
  Stream<double> get audioLevelStream => const Stream.empty();
  Stream<int> get rttMsStream => const Stream.empty();
  void setTokenRenewalHandler(Future<String?> Function() onTokenRenewalRequested);

  Future<void> join({
    required String appIdOrToken,
    required String channelOrRoomId,
    required String uid,
    String? token,
    Map<String, dynamic>? extra,
  });

  Future<void> setMuted(bool muted);

  Future<void> setSpeakerphone(bool enabled);

  Future<void> restartIce() async {}

  Future<void> leave();

  Future<void> dispose();
}

/// Active RTC Provider Selector (Default: 100% Free Peer-to-Peer WebRTC)
final rtcProviderTypeProvider = StateProvider<RtcProviderType>(
  (ref) => RtcProviderType.webrtc,
);

final webRtcAudioServiceProvider = Provider<WebRtcAudioService>((ref) {
  final service = WebRtcAudioService();
  ref.onDispose(service.dispose);
  return service;
});

final agoraAudioServiceProvider = Provider<AgoraAudioService>((ref) {
  final service = AgoraAudioService();
  ref.onDispose(service.dispose);
  return service;
});

final videoSdkAudioServiceProvider = Provider<VideoSdkAudioService>((ref) {
  final service = VideoSdkAudioService();
  ref.onDispose(service.dispose);
  return service;
});

/// Pluggable RTC Audio Service Provider
final rtcAudioServiceProvider = Provider<RtcAudioService>((ref) {
  final providerType = ref.watch(rtcProviderTypeProvider);
  return switch (providerType) {
    RtcProviderType.webrtc => ref.watch(webRtcAudioServiceProvider),
    RtcProviderType.agora => ref.watch(agoraAudioServiceProvider),
    RtcProviderType.videosdk => ref.watch(videoSdkAudioServiceProvider),
  };
});

/// Real-time stream of current RTC transport connection state
final rtcConnectionStateProvider = StreamProvider<RtcConnectionState>((ref) {
  final service = ref.watch(rtcAudioServiceProvider);
  return service.connectionStateStream;
});

/// Real-time stream of whether remote peer is currently muted
final remoteMuteStateProvider = StreamProvider<bool>((ref) {
  final service = ref.watch(rtcAudioServiceProvider);
  return service.remoteMuteStream;
});

/// Real-time normalized audio level (0.0 to 1.0) for live waveform/speaking indicator
final rtcAudioLevelProvider = StreamProvider<double>((ref) {
  final service = ref.watch(rtcAudioServiceProvider);
  return service.audioLevelStream;
});

/// Real-time round trip latency in milliseconds (RTT ping)
final rtcLatencyProvider = StreamProvider<int>((ref) {
  final service = ref.watch(rtcAudioServiceProvider);
  return service.rttMsStream;
});
