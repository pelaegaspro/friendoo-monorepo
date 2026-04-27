import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/agora_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/analytics_service.dart';
import '../../../services/coin_service.dart';

class CallScreen extends ConsumerStatefulWidget {
  final String channelId;
  final String hostId;
  final String hostName;

  const CallScreen({
    super.key,
    required this.channelId,
    required this.hostId,
    required this.hostName,
  });

  @override
  ConsumerState<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends ConsumerState<CallScreen> {
  final _agora = AgoraService();
  final _coinService = CoinService();
  final _firestore = FirebaseFirestore.instance;
  final _auth = FirebaseAuth.instance;

  Timer? _callTimer;
  Timer? _coinTimer;
  int _elapsedSeconds = 0;
  int _coins = 0;
  int _coinsDeducted = 0;
  int _ratePerMinute = 5;
  bool _isMuted = false;
  bool _isSpeakerOn = true;
  bool _isJoined = false;
  bool _isEnding = false;
  String? _callDocId;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ));
    _startCall();
  }

  @override
  void dispose() {
    _callTimer?.cancel();
    _coinTimer?.cancel();
    // Don't await here - fire and forget on dispose
    _agora.endCall();
    super.dispose();
  }

  Future<void> _startCall() async {
    final uid = _auth.currentUser?.uid;
    if (uid == null) return;

    _coins = await _coinService.getBalance(uid);
    _ratePerMinute = await _coinService.getRateForUser(uid);

    if (_coins < _ratePerMinute) {
      if (mounted) _showInsufficientCoinsDialog();
      return;
    }

    // Create Firestore call document first so Cloud Function can validate it
    final callRef =
        await _firestore.collection(AppConstants.callsCollection).add({
      'callerId': uid,
      'hostId': widget.hostId,
      'channelId': widget.channelId,
      'startTime': FieldValue.serverTimestamp(),
      'status': 'active',
      'coinsDeducted': 0,
      'rating': null,
    });
    _callDocId = callRef.id;

    try {
      await _firestore
          .collection(AppConstants.hostsCollection)
          .doc(widget.hostId)
          .update({'isOnCall': true});
    } catch (e) {
      debugPrint('Host busy flag update skipped: $e');
    }

    // Start Agora call - token fetched from Cloud Function using the call doc ID
    await _agora.startCall(
      callDocId: _callDocId!,
      channelName: widget.channelId,
      onJoined: _onJoined,
      onHostJoinedCallback: _onHostJoined,
      onHostLeftCallback: _onHostLeft,
      onErrorCallback: _onCallError,
    );
  }

  void _onJoined() {
    if (!mounted) return;
    setState(() => _isJoined = true);
    if (_callDocId != null) {
      AppAnalyticsService.logCallSuccess(
        hostId: widget.hostId,
        callDocId: _callDocId!,
      );
    }

    _callTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _elapsedSeconds++);
    });

    _coinTimer = Timer.periodic(const Duration(seconds: 60), (_) async {
      final uid = _auth.currentUser?.uid;
      if (uid == null) return;
      try {
        final newBalance = await _coinService.deductCoins(
          uid,
          _ratePerMinute,
          description: 'Call with ${widget.hostName} - 1 min',
        );
        if (mounted) {
          setState(() {
            _coins = newBalance;
            _coinsDeducted += _ratePerMinute;
          });
        }
      } catch (e) {
        _endCall(reason: 'insufficient_coins');
      }
    });
  }

  void _onHostJoined(int uid) {
    debugPrint('Host joined Agora uid=$uid');
  }

  void _onHostLeft(int uid) {
    debugPrint('Host left Agora uid=$uid');
    _endCall(reason: 'host_left');
  }

  void _onCallError(String error) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Call error: $error'),
        backgroundColor: AppColors.error,
      ),
    );
    _endCall(reason: 'error');
  }

  Future<void> _endCall({String reason = 'user_ended'}) async {
    if (_isEnding) return;
    setState(() => _isEnding = true);

    _callTimer?.cancel();
    _coinTimer?.cancel();
    await _agora.endCall();

    final durationMinutes = (_elapsedSeconds / 60).ceil();

    if (_callDocId != null) {
      await _firestore
          .collection(AppConstants.callsCollection)
          .doc(_callDocId)
          .update({
        'endTime': FieldValue.serverTimestamp(),
        'duration': durationMinutes,
        'coinsDeducted': _coinsDeducted,
        'status': 'completed',
      });
    }

    try {
      await _firestore
          .collection(AppConstants.hostsCollection)
          .doc(widget.hostId)
          .update({
        'isOnCall': false,
        if (_elapsedSeconds > 0) 'totalCalls': FieldValue.increment(1),
        if (_elapsedSeconds > 0) 'lastCallAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('Host call stats update skipped: $e');
    }

    await AppAnalyticsService.logCallEnd(
      hostId: widget.hostId,
      reason: reason,
      durationSeconds: _elapsedSeconds,
      coinsDeducted: _coinsDeducted,
    );

    if (mounted) {
      context.go('/call-summary', extra: {
        'hostName': widget.hostName,
        'durationSeconds': _elapsedSeconds,
        'coinsUsed': _coinsDeducted,
        'remainingCoins': _coins - _coinsDeducted,
        'callDocId': _callDocId,
      });
    }
  }

  void _showInsufficientCoinsDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Insufficient Coins',
            style: TextStyle(color: AppColors.textPrimary)),
        content: const Text(
          'You need at least 5 coins to start a call. Add coins to continue.',
          style: TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.go('/wallet/add-money');
            },
            child: const Text('Add Coins',
                style: TextStyle(color: AppColors.primary)),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.go('/home');
            },
            child: const Text('Cancel',
                style: TextStyle(color: AppColors.textSecondary)),
          ),
        ],
      ),
    );
  }

  String _formatDuration(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  int get _remainingCoins => _coins - _coinsDeducted;
  bool get _isLowBalance => _remainingCoins < 20;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Low balance warning
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: _isLowBalance
                  ? Container(
                      key: const ValueKey('warning'),
                      width: double.infinity,
                      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: AppColors.warning.withValues(alpha: 0.5)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.warning_amber_rounded,
                              color: AppColors.warning, size: 18),
                          SizedBox(width: 8),
                          Text(
                            'Low balance! Add coins to continue',
                            style: TextStyle(
                              color: AppColors.warning,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    )
                  : const SizedBox.shrink(key: ValueKey('no-warning')),
            ),
            const SizedBox(height: 32),
            // Host avatar with glow
            Container(
              width: 130,
              height: 130,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.purpleGradient,
                border: Border.all(color: AppColors.primary, width: 3),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.4),
                    blurRadius: 24,
                    spreadRadius: 4,
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  widget.hostName.isNotEmpty
                      ? widget.hostName[0].toUpperCase()
                      : '?',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 52,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              widget.hostName,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            // Connection status
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _isJoined ? AppColors.success : AppColors.warning,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  _isJoined ? 'Connected' : 'Connecting...',
                  style: TextStyle(
                    color: _isJoined ? AppColors.success : AppColors.warning,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            // Timer
            Text(
              _formatDuration(_elapsedSeconds),
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 56,
                fontWeight: FontWeight.bold,
                letterSpacing: 4,
              ),
            ),
            const SizedBox(height: 12),
            // Coin balance
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 300),
              style: TextStyle(
                color:
                    _isLowBalance ? AppColors.error : AppColors.textSecondary,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              child: Text('$_remainingCoins coins remaining'),
            ),
            const Spacer(),
            // Controls
            Padding(
              padding: const EdgeInsets.fromLTRB(40, 0, 40, 48),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _CallControl(
                    icon: _isMuted ? Icons.mic_off : Icons.mic,
                    label: _isMuted ? 'Unmute' : 'Mute',
                    color: _isMuted
                        ? AppColors.error.withValues(alpha: 0.2)
                        : AppColors.card,
                    iconColor: _isMuted ? AppColors.error : Colors.white,
                    size: 64,
                    onTap: () async {
                      setState(() => _isMuted = !_isMuted);
                      await _agora.muteLocalAudio(_isMuted);
                    },
                  ),
                  _CallControl(
                    icon: Icons.call_end,
                    label: 'End',
                    color: AppColors.error,
                    iconColor: Colors.white,
                    size: 80,
                    onTap: _isEnding ? () {} : _endCall,
                  ),
                  _CallControl(
                    icon: _isSpeakerOn ? Icons.volume_up : Icons.volume_off,
                    label: 'Speaker',
                    color: AppColors.card,
                    iconColor: Colors.white,
                    size: 64,
                    onTap: () async {
                      setState(() => _isSpeakerOn = !_isSpeakerOn);
                      await _agora.setSpeakerphone(_isSpeakerOn);
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CallControl extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color iconColor;
  final double size;
  final VoidCallback onTap;

  const _CallControl({
    required this.icon,
    required this.label,
    required this.color,
    required this.iconColor,
    required this.size,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border:
                  Border.all(color: AppColors.divider.withValues(alpha: 0.5)),
            ),
            child: Icon(icon, color: iconColor, size: size * 0.42),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style:
                const TextStyle(color: AppColors.textSecondary, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
