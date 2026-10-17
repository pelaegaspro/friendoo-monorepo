import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/friendoo_models.dart';
import '../../discover/presentation/desi_avatar.dart';
import '../../profile/data/profile_repository.dart';
import '../../wallet/data/wallet_repository.dart';
import '../../wallet/presentation/coin_packages_page.dart';
import '../application/call_controller.dart';
import '../data/rtc_audio_service.dart';
import 'call_report_bottom_sheet.dart';

class LiveCallOverlay extends ConsumerStatefulWidget {
  const LiveCallOverlay({
    super.key,
    required this.call,
    this.hostName = 'Sara',
    this.isHost,
  });

  final CallSession call;
  final String hostName;
  final bool? isHost;

  @override
  ConsumerState<LiveCallOverlay> createState() => _LiveCallOverlayState();
}

class _LiveCallOverlayState extends ConsumerState<LiveCallOverlay>
    with SingleTickerProviderStateMixin {
  late Timer _timer;
  int _secondsElapsed = 0;
  int? _initialCoinBalance;
  bool _autoEnding = false;

  String? _remoteName;
  String? _remoteAvatarUrl;

  bool get isHostUser {
    if (widget.isHost != null) return widget.isHost!;
    final activeProfile = ProfileRepository.currentActiveProfile;
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    return activeProfile?.isHost == true ||
        activeProfile?.id == widget.call.hostId ||
        currentUserId == widget.call.hostId;
  }

  @override
  void initState() {
    super.initState();
    _loadRemoteProfile();

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      final liveCall =
          ref.read(activeCallProvider).asData?.value ?? widget.call;
      final isCallActive =
          liveCall.status == CallStatus.accepted ||
          liveCall.status == CallStatus.active;

      if (!isCallActive) return;

      final rtcState = ref.read(rtcConnectionStateProvider).asData?.value;
      final isAudioConnected = rtcState == RtcConnectionState.connected;

      // Only advance the elapsed conversation timer once audio is actually connected
      if (!isAudioConnected) return;

      setState(() {
        _secondsElapsed++;
      });

      _checkBalanceLimit();
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  Future<void> _loadRemoteProfile() async {
    try {
      final client = Supabase.instance.client;
      if (isHostUser) {
        // Host sees Caller
        final row = await client
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', widget.call.callerId)
            .maybeSingle();
        if (row != null && mounted) {
          setState(() {
            _remoteName = row['display_name'] as String?;
            _remoteAvatarUrl = row['avatar_url'] as String?;
          });
        }
      } else {
        // Caller sees Host
        final row = await client
            .from('hosts')
            .select('name, avatar_url')
            .eq('id', widget.call.hostId)
            .maybeSingle();
        if (row != null && mounted) {
          setState(() {
            _remoteName = row['name'] as String?;
            _remoteAvatarUrl = row['avatar_url'] as String?;
          });
        }
      }
    } catch (_) {}
  }

  void _checkBalanceLimit() {
    if (isHostUser) return;

    final startCoins = _initialCoinBalance;
    if (startCoins == null) return;
    final rate = widget.call.ratePerMinute > 0 ? widget.call.ratePerMinute : 5;
    final maxSeconds = (startCoins ~/ rate) * 60;
    final remainingSeconds = maxSeconds - _secondsElapsed;

    if (remainingSeconds <= 0 && !_autoEnding) {
      _autoEnding = true;
      ref
          .read(activeCallProvider.notifier)
          .endActiveCall(reason: 'balance_exhausted');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.orange,
          content: Text('Call ended — your coin balance was fully used.'),
        ),
      );
    }
  }

  String _formatTimer(int totalSecs) {
    final clamped = totalSecs < 0 ? 0 : totalSecs;
    final mins = (clamped % 3600) ~/ 60;
    final secs = clamped % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  void _showCallMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF141724),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'Call Options',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.verified_user_rounded,
                      color: Color(0xFF10B981),
                      size: 20,
                    ),
                  ),
                  title: const Text(
                    'Safe & Anonymous Calling',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  subtitle: const Text(
                    'Your real phone number and identity remain 100% private.',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                  ),
                ),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.redAccent.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.flag_rounded,
                      color: Colors.redAccent,
                      size: 20,
                    ),
                  ),
                  title: const Text(
                    'Report Participant',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  subtitle: const Text(
                    'Report inappropriate behavior anonymously',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                  ),
                  onTap: () {
                    Navigator.pop(ctx);
                    CallReportBottomSheet.show(
                      context,
                      callId: widget.call.id,
                      autoEndCall: true,
                    );
                  },
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isMuted = ref.watch(callMuteStateProvider);
    final isSpeaker = ref.watch(callSpeakerStateProvider);
    final isRemoteMuted =
        ref.watch(remoteMuteStateProvider).asData?.value ?? false;
    final wallet = ref.watch(walletStreamProvider).asData?.value;
    final isHost = isHostUser;

    final liveCall = ref.watch(activeCallProvider).asData?.value ?? widget.call;
    final isCallActive =
        liveCall.status == CallStatus.accepted ||
        liveCall.status == CallStatus.active;

    if (_initialCoinBalance == null && wallet != null) {
      _initialCoinBalance = wallet.coinBalance;
    }
    final startingCoins = _initialCoinBalance;
    final rate = widget.call.ratePerMinute > 0 ? widget.call.ratePerMinute : 5;

    final maxSeconds = startingCoins == null
        ? null
        : (startingCoins ~/ rate) * 60;
    final remainingSeconds = maxSeconds == null
        ? null
        : (maxSeconds - _secondsElapsed).clamp(0, maxSeconds);

    final bool isGracePeriod = isCallActive && _secondsElapsed <= 5;
    final int billedMinutes = !isCallActive || isGracePeriod
        ? 0
        : (_secondsElapsed / 60).ceil().clamp(1, 99999);
    final int coinsSpent = billedMinutes * rate;
    final remainingCoins = startingCoins == null
        ? null
        : (startingCoins - coinsSpent).clamp(0, startingCoins);

    final bool isLowBalance =
        !isHost &&
        isCallActive &&
        remainingSeconds != null &&
        remainingSeconds <= 60 &&
        remainingSeconds > 0;

    // Display identity according to role
    final String displayName = isHost
        ? (_remoteName != null && _remoteName!.trim().isNotEmpty
              ? _remoteName!
              : 'You')
        : (_remoteName != null && _remoteName!.trim().isNotEmpty
              ? _remoteName!
              : (widget.hostName.isNotEmpty && widget.hostName != 'Host'
                    ? widget.hostName
                    : 'Sara'));

    final String roleLabel = isHost ? 'User' : 'Host';
    final String targetSeedId = isHost
        ? widget.call.callerId
        : widget.call.hostId;

    // Listen to remote mute state to notify user/host when opposite peer mutes/unmutes
    ref.listen<AsyncValue<bool>>(remoteMuteStateProvider, (previous, next) {
      final wasMuted = previous?.asData?.value ?? false;
      final nowMuted = next.asData?.value ?? false;
      if (wasMuted != nowMuted && mounted) {
        final peerName = isHost ? 'User' : displayName;
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            backgroundColor: nowMuted
                ? const Color(0xFFEF4444)
                : const Color(0xFF10B981),
            duration: const Duration(milliseconds: 2500),
            content: Row(
              children: [
                Icon(
                  nowMuted ? Icons.mic_off_rounded : Icons.mic_rounded,
                  color: Colors.white,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Text(
                  nowMuted
                      ? '$peerName has muted their microphone'
                      : '$peerName unmuted their microphone',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
        );
      }
    });

    final rtcState = ref.watch(rtcConnectionStateProvider).asData?.value;
    final bool isRtcConnected = rtcState == RtcConnectionState.connected;
    final bool isRtcReconnecting =
        isCallActive && rtcState == RtcConnectionState.reconnecting;
    final bool isRtcConnecting =
        isCallActive && !isRtcConnected && !isRtcReconnecting;

    // Connection & Timer String
    final String timeOrStatusString;
    if (isRtcReconnecting) {
      timeOrStatusString = 'Reconnecting...';
    } else if (isRtcConnecting) {
      timeOrStatusString = 'Connecting voice...';
    } else if (isCallActive) {
      timeOrStatusString = _formatTimer(_secondsElapsed);
    } else if (liveCall.status == CallStatus.ringing) {
      timeOrStatusString = isHost ? 'Incoming Call...' : 'Ringing...';
    } else {
      timeOrStatusString = 'Connecting...';
    }

    // Dynamic speaking text matching reference design
    final String speakingStatusText;
    if (isRemoteMuted) {
      speakingStatusText = '$displayName has muted microphone';
    } else if (isRtcReconnecting) {
      speakingStatusText = 'Reconnecting audio...';
    } else if (isRtcConnecting) {
      speakingStatusText = 'Connecting voice channel...';
    } else if (isCallActive) {
      if (isHost) {
        speakingStatusText = 'You are speaking...';
      } else {
        speakingStatusText = '$displayName is speaking...';
      }
    } else if (liveCall.status == CallStatus.ringing) {
      speakingStatusText = isHost
          ? 'Ringing on device...'
          : 'Waiting for $displayName...';
    } else {
      speakingStatusText = 'Establishing secure connection...';
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0D0F18),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0C0E17), Color(0xFF16192B), Color(0xFF0B0D16)],
            stops: [0.0, 0.45, 1.0],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Column(
              children: [
                // 1. TOP HEADER: Friendoo Logo + Chevron/Menu
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const FriendooCallLogo(),
                    InkWell(
                      onTap: () => _showCallMenu(context),
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.08),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.keyboard_arrow_down_rounded,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ),
                  ],
                ),

                const Spacer(flex: 3),

                // 2. CENTER PROMINENT AVATAR WITH ROLE-AWARE GLOWING RING & MUTE BADGE
                Stack(
                  alignment: Alignment.bottomCenter,
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 154,
                      height: 154,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isHost
                              ? const Color(0xFF818CF8).withValues(alpha: 0.85)
                              : const Color(0xFFFF2A85).withValues(alpha: 0.85),
                          width: 3.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: isHost
                                ? const Color(0xFF818CF8).withValues(alpha: 0.40)
                                : const Color(0xFFFF2A85).withValues(alpha: 0.42),
                            blurRadius: 32,
                            spreadRadius: 4,
                          ),
                          BoxShadow(
                            color: isHost
                                ? const Color(0xFF6366F1).withValues(alpha: 0.22)
                                : const Color(0xFFE11D48).withValues(alpha: 0.25),
                            blurRadius: 54,
                            spreadRadius: 8,
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child:
                            _remoteAvatarUrl != null &&
                                _remoteAvatarUrl!.trim().startsWith('http')
                            ? Image.network(
                                _remoteAvatarUrl!,
                                width: 154,
                                height: 154,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => FriendooAvatar(
                                  size: 154,
                                  seed: targetSeedId,
                                  gender: isHost
                                      ? DesiGender.male
                                      : DesiGender.female,
                                  role: isHost ? 'user' : 'host',
                                ),
                              )
                            : FriendooAvatar(
                                size: 154,
                                seed: targetSeedId,
                                gender: isHost
                                    ? DesiGender.male
                                    : DesiGender.female,
                                role: isHost ? 'user' : 'host',
                              ),
                      ),
                    ),
                    if (isRemoteMuted)
                      Positioned(
                        bottom: -10,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEF4444),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFEF4444).withValues(alpha: 0.5),
                                blurRadius: 10,
                                spreadRadius: 1,
                                offset: const Offset(0, 3),
                              ),
                            ],
                            border: Border.all(color: Colors.white, width: 1.5),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.mic_off_rounded,
                                color: Colors.white,
                                size: 14,
                              ),
                              const SizedBox(width: 5),
                              Text(
                                '${isHost ? 'User' : 'Host'} Muted',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 22),

                // 3. IDENTITY: NAME + VERIFIED BADGE (IF HOST)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      displayName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                    ),
                    if (!isHost) ...[
                      const SizedBox(width: 6),
                      const Icon(
                        Icons.verified_rounded,
                        color: Color(0xFFFF2A85),
                        size: 18,
                      ),
                    ],
                  ],
                ),

                const SizedBox(height: 4),

                // 4. ROLE LABEL: "Host" or "User"
                Text(
                  roleLabel,
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),

                const SizedBox(height: 6),

                // 5. LIVE CALL DURATION: "00:12"
                Text(
                  timeOrStatusString,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),

                const Spacer(flex: 2),

                // 6. ANIMATED AUDIO WAVEFORM
                AnimatedAudioWaveform(
                  isActive: isCallActive && isRtcConnected && !isRemoteMuted,
                  barCount: 34,
                  primaryColor: const Color(0xFFFF2A85),
                  secondaryColor: const Color(0xFFC084FC),
                ),

                const SizedBox(height: 18),

                // 7. SPEAKING STATUS PILL CAPSULE
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: isRemoteMuted
                        ? const Color(0xFFEF4444).withValues(alpha: 0.18)
                        : const Color(0xFF1B1E2E).withValues(alpha: 0.85),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isRemoteMuted
                          ? const Color(0xFFEF4444).withValues(alpha: 0.6)
                          : Colors.white.withValues(alpha: 0.08),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isRemoteMuted
                            ? Icons.mic_off_rounded
                            : Icons.graphic_eq_rounded,
                        color: isRemoteMuted
                            ? const Color(0xFFEF4444)
                            : const Color(0xFFFF2A85),
                        size: 16,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        speakingStatusText,
                        style: TextStyle(
                          color: isRemoteMuted
                              ? const Color(0xFFFCA5A5)
                              : Colors.white,
                          fontSize: 13,
                          fontWeight: isRemoteMuted
                              ? FontWeight.w700
                              : FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),

                // 8. CONTEXTUAL RECHARGE OR GRACE PERIOD PILL (Only when relevant)
                if (!isHost && isLowBalance) ...[
                  const SizedBox(height: 14),
                  InkWell(
                    onTap: () =>
                        CoinPackagesPage.push(context, isCallRecharge: true),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.redAccent.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: Colors.redAccent.withValues(alpha: 0.6),
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '⚠️ Low balance · ',
                            style: TextStyle(
                              color: Colors.redAccent,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Recharge Now ➔',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ] else if (!isHost && isGracePeriod) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: Colors.green.withValues(alpha: 0.6),
                      ),
                    ),
                    child: Text(
                      '5s Grace Period (${5 - _secondsElapsed}s left) · Free',
                      style: const TextStyle(
                        color: Colors.greenAccent,
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ] else if (isHost) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFF10B981).withValues(alpha: 0.4),
                      ),
                    ),
                    child: const Text(
                      'Host Session · Verified Calling Active',
                      style: TextStyle(
                        color: Color(0xFF10B981),
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ] else ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      remainingCoins == null
                          ? '$rate coins/min'
                          : '$remainingCoins Coins · $rate coins/min',
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],

                const Spacer(flex: 3),

                // 9. BOTTOM CONTROLS: MUTE, END CALL (LARGE RED), SPEAKER
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // MUTE BUTTON
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        InkWell(
                          onTap: () => ref
                              .read(activeCallProvider.notifier)
                              .toggleMute(),
                          borderRadius: BorderRadius.circular(32),
                          child: Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isMuted
                                  ? Colors.redAccent.withValues(alpha: 0.35)
                                  : Colors.white.withValues(alpha: 0.10),
                              border: Border.all(
                                color: isMuted
                                    ? Colors.redAccent
                                    : Colors.white.withValues(alpha: 0.15),
                                width: 1.2,
                              ),
                            ),
                            child: Icon(
                              isMuted
                                  ? Icons.mic_off_rounded
                                  : Icons.mic_rounded,
                              color: Colors.white,
                              size: 26,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          isMuted ? 'Muted' : 'Mute',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),

                    // END CALL BUTTON (LARGE RED CIRCLE WITH GLOW)
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        InkWell(
                          onTap: () => ref
                              .read(activeCallProvider.notifier)
                              .endActiveCall(reason: 'user_hangup'),
                          borderRadius: BorderRadius.circular(39),
                          child: Container(
                            width: 78,
                            height: 78,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFFFF2D55),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFFF2D55)
                                      .withValues(alpha: 0.45),
                                  blurRadius: 26,
                                  spreadRadius: 3,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.call_end_rounded,
                              color: Colors.white,
                              size: 36,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'End Call',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),

                    // SPEAKER BUTTON
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        InkWell(
                          onTap: () => ref
                              .read(activeCallProvider.notifier)
                              .toggleSpeakerphone(),
                          borderRadius: BorderRadius.circular(32),
                          child: Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isSpeaker
                                  ? const Color(0xFF6366F1)
                                        .withValues(alpha: 0.3)
                                  : Colors.white.withValues(alpha: 0.10),
                              border: Border.all(
                                color: isSpeaker
                                    ? const Color(0xFF818CF8)
                                    : Colors.white.withValues(alpha: 0.15),
                                width: 1.2,
                              ),
                            ),
                            child: Icon(
                              isSpeaker
                                  ? Icons.volume_up_rounded
                                  : Icons.volume_down_rounded,
                              color: Colors.white,
                              size: 26,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Speaker',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// The branded Friendoo Logo with a cute pink heart dot
class FriendooCallLogo extends StatelessWidget {
  const FriendooCallLogo({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const Text(
          'Friend',
          style: TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
        Transform.translate(
          offset: const Offset(0, -3),
          child: const Icon(
            Icons.favorite_rounded,
            color: Color(0xFFFF2A85),
            size: 13,
          ),
        ),
        const Text(
          'oo',
          style: TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
      ],
    );
  }
}

/// Dynamic Animated Audio Waveform with Gaussian envelope and oscillating bars
class AnimatedAudioWaveform extends StatefulWidget {
  const AnimatedAudioWaveform({
    super.key,
    required this.isActive,
    this.barCount = 34,
    this.primaryColor = const Color(0xFFFF2A85),
    this.secondaryColor = const Color(0xFFC084FC),
  });

  final bool isActive;
  final int barCount;
  final Color primaryColor;
  final Color secondaryColor;

  @override
  State<AnimatedAudioWaveform> createState() => _AnimatedAudioWaveformState();
}

class _AnimatedAudioWaveformState extends State<AnimatedAudioWaveform>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: const Size(260, 42),
          painter: _WaveformPainter(
            progress: _controller.value,
            isActive: widget.isActive,
            barCount: widget.barCount,
            primaryColor: widget.primaryColor,
            secondaryColor: widget.secondaryColor,
          ),
        );
      },
    );
  }
}

