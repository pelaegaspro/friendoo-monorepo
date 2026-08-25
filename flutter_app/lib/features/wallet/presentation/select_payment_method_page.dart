import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/models/friendoo_models.dart';
import '../data/upi_payment_service.dart';
import '../data/wallet_repository.dart';

class SelectPaymentMethodPage extends ConsumerStatefulWidget {
  const SelectPaymentMethodPage({super.key, required this.package});

  final CoinPackage package;

  static Future<bool?> push(BuildContext context, {required CoinPackage package}) {
    return Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => SelectPaymentMethodPage(package: package),
      ),
    );
  }

  @override
  ConsumerState<SelectPaymentMethodPage> createState() => _SelectPaymentMethodPageState();
}

class _SelectPaymentMethodPageState extends ConsumerState<SelectPaymentMethodPage> {
  List<UpiInstalledAppInfo> _installedUpiApps = [];
  UpiInstalledAppInfo? _selectedApp;
  String _selectedMethod = 'upi';
  bool _isLoadingApps = true;
  bool _isProcessing = false;
  bool _isUpiExpanded = false;

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
                        side: const BorderSide(color: Color(0xFF3B82F6), width: 1.5),
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
      _selectedMethod = 'upi';
      _isProcessing = true;
    });
    final txRef = 'tx_${DateTime.now().millisecondsSinceEpoch}';
    final baseAmount = widget.package.amountInr;
    final taxAmount = (baseAmount * 0.18).round();
    final payableAmount = baseAmount + taxAmount;

    ref.read(walletRepositoryProvider).rechargeWallet(
      package: widget.package,
      paymentMethod: app.displayName,
    );

    // Native explicit package launch (0 chooser popups)
    await const UpiPaymentService().launchDirectUpiApp(
      packageName: app.packageName,
      amountInr: payableAmount.toDouble(),
      transactionRef: txRef,
      note: 'Friendoo Recharge ${widget.package.coins} Coins (Inc 18% GST)',
    );

    if (mounted) {
      setState(() => _isProcessing = false);
      ref.invalidate(walletStreamProvider);
      ref.invalidate(walletTransactionsProvider);
    }
  }

  Future<void> _executePayment() async {
    if (_selectedMethod == 'upi' && _selectedApp != null) {
      await _executeUpiPayment(_selectedApp!);
      return;
    }

    setState(() => _isProcessing = true);
    final txRef = 'tx_${DateTime.now().millisecondsSinceEpoch}';
    final baseAmount = widget.package.amountInr;
    final taxAmount = (baseAmount * 0.18).round();
    final payableAmount = baseAmount + taxAmount;

    ref.read(walletRepositoryProvider).rechargeWallet(
      package: widget.package,
      paymentMethod: _selectedMethod,
    );

    if (_selectedMethod == 'upi_qr') {
      await const UpiPaymentService().launchDirectUpiApp(
        packageName: '',
        amountInr: payableAmount.toDouble(),
        transactionRef: txRef,
        note: 'Friendoo Recharge ${widget.package.coins} Coins (Inc 18% GST)',
      );
    } else {
      final payuUrl = Uri.parse(
        'https://test.payu.in/_payment?key=7eMBxs&txnid=$txRef&amount=$payableAmount.00&productinfo=Friendoo_${widget.package.coins}_Coins&firstname=FriendooUser&email=user@friendoo.in&phone=9999999999&surl=https://friendoo.in/api/payments/payu/webhook&furl=https://friendoo.in/api/payments/payu/webhook',
      );
      await launchUrl(payuUrl, mode: LaunchMode.externalApplication);
    }

    if (mounted) {
      setState(() => _isProcessing = false);
      ref.invalidate(walletStreamProvider);
      ref.invalidate(walletTransactionsProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    final baseAmount = widget.package.amountInr;
    final taxAmount = (baseAmount * 0.18).round();
    final payableAmount = baseAmount + taxAmount;
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
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF0F172A), size: 20),
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
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
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
                              const Text(
                                'Taxes and other charges (18% GST)',
                                style: TextStyle(
                                  fontSize: 13.5,
                                  color: Color(0xFF64748B),
                                  decoration: TextDecoration.underline,
                                  decorationStyle: TextDecorationStyle.dotted,
                                ),
                              ),
                              Text(
                                '₹$taxAmount',
                                style: const TextStyle(
                                  fontSize: 15,
                                  color: Color(0xFF0F172A),
                                  fontWeight: FontWeight.w700,
                                ),
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
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF3B82F6), width: 1.5),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF1D4ED8), size: 22),
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
                    const SizedBox(height: 18),

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
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'UPI',
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
                              const Spacer(),
                              const Row(
                                children: [
                                  Icon(Icons.bolt_rounded, color: Color(0xFF2563EB), size: 18),
                                  Text(
                                    'Fastest',
                                    style: TextStyle(
                                      color: Color(0xFF2563EB),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Preferred by 95% Users',
                            style: TextStyle(
                              color: Color(0xFF10B981),
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 18),

                          // Dynamic Installed UPI Apps row with inline expansion (0 system popups)
                          if (_isLoadingApps)
                            const Center(
                              child: Padding(
                                padding: EdgeInsets.all(12),
                                child: CircularProgressIndicator(strokeWidth: 2),
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
                                    isSelected: _selectedApp?.packageName ==
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
                                        borderRadius:
                                            BorderRadius.circular(16),
                                        border: Border.all(
                                          color: const Color(0xFFCBD5E1),
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            _isUpiExpanded
                                                ? Icons.keyboard_arrow_up_rounded
                                                : Icons.keyboard_arrow_down_rounded,
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

                    _PaymentOptionTile(
                      icon: Icons.credit_card_rounded,
                      title: 'Pay using Credit/Debit Card',
                      iconColor: const Color(0xFF2563EB),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => PayThroughCardPage(package: widget.package),
                          ),
                        );
                      },
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
                        _TrustBadge(icon: Icons.person_pin_rounded, label: 'Verified Experts'),
                        _TrustDivider(),
                        _TrustBadge(icon: Icons.shield_rounded, label: '100% Safe'),
                        _TrustDivider(),
                        _TrustBadge(icon: Icons.account_balance_rounded, label: 'Bank Approved'),
                      ],
                    ),
                    const SizedBox(height: 14),

                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: FilledButton(
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF3B82F6),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(26),
                          ),
                          elevation: 2,
                        ),
                        onPressed: _isProcessing ? null : _executePayment,
                        child: _isProcessing
                            ? const SizedBox.square(
                                dimension: 22,
                                child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                              )
                            : Text(
                                'Pay ₹$payableAmount',
                                style: const TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
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
            child: Icon(Icons.account_balance_wallet_rounded, color: Colors.white, size: 22),
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
                color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFFE2E8F0),
                width: isSelected ? 2.5 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: isSelected ? const Color(0xFF3B82F6).withValues(alpha: 0.2) : Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Center(
              child: _buildBrandLogo(),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            appInfo.displayName,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
              color: isSelected ? const Color(0xFF1D4ED8) : const Color(0xFF475569),
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
    required this.iconColor,
    required this.onTap,
  });

  final IconData icon;
  final String title;
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
              Icon(icon, color: iconColor, size: 24),
              const SizedBox(width: 14),
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
              const Icon(Icons.arrow_forward_ios_rounded, size: 15, color: Color(0xFF94A3B8)),
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

