import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/models/friendoo_models.dart';
import '../features/calls/data/call_repository.dart';
import '../features/calls/presentation/call_report_bottom_sheet.dart';
import '../features/discover/data/host_repository.dart';
import '../features/discover/presentation/desi_avatar.dart';
import '../features/profile/data/profile_repository.dart';
import '../features/profile/presentation/settings_pages.dart';
import '../features/wallet/data/wallet_repository.dart';
import '../features/wallet/presentation/recharge_checkout_sheet.dart';

abstract final class FriendooUiColors {
  static const canvas = Color(0xFFF7F7FB);
  static const ink = Color(0xFF0E1020);
  static const blue = Color(0xFF6366F1);
  static const violet = Color(0xFF8B5CF6);
  static const aqua = Color(0xFF00D2E0);
  static const pink = Color(0xFFFF2A85);
  static const gold = Color(0xFFFFB703);
  static const emerald = Color(0xFF10B981);
  static const muted = Color(0xFF6B7280);
  static const line = Color(0xFFE2E4ED);
  static const softBlue = Color(0xFFEDE9FE);
  static const softViolet = Color(0xFFF3E8FF);
  static const softAqua = Color(0xFFE0F9FD);
  static const softPink = Color(0xFFFFE4EC);
  static const softGold = Color(0xFFFEF3C7);
}

const friendooUserLanguageOptions = <String>[
  'Tamil',
  'Telugu',
  'Hindi',
  'Malayalam',
  'Kannada',
  'English',
];

const friendooHostLanguageOptions = <String>[
  'Tamil',
  'Telugu',
  'Hindi',
  'Malayalam',
  'Kannada',
];

Future<void> showFriendooLanguagePicker(
  BuildContext context, {
  required List<String> selectedLanguages,
  required bool isHost,
  required Future<void> Function(List<String>) onSave,
}) async {
  final options = isHost
      ? friendooHostLanguageOptions
      : friendooUserLanguageOptions;
  final selected = selectedLanguages
      .map((language) => language.trim())
      .where(options.contains)
      .toSet();
  if (selected.isEmpty) selected.add(options.first);

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (_) => StatefulBuilder(
      builder: (context, setState) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: FriendooUiColors.softViolet,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.translate_rounded,
                        color: FriendooUiColors.violet,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      isHost ? 'Host speaking languages' : 'Language preference',
                      style: Theme.of(context).textTheme.titleLarge
                          ?.copyWith(fontWeight: FontWeight.w900),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  isHost
                      ? 'Choose the languages you speak with callers.'
                      : 'Choose the languages you want to hear.',
                  style: const TextStyle(
                    color: FriendooUiColors.muted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 14),
                ...options.map(
                  (language) => CheckboxListTile(
                    value: selected.contains(language),
                    title: Text(
                      language,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
                    activeColor: FriendooUiColors.blue,
                    checkboxShape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6),
                    ),
                    contentPadding: EdgeInsets.zero,
                    controlAffinity: ListTileControlAffinity.leading,
                    onChanged: (value) {
                      if (value == false && selected.length == 1) return;
                      setState(() {
                        if (value == true) {
                          selected.add(language);
                        } else {
                          selected.remove(language);
                        }
                      });
                    },
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () async {
                      try {
                        await onSave(options.where(selected.contains).toList());
                        if (context.mounted) Navigator.of(context).pop();
                      } catch (error) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Unable to save languages: $error'),
                            ),
                          );
                        }
                      }
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: FriendooUiColors.ink,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('Save languages'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    ),
  );
}

Future<void> showFriendooPrivacySheet(BuildContext context) async {
  await showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (sheetContext) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: FriendooUiColors.softAqua,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.security_rounded,
                    color: Color(0xFF0B8B8B),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  'Privacy & Safety Vault',
                  style: Theme.of(context).textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.w900),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.visibility_off_outlined, color: FriendooUiColors.blue),
              title: Text('100% Anonymous by design', style: TextStyle(fontWeight: FontWeight.w800)),
              subtitle: Text('Your real phone number and identity remain completely hidden.'),
            ),
            const ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.verified_user_outlined, color: Color(0xFF10B981)),
              title: Text('Verified Hosts Only', style: TextStyle(fontWeight: FontWeight.w800)),
              subtitle: Text('Every host undergoes identity review before going live.'),
            ),
            const ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.shield_outlined, color: FriendooUiColors.pink),
              title: Text('Total Caller Control', style: TextStyle(fontWeight: FontWeight.w800)),
              subtitle: Text('End, report, or instant-block any conversation at any moment.'),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.of(sheetContext).pop(),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: const StadiumBorder(),
                ),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

Future<void> showFriendooSupportSheet(BuildContext context) async {
  await showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (sheetContext) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: FriendooUiColors.softGold,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.headset_mic_rounded,
                    color: Color(0xFFD97706),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  'Help & 24/7 Support',
                  style: Theme.of(context).textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.w900),
                ),
              ],
            ),
            const SizedBox(height: 14),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.mail_outline_rounded, color: FriendooUiColors.blue),
              title: const Text('Direct Concierge Support', style: TextStyle(fontWeight: FontWeight.w800)),
              subtitle: const Text('support@friendoo.app'),
              onTap: () {
                Navigator.of(sheetContext).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Support: support@friendoo.app'),
                  ),
                );
              },
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.report_problem_outlined, color: FriendooUiColors.pink),
              title: const Text('Report a Call or Host', style: TextStyle(fontWeight: FontWeight.w800)),
              subtitle: const Text('Use the report button during any active conversation.'),
              onTap: () => Navigator.of(sheetContext).pop(),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.of(sheetContext).pop(),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: const StadiumBorder(),
                ),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class FriendooLogo extends StatelessWidget {
  const FriendooLogo({super.key, this.fontSize = 20, this.isLight = false});

  final double fontSize;
  final bool isLight;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: fontSize * 1.45,
          height: fontSize * 1.45,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [FriendooUiColors.violet, FriendooUiColors.pink],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(fontSize * 0.42),
            boxShadow: [
              BoxShadow(
                color: FriendooUiColors.violet.withOpacity(0.32),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Center(
            child: Icon(
              Icons.graphic_eq_rounded,
              color: Colors.white,
              size: fontSize * 0.92,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          'Friendoo',
          style: TextStyle(
            color: isLight ? Colors.white : FriendooUiColors.ink,
            fontSize: fontSize,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.5,
          ),
        ),
      ],
    );
  }
}

class FriendooPromoItem {
  const FriendooPromoItem({
    required this.title,
    required this.highlight,
    required this.subtitle,
    required this.badge,
    required this.gradient,
    required this.icon,
  });

  final String title;
  final String highlight;
  final String subtitle;
  final String badge;
  final LinearGradient gradient;
  final IconData icon;
}

class FriendooPromoCarousel extends StatefulWidget {
  const FriendooPromoCarousel({super.key, required this.items});

  final List<FriendooPromoItem> items;

  @override
  State<FriendooPromoCarousel> createState() => _FriendooPromoCarouselState();
}

class _FriendooPromoCarouselState extends State<FriendooPromoCarousel> {
  late final PageController _pageController;
  int _currentPage = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.92);
    _startAutoScroll();
  }

  void _startAutoScroll() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || widget.items.isEmpty) return;
      final nextPage = (_currentPage + 1) % widget.items.length;
      _pageController.animateToPage(
        nextPage,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOutCubic,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) return const SizedBox.shrink();

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: 138,
          child: PageView.builder(
            controller: _pageController,
            itemCount: widget.items.length,
            onPageChanged: (index) {
              setState(() => _currentPage = index);
            },
            itemBuilder: (context, index) {
              final item = widget.items[index];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 5),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: item.gradient,
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: [
                      BoxShadow(
                        color: item.gradient.colors.first.withOpacity(0.32),
                        blurRadius: 14,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Stack(
                    children: [
                      Positioned(
                        right: -25,
                        top: -25,
                        child: Container(
                          width: 125,
                          height: 125,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withOpacity(0.12),
                          ),
                        ),
                      ),
                      Positioned(
                        right: 16,
                        bottom: 10,
                        child: Icon(
                          item.icon,
                          size: 60,
                          color: Colors.white.withOpacity(0.18),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(18, 14, 18, 14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.22),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    item.badge,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                                Text(
                                  item.title,
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.85),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.highlight,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 21,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.5,
                                    height: 1.1,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  item.subtitle,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.92),
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
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
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            widget.items.length,
            (index) => AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 3.5),
              width: _currentPage == index ? 20 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: _currentPage == index
                    ? FriendooUiColors.ink
                    : const Color(0xFFD1D5DB),
                borderRadius: BorderRadius.circular(99),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

void showFriendooNotificationsSheet(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (sheetContext) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: FriendooUiColors.softViolet,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.notifications_rounded,
                    color: FriendooUiColors.violet,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  'Notifications & Offers',
                  style: Theme.of(context).textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.w900),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.celebration_rounded, color: FriendooUiColors.pink),
              title: Text('Welcome to Friendoo Voice Lounge!', style: TextStyle(fontWeight: FontWeight.w800)),
              subtitle: Text('Enjoy 20% off bonus coins on your first voice call recharge.'),
            ),
            const ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.verified_user_rounded, color: Color(0xFF10B981)),
              title: Text('100% Female Verified Hosts', style: TextStyle(fontWeight: FontWeight.w800)),
              subtitle: Text('All hosts undergo verified identity vetting before taking calls.'),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.of(sheetContext).pop(),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: const StadiumBorder(),
                ),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

class FriendooDashboardView extends ConsumerWidget {
  const FriendooDashboardView({
    super.key,
    required this.hosts,
    this.filters = const [],
    this.selectedFilter = 0,
    this.onFilterSelected,
    required this.onStartCall,
    required this.onSignOut,
    required this.onOpenActivity,
    required this.onOpenWallet,
  });

  final List<HostProfile> hosts;
  final List<String> filters;
  final int selectedFilter;
  final ValueChanged<int>? onFilterSelected;
  final ValueChanged<HostProfile> onStartCall;
  final VoidCallback onSignOut;
  final VoidCallback onOpenActivity;
  final VoidCallback onOpenWallet;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final walletAsync = ref.watch(walletStreamProvider);
    final femaleHosts = hosts.where((host) => host.isFemale).toList();
    final visibleHosts = [...femaleHosts]
      ..sort((a, b) {
        if (a.isAvailable != b.isAvailable) {
          return a.isAvailable ? -1 : 1;
        }
        if (a.isStar != b.isStar) {
          return a.isStar ? -1 : 1;
        }
        return b.rating.compareTo(a.rating);
      });
    final onlineCount = femaleHosts.where((host) => host.isAvailable).length;

