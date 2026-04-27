import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/coin_package_model.dart';
import '../../../models/coin_transaction_model.dart';

import '../../auth/providers/auth_provider.dart';

final coinPackagesProvider = StreamProvider<List<CoinPackageModel>>((ref) {
  final firestore = ref.watch(firestoreProvider);

  return firestore
      .collection(AppConstants.coinPackagesCollection)
      .where('isActive', isEqualTo: true)
      .orderBy('coins')
      .snapshots()
      .map((snapshot) {
    return snapshot.docs
        .map((doc) => CoinPackageModel.fromJson(doc.id, doc.data()))
        .toList();
  });
});

final userTransactionsProvider =
    StreamProvider<List<CoinTransactionModel>>((ref) {
  final firestore = ref.watch(firestoreProvider);
  final auth = ref.watch(firebaseAuthProvider);

  final user = auth.currentUser;
  if (user == null) return const Stream.empty();

  return firestore
      .collection(AppConstants.coinTransactionsCollection)
      .where('userId', isEqualTo: user.uid)
      .limit(50)
      .snapshots()
      .map((snapshot) {
    DateTime parseTimestamp(dynamic value) {
      if (value is Timestamp) return value.toDate();
      if (value is DateTime) return value;
      return DateTime.now();
    }

    final transactions = snapshot.docs.map((doc) {
      final data = doc.data();
      final rawType = (data['type'] as String?)?.toLowerCase() ?? 'debit';
      final normalizedType = rawType == 'topup' ? 'purchase' : rawType;
      return CoinTransactionModel(
        id: doc.id,
        userId: data['userId'] as String? ?? '',
        type: normalizedType,
        coins: (data['amountCoins'] as num?)?.toInt() ??
            (data['coins'] as num?)?.toInt() ??
            (data['amount'] as num?)?.toInt() ??
            0,
        amountINR: (data['amountINR'] as num?)?.toDouble() ??
            (data['amountInr'] as num?)?.toDouble(),
        totalAmountINR: (data['totalAmountINR'] as num?)?.toDouble() ??
            (data['amountInr'] as num?)?.toDouble(),
        description: data['description'] as String? ??
            (normalizedType == 'purchase'
                ? 'Coin purchase'
                : 'Wallet transaction'),
        razorpayOrderId:
            data['razorpayOrderId'] as String? ?? data['razorpayId'] as String?,
        timestamp: parseTimestamp(
          data['createdAt'] ?? data['timestamp'] ?? data['updatedAt'],
        ),
      );
    }).toList();

    transactions.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return transactions;
  });
});

class WalletState {
  final bool isLoading;
  final String? error;
  final bool purchaseSuccess;

  WalletState({
    this.isLoading = false,
    this.error,
    this.purchaseSuccess = false,
  });

  WalletState copyWith({
    bool? isLoading,
    String? error,
    bool? purchaseSuccess,
  }) {
    return WalletState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      purchaseSuccess: purchaseSuccess ?? false,
    );
  }
}

class WalletNotifier extends StateNotifier<WalletState> {
  final FirebaseFirestore _firestore;
  final FirebaseAuth _auth;

  WalletNotifier(this._firestore, this._auth) : super(WalletState());

  Future<String?> purchaseCoins(CoinPackageModel package) async {
    final user = _auth.currentUser;
    if (user == null) return 'Not authenticated';

    state = state.copyWith(isLoading: true, error: null);

    try {
      // NOTE: Direct coin writes are removed — the Razorpay webhook Cloud Function
      // (razorpayWebhook) handles coinBalance credits server-side after payment.
      // This method now only creates the Razorpay order via Cloud Function.
      // The coin credit happens automatically when the webhook fires.

      // Log a pending transaction record (no coin write — server handles it)
      final txnRef =
          _firestore.collection(AppConstants.coinTransactionsCollection).doc();

      await txnRef.set({
        'userId': user.uid,
        'type': 'pending',
        'packageId': package.id,
        'amountCoins': package.totalCoins,
        'amountINR': package.priceINR,
        'totalAmountINR': package.totalPriceINR,
        'description': 'Purchased ${package.coins} coin package',
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      });

      state = state.copyWith(isLoading: false, purchaseSuccess: true);
      return null;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return e.toString();
    }
  }

  void clearSuccess() {
    state = state.copyWith(purchaseSuccess: false);
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final walletNotifierProvider =
    StateNotifierProvider<WalletNotifier, WalletState>((ref) {
  final firestore = ref.watch(firestoreProvider);
  final auth = ref.watch(firebaseAuthProvider);
  return WalletNotifier(firestore, auth);
});
