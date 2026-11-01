import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
    this.isBannerDismissed = false,
  });

  final bool hasActiveNotice;
  final String? message;
  final String sender;
  final DateTime? timestamp;
  final String? ticketId;
  final bool isBannerDismissed;

  AdminSupportNotice copyWith({
    bool? hasActiveNotice,
    String? message,
    String? sender,
    DateTime? timestamp,
    String? ticketId,
    bool? isBannerDismissed,
  }) {
    return AdminSupportNotice(
      hasActiveNotice: hasActiveNotice ?? this.hasActiveNotice,
      message: message ?? this.message,
      sender: sender ?? this.sender,
      timestamp: timestamp ?? this.timestamp,
      ticketId: ticketId ?? this.ticketId,
      isBannerDismissed: isBannerDismissed ?? this.isBannerDismissed,
    );
  }

  static const empty = AdminSupportNotice(
    hasActiveNotice: false,
    isBannerDismissed: true,
  );
}

class AdminSupportNotificationNotifier extends StateNotifier<AdminSupportNotice> {
  AdminSupportNotificationNotifier(this._client) : super(AdminSupportNotice.empty) {
    _initListener();
  }

  final SupabaseClient _client;
  RealtimeChannel? _userChannel;
  StreamSubscription? _authSub;
  Timer? _autoDismissTimer;

  void _initListener() {
    _authSub = _client.auth.onAuthStateChange.listen((data) {
      final user = data.session?.user;
      if (user != null) {
        _subscribeToUserSupportChannel(user.id);
        _checkForActiveAdminTickets(user.id);
      } else {
        _unsubscribe();
        _autoDismissTimer?.cancel();
        state = AdminSupportNotice.empty;
      }
    });

    final currentId = _client.auth.currentUser?.id;
    if (currentId != null) {
      _subscribeToUserSupportChannel(currentId);
      _checkForActiveAdminTickets(currentId);
    }
  }

  void _startAutoDismissTimer() {
    _autoDismissTimer?.cancel();
    _autoDismissTimer = Timer(const Duration(seconds: 8), () {
      if (mounted) {
        state = state.copyWith(isBannerDismissed: true);
      }
    });
  }

  Future<void> _checkForActiveAdminTickets(String userId) async {
    try {
      final res = await _client
          .from('support_tickets')
          .select('id, subject, metadata, status, updated_at')
          .eq('reporter_id', userId)
          .inFilter('status', ['open', 'waiting_for_user', 'in_progress', 'active'])
          .order('updated_at', ascending: false)
          .limit(1)
          .maybeSingle();

      if (res != null) {
        final meta = res['metadata'] as Map<String, dynamic>? ?? {};
        final adminDirect = meta['admin_direct_message'] == true || meta['has_admin_message'] == true;
        final userReplied = meta['user_has_replied'] == true;
        final lastMsg = meta['last_admin_message']?.toString() ?? res['subject']?.toString();
        final ticketId = res['id']?.toString();

        if (adminDirect && !userReplied && lastMsg != null && lastMsg.isNotEmpty) {
          // Check if this message was already dismissed locally
          final prefs = await SharedPreferences.getInstance();
          final dismissedMsg = prefs.getString('dismissed_support_notice_${userId}_$ticketId');

          final isDismissed = dismissedMsg == lastMsg;

          state = AdminSupportNotice(
            hasActiveNotice: true,
            message: lastMsg,
            sender: meta['admin_sender']?.toString() ?? 'Friendoo Support Specialist 🛡️',
            timestamp: DateTime.tryParse(res['updated_at']?.toString() ?? '') ?? DateTime.now(),
            ticketId: ticketId,
            isBannerDismissed: isDismissed,
          );

          if (!isDismissed) {
            _startAutoDismissTimer();
          }
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
                isBannerDismissed: false,
              );
              _startAutoDismissTimer();
            }
          },
        )
        .onBroadcast(
          event: 'ticket_resolved',
          callback: (payload) {
            _autoDismissTimer?.cancel();
            state = AdminSupportNotice.empty;
          },
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'support_tickets',
          callback: (payload) {
            final record = payload.newRecord;
            final status = record['status']?.toString();
            if (status == 'resolved' || status == 'closed') {
              _autoDismissTimer?.cancel();
              state = AdminSupportNotice.empty;
            }
          },
        )
        .subscribe();
    } catch (e) {
      debugPrint('AdminSupportNotificationNotifier channel error: $e');
    }
  }

  void openSupportChat(BuildContext context, {bool isHost = false}) {
    dismissTopBanner();
    SupportChatSheet.show(
      context,
      isHost: isHost,
      initialQuery: state.message != null ? 'Re: ${state.message}' : null,
    );
  }

  Future<void> dismissTopBanner() async {
    _autoDismissTimer?.cancel();
    state = state.copyWith(isBannerDismissed: true);

    try {
      final user = _client.auth.currentUser;
      if (user != null && state.message != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(
          'dismissed_support_notice_${user.id}_${state.ticketId ?? 'general'}',
          state.message!,
        );
      }
    } catch (_) {}
  }

  void clearNotice() {
    _autoDismissTimer?.cancel();
    state = AdminSupportNotice.empty;
  }

  void _unsubscribe() {
    try {
      _userChannel?.unsubscribe();
      _userChannel = null;
    } catch (_) {}
  }

  @override
  void dispose() {
    _autoDismissTimer?.cancel();
    _authSub?.cancel();
    _unsubscribe();
    super.dispose();
  }
}

final adminSupportNoticeProvider =
    StateNotifierProvider<AdminSupportNotificationNotifier, AdminSupportNotice>(
  (ref) => AdminSupportNotificationNotifier(ref.watch(supabaseProvider)),
);
