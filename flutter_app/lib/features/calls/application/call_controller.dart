import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

import '../../../core/models/friendoo_models.dart';
import '../../../core/services/permission_service.dart';
import '../../wallet/data/wallet_repository.dart';
import '../data/call_repository.dart';
import '../data/rtc_audio_service.dart';

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
  bool _isJoiningAudio = false;

  @override
  FutureOr<CallSession?> build() {
    ref.onDispose(() {
      _subscription?.cancel();
      _heartbeatTimer?.cancel();
      ref.read(rtcAudioServiceProvider).dispose();
    });
    return null;
  }

  Future<void> initiateAudioCall(String hostId, {BuildContext? context}) async {
    ref.read(rtcProviderTypeProvider.notifier).state = RtcProviderType.videosdk;
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      // 1. Minimum 15 coins check
      final wallet = ref.read(walletStreamProvider).asData?.value;
      if (wallet != null && wallet.coinBalance < 15) {
        throw Exception(
          'Minimum 15 coins required to make a call. Please recharge your wallet.',
        );
      }

      await ref.read(permissionServiceProvider).requestBluetoothAudio();
      if (context != null && !context.mounted) {
        throw Exception('Call screen is no longer available.');
      }
      final micGranted = await ref
          .read(permissionServiceProvider)
          .requestMicrophone(context: context);
      if (!micGranted) {
        throw Exception('Microphone permission is required for voice calls.');
      }

      final call = await ref
          .read(callRepositoryProvider)
          .initiateAudioCall(hostId);
      _callStartTime = null; // Billing timer begins once accepted
      _joinedCallId = null;
      _watch(call.id);
      return call;
    });
  }

  Future<void> acceptIncomingCall(
    String callId, {
    BuildContext? context,
  }) async {
    ref.read(rtcProviderTypeProvider.notifier).state = RtcProviderType.videosdk;
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await ref.read(permissionServiceProvider).requestBluetoothAudio();
      if (context != null && !context.mounted) {
        throw Exception('Call screen is no longer available.');
      }
      final micGranted = await ref
          .read(permissionServiceProvider)
          .requestMicrophone(context: context);
      if (!micGranted) {
        throw Exception(
          'Microphone permission is required to attend voice calls.',
        );
      }

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
    await ref.read(rtcAudioServiceProvider).setMuted(nextMuted);
  }

  Future<void> toggleSpeaker() async {
    final currentlySpeaker = ref.read(callSpeakerStateProvider);
    final nextSpeaker = !currentlySpeaker;
    ref.read(callSpeakerStateProvider.notifier).state = nextSpeaker;
    await ref.read(rtcAudioServiceProvider).setSpeakerphone(nextSpeaker);
  }

  Future<void> toggleSpeakerphone() => toggleSpeaker();

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

  /// Ends the current call only after the server accepts the state transition.
  /// A failed request deliberately leaves the stream, RTC session, and UI state
  /// intact so the user can retry instead of silently abandoning a live call.
  Future<void> endActiveCall({String reason = 'normal_hangup'}) async {
    final current = state.asData?.value;
    if (current == null) return;

    await ref.read(callRepositoryProvider).endCall(current.id, reason: reason);

    final durationSec = _callStartTime != null
        ? DateTime.now().difference(_callStartTime!).inSeconds
        : 0;
    final bool wasGracePeriod = durationSec <= 5;
    final int billedMinutes = wasGracePeriod
        ? 0
        : (durationSec / 60).ceil().clamp(1, 999);
    final int totalCoins = billedMinutes * current.ratePerMinute;

    ref
        .read(lastEndedCallSummaryProvider.notifier)
        .state = LastEndedCallSummary(
      callId: current.id,
      hostName:
          'Host #${current.hostId.length >= 4 ? current.hostId.substring(0, 4) : current.hostId}',
      durationSeconds: durationSec,
      coinsDeducted: totalCoins,
      billedMinutes: billedMinutes,
      wasGracePeriod: wasGracePeriod,
    );

    await _stopWatchingAndLeave();
    ref.invalidate(walletStreamProvider);
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
              _callStartTime ??= DateTime.now();
              unawaited(_joinAudio(call));
              _startHeartbeat(call.id);
            }

            if (_isTerminal(call.status)) {
              // If remote party ended the call, record the summary receipt
              if (ref.read(lastEndedCallSummaryProvider) == null &&
                  _callStartTime != null) {
                final durationSec = DateTime.now()
                    .difference(_callStartTime!)
                    .inSeconds;
                final wasGracePeriod = durationSec <= 5;
                final billedMinutes = wasGracePeriod
                    ? 0
                    : (durationSec / 60).ceil().clamp(1, 999);
                ref
                    .read(lastEndedCallSummaryProvider.notifier)
                    .state = LastEndedCallSummary(
                  callId: call.id,
                  hostName:
                      'Host #${call.hostId.length >= 4 ? call.hostId.substring(0, 4) : call.hostId}',
                  durationSeconds: durationSec,
                  coinsDeducted: billedMinutes * call.ratePerMinute,
                  billedMinutes: billedMinutes,
                  wasGracePeriod: wasGracePeriod,
                );
              }
              unawaited(_stopWatchingAndLeave());
              state = const AsyncData(null);
            }
          },
          onError: (Object error, StackTrace stackTrace) {
            // Retain call state; avoid throwing transient stream disconnects to UI
          },
        );
  }

  void _startHeartbeat(String callId) {
    if (_heartbeatTimer != null) return;
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 7), (_) {
      unawaited(ref.read(callRepositoryProvider).pingHeartbeat(callId));
    });
  }

  Future<void> _joinAudio(CallSession call) async {
    if (call.callType != CallType.audio ||
        _joinedCallId == call.id ||
        _isJoiningAudio) {
      return;
    }
    _isJoiningAudio = true;
    try {
      final providerType = ref.read(rtcProviderTypeProvider);
      if (providerType == RtcProviderType.videosdk) {
        final credentials = await ref
            .read(callRepositoryProvider)
            .getVideoSdkCredentials(call.id);
        try {
          await ref
              .read(rtcAudioServiceProvider)
              .join(
                appIdOrToken: credentials.apiKey,
                token: credentials.token,
                channelOrRoomId: credentials.roomId,
                uid: credentials.participantId,
              );
        } catch (_) {
          // VideoSDK is primary, but a failed token/join must not strand the
          // call. Recreate the service with Agora credentials for this call.
          ref.read(rtcProviderTypeProvider.notifier).state =
              RtcProviderType.agora;
          final agora = await ref
              .read(callRepositoryProvider)
              .getAgoraCredentials(call.id);
          await ref
              .read(rtcAudioServiceProvider)
              .join(
                appIdOrToken: agora.appId,
                token: agora.token,
                channelOrRoomId: agora.channel,
                uid: agora.uid.toString(),
              );
        }
      } else {
        final credentials = await ref
            .read(callRepositoryProvider)
            .getAgoraCredentials(call.id);
        await ref
            .read(rtcAudioServiceProvider)
            .join(
              appIdOrToken: credentials.appId,
              token: credentials.token,
              channelOrRoomId: credentials.channel,
              uid: credentials.uid.toString(),
            );
      }
      _joinedCallId = call.id;
    } catch (_) {
      _joinedCallId = null;
      rethrow;
    } finally {
      _isJoiningAudio = false;
    }
  }

  Future<void> _stopWatchingAndLeave() async {
    await _subscription?.cancel();
    _subscription = null;
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    _joinedCallId = null;
    _callStartTime = null;
    _isJoiningAudio = false;
    ref.read(callMuteStateProvider.notifier).state = false;
    ref.read(callSpeakerStateProvider.notifier).state = true;
    await ref.read(rtcAudioServiceProvider).dispose();
  }

  bool _isTerminal(CallStatus status) =>
      status == CallStatus.ended ||
      status == CallStatus.rejected ||
      status == CallStatus.missed;
}
