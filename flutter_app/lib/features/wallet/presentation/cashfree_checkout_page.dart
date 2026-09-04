import 'package:flutter/material.dart';
import 'package:flutter_cashfree_pg_sdk/api/cferrorresponse/cferrorresponse.dart';
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
  });

  final String paymentSessionId;
  final String providerOrderId;
  final bool sandbox;
  final CashfreePaymentVerifier verifyPayment;

  @override
  State<CashfreeCheckoutPage> createState() => _CashfreeCheckoutPageState();
}

class _CashfreeCheckoutPageState extends State<CashfreeCheckoutPage> {
  final CFPaymentGatewayService _paymentGatewayService =
      CFPaymentGatewayService();

  bool _isVerifying = false;
  String? _verificationError;

  @override
  void initState() {
    super.initState();
    _paymentGatewayService.setCallback(
      _onCashfreeVerificationRequested,
      _onCashfreeError,
    );
    WidgetsBinding.instance.addPostFrameCallback((_) => _openCheckout());
  }

  void _openCheckout() {
    try {
      final session = CFSessionBuilder()
          .setEnvironment(
            widget.sandbox ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION,
          )
          .setOrderId(widget.providerOrderId)
          .setPaymentSessionId(widget.paymentSessionId)
          .build();
      final checkout = CFWebCheckoutPaymentBuilder()
          .setSession(session)
          .build();
      _paymentGatewayService.doPayment(checkout);
    } on CFException catch (error) {
      _showCheckoutError(error.message);
    } catch (_) {
      _showCheckoutError('Unable to open secure payment. Please try again.');
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
    );
  }

  void _showCheckoutError(String message) {
    if (!mounted) return;
    setState(() {
      _isVerifying = false;
      _verificationError = message;
    });
  }

  Future<void> _verifyPayment() async {
    if (_isVerifying) return;
    setState(() {
      _isVerifying = true;
      _verificationError = null;
    });

    bool isPaid = false;
    try {
      isPaid = await widget.verifyPayment(widget.providerOrderId);
    } catch (_) {
      isPaid = false;
    }

    if (!mounted) return;
    if (isPaid) {
      Navigator.of(context).pop(true);
      return;
    }

    setState(() {
      _isVerifying = false;
      _verificationError = 'Cashfree has not confirmed this payment yet. Your wallet has not been credited.';
    });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Secure payment')),
    body: Stack(
      children: [
        const Center(
          child: Padding(
            padding: EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 20),
                Text(
                  'Opening Cashfree secure checkout…',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
        ),
        if (_isVerifying)
          const ColoredBox(
            color: Color(0x99000000),
            child: Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),
          ),
        if (_verificationError != null)
          Positioned(
            left: 20,
            right: 20,
            bottom: 24,
            child: Material(
              borderRadius: BorderRadius.circular(16),
              color: Colors.white,
              elevation: 8,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _verificationError!.toLowerCase().contains('pending') ||
                              _verificationError!.toLowerCase().contains('confirmed')
                          ? 'Payment confirmation pending'
                          : 'Payment issue detected',
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _verificationError!,
                      style: const TextStyle(
                        fontSize: 13.5,
                        color: Color(0xFF475569),
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        FilledButton(
                          onPressed: _verifyPayment,
                          child: const Text('Check Status'),
                        ),
                        FilledButton.tonal(
                          onPressed: _openCheckout,
                          child: const Text('Try Again'),
                        ),
                        OutlinedButton(
                          onPressed: () => Navigator.of(context).pop(false),
                          child: const Text('Go Back'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    ),
  );
}
