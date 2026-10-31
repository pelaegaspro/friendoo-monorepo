import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/friendoo_models.dart';
import '../../../core/supabase/supabase_provider.dart';
import '../../profile/data/profile_repository.dart';
import '../../profile/data/blocked_callers_service.dart';
import '../../wallet/data/wallet_repository.dart';

final hostRepositoryProvider = Provider<HostRepository>(
  (ref) => HostRepository(ref.watch(supabaseProvider)),
);

final selectedRegionalLanguageProvider = StateProvider<String>(
  (ref) => 'Tamil',
); // Default to Tamil as requested

final hostDashboardStatsProvider = FutureProvider<HostDashboardStats>((ref) {
  // Watch walletStreamProvider so any incoming wallet credit immediately invalidates and pushes fresh stats
  ref.watch(walletStreamProvider);
  final repo = ref.watch(hostRepositoryProvider);
  return repo.fetchHostDashboardStats();
});

class HostRepository {
  const HostRepository(this._client);

  final SupabaseClient _client;

  /// Applies the 3/10 Star Host rule (Top 30% ranked hosts are marked as Star Hosts):
  /// e.g. 10 hosts -> 3 star hosts, 20 hosts -> 6 star hosts, 30 hosts -> 9 star hosts.
  /// Applies the Star Host appointment rule:
  /// 1. Appointed based on reviews (rating) and call attended time: (rating * 1000) + totalCalls.
  /// 2. Top 10 hosts across all languages.
  /// 3. Strict guarantee: Every regional language represented in list has at least 1 Star Host.
  /// 4. Star Hosts: Caller pays 7 coins/min (ratePerAudioMinute = 7). Host payout: 4.00/min.
  /// 5. Standard Hosts: Caller pays 5 coins/min (ratePerAudioMinute = 5). Host payout: 2.50/min.
  static List<HostProfile> applyStarHostQuota(List<HostProfile> list) {
    if (list.isEmpty) return list;

    final sorted = List<HostProfile>.from(list)
      ..sort((a, b) {
        final scoreA = (a.rating * 1000) + a.totalCalls;
        final scoreB = (b.rating * 1000) + b.totalCalls;
        return scoreB.compareTo(scoreA);
      });

    final Set<String> starIds = {};

    // 1. Language Guarantee: Every unique regional language gets at least 1 Star Host
    final Set<String> allLanguages = {};
    for (final host in sorted) {
      for (final lang in host.languages) {
        final norm = lang.trim().toLowerCase();
        if (norm.isNotEmpty && norm != 'english') {
          allLanguages.add(norm);
        }
      }
    }

    for (final lang in allLanguages) {
      final bestHostForLang = sorted.firstWhere(
        (h) => h.languages.any((l) => l.trim().toLowerCase() == lang),
        orElse: () => sorted.first,
      );
      starIds.add(bestHostForLang.id);
    }

    // 2. Fill up to top 10 from overall highest scored hosts
    final int maxStarHosts = math.min(10, sorted.length);
    for (final host in sorted) {
      if (starIds.length >= maxStarHosts) break;
      starIds.add(host.id);
    }

    return list.map((host) {
      final isStar = starIds.contains(host.id);
      return host.copyWith(
        isStar: isStar,
        ratePerAudioMinute: isStar ? HostProfile.starHostRate : HostProfile.standardHostRate,
        vipTier: isStar ? HostVipTier.star : (host.vipTier == HostVipTier.star ? HostVipTier.silver : host.vipTier),
      );
    }).toList();
  }

  static String _languageCodeToName(String code) {
    switch (code.toLowerCase()) {
      case 'ta':
        return 'Tamil';
      case 'te':
        return 'Telugu';
      case 'ml':
        return 'Malayalam';
      case 'kn':
        return 'Kannada';
      case 'hi':
        return 'Hindi';
      case 'bn':
        return 'Bengali';
      case 'mr':
        return 'Marathi';
      case 'gu':
        return 'Gujarati';
      case 'pa':
        return 'Punjabi';
      case 'or':
        return 'Odia';
      default:
        return code;
    }
  }

