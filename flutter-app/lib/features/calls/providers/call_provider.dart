import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/call_model.dart';
import '../../../services/coin_service.dart';

import '../../auth/providers/auth_provider.dart';

class CallState {
  final String? callId;
  final String? channelName;
  final String? token;
  final int? uid;
  final bool isConnected;
  final bool isMuted;
  final bool isVideoEnabled;
  final bool isSpeakerOn;
  final int durationSeconds;
  final String? error;

  CallState({
    this.callId,
    this.channelName,
    this.token,
    this.uid,
    this.isConnected = false,
    this.isMuted = false,
    this.isVideoEnabled = true,
    this.isSpeakerOn = false,
    this.durationSeconds = 0,
    this.error,
  });

  CallState copyWith({
    String? callId,
    String? channelName,
    String? token,
    int? uid,
    bool? isConnected,
    bool? isMuted,
    bool? isVideoEnabled,
    bool? isSpeakerOn,
    int? durationSeconds,
    String? error,
  }) {
    return CallState(
      callId: callId ?? this.callId,
      channelName: channelName ?? this.channelName,
      token: token ?? this.token,
      uid: uid ?? this.uid,
      isConnected: isConnected ?? this.isConnected,
      isMuted: isMuted ?? this.isMuted,
      isVideoEnabled: isVideoEnabled ?? this.isVideoEnabled,
      isSpeakerOn: isSpeakerOn ?? this.isSpeakerOn,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      error: error,
    );
  }

  String get formattedDuration {
    final minutes = durationSeconds ~/ 60;
    final seconds = durationSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}

class CallNotifier extends StateNotifier<CallState> {
  final FirebaseFirestore _firestore;
  final FirebaseAuth _auth;
  final CoinService _coinService;
  Timer? _durationTimer;
  Timer? _coinDeductionTimer;
  StreamSubscription<DocumentSnapshot>? _callSubscription;
  int _coinsDeducted = 0;
  // _ratePerMinute retained for pre-call balance-check display only
  // Actual rate is fetched server-side by deductCallCoins Cloud Function
  int _ratePerMinute = 0;
  String? _currentHostId;

  CallNotifier(this._firestore, this._auth, this._coinService)
      : super(CallState());

  Future<String?> initiateCall(
      String hostId, String callType, int ratePerMinute) async {
    final user = _auth.currentUser;
    if (user == null) return 'Not authenticated';

    try {
      final userDoc = await _firestore
          .collection(AppConstants.usersCollection)
          .doc(user.uid)
          .get();
      final currentCoins = (userDoc.data()?['coinBalance'] as num?)?.toInt() ??
          (userDoc.data()?['coins'] as num?)?.toInt() ??
          0;

      if (currentCoins < ratePerMinute) {
        return 'insufficient_coins';
      }

      // Store for display only — actual deduction rate comes from server
      _ratePerMinute = ratePerMinute;
      _currentHostId = hostId;
      final callId =
          '${user.uid}_${hostId}_${DateTime.now().millisecondsSinceEpoch}';
      final channelName = 'friendoo_${callId.substring(0, 20)}';
      final uid = user.uid.hashCode.abs();

      final callData = CallModel(
        id: callId,
        userId: user.uid,
        hostId: hostId,
        type: callType,
        status: AppConstants.callStatusRinging,
        startTime: DateTime.now(),
        durationSeconds: 0,
        coinsDeducted: 0,
        agoraChannel: channelName,
        createdAt: DateTime.now(),
      );

      await _firestore
          .collection(AppConstants.callsCollection)
          .doc(callId)
          .set(callData.toFirestore());

      // Listen for call status updates
      _callSubscription = _firestore
          .collection(AppConstants.callsCollection)
          .doc(callId)
          .snapshots()
          .listen((doc) {
        if (doc.exists) {
          final data = doc.data();
          if (data?['status'] == AppConstants.callStatusOngoing &&
              !state.isConnected) {
            _onCallConnected();
          }
        }
      });

      state = state.copyWith(
        callId: callId,
        channelName: channelName,
        uid: uid,
      );

      return null;
    } catch (e) {
      return e.toString();
    }
  }

  void _onCallConnected() {
    state = state.copyWith(isConnected: true);
    _startDurationTimer();
    _startCoinDeductionTimer();
  }

  void _startDurationTimer() {
    _durationTimer?.cancel();
    _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      state = state.copyWith(durationSeconds: state.durationSeconds + 1);
    });
  }

  void _startCoinDeductionTimer() {
    _coinDeductionTimer?.cancel();
    _coinDeductionTimer = Timer.periodic(const Duration(minutes: 1), (_) async {
      await _deductCoinsForCall();
    });
  }

  Future<void> _deductCoinsForCall() async {
    final user = _auth.currentUser;
    if (user == null || state.callId == null) return;

    try {
      // Route through Cloud Function — never write coins directly from client
      await _coinService.deductCoins(
        user.uid,
        _ratePerMinute,
        hostId: _currentHostId ?? '',
        callId: state.callId,
        description: 'Call charge — ${state.callId}',
      );
      _coinsDeducted += _ratePerMinute;
    } on Exception catch (e) {
      final msg = e.toString();
      if (msg.contains('failed-precondition') || msg.contains('Insufficient')) {
        await endCall('coins_exhausted');
      }
      // Other errors: log but don't stop the call
    }
  }

  Future<void> acceptCall() async {
    if (state.callId == null) return;

    await _firestore
        .collection(AppConstants.callsCollection)
        .doc(state.callId)
        .update({'status': AppConstants.callStatusOngoing});

    _onCallConnected();
  }

  Future<void> endCall(String reason) async {
    _durationTimer?.cancel();
    _coinDeductionTimer?.cancel();
    _callSubscription?.cancel();

    if (state.callId != null) {
      await _firestore
          .collection(AppConstants.callsCollection)
          .doc(state.callId)
          .update({
        'status': reason == 'coins_exhausted'
            ? AppConstants.callStatusFailed
            : AppConstants.callStatusEnded,
        'endTime': FieldValue.serverTimestamp(),
        'durationSeconds': state.durationSeconds,
        'coinsDeducted': _coinsDeducted,
      });
    }

    state = CallState();
    _coinsDeducted = 0;
  }

  void toggleMute() {
    state = state.copyWith(isMuted: !state.isMuted);
  }

  void toggleVideo() {
    state = state.copyWith(isVideoEnabled: !state.isVideoEnabled);
  }

  void toggleSpeaker() {
    state = state.copyWith(isSpeakerOn: !state.isSpeakerOn);
  }

  @override
  void dispose() {
    _durationTimer?.cancel();
    _coinDeductionTimer?.cancel();
    _callSubscription?.cancel();
    super.dispose();
  }
}

final callNotifierProvider =
    StateNotifierProvider<CallNotifier, CallState>((ref) {
  final firestore = ref.watch(firestoreProvider);
  final auth = ref.watch(firebaseAuthProvider);
  final coinService = CoinService();
  return CallNotifier(firestore, auth, coinService);
});
