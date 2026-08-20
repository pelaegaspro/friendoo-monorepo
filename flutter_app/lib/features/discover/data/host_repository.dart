import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/friendoo_models.dart';
import '../../../core/supabase/supabase_provider.dart';

final hostRepositoryProvider = Provider<HostRepository>(
  (ref) => HostRepository(ref.watch(supabaseProvider)),
);

final selectedRegionalLanguageProvider = StateProvider<String>(
  (ref) => 'Tamil',
); // Default to Tamil as requested

final hostDashboardStatsProvider =
    FutureProvider.autoDispose<HostDashboardStats>((ref) {
      final repo = ref.watch(hostRepositoryProvider);
      return repo.fetchHostDashboardStats();
    });

class HostRepository {
  const HostRepository(this._client);

  final SupabaseClient _client;

  Future<List<HostProfile>> fetchAvailableHosts() async {
    try {
      final rows = await _client
          .from('hosts')
          .select(
            'id, bio, rate_per_audio_minute, is_available, is_star, gender, languages, profile:profiles!id(display_name)',
          )
          .eq('is_available', true);

      final hosts = (rows as List<dynamic>)
          .map((row) {
            final map = Map<String, dynamic>.from(row as Map<String, dynamic>);
            if (map['profile'] != null &&
                map['profile']['display_name'] != null) {
              map['display_name'] = map['profile']['display_name'];
            }
            return HostProfile.fromMap(map);
          })
          .where((host) => host.isFemale)
          .toList();

      if (hosts.isNotEmpty) return hosts;
    } catch (_) {
      try {
        final rows = await _client
            .from('hosts')
            .select(
              'id, display_name, bio, rate_per_audio_minute, is_available, is_star, gender, languages',
            )
            .eq('is_available', true);

        final hosts = (rows as List<dynamic>)
            .map((row) => HostProfile.fromMap(row as Map<String, dynamic>))
            .where((host) => host.isFemale)
            .toList();

        if (hosts.isNotEmpty) return hosts;
      } catch (_) {}
    }

    // Female-only fallback hosts across the supported regional languages and age brackets.
    return const [
      HostProfile(
        id: 'host_tamil_3',
        displayName: 'Ananya S',
        bio: 'Passionate about Carnatic melodies & friendly conversations.',
        ratePerAudioMinute: 5,
        isAvailable: true,
        isStar: true,
        languages: ['Tamil', 'English'],
        gender: 'female',
        rating: 5.0,
        totalCalls: 2400,
        age: 24,
        city: 'Chennai, Tamil Nadu',
      ),
      HostProfile(
        id: 'host_hindi_1',
        displayName: 'Priya Sharma',
        bio: 'Namaste! Great listener, bollywood fan & cheerful vibe curator.',
        ratePerAudioMinute: 5,
        isAvailable: true,
        isStar: true,
        languages: ['Hindi', 'English'],
        gender: 'female',
        rating: 4.9,
        totalCalls: 3100,
        age: 22,
        city: 'Mumbai, Maharashtra',
      ),
      HostProfile(
        id: 'host_tamil_1',
        displayName: 'Kavitha R',
        bio: 'Vanakkam! Love talking about Tamil cinema, life stories & career journeys.',
        ratePerAudioMinute: 5,
        isAvailable: true,
        isStar: true,
        languages: ['Tamil', 'English'],
        gender: 'female',
        rating: 4.9,
        totalCalls: 1850,
        age: 28,
        city: 'Coimbatore, Tamil Nadu',
      ),
      HostProfile(
        id: 'host_hindi_2',
        displayName: 'Ritu Varma',
        bio: 'Friendly evening coffee talks, poetry, literature & mindful listening.',
        ratePerAudioMinute: 5,
        isAvailable: true,
        isStar: false,
        languages: ['Hindi', 'Punjabi'],
        gender: 'female',
        rating: 4.8,
        totalCalls: 1200,
        age: 31,
        city: 'Delhi NCR',
      ),
      HostProfile(
        id: 'host_malayalam_1',
        displayName: 'Sneha Menon',
        bio: 'Namaskaram! Gentle conversations, book recommendations & cozy talks.',
        ratePerAudioMinute: 5,
        isAvailable: true,
        isStar: true,
        languages: ['Malayalam', 'English'],
        gender: 'female',
        rating: 4.9,
        totalCalls: 1500,
        age: 38,
        city: 'Kochi, Kerala',
      ),
      HostProfile(
        id: 'host_tamil_2',
        displayName: 'Meera Sundaram',
        bio: 'Experienced host, parenting talks, South Indian cuisine & warm support.',
        ratePerAudioMinute: 5,
        isAvailable: true,
        isStar: false,
        languages: ['Tamil', 'Telugu'],
        gender: 'female',
        rating: 4.9,
        totalCalls: 2100,
        age: 42,
        city: 'Madurai, Tamil Nadu',
      ),
      HostProfile(
        id: 'host_kannada_1',
        displayName: 'Deepa K',
        bio: 'Calm listener, traditional arts, wisdom sharing & peaceful evening chats.',
        ratePerAudioMinute: 5,
        isAvailable: true,
        isStar: false,
        languages: ['Kannada', 'English'],
        gender: 'female',
        rating: 4.8,
        totalCalls: 920,
        age: 48,
        city: 'Bengaluru, Karnataka',
      ),
      HostProfile(
        id: 'host_hindi_3',
        displayName: 'Shanti Devi',
        bio: 'Warm motherly guidance, folk stories & heartfelt uplifting conversations.',
        ratePerAudioMinute: 5,
        isAvailable: true,
        isStar: false,
        languages: ['Hindi', 'Bhojpuri'],
        gender: 'female',
        rating: 4.9,
        totalCalls: 1650,
        age: 52,
        city: 'Varanasi, Uttar Pradesh',
      ),
    ];
  }