  /// 10 Curated Indian Mockup Hosts covering Regional Languages, Availability (Online, Busy, Offline), and Ratings
  static const List<HostProfile> defaultMockupHosts = [
    HostProfile(
      id: '11111111-0000-4000-8000-000000000001',
      displayName: 'Priya Sharma',
      bio: 'Sweet conversations & late night laughs. Let\'s talk about movies & life! 🌸',
      ratePerAudioMinute: 7,
      isAvailable: true,
      isStar: true,
      status: HostStatus.online,
      languages: ['Tamil', 'Hindi'],
      gender: 'female',
      rating: 4.95,
      totalCalls: 340,
      city: 'Chennai',
      age: 23,
    ),
    HostProfile(
      id: '11111111-0000-4000-8000-000000000002',
      displayName: 'Ananya Iyer',
      bio: 'RJ & college student. Love listening and sharing chill stories ☕',
      ratePerAudioMinute: 7,
      isAvailable: true,
      isStar: true,
      status: HostStatus.online,
      languages: ['Tamil', 'Malayalam'],
      gender: 'female',
      rating: 4.90,
      totalCalls: 280,
      city: 'Coimbatore',
      age: 22,
    ),
    HostProfile(
      id: '11111111-0000-4000-8000-000000000003',
      displayName: 'Meera Nair',
      bio: 'Singer & coffee lover. Feeling lonely? I am just one call away! 🎶',
      ratePerAudioMinute: 7,
      isAvailable: true,
      isStar: true,
      status: HostStatus.online,
      languages: ['Malayalam', 'Tamil'],
      gender: 'female',
      rating: 4.88,
      totalCalls: 215,
      city: 'Kochi',
      age: 24,
    ),
    HostProfile(
      id: '11111111-0000-4000-8000-000000000004',
      displayName: 'Kavya Reddy',
      bio: 'Soft spoken friend to brighten your day. Talk about anything freely 💫',
      ratePerAudioMinute: 7,
      isAvailable: true,
      isStar: true,
      status: HostStatus.online,
      languages: ['Telugu', 'Hindi'],
      gender: 'female',
      rating: 4.85,
      totalCalls: 190,
      city: 'Hyderabad',
      age: 23,
    ),
    HostProfile(
      id: '11111111-0000-4000-8000-000000000005',
      displayName: 'Sneha Patel',
      bio: 'Techie by day, warm companion by evening. Let\'s connect! ✨',
      ratePerAudioMinute: 7,
      isAvailable: true,
      isStar: true,
      status: HostStatus.online,
      languages: ['Kannada', 'Hindi'],
      gender: 'female',
      rating: 4.82,
      totalCalls: 165,
      city: 'Bengaluru',
      age: 25,
    ),
    HostProfile(
      id: '11111111-0000-4000-8000-000000000006',
      displayName: 'Pooja Hegde',
      bio: 'Friendly and upbeat chatter. Here to make you smile! 🌻',
      ratePerAudioMinute: 5,
      isAvailable: true,
      isStar: false,
      status: HostStatus.online,
      languages: ['Kannada', 'Telugu'],
      gender: 'female',
      rating: 4.80,
      totalCalls: 140,
      city: 'Mangaluru',
      age: 22,
    ),
    HostProfile(
      id: '11111111-0000-4000-8000-000000000007',
      displayName: 'Rhea Sen',
      bio: 'Currently speaking with a caller. Tap favorite to catch me next! 📞',
      ratePerAudioMinute: 7,
      isAvailable: true,
      isStar: true,
      status: HostStatus.busy,
      languages: ['Tamil', 'Bengali'],
      gender: 'female',
      rating: 4.92,
      totalCalls: 310,
      city: 'Madurai',
      age: 24,
    ),
    HostProfile(
      id: '11111111-0000-4000-8000-000000000008',
      displayName: 'Divya Menon',
      bio: 'On a call right now. Your friendly listener will be back shortly! 💛',
      ratePerAudioMinute: 5,
      isAvailable: true,
      isStar: false,
      status: HostStatus.busy,
      languages: ['Malayalam', 'Tamil'],
      gender: 'female',
      rating: 4.86,
      totalCalls: 225,
      city: 'Thrissur',
      age: 23,
    ),
    HostProfile(
      id: '11111111-0000-4000-8000-000000000009',
      displayName: 'Tanvi Joshi',
      bio: 'Offline for now. Leave a favorite to know when I am back online 🌙',
      ratePerAudioMinute: 7,
      isAvailable: false,
      isStar: true,
      status: HostStatus.offline,
      languages: ['Marathi', 'Hindi'],
      gender: 'female',
      rating: 4.78,
      totalCalls: 115,
      city: 'Mumbai',
      age: 26,
    ),
    HostProfile(
      id: '11111111-0000-4000-8000-000000000010',
      displayName: 'Swathi Krishnan',
      bio: 'Back online tomorrow evening. Good night callers! 💤',
      ratePerAudioMinute: 5,
      isAvailable: false,
      isStar: false,
      status: HostStatus.offline,
      languages: ['Tamil', 'Telugu'],
      gender: 'female',
      rating: 4.75,
      totalCalls: 98,
      city: 'Tiruchirappalli',
      age: 22,
    ),
  ];

