import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/call_model.dart';
import '../../../services/agora_static_service.dart';

final incomingCallProvider =
    StreamProvider.family<CallModel?, String>((ref, hostId) {
  return FirebaseFirestore.instance
      .collection(AppConstants.callsCollection)
      .where('hostId', isEqualTo: hostId)
      .where('status', isEqualTo: AppConstants.callStatusRinging)
      .limit(1)
      .snapshots()
      .map((snapshot) => snapshot.docs.isNotEmpty
          ? CallModel.fromJson(
              snapshot.docs.first.id, snapshot.docs.first.data())
          : null);
});

final hostCallProvider =
    StateNotifierProvider.family<HostCallNotifier, HostCallState, String>(
  (ref, callId) => HostCallNotifier(callId),
);

class HostCallState {
  final bool isInCall;
  final bool isMuted;
  final bool isSpeakerOn;
  final bool isVideoOff;
  final int durationSeconds;
  final int coinsEarned;
  final String? error;

  HostCallState({
    this.isInCall = false,
    this.isMuted = false,
    this.isSpeakerOn = false,
    this.isVideoOff = false,
    this.durationSeconds = 0,
    this.coinsEarned = 0,
    this.error,
  });

  HostCallState copyWith({
    bool? isInCall,
    bool? isMuted,
    bool? isSpeakerOn,
    bool? isVideoOff,
    int? durationSeconds,
    int? coinsEarned,
    String? error,
  }) {
    return HostCallState(
      isInCall: isInCall ?? this.isInCall,
      isMuted: isMuted ?? this.isMuted,
      isSpeakerOn: isSpeakerOn ?? this.isSpeakerOn,
      isVideoOff: isVideoOff ?? this.isVideoOff,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      coinsEarned: coinsEarned ?? this.coinsEarned,
      error: error,
    );
  }
}

class HostCallNotifier extends StateNotifier<HostCallState> {
  final String callId;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  Timer? _durationTimer;
  int _currentDuration = 0;

  HostCallNotifier(this.callId) : super(HostCallState());

  Future<bool> acceptCall({
    required String channelName,
    required String token,
    required bool isVideoCall,
  }) async {
    try {
      await _firestore
          .collection(AppConstants.callsCollection)
          .doc(callId)
          .update({
        'status': AppConstants.callStatusOngoing,
      });

      final joined = await AgoraService.joinCall(
        channelName: channelName,
        token: token,
        uid: 0,
        isVideoCall: isVideoCall,
      );

      if (!joined) {
        return false;
      }

      state = state.copyWith(isInCall: true);
      _startDurationTimer();
      return true;
    } catch (e) {
      state = state.copyWith(error: 'Failed to accept call: $e');
      return false;
    }
  }

  Future<bool> rejectCall() async {
    try {
      await _firestore
          .collection(AppConstants.callsCollection)
          .doc(callId)
          .update({
        'status': 'rejected',
        'endTime': FieldValue.serverTimestamp(),
      });
      return true;
    } catch (e) {
      state = state.copyWith(error: 'Failed to reject call');
      return false;
    }
  }

  void _startDurationTimer() {
    _durationTimer?.cancel();
    _currentDuration = 0;

    _durationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      _currentDuration++;
      state = state.copyWith(durationSeconds: _currentDuration);
      _updateCallInFirestore();
    });
  }

  Future<void> _updateCallInFirestore() async {
    try {
      await _firestore
          .collection(AppConstants.callsCollection)
          .doc(callId)
          .update({
        'durationSeconds': _currentDuration,
      });
    } catch (e) {
      debugPrint('Update call error: $e');
    }
  }

  Future<void> toggleMute() async {
    final newMuted = !state.isMuted;
    await AgoraService.toggleMute(newMuted);
    state = state.copyWith(isMuted: newMuted);
  }

  Future<void> toggleSpeaker() async {
    final newSpeakerOn = !state.isSpeakerOn;
    await AgoraService.enableSpeakerphone(newSpeakerOn);
    state = state.copyWith(isSpeakerOn: newSpeakerOn);
  }

  Future<void> toggleVideo() async {
    final newVideoOff = !state.isVideoOff;
    await AgoraService.toggleVideo(newVideoOff);
    state = state.copyWith(isVideoOff: newVideoOff);
  }

  Future<void> switchCamera() async {
    await AgoraService.switchCamera();
  }

  Future<void> endCall(int ratePerMinute) async {
    _durationTimer?.cancel();

    try {
      await AgoraService.leaveCall();

      final minutes = (_currentDuration / 60).ceil();
      final coinsEarned =
          (minutes * ratePerMinute * AppConstants.hostEarningPercentage)
              .round();

      await _firestore
          .collection(AppConstants.callsCollection)
          .doc(callId)
          .update({
        'status': AppConstants.callStatusEnded,
        'endTime': FieldValue.serverTimestamp(),
        'durationSeconds': _currentDuration,
        'hostCoinsEarned': coinsEarned,
      });

      state = state.copyWith(
        isInCall: false,
        coinsEarned: coinsEarned,
      );
    } catch (e) {
      state = state.copyWith(error: 'Failed to end call: $e');
    }
  }

  @override
  void dispose() {
    _durationTimer?.cancel();
    super.dispose();
  }
}
