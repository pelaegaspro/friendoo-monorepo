import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../../core/constants/app_constants.dart';
import '../../../services/coin_service.dart';

class AddMoneyScreen extends ConsumerStatefulWidget {
  const AddMoneyScreen({super.key});

  @override
  ConsumerState<AddMoneyScreen> createState() => _AddMoneyScreenState();
}

class _AddMoneyScreenState extends ConsumerState<AddMoneyScreen> {
  late Razorpay _razorpay;
  bool _isLoading = false;
  final _coinService = CoinService();

  // Selected package details (hardcoded for now to match screenshot)
  final double rechargeAmount = 140.0;
  final double taxes = 39.19;
  final double payableAmount = 179.2;
  final int coinsToGet = 168;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _onPaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _onPaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _onExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  void _onPaymentSuccess(PaymentSuccessResponse response) async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;

    await _coinService.addCoins(
      uid,
      coinsToGet,
      description: 'Purchased $coinsToGet coins for Rs. $rechargeAmount',
      razorpayId: response.paymentId,
    );

    setState(() => _isLoading = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$coinsToGet coins added to your wallet!'),
          backgroundColor: Colors.green,
        ),
      );
      context.go('/wallet');
    }
  }

  void _onPaymentError(PaymentFailureResponse response) {
    setState(() => _isLoading = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Payment failed: ${response.message}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _onExternalWallet(ExternalWalletResponse response) {
    setState(() => _isLoading = false);
  }

  void _startPayment() {
    final user = FirebaseAuth.instance.currentUser;
    setState(() => _isLoading = true);

    final options = {
      'key': AppConstants.razorpayKeyId,
      'amount': (payableAmount * 100).toInt(), // paise
      'name': 'Friendoo',
      'description': '$coinsToGet Coins',
      'prefill': {
        'contact': user?.phoneNumber ?? '',
      },
      'theme': {'color': '#6C63FF'},
    };

    try {
      _razorpay.open(options);
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _showTaxesBreakdown() {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Taxes and other charges',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _SummaryRow(label: 'GST (18%)', value: '25.20', isBold: false),
              const SizedBox(height: 8),
              _SummaryRow(label: 'Platform Fee', value: '14.00', isBold: false),
              const Divider(height: 32),
              _SummaryRow(label: 'Total', value: '₹39.19', isBold: true, valueColor: const Color(0xFF6C63FF)),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFFFE4E1), Colors.white],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            stops: [0.0, 0.2],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black, size: 20),
                      onPressed: () => context.pop(),
                    ),
                    const Text(
                      'Select Payment Method',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),

              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    const SizedBox(height: 16),
                    // Summary Card
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          _SummaryRow(label: 'Recharge Amount', value: '₹${rechargeAmount.toInt()}'),
                          const SizedBox(height: 12),
                          GestureDetector(
                            onTap: _showTaxesBreakdown,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  decoration: const BoxDecoration(
                                    border: Border(bottom: BorderSide(color: Colors.grey, style: BorderStyle.solid, width: 1)),
                                  ),
                                  child: const Text(
                                    'Taxes and other charges',
                                    style: TextStyle(color: Colors.black54, fontSize: 15),
                                  ),
                                ),
                                Text('₹$taxes', style: const TextStyle(color: Colors.black, fontSize: 15)),
                              ],
                            ),
                          ),
                          const Divider(height: 32),
                          _SummaryRow(
                            label: 'Payable Amount',
                            value: '₹$payableAmount',
                            isBold: true,
                            valueColor: const Color(0xFF6C63FF),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),
                    // Coupons
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.local_offer_outlined, color: Color(0xFF6C63FF), size: 20),
                          SizedBox(width: 12),
                          Text('View All Coupons', style: TextStyle(fontWeight: FontWeight.w500)),
                          Spacer(),
                          Icon(Icons.chevron_right, color: Colors.grey),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),
                    // Promo Banner
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.green.shade300),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle_outline, color: Colors.green, size: 20),
                          const SizedBox(width: 12),
                          Text(
                            'You will get ₹$coinsToGet in this recharge',
                            style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),
                    // UPI Options
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Text('UPI', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, fontStyle: FontStyle.italic)),
                              const SizedBox(width: 8),
                              const Text('Pay by any UPI app', style: TextStyle(color: Colors.black54, fontSize: 12)),
                              const Spacer(),
                              Text('⚡ Fastest', style: TextStyle(color: Colors.blue.shade700, fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 4),
                          const Text('Preferred by 95% Users', style: TextStyle(color: Colors.green, fontSize: 11)),
                          const SizedBox(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _PaymentIcon(label: 'Google Pay', icon: Icons.account_balance_wallet),
                              _PaymentIcon(label: 'BHIM', icon: Icons.account_balance),
                              _PaymentIcon(label: 'Amazon P...', icon: Icons.shopping_bag),
                              _PaymentIcon(label: 'Mobikwik', icon: Icons.wallet),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),
                    _ActionTile(icon: Icons.qr_code_scanner, label: 'QR to Scan & Pay'),
                    const SizedBox(height: 12),
                    _ActionTile(icon: Icons.credit_card, label: 'Pay using Credit/Debit Card'),
                    const SizedBox(height: 24),
                  ],
                ),
              ),

              // Bottom Button
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _startPayment,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4A69FF),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text(
                            'Pay ₹$payableAmount',
                            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;
  final Color? valueColor;

  const _SummaryRow({
    required this.label,
    required this.value,
    this.isBold = false,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isBold ? Colors.black : Colors.black54,
            fontSize: 16,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: valueColor ?? Colors.black,
            fontSize: isBold ? 18 : 16,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}

class _PaymentIcon extends StatelessWidget {
  final String label;
  final IconData icon;

  const _PaymentIcon({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Icon(icon, color: Colors.blue, size: 24),
        ),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.black54)),
      ],
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;

  const _ActionTile({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF6C63FF), size: 24),
          const SizedBox(width: 16),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 15)),
          const Spacer(),
          const Icon(Icons.chevron_right, color: Colors.grey),
        ],
      ),
    );
  }
}
