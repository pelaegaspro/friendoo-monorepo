import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/friendoo_ui.dart';
import '../../../core/models/friendoo_models.dart';
import '../data/wallet_repository.dart';
import 'select_payment_method_page.dart';

class CoinPackagesPage extends ConsumerStatefulWidget {
  const CoinPackagesPage({super.key, this.isCallRecharge = false});

  final bool isCallRecharge;

  static Future<bool?> push(
    BuildContext context, {
    bool isCallRecharge = false,
  }) {
    return Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CoinPackagesPage(isCallRecharge: isCallRecharge),
      ),
    );
  }

  @override
  ConsumerState<CoinPackagesPage> createState() => _CoinPackagesPageState();
}

class _CoinPackagesPageState extends ConsumerState<CoinPackagesPage> {
  CoinPackage? _selectedPackage;

  static const _callQuickPackages = [
    CoinPackage(
      id: 'pkg_15',
      coins: 15,
      amountInr: 15,
      bonus: '⚡ 1 Min Quick Talk',
    ),
    CoinPackage(
      id: 'pkg_25',
      coins: 25,
      amountInr: 25,
      bonus: '⚡ Quick Top-Up',
    ),
  ];

  static const _defaultPackages = [
    CoinPackage(id: 'pkg_50', coins: 50, amountInr: 50, bonus: '+6% Extra'),
    CoinPackage(id: 'pkg_100', coins: 100, amountInr: 100, bonus: '+15% Extra'),
    CoinPackage(id: 'pkg_140', coins: 140, amountInr: 140, bonus: '+20% Extra'),
    CoinPackage(id: 'pkg_200', coins: 200, amountInr: 200, bonus: '+25% Extra'),
    CoinPackage(
      id: 'pkg_300',
      coins: 300,
      amountInr: 300,
      bonus: '+ Extra 37% Cashback',
    ),
    CoinPackage(
      id: 'pkg_500',
      coins: 500,
      amountInr: 500,
      bonus: '+ Extra 40% Cashback',
    ),
    CoinPackage(
      id: 'pkg_900',
      coins: 900,
      amountInr: 900,
      bonus: '+ Extra 40% Cashback',
    ),
    CoinPackage(
      id: 'pkg_1900',
      coins: 1900,
      amountInr: 1900,
      bonus: '+ Extra 45% Cashback',
    ),
    CoinPackage(
      id: 'pkg_9800',
      coins: 9800,
      amountInr: 9800,
      bonus: '+ Extra 50% Cashback',
    ),
    CoinPackage(
      id: 'pkg_15000',
      coins: 15000,
      amountInr: 15000,
      bonus: '+ Extra 55% Cashback',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _selectedPackage = widget.isCallRecharge
        ? _callQuickPackages.first
        : _defaultPackages[2]; // ₹140 Value Pack selected by default in wallet
  }

  void _onSelectPackage(CoinPackage pkg) {
    setState(() {
      _selectedPackage = pkg;
    });
  }

  void _proceedToPay() {
    if (_selectedPackage == null) return;
    SelectPaymentMethodPage.push(context, package: _selectedPackage!);
  }

  void _showTransactionsSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const _TransactionsHistoryBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final walletAsync = ref.watch(walletStreamProvider);
    final packagesAsync = ref.watch(coinPackagesProvider);
    final rawPackages = packagesAsync.asData?.value ?? _defaultPackages;
    
    // Hide ₹15 and ₹25 plans unless isCallRecharge is explicitly true
    final packages = widget.isCallRecharge
        ? [
            ..._callQuickPackages,
            ...rawPackages.where(
              (p) => p.amountInr != 15 && p.amountInr != 25,
            ),
          ]
        : rawPackages
            .where((p) => p.amountInr != 15 && p.amountInr != 25)
            .toList();

    final balance = walletAsync.asData?.value.coinBalance ?? 0;

    final cashbackBonus = _selectedPackage != null
        ? ((_selectedPackage!.amountInr * 0.37).round())
        : 50;

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4FF),
      body: Stack(
        children: [
          // Background soft pattern
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 220,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFFFFE4E6).withValues(alpha: 0.8),
                    const Color(0xFFF0F4FF),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Top AppBar
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(
                          Icons.arrow_back_ios_new_rounded,
                          size: 20,
                        ),
                        color: const Color(0xFF0E1020),
                      ),
                      const SizedBox(width: 4),
                      const Text(
                        'Wallet',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0E1020),
                        ),
                      ),
                      const Spacer(),
                      InkWell(
                        onTap: _showTransactionsSheet,
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFF6366F1)
                                  .withValues(alpha: 0.3),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.swap_vert_rounded,
                                size: 18,
                                color: Color(0xFF4F46E5),
                              ),
                              SizedBox(width: 4),
                              Text(
                                'Transactions',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF4F46E5),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Scrollable content
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 120),
                    children: [
                      // Flash 60% Cashback Top Banner
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [
                              Color(0xFF1E1B4B),
                              Color(0xFF312E81),
                              Color(0xFF4C1D95),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF312E81)
                                  .withValues(alpha: 0.25),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 10,
                              height: 10,
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 10),
                            const Text(
                              'Flash 60% Cashback',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEF4444),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.access_time_filled_rounded,
                                    color: Colors.white,
                                    size: 13,
                                  ),
                                  SizedBox(width: 4),
                                  Text(
                                    'Ends in 5h',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      // My Balance Card
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 16,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.04),
                              blurRadius: 10,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'My Balance',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF475569),
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text('🪙 ', style: TextStyle(fontSize: 18)),
                                Text(
                                  '${(balance * 10).round()} Coins',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF2563EB),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 22),

                      // Add Balance to Wallet Header
                      const Text(
                        'Add Balance to Wallet',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0E1020),
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 14),

                      // 2-Column Responsive Packages Grid
                      GridView.builder(
                        physics: const NeverScrollableScrollPhysics(),
                        shrinkWrap: true,
                        itemCount: packages.length,
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 14,
                              mainAxisSpacing: 14,
                              childAspectRatio: 1.5,
                            ),
                        itemBuilder: (context, index) {
                          final pkg = packages[index];
                          final isSelected =
                              _selectedPackage?.id == pkg.id ||
                              (_selectedPackage?.amountInr == pkg.amountInr);

                          final isValuePack = pkg.amountInr == 140;
                          final isSale = pkg.amountInr >= 300;

                          return GestureDetector(
                            onTap: () => _onSelectPackage(pkg),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(
                                  color: isSelected
                                      ? const Color(0xFF2563EB)
                                      : Colors.transparent,
                                  width: isSelected ? 2.5 : 1.0,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: isSelected
                                        ? const Color(0xFF2563EB)
                                              .withValues(alpha: 0.15)
                                        : Colors.black.withValues(alpha: 0.04),
                                    blurRadius: isSelected ? 12 : 6,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: Stack(
                                  children: [
                                    // Main card content
                                    Padding(
                                      padding: const EdgeInsets.fromLTRB(
                                        14,
                                        12,
                                        14,
                                        10,
                                      ),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                '₹${pkg.amountInr}',
                                                style: const TextStyle(
                                                  fontSize: 20,
                                                  fontWeight: FontWeight.w900,
                                                  color: Color(0xFF1D4ED8),
                                                ),
                                              ),
                                              if (isValuePack)
                                                Container(
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                        horizontal: 7,
                                                        vertical: 2.5,
                                                      ),
                                                  decoration: BoxDecoration(
                                                    color: const Color(
                                                      0xFFEF4444,
                                                    ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          8,
                                                        ),
                                                  ),
                                                  child: const Text(
                                                    'Value Pack',
                                                    style: TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 9.5,
                                                      fontWeight:
                                                          FontWeight.w900,
                                                    ),
                                                  ),
                                                )
                                              else if (isSale)
                                                Container(
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                        horizontal: 7,
                                                        vertical: 2.5,
                                                      ),
                                                  decoration: BoxDecoration(
                                                    color: const Color(
                                                      0xFF1E40AF,
                                                    ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          8,
                                                        ),
                                                  ),
                                                  child: const Text(
                                                    '% Sale',
                                                    style: TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 9.5,
                                                      fontWeight:
                                                          FontWeight.w900,
                                                    ),
                                                  ),
                                                ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Text(
                                                '🪙 ',
                                                style: TextStyle(fontSize: 15),
                                              ),
                                              Text(
                                                '${pkg.coins} Coins',
                                                style: const TextStyle(
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w900,
                                                  color: Color(0xFF0F172A),
                                                ),
                                              ),
                                            ],
                                          ),
                                          if (!isSale) ...[
                                            const SizedBox(height: 4),
                                            Text(
                                              pkg.bonus ?? '+10% Extra',
                                              style: const TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w800,
                                                color: Color(0xFF10B981),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),

                                    // Red bottom banner for Sale packs
                                    if (isSale)
                                      Positioned(
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                            vertical: 5,
                                            horizontal: 8,
                                          ),
                                          decoration: const BoxDecoration(
                                            color: Color(0xFFEF4444),
                                          ),
                                          child: Text(
                                            pkg.bonus ?? '+ Extra 40% Cashback',
                                            textAlign: TextAlign.center,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 10.5,
                                              fontWeight: FontWeight.w900,
                                            ),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Sticky Bottom Bar
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(24),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 16,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Get ₹$cashbackBonus Extra cashback on this pack',
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1E3A8A),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _selectedPackage != null
                          ? _proceedToPay
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF3B82F6),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        textStyle: const TextStyle(
                          fontSize: 16.5,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      child: Text(
                        _selectedPackage != null
                            ? 'Add Balance (₹${_selectedPackage!.amountInr})'
                            : 'Select a Package',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TransactionsHistoryBottomSheet extends ConsumerWidget {
  const _TransactionsHistoryBottomSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final txAsync = ref.watch(walletTransactionsProvider);

    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFCBD5E1),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Transaction History',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0E1020),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close_rounded),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: txAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => const Center(
                child: Text('Failed to load transaction history'),
              ),
              data: (txList) {
                if (txList.isEmpty) {
                  return const Center(
                    child: Text(
                      'No transactions yet',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  itemCount: txList.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (ctx, idx) {
                    final tx = txList[idx];
                    final isCredit = tx.isCredit;
                    return ListTile(
                      onTap: () => showTransactionDetailsSheet(context, tx),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      leading: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: tx.isFailed
                              ? const Color(0xFFFEE2E2)
                              : tx.isCanceled
                                  ? const Color(0xFFF1F5F9)
                                  : isCredit
                                      ? const Color(0xFFECFDF5)
                                      : const Color(0xFFFEE2E2),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          tx.isFailed
                              ? Icons.close_rounded
                              : tx.isCanceled
                                  ? Icons.remove_circle_outline_rounded
                                  : isCredit
                                      ? Icons.arrow_downward_rounded
                                      : Icons.arrow_upward_rounded,
                          color: tx.isFailed
                              ? const Color(0xFFEF4444)
                              : tx.isCanceled
                                  ? const Color(0xFF64748B)
                                  : isCredit
                                      ? const Color(0xFF10B981)
                                      : const Color(0xFFEF4444),
                          size: 20,
                        ),
                      ),
                      title: Text(
                        tx.title,
                        style: const TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0E1020),
                        ),
                      ),
                      subtitle: Text(
                        '${tx.formattedDateTime} • ${tx.transactionCode}',
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: Color(0xFF64748B),
                        ),
                      ),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '${isCredit || tx.isCanceled ? '+' : '-'}${tx.coinAmount.abs()} 🪙',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: isCredit
                                  ? const Color(0xFF10B981)
                                  : const Color(0xFFEF4444),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            tx.statusLabel,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: tx.isFailed
                                  ? const Color(0xFFEF4444)
                                  : isCredit
                                      ? const Color(0xFF10B981)
                                      : const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
