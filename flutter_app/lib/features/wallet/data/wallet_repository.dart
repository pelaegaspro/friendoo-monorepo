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

  factory WalletSnapshot.fromMap(Map<String, dynamic> map) {
    final rawBalance = map['coin_balance'];
    if (rawBalance is! num) {
      throw const FormatException('Wallet response has no valid coin balance');
    }
    return WalletSnapshot(
      coinBalance: rawBalance.toInt(),
      isFrozen: map['is_frozen'] as bool? ?? false,
      frozenReason: map['frozen_reason'] as String?,
    );
  }
}

class WalletUnavailableException implements Exception {
  const WalletUnavailableException(this.message, [this.cause]);

  final String message;
  final Object? cause;

  @override
  String toString() => 'WalletUnavailableException: $message';
}

class WalletRepository {
  const WalletRepository(this._client);

  final SupabaseClient _client;

  Future<WalletSnapshot> fetchCurrentWallet() async {
    final user = _client.auth.currentUser;
    // Wallet data must never fall back to the cached profile. That cache can
    // belong to the previous phone during session restoration.
    final userId = user?.id;
    if (userId == null) {
      throw const WalletUnavailableException('No authenticated user session');
    }
    try {
      final row = await _client
          .from('wallets')
          .select()
          .eq('user_id', userId)
          .maybeSingle();

      if (row == null) {
        throw const WalletUnavailableException('Wallet record was not found');
      }
      return WalletSnapshot.fromMap(row);
    } catch (error) {
      if (error is WalletUnavailableException) rethrow;
      throw WalletUnavailableException('Unable to load wallet balance', error);
    }
  }

  static final _walletChangeNotifier =
      StreamController<WalletSnapshot>.broadcast();

  static void notifyWalletChanged(WalletSnapshot snapshot) {
    _walletChangeNotifier.add(snapshot);
  }

  Stream<WalletSnapshot> watchCurrentWallet() async* {
    WalletSnapshot? latest;
    try {
      latest = await fetchCurrentWallet();
      yield latest;
    } catch (_) {
      if (_client.auth.currentUser == null) {
        throw const WalletUnavailableException('No authenticated user session');
      }
    }

    final user = _client.auth.currentUser;
    final userId = user?.id;
    if (userId == null) {
      throw const WalletUnavailableException('No authenticated user session');
    }

    final controller = StreamController<WalletSnapshot>();

    // Listen to local in-app wallet mutation triggers (call completion, recharge success)
    final localSub = _walletChangeNotifier.stream.listen((snapshot) {
      latest = snapshot;
      if (!controller.isClosed) controller.add(snapshot);
    });

    // Realtime Supabase stream: must NEVER throw or destroy current balance on empty/error
    StreamSubscription? realtimeSub;
    try {
      realtimeSub = _client
          .from('wallets')
          // wallets.user_id is the table primary key; there is no id column.
          .stream(primaryKey: ['user_id'])
          .eq('user_id', userId)
          .listen(
            (rows) {
              if (rows.isNotEmpty) {
                try {
                  final snap = WalletSnapshot.fromMap(rows.first);
                  latest = snap;
                  if (!controller.isClosed) controller.add(snap);
                } catch (_) {}
              }
            },
            onError: (_) {
              // Realtime CDC errors must not destroy the active wallet balance
            },
          );
    } catch (_) {}

    // Periodic poll every 15 seconds to pick up backend/webhook balance changes
    final timer = Timer.periodic(const Duration(seconds: 15), (_) async {
      try {
        final fresh = await fetchCurrentWallet();
        if (latest == null || fresh.coinBalance != latest!.coinBalance) {
          latest = fresh;
          if (!controller.isClosed) controller.add(fresh);
        }
      } catch (_) {}
    });

    controller.onCancel = () {
      localSub.cancel();
      realtimeSub?.cancel();
      timer.cancel();
      controller.close();
    };

    yield* controller.stream;
  }

  Future<List<CoinPackage>> fetchCoinPackages() async {
    try {
      final rows = await _client
          .from('coin_packages')
          .select()
          .eq('is_active', true)
          .lt('amount_inr', 1000)
          .order('amount_inr');

      final raw = (rows as List<dynamic>)
          .map((row) => CoinPackage.fromMap(row as Map<String, dynamic>))
          .where((p) => p.amountInr < 1000);

      // Deduplicate packages by amountInr, prioritizing canonical pkg_* ids
      final uniqueMap = <int, CoinPackage>{};
      for (final p in raw) {
        if (!uniqueMap.containsKey(p.amountInr) || p.id.startsWith('pkg_')) {
          uniqueMap[p.amountInr] = p;
        }
      }
      final packages = uniqueMap.values.toList()
        ..sort((a, b) => a.amountInr.compareTo(b.amountInr));

      if (packages.isNotEmpty) return packages;
    } catch (_) {}

    return const [
      CoinPackage(id: 'base_15', coins: 15, amountInr: 15),
      CoinPackage(id: 'base_25', coins: 25, amountInr: 25),
      CoinPackage(id: 'base_50', coins: 50, amountInr: 50),
      CoinPackage(id: 'base_100', coins: 100, amountInr: 100),
      CoinPackage(id: 'offer_140', coins: 140, amountInr: 140),
      CoinPackage(id: 'offer_200', coins: 200, amountInr: 200),
      CoinPackage(id: 'offer_300', coins: 300, amountInr: 300),
      CoinPackage(id: 'offer_500', coins: 500, amountInr: 500),
      CoinPackage(id: 'offer_900', coins: 900, amountInr: 900),
    ];
  }