  Future<void> updateCurrentHostLanguages(List<String> languages) async {
    final userId = _client.auth.currentUser?.id;
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

  /// Sorts hosts so that hosts speaking the user's preferred regional language
  /// appear FIRST (at the top), followed by hosts speaking other languages.
  /// Does NOT filter out non-matching hosts.
  List<HostProfile> prioritizeHostsByRegionalLanguage(
    List<HostProfile> hosts,
    String preferredLanguage,
  ) {
    if (preferredLanguage.isEmpty || preferredLanguage == 'All') {
      return List<HostProfile>.from(hosts);
    }

    final regionalMatches = <HostProfile>[];
    final otherLanguageHosts = <HostProfile>[];

    for (final host in hosts) {
      final speaksLanguage = host.languages.any(
        (l) => l.toLowerCase() == preferredLanguage.toLowerCase(),
      );
      if (speaksLanguage) {
        regionalMatches.add(host);
      } else {
        otherLanguageHosts.add(host);
      }
    }

    // Sort regional matches: Star hosts first, then highest rating
    regionalMatches.sort((a, b) {
      if (a.isStar != b.isStar) return b.isStar ? 1 : -1;
      return b.rating.compareTo(a.rating);
    });

    otherLanguageHosts.sort((a, b) {
      if (a.isStar != b.isStar) return b.isStar ? 1 : -1;
      return b.rating.compareTo(a.rating);
    });

    return [...regionalMatches, ...otherLanguageHosts];
  }

  Future<HostDashboardStats> fetchHostDashboardStats() async {
    final userId = _client.auth.currentUser?.id;
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

      final today = DateTime.now().toUtc();
      final startOfDay = DateTime.utc(
        today.year,
        today.month,
        today.day,
      ).toIso8601String();

      final calls = await _client
          .from('calls')
          .select('total_coins_deducted')
          .eq('host_id', userId)
          .gte('created_at', startOfDay);

      var totalCoins = 0;
      final count = calls.length;
      for (final c in calls) {
        totalCoins += (c['total_coins_deducted'] as num?)?.toInt() ?? 0;
      }

      final earningsInr = (totalCoins * 0.5).round();

      return HostDashboardStats(
        todayEarningsInr: earningsInr,
        todayCallsCount: count,
        isOnline: isOnline,
        ratePerMinute: rate,
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

  Future<void> setHostAvailability(bool isAvailable) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;

    await _client
        .from('hosts')
        .update({
          'is_available': isAvailable,
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', userId);
  }
}