  Future<List<HostProfile>> fetchAvailableHosts() async {
    final List<HostProfile> hosts = [];
    try {
      final results = await Future.wait([
        _client
            .from('hosts')
            .select(
              'id, bio, rate_per_audio_minute, is_available, rating, total_ratings, is_star, profiles:profiles(display_name, avatar_path, city, avatar_seed), host_languages:host_languages(language_code)',
            )
            .timeout(
              const Duration(seconds: 4),
              onTimeout: () => <Map<String, dynamic>>[],
            ),
        _client
            .from('user_presence')
            .select('user_id, state, last_seen_at')
            .timeout(
              const Duration(seconds: 4),
              onTimeout: () => <Map<String, dynamic>>[],
            ),
      ]);

      final hostRows = results[0] as List<dynamic>;
      final presenceRows = results[1] as List<dynamic>;

      final Map<String, Map<String, dynamic>> presenceMap = {};
      final nowUtc = DateTime.now().toUtc();
      for (final p in presenceRows) {
        if (p is Map<String, dynamic> && p['user_id'] is String) {
          presenceMap[p['user_id'] as String] = p;
        }
      }

      for (final r in hostRows) {
        final map = Map<String, dynamic>.from(r as Map<String, dynamic>);
        final profiles = map['profiles'];
        if (profiles is Map<String, dynamic>) {
          map['display_name'] = profiles['display_name'] ?? 'Host';
          map['avatar_path'] = profiles['avatar_path'];
          map['city'] = profiles['city'];
          map['avatar_seed'] = profiles['avatar_seed'];
        } else if (profiles is List &&
            profiles.isNotEmpty &&
            profiles.first is Map) {
          final first = profiles.first as Map;
          map['display_name'] = first['display_name'] ?? 'Host';
          map['avatar_path'] = first['avatar_path'];
          map['city'] = first['city'];
          map['avatar_seed'] = first['avatar_seed'];
        }

        final hLangs = map['host_languages'];
        final List<String> parsedLangs = [];
        if (hLangs is List) {
          for (final l in hLangs) {
            if (l is Map && l['language_code'] != null) {
              final code = l['language_code'].toString().toLowerCase().trim();
              parsedLangs.add(_languageCodeToName(code));
            }
          }
        }
        if (parsedLangs.isNotEmpty) {
          map['languages'] = parsedLangs;
        }

        final hostId = map['id'] as String?;
        final presence = hostId != null ? presenceMap[hostId] : null;
        final hostConfiguredAvailable = (map['is_available'] as bool?) ?? false;

        bool isCurrentlyOnline = false;
        bool isCurrentlyBusy = false;

        final state = presence?['state'] as String?;
        if (state == 'busy' || state == 'in_call') {
          isCurrentlyBusy = true;
          isCurrentlyOnline = true;
        } else if (state == 'online') {
          isCurrentlyOnline = true;
        } else if (state == 'offline') {
          isCurrentlyOnline = false;
        } else {
          isCurrentlyOnline = hostConfiguredAvailable;
        }

        map['is_available'] = isCurrentlyOnline;
        map['is_busy'] = isCurrentlyBusy;

        hosts.add(HostProfile.fromMap(map));
      }
    } catch (error) {
      if (kDebugMode) {
        debugPrint('fetchAvailableHosts notice: $error');
      }
    }

    // Ensure all 10 curated mockup hosts are present even if backend is offline/incomplete
    final existingNames = hosts.map((h) => h.displayName.toLowerCase().trim()).toSet();
    for (final mock in defaultMockupHosts) {
      if (!existingNames.contains(mock.displayName.toLowerCase().trim())) {
        hosts.add(mock);
      }
    }

    final activeProfile = ProfileRepository.currentActiveProfile;
    final currentUserId = activeProfile?.id ?? _client.auth.currentUser?.id;
    // If a host has blocked this user, she will NOT appear in the user screen even when online
    final visibleHosts = hosts.where((h) =>
      !BlockedCallersService.isHostBlockedForUser(hostId: h.id, userId: currentUserId)
    ).toList();

    // Sort so:
    // 1. Online & ready hosts appear first (Green)
    // 2. Busy hosts appear next (Yellow)
    // 3. Offline hosts appear after (Grey), sorted by rating
    visibleHosts.sort((a, b) {
      final aPriority = (a.isAvailable && a.status != HostStatus.busy)
          ? 0
          : (a.status == HostStatus.busy ? 1 : 2);
      final bPriority = (b.isAvailable && b.status != HostStatus.busy)
          ? 0
          : (b.status == HostStatus.busy ? 1 : 2);
      if (aPriority != bPriority) {
        return aPriority.compareTo(bPriority);
      }
      return b.rating.compareTo(a.rating);
    });

    return applyStarHostQuota(visibleHosts);
  }