class _WaveformPainter extends CustomPainter {
  _WaveformPainter({
    required this.progress,
    required this.isActive,
    required this.barCount,
    required this.primaryColor,
    required this.secondaryColor,
  });

  final double progress;
  final bool isActive;
  final int barCount;
  final Color primaryColor;
  final Color secondaryColor;

  @override
  void paint(Canvas canvas, Size size) {
    final barWidth = (size.width / (barCount * 1.6)).clamp(2.5, 4.0);
    final totalSpacing = size.width - (barCount * barWidth);
    final gap = totalSpacing / (barCount - 1);

    for (int i = 0; i < barCount; i++) {
      final normX = i / (barCount - 1);
      final distFromCenter = (normX - 0.5).abs() * 2.0;
      final bellFactor = math.exp(-distFromCenter * distFromCenter * 2.5);

      final wave1 = math.sin((normX * 3.2 - progress) * 2 * math.pi);
      final wave2 = math.cos((normX * 5.2 + progress * 1.6) * 2 * math.pi);
      final combinedWave = wave1 * 0.65 + wave2 * 0.35;

      double height;
      if (isActive) {
        final dynamicFactor = 0.5 + 0.5 * combinedWave;
        height = 4.0 + (size.height - 6.0) * bellFactor * dynamicFactor;
      } else {
        final idleBreath = 0.7 + 0.3 * math.sin(progress * 2 * math.pi);
        height = 3.0 + 10.0 * bellFactor * idleBreath;
      }
      height = height.clamp(3.0, size.height);

      final left = i * (barWidth + gap);
      final top = (size.height - height) / 2;

      final color = Color.lerp(
        primaryColor,
        secondaryColor,
        (normX * 1.4).clamp(0.0, 1.0),
      )!.withValues(alpha: (0.35 + 0.65 * bellFactor).clamp(0.2, 1.0));

      final paint = Paint()
        ..color = color
        ..style = PaintingStyle.fill;

      final rect = RRect.fromRectAndRadius(
        Rect.fromLTWH(left, top, barWidth, height),
        Radius.circular(barWidth / 2),
      );
      canvas.drawRRect(rect, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _WaveformPainter oldDelegate) => true;
}
