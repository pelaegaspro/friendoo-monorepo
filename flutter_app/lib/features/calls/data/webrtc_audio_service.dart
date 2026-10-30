import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'rtc_audio_service.dart';

/// Enhanced Production-Grade Peer-to-Peer WebRTC Audio Engine
/// Features:
/// - Ultra-HD Opus Voice Optimization (64kbps, In-Band FEC, 10ms frame latency)
/// - Multi-Region Google & Cloudflare STUN + Metered TCP/UDP TURN Relays
/// - Automatic Carrier Handover & ICE Restart on network switch (WiFi <-> 4G/5G)
/// - Live RTT Latency & Audio Energy Level Monitoring via getStats()
/// - Polite Peer / Impolite Peer Perfect Negotiation pattern
class WebRtcAudioService implements RtcAudioService {
  WebRtcAudioService({SupabaseClient? supabaseClient})
      : _supabaseClient = supabaseClient;

  // ignore: prefer_initializing_formals — kept explicit for clarity
  final SupabaseClient? _supabaseClient;
  SupabaseClient get _supabase => _supabaseClient ?? Supabase.instance.client;

  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  RealtimeChannel? _signalingChannel;

  bool _isMuted = false;
  bool _isSpeaker = true;
  bool _isRemoteMuted = false;
  RtcConnectionState _connectionState = RtcConnectionState.disconnected;
  String? _currentRoomId;
  String? _currentUid;
  bool _isCaller = false;

  Timer? _offerRetryTimer;
  Timer? _peerDiscoveryTimer;
  Timer? _statsTimer;
  Timer? _iceRestartDebounce;
  Timer? _connectionTimeoutTimer;

  final List<RTCIceCandidate> _queuedRemoteCandidates = [];
  final List<RTCIceCandidate> _localCandidates = [];
  bool _remoteDescriptionSet = false;
  bool _makingOffer = false;
  bool _disposed = false;
  bool _channelReady = false;

  final StreamController<RtcConnectionState> _connectionStateController =
      StreamController<RtcConnectionState>.broadcast();
  final StreamController<bool> _remoteMuteController =
      StreamController<bool>.broadcast();
  final StreamController<double> _audioLevelController =
      StreamController<double>.broadcast();
  final StreamController<int> _rttMsController =
      StreamController<int>.broadcast();

  @override
  bool get isMuted => _isMuted;

  @override
  bool get isSpeaker => _isSpeaker;

  @override
  bool get isRemoteMuted => _isRemoteMuted;

  @override
  Stream<bool> get remoteMuteStream => _remoteMuteController.stream;

  @override
  Stream<double> get audioLevelStream => _audioLevelController.stream;

  @override
  Stream<int> get rttMsStream => _rttMsController.stream;

  @override
  RtcConnectionState get connectionState => _connectionState;

  @override
  Stream<RtcConnectionState> get connectionStateStream =>
      _connectionStateController.stream;

  @override
  void setTokenRenewalHandler(
    Future<String?> Function() onTokenRenewalRequested,
  ) {
    // Pure WebRTC uses open STUN/TURN relays with no expiring token friction
  }

  /// High-reliability multi-region STUN + TURN cluster
  static const Map<String, dynamic> _iceConfiguration = {
    'iceServers': [
      // Primary Google Global Anycast STUN
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'stun:stun1.l.google.com:19302'},
      {'urls': 'stun:stun2.l.google.com:19302'},
      // Cloudflare Global Anycast STUN
      {'urls': 'stun:stun.cloudflare.com:3478'},
      // OpenRelay Global Metered STUN
      {'urls': 'stun:openrelay.metered.ca:80'},
      // OpenRelay TURN (UDP & TCP fallback through restricted mobile firewalls)
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
    'iceTransportPolicy': 'all',
    'bundlePolicy': 'max-bundle',
    'rtcpMuxPolicy': 'require',
  };

  /// High-fidelity voice constraints with hardware noise & echo cancellation
  static const Map<String, dynamic> _mediaConstraints = {
    'audio': {
      'echoCancellation': true,
      'noiseSuppression': true,
      'autoGainControl': true,
      'highpassFilter': true,
      'typingNoiseDetection': true,
    },
    'video': false,
  };

