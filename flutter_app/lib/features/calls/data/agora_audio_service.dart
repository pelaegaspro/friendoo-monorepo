import 'dart:async';

import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../core/services/web_audio_permission.dart';
import 'rtc_audio_service.dart';

class AgoraAudioService implements RtcAudioService {
  RtcEngine? _engine;
  bool _isMuted = false;
  bool _isSpeaker = true;

  final StreamController<RtcConnectionState> _connectionStateController =
      StreamController<RtcConnectionState>.broadcast();
  RtcConnectionState _connectionState = RtcConnectionState.disconnected;
  Future<String?> Function()? _tokenRenewalHandler;

  @override
  bool get isMuted => _isMuted;

  @override
  bool get isSpeaker => _isSpeaker;

  bool _isRemoteMuted = false;
  final StreamController<bool> _remoteMuteController =
      StreamController<bool>.broadcast();

  @override
  RtcConnectionState get connectionState => _connectionState;

  @override
  Stream<RtcConnectionState> get connectionStateStream =>
      _connectionStateController.stream;

  @override
  bool get isRemoteMuted => _isRemoteMuted;

  @override
  Stream<bool> get remoteMuteStream => _remoteMuteController.stream;

  @override
  Stream<double> get audioLevelStream => const Stream.empty();

  @override
  Stream<int> get rttMsStream => const Stream.empty();

  @override
  Future<void> restartIce() async {}

  @override
  void setTokenRenewalHandler(
    Future<String?> Function() onTokenRenewalRequested,
  ) {
    _tokenRenewalHandler = onTokenRenewalRequested;
  }

