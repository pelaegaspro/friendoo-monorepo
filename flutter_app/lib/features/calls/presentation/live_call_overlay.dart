import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/friendoo_models.dart';
import '../../../core/widgets/apple_pressable.dart';
import '../../discover/presentation/desi_avatar.dart';
import '../../profile/data/profile_repository.dart';
import '../../wallet/data/wallet_repository.dart';
import '../../wallet/presentation/coin_packages_page.dart';
import '../application/call_controller.dart';
import '../data/rtc_audio_service.dart';
import 'call_gift_sheet.dart';
import 'call_icebreakers_sheet.dart';
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
  int? _lastRecordedWalletCoins;
  bool _hasWarnedLowBalance = false;
  bool _autoEnding = false;

  String? _remoteName;
  String? _remoteAvatarUrl;
  String? _activeIcebreaker;
  CallGiftItem? _recentGiftSent;
  Timer? _giftAnimationTimer;

  void _onGiftSent(CallGiftItem gift) {
    setState(() => _recentGiftSent = gift);
    _giftAnimationTimer?.cancel();
    _giftAnimationTimer = Timer(const Duration(seconds: 4), () {
      if (mounted) {
        setState(() => _recentGiftSent = null);
      }
    });
  }

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

      setState(() {
        _secondsElapsed++;
      });

      _checkBalanceLimit();
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    _giftAnimationTimer?.cancel();
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

    if (remainingSeconds <= 60 &&
        remainingSeconds > 0 &&
        !_hasWarnedLowBalance) {
      _hasWarnedLowBalance = true;
      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            backgroundColor: const Color(0xFFE11D48),
            duration: const Duration(seconds: 6),
            action: SnackBarAction(
              label: 'TOP UP',
              textColor: Colors.white,
              onPressed: () =>
                  CoinPackagesPage.push(context, isCallRecharge: true),
            ),
            content: const Row(
              children: [
                Icon(
                  Icons.hourglass_bottom_rounded,
                  color: Colors.white,
                  size: 20,
                ),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '⏳ 1 minute remaining! Tap Top Up to stay connected.',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      }
    }

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
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
              decoration: BoxDecoration(
                color: const Color(0xFF131626).withValues(alpha: 0.92),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                border: Border(
                  top: BorderSide(
                    color: Colors.white.withValues(alpha: 0.16),
                    width: 0.85,
                  ),
                ),
              ),
              child: SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 40,
                      height: 5,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.28),
                        borderRadius: BorderRadius.circular(2.5),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Call Options',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.4,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ListTile(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      tileColor: Colors.white.withValues(alpha: 0.04),
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withValues(alpha: 0.18),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.verified_user_rounded,
                          color: Color(0xFF10B981),
                          size: 20,
                        ),
                      ),
                      title: const Text(
                        'Private voice call',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                        ),
                      ),
                      subtitle: const Text(
                        'Your phone number is not shared with the other caller.',
                        style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                      ),
                    ),
                    const SizedBox(height: 10),
                    ListTile(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      tileColor: Colors.white.withValues(alpha: 0.04),
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.redAccent.withValues(alpha: 0.18),
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
                          fontSize: 15,
                        ),
                      ),
                      subtitle: const Text(
                        'Report inappropriate behavior or money solicitation anonymously',
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
                    const SizedBox(height: 12),
                  ],
                ),
              ),
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

    if (wallet != null) {
      if (_initialCoinBalance == null) {
        _initialCoinBalance = wallet.coinBalance;
        _lastRecordedWalletCoins = wallet.coinBalance;
      } else if (_lastRecordedWalletCoins != null &&
          wallet.coinBalance > _lastRecordedWalletCoins!) {
        final added = wallet.coinBalance - _lastRecordedWalletCoins!;
        _initialCoinBalance = _initialCoinBalance! + added;
        _lastRecordedWalletCoins = wallet.coinBalance;
        _autoEnding = false;
        _hasWarnedLowBalance = false;
      }
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
              : 'User')
        : (_remoteName != null && _remoteName!.trim().isNotEmpty
              ? _remoteName!
              : (widget.hostName.isNotEmpty && widget.hostName != 'Host'
                    ? widget.hostName
                    : 'Sara'));

    final String roleLabel = isHost ? 'Caller' : 'Host';
    final String targetSeedId = isHost
        ? widget.call.callerId
        : widget.call.hostId;

    // Listen to remote mute state to notify user/host when opposite peer mutes/unmutes
    ref.listen<AsyncValue<bool>>(remoteMuteStateProvider, (previous, next) {
      final wasMuted = previous?.asData?.value ?? false;
      final nowMuted = next.asData?.value ?? false;
      if (wasMuted != nowMuted && mounted) {
        final peerName = isHost ? 'Caller' : displayName;
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
    final rtcLatency = ref.watch(rtcLatencyProvider).asData?.value;
    final bool isRtcConnected = rtcState == RtcConnectionState.connected;
    final bool isRtcReconnecting =
        isCallActive && rtcState == RtcConnectionState.reconnecting;
    final bool isRtcConnecting =
        isCallActive && !isRtcConnected && !isRtcReconnecting;

    // Connection & Timer String
    final String timeOrStatusString;
    if (isCallActive) {
      timeOrStatusString = _formatTimer(_secondsElapsed);
    } else if (isRtcReconnecting) {
      timeOrStatusString = 'Reconnecting...';
    } else if (isRtcConnecting) {
      timeOrStatusString = 'Connecting voice...';
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
      speakingStatusText = isHost
          ? 'Microphone live (HD Voice)'
          : '$displayName is speaking...';
    } else if (liveCall.status == CallStatus.ringing) {
      speakingStatusText = isHost
          ? 'Ringing on device...'
          : 'Waiting for $displayName...';
    } else {
      speakingStatusText = 'Establishing secure connection...';
    }

    return Scaffold(
      backgroundColor: const Color(0xFF07090E),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF07090E), Color(0xFF111422), Color(0xFF07090E)],
            stops: [0.0, 0.48, 1.0],
          ),
        ),
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final double maxHeight = constraints.maxHeight;
              final bool isCompact = maxHeight < 700;
              final bool isVeryCompact = maxHeight < 620;

              final double avatarSize = isVeryCompact
                  ? 110.0
                  : (isCompact ? 130.0 : 156.0);

              return SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: maxHeight),
                  child: IntrinsicHeight(
                    child: Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: isCompact ? 18.0 : 24.0,
                        vertical: isCompact ? 10.0 : 14.0,
                      ),
                      child: Column(
                        children: [
                          // 1. TOP HEADER: Friendoo Logo + Apple Frosted Glass Menu Button
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              const FriendooCallLogo(),
                              ApplePressable(
                                onTap: () => _showCallMenu(context),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(20),
                                  child: BackdropFilter(
                                    filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                                    child: Container(
                                      width: 40,
                                      height: 40,
                                      decoration: BoxDecoration(
                                        color: Colors.white.withValues(alpha: 0.08),
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: Colors.white.withValues(alpha: 0.15),
                                          width: 0.75,
                                        ),
                                      ),
                                      child: const Icon(
                                        Icons.more_horiz_rounded,
                                        color: Colors.white,
                                        size: 22,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),

                          Spacer(flex: isCompact ? 1 : 3),

                          // 2. CENTER PROMINENT AVATAR WITH APPLE AMBIENT GLOW & MUTE BADGE
                          Stack(
                            alignment: Alignment.center,
                            clipBehavior: Clip.none,
                            children: [
                              // Atmospheric soft ambient aura
                              Container(
                                width: avatarSize + 32,
                                height: avatarSize + 32,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: RadialGradient(
                                    colors: [
                                      (isHost
                                              ? const Color(0xFF6366F1)
                                              : const Color(0xFFFF2A85))
                                          .withValues(alpha: isCallActive ? 0.38 : 0.18),
                                      Colors.transparent,
                                    ],
                                    stops: const [0.45, 1.0],
                                  ),
                                ),
                              ),

                              // Avatar with Specular Ring
                              Container(
                                width: avatarSize,
                                height: avatarSize,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isHost
                                        ? const Color(0xFF818CF8).withValues(alpha: 0.9)
                                        : const Color(0xFFFF2A85).withValues(alpha: 0.9),
                                    width: 3.2,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: (isHost
                                              ? const Color(0xFF818CF8)
                                              : const Color(0xFFFF2A85))
                                          .withValues(alpha: 0.38),
                                      blurRadius: 30,
                                      spreadRadius: 3,
                                    ),
                                  ],
                                ),
                                child: ClipOval(
                                  child: _remoteAvatarUrl != null &&
                                          _remoteAvatarUrl!.trim().startsWith('http')
                                      ? Image.network(
                                          _remoteAvatarUrl!,
                                          width: avatarSize,
                                          height: avatarSize,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, _, _) => FriendooAvatar(
                                            size: avatarSize,
                                            seed: targetSeedId,
                                            gender: isHost
                                                ? DesiGender.male
                                                : DesiGender.female,
                                            role: isHost ? 'user' : 'host',
                                          ),
                                        )
                                      : FriendooAvatar(
                                          size: avatarSize,
                                          seed: targetSeedId,
                                          gender: isHost
                                              ? DesiGender.male
                                              : DesiGender.female,
                                          role: isHost ? 'user' : 'host',
                                        ),
                                ),
                              ),

                              // Apple Frosted Mute Pill Badge
                              if (isRemoteMuted)
                                Positioned(
                                  bottom: -8,
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(20),
                                    child: BackdropFilter(
                                      filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 5,
                                        ),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFEF4444)
                                              .withValues(alpha: 0.90),
                                          borderRadius: BorderRadius.circular(20),
                                          border: Border.all(
                                            color: Colors.white.withValues(alpha: 0.25),
                                            width: 0.75,
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color(0xFFEF4444)
                                                  .withValues(alpha: 0.45),
                                              blurRadius: 12,
                                              offset: const Offset(0, 3),
                                            ),
                                          ],
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(
                                              Icons.mic_off_rounded,
                                              color: Colors.white,
                                              size: 13,
                                            ),
                                            const SizedBox(width: 5),
                                            Text(
                                              '${isHost ? 'Caller' : 'Host'} Muted',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 11.5,
                                                fontWeight: FontWeight.w700,
                                                letterSpacing: -0.2,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),

                          SizedBox(height: isCompact ? 14 : 20),

                          // 3. IDENTITY: NAME + VERIFIED BADGE
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Text(
                                displayName,
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: isCompact ? 22 : 26,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.5,
                                ),
                              ),
                              if (!isHost) ...[
                                const SizedBox(width: 6),
                                const Icon(
                                  Icons.verified_rounded,
                                  color: Color(0xFFFF2A85),
                                  size: 19,
                                ),
                              ],
                            ],
                          ),

                          const SizedBox(height: 4),

                          // 4. ROLE LABEL BADGE
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.08),
                                width: 0.75,
                              ),
                            ),
                            child: Text(
                              roleLabel,
                              style: const TextStyle(
                                color: Color(0xFF94A3B8),
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.2,
                              ),
                            ),
                          ),

                          const SizedBox(height: 10),

                          // 5. LIVE CALL DURATION (APPLE TABULAR FIGURES)
                          Text(
                            timeOrStatusString,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: isCompact ? 18 : 20,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                              fontFeatures: const [
                                FontFeature.tabularFigures(),
                              ],
                            ),
                          ),

                          if (isCallActive && isRtcConnected) ...[
                            const SizedBox(height: 6),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: BackdropFilter(
                                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 9,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF10B981)
                                        .withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: const Color(0xFF10B981)
                                          .withValues(alpha: 0.3),
                                      width: 0.75,
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        width: 6,
                                        height: 6,
                                        decoration: const BoxDecoration(
                                          color: Color(0xFF10B981),
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      const SizedBox(width: 5),
                                      Text(
                                        (rtcLatency != null && rtcLatency > 0)
                                            ? 'HD WebRTC • ${rtcLatency}ms'
                                            : 'HD WebRTC Audio',
                                        style: const TextStyle(
                                          color: Color(0xFF34D399),
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: -0.1,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],

                          Spacer(flex: isCompact ? 1 : 2),

                          // 6. ANIMATED AUDIO WAVEFORM
                          AnimatedAudioWaveform(
                            isActive:
                                isCallActive &&
                                isRtcConnected &&
                                !isRemoteMuted,
                            barCount: isCompact ? 28 : 34,
                            primaryColor: const Color(0xFFFF2A85),
                            secondaryColor: const Color(0xFFC084FC),
                          ),

                          SizedBox(height: isCompact ? 12 : 16),

                          // 7. SPEAKING STATUS PILL CAPSULE (APPLE TRANSLUCENT GLASS)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(24),
                            child: BackdropFilter(
                              filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                              child: Container(
                                padding: EdgeInsets.symmetric(
                                  horizontal: isCompact ? 14 : 18,
                                  vertical: isCompact ? 6 : 8,
                                ),
                                decoration: BoxDecoration(
                                  color: isRemoteMuted
                                      ? const Color(0xFFEF4444)
                                          .withValues(alpha: 0.22)
                                      : const Color(0xFF191C2E)
                                          .withValues(alpha: 0.75),
                                  borderRadius: BorderRadius.circular(24),
                                  border: Border.all(
                                    color: isRemoteMuted
                                        ? const Color(0xFFEF4444)
                                            .withValues(alpha: 0.5)
                                        : Colors.white.withValues(alpha: 0.12),
                                    width: 0.75,
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
                                        fontSize: isCompact ? 12 : 13,
                                        fontWeight: isRemoteMuted
                                            ? FontWeight.w700
                                            : FontWeight.w500,
                                        letterSpacing: -0.2,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),

                          // 8. CONTEXTUAL RECHARGE OR GRACE PERIOD PILL
                          if (!isHost && isLowBalance) ...[
                            SizedBox(height: isCompact ? 10 : 14),
                            ApplePressable(
                              onTap: () => CoinPackagesPage.push(
                                context,
                                isCallRecharge: true,
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: BackdropFilter(
                                  filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.redAccent.withValues(alpha: 0.22),
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(
                                        color: Colors.redAccent.withValues(alpha: 0.65),
                                        width: 0.85,
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
                              ),
                            ),
                          ] else if (!isHost && isGracePeriod) ...[
                            SizedBox(height: isCompact ? 10 : 14),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: BackdropFilter(
                                filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 5,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withValues(alpha: 0.18),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: Colors.green.withValues(alpha: 0.5),
                                      width: 0.75,
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
                              ),
                            ),
                          ] else if (isHost) ...[
                            SizedBox(height: isCompact ? 10 : 14),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: BackdropFilter(
                                filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 5,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF10B981)
                                        .withValues(alpha: 0.14),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: const Color(0xFF10B981)
                                          .withValues(alpha: 0.35),
                                      width: 0.75,
                                    ),
                                  ),
                                  child: const Text(
                                    'Verified Voice Call',
                                    style: TextStyle(
                                      color: Color(0xFF10B981),
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ] else ...[
                            SizedBox(height: isCompact ? 10 : 14),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: BackdropFilter(
                                filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 5,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.05),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: Colors.white.withValues(alpha: 0.08),
                                      width: 0.75,
                                    ),
                                  ),
                                  child: Text(
                                    remainingCoins == null
                                        ? '$rate coins/min'
                                        : '$remainingCoins Coins · $rate coins/min',
                                    style: const TextStyle(
                                      color: Color(0xFF94A3B8),
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w600,
                                      fontFeatures: [FontFeature.tabularFigures()],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],

                          Spacer(flex: isCompact ? 1 : 3),

                          // Active Icebreaker Prompt Banner
                          if (_activeIcebreaker != null) ...[
                            Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.fromLTRB(14, 8, 10, 8),
                              decoration: BoxDecoration(
                                color: const Color(0xFF7C3AED).withValues(alpha: 0.22),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: const Color(0xFF7C3AED).withValues(alpha: 0.45),
                                  width: 0.75,
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Text('💡', style: TextStyle(fontSize: 14)),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _activeIcebreaker!,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () => setState(() => _activeIcebreaker = null),
                                    child: const Padding(
                                      padding: EdgeInsets.all(4),
                                      child: Icon(Icons.close_rounded, color: Colors.white54, size: 16),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],

                          // Recent Gift Sent Banner
                          if (_recentGiftSent != null) ...[
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 250),
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                gradient: _recentGiftSent!.gradient,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: _recentGiftSent!.gradient.colors.first.withValues(alpha: 0.45),
                                    blurRadius: 16,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(_recentGiftSent!.emoji, style: const TextStyle(fontSize: 18)),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Sent ${_recentGiftSent!.name} to $displayName! 💖',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],

                          // Interactive Action Pills: Icebreakers & Gifting (FRND / Chamet style)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              // Icebreakers Starter Button
                              GestureDetector(
                                onTap: () {
                                  HapticFeedback.lightImpact();
                                  CallIcebreakersSheet.show(
                                    context,
                                    onTopicSelected: (q) {
                                      setState(() => _activeIcebreaker = q);
                                    },
                                  );
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.08),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: Colors.white.withValues(alpha: 0.14),
                                      width: 0.75,
                                    ),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text('💬', style: TextStyle(fontSize: 13)),
                                      SizedBox(width: 6),
                                      Text(
                                        'Icebreakers',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),

                              if (!isHost) ...[
                                const SizedBox(width: 10),
                                // Send Virtual Gift Button
                                GestureDetector(
                                  onTap: () {
                                    HapticFeedback.lightImpact();
                                    CallGiftSheet.show(
                                      context,
                                      callId: widget.call.id,
                                      hostId: widget.call.hostId,
                                      hostName: displayName,
                                      onGiftSent: _onGiftSent,
                                    );
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(
                                        colors: [Color(0xFFEC4899), Color(0xFF8B5CF6)],
                                      ),
                                      borderRadius: BorderRadius.circular(20),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFFEC4899).withValues(alpha: 0.35),
                                          blurRadius: 10,
                                          offset: const Offset(0, 3),
                                        ),
                                      ],
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text('🎁', style: TextStyle(fontSize: 13)),
                                        SizedBox(width: 6),
                                        Text(
                                          'Send Gift',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),

                          const SizedBox(height: 14),

                          // 9. APPLE FLOATING ERGONOMIC CALL CONTROLS DOCK
                          ClipRRect(
                            borderRadius: BorderRadius.circular(44),
                            child: BackdropFilter(
                              filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
                              child: Container(
                                padding: EdgeInsets.symmetric(
                                  horizontal: isCompact ? 18 : 24,
                                  vertical: isCompact ? 12 : 16,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF131626).withValues(alpha: 0.75),
                                  borderRadius: BorderRadius.circular(44),
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.14),
                                    width: 0.85,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.45),
                                      blurRadius: 32,
                                      offset: const Offset(0, 10),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    // MUTE BUTTON
                                    _AppleCallDockButton(
                                      icon: isMuted
                                          ? Icons.mic_off_rounded
                                          : Icons.mic_rounded,
                                      label: isMuted ? 'Muted' : 'Mute',
                                      isActive: isMuted,
                                      activeColor: const Color(0xFFEF4444),
                                      size: isCompact ? 56 : 64,
                                      iconSize: isCompact ? 22 : 26,
                                      onTap: () => ref
                                          .read(activeCallProvider.notifier)
                                          .toggleMute(),
                                    ),

                                    // END CALL BUTTON (PROMINENT RADIANT RED DISC)
                                    _AppleCallEndButton(
                                      size: isCompact ? 68 : 78,
                                      iconSize: isCompact ? 30 : 36,
                                      onTap: () => ref
                                          .read(activeCallProvider.notifier)
                                          .endActiveCall(reason: 'user_hangup'),
                                    ),

                                    // SPEAKER BUTTON
                                    _AppleCallDockButton(
                                      icon: isSpeaker
                                          ? Icons.volume_up_rounded
                                          : Icons.volume_down_rounded,
                                      label: isSpeaker ? 'Speaker' : 'Earpiece',
                                      isActive: isSpeaker,
                                      activeColor: const Color(0xFF6366F1),
                                      size: isCompact ? 56 : 64,
                                      iconSize: isCompact ? 22 : 26,
                                      onTap: () => ref
                                          .read(activeCallProvider.notifier)
                                          .toggleSpeakerphone(),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),

                          SizedBox(height: isCompact ? 6 : 14),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

/// Tactile Apple Frosted Call Dock Action Button (Mute, Speaker)
class _AppleCallDockButton extends StatelessWidget {
  const _AppleCallDockButton({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.activeColor,
    required this.size,
    required this.iconSize,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool isActive;
  final Color activeColor;
  final double size;
  final double iconSize;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ApplePressable(
          onTap: onTap,
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isActive
                  ? activeColor.withValues(alpha: 0.35)
                  : Colors.white.withValues(alpha: 0.09),
              border: Border.all(
                color: isActive
                    ? activeColor
                    : Colors.white.withValues(alpha: 0.16),
                width: 1.2,
              ),
              boxShadow: isActive
                  ? [
                      BoxShadow(
                        color: activeColor.withValues(alpha: 0.35),
                        blurRadius: 16,
                        spreadRadius: 1,
                      ),
                    ]
                  : null,
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: iconSize,
            ),
          ),
        ),
        const SizedBox(height: 7),
        Text(
          label,
          style: TextStyle(
            color: isActive ? Colors.white : Colors.white70,
            fontSize: 12.5,
            fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
            letterSpacing: -0.2,
          ),
        ),
      ],
    );
  }
}

/// Radiant Apple Call End Button (74px Disc with Atmospheric Glow)
class _AppleCallEndButton extends StatelessWidget {
  const _AppleCallEndButton({
    required this.size,
    required this.iconSize,
    required this.onTap,
  });

  final double size;
  final double iconSize;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ApplePressable(
          onTap: onTap,
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFFFF3B30), Color(0xFFE11D48)],
              ),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.25),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFFF3B30).withValues(alpha: 0.50),
                  blurRadius: 26,
                  spreadRadius: 2,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(
              Icons.call_end_rounded,
              color: Colors.white,
              size: iconSize,
            ),
          ),
        ),
        const SizedBox(height: 7),
        const Text(
          'End Call',
          style: TextStyle(
            color: Colors.white,
            fontSize: 12.5,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.2,
          ),
        ),
      ],
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
            letterSpacing: -0.6,
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
            letterSpacing: -0.6,
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