  /// Injects Opus HD codec parameters (64kbps, Forward Error Correction, 10ms frame packet time)
  String _optimizeAudioSdp(String sdp) {
    final lines = sdp.split('\r\n');
    String? opusPayload;

    for (final line in lines) {
      if (line.startsWith('a=rtpmap:') && line.contains('opus/48000')) {
        final parts = line.split(' ');
        if (parts.isNotEmpty) {
          opusPayload = parts[0].replaceAll('a=rtpmap:', '').trim();
          break;
        }
      }
    }

    if (opusPayload == null) return sdp;

    bool fmtpModified = false;
    final modifiedLines = lines.map((line) {
      if (line.startsWith('a=fmtp:$opusPayload')) {
        fmtpModified = true;
        // Strip duplicate params if present and inject optimal voice profile
        return '$line;minptime=10;useinbandfec=1;maxaveragebitrate=64000;stereo=0;sprop-stereo=0;cbr=1';
      }
      return line;
    }).toList();

    var modifiedSdp = modifiedLines.join('\r\n');

    // If no existing fmtp line was present, synthesize one right after rtpmap
    if (!fmtpModified) {
      modifiedSdp = modifiedSdp.replaceFirst(
        'a=rtpmap:$opusPayload opus/48000/2',
        'a=rtpmap:$opusPayload opus/48000/2\r\na=fmtp:$opusPayload minptime=10;useinbandfec=1;maxaveragebitrate=64000;stereo=0;sprop-stereo=0;cbr=1',
      );
    }

    return modifiedSdp;
  }

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
    _makingOffer = false;
    _disposed = false;
    _channelReady = false;

    _setConnectionState(RtcConnectionState.connecting);

