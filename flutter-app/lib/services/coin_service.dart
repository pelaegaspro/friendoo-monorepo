import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';
import '../core/constants/app_constants.dart';

class CoinService {
  static const int normalRate = 5; // coins per minute (display only)
  static const int starRate =
      7; // coins per minute for star users (display only)

  final FirebaseFirestore _firestore;
  final FirebaseFunctions _functions;

  CoinService({FirebaseFirestore? firestore, FirebaseFunctions? functions})
      : _firestore = firestore ?? FirebaseFirestore.instance,
        _functions = functions ?? FirebaseFunctions.instance;

  /// Check if user is a star user
  Future<bool> isStarUser(String uid) async {
    try {
      final doc = await _firestore
          .collection(AppConstants.usersCollection)
          .doc(uid)
          .get();
      if (!doc.exists) return false;
      final data = doc.data()!;
      final isStar = data['isStar'] == true;
      if (!isStar) return false;
      final expiry = data['starExpiry'];
      if (expiry == null) return false;
      final expiryDate = (expiry as Timestamp).toDate();
      return expiryDate.isAfter(DateTime.now());
    } catch (e) {
      debugPrint('CoinService.isStarUser error: $e');
      return false;
    }
  }

  /// Get current coin balance — direct Firestore read (safe, read-only)
  Future<int> getBalance(String uid) async {
    try {
      final doc = await _firestore
          .collection(AppConstants.usersCollection)
          .doc(uid)
          .get();
      if (!doc.exists) return 0;
      final data = doc.data()!;
      // Support both field names during migration
      return (data['coinBalance'] as num?)?.toInt() ??
          (data['coins'] as num?)?.toInt() ??
          0;
    } catch (e) {
      debugPrint('CoinService.getBalance error: $e');
      return 0;
    }
  }

  /// Stream coin balance for real-time updates — direct Firestore read (safe)
  Stream<int> coinBalanceStream(String uid) {
    return _firestore
        .collection(AppConstants.usersCollection)
        .doc(uid)
        .snapshots()
        .map((doc) {
      if (!doc.exists) return 0;
      final data = doc.data()!;
      return (data['coinBalance'] as num?)?.toInt() ??
          (data['coins'] as num?)?.toInt() ??
          0;
    });
  }

  /// Get coin rate for user (display only — actual rate is fetched server-side)
  Future<int> getRateForUser(String uid) async {
    final star = await isStarUser(uid);
    return star ? starRate : normalRate;
  }

  /// Deduct coins via Cloud Function — NEVER writes directly to Firestore.
  /// The Cloud Function fetches coinsPerMinute from hosts/{hostId} server-side.
  /// Returns the new balance, or throws on failure.
  Future<int> deductCoins(
    String uid,
    int amount, {
    String? description,
    String? hostId,
    String? callId,
  }) async {
    try {
      final callable = _functions.httpsCallable('deductCallCoins');
      final result = await callable.call(<String, dynamic>{
        'hostId': hostId ?? '',
        'callId': callId ?? '',
      });
      return (result.data['newBalance'] as num).toInt();
    } on FirebaseFunctionsException catch (e) {
      debugPrint('CoinService.deductCoins error: ${e.code} — ${e.message}');
      rethrow;
    } catch (e) {
      debugPrint('CoinService.deductCoins error: $e');
      rethrow;
    }
  }

  /// Add coins via Cloud Function — NEVER writes directly to Firestore.
  /// Returns the new balance, or throws on failure.
  Future<int> addCoins(
    String uid,
    int amount, {
    required String description,
    String? razorpayId,
    String? packageId,
  }) async {
    try {
      final callable = _functions.httpsCallable('addCoins');
      final result = await callable.call(<String, dynamic>{
        'amount': amount,
        'description': description,
        if (razorpayId != null) 'razorpayId': razorpayId,
        if (packageId != null) 'packageId': packageId,
      });
      return (result.data['newBalance'] as num).toInt();
    } on FirebaseFunctionsException catch (e) {
      debugPrint('CoinService.addCoins error: ${e.code} — ${e.message}');
      rethrow;
    } catch (e) {
      debugPrint('CoinService.addCoins error: $e');
      rethrow;
    }
  }

  /// Check if user has enough coins for at least 1 minute (display check only)
  Future<bool> hasEnoughCoins(String uid) async {
    final balance = await getBalance(uid);
    final rate = await getRateForUser(uid);
    return balance >= rate;
  }
}
