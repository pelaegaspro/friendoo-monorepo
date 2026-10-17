import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/friendoo_models.dart';
import '../../../core/supabase/supabase_provider.dart';
import 'wallet_repository.dart';

/// State of Google Play IAP purchase flow
sealed class GooglePlayPurchaseState {
  const GooglePlayPurchaseState();
}

class GooglePlayPurchaseIdle extends GooglePlayPurchaseState {
  const GooglePlayPurchaseIdle();
}

class GooglePlayPurchaseLoading extends GooglePlayPurchaseState {
  final String message;
  const GooglePlayPurchaseLoading(this.message);
}

class GooglePlayPurchaseSuccess extends GooglePlayPurchaseState {
  final int coinsCredited;
  final int newBalance;
  final bool alreadyCredited;
  const GooglePlayPurchaseSuccess({
    required this.coinsCredited,
    required this.newBalance,
    this.alreadyCredited = false,
  });
}

class GooglePlayPurchaseError extends GooglePlayPurchaseState {
  final String message;
  const GooglePlayPurchaseError(this.message);
}

final googlePlayIapServiceProvider =
    NotifierProvider<GooglePlayIapNotifier, GooglePlayPurchaseState>(
  GooglePlayIapNotifier.new,
);

class GooglePlayIapNotifier extends Notifier<GooglePlayPurchaseState> {
  SupabaseClient get _client => ref.watch(supabaseProvider);
  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _subscription;
  final Map<String, ProductDetails> _products = {};
  bool _isStoreAvailable = false;

  bool get isStoreAvailable => _isStoreAvailable;
  Map<String, ProductDetails> get products => _products;

  @override
  GooglePlayPurchaseState build() {
    ref.onDispose(() {
      _subscription?.cancel();
    });

    _initialize();
    return const GooglePlayPurchaseIdle();
  }

  void _initialize() {
    final purchaseStream = _iap.purchaseStream;
    _subscription = purchaseStream.listen(
      _handlePurchaseUpdates,
      onDone: () => _subscription?.cancel(),
      onError: (error) {
        debugPrint('[GooglePlayIAP] Stream error: $error');
        state = GooglePlayPurchaseError('Billing stream error: $error');
      },
    );
    _checkAvailabilityAndLoad();
  }

  Future<void> _checkAvailabilityAndLoad() async {
    try {
      _isStoreAvailable = await _iap.isAvailable();
      if (!_isStoreAvailable) {
        debugPrint('[GooglePlayIAP] Google Play Billing not available on this device');
        return;
      }
      await loadPackageProducts();
    } catch (e) {
      debugPrint('[GooglePlayIAP] Init error: $e');
    }
  }

  /// Maps canonical Friendoo package IDs to candidate Google Play product IDs
  static Set<String> getCanonicalProductIds() {
    return {
      'pkg_15', 'friendoo_coins_15', 'coins_15',
      'pkg_25', 'friendoo_coins_25', 'coins_25',
      'pkg_50', 'friendoo_coins_50', 'coins_50',
      'pkg_100', 'friendoo_coins_100', 'coins_100',
      'pkg_140', 'friendoo_coins_140', 'coins_140',
      'pkg_200', 'friendoo_coins_200', 'coins_200',
      'pkg_300', 'friendoo_coins_300', 'coins_300',
      'pkg_500', 'friendoo_coins_500', 'coins_500',
      'pkg_900', 'friendoo_coins_900', 'coins_900',
    };
  }

  Future<void> loadPackageProducts() async {
    try {
      final ids = getCanonicalProductIds();
      final response = await _iap.queryProductDetails(ids);
      if (response.error != null) {
        debugPrint('[GooglePlayIAP] queryProductDetails error: ${response.error!.message}');
        return;
      }
      for (final product in response.productDetails) {
        _products[product.id] = product;
      }
      debugPrint('[GooglePlayIAP] Loaded ${_products.length} products from Google Play');
    } catch (e) {
      debugPrint('[GooglePlayIAP] loadPackageProducts exception: $e');
    }
  }

  ProductDetails? findProductForPackage(CoinPackage package) {
    // 1. Direct package id match
    if (_products.containsKey(package.id)) return _products[package.id];

    // 2. friendoo_coins_X match
    final cleanCoins = package.id.replaceAll('pkg_', '').replaceAll('base_', '').replaceAll('offer_', '');
    final friendooId = 'friendoo_coins_$cleanCoins';
    if (_products.containsKey(friendooId)) return _products[friendooId];

    // 3. coins_X match
    final coinsId = 'coins_$cleanCoins';
    if (_products.containsKey(coinsId)) return _products[coinsId];

    // 4. pkg_X match
    final pkgId = 'pkg_$cleanCoins';
    if (_products.containsKey(pkgId)) return _products[pkgId];

    return null;
  }

