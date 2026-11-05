import '../localization/app_strings.dart';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

import 'web_audio_permission.dart';

enum AppPermissionType { microphone, notifications, storage }

class PermissionStatusReport {
  const PermissionStatusReport({
    required this.isMicrophoneGranted,
    required this.isNotificationsGranted,
    required this.isStorageGranted,
  });

  final bool isMicrophoneGranted;
  final bool isNotificationsGranted;
  final bool isStorageGranted;

  bool get areAllGranted =>
      isMicrophoneGranted && isNotificationsGranted && isStorageGranted;
}

final permissionServiceProvider = Provider<AppPermissionService>((ref) {
  return const AppPermissionService();
});

class AppPermissionService {
  const AppPermissionService();

  /// Checks if microphone permission is granted.
  Future<bool> isMicrophoneGranted() async {
    if (kIsWeb) return true;
    final status = await Permission.microphone.status;
    return status.isGranted;
  }

  /// Requests Android 12+ Bluetooth headset access for audio routing.
  /// A denied Bluetooth permission must not prevent a call; the call can use
  /// the phone speaker and microphone instead.
  Future<void> requestBluetoothAudio() async {
    if (kIsWeb || !Platform.isAndroid) return;

    final status = await Permission.bluetoothConnect.status;
    if (!status.isGranted && !status.isPermanentlyDenied) {
      await Permission.bluetoothConnect.request();
    }
  }

  /// Requests microphone permission for voice lounge and calling.
  Future<bool> requestMicrophone({BuildContext? context}) async {
    if (kIsWeb) {
      return requestWebMicrophone();
    }

    var status = await Permission.microphone.status;
    if (status.isGranted) return true;

    if (status.isPermanentlyDenied) {
      if (context != null && context.mounted) {
        await _showSettingsDialog(
          context,
          title: 'Microphone Permission Required',
          message: 'Allow microphone access to make and receive voice calls. You can change this permission in Settings.',
          icon: Icons.mic_off_rounded,
        );
      }
      return false;
    }

    if (context != null && context.mounted && status.isDenied) {
      final proceed = await showPermissionRationale(
        context,
        type: AppPermissionType.microphone,
      );
      if (!proceed) return false;
    }

    status = await Permission.microphone.request();
    return status.isGranted;
  }

  /// Checks if push notification permission is granted.
  Future<bool> isNotificationsGranted() async {
    if (kIsWeb) return true;
    final status = await Permission.notification.status;
    return status.isGranted;
  }

  /// Requests push notification permission for flash coin sale alerts & calls.
  Future<bool> requestNotifications({BuildContext? context}) async {
    if (kIsWeb) return true;

    var status = await Permission.notification.status;
    if (status.isGranted) return true;

    if (status.isPermanentlyDenied) {
      if (context != null && context.mounted) {
        await _showSettingsDialog(
          context,
          title: 'Notifications Required',
          message: 'Enable notifications to receive call and account updates.',
          icon: Icons.notifications_off_rounded,
        );
      }
      return false;
    }

    if (context != null && context.mounted && status.isDenied) {
      final proceed = await showPermissionRationale(
        context,
        type: AppPermissionType.notifications,
      );
      if (!proceed) return false;
    }

    status = await Permission.notification.request();
    return status.isGranted;
  }

  /// Requests phone storage / photos permission.
  Future<bool> requestStorage({BuildContext? context}) async {
    if (kIsWeb) return true;

    Permission permission = Permission.storage;
    if (Platform.isAndroid) {
      // Android 13+ (SDK 33) uses photos permission for image picker
      final photosStatus = await Permission.photos.status;
      if (photosStatus.isGranted) return true;
      permission = Permission.photos;
    }

    var status = await permission.status;
    if (status.isGranted) return true;

    if (status.isPermanentlyDenied) {
      if (context != null && context.mounted) {
        await _showSettingsDialog(
          context,
          title: 'Storage & Media Permission Required',
          message: 'Allow photo access to choose a profile picture. You can change this permission in Settings.',
          icon: Icons.folder_off_rounded,
        );
      }
      return false;
    }

    if (context != null && context.mounted && status.isDenied) {
      final proceed = await showPermissionRationale(
        context,
        type: AppPermissionType.storage,
      );
      if (!proceed) return false;
    }

    status = await permission.request();
    if (!status.isGranted && Platform.isAndroid) {
      // Fallback for older Android devices
      final storageStatus = await Permission.storage.request();
      return storageStatus.isGranted;
    }
    return status.isGranted;
  }