  Future<List<WalletTransactionItem>> fetchTransactions() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return const <WalletTransactionItem>[];

    try {
      final rows = await _client
          .from('wallet_transactions')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(50);

      return (rows as List<dynamic>)
          .map(
            (row) => WalletTransactionItem.fromMap(row as Map<String, dynamic>),
          )
          .toList();
    } catch (_) {
      return const <WalletTransactionItem>[];
    }
  }

  Future<List<HostEarningsItem>> fetchHostRecentEarnings() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return const <HostEarningsItem>[];

    try {
      final rows = await _client
          .from('calls')
          .select(
            'id, caller_id, started_at, ended_at, total_coins_deducted, created_at, caller:profiles!caller_id(display_name)',
          )
          .eq('host_id', userId)
          .eq('status', 'ended')
          .order('created_at', ascending: false)
          .limit(30);

      return (rows as List<dynamic>).map((row) {
        final map = row as Map<String, dynamic>;
        final started = map['started_at'] != null
            ? DateTime.tryParse(map['started_at'].toString())
            : null;
        final ended = map['ended_at'] != null
            ? DateTime.tryParse(map['ended_at'].toString())
            : null;
        final durationSeconds = (started != null && ended != null)
            ? ended.difference(started).inSeconds
            : 0;
        final mins = durationSeconds ~/ 60;
        final secs = durationSeconds % 60;
        final callerMap = map['caller'] as Map<String, dynamic>?;
        final callerName = callerMap?['display_name'] as String? ?? 'Caller';
        final coins = (map['total_coins_deducted'] as num?)?.toInt() ?? 0;
        final hostEarned = (coins * 0.6).round(); // 60% host split

        return HostEarningsItem(
          id: map['id'].toString(),
          userName: 'Call with $callerName',
          createdAt:
              DateTime.tryParse(map['created_at'].toString()) ?? DateTime.now(),
          durationFormatted: '${mins}m ${secs.toString().padLeft(2, '0')}s',
          amountEarnedInr: hostEarned,
        );
      }).toList();
    } catch (_) {
      return const <HostEarningsItem>[];
    }
  }

  Future<Map<String, dynamic>?> rechargeWallet({
    required CoinPackage package,
    required String paymentMethod,
    bool isFirstTimeBuyer = false,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) {
      return {'error': 'Please login to recharge your wallet.'};
    }

    try {
      // Initiate server-authoritative payment order
      final response = await _client.functions.invoke(
        'payment-create',
        body: {'package_id': package.id, 'payment_method': paymentMethod},
      );

      if (response.status == 200 && response.data is Map) {
        return Map<String, dynamic>.from(response.data as Map);
      }
      final data = response.data;
      final errorMessage = data is Map && data['error'] is String
          ? data['error'] as String
          : 'Unable to initiate payment order (HTTP ${response.status}).';
      return {'error': errorMessage};
    } on FunctionsHttpException catch (e) {
      final details = e.details;
      String? message;
      if (details is Map && details['error'] is String) {
        message = details['error'] as String;
      }
      if (message != null && message.toLowerCase().contains('cashfree')) {
        return {
          'error': 'Payment gateway is not configured or sandbox/production credentials need activation in Supabase secrets.',
        };
      }
      return {
        'error':
            message ??
            'Payment service temporarily unavailable (${e.status}). Please try again shortly.',
      };
    } catch (e) {
      return {
        'error': 'Unable to connect to payment service. Please check your internet connection.',
      };
    }
  }

  Future<bool> confirmCashfreePayment({required String providerOrderId}) async {
    final user = _client.auth.currentUser;
    if (user == null || providerOrderId.isEmpty) return false;

    try {
      final response = await _client.functions.invoke(
        'payment-confirm',
        body: {'provider_order_id': providerOrderId},
      );
      if (response.status != 200 || response.data is! Map) return false;
      final data = Map<String, dynamic>.from(response.data as Map);
      return data['paid'] == true && data['settled'] == true;
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