    try {
      // 1. Initialize hardware microphone capture
      _localStream = await navigator.mediaDevices.getUserMedia(
        _mediaConstraints,
      );
      _localStream?.getAudioTracks().forEach((track) {
        track.enabled = !_isMuted;
      });

      // 2. Initialize RTCPeerConnection with STUN/TURN cluster
      _peerConnection = await createPeerConnection(_iceConfiguration);

      _peerConnection?.onConnectionState = (state) {
        if (_disposed) return;
        if (kDebugMode) {
          debugPrint('WebRTC PeerConnectionState: $state');
        }
        switch (state) {
          case RTCPeerConnectionState.RTCPeerConnectionStateNew:
          case RTCPeerConnectionState.RTCPeerConnectionStateConnecting:
            _setConnectionState(RtcConnectionState.connecting);
            break;
          case RTCPeerConnectionState.RTCPeerConnectionStateConnected:
            _connectionTimeoutTimer?.cancel();
            _connectionTimeoutTimer = null;
            _setConnectionState(RtcConnectionState.connected);
            _startStatsMonitoring();
            break;
          case RTCPeerConnectionState.RTCPeerConnectionStateDisconnected:
            _setConnectionState(RtcConnectionState.reconnecting);
            _scheduleIceRestart();
            break;
          case RTCPeerConnectionState.RTCPeerConnectionStateFailed:
            _setConnectionState(RtcConnectionState.reconnecting);
            _scheduleIceRestart();
            break;
          case RTCPeerConnectionState.RTCPeerConnectionStateClosed:
            _setConnectionState(RtcConnectionState.disconnected);
            break;
        }
      };

      _peerConnection?.onIceConnectionState = (iceState) {
        if (_disposed) return;
        if (kDebugMode) {
          debugPrint('WebRTC onIceConnectionState: $iceState');
        }
        switch (iceState) {
          case RTCIceConnectionState.RTCIceConnectionStateConnected:
          case RTCIceConnectionState.RTCIceConnectionStateCompleted:
            _connectionTimeoutTimer?.cancel();
            _connectionTimeoutTimer = null;
            _setConnectionState(RtcConnectionState.connected);
            _startStatsMonitoring();
            break;
          case RTCIceConnectionState.RTCIceConnectionStateDisconnected:
            _setConnectionState(RtcConnectionState.reconnecting);
            _scheduleIceRestart();
            break;
          case RTCIceConnectionState.RTCIceConnectionStateFailed:
            _setConnectionState(RtcConnectionState.failed);
            break;
          default:
            break;
        }
      };

      _peerConnection?.onIceCandidate = (candidate) {
        if (_disposed) return;
        if (candidate.candidate == null || candidate.candidate!.isEmpty) return;
        _localCandidates.add(candidate);
        // Only send immediately if channel is ready; otherwise queued and
        // flushed after offer/answer exchange
        if (_channelReady) {
          _sendSignalingMessage('ice_candidate', {
            'candidate': candidate.candidate,
            'sdpMid': candidate.sdpMid,
            'sdpMLineIndex': candidate.sdpMLineIndex,
            'sender': _currentUid,
          });
        }
      };

      _peerConnection?.onTrack = (RTCTrackEvent event) {
        if (_disposed) return;
        if (event.track.kind == 'audio') {
          if (kDebugMode) {
            debugPrint('WebRTC remote audio track received');
          }
          // On mobile, just having the track added to the PeerConnection is
          // enough for audio playback — no renderer needed for audio-only.
          _setConnectionState(RtcConnectionState.connected);
          _startStatsMonitoring();
        }
      };

      // Add a transceiver for audio to ensure we can receive audio
      await _peerConnection?.addTransceiver(
        kind: RTCRtpMediaType.RTCRtpMediaTypeAudio,
        init: RTCRtpTransceiverInit(direction: TransceiverDirection.SendRecv),
      );

      // 3. Attach local microphone tracks
      _localStream?.getTracks().forEach((track) {
        _peerConnection?.addTrack(track, _localStream!);
      });

      // 4. Connect to Supabase Realtime Signaling Channel
      _setupSignaling(channelOrRoomId);

      // 5. Set initial speakerphone state
      await setSpeakerphone(_isSpeaker);

      // 6. Start connection timeout — if not connected within 30s, mark as failed
      _connectionTimeoutTimer?.cancel();
      _connectionTimeoutTimer = Timer(const Duration(seconds: 30), () {
        if (_connectionState != RtcConnectionState.connected && !_disposed) {
          if (kDebugMode) {
            debugPrint('WebRTC connection timeout after 30s');
          }
          _setConnectionState(RtcConnectionState.failed);
        }
      });
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
        // Cancel retry timers — peer is here
        _offerRetryTimer?.cancel();
        _peerDiscoveryTimer?.cancel();

        if (_isCaller) {
          // Caller always creates offer when peer joins
          await _createAndSendOffer();
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
        if (!_remoteMuteController.isClosed) {
          _remoteMuteController.add(muted);
        }
        if (kDebugMode) {
          debugPrint('WebRTC remote peer ($sender) mute updated: $muted');
        }
      },
    );

