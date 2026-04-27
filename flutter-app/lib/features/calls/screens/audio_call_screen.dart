import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/security_service.dart';
import '../../../shared/widgets/avatar_widget.dart';
import '../../../shared/widgets/coin_balance_widget.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../auth/providers/auth_provider.dart';
import '../../user/providers/host_provider.dart';
import '../providers/call_provider.dart';
import '../services/agora_call_service.dart';

class AudioCallScreen extends ConsumerStatefulWidget {
  final String hostId;

  const AudioCallScreen({super.key, required this.hostId});

  @override
  ConsumerState<AudioCallScreen> createState() => _AudioCallScreenState();
}

class _AudioCallScreenState extends ConsumerState<AudioCallScreen> {
  bool _isMuted = false;
  bool _isSpeakerOn = false;
  bool _isConnecting = true;
  StreamSubscription<CallStatus>? _callStatusSubscription;

  @override
  void initState() {
    super.initState();
    SecurityService.enableSecureScreen();
    _initCall();
  }

  @override
  void dispose() {
    SecurityService.disableSecureScreen();
    _callStatusSubscription?.cancel();
    super.dispose();
  }

  Future<void> _initCall() async {
    final host = await ref.read(singleHostProvider(widget.hostId).future);
    if (host == null) return;

    final notifier = ref.read(callNotifierProvider.notifier);
    final error = await notifier.initiateCall(
      widget.hostId,
      'audio',
      host.ratePerMinuteAudio,
    );

    if (error != null) {
      if (error == 'insufficient_coins' && mounted) {
        _showLowCoinsDialog();
      }
      return;
    }

    // Initialize Agora
    final agoraService = ref.read(agoraServiceProvider);
    try {
      await agoraService.initialize();
      await agoraService.joinCall(
        channelName: ref.read(callNotifierProvider).channelName!,
        token: '', // Token should be generated server-side
        uid: ref.read(callNotifierProvider).uid!,
        isVideoCall: false,
      );

      _callStatusSubscription = agoraService.callStatusStream.listen((status) {
        setState(() {
          _isConnecting = status == CallStatus.connecting;
        });
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Call error: $e'),
            backgroundColor: AppTheme.error,
          ),
        );
        context.pop();
      }
    }
  }

  void _showLowCoinsDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: Text('Not enough coins', style: TextStyle(color: AppTheme.text)),
        content: Text(
          'You don\'t have enough coins to start this call.',
          style: TextStyle(color: AppTheme.subtext),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.pop();
            },
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              context.pop();
              context.push(AppConstants.routeWallet);
            },
            child: const Text('Buy Coins'),
          ),
        ],
      ),
    );
  }

  Future<void> _endCall() async {
    final agoraService = ref.read(agoraServiceProvider);
    final notifier = ref.read(callNotifierProvider.notifier);

    await agoraService.leaveCall();
    await notifier.endCall('user_ended');

    if (mounted) {
      context.pop();
    }
  }

  void _toggleMute() {
    setState(() {
      _isMuted = !_isMuted;
    });
    final agoraService = ref.read(agoraServiceProvider);
    agoraService.toggleMute(_isMuted);
    ref.read(callNotifierProvider.notifier).toggleMute();
  }

  void _toggleSpeaker() {
    setState(() {
      _isSpeakerOn = !_isSpeakerOn;
    });
    final agoraService = ref.read(agoraServiceProvider);
    agoraService.enableSpeakerphone(_isSpeakerOn);
    ref.read(callNotifierProvider.notifier).toggleSpeaker();
  }

  @override
  Widget build(BuildContext context) {
    final hostAsync = ref.watch(singleHostProvider(widget.hostId));
    final callState = ref.watch(callNotifierProvider);
    final userCoinsAsync = ref.watch(userCoinsProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: hostAsync.when(
          data: (host) {
            if (host == null) {
              return const Center(child: Text('Host not found'));
            }

            return Column(
              children: [
                // Top Bar
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      userCoinsAsync.when(
                        data: (coins) =>
                            CoinBalanceMiniWidget(coins: coins, onTap: () {}),
                        loading: () => const SizedBox.shrink(),
                        error: (_, __) => const SizedBox.shrink(),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.surface,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.monetization_on,
                              size: 14,
                              color: AppTheme.warning,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${host.ratePerMinuteAudio}/min',
                              style: TextStyle(
                                color: AppTheme.text,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Main Content
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Host Avatar
                      Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            width: 160,
                            height: 160,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: callState.isConnected
                                    ? AppTheme.onlineDot
                                    : AppTheme.primary,
                                width: 4,
                              ),
                            ),
                            child: AvatarWidget(
                              avatarId: host.avatarId,
                              size: 150,
                              fallbackText: host.name,
                            ),
                          ),
                          if (_isConnecting)
                            Container(
                              width: 160,
                              height: 160,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color:
                                    AppTheme.background.withValues(alpha: 0.7),
                              ),
                              child: const LoadingWidget(size: 32),
                            ),
                        ],
                      ),
                      const SizedBox(height: 32),

                      // Host Name
                      Text(
                        host.name,
                        style: TextStyle(
                          color: AppTheme.text,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Call Status / Timer
                      Text(
                        _isConnecting
                            ? 'Connecting...'
                            : callState.formattedDuration,
                        style: TextStyle(color: AppTheme.subtext, fontSize: 16),
                      ),
                      const SizedBox(height: 8),

                      // Connection Status
                      if (callState.isConnected)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.onlineDot.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: AppTheme.onlineDot,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'Connected',
                                style: TextStyle(
                                  color: AppTheme.onlineDot,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),

                // Call Controls
                Padding(
                  padding: const EdgeInsets.all(32),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      // Mute Button
                      _buildControlButton(
                        icon: _isMuted ? Icons.mic_off : Icons.mic,
                        label: _isMuted ? 'Unmute' : 'Mute',
                        onTap: _toggleMute,
                        isActive: _isMuted,
                      ),

                      // End Call Button
                      GestureDetector(
                        onTap: _endCall,
                        child: Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            color: AppTheme.error,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.error.withValues(alpha: 0.4),
                                blurRadius: 12,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.call_end,
                            color: Colors.white,
                            size: 32,
                          ),
                        ),
                      ),

                      // Speaker Button
                      _buildControlButton(
                        icon: _isSpeakerOn ? Icons.volume_up : Icons.volume_off,
                        label: _isSpeakerOn ? 'Speaker' : 'Earpiece',
                        onTap: _toggleSpeaker,
                        isActive: _isSpeakerOn,
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
          loading: () => const LoadingWidget(),
          error: (_, __) => const Center(child: Text('Error loading host')),
        ),
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required bool isActive,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: isActive ? AppTheme.primary : AppTheme.surface,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppTheme.text, size: 24),
          ),
          const SizedBox(height: 8),
          Text(label, style: TextStyle(color: AppTheme.subtext, fontSize: 12)),
        ],
      ),
    );
  }
}
