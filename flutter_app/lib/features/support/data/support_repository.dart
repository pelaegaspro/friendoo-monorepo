import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SupportTicketItem {
  final String id;
  final String subject;
  final String category;
  final String priority;
  final String status;
  final String scenario;
  final DateTime createdAt;
  final Map<String, dynamic> metadata;

  const SupportTicketItem({
    required this.id,
    required this.subject,
    required this.category,
    required this.priority,
    required this.status,
    required this.scenario,
    required this.createdAt,
    required this.metadata,
  });

  factory SupportTicketItem.fromMap(Map<String, dynamic> map) {
    final meta = map['metadata'] is Map<String, dynamic>
        ? map['metadata'] as Map<String, dynamic>
        : <String, dynamic>{};
    return SupportTicketItem(
      id: map['id']?.toString() ?? '',
      subject: map['subject']?.toString() ?? 'Support Request',
      category: map['category']?.toString() ?? 'General',
      priority: map['priority']?.toString() ?? 'medium',
      status: map['status']?.toString() ?? 'open',
      scenario: meta['scenario']?.toString() ?? 'general',
      createdAt: DateTime.tryParse(map['created_at']?.toString() ?? '') ?? DateTime.now(),
      metadata: meta,
    );
  }
}

class SupportRepository {
  SupportRepository({SupabaseClient? client})
      : _client = client ?? Supabase.instance.client;

  final SupabaseClient _client;

  /// Submits a 24/7 support ticket with rich scenario context (e.g. payment failure)
  Future<Map<String, dynamic>> submitTicket({
    required String subject,
    required String category,
    String priority = 'medium',
    String scenario = 'general',
    Map<String, dynamic>? metadata,
    String message = '',
  }) async {
    try {
      final res = await _client.rpc(
        'submit_support_ticket',
        params: {
          'p_subject': subject,
          'p_category': category,
          'p_priority': priority,
          'p_scenario': scenario,
          'p_metadata': metadata ?? <String, dynamic>{},
          'p_message': message,
        },
      );
      if (res is Map<String, dynamic>) {
        return res;
      }
      return {'success': true};
    } catch (e) {
      debugPrint('submitSupportTicket error: $e');
      rethrow;
    }
  }

  /// Fetches historical tickets submitted by the current authenticated caller
  Future<List<SupportTicketItem>> fetchMyTickets() async {
    final user = _client.auth.currentUser;
    if (user == null) return const [];

    try {
      final rows = await _client
          .from('support_tickets')
          .select('id, subject, category, priority, status, metadata, created_at')
          .eq('reporter_id', user.id)
          .order('created_at', ascending: false)
          .limit(50);

      return (rows as List<dynamic>)
          .map((r) => SupportTicketItem.fromMap(r as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('fetchMyTickets error: $e');
      return const [];
    }
  }
}

