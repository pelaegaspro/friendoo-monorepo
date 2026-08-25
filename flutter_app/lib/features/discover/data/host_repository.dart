import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/friendoo_models.dart';
import '../../../core/supabase/supabase_provider.dart';
import '../../profile/data/profile_repository.dart';

final hostRepositoryProvider = Provider<HostRepository>(
  (ref) => HostRepository(ref.watch(supabaseProvider)),
);

final selectedRegionalLanguageProvider = StateProvider<String>(
  (ref) => 'Tamil',
); // Default to Tamil as requested

final hostDashboardStatsProvider = FutureProvider<HostDashboardStats>((ref) {
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
      final rows = await _client
          .from('hosts')
          .select(
            'id, bio, rate_per_audio_minute, is_available, is_star, gender, languages',
          )
          .eq('is_available', true);

      final hostRows = rows as List<dynamic>;
      for (final r in hostRows) {
        final map = Map<String, dynamic>.from(r as Map<String, dynamic>);
        final id = map['id']?.toString() ?? '';

        String displayName = 'Host';
        String? avatarPath;
        try {
          final pRow = await _client
              .from('profiles')
              .select('display_name, avatar_path')
              .eq('id', id)
              .maybeSingle();
          if (pRow != null) {
            displayName = pRow['display_name']?.toString() ?? 'Host';
            avatarPath = pRow['avatar_path']?.toString();
          }
        } catch (_) {}
        map['display_name'] = displayName;
        map['avatar_path'] = avatarPath;
        hosts.add(HostProfile.fromMap(map));
      }
    } catch (_) {}

    // Check if test host 7604 is explicitly offline in database
    bool is7604ExplicitlyOffline = false;
    try {
      final hostRow = await _client
          .from('hosts')
          .select('is_available')
          .eq('id', '00000000-0000-0000-0000-007604991136')
          .maybeSingle();
      if (hostRow != null && hostRow['is_available'] == false) {
        is7604ExplicitlyOffline = true;
      }
    } catch (_) {}

    final has7604Host = hosts.any(
      (h) =>
          h.id == '00000000-0000-0000-0000-007604991136' ||
          h.displayName.toLowerCase().contains('testing host') ||
          h.displayName.contains('7604991136'),
    );

    if (!is7604ExplicitlyOffline && !has7604Host) {
      hosts.add(
        const HostProfile(
          id: '00000000-0000-0000-0000-007604991136',
          displayName: 'Testing Host',
          bio: 'Verified Friendoo Host · Live & Ready for Audio Calls',
          ratePerAudioMinute: 5,
          isAvailable: true,
          isStar: true,
          languages: ['Tamil', 'Hindi', 'English'],
          gender: 'female',
          rating: 5.0,
          totalCalls: 120,
          age: 24,
          city: 'Chennai, Tamil Nadu',
        ),
      );
    } else if (is7604ExplicitlyOffline) {
      hosts.removeWhere(
        (h) =>
            h.id == '00000000-0000-0000-0000-007604991136' ||
            h.displayName.toLowerCase().contains('testing host'),
      );
    }

    return applyStarHostQuota(hosts);
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

    await _client
        .from('hosts')
        .update({'languages': normalized})
        .eq('id', userId);
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
          .select('rate_per_audio_minute, is_available')
          .eq('id', userId)
          .maybeSingle();

      final isOnline = (hostRow?['is_available'] as bool?) ?? false;
      final rate = (hostRow?['rate_per_audio_minute'] as num?)?.toInt() ?? 5;

      final now = DateTime.now().toUtc();
      final startOfDay = DateTime.utc(now.year, now.month, now.day);
      final startOfWeek = now.subtract(const Duration(days: 7));
      final startOfMonth = DateTime.utc(now.year, now.month, 1);

      final calls = await _client
          .from('calls')
          .select('total_coins_deducted, created_at, status')
          .eq('host_id', userId)
          .eq('status', 'ended');

      var todayCoins = 0;
      var todayCount = 0;
      var weekCoins = 0;
      var monthCoins = 0;
      var totalCoins = 0;
      final totalCallsList = (calls as List<dynamic>);
      final totalCallsCount = totalCallsList.length;

      for (final c in totalCallsList) {
        final coins = (c['total_coins_deducted'] as num?)?.toInt() ?? 0;
        final createdAt =
            DateTime.tryParse(c['created_at']?.toString() ?? '') ?? now;
        totalCoins += coins;

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
      }

      final todayEarningsInr = (todayCoins * 0.6).round();
      final totalEarningsInr = (totalCoins * 0.6).round();
      final thisWeekEarningsInr = (weekCoins * 0.6).round();
      final thisMonthEarningsInr = (monthCoins * 0.6).round();

      return HostDashboardStats(
        todayEarningsInr: todayEarningsInr,
        todayCallsCount: todayCount,
        isOnline: isOnline,
        ratePerMinute: rate,
        totalEarningsInr: totalEarningsInr,
        availableToWithdrawInr: totalEarningsInr,
        thisWeekEarningsInr: thisWeekEarningsInr,
        thisMonthEarningsInr: thisMonthEarningsInr,
        totalCallsCount: totalCallsCount,
        voiceCallsEarningsInr: totalEarningsInr,
        bonusesEarningsInr: 0,
        referralsEarningsInr: 0,
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
    final userId =
        activeProfile?.id ??
        _client.auth.currentUser?.id ??
        '00000000-0000-0000-0000-007604991136';

    final nowIso = DateTime.now().toUtc().toIso8601String();

    try {
      await _client.from('hosts').upsert({
        'id': userId,
        'is_available': isAvailable,
        'rate_per_audio_minute': 5,
        'gender': 'female',
        'is_star': true,
        'languages': ['Tamil', 'Hindi', 'English'],
        'last_seen_at': nowIso,
        'updated_at': nowIso,
      }, onConflict: 'id');
    } catch (_) {}
  }
}
