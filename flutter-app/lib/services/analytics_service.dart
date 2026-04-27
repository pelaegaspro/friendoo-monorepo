import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import '../core/constants/app_constants.dart';
import '../models/host_model.dart';

class AppAnalyticsService {
  AppAnalyticsService._();

  static final _firestore = FirebaseFirestore.instance;
  static final _auth = FirebaseAuth.instance;

  static Future<void> logEvent(
    String name, {
    Map<String, dynamic> parameters = const {},
  }) async {
    try {
      await _firestore.collection(AppConstants.analyticsEventsCollection).add({
        'name': name,
        'userId': _auth.currentUser?.uid,
        'parameters': parameters,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (error) {
      debugPrint('Analytics event "$name" skipped: $error');
    }
  }

  static Future<void> logHomeView() {
    return logEvent('home_view');
  }

  static Future<void> logHostProfileOpen(HostModel host) {
    return logEvent('host_profile_open', parameters: {
      'hostId': host.uid,
      'hostName': host.name,
      'isOnline': host.isOnline,
      'rating': host.rating,
    });
  }

  static Future<void> logCallStartAttempt(HostModel host) {
    return logEvent('call_start_attempt', parameters: {
      'hostId': host.uid,
      'hostName': host.name,
      'ratePerMinute': host.ratePerAudioMinute,
    });
  }

  static Future<void> logCallStartBlocked(
    HostModel host,
    String reason,
  ) {
    return logEvent('call_start_blocked', parameters: {
      'hostId': host.uid,
      'reason': reason,
    });
  }

  static Future<void> logCallSuccess({
    required String hostId,
    required String callDocId,
  }) {
    return logEvent('call_success', parameters: {
      'hostId': hostId,
      'callDocId': callDocId,
    });
  }

  static Future<void> logCallEnd({
    required String hostId,
    required String reason,
    required int durationSeconds,
    required int coinsDeducted,
  }) {
    return logEvent('call_end', parameters: {
      'hostId': hostId,
      'reason': reason,
      'durationSeconds': durationSeconds,
      'coinsDeducted': coinsDeducted,
    });
  }
}
