import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfcard/cfcardwidget.dart';
import 'package:flutter_cashfree_pg_sdk/api/cferrorresponse/cferrorresponse.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpayment/cfcard.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpayment/cfcardpayment.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpayment/cfupi.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpayment/cfupipayment.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpaymentgateway/cfpaymentgatewayservice.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfsession/cfsession.dart';
import 'package:flutter_cashfree_pg_sdk/utils/cfenums.dart';

typedef CashfreePaymentVerifier = Future<bool> Function(String providerOrderId);

/// Method-specific checkout. Never redirects to the hosted method-selection page.
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
  final _gateway = CFPaymentGatewayService();
  final _cardKey = GlobalKey<CFCardWidgetState>();
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _month = TextEditingController();
  final _year = TextEditingController();
  final _cvv = TextEditingController();
  CFSession? _session;
  CFCardWidget? _cardWidget;
  bool _launched = false;
  bool _launching = false;
  bool _verifying = false;
  bool _completed = false;
  String? _error;

  bool get _isCard =>
      (widget.paymentMethod ?? '').toLowerCase().contains('card');
  bool get _supported =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    if (!_supported || widget.paymentSessionId.startsWith('test_session_')) {
      _error = 'Direct payment requires the mobile app and a valid payment session. Please go back and try again.';
      return;
    }
    try {
      _session = CFSessionBuilder()
          .setEnvironment(
            widget.sandbox ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION,
          )
          .setOrderId(widget.providerOrderId)
          .setPaymentSessionId(widget.paymentSessionId)
          .build();
      _gateway.setCallback(_onVerified, _onError);
      if (_isCard) {
        _cardWidget = CFCardWidget(
          key: _cardKey,
          inputDecoration: const InputDecoration(labelText: 'Card number'),
          textStyle: const TextStyle(fontSize: 16, color: Colors.black87),
          cardListener: (_) {},
          cfSession: _session!,
        );
      } else {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) _pay();
        });
      }
    } catch (_) {
      _error = 'Unable to start secure payment. Please go back and try again.';
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _name.dispose();
    _month.dispose();
    _year.dispose();
    _cvv.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _launched && !_completed) {
      _verify();
    }
  }

  void _onVerified(String orderId) {
    if (!mounted || _completed) return;
    if (orderId != widget.providerOrderId) {
      _showError('The payment response did not match this order.');
      return;
    }
    _verify();
  }

  void _onError(CFErrorResponse error, String orderId) {
    if (!mounted || _completed) return;
    _cvv.clear();
    if (orderId.isNotEmpty && orderId != widget.providerOrderId) {
      _showError('The payment response did not match this order.');
      return;
    }
    final message = error.getMessage()?.trim() ?? '';
    final lower = message.toLowerCase();
    _showError(
      lower.contains('trusted source') ||
              lower.contains('whitelist') ||
              lower.contains('not_available')
          ? 'Direct payment is unavailable for this app installation. Please use the supported store version or contact support.'
          : message.isEmpty
          ? 'Payment was cancelled or could not be completed. You can retry or choose another method.'
          : message,
    );
  }

  void _showError(String message) {
    if (!mounted) return;
    setState(() {
      _launching = false;
      _error = message;
    });
  }

  void _pay() {
    if (!mounted || _session == null || _launching || _verifying || _completed) {
      return;
    }
    if (_isCard && !(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _launching = true;
      _launched = true;
      _error = null;
    });
    try {
      if (_isCard) {
        final card = CFCardBuilder()
            .setCardWidget(_cardWidget!)
            .setCardHolderName(_name.text.trim())
            .setCardExpiryMonth(_month.text.padLeft(2, '0'))
            .setCardExpiryYear(_year.text)
            .setCardCVV(_cvv.text)
            .build();
        _gateway.doPayment(
          CFCardPaymentBuilder()
              .setSession(_session!)
              .setCard(card)
              .savePaymentMethod(false)
              .build(),
        );
        _cvv.clear();
      } else {
        final package = widget.upiAppPackage?.trim() ?? '';
        final builder = CFUPIBuilder().setChannel(
          package.isEmpty ? CFUPIChannel.INTENT_WITH_UI : CFUPIChannel.INTENT,
        );
        if (package.isNotEmpty) builder.setUPIID(package);
        _gateway.doPayment(
          CFUPIPaymentBuilder()
              .setSession(_session!)
              .setUPI(builder.build())
              .build(),
        );
      }
    } catch (_) {
      _showError(
        'Unable to open the selected payment method. Go back to choose another method, or retry.',
      );
    }
  }

  Future<void> _verify() async {
    if (!mounted || _verifying || _completed || !_launched) return;
    setState(() => _verifying = true);
    var paid = false;
    for (var attempt = 0; attempt < 4; attempt++) {
      if (!mounted) return;
      try {
        paid = await widget.verifyPayment(widget.providerOrderId);
      } catch (_) {
        paid = false;
      }
      if (paid) break;
      if (attempt < 3) await Future<void>.delayed(const Duration(seconds: 1));
    }
    if (!mounted) return;
    if (paid) {
      _completed = true;
      Navigator.of(context).pop(true);
    } else {
      setState(() {
        _verifying = false;
        _launching = false;
        _error = 'Payment is not confirmed yet. If money was debited, check status again before retrying.';
      });
    }
  }

  Widget _field(
    String label,
    TextEditingController controller, {
    int? digits,
    bool secret = false,
    String? Function(String?)? validator,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
      ),
      keyboardType: digits == null ? TextInputType.name : TextInputType.number,
      obscureText: secret,
      enableSuggestions: false,
      autocorrect: false,
      inputFormatters: digits == null
          ? null
          : [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(digits),
            ],
      validator:
          validator ??
          (value) => (value ?? '').trim().isEmpty ? 'Required' : null,
    ),
  );

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(_isCard ? 'Pay by card' : 'Pay by UPI')),
    body: SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            widget.amountInr == null ? 'Coin recharge' : '₹${widget.amountInr}',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          if (widget.coins != null) Text('${widget.coins} coins'),
          const SizedBox(height: 24),
          if (_isCard && _cardWidget != null)
            Form(
              key: _formKey,
              child: Column(
                children: [
                  _cardWidget!,
                  const SizedBox(height: 16),
                  _field('Cardholder name', _name),
                  Row(
                    children: [
                      Expanded(
                        child: _field(
                          'Month (MM)',
                          _month,
                          digits: 2,
                          validator: (value) {
                            final month = int.tryParse(value ?? '') ?? 0;
                            return month < 1 || month > 12
                                ? 'Invalid month'
                                : null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _field(
                          'Year (YY)',
                          _year,
                          digits: 2,
                          validator: (value) {
                            final year = int.tryParse(value ?? '') ?? -1;
                            final now = DateTime.now();
                            final month = int.tryParse(_month.text) ?? 0;
                            return (value?.length != 2 ||
                                    year + 2000 < now.year ||
                                    (year + 2000 == now.year &&
                                        month < now.month))
                                ? 'Invalid expiry'
                                : null;
                          },
                        ),
                      ),
                    ],
                  ),
                  _field(
                    'CVV',
                    _cvv,
                    digits: 4,
                    secret: true,
                    validator: (value) =>
                        RegExp(r'^\d{3,4}$').hasMatch(value ?? '')
                        ? null
                        : 'Invalid CVV',
                  ),
                  const Text(
                    'Your bank may ask for an OTP to approve payment.',
                  ),
                ],
              ),
            )
          else if (!_isCard)
            const Text('Complete payment in your UPI app, then return here.'),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
          const SizedBox(height: 20),
          if (_session != null)
            FilledButton(
              onPressed: _launching || _verifying ? null : _pay,
              child: Text(
                _verifying
                    ? 'Checking payment…'
                    : _launching
                    ? 'Payment in progress…'
                    : _isCard
                    ? 'Pay securely'
                    : 'Open UPI app',
              ),
            ),
          if (_launched)
            TextButton(
              onPressed: _verifying ? null : _verify,
              child: const Text('Check payment status'),
            ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Back to payment methods'),
          ),
        ],
      ),
    ),
  );
}
