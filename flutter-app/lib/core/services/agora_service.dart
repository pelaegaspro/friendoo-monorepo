import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

/// Singleton Agora service that fetches tokens from Firebase Cloud Functions
/// and manages the RTC engine lifecycle.
class AgoraService {
  static final AgoraService _instance = AgoraService._internal();
  factory AgoraService() => _instance;
  AgoraService._internal();

  RtcEngine? _engine;
  bool _isInitialized = false;

  // Callbacks set before each call
  VoidCallback? onJoinSuccess;
  void Function(int remoteUid)? onHostJoined;
  void Function(int remoteUid)? onHostLeft;
  void Function(String error)? onError;

  // ─── Token from Cloud Function ────────────────────────────────────────────

  /// Calls the `getAgoraToken` Cloud Function.
  /// The function expects `{ callId: <firestoreDocId> }` and returns
  /// `{ token, appId, channel }`.
  Future<Map<String, String>> fetchToken(String callDocId) async {
    try {
      final callable = FirebaseFunctions.instanceFor(region: 'asia-south1')
          .httpsCallable('getAgoraToken');
      final result = await callable.call({'callId': callDocId});
      final data = result.data as Map<dynamic, dynamic>;
      return {
        'token': data['token'] as String,
        'appId': data['appId'] as String,
        'channel': data['channel'] as String,
      };
    } catch (e) {
      debugPrint('AgoraService.fetchToken error: $e');
      rethrow;
    }
  }

  // ─── Permissions ──────────────────────────────────────────────────────────

  Future<bool> requestMicPermission() async {
    final status = await Permission.microphone.request();
    return status.isGranted;
  }

  // ─── Engine lifecycle ─────────────────────────────────────────────────────

  Future<void> _initialize(String appId) async {
    if (_isInitialized) return;
    _engine = createAgoraRtcEngine();
    await _engine!.initialize(
      RtcEngineContext(
        appId: appId,
        channelProfile: ChannelProfileType.channelProfileCommunication,
      ),
    );
    _isInitialized = true;
    debugPrint('AgoraService: engine initialized');
  }

  void _registerHandlers() {
    _engine!.registerEventHandler(
      RtcEngineEventHandler(
        onJoinChannelSuccess: (connection, elapsed) {
          debugPrint('✅ Agora: joined ${connection.channelId}');
          onJoinSuccess?.call();
        },
        onUserJoined: (connection, remoteUid, elapsed) {
          debugPrint('🎙️ Agora: host joined uid=$remoteUid');
          onHostJoined?.call(remoteUid);
        },
        onUserOffline: (connection, remoteUid, reason) {
          debugPrint('📵 Agora: host left uid=$remoteUid reason=$reason');
          onHostLeft?.call(remoteUid);
        },
        onError: (err, msg) {
          debugPrint('❌ Agora error: $err — $msg');
          onError?.call(msg);
        },
        onLeaveChannel: (connection, stats) {
          debugPrint('Agora: left channel');
        },
      ),
    );
  }

  // ─── Public call API ──────────────────────────────────────────────────────

  /// Starts a voice call.
  /// [callDocId] is the Firestore call document ID (used to fetch the token).
  /// [channelName] is the Agora channel to join (same as callDocId in this app).
  Future<void> startCall({
    required String callDocId,
    required String channelName,
    required VoidCallback onJoined,
    required void Function(int uid) onHostJoinedCallback,
    required void Function(int uid) onHostLeftCallback,
    required void Function(String error) onErrorCallback,
  }) async {
    onJoinSuccess = onJoined;
    onHostJoined = onHostJoinedCallback;
    onHostLeft = onHostLeftCallback;
    onError = onErrorCallback;

    try {
      // 1. Microphone permission
      final granted = await requestMicPermission();
      if (!granted) {
        onError?.call('Microphone permission denied');
        return;
      }

      // 2. Token from Cloud Function (pass Firestore doc ID)
      final tokenData = await fetchToken(callDocId);
      final token = tokenData['token']!;
      final appId = tokenData['appId']!;

      // 3. Init engine
      await _initialize(appId);

      // 4. Register event handlers
      _registerHandlers();

      // 5. Audio-only — disable video
      await _engine!.disableVideo();

      // 6. Join channel
      await _engine!.joinChannel(
        token: token,
        channelId: channelName,
        uid: 0,
        options: const ChannelMediaOptions(
          clientRoleType: ClientRoleType.clientRoleBroadcaster,
          channelProfile: ChannelProfileType.channelProfileCommunication,
          publishMicrophoneTrack: true,
          autoSubscribeAudio: true,
          publishCameraTrack: false,
          autoSubscribeVideo: false,
        ),
      );
    } catch (e) {
      debugPrint('AgoraService.startCall error: $e');
      onError?.call('Failed to start call: $e');
    }
  }

  Future<void> muteLocalAudio(bool mute) async {
    await _engine?.muteLocalAudioStream(mute);
  }

  Future<void> setSpeakerphone(bool enable) async {
    await _engine?.setEnableSpeakerphone(enable);
  }

  Future<void> endCall() async {
    try {
      await _engine?.leaveChannel();
      await _engine?.release();
      _engine = null;
      _isInitialized = false;
      onJoinSuccess = null;
      onHostJoined = null;
      onHostLeft = null;
      onError = null;
      debugPrint('AgoraService: call ended, engine released');
    } catch (e) {
      debugPrint('AgoraService.endCall error: $e');
    }
  }
}