  /// Launch official Google Play In-App Purchase sheet for coin package
  Future<bool> buyCoinPackage(CoinPackage package) async {
    if (!_isStoreAvailable) {
      state = const GooglePlayPurchaseError(
        'Google Play Store Billing is not available on this device or platform.',
      );
      return false;
    }

    state = const GooglePlayPurchaseLoading('Connecting to Google Play...');

    var product = findProductForPackage(package);
    if (product == null) {
      await loadPackageProducts();
      product = findProductForPackage(package);
    }

    if (product == null) {
      state = GooglePlayPurchaseError(
        'Coin pack "${package.coins} Coins" is being configured in Google Play Console. Please try again shortly.',
      );
      return false;
    }

    try {
      final purchaseParam = PurchaseParam(productDetails: product);
      state = const GooglePlayPurchaseLoading('Launching Google Play Checkout...');
      final launched = await _iap.buyConsumable(
        purchaseParam: purchaseParam,
        autoConsume: false, // We consume strictly after verified server credit
      );
      return launched;
    } catch (e) {
      state = GooglePlayPurchaseError('Failed to initiate Google Play checkout: $e');
      return false;
    }
  }

  /// Reset state to idle
  void resetState() {
    state = const GooglePlayPurchaseIdle();
  }

  Future<void> _handlePurchaseUpdates(List<PurchaseDetails> purchaseDetailsList) async {
    for (final purchase in purchaseDetailsList) {
      switch (purchase.status) {
        case PurchaseStatus.pending:
          state = const GooglePlayPurchaseLoading('Payment is processing with Google Play...');
          break;

        case PurchaseStatus.purchased:
        case PurchaseStatus.restored:
          state = const GooglePlayPurchaseLoading('Verifying purchase & crediting coins...');
          final success = await _verifyAndCreditPurchase(purchase);
          if (success && purchase.pendingCompletePurchase) {
            await _iap.completePurchase(purchase);
          }
          break;

        case PurchaseStatus.error:
          state = GooglePlayPurchaseError(
            purchase.error?.message ?? 'Purchase was cancelled or failed on Google Play.',
          );
          if (purchase.pendingCompletePurchase) {
            await _iap.completePurchase(purchase);
          }
          break;

        case PurchaseStatus.canceled:
          state = const GooglePlayPurchaseIdle();
          if (purchase.pendingCompletePurchase) {
            await _iap.completePurchase(purchase);
          }
          break;
      }
    }
  }

  Future<bool> _verifyAndCreditPurchase(PurchaseDetails purchase) async {
    final user = _client.auth.currentUser;
    if (user == null) {
      state = const GooglePlayPurchaseError('User is not authenticated. Please log in.');
      return false;
    }

    final purchaseToken = purchase.verificationData.serverVerificationData;
    final orderId = purchase.purchaseID ?? 'gplay_${DateTime.now().millisecondsSinceEpoch}';
    final productId = purchase.productID;

    try {
      // Try calling Supabase Edge Function first
      final response = await _client.functions.invoke(
        'google-play-verify',
        body: {
          'product_id': productId,
          'order_id': orderId,
          'purchase_token': purchaseToken,
        },
      );

      if (response.status == 200 && response.data is Map) {
        final data = Map<String, dynamic>.from(response.data as Map);
        final coinsCredited = (data['coins_credited'] as num?)?.toInt() ?? 0;
        final newBalance = (data['new_balance'] as num?)?.toInt() ?? 0;
        final already = data['already_credited'] == true;

        ref.invalidate(walletStreamProvider);
        ref.invalidate(walletTransactionsProvider);
        ref.invalidate(isFirstTimeBuyerProvider);

        state = GooglePlayPurchaseSuccess(
          coinsCredited: coinsCredited,
          newBalance: newBalance,
          alreadyCredited: already,
        );
        return true;
      }
    } catch (e) {
      debugPrint('[GooglePlayIAP] Edge function verify fallback: $e');
    }

    // Direct RPC fallback if edge function is unreachable
    try {
      final rpcRes = await _client.rpc('credit_google_play_purchase', params: {
        'p_user_id': user.id,
        'p_package_id': productId,
        'p_order_id': orderId,
        'p_purchase_token': purchaseToken,
      });

      if (rpcRes is Map) {
        final data = Map<String, dynamic>.from(rpcRes);
        final coinsCredited = (data['coins_credited'] as num?)?.toInt() ?? 0;
        final newBalance = (data['new_balance'] as num?)?.toInt() ?? 0;
        final already = data['already_credited'] == true;

        ref.invalidate(walletStreamProvider);
        ref.invalidate(walletTransactionsProvider);
        ref.invalidate(isFirstTimeBuyerProvider);

        state = GooglePlayPurchaseSuccess(
          coinsCredited: coinsCredited,
          newBalance: newBalance,
          alreadyCredited: already,
        );
        return true;
      }
    } catch (e) {
      debugPrint('[GooglePlayIAP] RPC credit error: $e');
      state = GooglePlayPurchaseError('Verification error: $e');
      return false;
    }

    state = const GooglePlayPurchaseError('Unable to credit coins. Please contact Friendoo support with your order ID.');
    return false;
  }
}
