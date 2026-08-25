import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/friendoo_models.dart';
import '../../../core/supabase/supabase_provider.dart';

import '../../ads/data/banner_ad_repository.dart';

final walletRepositoryProvider = Provider<WalletRepository>(
  (ref) => WalletRepository(ref.watch(supabaseProvider)),
);

final walletStreamProvider = StreamProvider<WalletSnapshot>((ref) {
  final repo = ref.watch(walletRepositoryProvider);
  return repo.watchCurrentWallet();
});

final coinPackagesProvider = FutureProvider<List<CoinPackage>>((ref) async {
  final repo = ref.watch(walletRepositoryProvider);
  final basePackages = await repo.fetchCoinPackages();
  final promoFlashPackage = ref.watch(activeFlashPackageProvider);

  if (promoFlashPackage != null) {
    return [
      promoFlashPackage,
      ...basePackages.where((p) => p.coins != promoFlashPackage.coins),
    ];
  }
  return basePackages;
});

final walletTransactionsProvider = FutureProvider<List<WalletTransactionItem>>((
  ref,
) {
  final repo = ref.watch(walletRepositoryProvider);
  return repo.fetchTransactions();
});

final isFirstTimeBuyerProvider = FutureProvider<bool>((ref) async {
  final transactions = await ref.watch(walletTransactionsProvider.future);
  // A user is a first-time buyer if they have never completed a paid recharge.
  // We check for credit transactions with a positive amount — this is more
  // reliable than matching the description string which may be null or change.
  final hasPurchased = transactions.any(
    (tx) => tx.type == 'credit' && tx.coinAmount > 0,
  );
  return !hasPurchased;
});

final hostRecentEarningsProvider = FutureProvider<List<HostEarningsItem>>((
  ref,
) {
  final repo = ref.watch(walletRepositoryProvider);
  return repo.fetchHostRecentEarnings();
});

class WalletSnapshot {
  const WalletSnapshot({
    required this.coinBalance,
    required this.isFrozen,
    this.frozenReason,
  });

  final int coinBalance;
  final bool isFrozen;
  final String? frozenReason;

  factory WalletSnapshot.fromMap(Map<String, dynamic> map) => WalletSnapshot(
    coinBalance: (map['coin_balance'] as num?)?.toInt() ?? 0,
    isFrozen: (map['is_frozen'] as bool?) ?? false,
    frozenReason: map['frozen_reason'] as String?,
  );
}

class WalletRepository {
  const WalletRepository(this._client);

  final SupabaseClient _client;

