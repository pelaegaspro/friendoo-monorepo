import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../profile/data/profile_repository.dart';

class PresenceService with WidgetsBindingObserver {
  PresenceService(this._client);

  final SupabaseClient _client;
  Timer? _heartbeatTimer;
  bool _started = false;

  Future<void> start() async {
    if (_started) return;
    _started = true;
    WidgetsBinding.instance.addObserver(this);
    await _setPresence('online');
    _heartbeatTimer = Timer.periodic(
      const Duration(seconds: 6),
      (_) => unawaited(_setPresence('online')),
    );
  }

  Future<void> stop() async {
    if (!_started) return;
    _started = false;
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    WidgetsBinding.instance.removeObserver(this);
    await _setPresence('offline');
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.resumed:
        if (_started) {
          _heartbeatTimer ??= Timer.periodic(
            const Duration(seconds: 6),
            (_) => unawaited(_setPresence('online')),
          );
          unawaited(_setPresence('online'));
        }
        return;
      case AppLifecycleState.inactive:
      case AppLifecycleState.paused:
      case AppLifecycleState.detached:
      case AppLifecycleState.hidden:
        _heartbeatTimer?.cancel();
        _heartbeatTimer = null;
        unawaited(_setPresence('offline'));
        return;
    }
  }

  Future<void> _setPresence(String state) async {
    final activeProfile = ProfileRepository.currentActiveProfile;
    final userId = activeProfile?.id ?? _client.auth.currentUser?.id;
    if (userId == null) return;

    final isOnline = state == 'online';
    final nowIso = DateTime.now().toUtc().toIso8601String();

    try {
      await _client.from('user_presence').upsert({
        'user_id': userId,
        'state': state,
        'last_seen_at': nowIso,
      }, onConflict: 'user_id');
    } catch (_) {}

    // If this device belongs to a host, update host availability separately.
    final isHost = activeProfile?.isHost == true;

    if (isHost) {
      try {
        await _client.rpc(
          'set_own_host_availability',
          params: {'p_is_available': isOnline},
        );
      } catch (_) {}
    }
  }
}
