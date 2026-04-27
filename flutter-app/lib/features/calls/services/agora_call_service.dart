import 'dart:async';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_constants.dart';

enum CallStatus { idle, connecting, connected, userJoined, userLeft, ended }

class AgoraService {
  RtcEngine? _engine;
  final _statusController = StreamController<CallStatus>.broadcast();

  Stream<CallStatus> get callStatusStream => _statusController.stream;
  RtcEngine get engine => _engine!;

  Future<void> initialize() async {
    if (_engine != null) return;
    try {
      _engine = createAgoraRtcEngine();
      await _engine!.initialize(
        RtcEngineContext(
          appId: AppConstants.agoraAppId,
          channelProfile: ChannelProfileType.channelProfileCommunication,
        ),
      );
      _engine!.registerEventHandler(
        RtcEngineEventHandler(
          onJoinChannelSuccess: (connection, elapsed) {
            debugPrint('Agora: joined ${connection.channelId}');
            _statusController.add(CallStatus.connected);
          },
          onUserJoined: (connection, remoteUid, elapsed) {
            debugPrint('Agora: remote user $remoteUid joined');
            _statusController.add(CallStatus.userJoined);
          },
          onUserOffline: (connection, remoteUid, reason) {
            debugPrint('Agora: remote user $remoteUid left');
            _statusController.add(CallStatus.userLeft);
          },
          onLeaveChannel: (connection, stats) {
            debugPrint('Agora: left channel');
            _statusController.add(CallStatus.ended);
          },
        ),
      );
    } catch (e) {
      debugPrint('Agora init error: $e');
    }
  }

  Future<void> joinCall({
    required String channelName,
    required String token,
    required int uid,
    bool isVideoCall = false,
  }) async {
    await initialize();
    _statusController.add(CallStatus.connecting);
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
  }

  Future<void> leaveCall() async {
    await _engine?.leaveChannel();
    await _engine?.stopPreview();
    await _engine?.disableVideo();
  }

  Future<void> toggleMute(bool muted) async {
    await _engine?.muteLocalAudioStream(muted);
  }

  Future<void> enableSpeakerphone(bool enabled) async {
    await _engine?.setEnableSpeakerphone(enabled);
  }

  Future<void> toggleVideo(bool videoEnabled) async {
    if (videoEnabled) {
      await _engine?.enableVideo();
    } else {
      await _engine?.disableVideo();
    }
  }

  Future<void> switchCamera() async {
    await _engine?.switchCamera();
  }

  void dispose() {
    _statusController.close();
    _engine?.release();
    _engine = null;
  }
}

final agoraServiceProvider = Provider<AgoraService>((ref) {
  final service = AgoraService();
  ref.onDispose(service.dispose);
  return service;
});
