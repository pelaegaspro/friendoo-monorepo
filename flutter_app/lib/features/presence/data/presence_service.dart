import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

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
      const Duration(seconds: 20),
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
            const Duration(seconds: 20),
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
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      await _client.from('user_presence').upsert({
        'user_id': userId,
        'state': state,
        'last_seen_at': DateTime.now().toUtc().toIso8601String(),
      }, onConflict: 'user_id');
    } catch (_) {
      // A transient network failure simply makes the host unavailable until
      // the next heartbeat. This is the desired fail-closed behavior.
    }
  }
}
