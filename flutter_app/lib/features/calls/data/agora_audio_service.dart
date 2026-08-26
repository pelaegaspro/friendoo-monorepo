import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/foundation.dart';

import 'rtc_audio_service.dart';

class AgoraAudioService implements RtcAudioService {
  RtcEngine? _engine;
  bool _isMuted = false;
  bool _isSpeaker = true;

  @override
  bool get isMuted => _isMuted;

  @override
  bool get isSpeaker => _isSpeaker;

  @override
  Future<void> join({
    required String appIdOrToken,
    required String channelOrRoomId,
    required String uid,
    String? token,
    Map<String, dynamic>? extra,
  }) async {
    await dispose();
    try {
      final engine = createAgoraRtcEngine();
      _engine = engine;

      await engine.initialize(RtcEngineContext(appId: appIdOrToken));
      await engine.setChannelProfile(
        ChannelProfileType.channelProfileCommunication,
      );
      await engine.enableAudio();
      await engine.setEnableSpeakerphone(_isSpeaker);
      await engine.muteLocalAudioStream(_isMuted);

      final numericUid = int.tryParse(uid) ?? 0;
      await engine.joinChannel(
        token: token ?? appIdOrToken,
        channelId: channelOrRoomId,
        uid: numericUid,
        options: const ChannelMediaOptions(
          publishMicrophoneTrack: true,
          autoSubscribeAudio: true,
        ),
      );
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Agora audio join failed: $e');
      }
      await dispose();
      rethrow;
    }
  }

  @override
  Future<void> setMuted(bool muted) async {
    _isMuted = muted;
    try {
      await _engine?.muteLocalAudioStream(muted);
    } catch (_) {}
  }

  @override
  Future<void> setSpeakerphone(bool enabled) async {
    _isSpeaker = enabled;
    try {
      await _engine?.setEnableSpeakerphone(enabled);
    } catch (_) {}
  }

  @override
  Future<void> leave() async {
    try {
      await _engine?.leaveChannel();
    } catch (_) {}
  }

  @override
  Future<void> dispose() async {
    final engine = _engine;
    _engine = null;
    _isMuted = false;
    _isSpeaker = true;
    if (engine == null) return;
    try {
      await engine.leaveChannel();
      await engine.release();
    } catch (_) {}
  }
}
