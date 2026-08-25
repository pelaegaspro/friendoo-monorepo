import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/models/friendoo_models.dart';
import '../../../core/supabase/supabase_provider.dart';

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
    final response = await _client.functions.invoke(
      'call-initiate',
      body: {'host_id': hostId, 'call_type': 'audio'},
    );
    final data = response.data as Map<String, dynamic>;
    return CallSession.fromMap(data['call'] as Map<String, dynamic>);
  }

  Future<CallSession> acceptCall(String callId) async {
    final response = await _client.functions.invoke(
      'call-accept',
      body: {'call_id': callId},
    );
    final data = response.data as Map<String, dynamic>;
    return CallSession.fromMap(data['call'] as Map<String, dynamic>);
  }

  Future<void> endCall(String callId, {String reason = 'user_hangup'}) async {
    await _client.functions.invoke(
      'call-end',
      body: {'call_id': callId, 'reason': reason},
    );
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
    final response = await _client.functions.invoke(
      'agora-token',
      body: {'call_id': callId},
    );
    return AgoraJoinCredentials.fromMap(response.data as Map<String, dynamic>);
  }

  Future<VideoSdkJoinCredentials> getVideoSdkCredentials(String callId) async {
    final response = await _client.functions.invoke(
      'videosdk-token',
      body: {'call_id': callId},
    );
    return VideoSdkJoinCredentials.fromMap(
      response.data as Map<String, dynamic>,
    );
  }

  Stream<List<CallSession>> watchIncomingCalls() {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) {
      return Stream.value(const <CallSession>[]);
    }
    try {
      return _client
          .from('calls')
          .stream(primaryKey: ['id'])
          .eq('host_id', userId)
          .map((rows) {
            return rows
                .where((r) =>
                    r['status'] == 'ringing' ||
                    r['status'] == 'connecting' ||
                    r['status'] == 'initiated')
                .map((r) => CallSession.fromMap(r))
                .toList();
          })
          .handleError((_) => const <CallSession>[]);
    } catch (_) {
      return Stream.value(const <CallSession>[]);
    }
  }

  Stream<CallSession> watchCall(String callId) {
    try {
      return _client
          .from('calls')
          .stream(primaryKey: ['id'])
          .eq('id', callId)
          .map((rows) {
            if (rows.isNotEmpty) {
              return CallSession.fromMap(rows.first);
            }
            throw StateError('Call not found');
          });
    } catch (_) {
      return Stream.empty();
    }
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