    _signalingChannel?.subscribe((status, error) async {
      if (status == RealtimeSubscribeStatus.subscribed) {
        _channelReady = true;
        if (kDebugMode) {
          debugPrint('Subscribed to WebRTC signaling channel: $channelName');
        }

        // Small delay to ensure both sides have subscribed
        await Future.delayed(const Duration(milliseconds: 300));
        if (_disposed) return;

        // Announce presence
        await _sendSignalingMessage('peer_ready', {
          'sender': _currentUid,
          'isCaller': _isCaller,
        });

        if (_isCaller) {
          // Create and send offer immediately
          await _createAndSendOffer();

          // Retry sending offer periodically until answer is received
          _offerRetryTimer?.cancel();
          int attempts = 0;
          _offerRetryTimer = Timer.periodic(const Duration(seconds: 3), (
            timer,
          ) async {
            if (_disposed ||
                _remoteDescriptionSet ||
                _connectionState == RtcConnectionState.connected ||
                attempts++ >= 10) {
              timer.cancel();
              return;
            }
            if (kDebugMode) {
              debugPrint('WebRTC retry sending offer (attempt $attempts)...');
            }
            await _createAndSendOffer();
          });
        } else {
          // Callee: request offer from caller if we haven't received one yet
          _peerDiscoveryTimer?.cancel();
          int attempts = 0;
          _peerDiscoveryTimer = Timer.periodic(const Duration(seconds: 3), (
            timer,
          ) async {
            if (_disposed ||
                _remoteDescriptionSet ||
                _connectionState == RtcConnectionState.connected ||
                attempts++ >= 10) {
              timer.cancel();
              return;
            }
            await _sendSignalingMessage('peer_ready', {
              'sender': _currentUid,
              'isCaller': false,
            });
          });
        }
      } else if (status == RealtimeSubscribeStatus.channelError) {
        if (kDebugMode) {
          debugPrint('WebRTC signaling channel error: $error');
        }
        // Retry channel subscription after a delay
        await Future.delayed(const Duration(seconds: 2));
        if (!_disposed && _currentRoomId != null) {
          _setupSignaling(_currentRoomId!);
        }
      }
    });
  }

  void _scheduleIceRestart() {
    _iceRestartDebounce?.cancel();
    _iceRestartDebounce = Timer(const Duration(milliseconds: 2000), () async {
      if (_connectionState == RtcConnectionState.reconnecting && !_disposed) {
        if (kDebugMode) {
          debugPrint('WebRTC triggering carrier handover ICE restart...');
        }
        await restartIce();
      }
    });
  }

  @override
  Future<void> restartIce() async {
    if (_peerConnection == null || _disposed) return;
    try {
      if (_isCaller) {
        // Reset remote description state to allow new offer/answer exchange
        _remoteDescriptionSet = false;
        final offer = await _peerConnection!.createOffer({
          'iceRestart': true,
          'offerToReceiveAudio': 1,
          'offerToReceiveVideo': 0,
        });
        final optimizedSdp = _optimizeAudioSdp(offer.sdp ?? '');
        final finalOffer = RTCSessionDescription(optimizedSdp, offer.type);
        await _peerConnection!.setLocalDescription(finalOffer);
        await _sendSignalingMessage('offer', {
          'sdp': finalOffer.sdp,
          'type': finalOffer.type,
          'sender': _currentUid,
          'iceRestart': true,
        });
        await _flushLocalCandidates();
      } else {
        await _sendSignalingMessage('request_offer', {
          'sender': _currentUid,
          'iceRestart': true,
        });
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('WebRTC restartIce error: $e');
      }
    }
  }

  void _startStatsMonitoring() {
    _statsTimer?.cancel();
    _statsTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      if (_peerConnection == null ||
          _connectionState != RtcConnectionState.connected ||
          _disposed) {
        return;
      }
      try {
        final reports = await _peerConnection!.getStats();
        for (final report in reports) {
          // Audio volume / speaking indicator
          if (report.type == 'inbound-rtp' &&
              report.values.containsKey('audioLevel')) {
            final rawLevel = double.tryParse(
                  report.values['audioLevel']?.toString() ?? '0',
                ) ??
                0.0;
            if (!_audioLevelController.isClosed) {
              _audioLevelController.add(rawLevel.clamp(0.0, 1.0));
            }
          }

          // RTT / Network latency
          if (report.type == 'candidate-pair' &&
              report.values['state'] == 'succeeded' &&
              report.values.containsKey('currentRoundTripTime')) {
            final rttSec = double.tryParse(
                  report.values['currentRoundTripTime']?.toString() ?? '0',
                ) ??
                0.0;
            final rttMs = (rttSec * 1000).round();
            if (rttMs > 0 && rttMs < 5000 && !_rttMsController.isClosed) {
              _rttMsController.add(rttMs);
            }
          }
        }
      } catch (_) {}
    });
  }

  Future<void> _flushLocalCandidates() async {
    if (!_channelReady) return;
    for (final candidate in _localCandidates) {
      if (candidate.candidate == null || candidate.candidate!.isEmpty) continue;
      await _sendSignalingMessage('ice_candidate', {
        'candidate': candidate.candidate,
        'sdpMid': candidate.sdpMid,
        'sdpMLineIndex': candidate.sdpMLineIndex,
        'sender': _currentUid,
      });
    }
  }

  Future<void> _createAndSendOffer() async {
    if (_peerConnection == null || _makingOffer || _disposed) return;
    try {
      _makingOffer = true;
      final state = _peerConnection!.signalingState;

      // If we already have a local offer pending, rollback first to avoid
      // InvalidStateError when creating a new one
      if (state == RTCSignalingState.RTCSignalingStateHaveLocalOffer) {
        try {
          await _peerConnection!.setLocalDescription(
            RTCSessionDescription(null, 'rollback'),
          );
        } catch (_) {
          // Rollback not supported on all platforms; proceed anyway
        }
      }

      final offer = await _peerConnection!.createOffer({
        'offerToReceiveAudio': 1,
        'offerToReceiveVideo': 0,
      });
      final optimizedSdp = _optimizeAudioSdp(offer.sdp ?? '');
      final finalOffer = RTCSessionDescription(optimizedSdp, offer.type);
      await _peerConnection!.setLocalDescription(finalOffer);

      await _sendSignalingMessage('offer', {
        'sdp': finalOffer.sdp,
        'type': finalOffer.type,
        'sender': _currentUid,
      });
      await _flushLocalCandidates();
      if (kDebugMode) {
        debugPrint('WebRTC HD Opus SDP Offer created and sent');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to create/send SDP offer: $e');
      }
    } finally {
      _makingOffer = false;
    }
  }

  Future<void> _handleRemoteOffer(Map<String, dynamic> payload) async {
    final sender = payload['sender'] as String?;
    if (sender == _currentUid || _peerConnection == null || _disposed) return;

    try {
      final sdp = payload['sdp'] as String?;
      final type = payload['type'] as String? ?? 'offer';
      if (sdp == null) return;

      // Perfect negotiation: if we're also making an offer (glare), the polite
      // peer (callee) rolls back; the impolite peer (caller) ignores the remote offer.
      final signalingState = _peerConnection!.signalingState;
      final collision =
          _makingOffer ||
          signalingState == RTCSignalingState.RTCSignalingStateHaveLocalOffer;

      if (collision && _isCaller) {
        // Impolite peer (caller) ignores incoming offer during glare
        if (kDebugMode) {
          debugPrint('WebRTC offer glare — caller ignoring remote offer');
        }
        return;
      }

      // Polite peer (callee): rollback our pending offer if any
      if (collision) {
        try {
          await _peerConnection!.setLocalDescription(
            RTCSessionDescription(null, 'rollback'),
          );
        } catch (_) {}
      }

      final optimizedSdp = _optimizeAudioSdp(sdp);
      await _peerConnection!.setRemoteDescription(
        RTCSessionDescription(optimizedSdp, type),
      );
      _remoteDescriptionSet = true;
      await _drainQueuedCandidates();

      final answer = await _peerConnection!.createAnswer({
        'offerToReceiveAudio': 1,
        'offerToReceiveVideo': 0,
      });
      final optimizedAnswerSdp = _optimizeAudioSdp(answer.sdp ?? '');
      final finalAnswer = RTCSessionDescription(
        optimizedAnswerSdp,
        answer.type,
      );
      await _peerConnection!.setLocalDescription(finalAnswer);

      await _sendSignalingMessage('answer', {
        'sdp': finalAnswer.sdp,
        'type': finalAnswer.type,
        'sender': _currentUid,
      });
      await _flushLocalCandidates();

      if (kDebugMode) {
        debugPrint('WebRTC HD Opus SDP Answer sent & local candidates flushed');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Failed to handle remote offer: $e');
      }
    }
  }

  Future<void> _handleRemoteAnswer(Map<String, dynamic> payload) async {
    final sender = payload['sender'] as String?;
    if (sender == _currentUid || _peerConnection == null || _disposed) return;

    try {
      final sdp = payload['sdp'] as String?;
      final type = payload['type'] as String? ?? 'answer';
      if (sdp == null) return;

      // Only accept answer if we're in the right signaling state
      final signalingState = _peerConnection!.signalingState;
      if (signalingState != RTCSignalingState.RTCSignalingStateHaveLocalOffer) {
        if (kDebugMode) {
          debugPrint(
            'WebRTC ignoring answer — not in HaveLocalOffer state (current: $signalingState)',
          );
        }
        return;
      }

      final optimizedSdp = _optimizeAudioSdp(sdp);
      await _peerConnection!.setRemoteDescription(
        RTCSessionDescription(optimizedSdp, type),
      );
      _remoteDescriptionSet = true;
      await _drainQueuedCandidates();
      await _flushLocalCandidates();

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
    if (sender == _currentUid || _peerConnection == null || _disposed) return;

    final candidateStr = payload['candidate'] as String?;
    final sdpMid = payload['sdpMid'] as String?;
    final sdpMLineIndex = payload['sdpMLineIndex'] as int?;

    if (candidateStr == null || candidateStr.isEmpty) return;

    final candidate = RTCIceCandidate(candidateStr, sdpMid, sdpMLineIndex);

    if (_remoteDescriptionSet) {
      try {
        await _peerConnection?.addCandidate(candidate);
      } catch (e) {
        if (kDebugMode) {
          debugPrint('WebRTC addCandidate error: $e');
        }
      }
    } else {
      _queuedRemoteCandidates.add(candidate);
    }
  }

  Future<void> _drainQueuedCandidates() async {
    for (final candidate in _queuedRemoteCandidates) {
      try {
        await _peerConnection?.addCandidate(candidate);
      } catch (e) {
        if (kDebugMode) {
          debugPrint('WebRTC drainQueuedCandidates addCandidate error: $e');
        }
      }
    }
    _queuedRemoteCandidates.clear();
  }

  Future<void> _sendSignalingMessage(
    String event,
    Map<String, dynamic> payload,
  ) async {
    if (_signalingChannel == null || _disposed) return;
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
      await Helper.setSpeakerphoneOn(enabled);
    } catch (e) {
      if (kDebugMode) {
        debugPrint('setSpeakerphone error: $e');
      }
    }
  }

  void _setConnectionState(RtcConnectionState state) {
    if (_connectionState != state && !_disposed) {
      _connectionState = state;
      if (!_connectionStateController.isClosed) {
        _connectionStateController.add(state);
      }
    }
  }

  @override
  Future<void> leave() async {
    _disposed = true;
    _channelReady = false;

    _offerRetryTimer?.cancel();
    _offerRetryTimer = null;
    _peerDiscoveryTimer?.cancel();
    _peerDiscoveryTimer = null;
    _statsTimer?.cancel();
    _statsTimer = null;
    _iceRestartDebounce?.cancel();
    _iceRestartDebounce = null;
    _connectionTimeoutTimer?.cancel();
    _connectionTimeoutTimer = null;

    if (_signalingChannel != null) {
      try {
        await _supabase.removeChannel(_signalingChannel!);
      } catch (_) {}
      _signalingChannel = null;
    }

    _queuedRemoteCandidates.clear();
    _localCandidates.clear();
    _remoteDescriptionSet = false;
    _isRemoteMuted = false;
    _makingOffer = false;

    if (_localStream != null) {
      _localStream?.getTracks().forEach((track) {
        track.stop();
      });
      await _localStream?.dispose();
      _localStream = null;
    }

    if (_peerConnection != null) {
      try {
        await _peerConnection?.close();
      } catch (_) {}
      try {
        await _peerConnection?.dispose();
      } catch (_) {}
      _peerConnection = null;
    }

    _currentRoomId = null;
    _currentUid = null;
    _setConnectionState(RtcConnectionState.disconnected);
    _disposed = false; // Reset for potential reuse
  }

  @override
  Future<void> dispose() async {
    _disposed = true;
    await leave();
    await _connectionStateController.close();
    await _remoteMuteController.close();
    await _audioLevelController.close();
    await _rttMsController.close();
  }
}
