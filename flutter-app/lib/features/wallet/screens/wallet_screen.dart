import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/wallet_provider.dart';

class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userCoinsAsync = ref.watch(userCoinsProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFFFE4E1), Colors.white],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            stops: [0.0, 0.3],
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
                      'Wallet',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Spacer(),
                    OutlinedButton.icon(
                      onPressed: () => context.push('/wallet/transactions'),
                      icon: const Icon(Icons.swap_vert, size: 18),
                      label: const Text('Transactions'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF6C63FF),
                        side: const BorderSide(color: Color(0xFF6C63FF)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
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
                    // Balance Card
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
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'My Balance',
                            style: TextStyle(
                              color: Colors.black54,
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          userCoinsAsync.when(
                            data: (coins) => Text(
                              '₹${coins.toStringAsFixed(2)}',
                              style: const TextStyle(
                                color: Color(0xFF6C63FF),
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            loading: () => const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            error: (_, __) => const Text('₹0.00'),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),
                    const Text(
                      'Available Coupons',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Coupon Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF6C63FF).withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.local_offer_outlined, color: Color(0xFF6C63FF), size: 24),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'IPL OFFER- 10% OFF',
                                  style: TextStyle(
                                    color: Color(0xFF6C63FF),
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  'on ₹300 & above packs',
                                  style: TextStyle(color: Colors.black54, fontSize: 13),
                                ),
                              ],
                            ),
                          ),
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('1/1', style: TextStyle(color: Colors.black54, fontSize: 12)),
                              Icon(Icons.circle, color: Colors.grey, size: 8),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),
                    const Text(
                      'Add Balance to Wallet',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Grid of packages
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.8,
                      children: const [
                        _PackageCard(amount: 50, bonus: 6),
                        _PackageCard(amount: 100, bonus: 15),
                        _PackageCard(amount: 140, bonus: 20, badge: 'Value Pack'),
                        _PackageCard(amount: 200, bonus: 25),
                        _PackageCard(amount: 300, bonus: 35, badge: 'Popular'),
                        _PackageCard(amount: 500, bonus: 35),
                        _PackageCard(amount: 900, bonus: 35),
                        _PackageCard(amount: 1900, bonus: 40),
                        _PackageCard(amount: 9800, bonus: 40),
                        _PackageCard(amount: 15000, bonus: 45),
                      ],
                    ),

                    const SizedBox(height: 32),
                    // Trust Indicators
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _TrustItem(icon: Icons.person_outline, label: 'Verified Experts'),
                        _TrustDivider(),
                        _TrustItem(icon: Icons.verified_user_outlined, label: '100% Safe'),
                        _TrustDivider(),
                        _TrustItem(icon: Icons.account_balance_outlined, label: 'Bank Approved'),
                      ],
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),

              // Bottom Button
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    const Text(
                      'Get ₹28 Extra cashback on this pack',
                      style: TextStyle(color: Colors.green, fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: () => context.push('/wallet/add-money'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4A69FF),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        ),
                        child: const Text(
                          'Add Balance',
                          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
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

class _PackageCard extends StatelessWidget {
  final int amount;
  final int bonus;
  final String? badge;

  const _PackageCard({required this.amount, required this.bonus, this.badge});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: badge != null ? const Color(0xFF6C63FF) : Colors.grey.shade200, width: badge != null ? 1.5 : 1),
      ),
      child: Stack(
        children: [
          if (badge != null)
            Positioned(
              top: 10,
              right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.redAccent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  badge!,
                  style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '₹$amount',
                  style: const TextStyle(
                    color: Color(0xFF6C63FF),
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '+$bonus% Extra',
                  style: const TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TrustItem extends StatelessWidget {
  final IconData icon;
  final String label;

  const _TrustItem({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: Colors.black54, size: 24),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(color: Colors.black54, fontSize: 10, fontWeight: FontWeight.w500),
        ),
      ],
    );
  }
}

class _TrustDivider extends StatelessWidget {
  const _TrustDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 24,
      width: 1,
      color: Colors.grey.shade300,
    );
  }
}
