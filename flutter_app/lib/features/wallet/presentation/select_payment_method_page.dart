import 'cashfree_local_host.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/models/friendoo_models.dart';
import '../data/google_play_iap_service.dart';
import '../data/platform_fee_policy.dart';
import '../data/upi_payment_service.dart';
import '../data/wallet_repository.dart';
import 'cashfree_checkout_page.dart';

class SelectPaymentMethodPage extends ConsumerStatefulWidget {
  const SelectPaymentMethodPage({super.key, required this.package});

  final CoinPackage package;

  static Future<bool?> push(
    BuildContext context, {
    required CoinPackage package,
  }) {
    return Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => SelectPaymentMethodPage(package: package),
      ),
    );
  }

  @override
  ConsumerState<SelectPaymentMethodPage> createState() =>
      _SelectPaymentMethodPageState();
}

class _SelectPaymentMethodPageState
    extends ConsumerState<SelectPaymentMethodPage>
    with WidgetsBindingObserver {
  List<UpiInstalledAppInfo> _installedUpiApps = [];
  UpiInstalledAppInfo? _selectedApp;
  String _selectedMethod = 'in_app_upi';
  bool _isLoadingApps = true;
  bool _isProcessing = false;
  bool _isUpiExpanded = false;
  String? _pendingProviderOrderId;
  int? _pendingCoins;
  bool _isAutoChecking = false;

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    CashfreeLocalHost.stopCheckoutServer();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed &&
        _pendingProviderOrderId != null &&
        !_isAutoChecking) {
      _checkPendingPayment(silent: true);
    }
  }

  Future<void> _checkPendingPayment({bool silent = false}) async {
    final orderId = _pendingProviderOrderId;
    if (orderId == null || _isAutoChecking) return;
    _isAutoChecking = true;
    try {
      final isPaid = await ref
          .read(walletRepositoryProvider)
          .confirmCashfreePayment(providerOrderId: orderId);
      if (!mounted) return;
      if (isPaid) {
        final coins = _pendingCoins ?? widget.package.coins;
        _pendingProviderOrderId = null;
        _pendingCoins = null;
        await CashfreeLocalHost.stopCheckoutServer();
        ref.invalidate(walletStreamProvider);
        ref.invalidate(walletTransactionsProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
            content: Text(
              '🎉 Successfully added $coins coins to your wallet!',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        );
        Navigator.of(context).pop(true);
      } else if (!silent) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            behavior: SnackBarBehavior.floating,
            content: Text(
              'Payment not confirmed yet. Please complete payment in your browser or retry shortly.',
            ),
          ),
        );
      }
    } catch (e) {
      if (!silent && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Verification check failed: $e')),
        );
      }
    } finally {
      if (mounted) _isAutoChecking = false;
    }
  }

  @override
  void initState() {
    super.initState();
    _loadInstalledUpiApps();
  }

  Future<void> _loadInstalledUpiApps() async {
    final apps = await const UpiPaymentService().getInstalledUpiApps();
    if (mounted) {
      setState(() {
        _installedUpiApps = apps;
        if (apps.isNotEmpty) {
          _selectedApp = apps.first;
        }
        _isLoadingApps = false;
      });
    }
  }

  void _onBackPress() {
    showDialog<bool>(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 26),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  color: Color(0xFFFEE2E2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.warning_amber_rounded,
                  color: Color(0xFFEF4444),
                  size: 38,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Cancel Payment?',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0E1020),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Are you sure you want to cancel the payment?',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF64748B),
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        side: const BorderSide(
                          color: Color(0xFF3B82F6),
                          width: 1.5,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(22),
                        ),
                      ),
                      onPressed: () {
                        Navigator.of(ctx).pop(true);
                        Navigator.of(context).pop(false);
                      },
                      child: const Text(
                        'Yes, Cancel',
                        style: TextStyle(
                          color: Color(0xFF3B82F6),
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF3B82F6),
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(22),
                        ),
                      ),
                      onPressed: () => Navigator.of(ctx).pop(false),
                      child: const Text(
                        'No',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _executeUpiPayment(UpiInstalledAppInfo app) async {
    setState(() {
      _selectedApp = app;
      _selectedMethod = 'in_app_upi';
    });
    await _startCashfreeCheckout(
      paymentMethod: app.displayName,
      upiAppPackage: app.packageName,
      externalBrowser: false,
    );
  }

  Future<void> _executePayment() async {
    if (_selectedMethod == 'external_browser') {
      await _startCashfreeCheckout(
        paymentMethod: 'external_browser',
        externalBrowser: true,
      );
      return;
    }
    if (_selectedApp != null) {
      await _executeUpiPayment(_selectedApp!);
      return;
    }
    await _startCashfreeCheckout(
      paymentMethod: 'in_app_upi',
      upiAppPackage: _selectedApp?.packageName,
      externalBrowser: false,
    );
  }

  Future<void> _startCashfreeCheckout({
    required String paymentMethod,
    String? upiAppPackage,
    bool externalBrowser = false,
  }) async {
    setState(() => _isProcessing = true);
    try {
      final order = await ref
          .read(walletRepositoryProvider)
          .rechargeWallet(
            package: widget.package,
            paymentMethod: paymentMethod,
          );
      await _openCashfreeOrder(
        order,
        paymentMethod: paymentMethod,
        upiAppPackage: upiAppPackage,
        externalBrowser: externalBrowser,
      );
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _openCashfreeOrder(
    Map<String, dynamic>? order, {
    String? paymentMethod,
    String? upiAppPackage,
    bool externalBrowser = false,
  }) async {
    final sessionId = order?['payment_session_id'] as String?;
    final providerOrderId = order?['provider_order_id'] as String?;
    final orderError = order?['error'] as String?;
    if (!mounted) return;
    if (orderError != null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(orderError)));
      return;
    }
    if (sessionId == null ||
        sessionId.isEmpty ||
        providerOrderId == null ||
        providerOrderId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Unable to create a secure Cashfree payment order.'),
        ),
      );
      return;
    }
    final checkoutUrl = order?['checkout_url'] as String?;
    final completed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CashfreeCheckoutPage(
          paymentSessionId: sessionId,
          providerOrderId: providerOrderId,
          sandbox: order?['environment'] != 'production',
          amountInr:
              (order?['amount_inr'] as num?)?.toInt() ??
              widget.package.amountInr,
          coins: (order?['coins'] as num?)?.toInt() ?? widget.package.coins,
          paymentMethod: paymentMethod ?? _selectedMethod,
          upiAppPackage: upiAppPackage ?? _selectedApp?.packageName,
          externalBrowserMode: externalBrowser,
          checkoutUrl: checkoutUrl,
          verifyPayment: (orderId) => ref
              .read(walletRepositoryProvider)
              .confirmCashfreePayment(providerOrderId: orderId),
        ),
      ),
    );
    if (completed == true && mounted) {
      ref.invalidate(walletStreamProvider);
      ref.invalidate(walletTransactionsProvider);
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<GooglePlayPurchaseState>(googlePlayIapServiceProvider, (
      previous,
      next,
    ) {
      if (next is GooglePlayPurchaseSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
            content: Text(
              next.alreadyCredited
                  ? 'Payment verified! Coins are credited in your wallet.'
                  : '🎉 Congratulations! ${next.coinsCredited} coins credited to your wallet.',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        );
        ref.read(googlePlayIapServiceProvider.notifier).resetState();
        Navigator.of(context).pop(true);
      } else if (next is GooglePlayPurchaseError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            behavior: SnackBarBehavior.floating,
            content: Text(next.message),
          ),
        );
        ref.read(googlePlayIapServiceProvider.notifier).resetState();
      }
    });

    final iapState = ref.watch(googlePlayIapServiceProvider);
    final isIapLoading = iapState is GooglePlayPurchaseLoading;
    final isBusy = _isProcessing || isIapLoading;

    final baseAmount = widget.package.amountInr;
    final feeBreakdown = ref.watch(platformFeeBreakdownProvider(baseAmount));
    final payableAmount = feeBreakdown.totalPayable;
    final coins = widget.package.coins;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _onBackPress();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Color(0xFF0F172A),
              size: 20,
            ),
            onPressed: _onBackPress,
          ),
          title: const Text(
            'Select Payment Method',
            style: TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 19,
              fontWeight: FontWeight.w800,
            ),
          ),
          centerTitle: false,
        ),
        body: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 12,
                  ),
                  children: [
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          if (feeBreakdown.isFree) ...[
                            Container(
                              margin: const EdgeInsets.only(bottom: 14),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: const Color(0xFFA7F3D0),
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.celebration_rounded,
                                    color: Color(0xFF059669),
                                    size: 18,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      '🎉 Welcome Perk: ₹0 Platform Fee (${feeBreakdown.freeReason})',
                                      style: const TextStyle(
                                        color: Color(0xFF065F46),
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Recharge Amount',
                                style: TextStyle(
                                  fontSize: 15,
                                  color: Color(0xFF334155),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              Text(
                                '₹$baseAmount',
                                style: const TextStyle(
                                  fontSize: 16,
                                  color: Color(0xFF0F172A),
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Text(
                                    'Platform Fee',
                                    style: TextStyle(
                                      fontSize: 14.5,
                                      color: Color(0xFF334155),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  if (feeBreakdown.isFree)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFECFDF5),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(
                                          color: const Color(0xFFA7F3D0),
                                        ),
                                      ),
                                      child: const Text(
                                        'LIMITED TIME FREE',
                                        style: TextStyle(
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFF059669),
                                          letterSpacing: 0.3,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              Row(
                                children: [
                                  if (feeBreakdown.isFree) ...[
                                    Text(
                                      '₹${feeBreakdown.standardFee}',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        decoration: TextDecoration.lineThrough,
                                        color: Color(0xFF94A3B8),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    const Text(
                                      'FREE',
                                      style: TextStyle(
                                        fontSize: 14.5,
                                        color: Color(0xFF10B981),
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                  ] else
                                    Text(
                                      '₹${feeBreakdown.feeCharged}',
                                      style: const TextStyle(
                                        fontSize: 15,
                                        color: Color(0xFF0F172A),
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                ],
                              ),
                            ],
                          ),
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Divider(color: Color(0xFFE2E8F0)),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Payable Amount',
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Color(0xFF0F172A),
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              Text(
                                '₹$payableAmount',
                                style: const TextStyle(
                                  fontSize: 21,
                                  color: Color(0xFF2563EB),
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: const Color(0xFF3B82F6),
                          width: 1.5,
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.check_circle_outline_rounded,
                            color: Color(0xFF1D4ED8),
                            size: 22,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'You will get 🪙 $coins Coins in this recharge',
                              style: const TextStyle(
                                color: Color(0xFF1E3A8A),
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'Option 1: In-App UPI',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF0F172A),
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'Pay by any UPI app',
                                style: TextStyle(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          const SizedBox(height: 18),

                          // Dynamic Installed UPI Apps row with inline expansion (0 system popups)
                          if (_isLoadingApps)
                            const Center(
                              child: Padding(
                                padding: EdgeInsets.all(12),
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              ),
                            )
                          else if (_installedUpiApps.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 8),
                              child: Text(
                                'No UPI apps detected. You can pay via QR or Cards below.',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                            )
                          else ...[
                            Wrap(
                              spacing: 12,
                              runSpacing: 12,
                              alignment: WrapAlignment.start,
                              children: [
                                ...(_isUpiExpanded
                                        ? _installedUpiApps
                                        : _installedUpiApps.take(4))
                                    .map((app) {
                                      return _UpiAppItem(
                                        appInfo: app,
                                        isSelected:
                                            _selectedApp?.packageName ==
                                            app.packageName,
                                        onTap: () => _executeUpiPayment(app),
                                      );
                                    }),
                                if (_installedUpiApps.length > 4)
                                  InkWell(
                                    onTap: () {
                                      setState(() {
                                        _isUpiExpanded = !_isUpiExpanded;
                                      });
                                    },
                                    borderRadius: BorderRadius.circular(16),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 14,
                                        vertical: 10,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(
                                          color: const Color(0xFFCBD5E1),
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            _isUpiExpanded
                                                ? Icons
                                                      .keyboard_arrow_up_rounded
                                                : Icons
                                                      .keyboard_arrow_down_rounded,
                                            color: const Color(0xFF3B82F6),
                                            size: 18,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            _isUpiExpanded
                                                ? 'Show less'
                                                : 'Show more (${_installedUpiApps.length - 4})',
                                            style: const TextStyle(
                                              fontSize: 12.5,
                                              fontWeight: FontWeight.w800,
                                              color: Color(0xFF3B82F6),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Option 2: External Browser
                    _PaymentOptionTile(
                      icon: Icons.open_in_browser_rounded,
                      title: 'Option 2: External Browser Checkout',
                      subtitle: 'Directly opens in Chrome / Web Browser (PhonePe, GPay, Paytm, Cards, NetBanking, QR)',
                      iconColor: const Color(0xFF2563EB),
                      badge: 'RECOMMENDED',
                      onTap: () {
                        setState(() {
                          _selectedMethod = 'external_browser';
                          _selectedApp = null;
                        });
                        _executePayment();
                      },
                    ),
                    const SizedBox(height: 14),

                    _PaymentOptionTile(
                      icon: Icons.credit_card_rounded,
                      title: 'Pay using Credit/Debit Card',
                      subtitle:
                          'Opens secure card checkout in external browser',
                      iconColor: const Color(0xFF2563EB),
                      onTap: () => _startCashfreeCheckout(
                        paymentMethod: 'card',
                        externalBrowser: true,
                      ),
                    ),
                  ],
                ),
              ),

              Container(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _TrustBadge(
                          icon: Icons.person_pin_rounded,
                          label: 'Host profiles',
                        ),
                        _TrustDivider(),
                        _TrustBadge(
                          icon: Icons.shield_rounded,
                          label: 'Secure checkout',
                        ),
                        _TrustDivider(),
                        _TrustBadge(
                          icon: Icons.account_balance_rounded,
                          label: 'UPI & cards',
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: FilledButton(
                        style: FilledButton.styleFrom(
                          backgroundColor: _selectedMethod == 'google_play'
                              ? const Color(0xFF00875A)
                              : const Color(0xFF3B82F6),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(26),
                          ),
                          elevation: 2,
                        ),
                        onPressed: isBusy ? null : _executePayment,
                        child: isBusy
                            ? Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const SizedBox.square(
                                    dimension: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.2,
                                      color: Colors.white,
                                    ),
                                  ),
                                  if (isIapLoading) ...[
                                    const SizedBox(width: 12),
                                    Flexible(
                                      child: Text(
                                        iapState.message,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  if (_selectedMethod == 'google_play') ...[
                                    const Icon(
                                      Icons.shop_two_rounded,
                                      size: 20,
                                      color: Colors.white,
                                    ),
                                    const SizedBox(width: 8),
                                  ],
                                  Text(
                                    _selectedMethod == 'google_play'
                                        ? 'Pay ₹$payableAmount with Google Play'
                                        : 'Pay ₹$payableAmount',
                                    style: const TextStyle(
                                      fontSize: 16.5,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _UpiAppItem extends StatelessWidget {
  const _UpiAppItem({
    required this.appInfo,
    required this.isSelected,
    required this.onTap,
  });

  final UpiInstalledAppInfo appInfo;
  final bool isSelected;
  final VoidCallback onTap;

  Widget _buildBrandLogo() {
    if (appInfo.iconBytes != null && appInfo.iconBytes!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: Image.memory(
          appInfo.iconBytes!,
          width: 44,
          height: 44,
          fit: BoxFit.contain,
        ),
      );
    }

    switch (appInfo.id) {
      case 'gpay':
        return Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 4,
              ),
            ],
          ),
          child: Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: const BoxDecoration(
                    color: Color(0xFF4285F4),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 2),
                Container(
                  width: 12,
                  height: 12,
                  decoration: const BoxDecoration(
                    color: Color(0xFF34A853),
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ),
          ),
        );
      case 'amazonpay':
        return Container(
          width: 44,
          height: 44,
          decoration: const BoxDecoration(
            color: Color(0xFFFFF3E0),
            shape: BoxShape.circle,
          ),
          child: const Center(
            child: Text(
              'pay',
              style: TextStyle(
                color: Color(0xFF131A22),
                fontWeight: FontWeight.w900,
                fontSize: 14,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        );
      case 'kotak':
        return Container(
          width: 44,
          height: 44,
          decoration: const BoxDecoration(
            color: Color(0xFFEE1C25),
            shape: BoxShape.circle,
          ),
          child: const Center(
            child: Text(
              '811',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 15,
                letterSpacing: 0.5,
              ),
            ),
          ),
        );
      case 'phonepe':
        return Container(
          width: 44,
          height: 44,
          decoration: const BoxDecoration(
            color: Color(0xFF5F259F),
            shape: BoxShape.circle,
          ),
          child: const Center(
            child: Text(
              'पे',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 18,
              ),
            ),
          ),
        );
      case 'paytm':
        return Container(
          width: 44,
          height: 44,
          decoration: const BoxDecoration(
            color: Color(0xFF00BAF2),
            shape: BoxShape.circle,
          ),
          child: const Center(
            child: Text(
              'Paytm',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 10,
              ),
            ),
          ),
        );
      default:
        return Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: appInfo.brandColor,
            shape: BoxShape.circle,
          ),
          child: const Center(
            child: Icon(
              Icons.account_balance_wallet_rounded,
              color: Colors.white,
              size: 22,
            ),
          ),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 62,
            height: 62,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(
                color: isSelected
                    ? const Color(0xFF3B82F6)
                    : const Color(0xFFE2E8F0),
                width: isSelected ? 2.5 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: isSelected
                      ? const Color(0xFF3B82F6).withValues(alpha: 0.2)
                      : Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Center(child: _buildBrandLogo()),
          ),
          const SizedBox(height: 6),
          Text(
            appInfo.displayName,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
              color: isSelected
                  ? const Color(0xFF1D4ED8)
                  : const Color(0xFF475569),
            ),
          ),
        ],
      ),
    );
  }
}

class _PaymentOptionTile extends StatelessWidget {
  const _PaymentOptionTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.badge,
    required this.iconColor,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final String? badge;
  final Color iconColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Icon(icon, color: iconColor, size: 28),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                        ),
                        if (badge != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              badge!,
                              style: const TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF059669),
                              ),
                            ),
                          ),
                      ],
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 3),
                      Text(
                        subtitle!,
                        style: const TextStyle(
                          fontSize: 12.5,
                          color: Color(0xFF64748B),
                          height: 1.3,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                Icons.arrow_forward_ios_rounded,
                size: 15,
                color: Color(0xFF94A3B8),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TrustBadge extends StatelessWidget {
  const _TrustBadge({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: const Color(0xFF64748B)),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: Color(0xFF64748B),
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _TrustDivider extends StatelessWidget {
  const _TrustDivider();

  @override
  Widget build(BuildContext context) {
    return Container(width: 1, height: 16, color: const Color(0xFFCBD5E1));
  }
}
