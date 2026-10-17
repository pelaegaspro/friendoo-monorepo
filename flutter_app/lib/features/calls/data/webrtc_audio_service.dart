import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'rtc_audio_service.dart';

/// 100% Free Peer-to-Peer WebRTC Audio Implementation
/// Uses Google's free public STUN servers and Supabase Realtime for SDP/ICE signaling.
/// Zero per-minute costs, zero third-party commercial SDK dependencies.
class WebRtcAudioService implements RtcAudioService {
  WebRtcAudioService({SupabaseClient? supabaseClient})
    : _supabaseClient = supabaseClient;

  final SupabaseClient? _supabaseClient;
  SupabaseClient get _supabase => _supabaseClient ?? Supabase.instance.client;

  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  RealtimeChannel? _signalingChannel;
  RTCVideoRenderer? _remoteAudioRenderer;

  bool _isMuted = false;
  bool _isSpeaker = true;
  bool _isRemoteMuted = false;
  RtcConnectionState _connectionState = RtcConnectionState.disconnected;
  String? _currentRoomId;
  String? _currentUid;
  bool _isCaller = false;

  Timer? _offerRetryTimer;
  Timer? _peerDiscoveryTimer;

  final List<RTCIceCandidate> _queuedRemoteCandidates = [];
  final List<RTCIceCandidate> _localCandidates = [];
  bool _remoteDescriptionSet = false;

  final StreamController<RtcConnectionState> _connectionStateController =
      StreamController<RtcConnectionState>.broadcast();
  final StreamController<bool> _remoteMuteController =
      StreamController<bool>.broadcast();

  @override
  bool get isMuted => _isMuted;

  @override
  bool get isSpeaker => _isSpeaker;

  @override
  bool get isRemoteMuted => _isRemoteMuted;

  @override
  Stream<bool> get remoteMuteStream => _remoteMuteController.stream;

  @override
  RtcConnectionState get connectionState => _connectionState;

  @override
  Stream<RtcConnectionState> get connectionStateStream =>
      _connectionStateController.stream;

  @override
  void setTokenRenewalHandler(
    Future<String?> Function() onTokenRenewalRequested,
  ) {
    // Pure WebRTC does not require expiring tokens.
  }

