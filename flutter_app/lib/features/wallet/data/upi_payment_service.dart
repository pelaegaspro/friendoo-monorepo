import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

class UpiInstalledAppInfo {
  const UpiInstalledAppInfo({
    required this.id,
    required this.displayName,
    required this.packageName,
    required this.brandColor,
    required this.brandAccentColor,
    required this.shortName,
    this.iconBytes,
  });

  final String id;
  final String displayName;
  final String packageName;
  final Color brandColor;
  final Color brandAccentColor;
  final String shortName;
  final Uint8List? iconBytes;

  static UpiInstalledAppInfo fromPackage(
    String packageName,
    String label, {
    Uint8List? iconBytes,
  }) {
    final lowerPkg = packageName.toLowerCase();
    final lowerLabel = label.toLowerCase();

    if (lowerPkg.contains('paisa') ||
        lowerPkg.contains('google') ||
        lowerLabel.contains('gpay') ||
        lowerLabel.contains('google pay')) {
      return UpiInstalledAppInfo(
        id: 'gpay',
        displayName: 'GPay',
        packageName: 'com.google.android.apps.nbu.paisa.user',
        brandColor: const Color(0xFF4285F4),
        brandAccentColor: const Color(0xFF34A853),
        shortName: 'GPay',
        iconBytes: iconBytes,
      );
    } else if (lowerPkg.contains('amazon') || lowerLabel.contains('amazon')) {
      return UpiInstalledAppInfo(
        id: 'amazonpay',
        displayName: 'Amazon Pay',
        packageName: 'in.amazon.mShop.android.shopping',
        brandColor: const Color(0xFFFF9900),
        brandAccentColor: const Color(0xFF146EB4),
        shortName: 'Amazon Pay',
        iconBytes: iconBytes,
      );
    } else if (lowerPkg.contains('kbank') ||
        lowerPkg.contains('kotak') ||
        lowerLabel.contains('kotak')) {
      return UpiInstalledAppInfo(
        id: 'kotak',
        displayName: 'Kotak811',
        packageName: 'com.msf.kbank.mobile',
        brandColor: const Color(0xFFEE1C25),
        brandAccentColor: const Color(0xFF003366),
        shortName: 'Kotak811',
        iconBytes: iconBytes,
      );
    } else if (lowerPkg.contains('phonepe') || lowerLabel.contains('phonepe')) {
      return UpiInstalledAppInfo(
        id: 'phonepe',
        displayName: 'PhonePe',
        packageName: 'com.phonepe.app',
        brandColor: const Color(0xFF5F259F),
        brandAccentColor: const Color(0xFF7B1FA2),
        shortName: 'PhonePe',
        iconBytes: iconBytes,
      );
    } else if (lowerPkg.contains('paytm') || lowerLabel.contains('paytm')) {
      return UpiInstalledAppInfo(
        id: 'paytm',
        displayName: 'Paytm',
        packageName: 'net.one97.paytm',
        brandColor: const Color(0xFF00BAF2),
        brandAccentColor: const Color(0xFF002E6E),
        shortName: 'Paytm',
        iconBytes: iconBytes,
      );
    } else if (lowerPkg.contains('dreamplug') || lowerLabel.contains('cred')) {
      return UpiInstalledAppInfo(
        id: 'cred',
        displayName: 'CRED',
        packageName: 'com.dreamplug.androidapp',
        brandColor: const Color(0xFF1E293B),
        brandAccentColor: const Color(0xFF0F172A),
        shortName: 'CRED',
        iconBytes: iconBytes,
      );
    } else if (lowerPkg.contains('bhim') || lowerLabel.contains('bhim')) {
      return UpiInstalledAppInfo(
        id: 'bhim',
        displayName: 'BHIM UPI',
        packageName: 'in.org.npci.upiapp',
        brandColor: const Color(0xFF005696),
        brandAccentColor: const Color(0xFFF37021),
        shortName: 'BHIM',
        iconBytes: iconBytes,
      );
    }

    return UpiInstalledAppInfo(
      id: packageName,
      displayName: label.isNotEmpty ? label : 'UPI App',
      packageName: packageName,
      brandColor: const Color(0xFF2563EB),
      brandAccentColor: const Color(0xFF1D4ED8),
      shortName: label.isNotEmpty ? label : 'UPI',
      iconBytes: iconBytes,
    );
  }
}

class UpiPaymentService {
  const UpiPaymentService();

