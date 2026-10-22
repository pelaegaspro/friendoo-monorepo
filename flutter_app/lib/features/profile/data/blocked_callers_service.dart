import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class BlockedCallerItem {
  const BlockedCallerItem({
    required this.callerId,
    required this.name,
    required this.date,
    this.city = 'India',
    this.reason = 'Blocked by host',
  });

  final String callerId;
  final String name;
  final String date;
  final String city;
  final String reason;

  Map<String, String> toMap() => {
    'callerId': callerId,
    'name': name,
    'date': date,
    'city': city,
    'reason': reason,
  };

  factory BlockedCallerItem.fromMap(Map<String, dynamic> map) => BlockedCallerItem(
    callerId: map['callerId']?.toString() ?? map['caller_id']?.toString() ?? '',
    name: map['name']?.toString() ?? map['caller_name']?.toString() ?? 'Caller',
    date: map['date']?.toString() ?? map['created_at']?.toString() ?? 'Recently',
    city: map['city']?.toString() ?? 'India',
    reason: map['reason']?.toString() ?? 'Blocked by host',
  );
}

class BlockedCallersService {
  BlockedCallersService._();

  static final Map<String, List<BlockedCallerItem>> _hostBlockedMap = {};
  static final Set<String> _blockedPairs = {}; // "${hostId}_${callerId}"
  static bool _initialized = false;
  static final ValueNotifier<int> revision = ValueNotifier<int>(0);

  /// Initialize and hydrate blocklist cache from SharedPreferences
  static Future<void> initialize() async {
    if (_initialized) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().where((k) => k.startsWith('host_blocked_callers_'));
      for (final key in keys) {
        final hostId = key.replaceFirst('host_blocked_callers_', '');
        final jsonStr = prefs.getString(key);
        if (jsonStr != null && jsonStr.isNotEmpty) {
          final decoded = jsonDecode(jsonStr);
          if (decoded is List) {
            final items = decoded
                .map((e) => BlockedCallerItem.fromMap(Map<String, dynamic>.from(e as Map)))
                .toList();
            _hostBlockedMap[hostId] = items;
            for (final item in items) {
              _blockedPairs.add('${hostId}_${item.callerId}');
              _blockedPairs.add('${hostId}_${item.name.toLowerCase().trim()}');
            }
          }
        }
      }
      _initialized = true;
      revision.value++;
    } catch (e) {
      debugPrint('BlockedCallersService init notice: $e');
    }
  }

  /// Returns true if the host has blocked this user/caller.
  /// When true, this host will NOT appear on the user's screen even if online.
  static bool isHostBlockedForUser({required String hostId, required String? userId}) {
    if (userId == null || userId.isEmpty) return false;
    final pairKey = '${hostId}_$userId';
    if (_blockedPairs.contains(pairKey)) return true;
    final nameKey = '${hostId}_${userId.toLowerCase().trim()}';
    if (_blockedPairs.contains(nameKey)) return true;
    return false;
  }

  /// Get list of blocked callers for a specific host
  static Future<List<BlockedCallerItem>> getBlockedCallersForHost(String hostId) async {
    await initialize();
    final cached = _hostBlockedMap[hostId];
    if (cached != null) return List.unmodifiable(cached);

    // Try fetching from Supabase if table exists
    try {
      final response = await Supabase.instance.client
          .from('host_blocked_callers')
          .select()
          .eq('host_id', hostId)
          .timeout(const Duration(seconds: 3));
      final rows = response as List<dynamic>;
      final items = rows
          .map((r) => BlockedCallerItem.fromMap(Map<String, dynamic>.from(r as Map)))
          .toList();
      _hostBlockedMap[hostId] = items;
      for (final item in items) {
        _blockedPairs.add('${hostId}_${item.callerId}');
        _blockedPairs.add('${hostId}_${item.name.toLowerCase().trim()}');
      }
      revision.value++;
      return items;
    } catch (_) {
      // Fallback to empty list
      _hostBlockedMap[hostId] = [];
      return const [];
    }
  }

  /// Host blocks a caller. The host will instantly stop appearing on caller's screen.
  static Future<void> blockCaller({
    required String hostId,
    required String callerId,
    required String callerName,
    String city = 'India',
    String reason = 'Blocked by host',
  }) async {
    await initialize();
    final nowFormatted = '${DateTime.now().day} ${_monthName(DateTime.now().month)} ${DateTime.now().year}';
    final newItem = BlockedCallerItem(
      callerId: callerId,
      name: callerName,
      date: nowFormatted,
      city: city,
      reason: reason,
    );

    final list = _hostBlockedMap.putIfAbsent(hostId, () => []);
    list.removeWhere((item) => item.callerId == callerId || item.name.toLowerCase() == callerName.toLowerCase());
    list.insert(0, newItem);

    _blockedPairs.add('${hostId}_$callerId');
    _blockedPairs.add('${hostId}_${callerName.toLowerCase().trim()}');

    // Save to SharedPreferences
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonList = list.map((e) => e.toMap()).toList();
      await prefs.setString('host_blocked_callers_$hostId', jsonEncode(jsonList));
    } catch (e) {
      debugPrint('Error saving blocked caller to prefs: $e');
    }

    // Try saving to Supabase
    try {
      await Supabase.instance.client.from('host_blocked_callers').upsert({
        'host_id': hostId,
        'caller_id': callerId,
        'caller_name': callerName,
        'reason': reason,
      });
    } catch (_) {
      // Offline or table not migrated yet
    }

    revision.value++;
  }

  /// Host unblocks a caller
  static Future<void> unblockCaller({
    required String hostId,
    required String callerId,
  }) async {
    await initialize();
    final list = _hostBlockedMap[hostId];
    if (list != null) {
      list.removeWhere((item) => item.callerId == callerId);
      _blockedPairs.remove('${hostId}_$callerId');
    }

    // Update SharedPreferences
    try {
      final prefs = await SharedPreferences.getInstance();
      if (list != null && list.isNotEmpty) {
        final jsonList = list.map((e) => e.toMap()).toList();
        await prefs.setString('host_blocked_callers_$hostId', jsonEncode(jsonList));
      } else {
        await prefs.remove('host_blocked_callers_$hostId');
      }
    } catch (e) {
      debugPrint('Error removing blocked caller from prefs: $e');
    }

    // Try removing from Supabase
    try {
      await Supabase.instance.client
          .from('host_blocked_callers')
          .delete()
          .eq('host_id', hostId)
          .eq('caller_id', callerId);
    } catch (_) {
      // Ignore
    }

    revision.value++;
  }

  static String _monthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[(month - 1).clamp(0, 11)];
  }
}