  static const Map<String, dynamic> _iceConfiguration = {
    'iceServers': [
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'stun:stun1.l.google.com:19302'},
      {'urls': 'stun:openrelay.metered.ca:80'},
      {
        'urls': 'turn:openrelay.metered.ca:80',
        'username': 'openrelayproject',
        'credential': 'openrelayproject',
      },
      {
        'urls': 'turn:openrelay.metered.ca:443',
        'username': 'openrelayproject',
        'credential': 'openrelayproject',
      },
      {
        'urls': 'turn:openrelay.metered.ca:443?transport=tcp',
        'username': 'openrelayproject',
        'credential': 'openrelayproject',
      },
    ],
    'sdpSemantics': 'unified-plan',
  };

  static const Map<String, dynamic> _mediaConstraints = {
    'audio': {
      'echoCancellation': true,
      'noiseSuppression': true,
      'autoGainControl': true,
    },
    'video': false,
  };

  @override
  Future<void> join({
    required String appIdOrToken,
    required String channelOrRoomId,
    required String uid,
    String? token,
    Map<String, dynamic>? extra,
  }) async {
    if (_currentRoomId == channelOrRoomId && _peerConnection != null) {
      return;
    }

    await leave();

    _currentRoomId = channelOrRoomId;
    _currentUid = uid;
    _isCaller = extra?['isCaller'] == true;
    _remoteDescriptionSet = false;
    _queuedRemoteCandidates.clear();
    _localCandidates.clear();
    _isRemoteMuted = false;

    _setConnectionState(RtcConnectionState.connecting);

    try {
      // 1. Initialize local audio stream
      _localStream = await navigator.mediaDevices.getUserMedia(
        _mediaConstraints,
      );
      _localStream?.getAudioTracks().forEach((track) {
        track.enabled = !_isMuted;
      });

      // Initialize remote audio renderer for browser and native audio playback
      _remoteAudioRenderer = RTCVideoRenderer();
      await _remoteAudioRenderer!.initialize();

      // 2. Initialize RTCPeerConnection with Google STUN + OpenRelay TURN
      _peerConnection = await createPeerConnection(_iceConfiguration);

      _peerConnection?.onConnectionState = (state) {
        if (kDebugMode) {
          debugPrint('WebRTC PeerConnectionState: $state');
        }
        switch (state) {
          case RTCPeerConnectionState.RTCPeerConnectionStateNew:
          case RTCPeerConnectionState.RTCPeerConnectionStateConnecting:
            _setConnectionState(RtcConnectionState.connecting);
            break;
          case RTCPeerConnectionState.RTCPeerConnectionStateConnected:
            _setConnectionState(RtcConnectionState.connected);
            break;
          case RTCPeerConnectionState.RTCPeerConnectionStateDisconnected:
            _setConnectionState(RtcConnectionState.disconnected);
            break;
          case RTCPeerConnectionState.RTCPeerConnectionStateFailed:
            _setConnectionState(RtcConnectionState.failed);
            break;
          case RTCPeerConnectionState.RTCPeerConnectionStateClosed:
            _setConnectionState(RtcConnectionState.disconnected);
            break;
        }
      };

      _peerConnection?.onIceConnectionState = (iceState) {
        if (kDebugMode) {
          debugPrint('WebRTC onIceConnectionState: $iceState');
        }
        switch (iceState) {
          case RTCIceConnectionState.RTCIceConnectionStateConnected:
          case RTCIceConnectionState.RTCIceConnectionStateCompleted:
            _setConnectionState(RtcConnectionState.connected);
            break;
          case RTCIceConnectionState.RTCIceConnectionStateDisconnected:
          case RTCIceConnectionState.RTCIceConnectionStateFailed:
            _setConnectionState(RtcConnectionState.reconnecting);
            break;
          default:
            break;
        }
      };

      _peerConnection?.onIceCandidate = (candidate) {
        if (candidate.candidate == null) return;
        _localCandidates.add(candidate);
        _sendSignalingMessage('ice_candidate', {
          'candidate': candidate.candidate,
          'sdpMid': candidate.sdpMid,
          'sdpMLineIndex': candidate.sdpMLineIndex,
          'sender': _currentUid,
        });
      };

      _peerConnection?.onTrack = (RTCTrackEvent event) {
        if (event.track.kind == 'audio') {
          if (kDebugMode) {
            debugPrint('WebRTC remote audio track received');
          }
          if (_remoteAudioRenderer != null && event.streams.isNotEmpty) {
            _remoteAudioRenderer!.srcObject = event.streams[0];
          }
          _setConnectionState(RtcConnectionState.connected);
        }
      };

      // 3. Add local audio tracks to peer connection
      _localStream?.getTracks().forEach((track) {
        _peerConnection?.addTrack(track, _localStream!);
      });

      // 4. Connect to Supabase Realtime Signaling Channel (sends offer once subscribed)
      _setupSignaling(channelOrRoomId);

      // Default speakerphone setting
      await setSpeakerphone(_isSpeaker);
    } catch (e, st) {
      if (kDebugMode) {
        debugPrint('WebRTC join failed: $e\n$st');
      }
      _setConnectionState(RtcConnectionState.failed);
      rethrow;
    }
  }

  void _setupSignaling(String roomId) {
    final channelName = 'webrtc_call_$roomId';
    _signalingChannel = _supabase.channel(channelName);

    _signalingChannel?.onBroadcast(
      event: 'offer',
      callback: (payload) => _handleRemoteOffer(payload),
    );

    _signalingChannel?.onBroadcast(
      event: 'answer',
      callback: (payload) => _handleRemoteAnswer(payload),
    );

    _signalingChannel?.onBroadcast(
      event: 'ice_candidate',
      callback: (payload) => _handleRemoteCandidate(payload),
    );

    _signalingChannel?.onBroadcast(
      event: 'peer_ready',
      callback: (payload) async {
        final sender = payload['sender'] as String?;
        if (sender == _currentUid) return;
        if (kDebugMode) {
          debugPrint('WebRTC peer_ready received from $sender');
        }
        if (_isCaller) {
          await _createAndSendOffer();
        } else if (!_remoteDescriptionSet) {
          await _sendSignalingMessage('request_offer', {'sender': _currentUid});
        } else {
          final localDesc = await _peerConnection?.getLocalDescription();
          if (localDesc != null && localDesc.type == 'answer') {
            await _sendSignalingMessage('answer', {
              'sdp': localDesc.sdp,
              'type': localDesc.type,
              'sender': _currentUid,
            });
            await _flushLocalCandidates();
          }
        }
      },
    );

    _signalingChannel?.onBroadcast(
      event: 'request_offer',
      callback: (payload) async {
        final sender = payload['sender'] as String?;
        if (sender == _currentUid) return;
        if (kDebugMode) {
          debugPrint('WebRTC request_offer received from $sender');
        }
        if (_isCaller) {
          await _createAndSendOffer();
        }
      },
    );

    _signalingChannel?.onBroadcast(
      event: 'peer_mute',
      callback: (payload) {
        final sender = payload['sender'] as String?;
        if (sender == _currentUid) return;
        final muted = payload['isMuted'] as bool? ?? false;
        _isRemoteMuted = muted;
        _remoteMuteController.add(muted);
        if (kDebugMode) {
          debugPrint('WebRTC remote peer ($sender) mute updated: $muted');
        }
      },
    );

    _signalingChannel?.subscribe((status, error) async {
      if (status == RealtimeSubscribeStatus.subscribed) {
        if (kDebugMode) {
          debugPrint('Subscribed to WebRTC signaling channel: $channelName');
        }
        // Announce presence immediately so peer knows channel is live
        await _sendSignalingMessage('peer_ready', {
          'sender': _currentUid,
          'isCaller': _isCaller,
        });

        // If caller joined, send offer immediately and keep retrying every 2s until remote description is set
        if (_isCaller) {
          await _createAndSendOffer();
          _offerRetryTimer?.cancel();
          int attempts = 0;
          _offerRetryTimer = Timer.periodic(const Duration(seconds: 2), (
            timer,
          ) async {
            if (_remoteDescriptionSet ||
                _connectionState == RtcConnectionState.connected ||
                attempts++ >= 15) {
              timer.cancel();
              return;
            }
            if (kDebugMode) {
              debugPrint('WebRTC retry sending offer (attempt $attempts)...');
            }
            await _createAndSendOffer();
          });
        } else {
          // If non-caller (host/callee), periodically request offer if none received yet
          _peerDiscoveryTimer?.cancel();
          int attempts = 0;
          _peerDiscoveryTimer = Timer.periodic(const Duration(seconds: 2), (
            timer,
          ) async {
            if (_remoteDescriptionSet ||
                _connectionState == RtcConnectionState.connected ||
                attempts++ >= 15) {
              timer.cancel();
              return;
            }
            await _sendSignalingMessage('request_offer', {
              'sender': _currentUid,
            });
          });
        }
      }
    });
  }

  Future<void> _flushLocalCandidates() async {
    for (final candidate in _localCandidates) {
      if (candidate.candidate == null) continue;
      await _sendSignalingMessage('ice_candidate', {
        'candidate': candidate.candidate,
        'sdpMid': candidate.sdpMid,
        'sdpMLineIndex': candidate.sdpMLineIndex,
        'sender': _currentUid,
      });
    }
  }

  Future<void> _createAndSendOffer() async {
    if (_peerConnection == null) return;
    try {
      final state = _peerConnection!.signalingState;
      if (state == RTCSignalingState.RTCSignalingStateHaveLocalOffer) {
        final localDesc = await _peerConnection!.getLocalDescription();
        if (localDesc != null) {
          await _sendSignalingMessage('offer', {
            'sdp': localDesc.sdp,
            'type': localDesc.type,
            'sender': _currentUid,
          });
          await _flushLocalCandidates();
          if (kDebugMode) {
            debugPrint(
              'WebRTC re-sent existing SDP Offer & ${_localCandidates.length} local candidates',
            );
          }
        }
        return;
      }

      final offer = await _peerConnection!.createOffer({
        'offerToReceiveAudio': 1,
        'offerToReceiveVideo': 0,
      });
      await _peerConnection!.setLocalDescription(offer);

      await _sendSignalingMessage('offer', {
        'sdp': offer.sdp,
        'type': offer.type,
        'sender': _currentUid,
      });
      await _flushLocalCandidates();
      if (kDebugMode) {
        debugPrint('WebRTC SDP Offer created and sent');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to create/send SDP offer: $e');
      }
    }
  }

  Future<void> _handleRemoteOffer(Map<String, dynamic> payload) async {
    final sender = payload['sender'] as String?;
    if (sender == _currentUid || _peerConnection == null) return;

    try {
      final sdp = payload['sdp'] as String?;
      final type = payload['type'] as String? ?? 'offer';
      if (sdp == null) return;

      await _peerConnection!.setRemoteDescription(
        RTCSessionDescription(sdp, type),
      );
      _remoteDescriptionSet = true;
      await _drainQueuedCandidates();

      final answer = await _peerConnection!.createAnswer({
        'offerToReceiveAudio': 1,
        'offerToReceiveVideo': 0,
      });
      await _peerConnection!.setLocalDescription(answer);

      await _sendSignalingMessage('answer', {
        'sdp': answer.sdp,
        'type': answer.type,
        'sender': _currentUid,
      });
      await _flushLocalCandidates();
      _setConnectionState(RtcConnectionState.connected);
      if (kDebugMode) {
        debugPrint('WebRTC SDP Answer sent & local candidates flushed');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to handle remote offer: $e');
      }
    }
  }

  Future<void> _handleRemoteAnswer(Map<String, dynamic> payload) async {
    final sender = payload['sender'] as String?;
    if (sender == _currentUid || _peerConnection == null) return;

    try {
      final sdp = payload['sdp'] as String?;
      final type = payload['type'] as String? ?? 'answer';
      if (sdp == null) return;

      await _peerConnection!.setRemoteDescription(
        RTCSessionDescription(sdp, type),
      );
      _remoteDescriptionSet = true;
      await _drainQueuedCandidates();
      await _flushLocalCandidates();
      _setConnectionState(RtcConnectionState.connected);
      if (kDebugMode) {
        debugPrint('WebRTC Remote Answer set successfully & connected');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to handle remote answer: $e');
      }
    }
  }

  Future<void> _handleRemoteCandidate(Map<String, dynamic> payload) async {
    final sender = payload['sender'] as String?;
    if (sender == _currentUid || _peerConnection == null) return;

    final candidateStr = payload['candidate'] as String?;
    final sdpMid = payload['sdpMid'] as String?;
    final sdpMLineIndex = payload['sdpMLineIndex'] as int?;

    if (candidateStr == null) return;

    final candidate = RTCIceCandidate(candidateStr, sdpMid, sdpMLineIndex);

    if (_remoteDescriptionSet) {
      await _peerConnection?.addCandidate(candidate);
    } else {
      _queuedRemoteCandidates.add(candidate);
    }
  }

  Future<void> _drainQueuedCandidates() async {
    for (final candidate in _queuedRemoteCandidates) {
      await _peerConnection?.addCandidate(candidate);
    }
    _queuedRemoteCandidates.clear();
  }

  Future<void> _sendSignalingMessage(
    String event,
    Map<String, dynamic> payload,
  ) async {
    if (_signalingChannel == null) return;
    try {
      await _signalingChannel!.sendBroadcastMessage(
        event: event,
        payload: payload,
      );
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Error broadcasting signaling event $event: $e');
      }
    }
  }

  @override
  Future<void> setMuted(bool muted) async {
    _isMuted = muted;
    _localStream?.getAudioTracks().forEach((track) {
      track.enabled = !muted;
    });
    await _sendSignalingMessage('peer_mute', {
      'sender': _currentUid,
      'isMuted': muted,
    });
  }

  @override
  Future<void> setSpeakerphone(bool enabled) async {
    _isSpeaker = enabled;
    try {
      Helper.setSpeakerphoneOn(enabled);
    } catch (e) {
      if (kDebugMode) {
        debugPrint('setSpeakerphone error: $e');
      }
    }
  }

  void _setConnectionState(RtcConnectionState state) {
    if (_connectionState != state) {
      _connectionState = state;
      _connectionStateController.add(state);
    }
  }

  @override
  Future<void> leave() async {
    _offerRetryTimer?.cancel();
    _offerRetryTimer = null;
    _peerDiscoveryTimer?.cancel();
    _peerDiscoveryTimer = null;

    if (_signalingChannel != null) {
      await _supabase.removeChannel(_signalingChannel!);
      _signalingChannel = null;
    }

    _queuedRemoteCandidates.clear();
    _localCandidates.clear();
    _remoteDescriptionSet = false;
    _isRemoteMuted = false;

    if (_remoteAudioRenderer != null) {
      _remoteAudioRenderer!.srcObject = null;
      await _remoteAudioRenderer!.dispose();
      _remoteAudioRenderer = null;
    }

    if (_localStream != null) {
      _localStream?.getTracks().forEach((track) {
        track.stop();
      });
      await _localStream?.dispose();
      _localStream = null;
    }

    if (_peerConnection != null) {
      await _peerConnection?.close();
      await _peerConnection?.dispose();
      _peerConnection = null;
    }

    _currentRoomId = null;
    _currentUid = null;
    _setConnectionState(RtcConnectionState.disconnected);
  }

  @override
  Future<void> dispose() async {
    await leave();
    await _connectionStateController.close();
    await _remoteMuteController.close();
  }
}
