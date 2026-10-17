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

  bool _isMuted = false;
  bool _isSpeaker = true;
  RtcConnectionState _connectionState = RtcConnectionState.disconnected;
  String? _currentRoomId;
  String? _currentUid;
  bool _isCaller = false;

  final List<RTCIceCandidate> _queuedRemoteCandidates = [];
  bool _remoteDescriptionSet = false;

  final StreamController<RtcConnectionState> _connectionStateController =
      StreamController<RtcConnectionState>.broadcast();

  @override
  bool get isMuted => _isMuted;

  @override
  bool get isSpeaker => _isSpeaker;

  @override
  RtcConnectionState get connectionState => _connectionState;

  @override
  Stream<RtcConnectionState> get connectionStateStream =>
      _connectionStateController.stream;

  @override
  void setTokenRenewalHandler(Future<String?> Function() onTokenRenewalRequested) {
    // Pure WebRTC does not require expiring tokens.
  }

  static const Map<String, dynamic> _iceConfiguration = {
    'iceServers': [
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'stun:stun1.l.google.com:19302'},
      {'urls': 'stun:stun2.l.google.com:19302'},
      {'urls': 'stun:stun3.l.google.com:19302'},
      {'urls': 'stun:stun4.l.google.com:19302'},
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

    _setConnectionState(RtcConnectionState.connecting);

    try {
      // 1. Initialize local audio stream
      _localStream = await navigator.mediaDevices.getUserMedia(_mediaConstraints);
      _localStream?.getAudioTracks().forEach((track) {
        track.enabled = !_isMuted;
      });

      // 2. Initialize RTCPeerConnection with Google STUN
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

      _peerConnection?.onIceCandidate = (candidate) {
        if (candidate.candidate == null) return;
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
          _setConnectionState(RtcConnectionState.connected);
        }
      };

      // 3. Add local audio tracks to peer connection
      _localStream?.getTracks().forEach((track) {
        _peerConnection?.addTrack(track, _localStream!);
      });

      // 4. Connect to Supabase Realtime Signaling Channel
      _setupSignaling(channelOrRoomId);

      // Default speakerphone setting
      await setSpeakerphone(_isSpeaker);

      // 5. If caller, create and send initial SDP offer
      if (_isCaller) {
        await _createAndSendOffer();
      }
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

    _signalingChannel?.subscribe((status, error) async {
      if (status == RealtimeSubscribeStatus.subscribed) {
        if (kDebugMode) {
          debugPrint('Subscribed to WebRTC signaling channel: $channelName');
        }
        // If caller joined and channel ready, resend offer if answer not yet received
        if (_isCaller && !_remoteDescriptionSet) {
          await _createAndSendOffer();
        }
      }
    });
  }

  Future<void> _createAndSendOffer() async {
    if (_peerConnection == null) return;
    try {
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
      if (kDebugMode) {
        debugPrint('WebRTC SDP Offer sent');
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

      await _peerConnection!.setRemoteDescription(RTCSessionDescription(sdp, type));
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
      if (kDebugMode) {
        debugPrint('WebRTC SDP Answer sent');
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

      await _peerConnection!.setRemoteDescription(RTCSessionDescription(sdp, type));
      _remoteDescriptionSet = true;
      await _drainQueuedCandidates();
      if (kDebugMode) {
        debugPrint('WebRTC Remote Answer set successfully');
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

  Future<void> _sendSignalingMessage(String event, Map<String, dynamic> payload) async {
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
    if (_signalingChannel != null) {
      await _supabase.removeChannel(_signalingChannel!);
      _signalingChannel = null;
    }

    _queuedRemoteCandidates.clear();
    _remoteDescriptionSet = false;

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
  }
}

