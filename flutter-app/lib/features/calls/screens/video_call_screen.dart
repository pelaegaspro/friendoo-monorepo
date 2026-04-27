import 'dart:async';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/security_service.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../auth/providers/auth_provider.dart';
import '../../user/providers/host_provider.dart';
import '../providers/call_provider.dart';
import '../services/agora_call_service.dart';

class VideoCallScreen extends ConsumerStatefulWidget {
  final String hostId;

  const VideoCallScreen({super.key, required this.hostId});

  @override
  ConsumerState<VideoCallScreen> createState() => _VideoCallScreenState();
}

class _VideoCallScreenState extends ConsumerState<VideoCallScreen> {
  bool _isMuted = false;
  bool _isVideoEnabled = true;
  bool _isConnecting = true;
  bool _remoteUserJoined = false;
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
      'video',
      host.ratePerMinuteVideo,
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
        isVideoCall: true,
      );

      _callStatusSubscription = agoraService.callStatusStream.listen((status) {
        setState(() {
          _isConnecting = status == CallStatus.connecting;
          if (status == CallStatus.userJoined) {
            _remoteUserJoined = true;
          }
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

  void _toggleVideo() {
    setState(() {
      _isVideoEnabled = !_isVideoEnabled;
    });
    final agoraService = ref.read(agoraServiceProvider);
    agoraService.toggleVideo(_isVideoEnabled);
    ref.read(callNotifierProvider.notifier).toggleVideo();
  }

  void _switchCamera() {
    final agoraService = ref.read(agoraServiceProvider);
    agoraService.switchCamera();
  }

  @override
  Widget build(BuildContext context) {
    final hostAsync = ref.watch(singleHostProvider(widget.hostId));
    final callState = ref.watch(callNotifierProvider);
    final userCoinsAsync = ref.watch(userCoinsProvider);
    final agoraService = ref.watch(agoraServiceProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: hostAsync.when(
        data: (host) {
          if (host == null) {
            return const Center(child: Text('Host not found'));
          }

          return Stack(
            children: [
              // Remote Video (Full Screen)
              Container(
                color: AppTheme.surface,
                child: _remoteUserJoined
                    ? AgoraVideoView(
                        controller: VideoViewController.remote(
                          rtcEngine: agoraService.engine,
                          canvas: const VideoCanvas(uid: 0),
                          connection: RtcConnection(
                            channelId: callState.channelName ?? '',
                          ),
                        ),
                      )
                    : Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (_isConnecting) ...[
                              const LoadingWidget(size: 48),
                              const SizedBox(height: 16),
                              Text(
                                'Calling ${host.name}...',
                                style: TextStyle(
                                  color: AppTheme.text,
                                  fontSize: 18,
                                ),
                              ),
                            ] else ...[
                              Icon(
                                Icons.videocam_off,
                                size: 64,
                                color: AppTheme.subtext,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Waiting for host...',
                                style: TextStyle(
                                  color: AppTheme.subtext,
                                  fontSize: 16,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
              ),

              // Overlay UI
              SafeArea(
                child: Column(
                  children: [
                    // Top Bar
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Host Info
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.background.withValues(alpha: 0.8),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: host.isOnline
                                        ? AppTheme.onlineDot
                                        : AppTheme.subtext,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  host.name,
                                  style: TextStyle(
                                    color: AppTheme.text,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Timer & Coins
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: AppTheme.background
                                      .withValues(alpha: 0.8),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.timer,
                                      size: 14,
                                      color: AppTheme.text,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      callState.formattedDuration,
                                      style: TextStyle(
                                        color: AppTheme.text,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              userCoinsAsync.when(
                                data: (coins) => Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppTheme.background
                                        .withValues(alpha: 0.8),
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
                                        '$coins',
                                        style: TextStyle(
                                          color: AppTheme.text,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                loading: () => const SizedBox.shrink(),
                                error: (_, __) => const SizedBox.shrink(),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const Spacer(),

                    // Call Controls
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            AppTheme.background.withValues(alpha: 0.8),
                          ],
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          // Flip Camera
                          _buildControlButton(
                            icon: Icons.flip_camera_ios,
                            onTap: _switchCamera,
                          ),

                          // Mute
                          _buildControlButton(
                            icon: _isMuted ? Icons.mic_off : Icons.mic,
                            onTap: _toggleMute,
                            isActive: _isMuted,
                          ),

                          // Video
                          _buildControlButton(
                            icon: _isVideoEnabled
                                ? Icons.videocam
                                : Icons.videocam_off,
                            onTap: _toggleVideo,
                            isActive: !_isVideoEnabled,
                          ),

                          // End Call
                          GestureDetector(
                            onTap: _endCall,
                            child: Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                color: AppTheme.error,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color:
                                        AppTheme.error.withValues(alpha: 0.4),
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
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Local Video (PiP)
              Positioned(
                top: 100,
                right: 16,
                child: Container(
                  width: 100,
                  height: 140,
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppTheme.text.withValues(alpha: 0.3),
                      width: 2,
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: _isVideoEnabled
                        ? AgoraVideoView(
                            controller: VideoViewController(
                              rtcEngine: agoraService.engine,
                              canvas: const VideoCanvas(uid: 0),
                            ),
                          )
                        : Center(
                            child: Icon(
                              Icons.videocam_off,
                              color: AppTheme.subtext,
                              size: 32,
                            ),
                          ),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const LoadingWidget(),
        error: (_, __) => const Center(child: Text('Error loading host')),
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required VoidCallback onTap,
    bool isActive = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: isActive
              ? AppTheme.primary
              : AppTheme.surface.withValues(alpha: 0.8),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: AppTheme.text, size: 24),
      ),
    );
  }
}