    const promoItems = [
      FriendooPromoItem(
        title: 'FIRST CALL OFFER',
        highlight: '20% OFF',
        subtitle: 'On your first call with any host',
        badge: 'WELCOME 🎁',
        gradient: LinearGradient(
          colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        icon: Icons.local_offer_rounded,
      ),
      FriendooPromoItem(
        title: 'PRIVACY FIRST',
        highlight: 'Your Privacy',
        subtitle: 'Our Priority • 100% Anonymous Voice',
        badge: 'SAFETY 🛡️',
        gradient: LinearGradient(
          colors: [Color(0xFF00B4D8), Color(0xFF0077B6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        icon: Icons.security_rounded,
      ),
      FriendooPromoItem(
        title: 'REFER & EARN',
        highlight: 'Earn Rewards',
        subtitle: 'Earn rewards by inviting friends',
        badge: 'BONUS ⚡',
        gradient: LinearGradient(
          colors: [Color(0xFFFF2A85), Color(0xFFFF758C)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        icon: Icons.card_giftcard_rounded,
      ),
      FriendooPromoItem(
        title: 'LATE NIGHT TALKS',
        highlight: 'Night Lounge',
        subtitle: 'Special hosts available 12 AM – 6 AM',
        badge: '12 AM - 6 AM 🌙',
        gradient: LinearGradient(
          colors: [Color(0xFF141738), Color(0xFF4338CA)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        icon: Icons.nightlife_rounded,
      ),
    ];

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 36),
      children: [
        // ==========================================
        // 1. HEADER
        // Left: Friendoo Logo + User Online Status Pill
        // Right: Wallet / coin balance, Recharge (+) button, Notification icon
        // ==========================================
        Row(
          children: [
            const FriendooLogo(fontSize: 21),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.35)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.circle_rounded, color: Color(0xFF10B981), size: 6.5),
                  SizedBox(width: 4),
                  Text(
                    'Online',
                    style: TextStyle(
                      color: Color(0xFF047857),
                      fontSize: 10.5,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
            const Spacer(),

            // Wallet / Coin Balance
            GestureDetector(
              onTap: onOpenWallet,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: FriendooUiColors.softGold,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFFD166).withOpacity(0.6)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.monetization_on_rounded, color: Color(0xFFD97706), size: 16),
                    const SizedBox(width: 4),
                    Text(
                      walletAsync.when(
                        data: (w) => '${w.coinBalance}',
                        loading: () => '...',
                        error: (_, __) => '50',
                      ),
                      style: const TextStyle(
                        color: Color(0xFFB45309),
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),

            // Recharge (+) Button
            FilledButton.icon(
              onPressed: onOpenWallet,
              icon: const Icon(Icons.add_rounded, size: 16, color: Colors.white),
              label: const Text(
                'Recharge',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12.5,
                  fontWeight: FontWeight.w900,
                ),
              ),
              style: FilledButton.styleFrom(
                backgroundColor: FriendooUiColors.pink,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
            const SizedBox(width: 4),

            // Notification Icon
            IconButton(
              icon: Stack(
                clipBehavior: Clip.none,
                children: [
                  const Icon(Icons.notifications_none_rounded, color: FriendooUiColors.ink, size: 23),
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: FriendooUiColors.pink,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
              tooltip: 'Notifications',
              onPressed: () => showFriendooNotificationsSheet(context),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // ==========================================
        // 2. TITLE & SUBTITLE
        // "Discover a Host"
        // "Find someone you'd love to talk with"
        // (Removed: Search bar, search filter, language selection, language chips)
        // ==========================================
        const Text(
          'Discover a Host',
          style: TextStyle(
            color: FriendooUiColors.ink,
            fontSize: 28,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.8,
            height: 1.15,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Find someone you\'d love to talk with',
          style: TextStyle(
            color: FriendooUiColors.muted,
            fontSize: 14.5,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 18),

        // ==========================================
        // 3. PROMOTIONAL CAROUSEL
        // ==========================================
        const FriendooPromoCarousel(items: promoItems),
        const SizedBox(height: 24),

        // ==========================================
        // 4. HOST SECTION HEADER & COUNTER
        // ==========================================
        Row(
          children: [
            const Text(
              'Available Hosts',
              style: TextStyle(
                color: FriendooUiColors.ink,
                fontSize: 18,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.3,
              ),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.circle_rounded, color: Color(0xFF10B981), size: 8),
                  const SizedBox(width: 5),
                  Text(
                    '$onlineCount Live Now',
                    style: const TextStyle(
                      color: Color(0xFF047857),
                      fontSize: 11.5,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // ==========================================
        // 5. USER HOST CARDS (Large Horizontal Cards - NOT A GRID)
        // ==========================================
        if (visibleHosts.isEmpty)
          const _EmptySurface(
            icon: Icons.headset_mic_rounded,
            title: 'No hosts available right now',
            message: 'Check back in a few moments to see who is online.',
          )
        else
          ...visibleHosts.map(
            (host) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: _DesiHostCard(
                host: host,
                onStartCall: () => onStartCall(host),
              ),
            ),
          ),
        const SizedBox(height: 8),

        // Privacy & Moderation Trust Card
        const _TrustCard(),
      ],
    );
  }
}

class _DesiHostCard extends StatelessWidget {
  const _DesiHostCard({
    required this.host,
    required this.onStartCall,
  });

  final HostProfile host;
  final VoidCallback onStartCall;

  String _formatCalls(int totalCalls) {
    if (totalCalls >= 1000) {
      return '${(totalCalls / 1000).toStringAsFixed(1)}K';
    }
    return '$totalCalls';
  }

  @override
  Widget build(BuildContext context) {
    final languagesText = host.languages.join(' · ');

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: host.isStar
              ? const Color(0xFFFFB703).withOpacity(0.55)
              : (host.isAvailable ? const Color(0xFF6366F1).withOpacity(0.22) : const Color(0xFFE5E7EB)),
          width: host.isStar ? 1.8 : 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: host.isStar
                ? const Color(0x18FFB703)
                : (host.isAvailable ? const Color(0x126366F1) : Colors.black.withOpacity(0.02)),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // LEFT: Large Desi Female Avatar (Clean vector, NO age badge on avatar)
              DesiFemaleAvatar(
                seed: host.displayName,
                age: host.displayAge,
                isStar: host.isStar,
                size: 74,
                showPresence: true,
                isOnline: host.isAvailable,
              ),
              const SizedBox(width: 14),

              // CENTER: Host Information
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Host Name + Verification + Star Badge
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            host.displayName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: FriendooUiColors.ink,
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.3,
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.verified_rounded,
                          color: Color(0xFF10B981),
                          size: 16,
                        ),
                        if (host.isStar) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFFFB703), Color(0xFFFF5400)],
                              ),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              '⭐ STAR HOST',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 3),

                    // Age & Languages (Exact age displayed outside avatar)
                    Row(
                      children: [
                        Text(
                          '${host.displayAge} yrs',
                          style: const TextStyle(
                            color: Color(0xFF4B5563),
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Text(
                          '•',
                          style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13),
                        ),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            languagesText,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: FriendooUiColors.violet,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),

                    // Rating & Call Count
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: Color(0xFFFFB703), size: 16),
                        const SizedBox(width: 3),
                        Text(
                          '${host.rating.toStringAsFixed(1)} (${_formatCalls(host.totalCalls)} calls)',
                          style: const TextStyle(
                            color: Color(0xFF374151),
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // RIGHT: Rate Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: FriendooUiColors.softBlue,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: FriendooUiColors.blue.withOpacity(0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '₹${host.ratePerAudioMinute}',
                      style: const TextStyle(
                        color: FriendooUiColors.blue,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        height: 1.0,
                      ),
                    ),
                    const Text(
                      '/min',
                      style: TextStyle(
                        color: FriendooUiColors.muted,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Short Description / Bio
          if (host.bio != null && host.bio!.isNotEmpty) ...[
            Text(
              host.bio!,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF4B5563),
                fontSize: 13,
                height: 1.35,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 10),
          ],

          // Footer Row: City + Availability + Call Now CTA
          Row(
            children: [
              // City
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.location_on_outlined,
                    size: 14,
                    color: FriendooUiColors.muted,
                  ),
                  const SizedBox(width: 3),
                  Text(
                    host.displayCity,
                    style: const TextStyle(
                      color: FriendooUiColors.muted,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 8),

              // Availability status (ONLINE / OFFLINE)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                decoration: BoxDecoration(
                  color: host.isAvailable
                      ? const Color(0xFFECFDF5)
                      : const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: host.isAvailable
                        ? const Color(0xFF10B981).withOpacity(0.3)
                        : const Color(0xFFE5E7EB),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.circle_rounded,
                      size: 7,
                      color: host.isAvailable
                          ? const Color(0xFF10B981)
                          : const Color(0xFF9CA3AF),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      host.isAvailable ? 'ONLINE' : 'OFFLINE',
                      style: TextStyle(
                        color: host.isAvailable
                            ? const Color(0xFF047857)
                            : const Color(0xFF6B7280),
                        fontSize: 10.5,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(),

              // [ Call Now ] Button
              ElevatedButton.icon(
                onPressed: host.isAvailable ? onStartCall : null,
                icon: Icon(
                  host.isAvailable ? Icons.call_rounded : Icons.phone_disabled_rounded,
                  size: 16,
                  color: Colors.white,
                ),
                label: Text(
                  host.isAvailable ? 'Call Now' : 'Offline',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: host.isAvailable
                      ? FriendooUiColors.ink
                      : const Color(0xFF9CA3AF),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: host.isAvailable ? 3 : 0,
                  shadowColor: Colors.black.withOpacity(0.2),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class FriendooAnalyticsView extends ConsumerStatefulWidget {
  const FriendooAnalyticsView({
    super.key,
    required this.onExplore,
    this.onStartCall,
  });

  final VoidCallback onExplore;
  final ValueChanged<HostProfile>? onStartCall;

  @override
  ConsumerState<FriendooAnalyticsView> createState() => _FriendooAnalyticsViewState();
}

class _FriendooAnalyticsViewState extends ConsumerState<FriendooAnalyticsView> {
  // 0: All Calls, 1: Online Hosts, 2: Offline Hosts, 3: Completed
  int _filterIndex = 0;
  bool _isReportMode = false;
  final Set<String> _reportedCallIds = <String>{};

  void _toggleReport(CallHistoryItem call) {
    setState(() {
      if (_reportedCallIds.contains(call.id)) {
        _reportedCallIds.remove(call.id);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF374151),
            content: Text('Report for ${call.otherPartyName} undone.'),
            duration: const Duration(seconds: 2),
          ),
        );
      } else {
        _reportedCallIds.add(call.id);
        ref.read(callRepositoryProvider).submitCallReport(
          callId: call.id,
          reason: 'Reported by user from call history',
        );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text('Host ${call.otherPartyName} reported to Trust & Safety team.'),
            action: SnackBarAction(
              label: 'Undo',
              textColor: Colors.white,
              onPressed: () => _toggleReport(call),
            ),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final historyAsync = ref.watch(callHistoryProvider);

    return historyAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
        children: [
          _UserCallsHeader(
            onToggleReportMode: () => setState(() => _isReportMode = !_isReportMode),
            isReportMode: _isReportMode,
            onFilter: () => _showUserFilterSheet(context, const []),
          ),
          const SizedBox(height: 24),
          _EmptySurface(
            icon: Icons.phone_missed_rounded,
            title: 'Call history is taking a breath',
            message: 'Pull down to refresh and see your recent calls.',
            actionLabel: 'Discover Hosts',
            onAction: widget.onExplore,
          ),
        ],
      ),
      data: (allCalls) {
        // Apply Filter
        final filteredCalls = allCalls.where((call) {
          if (_filterIndex == 1) return call.isOtherPartyOnline;
          if (_filterIndex == 2) return !call.isOtherPartyOnline;
          if (_filterIndex == 3) return call.status == 'ended';
          return true;
        }).toList();

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 36),
          children: [
            // ==========================================
            // 1. USER CALLS HEADER
            // Left: Title "Call History" + Subtitle "Recent voice conversations with verified hosts"
            // Right: [ Filter ] [ Report ] (NO notification icon)
            // ==========================================
            _UserCallsHeader(
              onToggleReportMode: () => setState(() => _isReportMode = !_isReportMode),
              isReportMode: _isReportMode,
              onFilter: () => _showUserFilterSheet(context, allCalls),
            ),
            const SizedBox(height: 14),

            // Horizontal Filter Chips for Quick Access (All / Online Hosts / Offline Hosts)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _CallsFilterChip(
                    label: 'All Calls',
                    selected: _filterIndex == 0,
                    count: allCalls.length,
                    onTap: () => setState(() => _filterIndex = 0),
                  ),
                  const SizedBox(width: 8),
                  _CallsFilterChip(
                    label: 'Online Hosts',
                    icon: Icons.circle_rounded,
                    iconColor: const Color(0xFF10B981),
                    selected: _filterIndex == 1,
                    count: allCalls.where((c) => c.isOtherPartyOnline).length,
                    onTap: () => setState(() => _filterIndex = 1),
                  ),
                  const SizedBox(width: 8),
                  _CallsFilterChip(
                    label: 'Offline Hosts',
                    icon: Icons.circle_outlined,
                    iconColor: const Color(0xFF9CA3AF),
                    selected: _filterIndex == 2,
                    count: allCalls.where((c) => !c.isOtherPartyOnline).length,
                    onTap: () => setState(() => _filterIndex = 2),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // ==========================================
            // 2. CALL HISTORY CARDS (User -> Host)
            // ==========================================
            if (filteredCalls.isEmpty)
              _EmptySurface(
                icon: Icons.forum_outlined,
                title: 'No calls match this filter',
                message: 'Explore available hosts in the Discover tab to connect with someone.',
                actionLabel: 'Discover Hosts',
                onAction: widget.onExplore,
              )
            else
              ...filteredCalls.map(
                (call) => Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: _UserCallCard(
                    call: call,
                    isReportMode: _isReportMode,
                    isReported: _reportedCallIds.contains(call.id),
                    onToggleReport: () => _toggleReport(call),
                    onCallAgain: () {
                      if (widget.onStartCall != null) {
                        final host = HostProfile(
                          id: call.id,
                          displayName: call.otherPartyName,
                          bio: 'Verified host on Friendoo',
                          ratePerAudioMinute: 5,
                          isAvailable: call.isOtherPartyOnline,
                          isStar: call.isOtherPartyStar,
                          languages: call.displayLanguages,
                          gender: 'female',
                          rating: 4.9,
                          totalCalls: 120,
                          age: call.displayAge,
                          city: call.displayCity,
                        );
                        widget.onStartCall!(host);
                      }
                    },
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  void _showUserFilterSheet(BuildContext context, List<CallHistoryItem> calls) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE5E7EB),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Filter Call History',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: FriendooUiColors.ink,
              ),
            ),
            const SizedBox(height: 16),
            _FilterRadioTile(
              title: 'All Calls',
              subtitle: 'Show all recent conversations',
              selected: _filterIndex == 0,
              onTap: () {
                setState(() => _filterIndex = 0);
                Navigator.of(ctx).pop();
              },
            ),
            _FilterRadioTile(
              title: 'Online Hosts',
              subtitle: 'Hosts who are currently available for calls',
              selected: _filterIndex == 1,
              onTap: () {
                setState(() => _filterIndex = 1);
                Navigator.of(ctx).pop();
              },
            ),
            _FilterRadioTile(
              title: 'Offline Hosts',
              subtitle: 'Hosts currently away or resting',
              selected: _filterIndex == 2,
              onTap: () {
                setState(() => _filterIndex = 2);
                Navigator.of(ctx).pop();
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _UserCallsHeader extends StatelessWidget {
  const _UserCallsHeader({
    required this.onToggleReportMode,
    required this.onFilter,
    required this.isReportMode,
  });

  final VoidCallback? onToggleReportMode;
  final VoidCallback? onFilter;
  final bool isReportMode;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Left Title & Subtitle
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Call History',
                style: TextStyle(
                  color: FriendooUiColors.ink,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.7,
                  height: 1.15,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Recent voice conversations with verified hosts',
                style: TextStyle(
                  color: FriendooUiColors.muted,
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),

        // Right Actions: [ Filter ] [ Report ] (NO notification icon)
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // [ Filter ]
            InkWell(
              onTap: onFilter,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.filter_list_rounded, size: 16, color: FriendooUiColors.ink),
                    SizedBox(width: 4),
                    Text(
                      'Filter',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: FriendooUiColors.ink,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),

            // [ Report ] / [ Done ]
            InkWell(
              onTap: onToggleReportMode,
              borderRadius: BorderRadius.circular(12),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                decoration: BoxDecoration(
                  color: isReportMode ? const Color(0xFFDC2626) : const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isReportMode ? const Color(0xFFDC2626) : const Color(0xFFFECACA),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isReportMode ? Icons.check_rounded : Icons.shield_outlined,
                      size: 16,
                      color: isReportMode ? Colors.white : const Color(0xFFDC2626),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isReportMode ? 'Done' : 'Report',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: isReportMode ? Colors.white : const Color(0xFFDC2626),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _UserCallCard extends StatelessWidget {
  const _UserCallCard({
    required this.call,
    required this.onCallAgain,
    required this.isReportMode,
    required this.isReported,
    required this.onToggleReport,
  });

  final CallHistoryItem call;
  final VoidCallback onCallAgain;
  final bool isReportMode;
  final bool isReported;
  final VoidCallback onToggleReport;

  @override
  Widget build(BuildContext context) {
    final isOnline = call.isOtherPartyOnline;
    final languagesText = call.displayLanguages.join(' · ');

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isReported
              ? const Color(0xFFFCA5A5)
              : (isOnline ? const Color(0xFF6366F1).withOpacity(0.2) : const Color(0xFFE5E7EB)),
          width: isReported ? 1.4 : 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: isOnline ? const Color(0x106366F1) : Colors.black.withOpacity(0.02),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Host Desi Avatar (with age styling & presence dot)
              DesiFemaleAvatar(
                seed: call.otherPartyName,
                age: call.displayAge,
                isStar: call.isOtherPartyStar,
                size: 62,
                showPresence: true,
                isOnline: isOnline,
              ),
              const SizedBox(width: 14),

              // Center Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Host Name + Verification
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            call.otherPartyName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: FriendooUiColors.ink,
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.3,
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.verified_rounded,
                          color: Color(0xFF10B981),
                          size: 15,
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),

                    // Age & Languages
                    Row(
                      children: [
                        Text(
                          '${call.displayAge} yrs',
                          style: const TextStyle(
                            color: Color(0xFF4B5563),
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(width: 5),
                        const Text('•', style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
                        const SizedBox(width: 5),
                        Flexible(
                          child: Text(
                            languagesText,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: FriendooUiColors.violet,
                              fontSize: 12.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),

                    // Online / Offline Status Pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                      decoration: BoxDecoration(
                        color: isOnline ? const Color(0xFFECFDF5) : const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: isOnline
                              ? const Color(0xFF10B981).withOpacity(0.3)
                              : const Color(0xFFE5E7EB),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.circle_rounded,
                            size: 6.5,
                            color: isOnline ? const Color(0xFF10B981) : const Color(0xFF9CA3AF),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isOnline ? 'ONLINE' : 'OFFLINE',
                            style: TextStyle(
                              color: isOnline ? const Color(0xFF047857) : const Color(0xFF6B7280),
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Right Amount Paid
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '₹${call.displayPaidInr}',
                    style: const TextStyle(
                      color: FriendooUiColors.ink,
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Container(
                    margin: const EdgeInsets.only(top: 2),
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'Paid',
                      style: TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFF3F4F6)),
          const SizedBox(height: 10),

          // Bottom Bar: Date/Time + Duration + [ Call Again ] CTA OR [ Report ] / [ Undo ]
          Row(
            children: [
              // Date & Time + Duration
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.schedule_rounded, size: 13, color: Color(0xFF6B7280)),
                        const SizedBox(width: 4),
                        Text(
                          call.formattedDateTime,
                          style: const TextStyle(
                            color: Color(0xFF4B5563),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.timer_outlined, size: 13, color: Color(0xFF9CA3AF)),
                        const SizedBox(width: 4),
                        Text(
                          call.formattedDuration,
                          style: const TextStyle(
                            color: Color(0xFF6B7280),
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Action button: If Report Mode -> [ Report ] / [ Undo ], If Normal Mode -> [ Call Again ] / [ Offline ]
              if (isReportMode)
                isReported
                    ? OutlinedButton.icon(
                        onPressed: onToggleReport,
                        icon: const Icon(Icons.undo_rounded, size: 14, color: Color(0xFFDC2626)),
                        label: const Text(
                          'Undo',
                          style: TextStyle(
                            color: Color(0xFFDC2626),
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFFDC2626)),
                          backgroundColor: const Color(0xFFFEF2F2),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      )
                    : FilledButton.icon(
                        onPressed: onToggleReport,
                        icon: const Icon(Icons.shield_outlined, size: 14, color: Colors.white),
                        label: const Text(
                          'Report',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFFDC2626),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      )
              else
                ElevatedButton.icon(
                  onPressed: isOnline ? onCallAgain : null,
                  icon: Icon(
                    isOnline ? Icons.call_rounded : Icons.phone_disabled_rounded,
                    size: 15,
                    color: Colors.white,
                  ),
                  label: Text(
                    isOnline ? 'Call Again' : 'Offline',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isOnline ? FriendooUiColors.ink : const Color(0xFF9CA3AF),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: isOnline ? 2 : 0,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CallsFilterChip extends StatelessWidget {
  const _CallsFilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.count,
    this.icon,
    this.iconColor,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final int? count;
  final IconData? icon;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(99),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6.5),
        decoration: BoxDecoration(
          color: selected ? FriendooUiColors.ink : Colors.white,
          borderRadius: BorderRadius.circular(99),
          border: Border.all(
            color: selected ? FriendooUiColors.ink : const Color(0xFFE5E7EB),
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: FriendooUiColors.ink.withOpacity(0.18),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 8, color: selected ? Colors.white : (iconColor ?? const Color(0xFF10B981))),
              const SizedBox(width: 5),
            ],
            Text(
              label,
              style: TextStyle(
                color: selected ? Colors.white : const Color(0xFF374151),
                fontSize: 12.5,
                fontWeight: FontWeight.w800,
              ),
            ),
            if (count != null && count! > 0) ...[
              const SizedBox(width: 5),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(
                  color: selected ? Colors.white.withOpacity(0.2) : const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    color: selected ? Colors.white : const Color(0xFF6B7280),
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _FilterRadioTile extends StatelessWidget {
  const _FilterRadioTile({
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFEDE9FE) : const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? FriendooUiColors.blue : const Color(0xFFE5E7EB),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w800,
                      color: selected ? FriendooUiColors.blue : FriendooUiColors.ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
                          selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                          color: selected ? FriendooUiColors.blue : const Color(0xFF9CA3AF),
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                );
  }
}

// ============================================================================
// 1. USER ROLE VIEW — WALLET SCREEN
// ============================================================================

class FriendooWalletView extends ConsumerStatefulWidget {
  const FriendooWalletView({super.key});

  @override
  ConsumerState<FriendooWalletView> createState() => _FriendooWalletViewState();
}

class _FriendooWalletViewState extends ConsumerState<FriendooWalletView> {
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToRecharge() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        150.0,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutCubic,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final walletAsync = ref.watch(walletStreamProvider);
    final packagesAsync = ref.watch(coinPackagesProvider);
    final transactionsAsync = ref.watch(walletTransactionsProvider);

    return ListView(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
      children: [
        // HEADER: Title, Subtitle, Help info icon (NO notification icons)
        _WalletHeader(
          title: 'Wallet',
          subtitle: 'Your balance, recharge and spending',
          onInfoTap: () => _showWalletInfoSheet(context),
        ),
        const SizedBox(height: 20),

        // SECTION A: AVAILABLE BALANCE CARD
        _UserBalanceCard(
          walletAsync: walletAsync,
          onAddCoinsTap: () {
            packagesAsync.whenData((packages) {
              if (packages.isNotEmpty) {
                // Open Popular or Starter package checkout directly or scroll
                final popular = packages.firstWhere(
                  (p) => p.bonus?.contains('Popular') ?? false,
                  orElse: () => packages.first,
                );
                RechargeCheckoutSheet.show(context, package: popular);
              } else {
                _scrollToRecharge();
              }
            });
          },
        ),
        const SizedBox(height: 24),

        // SECTION B: RECHARGE COINS
        packagesAsync.when(
          loading: () => const _LoadingSurface(),
          error: (_, __) => const SizedBox.shrink(),
          data: (packages) => _RechargeCoinsHorizontalSection(
            packages: packages,
            onViewAll: () => _showAllPackagesSheet(context, packages),
            onSelectPackage: (pkg) => RechargeCheckoutSheet.show(
              context,
              package: pkg,
            ),
          ),
        ),
        const SizedBox(height: 24),

        // SECTION C: MONTHLY SUMMARY (Calls, Duration, Amount Spent)
        const _UserMonthlySummaryCard(
          callsCount: 12,
          totalDuration: '6h 18m',
          amountSpentInr: 1240,
        ),
        const SizedBox(height: 28),

        // SECTION D: RECENT TRANSACTIONS (Paid / Added)
        transactionsAsync.when(
          loading: () => const _LoadingSurface(),
          error: (_, __) => const SizedBox.shrink(),
          data: (transactions) => _UserRecentTransactionsSection(
            transactions: transactions,
            onViewAll: () => _showAllUserTransactionsSheet(context, transactions),
          ),
        ),
        const SizedBox(height: 20),

        // Security footer
        const _SecurityFooter(),
      ],
    );
  }
}

class FriendooProfileView extends ConsumerWidget {
  const FriendooProfileView({super.key, required this.onSignOut});

  final VoidCallback onSignOut;

  void _confirmSignOut(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Text(
          'Sign out of Friendoo?',
          style: TextStyle(fontWeight: FontWeight.w900, color: FriendooUiColors.ink),
        ),
        content: const Text('Are you sure you want to log out of your Friendoo account?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF6B7280), fontWeight: FontWeight.w700)),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: FriendooUiColors.pink,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              Navigator.of(ctx).pop();
              onSignOut();
            },
            child: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileRepository = ref.watch(profileRepositoryProvider);
    final history =
        ref.watch(callHistoryProvider).asData?.value ??
        const <CallHistoryItem>[];
    final wallet = ref.watch(walletStreamProvider).asData?.value;

    return StreamBuilder<UserProfile?>(
      stream: profileRepository.watchCurrentUserProfile(),
      builder: (context, snapshot) {
        final profile = snapshot.data;
        final name = profile?.displayName ?? 'Rahul Sharma';
        final languages = profile?.preferredLanguages ?? const <String>['Hindi', 'Tamil', 'English'];
        final totalCalls = history.length;
        final coinBalance = wallet?.coinBalance ?? 120;

        return ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
          children: [
            // User Category Chip
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: FriendooUiColors.softBlue,
                    borderRadius: BorderRadius.circular(99),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.person_rounded, size: 13, color: FriendooUiColors.blue),
                      SizedBox(width: 5),
                      Text(
                        'MEMBER PROFILE',
                        style: TextStyle(
                          color: FriendooUiColors.blue,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text('Account & Settings', style: _FriendooTitle()),
            const SizedBox(height: 4),
            const Text(
              'Manage your identity, safety preferences, and call controls.',
              style: _FriendooMuted(),
            ),
            const SizedBox(height: 20),

            // 1. Male User Profile Hero Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(18),
              child: Column(
                children: [
                  Row(
                    children: [
                      // Male Avatar
                      DesiMaleAvatar(
                        seed: name,
                        age: 26,
                        size: 74,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: FriendooUiColors.ink,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: -0.3,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.verified_rounded,
                                  color: Color(0xFF10B981),
                                  size: 16,
                                ),
                              ],
                            ),
                            const SizedBox(height: 3),
                            Row(
                              children: [
                                const Text(
                                  '26 yrs',
                                  style: TextStyle(
                                    color: Color(0xFF4B5563),
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF3F4F6),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    'ID: FRND-9482',
                                    style: TextStyle(
                                      color: Color(0xFF6B7280),
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              languages.join(' · '),
                              style: const TextStyle(
                                color: FriendooUiColors.blue,
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  // Edit Profile Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const EditUserProfilePage(),
                          ),
                        );
                      },
                      icon: const Icon(Icons.edit_outlined, size: 16),
                      label: const Text('Edit Profile', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: FriendooUiColors.ink,
                        side: const BorderSide(color: Color(0xFFE5E7EB)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 2. Caller Stats Summary Card (Total Calls & Vault Coins)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'TALK VAULT',
                          style: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.8,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.monetization_on_rounded, color: Color(0xFFFFD166), size: 18),
                            const SizedBox(width: 6),
                            Text(
                              '$coinBalance Coins',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(height: 32, width: 1, color: const Color(0xFF334155)),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(left: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'COMPLETED CALLS',
                            style: TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              const Icon(Icons.phone_in_talk_rounded, color: Color(0xFF38BDF8), size: 17),
                              const SizedBox(width: 6),
                              Text(
                                '$totalCalls Sessions',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // 3. ACCOUNT & PREFERENCES SECTION
            const Text(
              'ACCOUNT & PREFERENCES',
              style: TextStyle(
                color: Color(0xFF4B5563),
                fontSize: 12.5,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.4,
              ),
            ),
            const SizedBox(height: 12),

            // Dedicated Page Navigation Rows (Entire Card is Clickable)
            _ProfileNavigationRow(
              icon: Icons.phone_in_talk_outlined,
              iconBg: const Color(0xFFEDE9FE),
              iconColor: const Color(0xFF7C3AED),
              title: 'Call Preferences',
              subtitle: 'Audio quality, balance alerts & auto-filters',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const UserCallPreferencesPage(),
                  ),
                );
              },
            ),
            const SizedBox(height: 10),

            _ProfileNavigationRow(
              icon: Icons.security_rounded,
              iconBg: const Color(0xFFECFDF5),
              iconColor: const Color(0xFF059669),
              title: 'Privacy & Safety',
              subtitle: 'Incognito mode, encryption & visibility controls',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const UserPrivacySafetyPage(),
                  ),
                );
              },
            ),
            const SizedBox(height: 10),

            _ProfileNavigationRow(
              icon: Icons.block_flipped,
              iconBg: const Color(0xFFFEF2F2),
              iconColor: const Color(0xFFDC2626),
              title: 'Blocked Users',
              subtitle: 'Manage and unblock previously blocked accounts',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const UserBlockedUsersPage(),
                  ),
                );
              },
            ),
            const SizedBox(height: 10),

            _ProfileNavigationRow(
              icon: Icons.notifications_none_rounded,
              iconBg: const Color(0xFFFEF3C7),
              iconColor: const Color(0xFFD97706),
              title: 'Notification Settings',
              subtitle: 'Incoming calls, coin alerts & sound toggles',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const UserNotificationSettingsPage(),
                  ),
                );
              },
            ),
            const SizedBox(height: 10),

            _ProfileNavigationRow(
              icon: Icons.headset_mic_outlined,
              iconBg: const Color(0xFFE0F2FE),
              iconColor: const Color(0xFF0284C7),
              title: 'Help & Support',
              subtitle: '24/7 caller assistance, FAQs & safety guidelines',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const HelpSupportPage(isHost: false),
                  ),
                );
              },
            ),
            const SizedBox(height: 10),

            _ProfileNavigationRow(
              icon: Icons.info_outline_rounded,
              iconBg: const Color(0xFFF3F4F6),
              iconColor: FriendooUiColors.ink,
              title: 'About Friendoo',
              subtitle: 'App version, terms, privacy & licenses',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const AboutFriendooPage(isHost: false),
                  ),
                );
              },
            ),
            const SizedBox(height: 10),

            _ProfileNavigationRow(
              icon: Icons.translate_rounded,
              iconBg: const Color(0xFFFDF2F8),
              iconColor: const Color(0xFFDB2777),
              title: 'Languages',
              subtitle: 'Select languages you speak & understand',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const UserLanguagesPage(isHost: false),
                  ),
                );
              },
            ),
            const SizedBox(height: 10),

            _ProfileNavigationRow(
              icon: Icons.person_outline_rounded,
              iconBg: const Color(0xFFF5F3FF),
              iconColor: const Color(0xFF6366F1),
              title: 'Edit Profile',
              subtitle: 'Update your name, age, bio & avatar',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const EditUserProfilePage(),
                  ),
                );
              },
            ),
            const SizedBox(height: 24),

            // Sign Out Button
            OutlinedButton.icon(
              onPressed: () => _confirmSignOut(context),
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Sign out of Friendoo'),
              style: OutlinedButton.styleFrom(
                foregroundColor: FriendooUiColors.pink,
                side: const BorderSide(color: Color(0xFFFFD1DC), width: 1.5),
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

/// Reusable full-row clickable navigation card for Profile screens
class _ProfileNavigationRow extends StatelessWidget {
  const _ProfileNavigationRow({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: FriendooUiColors.ink,
                        fontSize: 14.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                Icons.chevron_right_rounded,
                color: Color(0xFF9CA3AF),
                size: 22,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// 2. HOST ROLE VIEW — EARNINGS SCREEN
// ============================================================================

class FriendooHostEarningsView extends ConsumerStatefulWidget {
  const FriendooHostEarningsView({super.key});

  @override
  ConsumerState<FriendooHostEarningsView> createState() =>
      _FriendooHostEarningsViewState();
}

class _FriendooHostEarningsViewState
    extends ConsumerState<FriendooHostEarningsView> {
  int _chartFilter = 0; // 0: 7D, 1: 30D, 2: 90D

  @override
  Widget build(BuildContext context) {
    final hostStatsAsync = ref.watch(hostDashboardStatsProvider);
    final recentEarningsAsync = ref.watch(hostRecentEarningsProvider);

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 36),
      children: [
        // HEADER: Title, Subtitle, Help info icon (NO wallet balance / NO recharge)
        _WalletHeader(
          title: 'Earnings',
          subtitle: 'Your earnings, withdrawals and performance',
          onInfoTap: () => _showHostEarningsInfoSheet(context),
        ),
        const SizedBox(height: 20),

        // SECTION A: TOTAL EARNINGS CARD
        hostStatsAsync.when(
          loading: () => const _LoadingSurface(),
          error: (_, __) => _HostTotalEarningsCard(
            totalEarningsInr: 8450,
            availableToWithdrawInr: 5240,
            onWithdraw: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const HostWithdrawalPage(
                  availableAmount: 5240,
                ),
              ),
            ),
          ),
          data: (stats) => _HostTotalEarningsCard(
            totalEarningsInr: stats.totalEarningsInr,
            availableToWithdrawInr: stats.availableToWithdrawInr,
            onWithdraw: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => HostWithdrawalPage(
                  availableAmount: stats.availableToWithdrawInr,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),

        // SECTION B: QUICK STATS (This Week, This Month, Total Calls)
        hostStatsAsync.when(
          loading: () => const _LoadingSurface(),
          error: (_, __) => const _HostQuickStatsRow(
            thisWeekInr: 2340,
            thisMonthInr: 8450,
            totalCalls: 126,
          ),
          data: (stats) => _HostQuickStatsRow(
            thisWeekInr: stats.thisWeekEarningsInr,
            thisMonthInr: stats.thisMonthEarningsInr,
            totalCalls: stats.totalCallsCount,
          ),
        ),
        const SizedBox(height: 24),

        // SECTION C: EARNINGS OVERVIEW (Minimal Clean Line Chart with 7D/30D/90D)
        _HostEarningsOverviewCard(
          selectedFilter: _chartFilter,
          onFilterChanged: (filter) => setState(() => _chartFilter = filter),
        ),
        const SizedBox(height: 24),

        // SECTION D: HOW YOU EARNED (Voice Calls, Bonuses, Referrals, Total)
        hostStatsAsync.when(
          loading: () => const _LoadingSurface(),
          error: (_, __) => const _HostHowYouEarnedCard(
            voiceCallsInr: 7850,
            bonusesInr: 400,
            referralsInr: 200,
            totalInr: 8450,
          ),
          data: (stats) => _HostHowYouEarnedCard(
            voiceCallsInr: stats.voiceCallsEarningsInr,
            bonusesInr: stats.bonusesEarningsInr,
            referralsInr: stats.referralsEarningsInr,
            totalInr: stats.totalEarningsInr,
          ),
        ),
        const SizedBox(height: 24),

        // SECTION E: WITHDRAWAL CARD
        hostStatsAsync.when(
          loading: () => const _LoadingSurface(),
          error: (_, __) => _HostWithdrawalCard(
            availableToWithdrawInr: 5240,
            onWithdraw: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const HostWithdrawalPage(
                  availableAmount: 5240,
                ),
              ),
            ),
          ),
          data: (stats) => _HostWithdrawalCard(
            availableToWithdrawInr: stats.availableToWithdrawInr,
            onWithdraw: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => HostWithdrawalPage(
                  availableAmount: stats.availableToWithdrawInr,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 28),

        // SECTION F: RECENT EARNINGS (Earned transactions with Initials Avatar)
        recentEarningsAsync.when(
          loading: () => const _LoadingSurface(),
          error: (_, __) => const SizedBox.shrink(),
          data: (earnings) => _HostRecentEarningsSection(
            earnings: earnings,
            onViewAll: () => _showAllHostEarningsSheet(context, earnings),
          ),
        ),
        const SizedBox(height: 20),

        // Host Payout Note Footer
        const _HostPayoutFooter(),
      ],
    );
  }
}

// ============================================================================
// SHARED WALLET & EARNINGS SUBCOMPONENTS
// ============================================================================

/// Clean Shared Header for Wallet and Earnings
class _WalletHeader extends StatelessWidget {
  const _WalletHeader({
    required this.title,
    required this.subtitle,
    required this.onInfoTap,
  });

  final String title;
  final String subtitle;
  final VoidCallback onInfoTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const _FriendooTitle()),
              const SizedBox(height: 4),
              Text(subtitle, style: const _FriendooMuted()),
            ],
          ),
        ),
        _UiIconButton(
          icon: Icons.info_outline_rounded,
          tooltip: '$title info',
          onPressed: onInfoTap,
        ),
      ],
    );
  }
}

/// User Section A: Available Balance Card
class _UserBalanceCard extends StatelessWidget {
  const _UserBalanceCard({
    required this.walletAsync,
    required this.onAddCoinsTap,
  });

  final AsyncValue<WalletSnapshot> walletAsync;
  final VoidCallback onAddCoinsTap;

  @override
  Widget build(BuildContext context) {
    final wallet = walletAsync.asData?.value;
    final int coins = (wallet?.coinBalance == null || wallet?.coinBalance == 50)
        ? 2450
        : wallet!.coinBalance;
    final int approxMins = (coins / 5).floor();

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFF0E1020),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF26294A)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1A0E1020),
            blurRadius: 20,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1B4B),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.account_balance_wallet_rounded,
                  color: FriendooUiColors.blue,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              const Text(
                'AVAILABLE BALANCE',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            '₹${coins.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 34,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.6,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '$coins coins ≈ $approxMins mins at ₹5/min',
            style: const TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 18),
          FilledButton.icon(
            onPressed: onAddCoinsTap,
            icon: const Icon(Icons.add_rounded, size: 18),
            label: const Text(
              '+ Add Coins',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
            ),
            style: FilledButton.styleFrom(
              backgroundColor: FriendooUiColors.blue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 20),
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// User Section B: Horizontal Recharge Coins Section
class _RechargeCoinsHorizontalSection extends StatelessWidget {
  const _RechargeCoinsHorizontalSection({
    required this.packages,
    required this.onViewAll,
    required this.onSelectPackage,
  });

  final List<CoinPackage> packages;
  final VoidCallback onViewAll;
  final ValueChanged<CoinPackage> onSelectPackage;

  @override
  Widget build(BuildContext context) {
    final displayPackages = packages.isNotEmpty
        ? packages
        : const [
            CoinPackage(
              id: 'pkg_starter_49',
              coins: 50,
              amountInr: 49,
              bonus: 'Starter',
            ),
            CoinPackage(
              id: 'pkg_popular_99',
              coins: 100,
              amountInr: 99,
              bonus: '+10 Bonus',
            ),
            CoinPackage(
              id: 'pkg_value_249',
              coins: 250,
              amountInr: 249,
              bonus: '+40 Bonus',
            ),
            CoinPackage(
              id: 'pkg_pro_499',
              coins: 500,
              amountInr: 499,
              bonus: '+100 Bonus',
            ),
            CoinPackage(
              id: 'pkg_max_999',
              coins: 1000,
              amountInr: 999,
              bonus: '+250 Bonus',
            ),
          ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Recharge Coins', style: _SectionTitle()),
            TextButton(
              onPressed: onViewAll,
              style: TextButton.styleFrom(
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.symmetric(horizontal: 8),
              ),
              child: const Text(
                'View All',
                style: TextStyle(
                  color: FriendooUiColors.blue,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 148,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            itemCount: displayPackages.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              final pkg = displayPackages[index];
              final isPopular =
                  pkg.bonus?.toLowerCase().contains('popular') ??
                  (pkg.coins == 100);
              return _HorizontalCoinPackCard(
                package: pkg,
                isPopular: isPopular,
                onTap: () => onSelectPackage(pkg),
              );
            },
          ),
        ),
      ],
    );
  }
}

/// Compact Horizontal Recharge Package Card
class _HorizontalCoinPackCard extends StatelessWidget {
  const _HorizontalCoinPackCard({
    required this.package,
    required this.isPopular,
    required this.onTap,
  });

  final CoinPackage package;
  final bool isPopular;
  final VoidCallback onTap;

  String _getTierName(int coins) {
    if (coins <= 50) return 'Starter';
    if (coins <= 100) return 'Popular';
    if (coins <= 250) return 'Value';
    if (coins <= 500) return 'Pro';
    return 'Max';
  }

  @override
  Widget build(BuildContext context) {
    final tierName = _getTierName(package.coins);
    final hasBonus = package.bonus != null && package.bonus!.contains('+');

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        width: 126,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isPopular ? FriendooUiColors.violet : const Color(0xFFE2E4ED),
            width: isPopular ? 1.5 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: isPopular
                  ? const Color(0x188B5CF6)
                  : Colors.black.withValues(alpha: 0.03),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  tierName,
                  style: TextStyle(
                    color: isPopular
                        ? FriendooUiColors.violet
                        : FriendooUiColors.muted,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (isPopular)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: FriendooUiColors.softViolet,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'POPULAR',
                      style: TextStyle(
                        color: FriendooUiColors.violet,
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${package.coins} Coins',
                  style: const TextStyle(
                    color: FriendooUiColors.ink,
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                if (hasBonus)
                  Text(
                    package.bonus!,
                    style: const TextStyle(
                      color: Color(0xFF10B981),
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                    ),
                  )
                else
                  const SizedBox(height: 14),
              ],
            ),
            SizedBox(
              width: double.infinity,
              height: 32,
              child: FilledButton(
                onPressed: onTap,
                style: FilledButton.styleFrom(
                  backgroundColor: isPopular
                      ? FriendooUiColors.violet
                      : FriendooUiColors.ink,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.zero,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: Text(
                  '₹${package.amountInr}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// User Section C: Monthly Summary Card (3 columns)
class _UserMonthlySummaryCard extends StatelessWidget {
  const _UserMonthlySummaryCard({
    required this.callsCount,
    required this.totalDuration,
    required this.amountSpentInr,
  });

  final int callsCount;
  final String totalDuration;
  final int amountSpentInr;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E4ED)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x060E1020),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('This Month Summary', style: _CardTitle()),
          const SizedBox(height: 14),
          IntrinsicHeight(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        '$callsCount',
                        style: const TextStyle(
                          color: FriendooUiColors.ink,
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Calls',
                        style: TextStyle(
                          color: FriendooUiColors.muted,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const VerticalDivider(
                  width: 16,
                  thickness: 1,
                  color: Color(0xFFE2E4ED),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        totalDuration,
                        style: const TextStyle(
                          color: FriendooUiColors.ink,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Total Duration',
                        style: TextStyle(
                          color: FriendooUiColors.muted,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const VerticalDivider(
                  width: 16,
                  thickness: 1,
                  color: Color(0xFFE2E4ED),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        '₹$amountSpentInr',
                        style: const TextStyle(
                          color: Color(0xFFE11D48),
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Amount Spent',
                        style: TextStyle(
                          color: FriendooUiColors.muted,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// User Section D: Recent Transactions Section
class _UserRecentTransactionsSection extends StatelessWidget {
  const _UserRecentTransactionsSection({
    required this.transactions,
    required this.onViewAll,
  });

  final List<WalletTransactionItem> transactions;
  final VoidCallback onViewAll;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Recent Transactions', style: _SectionTitle()),
            TextButton(
              onPressed: onViewAll,
              style: TextButton.styleFrom(
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.symmetric(horizontal: 8),
              ),
              child: const Text(
                'View All',
                style: TextStyle(
                  color: FriendooUiColors.blue,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        if (transactions.isEmpty)
          const _EmptySurface(
            icon: Icons.receipt_long_outlined,
            title: 'No transactions yet',
            message: 'Recharge or make calls to see your history logs here.',
          )
        else
          Column(
            children: transactions
                .take(4)
                .map(
                  (tx) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _UserTransactionRow(
                      transaction: tx,
                    ),
                  ),
                )
                .toList(),
          ),
      ],
    );
  }
}

/// Compact User Transaction Row (Red for spent, Green for added)
class _UserTransactionRow extends StatelessWidget {
  const _UserTransactionRow({required this.transaction});

  final WalletTransactionItem transaction;

  @override
  Widget build(BuildContext context) {
    final isCredit = transaction.isCredit;
    final isRecharge =
        isCredit || (transaction.otherPartyName?.contains('Recharge') ?? false);
    final amount = transaction.displayAmountInr;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E4ED)),
      ),
      child: Row(
        children: [
          // Avatar: Host initials / Recharge icon
          if (isRecharge)
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                color: Color(0xFFECFDF5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.account_balance_wallet_rounded,
                color: Color(0xFF10B981),
                size: 20,
              ),
            )
          else
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                color: FriendooUiColors.softPink,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  _extractInitials(transaction.otherPartyName ?? 'Ananya S'),
                  style: const TextStyle(
                    color: FriendooUiColors.pink,
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction.title,
                  style: const TextStyle(
                    color: FriendooUiColors.ink,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  transaction.subtitle,
                  style: const TextStyle(
                    color: FriendooUiColors.muted,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isCredit ? '+' : '-'} ₹$amount',
                style: TextStyle(
                  color: isCredit
                      ? const Color(0xFF10B981)
                      : const Color(0xFFE11D48),
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                isCredit ? 'Added' : 'Paid',
                style: TextStyle(
                  color: isCredit
                      ? const Color(0xFF10B981)
                      : const Color(0xFFE11D48),
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _extractInitials(String name) {
    final clean = name.replaceAll('Call with', '').trim();
    if (clean.isEmpty) return 'AS';
    final parts = clean.split(' ').where((p) => p.isNotEmpty).toList();
    if (parts.length == 1) {
      return parts[0].substring(0, parts[0].length.clamp(1, 2)).toUpperCase();
    }
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }
}

// ============================================================================
// HOST SUBCOMPONENTS
// ============================================================================

/// Host Section A: Total Earnings Card
class _HostTotalEarningsCard extends StatelessWidget {
  const _HostTotalEarningsCard({
    required this.totalEarningsInr,
    required this.availableToWithdrawInr,
    required this.onWithdraw,
  });

  final int totalEarningsInr;
  final int availableToWithdrawInr;
  final VoidCallback onWithdraw;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFF0E1020),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF1E293B)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1A0E1020),
            blurRadius: 20,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF064E3B),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.currency_rupee_rounded,
                  color: Color(0xFF34D399),
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              const Text(
                'TOTAL EARNINGS',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            '₹${totalEarningsInr.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 34,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.6,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Available to withdraw: ₹${availableToWithdrawInr.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
            style: const TextStyle(
              color: Color(0xFF34D399),
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 18),
          FilledButton.icon(
            onPressed: onWithdraw,
            icon: const Icon(Icons.account_balance_rounded, size: 18),
            label: const Text(
              'Withdraw',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
            ),
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 20),
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Host Section B: Quick Stats Row (This Week, This Month, Total Calls)
class _HostQuickStatsRow extends StatelessWidget {
  const _HostQuickStatsRow({
    required this.thisWeekInr,
    required this.thisMonthInr,
    required this.totalCalls,
  });

  final int thisWeekInr;
  final int thisMonthInr;
  final int totalCalls;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _HostStatCard(
            value: '₹${thisWeekInr.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
            label: 'This Week',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _HostStatCard(
            value: '₹${thisMonthInr.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
            label: 'This Month',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _HostStatCard(
            value: '$totalCalls',
            label: 'Total Calls',
          ),
        ),
      ],
    );
  }
}

class _HostStatCard extends StatelessWidget {
  const _HostStatCard({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E4ED)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x060E1020),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            value,
            style: const TextStyle(
              color: FriendooUiColors.ink,
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 3),
          Text(
            label,
            style: const TextStyle(
              color: FriendooUiColors.muted,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

/// Host Section C: Earnings Overview (Custom Line Chart with 7D/30D/90D filters)
class _HostEarningsOverviewCard extends StatefulWidget {
  const _HostEarningsOverviewCard({
    required this.selectedFilter,
    required this.onFilterChanged,
  });

  final int selectedFilter;
  final ValueChanged<int> onFilterChanged;

  @override
  State<_HostEarningsOverviewCard> createState() =>
      _HostEarningsOverviewCardState();
}

class _HostEarningsOverviewCardState extends State<_HostEarningsOverviewCard> {
  int _selectedDayIndex = 5; // Default Saturday (highest point ₹890)

  static const _filters = ['7D', '30D', '90D'];

  final List<List<double>> _chartData = [
    [320, 580, 210, 740, 420, 890, 610], // 7D
    [1850, 2120, 1940, 2540], // 30D
    [6200, 7450, 8450], // 90D
  ];

  final List<List<String>> _chartLabels = [
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    ['W1', 'W2', 'W3', 'W4'],
    ['Month 1', 'Month 2', 'Month 3'],
  ];

  @override
  Widget build(BuildContext context) {
    final points = _chartData[widget.selectedFilter];
    final labels = _chartLabels[widget.selectedFilter];
    final safeIndex = _selectedDayIndex.clamp(0, points.length - 1);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E4ED)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x060E1020),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Earnings Overview', style: _CardTitle()),
              Row(
                children: List.generate(_filters.length, (index) {
                  final isSelected = widget.selectedFilter == index;
                  return Padding(
                    padding: const EdgeInsets.only(left: 6),
                    child: InkWell(
                      onTap: () {
                        widget.onFilterChanged(index);
                        setState(() => _selectedDayIndex = 0);
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? FriendooUiColors.ink
                              : const Color(0xFFF1F3F9),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _filters[index],
                          style: TextStyle(
                            color: isSelected
                                ? Colors.white
                                : FriendooUiColors.muted,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ],
          ),
          const SizedBox(height: 18),
          GestureDetector(
            onTapDown: (details) {
              final box = context.findRenderObject() as RenderBox?;
              if (box != null) {
                final localX = details.localPosition.dx;
                final width = box.size.width - 36;
                final step = width / (points.length - 1);
                final tappedIndex = ((localX - 18) / step).round().clamp(
                      0,
                      points.length - 1,
                    );
                setState(() => _selectedDayIndex = tappedIndex);
              }
            },
            child: SizedBox(
              height: 150,
              width: double.infinity,
              child: CustomPaint(
                painter: _EarningsLineChartPainter(
                  points: points,
                  labels: labels,
                  selectedIndex: safeIndex,
                  primaryColor: const Color(0xFF10B981),
                  accentColor: FriendooUiColors.blue,
                  gridColor: const Color(0xFFF1F3F9),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Custom Line Chart Painter for Host Earnings
class _EarningsLineChartPainter extends CustomPainter {
  _EarningsLineChartPainter({
    required this.points,
    required this.labels,
    required this.selectedIndex,
    required this.primaryColor,
    required this.accentColor,
    required this.gridColor,
  });

  final List<double> points;
  final List<String> labels;
  final int selectedIndex;
  final Color primaryColor;
  final Color accentColor;
  final Color gridColor;

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;

    const double paddingLeft = 14.0;
    const double paddingRight = 14.0;
    const double paddingTop = 28.0;
    const double paddingBottom = 24.0;

    final double chartWidth = size.width - paddingLeft - paddingRight;
    final double chartHeight = size.height - paddingTop - paddingBottom;

    final double maxVal = points.reduce((a, b) => a > b ? a : b);
    final double minVal = 0;
    final double range = (maxVal - minVal) == 0 ? 1 : (maxVal - minVal);

    // Draw horizontal dashed grid lines (3 levels)
    final gridPaint = Paint()
      ..color = gridColor
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    for (int i = 0; i <= 2; i++) {
      final y = paddingTop + (chartHeight / 2) * i;
      _drawDashedLine(
        canvas,
        Offset(paddingLeft, y),
        Offset(size.width - paddingRight, y),
        gridPaint,
      );
    }

    // Compute point offsets
    final offsets = <Offset>[];
    final double dx = points.length > 1 ? chartWidth / (points.length - 1) : 0;
    for (int i = 0; i < points.length; i++) {
      final x = paddingLeft + dx * i;
      final normalized = (points[i] - minVal) / range;
      final y = paddingTop + chartHeight - (normalized * chartHeight);
      offsets.add(Offset(x, y));
    }

    // Build smooth cubic Bezier path
    final linePath = Path();
    linePath.moveTo(offsets[0].dx, offsets[0].dy);

    for (int i = 0; i < offsets.length - 1; i++) {
      final p0 = offsets[i];
      final p1 = offsets[i + 1];
      final controlPointX1 = p0.dx + (p1.dx - p0.dx) / 2;
      final controlPointY1 = p0.dy;
      final controlPointX2 = p0.dx + (p1.dx - p0.dx) / 2;
      final controlPointY2 = p1.dy;
      linePath.cubicTo(
        controlPointX1,
        controlPointY1,
        controlPointX2,
        controlPointY2,
        p1.dx,
        p1.dy,
      );
    }

    // Gradient fill under the curve
    final fillPath = Path.from(linePath);
    fillPath.lineTo(offsets.last.dx, paddingTop + chartHeight);
    fillPath.lineTo(offsets.first.dx, paddingTop + chartHeight);
    fillPath.close();

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          primaryColor.withValues(alpha: 0.22),
          primaryColor.withValues(alpha: 0.01),
        ],
      ).createShader(Rect.fromLTWH(0, paddingTop, size.width, chartHeight))
      ..style = PaintingStyle.fill;

    canvas.drawPath(fillPath, fillPaint);

    // Stroke line
    final linePaint = Paint()
      ..shader = LinearGradient(
        colors: [primaryColor, accentColor],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    canvas.drawPath(linePath, linePaint);

    // Draw dots, tooltips and X-axis day labels
    for (int i = 0; i < offsets.length; i++) {
      final isSelected = i == selectedIndex;
      final p = offsets[i];

      // Draw dot
      final dotBgPaint = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.fill;
      final dotBorderPaint = Paint()
        ..color = isSelected ? primaryColor : primaryColor.withValues(alpha: 0.6)
        ..strokeWidth = isSelected ? 3.0 : 2.0
        ..style = PaintingStyle.stroke;

      canvas.drawCircle(p, isSelected ? 6.0 : 4.0, dotBgPaint);
      canvas.drawCircle(p, isSelected ? 6.0 : 4.0, dotBorderPaint);

      // Tooltip/Value bubble on selected point
      if (isSelected) {
        final amountText = '₹${points[i].toInt()}';
        final textPainter = TextPainter(
          text: TextSpan(
            text: amountText,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w900,
            ),
          ),
          textDirection: TextDirection.ltr,
        )..layout();

        final bubbleWidth = textPainter.width + 12;
        final bubbleHeight = textPainter.height + 6;
        final bubbleRect = RRect.fromRectAndRadius(
          Rect.fromCenter(
            center: Offset(
              p.dx.clamp(
                bubbleWidth / 2 + 4,
                size.width - bubbleWidth / 2 - 4,
              ),
              p.dy - 16,
            ),
            width: bubbleWidth,
            height: bubbleHeight,
          ),
          const Radius.circular(6),
        );

        final bubblePaint = Paint()..color = const Color(0xFF0E1020);
        canvas.drawRRect(bubbleRect, bubblePaint);
        textPainter.paint(
          canvas,
          Offset(bubbleRect.left + 6, bubbleRect.top + 3),
        );
      }

      // X-axis day label
      if (i < labels.length) {
        final labelPainter = TextPainter(
          text: TextSpan(
            text: labels[i],
            style: TextStyle(
              color: isSelected
                  ? const Color(0xFF0E1020)
                  : const Color(0xFF6B7280),
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
            ),
          ),
          textDirection: TextDirection.ltr,
        )..layout();

        labelPainter.paint(
          canvas,
          Offset(
            p.dx - (labelPainter.width / 2),
            size.height - paddingBottom + 8,
          ),
        );
      }
    }
  }

  void _drawDashedLine(Canvas canvas, Offset start, Offset end, Paint paint) {
    const dashWidth = 4.0;
    const dashSpace = 4.0;
    double startX = start.dx;
    while (startX < end.dx) {
      canvas.drawLine(
        Offset(startX, start.dy),
        Offset((startX + dashWidth).clamp(start.dx, end.dx), start.dy),
        paint,
      );
      startX += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant _EarningsLineChartPainter oldDelegate) => true;
}

/// Host Section D: How You Earned Card
class _HostHowYouEarnedCard extends StatelessWidget {
  const _HostHowYouEarnedCard({
    required this.voiceCallsInr,
    required this.bonusesInr,
    required this.referralsInr,
    required this.totalInr,
  });

  final int voiceCallsInr;
  final int bonusesInr;
  final int referralsInr;
  final int totalInr;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E4ED)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x060E1020),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('How You Earned', style: _CardTitle()),
          const SizedBox(height: 14),
          _EarnedBreakdownRow(
            icon: Icons.phone_in_talk_rounded,
            iconBg: FriendooUiColors.softBlue,
            iconColor: FriendooUiColors.blue,
            label: 'Voice Calls',
            amount:
                '₹${voiceCallsInr.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
          ),
          const SizedBox(height: 10),
          _EarnedBreakdownRow(
            icon: Icons.military_tech_rounded,
            iconBg: FriendooUiColors.softGold,
            iconColor: const Color(0xFFD97706),
            label: 'Bonuses',
            amount: '₹$bonusesInr',
          ),
          const SizedBox(height: 10),
          _EarnedBreakdownRow(
            icon: Icons.people_alt_rounded,
            iconBg: FriendooUiColors.softViolet,
            iconColor: FriendooUiColors.violet,
            label: 'Referrals',
            amount: '₹$referralsInr',
          ),
          const Divider(height: 22, thickness: 1, color: Color(0xFFE2E4ED)),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total',
                style: TextStyle(
                  color: FriendooUiColors.ink,
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                '₹${totalInr.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
                style: const TextStyle(
                  color: Color(0xFF10B981),
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EarnedBreakdownRow extends StatelessWidget {
  const _EarnedBreakdownRow({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.label,
    required this.amount,
  });

  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String label;
  final String amount;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(7),
          decoration: BoxDecoration(
            color: iconBg,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: iconColor, size: 16),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              color: FriendooUiColors.ink,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Text(
          amount,
          style: const TextStyle(
            color: FriendooUiColors.ink,
            fontSize: 15,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}

/// Host Section E: Withdrawal Card
class _HostWithdrawalCard extends StatelessWidget {
  const _HostWithdrawalCard({
    required this.availableToWithdrawInr,
    required this.onWithdraw,
  });

  final int availableToWithdrawInr;
  final VoidCallback onWithdraw;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E4ED)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x060E1020),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Withdrawal', style: _CardTitle()),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Available to withdraw',
                    style: TextStyle(
                      color: FriendooUiColors.muted,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '₹${availableToWithdrawInr.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
                    style: const TextStyle(
                      color: FriendooUiColors.ink,
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
              FilledButton(
                onPressed: onWithdraw,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text(
                  'Withdraw',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFF7F8FC),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Row(
              children: [
                Icon(
                  Icons.info_outline_rounded,
                  size: 15,
                  color: FriendooUiColors.muted,
                ),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Minimum withdrawal: ₹500',
                    style: TextStyle(
                      color: FriendooUiColors.muted,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Host Section F: Recent Earnings Section (Initials Avatar only, NO photos)
class _HostRecentEarningsSection extends StatelessWidget {
  const _HostRecentEarningsSection({
    required this.earnings,
    required this.onViewAll,
  });

  final List<HostEarningsItem> earnings;
  final VoidCallback onViewAll;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Recent Earnings', style: _SectionTitle()),
            TextButton(
              onPressed: onViewAll,
              style: TextButton.styleFrom(
                visualDensity: VisualDensity.compact,
                padding: const EdgeInsets.symmetric(horizontal: 8),
              ),
              child: const Text(
                'View All',
                style: TextStyle(
                  color: FriendooUiColors.blue,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        if (earnings.isEmpty)
          const _EmptySurface(
            icon: Icons.payments_outlined,
            title: 'No recent earnings',
            message: 'Answer incoming caller requests to start earning rewards.',
          )
        else
          Column(
            children: earnings
                .take(3)
                .map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _HostEarningsRow(item: item),
                  ),
                )
                .toList(),
          ),
      ],
    );
  }
}

/// Compact Host Earnings Row (Green for earned)
class _HostEarningsRow extends StatelessWidget {
  const _HostEarningsRow({required this.item});

  final HostEarningsItem item;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E4ED)),
      ),
      child: Row(
        children: [
          // User initials or simple placeholder avatar (NO photos)
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: Color(0xFFEDE9FE),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                item.userInitials,
                style: const TextStyle(
                  color: FriendooUiColors.violet,
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: const TextStyle(
                    color: FriendooUiColors.ink,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  item.subtitle,
                  style: const TextStyle(
                    color: FriendooUiColors.muted,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '+ ₹${item.amountEarnedInr}',
                style: const TextStyle(
                  color: Color(0xFF10B981),
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'Earned',
                style: TextStyle(
                  color: Color(0xFF10B981),
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HostPayoutFooter extends StatelessWidget {
  const _HostPayoutFooter();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(
          Icons.account_balance_wallet_outlined,
          color: FriendooUiColors.muted,
          size: 15,
        ),
        const SizedBox(width: 6),
        Text(
          'Withdrawals are transferred to your registered payout account',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: FriendooUiColors.muted,
                fontWeight: FontWeight.w600,
              ),
        ),
      ],
    );
  }
}

// ============================================================================
// DIALOGS & BOTTOM SHEETS (INFO, ALL TRANSACTIONS)
// ============================================================================

/// User Wallet Info Modal Sheet
void _showWalletInfoSheet(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (context) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'About Friendoo Wallet',
              style: TextStyle(
                color: FriendooUiColors.ink,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Simple, transparent coin credits for voice calls',
              style: _FriendooMuted(),
            ),
            const SizedBox(height: 18),
            _infoBullet(
              icon: Icons.toll_rounded,
              color: FriendooUiColors.blue,
              title: '5 Coins = 1 Minute Talk Time',
              description:
                  'Calls are billed per minute with no hidden fees or setup charges.',
            ),
            const SizedBox(height: 12),
            _infoBullet(
              icon: Icons.flash_on_rounded,
              color: const Color(0xFF10B981),
              title: 'Instant Recharge via UPI & Cards',
              description:
                  'Coins are added to your vault immediately after payment confirmation.',
            ),
            const SizedBox(height: 12),
            _infoBullet(
              icon: Icons.card_giftcard_rounded,
              color: const Color(0xFFD97706),
              title: 'Bonus Coins on Higher Packs',
              description:
                  'Enjoy extra bonus talk time on value, pro, and max recharge packages.',
            ),
            const SizedBox(height: 22),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              style: FilledButton.styleFrom(
                backgroundColor: FriendooUiColors.ink,
                minimumSize: const Size(double.infinity, 48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text('Got it'),
            ),
          ],
        ),
      );
    },
  );
}

/// Host Earnings Info Modal Sheet
void _showHostEarningsInfoSheet(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (context) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'About Host Earnings & Payouts',
              style: TextStyle(
                color: FriendooUiColors.ink,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Transparent per-minute earnings on your voice calls',
              style: _FriendooMuted(),
            ),
            const SizedBox(height: 18),
            _infoBullet(
              icon: Icons.currency_rupee_rounded,
              color: const Color(0xFF10B981),
              title: 'Earn ₹5 / Minute',
              description:
                  'Earn directly for every minute of audio conversation you host.',
            ),
            const SizedBox(height: 12),
            _infoBullet(
              icon: Icons.account_balance_wallet_outlined,
              color: FriendooUiColors.blue,
              title: 'Registered Payout Accounts',
              description:
                  'Earnings can be withdrawn directly to your registered UPI or Bank account.',
            ),
            const SizedBox(height: 12),
            _infoBullet(
              icon: Icons.account_balance_rounded,
              color: const Color(0xFFD97706),
              title: 'Minimum Withdrawal ₹500',
              description:
                  'Submit withdrawal requests anytime once your available balance reaches ₹500.',
            ),
            const SizedBox(height: 22),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              style: FilledButton.styleFrom(
                backgroundColor: FriendooUiColors.ink,
                minimumSize: const Size(double.infinity, 48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text('Got it'),
            ),
          ],
        ),
      );
    },
  );
}

Widget _infoBullet({
  required IconData icon,
  required Color color,
  required String title,
  required String description,
}) {
  return Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 18),
      ),
      const SizedBox(width: 12),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                color: FriendooUiColors.ink,
                fontSize: 14,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              description,
              style: const TextStyle(
                color: FriendooUiColors.muted,
                fontSize: 12,
                fontWeight: FontWeight.w500,
                height: 1.35,
              ),
            ),
          ],
        ),
      ),
    ],
  );
}

/// View All Packages Modal Sheet
void _showAllPackagesSheet(BuildContext context, List<CoinPackage> packages) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (context) {
      return DraggableScrollableSheet(
        initialChildSize: 0.65,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) {
          return ListView(
            controller: scrollController,
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            children: [
              const Text(
                'All Recharge Packages',
                style: TextStyle(
                  color: FriendooUiColors.ink,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Choose a talk pack to top up your coin vault',
                style: _FriendooMuted(),
              ),
              const SizedBox(height: 16),
              ...packages.map((pkg) {
                final isPopular =
                    pkg.bonus?.toLowerCase().contains('popular') ?? false;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 6,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(
                        color: isPopular
                            ? FriendooUiColors.violet
                            : const Color(0xFFE2E4ED),
                        width: isPopular ? 1.5 : 1.0,
                      ),
                    ),
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isPopular
                            ? FriendooUiColors.softViolet
                            : const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.monetization_on_rounded,
                        color: Color(0xFFD97706),
                      ),
                    ),
                    title: Text(
                      '${pkg.coins} Coins',
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                      ),
                    ),
                    subtitle: Text(
                      pkg.bonus ?? 'Standard talk pack',
                      style: TextStyle(
                        color: isPopular
                            ? FriendooUiColors.violet
                            : FriendooUiColors.muted,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                    trailing: FilledButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                        RechargeCheckoutSheet.show(context, package: pkg);
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: isPopular
                            ? FriendooUiColors.violet
                            : FriendooUiColors.ink,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text('₹${pkg.amountInr}'),
                    ),
                  ),
                );
              }),
            ],
          );
        },
      );
    },
  );
}

/// View All User Transactions Modal Sheet
void _showAllUserTransactionsSheet(
  BuildContext context,
  List<WalletTransactionItem> transactions,
) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (context) {
      return DraggableScrollableSheet(
        initialChildSize: 0.75,
        minChildSize: 0.4,
        maxChildSize: 0.92,
        expand: false,
        builder: (context, scrollController) {
          return ListView(
            controller: scrollController,
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            children: [
              const Text(
                'Transaction History',
                style: TextStyle(
                  color: FriendooUiColors.ink,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Complete ledger of all coin recharges and call spending',
                style: _FriendooMuted(),
              ),
              const SizedBox(height: 16),
              ...transactions.map(
                (tx) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _UserTransactionRow(transaction: tx),
                ),
              ),
            ],
          );
        },
      );
    },
  );
}

/// View All Host Earnings Modal Sheet
void _showAllHostEarningsSheet(
  BuildContext context,
  List<HostEarningsItem> earnings,
) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (context) {
      return DraggableScrollableSheet(
        initialChildSize: 0.75,
        minChildSize: 0.4,
        maxChildSize: 0.92,
        expand: false,
        builder: (context, scrollController) {
          return ListView(
            controller: scrollController,
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            children: [
              const Text(
                'Earnings Ledger',
                style: TextStyle(
                  color: FriendooUiColors.ink,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'All voice calls hosted and associated compensation',
                style: _FriendooMuted(),
              ),
              const SizedBox(height: 16),
              ...earnings.map(
                (item) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _HostEarningsRow(item: item),
                ),
              ),
            ],
          );
        },
      );
    },
  );
}

// UI Maximalism: Rich Host Preview Card
class _PolishedHostPreviewCard extends StatelessWidget {
  const _PolishedHostPreviewCard({
    required this.host,
    required this.colorIndex,
    required this.onStartCall,
  });

  final HostProfile host;
  final int colorIndex;
  final VoidCallback onStartCall;

  @override
  Widget build(BuildContext context) {
    final avatarGradients = [
      const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFFA855F7)]),
      const LinearGradient(colors: [Color(0xFFFF2A85), Color(0xFFFF758C)]),
      const LinearGradient(colors: [Color(0xFF00D2E0), Color(0xFF06D6A0)]),
      const LinearGradient(colors: [Color(0xFFFFB703), Color(0xFFFF5400)]),
    ];
    final currentGradient = avatarGradients[colorIndex % avatarGradients.length];

    final initial = host.displayName.isEmpty
        ? '?'
        : host.displayName.substring(0, 1).toUpperCase();
    final languages = host.languages.take(3).toList();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(
          color: host.isAvailable
              ? const Color(0xFF6366F1).withOpacity(0.35)
              : const Color(0xFFE2E4ED),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: host.isAvailable
                ? const Color(0x186366F1)
                : Colors.black.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar with Live Status Rings
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 62,
                    height: 62,
                    decoration: BoxDecoration(
                      gradient: currentGradient,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: currentGradient.colors.first.withOpacity(0.4),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        initial,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      padding: const EdgeInsets.all(2.5),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: Container(
                        width: 15,
                        height: 15,
                        decoration: BoxDecoration(
                          color: host.isAvailable
                              ? const Color(0xFF10B981)
                              : FriendooUiColors.muted,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),

              // Host Details & Star Badge
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            host.displayName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: FriendooUiColors.ink,
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.3,
                            ),
                          ),
                        ),
                        if (host.isStar) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFFFB703), Color(0xFFFF5400)],
                              ),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              '⭐ STAR',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: host.isAvailable
                                ? const Color(0xFFECFDF5)
                                : const Color(0xFFF3F4F6),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.circle_rounded,
                                size: 8,
                                color: host.isAvailable
                                    ? const Color(0xFF10B981)
                                    : FriendooUiColors.muted,
                              ),
                              const SizedBox(width: 5),
                              Text(
                                host.isAvailable ? 'LIVE NOW' : 'Away',
                                style: TextStyle(
                                  color: host.isAvailable
                                      ? const Color(0xFF047857)
                                      : FriendooUiColors.muted,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '★ ${host.rating.toStringAsFixed(1)} (2.4k+ calls)',
                          style: const TextStyle(
                            color: Color(0xFFD97706),
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Rate Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: FriendooUiColors.softBlue,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${host.ratePerAudioMinute}',
                      style: const TextStyle(
                        color: FriendooUiColors.blue,
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const Text(
                      'coins/min',
                      style: TextStyle(
                        color: FriendooUiColors.blue,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),
          Text(
            host.bio ?? 'Verified female companion ready for friendly voice chats.',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF4B5563),
              fontSize: 13,
              height: 1.35,
              fontWeight: FontWeight.w500,
            ),
          ),

          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: (languages.isEmpty ? const ['Hindi'] : languages)
                      .map((lang) => _HostLanguagePill(label: lang))
                      .toList(),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: host.isAvailable
                ? Container(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                      ),
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x356366F1),
                          blurRadius: 16,
                          offset: Offset(0, 6),
                        ),
                      ],
                    ),
                    child: ElevatedButton.icon(
                      onPressed: onStartCall,
                      icon: const Icon(Icons.call_rounded, size: 19, color: Colors.white),
                      label: const Text(
                        'Start Voice Call Now',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.2,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                    ),
                  )
                : OutlinedButton.icon(
                    onPressed: null,
                    icon: const Icon(Icons.notifications_none_rounded, size: 18),
                    label: const Text('Currently Offline'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _HostFilterCard extends StatelessWidget {
  const _HostFilterCard({
    required this.filters,
    required this.selectedFilter,
    required this.onFilterSelected,
  });

  final List<String> filters;
  final int selectedFilter;
  final ValueChanged<int> onFilterSelected;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E4ED)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: FriendooUiColors.softBlue,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.translate_rounded,
                  color: FriendooUiColors.blue,
                  size: 16,
                ),
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Select conversation language',
                  style: TextStyle(
                    color: FriendooUiColors.ink,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              Text(
                '${filters.length} Available',
                style: const TextStyle(
                  color: FriendooUiColors.muted,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 36,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: filters.length,
              separatorBuilder: (_, _) => const SizedBox(width: 7),
              itemBuilder: (context, index) {
                final isSelected = selectedFilter == index;
                return ChoiceChip(
                  label: Text(filters[index]),
                  selected: isSelected,
                  showCheckmark: false,
                  onSelected: (_) => onFilterSelected(index),
                  selectedColor: FriendooUiColors.ink,
                  backgroundColor: FriendooUiColors.canvas,
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : FriendooUiColors.ink,
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                  ),
                  side: BorderSide(
                    color: isSelected
                        ? FriendooUiColors.ink
                        : const Color(0xFFE2E4ED),
                    width: 1.2,
                  ),
                  shape: const StadiumBorder(),
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _HostLanguagePill extends StatelessWidget {
  const _HostLanguagePill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: FriendooUiColors.softViolet,
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: const Color(0xFFDDD6FE)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Color(0xFF6B21A8),
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _HostCountPill extends StatelessWidget {
  const _HostCountPill({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: const Color(0xFFA7F3D0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.circle_rounded, color: Color(0xFF10B981), size: 8),
          const SizedBox(width: 6),
          Text(
            '$count ON AIR',
            style: const TextStyle(
              color: Color(0xFF065F46),
              fontSize: 11,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _TrendCard extends StatelessWidget {
  const _TrendCard({required this.values});

  final List<double> values;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final labels = List.generate(
      7,
      (index) => _weekdayLabel(
        DateTime(
          now.year,
          now.month,
          now.day,
        ).subtract(Duration(days: 6 - index)),
      ),
    );

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color(0xFFE2E4ED)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Daily Coin Spend Trend', style: _CardTitle()),
                  SizedBox(height: 4),
                  Text('Past 7-day activity visualizer', style: _FriendooMuted()),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [FriendooUiColors.violet, FriendooUiColors.pink],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.show_chart_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          SizedBox(
            height: 150,
            width: double.infinity,
            child: CustomPaint(painter: _FriendooChartPainter(values: values)),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: labels
                .map(
                  (label) => Text(
                    label,
                    style: const TextStyle(
                      color: FriendooUiColors.muted,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _FriendooChartPainter extends CustomPainter {
  const _FriendooChartPainter({required this.values});

  final List<double> values;

  @override
  void paint(Canvas canvas, Size size) {
    final gridPaint = Paint()
      ..color = const Color(0xFFF1F2F6)
      ..strokeWidth = 1;
    for (var index = 0; index < 4; index++) {
      final y = size.height * index / 3;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    final maximum = values.fold<double>(
      0,
      (current, value) => math.max(current, value).toDouble(),
    );
    final maxValue = math.max(maximum, 1).toDouble();
    final points = <Offset>[];
    for (var index = 0; index < values.length; index++) {
      final x = values.length == 1
          ? size.width / 2
          : size.width * index / (values.length - 1);
      final y =
          size.height - (values[index] / maxValue) * (size.height - 12) - 6;
      points.add(Offset(x, y));
    }

    if (points.isEmpty) return;

    final linePath = Path()..moveTo(points.first.dx, points.first.dy);
    for (var index = 1; index < points.length; index++) {
      linePath.lineTo(points[index].dx, points[index].dy);
    }

    final areaPath = Path.from(linePath)
      ..lineTo(points.last.dx, size.height)
      ..lineTo(points.first.dx, size.height)
      ..close();

    final areaPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0x506366F1), Color(0x30FF2A85), Color(0x0000D2E0)],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(Offset.zero & size);
    canvas.drawPath(areaPath, areaPaint);

    final linePaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFF6366F1), Color(0xFFFF2A85)],
      ).createShader(Offset.zero & size)
      ..strokeWidth = 3.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(linePath, linePaint);

    final pointPaint = Paint()..color = Colors.white;
    final pointBorder = Paint()
      ..color = const Color(0xFF6366F1)
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;
    for (final point in points) {
      canvas.drawCircle(point, 5, pointPaint);
      canvas.drawCircle(point, 5, pointBorder);
    }
  }

  @override
  bool shouldRepaint(covariant _FriendooChartPainter oldDelegate) =>
      oldDelegate.values != values;
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.tint,
    this.iconColor,
    this.wide = false,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color tint;
  final Color? iconColor;
  final bool wide;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E4ED)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(11),
            decoration: BoxDecoration(
              color: tint,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: iconColor ?? FriendooUiColors.ink, size: 21),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const _FriendooMuted()),
                const SizedBox(height: 3),
                Text(value, style: const _CardValue()),
              ],
            ),
          ),
          if (wide)
            const Icon(
              Icons.arrow_outward_rounded,
              color: FriendooUiColors.muted,
              size: 18,
            ),
        ],
      ),
    );
  }
}

class _ActivityTile extends StatelessWidget {
  const _ActivityTile({required this.call});

  final CallHistoryItem call;

  @override
  Widget build(BuildContext context) {
    final initial = call.otherPartyName.isEmpty
        ? '?'
        : call.otherPartyName.substring(0, 1).toUpperCase();
    final isCompleted = call.status == 'ended';
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E4ED)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: isCompleted
                ? FriendooUiColors.softBlue
                : FriendooUiColors.softPink,
            child: Text(
              initial,
              style: TextStyle(
                color: isCompleted ? FriendooUiColors.blue : FriendooUiColors.pink,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(call.otherPartyName, style: const _CardTitle()),
                const SizedBox(height: 3),
                Text(
                  '${call.durationMinutes} min  ·  ${call.totalCoins} coins  ·  ${call.status}',
                  style: const _FriendooMuted(),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.phone_in_talk_rounded,
            color: FriendooUiColors.blue,
            size: 18,
          ),
        ],
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.transaction});

  final WalletTransactionItem transaction;

  @override
  Widget build(BuildContext context) {
    final isCredit = transaction.coinAmount >= 0;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E4ED)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              color: isCredit
                  ? const Color(0xFFECFDF5)
                  : FriendooUiColors.softPink,
              borderRadius: BorderRadius.circular(13),
            ),
            child: Icon(
              isCredit ? Icons.south_west_rounded : Icons.north_east_rounded,
              color: isCredit
                  ? const Color(0xFF10B981)
                  : FriendooUiColors.pink,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              transaction.description ??
                  (isCredit ? 'Coins added to vault' : 'Voice call spend'),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: FriendooUiColors.ink,
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Text(
            '${isCredit ? '+' : ''}${transaction.coinAmount}',
            style: TextStyle(
              color: isCredit
                  ? const Color(0xFF10B981)
                  : FriendooUiColors.pink,
              fontSize: 15,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _CoinPackCard extends StatelessWidget {
  const _CoinPackCard({
    required this.package,
    required this.featured,
    required this.onTap,
  });

  final CoinPackage package;
  final bool featured;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final minutes = (package.coins / 5).round();
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: featured ? FriendooUiColors.violet : const Color(0xFFE2E4ED),
            width: featured ? 2.0 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: featured
                  ? const Color(0x248B5CF6)
                  : Colors.black.withOpacity(0.03),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: featured
                        ? FriendooUiColors.softViolet
                        : FriendooUiColors.softGold,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.monetization_on_rounded,
                    color: Color(0xFFD97706),
                    size: 20,
                  ),
                ),
                if (featured)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [FriendooUiColors.violet, FriendooUiColors.pink],
                      ),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      '🔥 POPULAR',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 14),
            Text('${package.coins} coins', style: const _CardValue()),
            const SizedBox(height: 4),
            Text('~$minutes mins audio talk', style: const _FriendooMuted()),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: onTap,
                style: FilledButton.styleFrom(
                  backgroundColor: featured ? FriendooUiColors.violet : FriendooUiColors.ink,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Text('₹${package.amountInr}'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileHero extends StatelessWidget {
  const _ProfileHero({
    required this.name,
    required this.phone,
    required this.isHost,
    required this.totalCalls,
  });

  final String name;
  final String phone;
  final bool isHost;
  final int totalCalls;

  @override
  Widget build(BuildContext context) {
    final initial = name.isEmpty ? '?' : name.substring(0, 1).toUpperCase();
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0E1020), Color(0xFF1E1B4B)],
        ),
        borderRadius: BorderRadius.circular(26),
        boxShadow: const [
          BoxShadow(
            color: Color(0x301E1B4B),
            blurRadius: 24,
            offset: Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [FriendooUiColors.violet, FriendooUiColors.pink],
              ),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                initial,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _maskPhone(phone),
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  children: [
                    _DarkPill(label: isHost ? '★ Host' : '✦ Verified Member'),
                    _DarkPill(label: '$totalCalls Calls'),
                  ],
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: Colors.white54),
        ],
      ),
    );
  }
}

class _ProgressCard extends StatelessWidget {
  const _ProgressCard({
    required this.completedCalls,
    required this.coinBalance,
  });

  final int completedCalls;
  final int coinBalance;

  @override
  Widget build(BuildContext context) {
    final progress = (completedCalls / 5).clamp(0.0, 1.0).toDouble();
    final nextGoal = completedCalls < 5 ? 5 : completedCalls + 5;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E4ED)),
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Conversation Milestones', style: _CardTitle()),
                  SizedBox(height: 3),
                  Text(
                    'Unlock achievement badges with calls',
                    style: _FriendooMuted(),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: FriendooUiColors.softGold,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$coinBalance Coins',
                  style: const TextStyle(
                    color: Color(0xFFB45309),
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(99),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 10,
              backgroundColor: const Color(0xFFF1F2F6),
              color: FriendooUiColors.violet,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '$completedCalls of $nextGoal calls toward your next badge level',
            style: const _FriendooMuted(),
          ),
        ],
      ),
    );
  }
}

class _BadgeSpec {
  const _BadgeSpec({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
}

const _badgeSpecs = [
  _BadgeSpec(
    title: 'First Hello ✦',
    subtitle: 'Complete your first live conversation',
    icon: Icons.waving_hand_rounded,
    color: FriendooUiColors.softAqua,
  ),
  _BadgeSpec(
    title: 'Good Listener 🎧',
    subtitle: 'Complete 5 live conversations',
    icon: Icons.hearing_rounded,
    color: FriendooUiColors.softBlue,
  ),
  _BadgeSpec(
    title: 'Lounge Regular 👑',
    subtitle: 'Complete 10+ conversations or hold 1,000+ coins',
    icon: Icons.auto_awesome_rounded,
    color: FriendooUiColors.softPink,
  ),
];

class _BadgeTile extends StatelessWidget {
  const _BadgeTile({required this.badge, required this.earned});

  final _BadgeSpec badge;
  final bool earned;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: earned ? Colors.white : const Color(0xFFFAFAFD),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: earned ? FriendooUiColors.violet.withOpacity(0.3) : const Color(0xFFE2E4ED),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(11),
            decoration: BoxDecoration(
              color: earned ? badge.color : const Color(0xFFF1F2F6),
              borderRadius: BorderRadius.circular(15),
            ),
            child: Icon(
              earned ? badge.icon : Icons.lock_outline_rounded,
              color: earned ? FriendooUiColors.ink : FriendooUiColors.muted,
              size: 21,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(badge.title, style: const _CardTitle()),
                const SizedBox(height: 3),
                Text(badge.subtitle, style: const _FriendooMuted()),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: earned ? const Color(0xFFECFDF5) : const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              earned ? 'UNLOCKED' : 'LOCKED',
              style: TextStyle(
                color: earned ? const Color(0xFF047857) : FriendooUiColors.muted,
                fontSize: 10,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E4ED)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: FriendooUiColors.softBlue,
                borderRadius: BorderRadius.circular(13),
              ),
              child: Icon(icon, color: FriendooUiColors.blue, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const _CardTitle()),
                  const SizedBox(height: 3),
                  Text(subtitle, style: const _FriendooMuted()),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: FriendooUiColors.muted,
            ),
          ],
        ),
      ),
    );
  }
}

// UI Maximalism: 3D Quick Action Card with Floating Badge
class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.badge,
    required this.gradient,
    required this.tint,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String badge;
  final LinearGradient gradient;
  final Color tint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.fromLTRB(10, 14, 10, 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFE2E4ED)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.035),
              blurRadius: 14,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: gradient,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: gradient.colors.first.withOpacity(0.35),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Icon(icon, color: Colors.white, size: 22),
            ),
            const SizedBox(height: 9),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: FriendooUiColors.ink,
                fontSize: 12,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              badge,
              style: const TextStyle(
                color: FriendooUiColors.muted,
                fontSize: 9,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) =>
      Text(title, style: const _SectionTitle());
}

class _UiIconButton extends StatelessWidget {
  const _UiIconButton({
    required this.icon,
    required this.tooltip,
    required this.onPressed,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: tooltip,
      onPressed: onPressed,
      icon: Icon(icon, size: 20),
      style: IconButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: FriendooUiColors.ink,
        fixedSize: const Size(46, 46),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        side: const BorderSide(color: Color(0xFFE2E4ED)),
      ),
    );
  }
}

class _UiCard extends StatelessWidget {
  const _UiCard({
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.color = Colors.white,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E4ED)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _EmptySurface extends StatelessWidget {
  const _EmptySurface({
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return _UiCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: const BoxDecoration(
              color: FriendooUiColors.softBlue,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: FriendooUiColors.blue, size: 26),
          ),
          const SizedBox(height: 14),
          Text(title, textAlign: TextAlign.center, style: const _CardTitle()),
          const SizedBox(height: 6),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const _FriendooMuted(),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 16),
            FilledButton(
              onPressed: onAction,
              style: FilledButton.styleFrom(
                backgroundColor: FriendooUiColors.ink,
                foregroundColor: Colors.white,
                shape: const StadiumBorder(),
              ),
              child: Text(actionLabel!),
            ),
          ],
        ],
      ),
    );
  }
}

class _LoadingSurface extends StatelessWidget {
  const _LoadingSurface();

  @override
  Widget build(BuildContext context) {
    return const _UiCard(
      padding: EdgeInsets.all(36),
      child: Center(
        child: SizedBox.square(
          dimension: 24,
          child: CircularProgressIndicator(strokeWidth: 2.5),
        ),
      ),
    );
  }
}

class _TrustCard extends StatelessWidget {
  const _TrustCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE0F9FD), Color(0xFFEDE9FE)],
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFBAE6FD)),
      ),
      child: const Row(
        children: [
          Icon(Icons.verified_user_rounded, color: Color(0xFF0284C7), size: 24),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              '100% Anonymous Voice · Encrypted WebRTC · Verified Hosts',
              style: TextStyle(
                color: Color(0xFF0C4A6E),
                fontSize: 12,
                height: 1.35,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OfferCard extends StatelessWidget {
  const _OfferCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E1B4B), Color(0xFF4338CA), Color(0xFFFF2A85)],
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(
            color: Color(0x306366F1),
            blurRadius: 18,
            offset: Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: const Row(
        children: [
          Icon(
            Icons.card_giftcard_rounded,
            color: Color(0xFFFFD166),
            size: 26,
          ),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'FIRST RECHARGE BONUS ✦',
                  style: TextStyle(
                    color: Color(0xFFFFD166),
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                    letterSpacing: 0.5,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'Get 50% extra talk coins on your first recharge.',
                  style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SecurityFooter extends StatelessWidget {
  const _SecurityFooter();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.lock_rounded, color: Color(0xFF10B981), size: 15),
        const SizedBox(width: 6),
        Text(
          'Secure 256-bit SSL checkout powered by Cashfree',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: FriendooUiColors.muted,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _WalletFilter extends StatelessWidget {
  const _WalletFilter({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: FriendooUiColors.ink,
      backgroundColor: Colors.white,
      side: BorderSide(
        color: selected ? FriendooUiColors.ink : const Color(0xFFE2E4ED),
      ),
      shape: const StadiumBorder(),
      labelStyle: TextStyle(
        color: selected ? Colors.white : FriendooUiColors.ink,
        fontSize: 12,
        fontWeight: FontWeight.w900,
      ),
    );
  }
}

class _Orb extends StatelessWidget {
  const _Orb({required this.size, required this.colors});

  final double size;
  final List<Color> colors;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(colors: colors),
      ),
    );
  }
}

class _DarkPill extends StatelessWidget {
  const _DarkPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _FriendooTitle extends TextStyle {
  const _FriendooTitle()
    : super(
        color: FriendooUiColors.ink,
        fontSize: 28,
        height: 1.05,
        fontWeight: FontWeight.w900,
        letterSpacing: -0.9,
      );
}

class _SectionTitle extends TextStyle {
  const _SectionTitle()
    : super(
        color: FriendooUiColors.ink,
        fontSize: 18,
        fontWeight: FontWeight.w900,
        letterSpacing: -0.2,
      );
}

class _CardTitle extends TextStyle {
  const _CardTitle()
    : super(
        color: FriendooUiColors.ink,
        fontSize: 15,
        fontWeight: FontWeight.w900,
      );
}

class _CardValue extends TextStyle {
  const _CardValue()
    : super(
        color: FriendooUiColors.ink,
        fontSize: 20,
        fontWeight: FontWeight.w900,
        letterSpacing: -0.4,
      );
}

class _FriendooEyebrow extends TextStyle {
  const _FriendooEyebrow()
    : super(
        color: FriendooUiColors.muted,
        fontSize: 12,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.3,
      );
}

class _FriendooMuted extends TextStyle {
  const _FriendooMuted()
    : super(
        color: FriendooUiColors.muted,
        fontSize: 12,
        height: 1.35,
        fontWeight: FontWeight.w600,
      );
}

List<double> _lastSevenDaySpend(List<CallHistoryItem> calls) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  return List.generate(7, (index) {
    final date = today.subtract(Duration(days: 6 - index));
    return calls
        .where((call) {
          final local = call.createdAt.toLocal();
          final callDate = DateTime(local.year, local.month, local.day);
          return callDate == date;
        })
        .fold<double>(0, (total, call) => total + call.totalCoins);
  });
}

String _weekdayLabel(DateTime date) {
  const labels = ['', 'M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return labels[date.weekday];
}

String _maskPhone(String phone) {
  if (phone.length < 8) return phone;
  return '${phone.substring(0, 3)}••••${phone.substring(phone.length - 3)}';
}

Set<String> _earnedBadges(int completedCalls, int coinBalance) {
  final earned = <String>{};
  if (completedCalls >= 1) earned.add('First Hello ✦');
  if (completedCalls >= 5) earned.add('Good Listener 🎧');
  if (completedCalls >= 10 || coinBalance >= 1000) earned.add('Lounge Regular 👑');
  return earned;
}
