import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_cashfree_pg_sdk/api/cferrorresponse/cferrorresponse.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpayment/cfupi.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpayment/cfupipayment.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpayment/cfwebcheckoutpayment.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpaymentgateway/cfpaymentgatewayservice.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfsession/cfsession.dart';
import 'package:flutter_cashfree_pg_sdk/utils/cfenums.dart';
import 'package:flutter_cashfree_pg_sdk/utils/cfexceptions.dart';

typedef CashfreePaymentVerifier = Future<bool> Function(String providerOrderId);

class CashfreeCheckoutPage extends StatefulWidget {
  const CashfreeCheckoutPage({
    super.key,
    required this.paymentSessionId,
    required this.providerOrderId,
    required this.sandbox,
    required this.verifyPayment,
    this.amountInr,
    this.coins,
    this.paymentMethod,
    this.upiAppPackage,
  });

  final String paymentSessionId;
  final String providerOrderId;
  final bool sandbox;
  final CashfreePaymentVerifier verifyPayment;
  final int? amountInr;
  final int? coins;
  final String? paymentMethod;
  final String? upiAppPackage;

  @override
  State<CashfreeCheckoutPage> createState() => _CashfreeCheckoutPageState();
}

class _CashfreeCheckoutPageState extends State<CashfreeCheckoutPage>
    with WidgetsBindingObserver {
  final CFPaymentGatewayService _paymentGatewayService =
      CFPaymentGatewayService();

  bool _isVerifying = false;
  String? _verificationError;
  bool _fallbackToSimulated = false;
  bool _hasLaunchedPayment = false;

  bool get isSimulatedCheckout {
    if (_fallbackToSimulated) return true;
    if (widget.paymentSessionId.startsWith('test_session_')) return true;
    if (kIsWeb) return true;
    return defaultTargetPlatform != TargetPlatform.android &&
        defaultTargetPlatform != TargetPlatform.iOS;
  }

  bool get _isUpiPayment {
    final method = (widget.paymentMethod ?? 'upi').toLowerCase();
    if (widget.upiAppPackage != null && widget.upiAppPackage!.isNotEmpty) {
      return true;
    }
    if (method.contains('card') || method.contains('netbanking')) {
      return false;
    }
    return true;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    if (!isSimulatedCheckout) {
      try {
        _paymentGatewayService.setCallback(
          _onCashfreeVerificationRequested,
          _onCashfreeError,
        );
        WidgetsBinding.instance.addPostFrameCallback((_) => _openCheckout());
      } catch (_) {
        setState(() => _fallbackToSimulated = true);
      }
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed &&
        _hasLaunchedPayment &&
        !_isVerifying) {
      // Auto-poll verification when user returns from UPI app
      Future.delayed(const Duration(milliseconds: 700), () {
        if (mounted && !_isVerifying) {
          _verifyPayment(silent: true);
        }
      });
    }
  }

  void _openCheckout({bool forceWeb = false, bool forceChooser = false}) {
    if (_isVerifying) return;
    _hasLaunchedPayment = true;
    setState(() => _verificationError = null);

    try {
      final session = CFSessionBuilder()
          .setEnvironment(
            widget.sandbox ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION,
          )
          .setOrderId(widget.providerOrderId)
          .setPaymentSessionId(widget.paymentSessionId)
          .build();

      final isMobile = !kIsWeb &&
          (defaultTargetPlatform == TargetPlatform.android ||
              defaultTargetPlatform == TargetPlatform.iOS);

      if (!forceWeb && isMobile && _isUpiPayment) {
        try {
          final targetPackage = (!forceChooser &&
                  widget.upiAppPackage != null &&
                  widget.upiAppPackage!.isNotEmpty)
              ? widget.upiAppPackage!
              : '';

          final CFUPI upi;
          if (targetPackage.isNotEmpty) {
            upi = CFUPIBuilder()
                .setChannel(CFUPIChannel.INTENT)
                .setUPIID(targetPackage)
                .build();
          } else {
            upi = CFUPIBuilder()
                .setChannel(CFUPIChannel.INTENT_WITH_UI)
                .build();
          }

          final checkout = CFUPIPaymentBuilder()
              .setSession(session)
              .setUPI(upi)
              .build();

          _paymentGatewayService.doPayment(checkout);
          return;
        } catch (upiException) {
          debugPrint('UPI intent direct launch failed: $upiException');
          // If direct intent failed, try INTENT_WITH_UI before falling back to web
          try {
            final upi = CFUPIBuilder()
                .setChannel(CFUPIChannel.INTENT_WITH_UI)
                .build();
            final checkout = CFUPIPaymentBuilder()
                .setSession(session)
                .setUPI(upi)
                .build();
            _paymentGatewayService.doPayment(checkout);
            return;
          } catch (uiException) {
            debugPrint('UPI intent with UI failed: $uiException');
          }
        }
      }

      final checkout = CFWebCheckoutPaymentBuilder()
          .setSession(session)
          .build();
      _paymentGatewayService.doPayment(checkout);
    } on CFException catch (error) {
      _showCheckoutError(error.message, allowFallback: true);
    } catch (e) {
      _showCheckoutError(
        'Unable to open Cashfree secure payment (${e.toString()}).',
        allowFallback: true,
      );
    }
  }

  void _onCashfreeVerificationRequested(String orderId) {
    if (orderId != widget.providerOrderId) {
      _showCheckoutError('The payment response did not match this order.');
      return;
    }
    _verifyPayment();
  }

  void _onCashfreeError(CFErrorResponse errorResponse, String orderId) {
    if (orderId != widget.providerOrderId) {
      _showCheckoutError('The payment response did not match this order.');
      return;
    }
    final message = errorResponse.getMessage()?.trim() ?? '';
    _showCheckoutError(
      message.isEmpty
          ? 'Payment could not be completed. Please try again.'
          : message,
      allowFallback: false,
    );
  }

  void _showCheckoutError(String message, {bool allowFallback = false}) {
    if (!mounted) return;
    setState(() {
      _isVerifying = false;
      _verificationError = message;
      if (allowFallback) {
        _fallbackToSimulated = true;
      }
    });
  }

  Future<void> _verifyPayment({bool silent = false}) async {
    if (_isVerifying) return;
    setState(() {
      _isVerifying = true;
      if (!silent) _verificationError = null;
    });

    bool isPaid = false;
    try {
      isPaid = await widget.verifyPayment(widget.providerOrderId);
    } catch (_) {
      isPaid = false;
    }

    if (!mounted) return;
    if (isPaid) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.coins != null
                ? 'Successfully added ${widget.coins} coins to your wallet!'
                : 'Payment completed successfully!',
          ),
          backgroundColor: const Color(0xFF10B981),
        ),
      );
      Navigator.of(context).pop(true);
      return;
    }

    setState(() {
      _isVerifying = false;
      if (!silent) {
        _verificationError =
            'Payment is not confirmed yet. If you completed payment in your UPI app, please wait a few seconds and tap Check Status.';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    const bgColor = Color(0xFF0B0E17);
    const cardColor = Color(0xFF161B26);
    const borderColor = Color(0xFF262D40);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text(
          'Secure Checkout',
          style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white),
        ),
        backgroundColor: bgColor,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: SafeArea(
        child: isSimulatedCheckout
            ? _buildSimulatedView(cardColor, borderColor)
            : _buildCashfreeNativeView(),
      ),
    );
  }

  Widget _buildSimulatedView(Color cardColor, Color borderColor) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 420),
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: borderColor),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.4),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    colors: [Color(0xFF7C3AED), Color(0xFFEC4899)],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF7C3AED).withValues(alpha: 0.35),
                      blurRadius: 18,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.account_balance_wallet_rounded,
                  color: Colors.white,
                  size: 36,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Friendoo Coin Recharge',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFFF59E0B).withValues(alpha: 0.4),
                  ),
                ),
                child: const Text(
                  'TEST CHECKOUT',
                  style: TextStyle(
                    color: Color(0xFFF59E0B),
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0B0E17),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: borderColor),
                ),
                child: Column(
                  children: [
                    if (widget.coins != null) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Coins to Add',
                            style: TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 14,
                            ),
                          ),
                          Row(
                            children: [
                              const Icon(
                                Icons.monetization_on_rounded,
                                color: Color(0xFFFBBF24),
                                size: 18,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '+${widget.coins}',
                                style: const TextStyle(
                                  color: Color(0xFFFBBF24),
                                  fontWeight: FontWeight.w800,
                                  fontSize: 16,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const Divider(color: Color(0xFF262D40), height: 24),
                    ],
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Order Amount',
                          style: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          widget.amountInr != null
                              ? '₹${widget.amountInr}'
                              : 'Active Order',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 17,
                          ),
                        ),
                      ],
                    ),
                    const Divider(color: Color(0xFF262D40), height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Order Ref',
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          widget.providerOrderId.length > 20
                              ? '${widget.providerOrderId.substring(0, 18)}…'
                              : widget.providerOrderId,
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                            fontFamily: 'monospace',
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (_verificationError != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFFEF4444).withValues(alpha: 0.35),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        color: Color(0xFFEF4444),
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _verificationError!,
                          style: const TextStyle(
                            color: Color(0xFFEF4444),
                            fontSize: 12.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
              if (_isVerifying)
                const Column(
                  children: [
                    CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                        Color(0xFF7C3AED),
                      ),
                    ),
                    SizedBox(height: 14),
                    Text(
                      'Crediting coins to wallet…',
                      style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                )
              else ...[
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _verifyPayment,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF7C3AED),
                      foregroundColor: Colors.white,
                      elevation: 4,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.bolt_rounded, size: 20),
                        const SizedBox(width: 6),
                        Text(
                          widget.amountInr != null
                              ? 'Pay ₹${widget.amountInr} & Add Coins'
                              : 'Complete Payment',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text(
                    'Cancel Recharge',
                    style: TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCashfreeNativeView() {
    const cardColor = Color(0xFF161B26);
    const borderColor = Color(0xFF262D40);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 420),
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: borderColor),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.4),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header Icon
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    colors: [Color(0xFF7C3AED), Color(0xFFEC4899)],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF7C3AED).withValues(alpha: 0.35),
                      blurRadius: 16,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.currency_rupee_rounded,
                  color: Colors.white,
                  size: 32,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'UPI Secure Payment',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _isUpiPayment
                    ? 'Launching UPI app on your device…'
                    : 'Opening Cashfree secure gateway…',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 20),

              // Order Summary Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0B0E17),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: borderColor),
                ),
                child: Column(
                  children: [
                    if (widget.coins != null) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Coins to Add',
                            style: TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 14,
                            ),
                          ),
                          Row(
                            children: [
                              const Icon(
                                Icons.monetization_on_rounded,
                                color: Color(0xFFFBBF24),
                                size: 18,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '+${widget.coins}',
                                style: const TextStyle(
                                  color: Color(0xFFFBBF24),
                                  fontWeight: FontWeight.w800,
                                  fontSize: 16,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const Divider(color: Color(0xFF262D40), height: 24),
                    ],
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Payable Amount',
                          style: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          widget.amountInr != null
                              ? '₹${widget.amountInr}'
                              : 'Active Order',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                          ),
                        ),
                      ],
                    ),
                    const Divider(color: Color(0xFF262D40), height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Order ID',
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          widget.providerOrderId.length > 20
                              ? '${widget.providerOrderId.substring(0, 18)}…'
                              : widget.providerOrderId,
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                            fontFamily: 'monospace',
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              if (_verificationError != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFFEF4444).withValues(alpha: 0.35),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        color: Color(0xFFEF4444),
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _verificationError!,
                          style: const TextStyle(
                            color: Color(0xFFEF4444),
                            fontSize: 12.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 24),

              if (_isVerifying)
                const Column(
                  children: [
                    CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                        Color(0xFF7C3AED),
                      ),
                    ),
                    SizedBox(height: 14),
                    Text(
                      'Checking payment status…',
                      style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                )
              else ...[
                // Primary Action: Open UPI Apps / Pay with UPI
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () => _openCheckout(forceChooser: true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF7C3AED),
                      foregroundColor: Colors.white,
                      elevation: 4,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.open_in_new_rounded, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'Open UPI Apps (GPay / PhonePe)',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 14.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // Check Status button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    onPressed: () => _verifyPayment(),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Color(0xFF3B82F6)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.check_circle_outline_rounded,
                          size: 18,
                          color: Color(0xFF3B82F6),
                        ),
                        SizedBox(width: 8),
                        Text(
                          'I Have Paid • Check Status',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                            color: Color(0xFF3B82F6),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 10),

                // Web Checkout option (Card / Netbanking)
                TextButton(
                  onPressed: () => _openCheckout(forceWeb: true),
                  child: const Text(
                    'Pay via Card / Netbanking (Web)',
                    style: TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),

                const SizedBox(height: 6),
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text(
                    'Cancel Recharge',
                    style: TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
