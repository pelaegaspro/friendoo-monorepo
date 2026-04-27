import 'package:cached_network_image/cached_network_image.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/host_model.dart';
import '../../../services/analytics_service.dart';
import '../providers/host_provider.dart';
import '../utils/host_filters.dart';
import '../../auth/providers/auth_provider.dart';
import '../../profile/widgets/profile_drawer.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});
  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  String _selectedAge = 'All';
  String _selectedLanguage = 'All';
  bool _onlineOnly = false;
  HostSortOption _selectedSort = HostSortOption.onlineFirst;

  static const _prefAgeKey = 'home_filter_age';
  static const _prefLanguageKey = 'home_filter_language';
  static const _prefOnlineOnlyKey = 'home_filter_online_only';
  static const _prefSortKey = 'home_filter_sort';

  HostFilterCriteria get _criteria => HostFilterCriteria(
        age: _selectedAge,
        language: _selectedLanguage,
        onlineOnly: _onlineOnly,
        sort: _selectedSort,
      );

  bool get _hasActiveFilter => _criteria.hasActiveFilter;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ));
    AppAnalyticsService.logHomeView();
    _loadFilterPreferences();
  }

  Future<void> _loadFilterPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _selectedAge = prefs.getString(_prefAgeKey) ?? allFilterValue;
      _selectedLanguage = prefs.getString(_prefLanguageKey) ?? allFilterValue;
      _onlineOnly = prefs.getBool(_prefOnlineOnlyKey) ?? false;
      _selectedSort = HostSortOption.fromName(prefs.getString(_prefSortKey));
    });
  }

  Future<void> _saveFilterPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    await Future.wait([
      prefs.setString(_prefAgeKey, _selectedAge),
      prefs.setString(_prefLanguageKey, _selectedLanguage),
      prefs.setBool(_prefOnlineOnlyKey, _onlineOnly),
      prefs.setString(_prefSortKey, _selectedSort.name),
    ]);
  }

  Future<void> _refreshHosts(HostFilterCriteria criteria) async {
    ref.invalidate(hostsProvider(criteria));
    try {
      await ref.read(hostsProvider(criteria).future);
    } catch (_) {
      // Error UI below handles failures after refresh.
    }
  }

  void _showFilterSheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF12121A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            void updateFilters(VoidCallback update) {
              setSheetState(update);
              setState(() {});
              _saveFilterPreferences();
            }

            return Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFF2A2A3A),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Filters',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          updateFilters(() {
                            _selectedAge = 'All';
                            _selectedLanguage = 'All';
                            _onlineOnly = false;
                            _selectedSort = HostSortOption.onlineFirst;
                          });
                        },
                        child: const Text(
                          'Clear All',
                          style: TextStyle(color: Color(0xFF7C4DFF)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Online Only',
                        style: TextStyle(color: Colors.white, fontSize: 15),
                      ),
                      Switch(
                        value: _onlineOnly,
                        activeThumbColor: const Color(0xFF7C4DFF),
                        onChanged: (val) {
                          updateFilters(() => _onlineOnly = val);
                        },
                      ),
                    ],
                  ),
                  const Divider(color: Color(0xFF2A2A3A), height: 32),
                  const Text(
                    'Age Group',
                    style: TextStyle(
                      color: Color(0xFF9E9E9E),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: ['All', '18-25', '25-35', '35+'].map((age) {
                      final selected = _selectedAge == age;
                      return GestureDetector(
                        onTap: () {
                          updateFilters(() => _selectedAge = age);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: selected
                                ? const Color(0xFF7C4DFF)
                                : const Color(0xFF1A1A27),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: selected
                                  ? const Color(0xFF7C4DFF)
                                  : const Color(0xFF2A2A3A),
                            ),
                          ),
                          child: Text(
                            age,
                            style: TextStyle(
                              color: selected
                                  ? Colors.white
                                  : const Color(0xFF9E9E9E),
                              fontSize: 13,
                              fontWeight: selected
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const Divider(color: Color(0xFF2A2A3A), height: 32),
                  const Text(
                    'Language',
                    style: TextStyle(
                      color: Color(0xFF9E9E9E),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      'All',
                      'Hindi',
                      'Tamil',
                      'Telugu',
                      'Kannada',
                      'Malayalam',
                      'English',
                      'Bengali',
                    ].map((lang) {
                      final selected = _selectedLanguage == lang;
                      return GestureDetector(
                        onTap: () {
                          updateFilters(() => _selectedLanguage = lang);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: selected
                                ? const Color(0xFF7C4DFF)
                                : const Color(0xFF1A1A27),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: selected
                                  ? const Color(0xFF7C4DFF)
                                  : const Color(0xFF2A2A3A),
                            ),
                          ),
                          child: Text(
                            lang,
                            style: TextStyle(
                              color: selected
                                  ? Colors.white
                                  : const Color(0xFF9E9E9E),
                              fontSize: 13,
                              fontWeight: selected
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const Divider(color: Color(0xFF2A2A3A), height: 32),
                  const Text(
                    'Sort By',
                    style: TextStyle(
                      color: Color(0xFF9E9E9E),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: HostSortOption.values.map((sort) {
                      final selected = _selectedSort == sort;
                      return GestureDetector(
                        onTap: () => updateFilters(() => _selectedSort = sort),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: selected
                                ? const Color(0xFF7C4DFF)
                                : const Color(0xFF1A1A27),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: selected
                                  ? const Color(0xFF7C4DFF)
                                  : const Color(0xFF2A2A3A),
                            ),
                          ),
                          child: Text(
                            sort.label,
                            style: TextStyle(
                              color: selected
                                  ? Colors.white
                                  : const Color(0xFF9E9E9E),
                              fontSize: 13,
                              fontWeight: selected
                                  ? FontWeight.w600
                                  : FontWeight.normal,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF7C4DFF), Color(0xFFE040FB)],
                        ),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: const Text(
                          'Apply Filters',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final criteria = _criteria;
    final activeHostsProvider = hostsProvider(criteria);
    final hostsAsync = ref.watch(activeHostsProvider);
    final userCoinsAsync = ref.watch(userCoinsProvider);
    final phone = user?.phoneNumber ?? '';
    final initials = phone.length >= 2
        ? phone.substring(phone.length - 2)
        : phone.isNotEmpty
            ? phone
            : 'U';

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppColors.background,
      endDrawer: const ProfileDrawer(),
      body: SafeArea(
        child: Column(
          children: [
            // Top bar
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                children: [
                  Row(
                    children: [
                      ShaderMask(
                        shaderCallback: (bounds) =>
                            AppColors.purpleGradient.createShader(bounds),
                        child: const Text(
                          'Friendoo',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Coin chip
                  GestureDetector(
                    onTap: () => context.push('/wallet'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.divider),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.monetization_on,
                            color: AppColors.warning,
                            size: 16,
                          ),
                          const SizedBox(width: 5),
                          userCoinsAsync.when(
                            data: (c) => Text(
                              '$c',
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            loading: () => const SizedBox(
                                width: 20,
                                height: 12,
                                child: LinearProgressIndicator()),
                            error: (_, __) => const Text('--',
                                style: TextStyle(color: AppColors.textPrimary)),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: _showFilterSheet,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF12121A),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _hasActiveFilter
                              ? const Color(0xFF7C4DFF)
                              : const Color(0xFF2A2A3A),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.tune_rounded,
                            color: _hasActiveFilter
                                ? const Color(0xFF7C4DFF)
                                : Colors.white,
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Filter',
                            style: TextStyle(
                              color: _hasActiveFilter
                                  ? const Color(0xFF7C4DFF)
                                  : Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (_hasActiveFilter) ...[
                            const SizedBox(width: 4),
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: Color(0xFF7C4DFF),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  // Avatar
                  GestureDetector(
                    onTap: () => _scaffoldKey.currentState?.openEndDrawer(),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: AppColors.purpleGradient,
                        border: Border.all(color: AppColors.primary, width: 2),
                      ),
                      child: Center(
                        child: Text(
                          initials.toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            // Host grid
            Expanded(
              child: RefreshIndicator(
                color: AppColors.primary,
                backgroundColor: AppColors.card,
                onRefresh: () => _refreshHosts(criteria),
                child: hostsAsync.when(
                  data: (hosts) {
                    if (hosts.isEmpty) {
                      return _HomeEmptyState(
                        message: 'No hosts available right now',
                        detail: 'Try changing filters or refresh',
                      );
                    }
                    return GridView.builder(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(12, 4, 12, 16),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 0.66,
                      ),
                      itemCount: hosts.length,
                      itemBuilder: (_, i) => _HostCard(host: hosts[i]),
                    );
                  },
                  loading: () => GridView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(12, 4, 12, 16),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.66,
                    ),
                    itemCount: 6,
                    itemBuilder: (_, __) => const _HostCardSkeleton(),
                  ),
                  error: (e, _) => _HomeErrorState(
                    error: e,
                    onRetry: () => ref.invalidate(activeHostsProvider),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.card,
          border: Border(top: BorderSide(color: AppColors.divider)),
        ),
        child: BottomNavigationBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textSecondary,
          currentIndex: 0,
          onTap: (i) {
            if (i == 1) context.push('/wallet');
            if (i == 2) _scaffoldKey.currentState?.openEndDrawer();
          },
          items: const [
            BottomNavigationBarItem(
                icon: Icon(Icons.home_outlined),
                activeIcon: Icon(Icons.home),
                label: 'Home'),
            BottomNavigationBarItem(
                icon: Icon(Icons.account_balance_wallet_outlined),
                activeIcon: Icon(Icons.account_balance_wallet),
                label: 'Wallet'),
            BottomNavigationBarItem(
                icon: Icon(Icons.person_outline),
                activeIcon: Icon(Icons.person),
                label: 'Profile'),
          ],
        ),
      ),
    );
  }
}

class _HomeEmptyState extends StatelessWidget {
  final String message;
  final String detail;

  const _HomeEmptyState({
    required this.message,
    required this.detail,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(
          height: MediaQuery.of(context).size.height * 0.55,
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.people_outline,
                  size: 64,
                  color: AppColors.textSecondary.withValues(alpha: 0.4),
                ),
                const SizedBox(height: 16),
                Text(
                  message,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  detail,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _HomeErrorState extends StatelessWidget {
  final Object error;
  final VoidCallback onRetry;

  const _HomeErrorState({
    required this.error,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(
          height: MediaQuery.of(context).size.height * 0.55,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.wifi_off_rounded,
                    color: AppColors.error,
                    size: 48,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Could not load hosts',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '$error',
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: onRetry,
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _HostCard extends ConsumerWidget {
  final HostModel host;
  const _HostCard({required this.host});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rate = host.ratePerAudioMinute;
    final lang = host.languages.isNotEmpty ? host.languages.first : '';

    return GestureDetector(
      onTap: () {
        AppAnalyticsService.logHostProfileOpen(host);
        context.push('/host-profile/${host.uid}');
      },
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.divider),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Photo area
            Expanded(
              flex: 6,
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius:
                        const BorderRadius.vertical(top: Radius.circular(20)),
                    child: _HostPhoto(host: host),
                  ),
                  // Online dot
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: host.isOnline
                            ? AppColors.success
                            : AppColors.textSecondary,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.card, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Info
            Expanded(
              flex: 5,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            host.name,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const Icon(Icons.star,
                            color: Color(0xFFFFD740), size: 12),
                        const SizedBox(width: 2),
                        Text(
                          host.rating.toStringAsFixed(1),
                          style: const TextStyle(
                              color: AppColors.textSecondary, fontSize: 11),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '$lang - ${host.age}',
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 11),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '$rate coins/min',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(
                          Icons.call_rounded,
                          color: AppColors.textSecondary,
                          size: 11,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          _compactCount(host.totalCalls),
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 10,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Icon(
                          host.isVerified
                              ? Icons.verified_rounded
                              : Icons.bolt_rounded,
                          color: host.isVerified
                              ? AppColors.accent
                              : AppColors.textSecondary,
                          size: 11,
                        ),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text(
                            host.isVerified
                                ? 'Verified'
                                : '${host.responseTimeLabel} reply',
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 10,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    SizedBox(
                      width: double.infinity,
                      height: 28,
                      child: ElevatedButton(
                        onPressed: host.isOnline && !host.isOnCall
                            ? () => context.push('/host-profile/${host.uid}')
                            : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          disabledBackgroundColor: AppColors.divider,
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                          textStyle: const TextStyle(
                              fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                        child: Text(
                          host.isOnCall
                              ? 'Busy'
                              : host.isOnline
                                  ? 'Call Now'
                                  : 'Offline',
                          style: const TextStyle(fontSize: 11),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HostPhoto extends StatelessWidget {
  final HostModel host;

  const _HostPhoto({required this.host});

  @override
  Widget build(BuildContext context) {
    if (host.photoUrl.isEmpty) {
      return _HostInitial(host: host);
    }

    return CachedNetworkImage(
      imageUrl: host.photoUrl,
      width: double.infinity,
      height: double.infinity,
      fit: BoxFit.cover,
      placeholder: (_, __) => Container(color: AppColors.cardLight),
      errorWidget: (_, __, ___) => _HostInitial(host: host),
    );
  }
}

class _HostInitial extends StatelessWidget {
  final HostModel host;

  const _HostInitial({required this.host});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: AppColors.cardLight,
      child: Center(
        child: Text(
          host.name.isNotEmpty ? host.name[0].toUpperCase() : '?',
          style: const TextStyle(
            color: AppColors.primary,
            fontSize: 48,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}

String _compactCount(int value) {
  if (value >= 100000) return '${(value / 100000).toStringAsFixed(1)}L';
  if (value >= 1000) return '${(value / 1000).toStringAsFixed(1)}K';
  return '$value';
}

class _HostCardSkeleton extends StatelessWidget {
  const _HostCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        children: [
          Expanded(
            flex: 6,
            child: ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(20)),
              child: Container(color: AppColors.cardLight),
            ),
          ),
          Expanded(
            flex: 4,
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                      height: 12,
                      width: 80,
                      decoration: BoxDecoration(
                          color: AppColors.divider,
                          borderRadius: BorderRadius.circular(6))),
                  const SizedBox(height: 6),
                  Container(
                      height: 10,
                      width: 60,
                      decoration: BoxDecoration(
                          color: AppColors.divider,
                          borderRadius: BorderRadius.circular(6))),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
