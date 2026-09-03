import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../supabase/supabase_provider.dart';

/// Service that monitors network connectivity across Web, Android, and iOS.
class ConnectivityService {
  ConnectivityService(this._client) {
    _init();
  }

  final SupabaseClient _client;
  final _controller = StreamController<bool>.broadcast();
  Timer? _pollingTimer;
  bool _isOnline = true;
  bool _initialized = false;

  bool get isOnline => _isOnline;
  Stream<bool> get onConnectivityChanged => _controller.stream;

  void _init() {
    if (_initialized) return;
    _initialized = true;
    _checkNow();
    _pollingTimer = Timer.periodic(const Duration(seconds: 6), (_) {
      _checkNow();
    });
  }

  /// Probes network reachability using fast, lightweight checks.
  Future<bool> checkConnectivity() async {
    return _checkNow();
  }

  Future<bool> _checkNow() async {
    bool reachable = false;

    if (kIsWeb) {
      try {
        final res = await _client
            .from('profiles')
            .select('id')
            .limit(1)
            .timeout(const Duration(seconds: 3));
        reachable = res != null;
      } catch (e) {
        final errStr = e.toString().toLowerCase();
        if (errStr.contains('socketexception') ||
            errStr.contains('failed to fetch') ||
            errStr.contains('clientexception') ||
            errStr.contains('networkerror') ||
            errStr.contains('timeout')) {
          reachable = false;
        } else {
          reachable = true;
        }
      }
    } else {
      try {
        final result = await InternetAddress.lookup('google.com')
            .timeout(const Duration(seconds: 3));
        if (result.isNotEmpty && result[0].rawAddress.isNotEmpty) {
          reachable = true;
        }
      } on SocketException catch (_) {
        reachable = false;
      } on TimeoutException catch (_) {
        reachable = false;
      } catch (_) {
        reachable = false;
      }
    }

    if (_isOnline != reachable) {
      _isOnline = reachable;
      _controller.add(_isOnline);
    }

    return _isOnline;
  }

  void dispose() {
    _pollingTimer?.cancel();
    _controller.close();
  }
}

final connectivityServiceProvider = Provider<ConnectivityService>((ref) {
  final client = ref.watch(supabaseProvider);
  final service = ConnectivityService(client);
  ref.onDispose(service.dispose);
  return service;
});

final isOnlineProvider = StreamProvider<bool>((ref) {
  final service = ref.watch(connectivityServiceProvider);
  return Stream<bool>.multi((controller) {
    controller.add(service.isOnline);
    final sub = service.onConnectivityChanged.listen(controller.add);
    controller.onCancel = () => sub.cancel();
  });
});
