import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/supabase/supabase_provider.dart';
import '../../discover/data/host_repository.dart';
import '../../profile/data/profile_repository.dart';

class HostCallGuardState {
  const HostCallGuardState({
    required this.dateKey,
    required this.skippedToday,
    required this.isOnline,
    this.maxAllowedSkips = 5,
  });

  final String dateKey;
  final int skippedToday;
  final bool isOnline;
  final int maxAllowedSkips;

  bool get canSkip => skippedToday < maxAllowedSkips;
  bool get mustAutoAttend => isOnline && skippedToday >= maxAllowedSkips;
  int get remainingSkips =>
      (maxAllowedSkips - skippedToday).clamp(0, maxAllowedSkips);

  HostCallGuardState copyWith({
    String? dateKey,
    int? skippedToday,
    bool? isOnline,
    int? maxAllowedSkips,
  }) {
    return HostCallGuardState(
      dateKey: dateKey ?? this.dateKey,
      skippedToday: skippedToday ?? this.skippedToday,
      isOnline: isOnline ?? this.isOnline,
      maxAllowedSkips: maxAllowedSkips ?? this.maxAllowedSkips,
    );
  }
}

final hostCallGuardProvider =
    NotifierProvider<HostCallGuardNotifier, HostCallGuardState>(
      HostCallGuardNotifier.new,
    );

class HostCallGuardNotifier extends Notifier<HostCallGuardState> {
  static String _currentDateKey() {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }

  @override
  HostCallGuardState build() {
    final activeProfile = ProfileRepository.currentActiveProfile;
    final isHostRole = activeProfile?.isHost == true;

    final initial = HostCallGuardState(
      dateKey: _currentDateKey(),
      skippedToday: 0,
      isOnline: isHostRole, // initialize online if user is a host
      maxAllowedSkips: 5,
    );
    _seedOnlineStatusFromDb();
    return initial;
  }

  /// Fetches the host's actual availability from the database and updates
  /// local state. Called once on startup to resolve the real online status.
  Future<void> _seedOnlineStatusFromDb() async {
    try {
      final client = ref.read(supabaseProvider);
      final activeProfile = ProfileRepository.currentActiveProfile;
      final userId = activeProfile?.id ?? client.auth.currentUser?.id;
      if (userId == null || userId.isEmpty) return;

      final row = await client
          .from('hosts')
          .select('is_available')
          .eq('id', userId)
          .maybeSingle();

      if (row != null) {
        final dbAvailable = (row['is_available'] as bool?) ?? true;
        state = state.copyWith(isOnline: dbAvailable);
        if (kDebugMode) {
          debugPrint('HostCallGuard: seeded isOnline=$dbAvailable from DB');
        }
      }
    } catch (_) {}
  }

  void _ensureToday() {
    final today = _currentDateKey();
    if (state.dateKey != today) {
      state = state.copyWith(dateKey: today, skippedToday: 0);
    }
  }

  int get skippedCount {
    _ensureToday();
    return state.skippedToday;
  }

  void recordSkip() {
    _ensureToday();
    final newCount = state.skippedToday + 1;
    state = state.copyWith(skippedToday: newCount);
    if (kDebugMode) {
      debugPrint(
        'Host skipped call today: $newCount / ${state.maxAllowedSkips}',
      );
    }
  }

  Future<void> setOnlineStatus(bool isOnline) async {
    state = state.copyWith(isOnline: isOnline);
    try {
      await ref.read(hostRepositoryProvider).setHostAvailability(isOnline);
    } catch (_) {}
  }
}

/// Global background availability check & synchronization service
class BackgroundAvailabilityChecker {
  BackgroundAvailabilityChecker(this._ref);

  final Ref _ref;
  Timer? _checkerTimer;
  bool _running = false;

  void start() {
    if (_running) return;
    _running = true;

    // Check availability and presence every 15 seconds across the full app
    _checkerTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      _verifyAvailability();
    });

    _verifyAvailability();
  }

  void stop() {
    _running = false;
    _checkerTimer?.cancel();
    _checkerTimer = null;
  }

  Future<void> _verifyAvailability() async {
    final activeProfile = ProfileRepository.currentActiveProfile;
    final isHostUser = activeProfile?.isHost == true;

    // NEVER overwrite host availability if this device is logged in as a normal user!
    if (!isHostUser) return;

    final client = _ref.read(supabaseProvider);
    final userId = activeProfile?.id ?? client.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return;

    try {
      final guard = _ref.read(hostCallGuardProvider);

      // Verify host state in database
      final hostRow = await client
          .from('hosts')
          .select('is_available')
          .eq('id', userId)
          .maybeSingle();

      if (hostRow != null) {
        final dbAvailable = (hostRow['is_available'] as bool?) ?? false;

        // Synchronize local guard with DB if mismatch
        if (dbAvailable != guard.isOnline) {
          await client.from('hosts').upsert({
            'id': userId,
            'is_available': guard.isOnline,
            'updated_at': DateTime.now().toUtc().toIso8601String(),
          }, onConflict: 'id');
        }
      }
    } catch (_) {
      // Fail-safe handling for network glitches
    }
  }
}

final backgroundAvailabilityCheckerProvider =
    Provider<BackgroundAvailabilityChecker>((ref) {
      final checker = BackgroundAvailabilityChecker(ref);
      checker.start();
      ref.onDispose(checker.stop);
      return checker;
    });
