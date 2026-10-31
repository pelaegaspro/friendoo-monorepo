import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase/supabase_provider.dart';
import '../presentation/support_chat_sheet.dart';

class AdminSupportNotice {
  const AdminSupportNotice({
    required this.hasActiveNotice,
    this.message,
    this.sender = 'Friendoo Support Specialist 🛡️',
    this.timestamp,
    this.ticketId,
  });

  final bool hasActiveNotice;
  final String? message;
  final String sender;
  final DateTime? timestamp;
  final String? ticketId;

  AdminSupportNotice copyWith({
    bool? hasActiveNotice,
    String? message,
    String? sender,
    DateTime? timestamp,
    String? ticketId,
  }) {
    return AdminSupportNotice(
      hasActiveNotice: hasActiveNotice ?? this.hasActiveNotice,
      message: message ?? this.message,
      sender: sender ?? this.sender,
      timestamp: timestamp ?? this.timestamp,
      ticketId: ticketId ?? this.ticketId,
    );
  }

  static const empty = AdminSupportNotice(hasActiveNotice: false);
}

class AdminSupportNotificationNotifier extends StateNotifier<AdminSupportNotice> {
  AdminSupportNotificationNotifier(this._client) : super(AdminSupportNotice.empty) {
    _initListener();
  }

  final SupabaseClient _client;
  RealtimeChannel? _userChannel;
  StreamSubscription? _authSub;

  void _initListener() {
    _authSub = _client.auth.onAuthStateChange.listen((data) {
      final user = data.session?.user;
      if (user != null) {
        _subscribeToUserSupportChannel(user.id);
        _checkForActiveAdminTickets(user.id);
      } else {
        _unsubscribe();
        state = AdminSupportNotice.empty;
      }
    });

    final currentId = _client.auth.currentUser?.id;
    if (currentId != null) {
      _subscribeToUserSupportChannel(currentId);
      _checkForActiveAdminTickets(currentId);
    }
  }

  Future<void> _checkForActiveAdminTickets(String userId) async {
    try {
      final res = await _client
          .from('support_tickets')
          .select('id, subject, metadata, status, updated_at')
          .eq('reporter_id', userId)
          .eq('status', 'active')
          .order('updated_at', ascending: false)
          .limit(1)
          .maybeSingle();

      if (res != null && res['status'] == 'active') {
        final meta = res['metadata'] as Map<String, dynamic>? ?? {};
        final adminDirect = meta['admin_direct_message'] == true || meta['has_admin_message'] == true;
        final lastMsg = meta['last_admin_message']?.toString() ?? res['subject']?.toString();

        if (adminDirect && lastMsg != null && lastMsg.isNotEmpty) {
          state = AdminSupportNotice(
            hasActiveNotice: true,
            message: lastMsg,
            sender: meta['admin_sender']?.toString() ?? 'Friendoo Support Specialist 🛡️',
            timestamp: DateTime.tryParse(res['updated_at']?.toString() ?? '') ?? DateTime.now(),
            ticketId: res['id']?.toString(),
          );
        }
      }
    } catch (_) {}
  }

  void _subscribeToUserSupportChannel(String userId) {
    _unsubscribe();
    try {
      final channelName = 'support_live:$userId';
      _userChannel = _client.channel(channelName);

      _userChannel!
        .onBroadcast(
          event: 'admin_message',
          callback: (payload) {
            final content = payload['message']?.toString() ?? '';
            final sender = payload['sender']?.toString() ?? 'Friendoo Support Specialist 🛡️';
            final ticketId = payload['ticketId']?.toString();

            if (content.isNotEmpty) {
              state = AdminSupportNotice(
                hasActiveNotice: true,
                message: content,
                sender: sender,
                timestamp: DateTime.now(),
                ticketId: ticketId,
              );
            }
          },
        )
        .onBroadcast(
          event: 'ticket_resolved',
          callback: (payload) {
            // Dismiss instantly when admin marks resolved
            state = AdminSupportNotice.empty;
          },
        )
        .subscribe();
    } catch (e) {
      debugPrint('AdminSupportNotificationNotifier channel error: $e');
    }
  }

  void openSupportChat(BuildContext context, {bool isHost = false}) {
    SupportChatSheet.show(
      context,
      isHost: isHost,
      initialQuery: state.message != null ? 'Re: ${state.message}' : null,
    );
  }

  void dismissTopBannerOnly() {
    // Keep badge active in profile until admin resolves, but close top toast
    state = state.copyWith(hasActiveNotice: true);
  }

  void _unsubscribe() {
    try {
      _userChannel?.unsubscribe();
      _userChannel = null;
    } catch (_) {}
  }

  @override
  void dispose() {
    _authSub?.cancel();
    _unsubscribe();
    super.dispose();
  }
}

final adminSupportNoticeProvider =
    StateNotifierProvider<AdminSupportNotificationNotifier, AdminSupportNotice>(
  (ref) => AdminSupportNotificationNotifier(ref.watch(supabaseProvider)),
);

