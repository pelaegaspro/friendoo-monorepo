import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/foundation.dart';

class AgoraAudioService {
  RtcEngine? _engine;
  bool _isMuted = false;
  bool _isSpeaker = true;

  bool get isMuted => _isMuted;
  bool get isSpeaker => _isSpeaker;

  Future<void> join({
    required String appId,
    required String token,
    required String channel,
    required int uid,
  }) async {
    await dispose();
    try {
      final engine = createAgoraRtcEngine();
      _engine = engine;

      await engine.initialize(RtcEngineContext(appId: appId));
      await engine.setChannelProfile(
        ChannelProfileType.channelProfileCommunication,
      );
      await engine.enableAudio();
      await engine.setEnableSpeakerphone(_isSpeaker);
      await engine.muteLocalAudioStream(_isMuted);

      await engine.joinChannel(
        token: token,
        channelId: channel,
        uid: uid,
        options: const ChannelMediaOptions(
          publishMicrophoneTrack: true,
          autoSubscribeAudio: true,
        ),
      );
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Agora audio join warning (fallback): $e');
      }
    }
  }

  Future<void> setMuted(bool muted) async {
    _isMuted = muted;
    try {
      await _engine?.muteLocalAudioStream(muted);
    } catch (_) {}
  }

  Future<void> setSpeakerphone(bool enabled) async {
    _isSpeaker = enabled;
    try {
      await _engine?.setEnableSpeakerphone(enabled);
    } catch (_) {}
  }

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