  static const MethodChannel _channel = MethodChannel(
    'com.friendoo.friendoo/upi',
  );
  static const String payeeVpa = 'friendoo.payments@icici';
  static const String payeeName = 'Friendoo Voice Lounge';

  /// Generates standard NPCI UPI URI
  static String buildUpiUri({
    required double amountInr,
    required String transactionRef,
    String? note,
    String? payeeVpaOverride,
  }) {
    final vpa = payeeVpaOverride ?? payeeVpa;
    final cleanNote = Uri.encodeComponent(note ?? 'Friendoo Coins Recharge');
    final cleanPayeeName = Uri.encodeComponent(payeeName);
    final formattedAmount = amountInr.toStringAsFixed(2);

    return 'upi://pay?pa=$vpa&pn=$cleanPayeeName&am=$formattedAmount&cu=INR&tn=$cleanNote&tr=$transactionRef';
  }

  /// Fetches installed UPI apps directly from Android PackageManager via native MethodChannel
  Future<List<UpiInstalledAppInfo>> getInstalledUpiApps() async {
    try {
      final result = await _channel.invokeListMethod<Map<dynamic, dynamic>>(
        'getInstalledUpiApps',
      );
      if (result != null && result.isNotEmpty) {
        final apps = <UpiInstalledAppInfo>[];
        final seenPackages = <String>{};

        for (final item in result) {
          final pkg = item['packageName']?.toString() ?? '';
          final name = item['name']?.toString() ?? '';
          final iconBase64 = item['iconBase64']?.toString() ?? '';

          Uint8List? iconBytes;
          if (iconBase64.isNotEmpty) {
            try {
              iconBytes = base64Decode(iconBase64);
            } catch (_) {}
          }

          if (pkg.isNotEmpty && !seenPackages.contains(pkg)) {
            seenPackages.add(pkg);
            apps.add(
              UpiInstalledAppInfo.fromPackage(pkg, name, iconBytes: iconBytes),
            );
          }
        }
        if (apps.isNotEmpty) {
          if (kDebugMode) {
            debugPrint(
              'Native installed UPI apps found on device: ${apps.map((a) => a.displayName).toList()}',
            );
          }
          return apps;
        }
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('MethodChannel getInstalledUpiApps error: $e');
      }
    }

    // Default fallback list
    return const [
      UpiInstalledAppInfo(
        id: 'gpay',
        displayName: 'GPay',
        packageName: 'com.google.android.apps.nbu.paisa.user',
        brandColor: Color(0xFF4285F4),
        brandAccentColor: Color(0xFF34A853),
        shortName: 'GPay',
      ),
      UpiInstalledAppInfo(
        id: 'amazonpay',
        displayName: 'Amazon Pay',
        packageName: 'in.amazon.mShop.android.shopping',
        brandColor: Color(0xFFFF9900),
        brandAccentColor: Color(0xFF146EB4),
        shortName: 'Amazon Pay',
      ),
      UpiInstalledAppInfo(
        id: 'kotak',
        displayName: 'Kotak811',
        packageName: 'com.msf.kbank.mobile',
        brandColor: Color(0xFFEE1C25),
        brandAccentColor: Color(0xFF003366),
        shortName: 'Kotak811',
      ),
    ];
  }

  /// Launches direct targeted UPI Intent on Android using native intent.setPackage(packageName)
  /// This completely eliminates the Android "Open with" chooser popup dialog!
  Future<bool> launchDirectUpiApp({
    required String packageName,
    required double amountInr,
    required String transactionRef,
    String? note,
  }) async {
    final upiUri = buildUpiUri(
      amountInr: amountInr,
      transactionRef: transactionRef,
      note: note,
    );

    // 1. Native targeted Android Intent via MethodChannel
    if (packageName.isNotEmpty) {
      try {
        final success = await _channel.invokeMethod<bool>(
          'launchDirectUpiApp',
          {'packageName': packageName, 'uri': upiUri},
        );
        if (success == true) {
          if (kDebugMode) {
            debugPrint(
              'Directly launched $packageName via native intent with 0 popups!',
            );
          }
          return true;
        }
      } catch (e) {
        if (kDebugMode) {
          debugPrint(
            'Native direct launch failed, falling back to url_launcher: $e',
          );
        }
      }
    }

    // 2. Generic url_launcher fallback
    try {
      return await launchUrl(
        Uri.parse(upiUri),
        mode: LaunchMode.externalApplication,
      );
    } catch (_) {
      return false;
    }
  }
}
