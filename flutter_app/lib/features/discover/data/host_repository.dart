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
  static List<HostProfile> applyStarHostQuota(List<HostProfile> list) {
    if (list.isEmpty) return list;

    final sorted = List<HostProfile>.from(list)
      ..sort((a, b) {
        final scoreA = (a.rating * 1000) + a.totalCalls;
        final scoreB = (b.rating * 1000) + b.totalCalls;
        return scoreB.compareTo(scoreA);
      });

    final starQuota = (sorted.length * 0.3).ceil().clamp(1, sorted.length);
    final Set<String> starIds = sorted.take(starQuota).map((h) => h.id).toSet();

    return list.map((host) {
      final isStar = starIds.contains(host.id);
      return host.copyWith(
        isStar: isStar,
        vipTier: isStar ? HostVipTier.star : host.vipTier,
      );
    }).toList();
  }

  Future<List<HostProfile>> fetchAvailableHosts() async {
    final List<HostProfile> hosts = [];
    try {
      final results = await Future.wait([
        _client
            .from('hosts')
            .select(
              'id, bio, rate_per_audio_minute, is_available, profiles:profiles(display_name, avatar_path)',
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
        } else if (profiles is List &&
            profiles.isNotEmpty &&
            profiles.first is Map) {
          final first = profiles.first as Map;
          map['display_name'] = first['display_name'] ?? 'Host';
          map['avatar_path'] = first['avatar_path'];
        }

        final hostId = map['id'] as String?;
        final presence = hostId != null ? presenceMap[hostId] : null;
        final hostConfiguredAvailable = (map['is_available'] as bool?) ?? false;

        bool isCurrentlyOnline = false;
        bool isCurrentlyBusy = false;

        if (hostConfiguredAvailable && presence != null) {
          final state = presence['state'] as String?;
          final lastSeenStr = presence['last_seen_at'] as String?;
          final lastSeen = lastSeenStr != null
              ? DateTime.tryParse(lastSeenStr)
              : null;
          // Presence heartbeat is written every 6-20 seconds. If older than 45s, host is offline.
          final isRecent =
              lastSeen != null &&
              nowUtc.difference(lastSeen.toUtc()).inSeconds.abs() <= 45;

          if (isRecent) {
            if (state == 'online') {
              isCurrentlyOnline = true;
            } else if (state == 'busy' || state == 'in_call') {
              isCurrentlyBusy = true;
            }
          }
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

    final activeProfile = ProfileRepository.currentActiveProfile;
    final currentUserId = activeProfile?.id ?? _client.auth.currentUser?.id;
    // If a host has blocked this user, she will NOT appear in the user screen even when online
    final visibleHosts = hosts.where((h) =>
      !BlockedCallersService.isHostBlockedForUser(hostId: h.id, userId: currentUserId)
    ).toList();

        // Sort so:
    // 1. Online & ready hosts appear first
    // 2. Busy hosts appear next
    // 3. Offline hosts appear after, sorted by rating
    visibleHosts.sort((a, b) {
      final aPriority = (a.isAvailable && !a.isBusy) ? 0 : (a.isBusy ? 1 : 2);
      final bPriority = (b.isAvailable && !b.isBusy) ? 0 : (b.isBusy ? 1 : 2);
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