  Future<void> _renewToken() async {
    final handler = _tokenRenewalHandler;
    if (handler == null) return;
    try {
      final newToken = await handler();
      if (newToken != null && newToken.isNotEmpty) {
        await _engine?.renewToken(newToken);
        if (kDebugMode) {
          debugPrint('Agora: Token successfully renewed mid-call.');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Agora token renewal error: $e');
      }
    }
  }

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
      if (!kIsWeb) {
        final status = await Permission.microphone.status;
        if (!status.isGranted) {
          await Permission.microphone.request();
        }
      } else {
        await requestWebMicrophone();
      }

      final engine = createAgoraRtcEngine();
      _engine = engine;

      engine.registerEventHandler(
        RtcEngineEventHandler(
          onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
            _connectionState = RtcConnectionState.connected;
            _connectionStateController.add(RtcConnectionState.connected);
            if (kDebugMode) {
              debugPrint(
                'Agora onJoinChannelSuccess: channel=${connection.channelId}, uid=${connection.localUid}',
              );
            }
          },
          onConnectionStateChanged:
              (
                RtcConnection connection,
                ConnectionStateType state,
                ConnectionChangedReasonType reason,
              ) {
                if (kDebugMode) {
                  debugPrint(
                    'Agora onConnectionStateChanged: state=$state, reason=$reason',
                  );
                }

                final mapped = switch (state) {
                  ConnectionStateType.connectionStateConnecting =>
                    RtcConnectionState.connecting,
                  ConnectionStateType.connectionStateConnected =>
                    RtcConnectionState.connected,
                  ConnectionStateType.connectionStateReconnecting =>
                    RtcConnectionState.reconnecting,
                  ConnectionStateType.connectionStateFailed =>
                    RtcConnectionState.failed,
                  ConnectionStateType.connectionStateDisconnected =>
                    RtcConnectionState.disconnected,
                };
                _connectionState = mapped;
                _connectionStateController.add(mapped);

                if (reason ==
                    ConnectionChangedReasonType
                        .connectionChangedClientIpAddressChanged) {
                  if (kDebugMode) {
                    debugPrint(
                      'Agora: Network carrier handover detected (Wi-Fi ↔ Cellular). Auto-reconnecting...',
                    );
                  }
                  unawaited(_engine?.enableAudio());
                  unawaited(_engine?.muteLocalAudioStream(_isMuted));
                } else if (reason ==
                    ConnectionChangedReasonType.connectionChangedTokenExpired) {
                  _renewToken();
                }
              },
          onConnectionLost: (RtcConnection connection) {
            if (kDebugMode) {
              debugPrint(
                'Agora onConnectionLost: Transport interrupted. Reconnecting...',
              );
            }
            _connectionState = RtcConnectionState.reconnecting;
            _connectionStateController.add(RtcConnectionState.reconnecting);
          },
          onTokenPrivilegeWillExpire: (RtcConnection connection, String token) {
            if (kDebugMode) {
              debugPrint(
                'Agora onTokenPrivilegeWillExpire: Proactively renewing token.',
              );
            }
            _renewToken();
          },
          onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
            if (kDebugMode) {
              debugPrint(
                'Agora onUserJoined: remoteUid=$remoteUid in channel=${connection.channelId}',
              );
            }
            // Proactively assert microphone publishing when remote party joins
            unawaited(ensurePublishing());
          },
          onUserMuteAudio:
              (RtcConnection connection, int remoteUid, bool muted) {
                if (kDebugMode) {
                  debugPrint(
                    'Agora onUserMuteAudio: remoteUid=$remoteUid, muted=$muted',
                  );
                }
                _isRemoteMuted = muted;
                _remoteMuteController.add(muted);
              },
          onRemoteAudioStateChanged:
              (
                RtcConnection connection,
                int remoteUid,
                RemoteAudioState state,
                RemoteAudioStateReason reason,
                int elapsed,
              ) {
                if (kDebugMode) {
                  debugPrint(
                    'Agora onRemoteAudioStateChanged: remoteUid=$remoteUid, state=$state, reason=$reason',
                  );
                }
              },
          onAudioPublishStateChanged:
              (
                String channel,
                StreamPublishState oldState,
                StreamPublishState newState,
                int elapseSinceLastState,
              ) {
                if (kDebugMode) {
                  debugPrint(
                    'Agora onAudioPublishStateChanged: $oldState -> $newState',
                  );
                }
              },
          onAudioSubscribeStateChanged:
              (
                String channel,
                int uid,
                StreamSubscribeState oldState,
                StreamSubscribeState newState,
                int elapseSinceLastState,
              ) {
                if (kDebugMode) {
                  debugPrint(
                    'Agora onAudioSubscribeStateChanged: uid=$uid, $oldState -> $newState',
                  );
                }
              },
          onError: (ErrorCodeType err, String msg) {
            if (kDebugMode) {
              debugPrint('Agora onError: $err - $msg');
            }
          },
        ),
      );

      _connectionState = RtcConnectionState.connecting;
      _connectionStateController.add(RtcConnectionState.connecting);

      await engine.initialize(
        RtcEngineContext(
          appId: appIdOrToken,
          channelProfile: ChannelProfileType.channelProfileCommunication,
          audioScenario: AudioScenarioType.audioScenarioGameStreaming,
        ),
      );

      await engine.enableAudio();
      await engine.setClientRole(role: ClientRoleType.clientRoleBroadcaster);

      try {
        await engine.enableLocalAudio(true);
      } catch (_) {}

      try {
        await engine.adjustRecordingSignalVolume(100);
        await engine.adjustPlaybackSignalVolume(100);
      } catch (_) {}

      if (!kIsWeb) {
        try {
          await engine.setAudioProfile(
            profile: AudioProfileType.audioProfileDefault,
            scenario: AudioScenarioType.audioScenarioGameStreaming,
          );
          await engine.setEnableSpeakerphone(_isSpeaker);
        } catch (_) {}
      }

      try {
        await engine.muteLocalAudioStream(_isMuted);
      } catch (_) {}

      final numericUid = int.tryParse(uid) ?? 0;
      await engine.joinChannel(
        token: token ?? appIdOrToken,
        channelId: channelOrRoomId,
        uid: numericUid,
        options: const ChannelMediaOptions(
          clientRoleType: ClientRoleType.clientRoleBroadcaster,
          channelProfile: ChannelProfileType.channelProfileCommunication,
          publishMicrophoneTrack: true,
          autoSubscribeAudio: true,
          enableAudioRecordingOrPlayout: true,
        ),
      );
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Agora audio join failed: $e');
      }
      _connectionState = RtcConnectionState.failed;
      _connectionStateController.add(RtcConnectionState.failed);
      await dispose();
      rethrow;
    }
  }

  /// Explicitly re-asserts local microphone capture, volume, and media publication options.
  Future<void> ensurePublishing() async {
    final engine = _engine;
    if (engine == null) return;
    try {
      await engine.enableAudio();
      await engine.enableLocalAudio(!_isMuted);
      await engine.muteLocalAudioStream(_isMuted);
      await engine.adjustRecordingSignalVolume(100);
      await engine.adjustPlaybackSignalVolume(100);
      await engine.updateChannelMediaOptions(
        const ChannelMediaOptions(
          clientRoleType: ClientRoleType.clientRoleBroadcaster,
          channelProfile: ChannelProfileType.channelProfileCommunication,
          publishMicrophoneTrack: true,
          autoSubscribeAudio: true,
          enableAudioRecordingOrPlayout: true,
        ),
      );
      if (kDebugMode) {
        debugPrint(
          'Agora: Local audio publishing re-asserted and confirmed active.',
        );
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Agora ensurePublishing notice: $e');
      }
    }
  }

  @override
  Future<void> setMuted(bool muted) async {
    _isMuted = muted;
    try {
      await _engine?.muteLocalAudioStream(muted);
      await _engine?.enableLocalAudio(!muted);
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
    _connectionState = RtcConnectionState.disconnected;
    _connectionStateController.add(RtcConnectionState.disconnected);
  }

  @override
  Future<void> dispose() async {
    final engine = _engine;
    _engine = null;
    _isMuted = false;
    _isSpeaker = true;
    _connectionState = RtcConnectionState.disconnected;
    _connectionStateController.add(RtcConnectionState.disconnected);
    if (engine == null) return;
    try {
      await engine.leaveChannel();
      await engine.release();
    } catch (_) {}
  }
}