  /// Fetches the overall permissions report.
  Future<PermissionStatusReport> getStatusReport() async {
    if (kIsWeb) {
      return const PermissionStatusReport(
        isMicrophoneGranted: true,
        isNotificationsGranted: true,
        isStorageGranted: true,
      );
    }

    final mic = await Permission.microphone.isGranted;
    final notif = await Permission.notification.isGranted;
    bool storage = await Permission.storage.isGranted;
    if (!storage && Platform.isAndroid) {
      storage = await Permission.photos.isGranted;
    }

    return PermissionStatusReport(
      isMicrophoneGranted: mic,
      isNotificationsGranted: notif,
      isStorageGranted: storage,
    );
  }

  /// Shows the high-energy Friendoo Permission Rationale Bottom Sheet
  static Future<bool> showPermissionRationale(
    BuildContext context, {
    required AppPermissionType type,
  }) async {
    final (title, subtitle, icon, highlight, gradientColors) = switch (type) {
      AppPermissionType.microphone => (
        'Enable Microphone Access',
        'Allow microphone access to speak during voice calls.',
        Icons.mic_rounded,
        'Use your microphone for calls',
        [const Color(0xFF6366F1), const Color(0xFFFF2A85)],
      ),
      AppPermissionType.notifications => (
        'Enable Push Notifications',
        'Receive notifications about calls and account activity.',
        Icons.notifications_active_rounded,
        'Call and account updates',
        [const Color(0xFFFF2A85), const Color(0xFFFFB703)],
      ),
      AppPermissionType.storage => (
        'Allow Photo Access',
        'Choose a photo to use on your profile.',
        Icons.photo_library_rounded,
        'Choose a profile photo',
        [const Color(0xFF00D2E0), const Color(0xFF6366F1)],
      ),
    };

    final result = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetContext) {
        return Container(
          decoration: const BoxDecoration(
            color: Color(0xFF13141F),
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          ),
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag Handle
              Center(
                child: Container(
                  width: 44,
                  height: 4.5,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Animated Icon Header
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: gradientColors,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: gradientColors.first.withValues(alpha: 0.4),
                      blurRadius: 20,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Icon(icon, color: Colors.white, size: 32),
              ),
              const SizedBox(height: 18),

              // Title
              AppText(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 21,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.4,
                ),
              ),
              const SizedBox(height: 8),

              // Highlight Badge
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: gradientColors.first.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: gradientColors.first.withValues(alpha: 0.35),
                  ),
                ),
                child: Text(
                  highlight,
                  style: TextStyle(
                    color: gradientColors.last,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Subtitle
              AppText(
                subtitle,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.8),
                  fontSize: 13.5,
                  height: 1.45,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 26),

              // Allow Button
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => Navigator.of(sheetContext).pop(true),
                  style: FilledButton.styleFrom(
                    backgroundColor: gradientColors.first,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 4,
                  ),
                  child: const Text(
                    'Allow Access ➔',
                    style: TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),

              // Not Now Button
              TextButton(
                onPressed: () => Navigator.of(sheetContext).pop(false),
                child: Text(
                  'Not Now',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontWeight: FontWeight.w700,
                    fontSize: 13.5,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );

    return result ?? false;
  }

  static Future<void> _showSettingsDialog(
    BuildContext context, {
    required String title,
    required String message,
    required IconData icon,
  }) async {
    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: const Color(0xFF13141F),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          title: Row(
            children: [
              Icon(icon, color: const Color(0xFFFF2A85), size: 24),
              const SizedBox(width: 10),
              Expanded(
                child: AppText(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          content: AppText(
            message,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.85),
              fontSize: 13.5,
              height: 1.4,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: AppText(
                'Cancel',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
              ),
            ),
            FilledButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                openAppSettings();
              },
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Open Settings'),
            ),
          ],
        );
      },
    );
  }
}
