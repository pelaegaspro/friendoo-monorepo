import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final callForegroundServiceProvider = Provider<CallForegroundService>((ref) {
  return CallForegroundService();
});

/// Riverpod service managing the native Android Ongoing Call Foreground Service.
/// On Web and iOS, operations are graceful no-ops.
class CallForegroundService {
  static const _channel = MethodChannel('com.friendoo.friendoo/call_service');
  bool _isActive = false;

  bool get isActive => _isActive;

  /// Starts the Android native ongoing call notification & acquires CPU/Wi-Fi locks.
  Future<void> start({
    required String callId,
    required String partnerName,
    String duration = '00:00',
  }) async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) return;
    try {
      await _channel.invokeMethod('startCallService', {
        'callId': callId,
        'partnerName': partnerName,
        'duration': duration,
      });
      _isActive = true;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[CallForegroundService] start failed: $e');
      }
    }
  }

  /// Updates the live call timer displayed in the system notification tray.
  Future<void> updateDuration(String duration) async {
    if (!_isActive || kIsWeb || defaultTargetPlatform != TargetPlatform.android) return;
    try {
      await _channel.invokeMethod('updateCallDuration', {
        'duration': duration,
      });
    } catch (e) {
      // Ignored non-fatal timer update failure
    }
  }

  /// Stops the foreground service, removes the ongoing notification, and releases wakelocks.
  Future<void> stop() async {
    if (!_isActive && !kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      // Proactively ensure native cleanup even if local state was reset
    }
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) return;
    try {
      await _channel.invokeMethod('stopCallService');
      _isActive = false;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[CallForegroundService] stop failed: $e');
      }
    }
  }
}
