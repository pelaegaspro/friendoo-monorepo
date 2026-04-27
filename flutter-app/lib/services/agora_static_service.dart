import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/foundation.dart';
import '../core/constants/app_constants.dart';

class AgoraService {
  static RtcEngine? _engine;

  static Future<void> initialize() async {
    if (_engine != null) return;

    try {
      _engine = createAgoraRtcEngine();
      await _engine!.initialize(
        RtcEngineContext(
          appId: AppConstants.agoraAppId,
          channelProfile: ChannelProfileType.channelProfileCommunication,
        ),
      );

      // Register event handlers if needed
      _engine!.registerEventHandler(
        RtcEngineEventHandler(
          onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
            debugPrint("Agora: Joined channel ${connection.channelId}");
          },
          onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
            debugPrint("Agora: Remote user $remoteUid joined");
          },
          onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {
            debugPrint("Agora: Remote user $remoteUid left");
          },
          onLeaveChannel: (RtcConnection connection, RtcStats stats) {
            debugPrint("Agora: Left channel");
          },
        ),
      );
    } catch (e) {
      debugPrint("Agora initialization error: $e");
    }
  }

  static Future<bool> joinCall({
    required String channelName,
    required String token,
    required int uid,
    bool isVideoCall = false,
  }) async {
    try {
      await initialize();
      
      if (isVideoCall) {
        await _engine!.enableVideo();
        await _engine!.startPreview();
      } else {
        await _engine!.disableVideo();
      }

      await _engine!.joinChannel(
        token: token,
        channelId: channelName,
        uid: uid,
        options: const ChannelMediaOptions(
          clientRoleType: ClientRoleType.clientRoleBroadcaster,
          publishMicrophoneTrack: true,
          publishCameraTrack: true,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        ),
      );
      return true;
    } catch (e) {
      debugPrint("Agora join error: $e");
      return false;
    }
  }

  static Future<void> leaveCall() async {
    try {
      await _engine?.leaveChannel();
      await _engine?.stopPreview();
      await _engine?.disableVideo();
    } catch (e) {
      debugPrint("Agora leave error: $e");
    }
  }

  static Future<void> toggleMute(bool muted) async {
    await _engine?.muteLocalAudioStream(muted);
  }

  static Future<void> enableSpeakerphone(bool enabled) async {
    await _engine?.setEnableSpeakerphone(enabled);
  }

  static Future<void> toggleVideo(bool videoOff) async {
    if (videoOff) {
      await _engine?.disableVideo();
    } else {
      await _engine?.enableVideo();
    }
  }

  static Future<void> switchCamera() async {
    await _engine?.switchCamera();
  }

  static RtcEngine? get engine => _engine;
}
