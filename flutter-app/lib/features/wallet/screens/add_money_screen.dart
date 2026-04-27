import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../../core/constants/app_constants.dart';
import '../../../services/coin_service.dart';

// Hardcoded coin packages as per spec
const _packages = [
  {'coins': 50, 'rupees': 29, 'bonus': 0, 'label': '', 'popular': false},
  {'coins': 100, 'rupees': 49, 'bonus': 0, 'label': '', 'popular': false},
  {'coins': 250, 'rupees': 99, 'bonus': 0, 'label': 'Popular', 'popular': true},
  {'coins': 600, 'rupees': 199, 'bonus': 0, 'label': '', 'popular': false},
  {
    'coins': 1500,
    'rupees': 499,
    'bonus': 200,
    'label': '+ 200 BONUS',
    'popular': false
  },
];

class AddMoneyScreen extends ConsumerStatefulWidget {
  const AddMoneyScreen({super.key});

  @override
  ConsumerState<AddMoneyScreen> createState() => _AddMoneyScreenState();
}

class _AddMoneyScreenState extends ConsumerState<AddMoneyScreen> {
  late Razorpay _razorpay;
  int? _selectedIndex;
  bool _isLoading = false;
  final _coinService = CoinService();

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
    if (_selectedIndex == null) return;
    final pkg = _packages[_selectedIndex!];
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;

    final totalCoins = (pkg['coins'] as int) + (pkg['bonus'] as int);
    await _coinService.addCoins(
      uid,
      totalCoins,
      description: 'Purchased $totalCoins coins for Rs. ${pkg['rupees']}',
      razorpayId: response.paymentId,
    );

    setState(() => _isLoading = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$totalCoins coins added to your wallet!'),
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
    if (_selectedIndex == null) return;
    final pkg = _packages[_selectedIndex!];
    final user = FirebaseAuth.instance.currentUser;

    setState(() => _isLoading = true);

    final options = {
      'key': AppConstants.razorpayKeyId,
      'amount': (pkg['rupees'] as int) * 100, // paise
      'name': 'Friendoo',
      'description': '${pkg['coins']} Coins',
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D0D1A),
        elevation: 0,
        title: const Text('Add Coins', style: TextStyle(color: Colors.white)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
              return;
            }
            context.go('/wallet');
          },
        ),
      ),
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(20),
            child: Text(
              'Choose a coin package',
              style: TextStyle(color: Colors.white70, fontSize: 16),
            ),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.1,
              ),
              itemCount: _packages.length,
              itemBuilder: (ctx, i) {
                final pkg = _packages[i];
                final isSelected = _selectedIndex == i;
                final isPopular = pkg['popular'] as bool;
                final totalCoins =
                    (pkg['coins'] as int) + (pkg['bonus'] as int);

                return GestureDetector(
                  onTap: () => setState(() => _selectedIndex = i),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFF6C63FF)
                          : const Color(0xFF1E1E2E),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isPopular
                            ? const Color(0xFFFFD700)
                            : Colors.transparent,
                        width: 2,
                      ),
                    ),
                    child: Stack(
                      children: [
                        if (isPopular)
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFD700),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text('Popular',
                                  style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold)),
                            ),
                          ),
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.monetization_on,
                                color: isSelected
                                    ? Colors.white
                                    : const Color(0xFF6C63FF),
                                size: 28,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '$totalCoins coins',
                                style: TextStyle(
                                  color:
                                      isSelected ? Colors.white : Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              if (pkg['bonus'] as int > 0)
                                Text(
                                  '+${pkg['bonus']} bonus',
                                  style: const TextStyle(
                                      color: Colors.greenAccent, fontSize: 11),
                                ),
                              const SizedBox(height: 4),
                              Text(
                                'Rs. ${pkg['rupees']}',
                                style: TextStyle(
                                  color: isSelected
                                      ? Colors.white70
                                      : const Color(0xFF6C63FF),
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _selectedIndex != null && !_isLoading
                    ? _startPayment
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6C63FF),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(
                        _selectedIndex != null
                            ? 'Pay Rs. ${_packages[_selectedIndex!]['rupees']} via Razorpay'
                            : 'Select a Package',
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