  Future<void> updateCurrentHostLanguages(List<String> languages) async {
    final activeProfile = ProfileRepository.currentActiveProfile;
    final userId = activeProfile?.id ?? _client.auth.currentUser?.id;
    if (userId == null) return;
    final normalized = languages
        .map((language) => language.trim())
        .where(
          (language) =>
              language.isNotEmpty && language.toLowerCase() != 'english',
        )
        .toSet()
        .toList();
    if (normalized.isEmpty) return;

    if (activeProfile?.isHost != true) {
      throw StateError('Only approved hosts can update host languages.');
    }

    await _client.rpc(
      'update_own_host_languages',
      params: {'p_languages': normalized},
    );
  }

  Future<HostDashboardStats> fetchHostDashboardStats() async {
    final activeProfile = ProfileRepository.currentActiveProfile;
    final userId = activeProfile?.id ?? _client.auth.currentUser?.id;
    if (userId == null) {
      return const HostDashboardStats(
        todayEarningsInr: 0,
        todayCallsCount: 0,
        isOnline: false,
        ratePerMinute: 5,
      );
    }

    try {
      final hostRow = await _client
          .from('hosts')
          .select('rate_per_audio_minute, is_available, rating')
          .eq('id', userId)
          .maybeSingle();

      final isOnline = (hostRow?['is_available'] as bool?) ?? false;
      final rate = (hostRow?['rate_per_audio_minute'] as num?)?.toInt() ?? 5;
      final hostRating = (hostRow?['rating'] as num?)?.toDouble() ?? 5.0;

      final now = DateTime.now().toUtc();
      final startOfDay = DateTime.utc(now.year, now.month, now.day);
      final startOfWeek = now.subtract(const Duration(days: 7));
      final startOfMonth = DateTime.utc(now.year, now.month, 1);

      final calls = await _client
          .from('calls')
          .select(
            'total_coins_deducted, created_at, status, started_at, ended_at',
          )
          .eq('host_id', userId)
          .eq('status', 'ended');

      var todayCoins = 0;
      var todayCount = 0;
      var weekCoins = 0;
      var monthCoins = 0;
      var totalCoins = 0;
      var totalDurationSeconds = 0;
      final totalCallsList = (calls as List<dynamic>);
      final totalCallsCount = totalCallsList.length;

      final List<double> weeklyTrend = List.filled(7, 0.0);
      final List<double> monthlyTrend = List.filled(4, 0.0);
      final List<double> threeMonthTrend = List.filled(3, 0.0);

      for (final c in totalCallsList) {
        final coins = (c['total_coins_deducted'] as num?)?.toInt() ?? 0;
        final hostCut = (coins * 0.6).round().toDouble();
        final createdAt =
            DateTime.tryParse(c['created_at']?.toString() ?? '') ?? now;
        totalCoins += coins;

        final startedAt = DateTime.tryParse(c['started_at']?.toString() ?? '');
        final endedAt = DateTime.tryParse(c['ended_at']?.toString() ?? '');
        if (startedAt != null &&
            endedAt != null &&
            endedAt.isAfter(startedAt)) {
          totalDurationSeconds += endedAt.difference(startedAt).inSeconds;
        } else if (coins > 0 && rate > 0) {
          totalDurationSeconds += ((coins / rate) * 60).round();
        }

        if (createdAt.isAfter(startOfDay)) {
          todayCoins += coins;
          todayCount++;
        }
        if (createdAt.isAfter(startOfWeek)) {
          weekCoins += coins;
        }
        if (createdAt.isAfter(startOfMonth)) {
          monthCoins += coins;
        }

        // 7D trend: days ago (0..6, where 6 is today)
        final daysAgo = now.difference(createdAt).inDays;
        if (daysAgo >= 0 && daysAgo < 7) {
          final idx = 6 - daysAgo;
          weeklyTrend[idx] += hostCut;
        }

        // 30D trend: 4 weekly buckets (where 3 is current week)
        final weeksAgo = (daysAgo / 7).floor();
        if (weeksAgo >= 0 && weeksAgo < 4) {
          final idx = 3 - weeksAgo;
          monthlyTrend[idx] += hostCut;
        }

        // 90D trend: 3 monthly buckets (where 2 is current month)
        final monthsAgo = (daysAgo / 30).floor();
        if (monthsAgo >= 0 && monthsAgo < 3) {
          final idx = 2 - monthsAgo;
          threeMonthTrend[idx] += hostCut;
        }
      }

      final todayEarningsInr = (todayCoins * 0.6).round();
      final totalEarningsInr = (totalCoins * 0.6).round();
      final thisWeekEarningsInr = (weekCoins * 0.6).round();
      final thisMonthEarningsInr = (monthCoins * 0.6).round();

      int liveHostWalletInr = totalEarningsInr;
      try {
        final walletRow = await _client
            .from('wallets')
            .select('coin_balance')
            .eq('user_id', userId)
            .maybeSingle();
        if (walletRow != null && walletRow['coin_balance'] is num) {
          liveHostWalletInr = (walletRow['coin_balance'] as num).toInt();
        }
      } catch (_) {}

      String avgDurationFormatted = '0m 00s';
      if (totalCallsCount > 0 && totalDurationSeconds > 0) {
        final avgSecs = (totalDurationSeconds / totalCallsCount).round();
        final mins = avgSecs ~/ 60;
        final secs = avgSecs % 60;
        avgDurationFormatted = '${mins}m ${secs.toString().padLeft(2, '0')}s';
      }

      final displayEarningsInr = liveHostWalletInr > totalEarningsInr
          ? liveHostWalletInr
          : totalEarningsInr;

      return HostDashboardStats(
        todayEarningsInr: todayEarningsInr,
        todayCallsCount: todayCount,
        isOnline: isOnline,
        ratePerMinute: rate,
        totalEarningsInr: displayEarningsInr,
        availableToWithdrawInr: liveHostWalletInr,
        thisWeekEarningsInr: thisWeekEarningsInr,
        thisMonthEarningsInr: thisMonthEarningsInr,
        totalCallsCount: totalCallsCount,
        voiceCallsEarningsInr: displayEarningsInr,
        bonusesEarningsInr: 0,
        referralsEarningsInr: 0,
        avgDurationFormatted: avgDurationFormatted,
        rating: hostRating,
        weeklyTrend: weeklyTrend,
        monthlyTrend: monthlyTrend,
        threeMonthTrend: threeMonthTrend,
      );
    } catch (_) {
      return const HostDashboardStats(
        todayEarningsInr: 0,
        todayCallsCount: 0,
        isOnline: false,
        ratePerMinute: 5,
      );
    }
  }

