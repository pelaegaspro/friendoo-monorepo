import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

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
  late final WebViewController _controller;
  bool _isVerifying = false;
  String? _verificationError;

  @override
  void initState() {
    super.initState();
    final checkoutUrl = widget.sandbox
        ? 'https://sandbox.cashfree.com/pg/view/sessions/checkout'
        : 'https://api.cashfree.com/pg/view/sessions/checkout';
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) {
            if (request.url.startsWith(
              'https://friendoo.in/payment/callback',
            )) {
              _verifyPayment();
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadHtmlString('''
        <html><body onload="document.forms[0].submit()">
          <form method="post" action="$checkoutUrl">
            <input type="hidden" name="payment_session_id" value="${widget.paymentSessionId}">
            <input type="hidden" name="platform" value="flutter">
          </form>
        </body></html>
      ''');
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
        WebViewWidget(controller: _controller),
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
                    const Text(
                      'Payment confirmation pending',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(_verificationError!),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: _verifyPayment,
                      child: const Text('Check payment status'),
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
