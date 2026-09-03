import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/friendoo_models.dart';
import '../../../core/supabase/supabase_provider.dart';
import '../../profile/data/profile_repository.dart';

final callRepositoryProvider = Provider<CallRepository>(
  (ref) => CallRepository(ref.watch(supabaseProvider)),
);

final callHistoryProvider = FutureProvider.autoDispose<List<CallHistoryItem>>((
  ref,
) {
  final repo = ref.watch(callRepositoryProvider);
  return repo.fetchCallHistory();
});

class CallRepository {
  const CallRepository(this._client);

  final SupabaseClient _client;

  Future<CallSession> initiateAudioCall(String hostId) async {
    if (_client.auth.currentSession == null) {
      throw Exception(
        'Please verify your phone number before starting a call.',
      );
    }

    final uuidRegex = RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    );
    if (!uuidRegex.hasMatch(hostId)) {
      throw Exception('The selected host is invalid.');
    }

    try {
      final response = await _client.functions.invoke(
        'call-initiate',
        body: {'host_id': hostId, 'call_type': 'audio'},
      );
      final data = response.data as Map<String, dynamic>;
      if (data['call'] != null) {
        return CallSession.fromMap(data['call'] as Map<String, dynamic>);
      }
      throw Exception('Call initiation returned no call.');
    } catch (e) {
      if (e is FunctionException) {
        final details = e.details;
        if (details is Map && details['error'] != null) {
          throw Exception('${details['error']}');
        }
      }
      throw Exception(
        'Unable to create the call on the server. '
        'Please check that the host is online and try again.',
      );
    }
  }

  Future<CallSession> acceptCall(String callId) async {
    if (_client.auth.currentSession == null) {
      throw Exception('Please sign in before accepting a call.');
    }

    try {
      final response = await _client.functions.invoke(
        'call-accept',
        body: {'call_id': callId},
      );
      final data = response.data as Map<String, dynamic>;
      final call = data['call'];
      if (call is! Map<String, dynamic>) {
        throw const FormatException('Call acceptance returned no call.');
      }
      return CallSession.fromMap(call);
    } catch (_) {
      throw Exception('Unable to accept the call on the server.');
    }
  }

  Future<void> endCall(String callId, {String reason = 'user_hangup'}) async {
    if (_client.auth.currentSession == null) {
      throw Exception('Please sign in before ending a call.');
    }

    try {
      await _client.functions.invoke(
        'call-end',
        body: {'call_id': callId, 'reason': reason},
      );
    } catch (_) {
      throw Exception('Unable to end the call on the server.');
    }
  }

  Future<void> pingHeartbeat(String callId) async {
    try {
      await _client.rpc(
        'ping_friendoo_call_heartbeat',
        params: {'p_call_id': callId},
      );
    } catch (_) {
      // Non-blocking network ping
    }
  }

  Future<AgoraJoinCredentials> getAgoraCredentials(String callId) async {
    try {
      final response = await _client.functions.invoke(
        'agora-token',
        body: {'call_id': callId},
      );
      return AgoraJoinCredentials.fromMap(
        response.data as Map<String, dynamic>,
      );
    } catch (_) {
      throw Exception('Unable to obtain secure audio credentials.');
    }
  }

  Future<VideoSdkJoinCredentials> getVideoSdkCredentials(String callId) async {
    try {
      final response = await _client.functions.invoke(
        'videosdk-token',
        body: {'call_id': callId},
      );
      return VideoSdkJoinCredentials.fromMap(
        response.data as Map<String, dynamic>,
      );
    } catch (_) {
      throw Exception('Unable to obtain secure audio credentials.');
    }
  }

  Stream<List<CallSession>> watchIncomingCalls() {
    final controller = StreamController<List<CallSession>>.broadcast();
    final activeProfile = ProfileRepository.currentActiveProfile;
    final userId = activeProfile?.id ?? _client.auth.currentUser?.id;

    if (userId == null) {
      return Stream.value(const <CallSession>[]);
    }

    Timer? pollTimer;

    Future<void> pollOnce() async {
      final activeProfile = ProfileRepository.currentActiveProfile;
      final userId = activeProfile?.id ?? _client.auth.currentUser?.id;
      if (userId == null) {
        if (!controller.isClosed) controller.add(const <CallSession>[]);
        return;
      }

      try {
        final rows = await _client
            .from('calls')
            .select()
            .eq('host_id', userId)
            .or('status.eq.ringing,status.eq.connecting,status.eq.initiated')
            .order('created_at', ascending: false)
            .limit(10);

        final matches = (rows as List<dynamic>)
            .where((r) {
              final hId = r['host_id']?.toString() ?? '';
              final isTargetHost = hId == userId;

              final status = r['status']?.toString() ?? '';
              return isTargetHost &&
                  (status == 'ringing' ||
                      status == 'connecting' ||
                      status == 'initiated');
            })
            .map((r) => CallSession.fromMap(r as Map<String, dynamic>))
            .toList();

        if (!controller.isClosed) {
          controller.add(matches);
        }
      } catch (_) {}
    }

    StreamSubscription? sub;
    try {
      sub = _client.from('calls').stream(primaryKey: ['id']).listen((rows) {
        final activeProfile = ProfileRepository.currentActiveProfile;
        final currentUserId = activeProfile?.id ?? _client.auth.currentUser?.id;
        if (currentUserId == null) {
          if (!controller.isClosed) controller.add(const <CallSession>[]);
          return;
        }
        final matches = rows
            .where((row) {
              final hostId = row['host_id']?.toString() ?? '';
              final status = row['status']?.toString() ?? '';
              final isTargetHost = hostId == currentUserId;

              return isTargetHost &&
                  (status == 'ringing' ||
                      status == 'connecting' ||
                      status == 'initiated');
            })
            .map((row) => CallSession.fromMap(row))
            .toList();
        if (!controller.isClosed) {
          controller.add(matches);
        }
      }, onError: (_) {});
    } catch (_) {}

    pollOnce();
    pollTimer = Timer.periodic(
      const Duration(milliseconds: 2500),
      (_) => pollOnce(),
    );

    controller.onCancel = () {
      pollTimer?.cancel();
      sub?.cancel();
    };

    return controller.stream;
  }

  Stream<CallSession> watchCall(String callId) {
    final controller = StreamController<CallSession>.broadcast();
    Timer? pollTimer;

    Future<void> pollOnce() async {
      try {
        final row = await _client
            .from('calls')
            .select()
            .eq('id', callId)
            .maybeSingle();
        if (row != null && !controller.isClosed) {
          controller.add(CallSession.fromMap(row));
        }
      } catch (_) {}
    }

    StreamSubscription? sub;
    try {
      sub = _client
          .from('calls')
          .stream(primaryKey: ['id'])
          .eq('id', callId)
          .listen((rows) {
            if (rows.isNotEmpty && !controller.isClosed) {
              controller.add(CallSession.fromMap(rows.first));
            }
          }, onError: (_) {});
    } catch (_) {}

    pollOnce();
    pollTimer = Timer.periodic(
      const Duration(milliseconds: 1200),
      (_) => pollOnce(),
    );

    controller.onCancel = () {
      pollTimer?.cancel();
      sub?.cancel();
    };

    return controller.stream;
  }

  Future<List<CallHistoryItem>> fetchCallHistory({bool? isHostFlow}) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return const <CallHistoryItem>[];

    try {
      final rows = await _client
          .from('calls')
          .select(
            'id, caller_id, host_id, call_type, status, rate_per_minute, total_coins_deducted, started_at, ended_at, created_at, host:hosts(display_name:profiles!id(display_name)), caller:profiles!caller_id(display_name)',
          )
          .or('caller_id.eq.$userId,host_id.eq.$userId')
          .order('created_at', ascending: false)
          .limit(50);

      return (rows as List<dynamic>)
          .map(
            (row) => CallHistoryItem.fromMap(
              row as Map<String, dynamic>,
              currentUserId: userId,
            ),
          )
          .toList();
    } catch (_) {
      return const <CallHistoryItem>[];
    }
  }

  Future<void> submitCallReport({
    required String callId,
    required String reason,
    String? details,
  }) async {
    final user = _client.auth.currentUser;
    try {
      await _client.from('call_events').insert({
        'call_id': callId,
        'actor_id': user?.id,
        'event_type': 'report_filed',
        'payload': {
          'reason': reason,
          'details': details ?? '',
          'reported_at': DateTime.now().toIso8601String(),
        },
      });

      if (user != null) {
        await _client.from('support_tickets').insert({
          'reporter_id': user.id,
          'subject': 'Live Call Report: $reason',
          'category': 'safety',
          'priority': 'urgent',
          'status': 'open',
          'metadata': {
            'call_id': callId,
            'reason': reason,
            'details': details ?? '',
          },
        });
      }
    } catch (_) {
      // Graceful fallback for mock/local offline environments
    }
  }

  Future<void> submitCallRating({
    required String callId,
    required int rating,
    String? feedback,
  }) async {
    final user = _client.auth.currentUser;
    try {
      await _client.from('call_events').insert({
        'call_id': callId,
        'actor_id': user?.id,
        'event_type': 'call_rated',
        'payload': {
          'rating': rating,
          'feedback': feedback ?? '',
          'rated_at': DateTime.now().toIso8601String(),
        },
      });
    } catch (_) {}
  }
}