class PayThroughCardPage extends StatefulWidget {
  const PayThroughCardPage({super.key, required this.package});

  final CoinPackage package;

  @override
  State<PayThroughCardPage> createState() => _PayThroughCardPageState();
}

class _PayThroughCardPageState extends State<PayThroughCardPage> {
  final _cardNumberController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvvController = TextEditingController();
  bool _saveCard = true;
  bool _isPaying = false;

  @override
  void dispose() {
    _cardNumberController.dispose();
    _expiryController.dispose();
    _cvvController.dispose();
    super.dispose();
  }

  Future<void> _handlePay() async {
    setState(() => _isPaying = true);
    final txRef = 'tx_${DateTime.now().millisecondsSinceEpoch}';
    final baseAmount = widget.package.amountInr;
    final taxAmount = (baseAmount * 0.18).round();
    final payableAmount = baseAmount + taxAmount;
    final payuUrl = Uri.parse(
      'https://test.payu.in/_payment?key=7eMBxs&txnid=$txRef&amount=$payableAmount.00&productinfo=Friendoo_${widget.package.coins}_Coins&firstname=FriendooUser&email=user@friendoo.in&phone=9999999999&surl=https://friendoo.in/api/payments/payu/webhook&furl=https://friendoo.in/api/payments/payu/webhook',
    );
    await launchUrl(payuUrl, mode: LaunchMode.externalApplication);
    if (mounted) {
      setState(() => _isPaying = false);
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF0F172A), size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Pay through Card',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 19,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: const BoxDecoration(
                          color: Color(0xFFEFF6FF),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.credit_card_rounded, color: Color(0xFF2563EB), size: 24),
                      ),
                      const SizedBox(width: 14),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Add a New Card',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Your card details will be 100% safe with us',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF10B981),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  const Text(
                    'Enter your Card Number',
                    style: TextStyle(fontSize: 13, color: Color(0xFF475569), fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _cardNumberController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: '•••• •••• •••• ••••',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Expiry Date',
                              style: TextStyle(fontSize: 13, color: Color(0xFF475569), fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              controller: _expiryController,
                              keyboardType: TextInputType.datetime,
                              decoration: InputDecoration(
                                hintText: 'MM/YY',
                                filled: true,
                                fillColor: Colors.white,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'CVV',
                              style: TextStyle(fontSize: 13, color: Color(0xFF475569), fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              controller: _cvvController,
                              keyboardType: TextInputType.number,
                              obscureText: true,
                              decoration: InputDecoration(
                                hintText: '•••',
                                filled: true,
                                fillColor: Colors.white,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Checkbox(
                        value: _saveCard,
                        activeColor: const Color(0xFF3B82F6),
                        onChanged: (val) => setState(() => _saveCard = val ?? true),
                      ),
                      const Text(
                        'Save card securely. ',
                        style: TextStyle(fontSize: 13, color: Color(0xFF334155)),
                      ),
                      const Text(
                        'Know more',
                        style: TextStyle(
                          fontSize: 13,
                          color: Color(0xFF2563EB),
                          fontWeight: FontWeight.w600,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ],
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
                      _TrustBadge(icon: Icons.person_pin_rounded, label: 'Verified Experts'),
                      _TrustDivider(),
                      _TrustBadge(icon: Icons.shield_rounded, label: '100% Safe'),
                      _TrustDivider(),
                      _TrustBadge(icon: Icons.account_balance_rounded, label: 'Bank Approved'),
                    ],
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF3B82F6),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(26),
                        ),
                      ),
                      onPressed: _isPaying ? null : _handlePay,
                      child: _isPaying
                          ? const SizedBox.square(
                              dimension: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                            )
                          : Text(
                              'Pay Now (₹${widget.package.amountInr + (widget.package.amountInr * 0.18).round()})',
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
