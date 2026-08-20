import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

import '../../../core/models/friendoo_models.dart';
import '../../../core/supabase/supabase_provider.dart';
import '../data/agora_audio_service.dart';
import '../data/call_repository.dart';

final agoraAudioServiceProvider = Provider<AgoraAudioService>((ref) {
  final service = AgoraAudioService();
  ref.onDispose(service.dispose);
  return service;
});

final callMuteStateProvider = StateProvider<bool>((ref) => false);
final callSpeakerStateProvider = StateProvider<bool>((ref) => true);

class LastEndedCallSummary {
  const LastEndedCallSummary({
    required this.callId,
    required this.hostName,
    required this.durationSeconds,
    required this.coinsDeducted,
    required this.billedMinutes,
    required this.wasGracePeriod,
  });

  final String callId;
  final String hostName;
  final int durationSeconds;
  final int coinsDeducted;
  final int billedMinutes;
  final bool wasGracePeriod;
}

final lastEndedCallSummaryProvider = StateProvider<LastEndedCallSummary?>(
  (ref) => null,
);

final activeCallProvider =
    AsyncNotifierProvider<ActiveCallController, CallSession?>(
      ActiveCallController.new,
    );

class ActiveCallController extends AsyncNotifier<CallSession?> {
  StreamSubscription<CallSession>? _subscription;
  Timer? _heartbeatTimer;
  String? _joinedCallId;
  DateTime? _callStartTime;

  @override
  FutureOr<CallSession?> build() {
    ref.onDispose(() {
      _subscription?.cancel();
      _heartbeatTimer?.cancel();
    });
    return null;
  }

  Future<void> initiateAudioCall(String hostId) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final call = await ref
          .read(callRepositoryProvider)
          .initiateAudioCall(hostId);
      _callStartTime = DateTime.now();
      _watch(call.id);
      return call;
    });
  }

  Future<void> acceptIncomingCall(String callId) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final call = await ref.read(callRepositoryProvider).acceptCall(callId);
      _callStartTime = DateTime.now();
      _watch(call.id);
      await _joinAudio(call);
      return call;
    });
  }

  Future<void> toggleMute() async {
    final currentlyMuted = ref.read(callMuteStateProvider);
    final nextMuted = !currentlyMuted;
    ref.read(callMuteStateProvider.notifier).state = nextMuted;
    await ref.read(agoraAudioServiceProvider).setMuted(nextMuted);
  }

  Future<void> toggleSpeaker() async {
    final currentlySpeaker = ref.read(callSpeakerStateProvider);
    final nextSpeaker = !currentlySpeaker;
    ref.read(callSpeakerStateProvider.notifier).state = nextSpeaker;
    await ref.read(agoraAudioServiceProvider).setSpeakerphone(nextSpeaker);
  }

  Future<void> reportAndEndActiveCall({
    required String reason,
    String? details,
  }) async {
    final call = state.asData?.value;
    if (call == null) return;

    await ref
        .read(callRepositoryProvider)
        .submitCallReport(callId: call.id, reason: reason, details: details);

    await endActiveCall(reason: 'user_reported');
  }

  Future<void> endActiveCall({String reason = 'user_hangup'}) async {
    final call = state.asData?.value;
    if (call == null) return;

    final durationSec = _callStartTime != null
        ? DateTime.now().difference(_callStartTime!).inSeconds
        : 0;

    // 5-second Grace Period Rule:
    // If call ended within 5 seconds -> 0 coins billed (Free cancellation/silent host)
    // If call > 5 seconds -> billed per minute (e.g. 10 sec = 1 min charged = 5 coins)
    final bool wasGracePeriod = durationSec <= 5;
    final int billedMinutes = wasGracePeriod
        ? 0
        : (durationSec / 60).ceil().clamp(1, 999);
    final int totalCoins = billedMinutes * call.ratePerMinute;

    ref
        .read(lastEndedCallSummaryProvider.notifier)
        .state = LastEndedCallSummary(
      callId: call.id,
      hostName:
          'Host #${call.hostId.length >= 4 ? call.hostId.substring(0, 4) : call.hostId}',
      durationSeconds: durationSec,
      coinsDeducted: totalCoins,
      billedMinutes: billedMinutes,
      wasGracePeriod: wasGracePeriod,
    );

    await ref.read(callRepositoryProvider).endCall(call.id, reason: reason);
    await _stopWatchingAndLeave();
    state = const AsyncData(null);
  }

  void _watch(String callId) {
    _subscription?.cancel();
    _subscription = ref
        .read(callRepositoryProvider)
        .watchCall(callId)
        .listen(
          (call) {
            state = AsyncData(call);
            if (call.status == CallStatus.accepted ||
                call.status == CallStatus.active) {
              unawaited(_joinAudio(call));
              _startHeartbeat(call.id);
            }
            if (_isTerminal(call.status)) {
              unawaited(_stopWatchingAndLeave());
              state = const AsyncData(null);
            }
          },
          onError: (Object error, StackTrace stackTrace) {
            state = AsyncError(error, stackTrace);
          },
        );
  }

  void _startHeartbeat(String callId) {
    if (_heartbeatTimer != null) return;
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      unawaited(ref.read(callRepositoryProvider).pingHeartbeat(callId));
    });
  }

  Future<void> _joinAudio(CallSession call) async {
    if (call.callType != CallType.audio || _joinedCallId == call.id) return;
    _joinedCallId = call.id;
    try {
      final credentials = await ref
          .read(callRepositoryProvider)
          .getAgoraCredentials(call.id);
      await ref
          .read(agoraAudioServiceProvider)
          .join(
            appId: credentials.appId,
            token: credentials.token,
            channel: credentials.channel,
            uid: credentials.uid,
          );
    } catch (_) {
      _joinedCallId = null;
      rethrow;
    }
  }

  Future<void> _stopWatchingAndLeave() async {
    await _subscription?.cancel();
    _subscription = null;
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    _joinedCallId = null;
    _callStartTime = null;
    ref.read(callMuteStateProvider.notifier).state = false;
    ref.read(callSpeakerStateProvider.notifier).state = true;
    await ref.read(agoraAudioServiceProvider).dispose();
  }

  bool _isTerminal(CallStatus status) =>
      status == CallStatus.ended ||
      status == CallStatus.rejected ||
      status == CallStatus.missed;
}