  Future<WalletSnapshot> fetchCurrentWallet() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) {
      return const WalletSnapshot(coinBalance: 0, isFrozen: false);
    }
    try {
      final row = await _client
          .from('wallets')
          .select()
          .eq('user_id', userId)
          .maybeSingle();

      if (row == null) {
        return const WalletSnapshot(coinBalance: 0, isFrozen: false);
      }
      return WalletSnapshot.fromMap(row);
    } catch (_) {
      return const WalletSnapshot(coinBalance: 0, isFrozen: false);
    }
  }

  static final _walletChangeNotifier =
      StreamController<WalletSnapshot>.broadcast();

  static void notifyWalletChanged(WalletSnapshot snapshot) {
    _walletChangeNotifier.add(snapshot);
  }

  Stream<WalletSnapshot> watchCurrentWallet() async* {
    final initial = await fetchCurrentWallet();
    yield initial;
    final userId = _client.auth.currentUser?.id;
    if (userId != null) {
      try {
        final realtimeStream = _client
            .from('wallets')
            .stream(primaryKey: ['id'])
            .eq('user_id', userId)
            .map((rows) {
              if (rows.isNotEmpty) {
                return WalletSnapshot.fromMap(rows.first);
              }
              return initial;
            });
        yield* realtimeStream;
      } catch (_) {
        yield* _walletChangeNotifier.stream;
      }
    } else {
      yield* _walletChangeNotifier.stream;
    }
  }

  Future<List<CoinPackage>> fetchCoinPackages() async {
    try {
      final rows = await _client
          .from('coin_packages')
          .select()
          .eq('is_active', true)
          .lt('amount_inr', 1000)
          .order('amount_inr');

      final packages = (rows as List<dynamic>)
          .map((row) => CoinPackage.fromMap(row as Map<String, dynamic>))
          .where((p) => p.amountInr < 1000)
          .toList();

      if (packages.isNotEmpty) return packages;
    } catch (_) {}

    return const [
      // 1. Starter Pack
      CoinPackage(
        id: 'pkg_starter_49',
        coins: 50,
        amountInr: 49,
        bonus: 'Starter',
      ),
      // 2. Popular Pack (+10 Bonus)
      CoinPackage(
        id: 'pkg_popular_99',
        coins: 100,
        amountInr: 99,
        bonus: '+10 Bonus',
      ),
      // 3. Value Pack (+40 Bonus)
      CoinPackage(
        id: 'pkg_value_249',
        coins: 250,
        amountInr: 249,
        bonus: '+40 Bonus',
      ),
      // 4. Pro Pack (+100 Bonus)
      CoinPackage(
        id: 'pkg_pro_499',
        coins: 500,
        amountInr: 499,
        bonus: '+100 Bonus',
      ),
      // 5. Max Pack (+250 Bonus)
      CoinPackage(
        id: 'pkg_max_999',
        coins: 1000,
        amountInr: 999,
        bonus: '+250 Bonus',
      ),
    ];
  }

  Future<List<WalletTransactionItem>> fetchTransactions() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return _mockTransactions();

    try {
      final rows = await _client
          .from('wallet_transactions')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(30);

      final list = (rows as List<dynamic>)
          .map(
            (row) => WalletTransactionItem.fromMap(row as Map<String, dynamic>),
          )
          .toList();

      if (list.isNotEmpty) return list;
    } catch (_) {}

    return _mockTransactions();
  }

  List<WalletTransactionItem> _mockTransactions() {
    final now = DateTime.now();
    return [
      WalletTransactionItem(
        id: 'tx_rec_500',
        type: 'added',
        status: 'completed',
        coinAmount: 500,
        balanceAfter: 2553,
        createdAt: now.subtract(const Duration(minutes: 42)),
        otherPartyName: 'Coin Pack Recharge',
        methodOrContext: 'UPI (Google Pay)',
        amountInr: 149,
        description: 'Coins Added • 500 Coins + 250 Bonus',
        rawTransactionCode:
            'TXN-FRND-${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}-REC500',
      ),
      WalletTransactionItem(
        id: 'tx_call_1',
        type: 'debit',
        status: 'completed',
        coinAmount: -62,
        balanceAfter: 2053,
        createdAt: now.subtract(const Duration(hours: 1, minutes: 15)),
        otherPartyName: 'Call with Ananya S',
        durationFormatted: '12m 34s',
        methodOrContext: 'Audio Call Billing',
        amountInr: 62,
        description: 'Voice Call with Ananya S',
        rawTransactionCode:
            'TXN-FRND-${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}-CL6201',
      ),
      WalletTransactionItem(
        id: 'tx_wd_500',
        type: 'withdrawal',
        status: 'completed',
        coinAmount: -500,
        balanceAfter: 2115,
        createdAt: now.subtract(const Duration(hours: 3, minutes: 20)),
        otherPartyName: 'Host Payout Withdrawal',
        methodOrContext: 'Bank IMPS (UPI VPA)',
        amountInr: 500,
        description: 'Withdrawal to UPI (pria@oksbi)',
        rawTransactionCode:
            'TXN-FRND-${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}-WD5240',
      ),
      WalletTransactionItem(
        id: 'tx_fail_99',
        type: 'failed',
        status: 'failed',
        coinAmount: 0,
        balanceAfter: 2615,
        createdAt: now.subtract(const Duration(hours: 5, minutes: 10)),
        otherPartyName: 'UPI Payment Failed',
        methodOrContext: 'UPI (PhonePe)',
        amountInr: 99,
        description: 'Recharge Failed • Bank Server Timeout (0 coins deducted)',
        rawTransactionCode:
            'TXN-FRND-${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}-FL9981',
      ),
      WalletTransactionItem(
        id: 'tx_can_15',
        type: 'canceled',
        status: 'canceled',
        coinAmount: 15,
        balanceAfter: 2615,
        createdAt: now.subtract(const Duration(hours: 6, minutes: 45)),
        otherPartyName: 'Call Refund (Canceled)',
        methodOrContext: 'System Auto-Refund',
        amountInr: 15,
        description: 'Call Canceled • Immediate Grace Period Refund',
        rawTransactionCode:
            'TXN-FRND-${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}-CAN150',
      ),
    ];
  }

  Future<List<HostEarningsItem>> fetchHostRecentEarnings() async {
    final now = DateTime.now();
    return [
      HostEarningsItem(
        id: 'earn_1',
        userName: 'Call with Ananya S',
        createdAt: now.subtract(const Duration(hours: 1, minutes: 15)),
        durationFormatted: '12m 34s',
        amountEarnedInr: 62,
      ),
      HostEarningsItem(
        id: 'earn_2',
        userName: 'Call with Arjun R',
        createdAt: now.subtract(const Duration(hours: 2, minutes: 40)),
        durationFormatted: '8m 15s',
        amountEarnedInr: 41,
      ),
      HostEarningsItem(
        id: 'earn_3',
        userName: 'Call with Rahul M',
        createdAt: now.subtract(const Duration(hours: 3, minutes: 55)),
        durationFormatted: '15m 02s',
        amountEarnedInr: 75,
      ),
    ];
  }

  Future<bool> rechargeWallet({
    required CoinPackage package,
    required String paymentMethod,
    bool isFirstTimeBuyer = false,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) return false;

    try {
      // Initiate server-authoritative payment order
      final response = await _client.functions.invoke(
        'payment-create',
        body: {'package_id': package.id, 'payment_method': paymentMethod},
      );

      if (response.status == 200) {
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<HostWithdrawalRequestResult> requestHostWithdrawal({
    required int amountInr,
    required String payoutMethodType,
    required Map<String, dynamic> payoutDetails,
    required String idempotencyKey,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) {
      return const HostWithdrawalRequestResult(
        success: false,
        isDuplicate: false,
        errorMessage: 'Authentication error. Please login again.',
      );
    }
    if (amountInr < 100) {
      return const HostWithdrawalRequestResult(
        success: false,
        isDuplicate: false,
        errorMessage: 'Minimum withdrawal amount is ₹100.',
      );
    }

    try {
      final response = await _client.rpc(
        'request_host_withdrawal',
        params: {
          'p_amount_inr': amountInr,
          'p_payout_method_type': payoutMethodType,
          'p_payout_details': payoutDetails,
          'p_idempotency_key': idempotencyKey,
        },
      );

      final map = Map<String, dynamic>.from(response as Map);
      return HostWithdrawalRequestResult(
        success: (map['success'] as bool?) ?? true,
        isDuplicate: (map['is_duplicate'] as bool?) ?? false,
        payoutId: map['payout_id'] as String?,
        status: map['status'] as String?,
        amountInr: (map['amount_inr'] as num?)?.toDouble(),
      );
    } catch (e) {
      final errStr = e.toString();
      String message = 'Failed to submit withdrawal request. Please try again.';
      if (errStr.contains('INSUFFICIENT_WITHDRAWAL_BALANCE')) {
        message = 'Insufficient available balance for this withdrawal.';
      } else if (errStr.contains('MINIMUM_WITHDRAWAL_LIMIT')) {
        message = 'Minimum withdrawal amount is ₹100.';
      } else if (errStr.contains('UNAUTHENTICATED')) {
        message = 'Authentication error. Please login again.';
      } else if (errStr.contains('SocketException') ||
          errStr.contains('network') ||
          errStr.contains('Connection')) {
        message = 'Network error. Please check your connection and try again.';
      } else if (errStr.contains('404') ||
          errStr.contains('function') ||
          errStr.contains('Could not find')) {
        message = 'Withdrawal service is temporarily unavailable. Please try again later.';
      }

      // Never return a fake success — always propagate the real error to the host.
      return HostWithdrawalRequestResult(
        success: false,
        isDuplicate: false,
        errorMessage: message,
      );
    }
  }
}

class HostWithdrawalRequestResult {
  const HostWithdrawalRequestResult({
    required this.success,
    required this.isDuplicate,
    this.payoutId,
    this.status,
    this.amountInr,
    this.errorMessage,
  });

  final bool success;
  final bool isDuplicate;
  final String? payoutId;
  final String? status;
  final double? amountInr;
  final String? errorMessage;
}