  /// Checks if current Indian Standard Time (IST) is within Peak Surge Hours (8 PM - 12 AM)
  static bool get isPeakSurgeHour {
    final nowUtc = DateTime.now().toUtc();
    final ist = nowUtc.add(const Duration(hours: 5, minutes: 30));
    return ist.hour >= 20 || ist.hour < 1;
  }

  /// First-Call Guarantee Smart Match: Picks the highest rated available host
  /// matching the user's preferred language in under 5 seconds.
  Future<HostProfile?> findSmartMatchHost({String? preferredLanguage}) async {
    final hosts = await fetchAvailableHosts();
    if (hosts.isEmpty) return null;

    if (preferredLanguage != null &&
        preferredLanguage.isNotEmpty &&
        preferredLanguage != 'All') {
      final matching = hosts
          .where(
            (h) => h.languages.any(
              (l) =>
                  l.toLowerCase().trim() ==
                  preferredLanguage.toLowerCase().trim(),
            ),
          )
          .toList();
      if (matching.isNotEmpty) {
        matching.sort((a, b) => b.rating.compareTo(a.rating));
        return matching.first;
      }
    }

    final sorted = List<HostProfile>.from(hosts)
      ..sort((a, b) => b.rating.compareTo(a.rating));
    return sorted.first;
  }

  Future<void> setHostAvailability(bool isAvailable) async {
    final activeProfile = ProfileRepository.currentActiveProfile;
    final userId = activeProfile?.id ?? _client.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return;

    try {
      await _client.rpc(
        'set_own_host_availability',
        params: {'p_is_available': isAvailable, 'p_host_id': userId},
      );
    } catch (_) {}
  }
}
