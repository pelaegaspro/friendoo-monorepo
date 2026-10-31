import 'dart:convert';
import 'dart:io';

class SupportChatMessage {
  final String role; // 'user' | 'assistant' | 'admin'
  final String content;
  final DateTime timestamp;
  final bool isError;
  final bool suggestEscalation;
  final List<String>? options;
  final String? senderName;
  final String? mediaPath;
  final String? mediaType; // 'image' | 'pdf' | 'voice'
  final String? mediaName;
  final String? mediaSize;
  final bool isVoiceNote;

  SupportChatMessage({
    required this.role,
    required this.content,
    required this.timestamp,
    this.isError = false,
    this.suggestEscalation = false,
    this.options,
    this.senderName,
    this.mediaPath,
    this.mediaType,
    this.mediaName,
    this.mediaSize,
    this.isVoiceNote = false,
  });
}

class SupportChatRepository {
  // Try 127.0.0.1 (works with ADB reverse on real device), localhost, and 10.0.2.2 (Android Emulator)
  static const List<String> _candidateUrls = [
    'http://127.0.0.1:3000/api/support/ai-chat',
    'http://localhost:3000/api/support/ai-chat',
    'http://10.0.2.2:3000/api/support/ai-chat',
  ];

  static const List<String> _flowCandidateUrls = [
    'http://127.0.0.1:3000/api/support/flow',
    'http://localhost:3000/api/support/flow',
    'http://10.0.2.2:3000/api/support/flow',
  ];

  static const List<String> _webhookCandidateUrls = [
    'http://127.0.0.1:3000/api/support/webhook',
    'http://localhost:3000/api/support/webhook',
    'http://10.0.2.2:3000/api/support/webhook',
  ];

  final HttpClient _client = HttpClient()..connectionTimeout = const Duration(seconds: 8);

  Future<Map<String, dynamic>> sendMessage({
    required String userMessage,
    List<SupportChatMessage> history = const [],
    String? backendUrl,
    bool isHost = false,
    String? userId,
    String? name,
    String? phone,
  }) async {
    final urls = backendUrl != null ? [backendUrl] : _candidateUrls;

    for (final url in urls) {
      try {
        final uri = Uri.parse(url);
        final request = await _client.postUrl(uri);
        request.headers.set(HttpHeaders.contentTypeHeader, 'application/json; charset=utf-8');

        final payload = {
          'userMessage': userMessage,
          'role': isHost ? 'host' : 'user',
          'isHost': isHost,
          'userId': userId,
          'name': name,
          'phone': phone,
          'messages': history.map((m) => {
            'role': m.role,
            'content': m.content,
          }).toList(),
        };

        request.write(jsonEncode(payload));
        final response = await request.close();

        final responseBody = await response.transform(utf8.decoder).join();
        if (response.statusCode >= 200 && response.statusCode < 300) {
          final decoded = jsonDecode(responseBody) as Map<String, dynamic>;
          return {
            'reply': decoded['reply'] ?? (isHost
                ? "I am here to assist with host withdrawals, earnings, or call stability."
                : "I am here to help with your Friendoo payments, coins, or refunds."),
            'suggestEscalation': decoded['suggestEscalation'] == true,
            'extractedData': decoded['extractedData'],
          };
        }
      } catch (_) {
        continue;
      }
    }

    // Local scenario-based banking assistant fallback
    return {
      'reply': _localScenarioFallback(userMessage, isHost),
      'suggestEscalation': userMessage.toLowerCase().contains('failed') ||
          userMessage.toLowerCase().contains('utr') ||
          userMessage.toLowerCase().contains('admin') ||
          userMessage.toLowerCase().contains('delay'),
    };
  }

  /// Stateful interactive flow endpoint (Multi-step interactive router e.g. DTH flow)
  Future<Map<String, dynamic>?> sendFlowAction({
    required String action,
    required String userId,
    String? sessionId,
  }) async {
    for (final url in _flowCandidateUrls) {
      try {
        final uri = Uri.parse(url);
        final request = await _client.postUrl(uri);
        request.headers.set(HttpHeaders.contentTypeHeader, 'application/json; charset=utf-8');

        final payload = {
          'userId': userId,
          'sessionId': sessionId ?? userId,
          'action': action,
        };

        request.write(jsonEncode(payload));
        final response = await request.close();
        final body = await response.transform(utf8.decoder).join();
        if (response.statusCode >= 200 && response.statusCode < 300) {
          return jsonDecode(body) as Map<String, dynamic>;
        }
      } catch (_) {
        continue;
      }
    }
    return null;
  }

  /// Triggers Make.com / Google automation webhook
  Future<bool> triggerWebhook({
    required String event,
    required bool isHost,
    String? userId,
    String? name,
    String? phone,
    String? scenario,
    String? utr,
    String? amount,
    String? payoutId,
    String? chatSummary,
  }) async {
    for (final url in _webhookCandidateUrls) {
      try {
        final uri = Uri.parse(url);
        final request = await _client.postUrl(uri);
        request.headers.set(HttpHeaders.contentTypeHeader, 'application/json; charset=utf-8');

        final payload = {
          'event': event,
          'role': isHost ? 'host' : 'user',
          'userId': userId ?? 'app_user',
          'name': name ?? (isHost ? 'Friendoo Host' : 'Friendoo Caller'),
          'phone': phone ?? 'unknown',
          'scenario': scenario ?? (isHost ? 'host_support' : 'caller_support'),
          'utr': utr,
          'amount': amount,
          'payoutId': payoutId,
          'chatSummary': chatSummary ?? 'User connected to 24/7 Live Support Desk',
          'timestamp': DateTime.now().toIso8601String(),
        };

        request.write(jsonEncode(payload));
        final response = await request.close();
        if (response.statusCode >= 200 && response.statusCode < 300) {
          return true;
        }
      } catch (_) {
        continue;
      }
    }
    return false;
  }

  /// Local rule-based banking assistant fallback adhering strictly to role & scenario boundaries
  String _localScenarioFallback(String query, bool isHost) {
    final lower = query.toLowerCase().trim();

    // STRICT REFUSAL FOR NON-FRIENDOO QUESTIONS
    if (lower.contains('python') ||
        lower.contains('code') ||
        lower.contains('weather') ||
        lower.contains('recipe') ||
        lower.contains('prime number') ||
        lower.contains('who is ') ||
        lower.contains('capital of') ||
        lower.contains('math') ||
        lower.contains('translate')) {
      return "I am Friendoo's dedicated support assistant. I can only assist with Friendoo platform services such as coin recharges, failed payments, host payouts, call billing, or reporting an issue. How can I help with your Friendoo account today?";
    }

    if (isHost) {
      // HOST SCENARIOS: (Hosts do NOT pay or recharge; they withdraw cash & receive calls)
      if (lower == '1' || lower.contains('payout') || lower.contains('withdraw') || lower.contains('bank')) {
        return "*Host Withdrawal & Payout Process:*\n\n"
            "• *Minimum Withdrawal:* ₹500 (1,000 coins).\n"
            "• *Processing Window:* 24 to 48 business hours via IMPS / UPI.\n"
            "• *Status Check:* If your withdrawal has been pending for over 48 hours, share your Payout ID or UPI ID below, or tap 'Live Chat with Support Team'.";
      }

      if (lower == '2' || lower.contains('earning') || lower.contains('coin') || lower.contains('missing')) {
        return "*Host Earnings & Coin Calculation:*\n\n"
            "• Earnings are credited *instantly* to your Host Balance when each call concludes at your configured rate.\n"
            "• *Safety Buffer:* Calls ending under 15 seconds are treated as connection drop buffers and are unbilled.\n"
            "• Tap your *Host Earnings Tab* to view detailed per-call settlement logs.";
      }

      if (lower == '3' || lower.contains('audio') || lower.contains('stream') || lower.contains('mic') || lower.contains('drop')) {
        return "*Host Call Audio & Connection Guide:*\n\n"
            "• Ensure *Microphone & Notification* permissions are set to 'Always Allow'.\n"
            "• Disable battery optimization for Friendoo to prevent Android stopping background call streams.\n"
            "• For persistent audio issues, restart the app or switch to 5G / Wi-Fi.";
      }

      if (lower == '4' || lower.contains('report') || lower.contains('caller') || lower.contains('abuse') || lower.contains('safety')) {
        return "*Host Safety & Caller Abuse Reporting:*\n\n"
            "• Friendoo has *Zero Tolerance* for abusive language, harassment, or recording.\n"
            "• You can hang up instantly and tap the *Shield / Flag* button on the caller profile to block them permanently.\n"
            "• Trust & Safety reviews caller incident reports within 2 hours.";
      }

      if (lower == '5' || lower.contains('admin') || lower.contains('live') || lower.contains('human') || lower.contains('support')) {
        return "*Connecting with 24/7 Support Team:*\n\n"
            "• A representative from our Support Team is being notified on the live support console.\n"
            "• You can type your question or payout issue directly below; our team will respond in this chat in real time.";
      }

      return "🙏 *Host Support Assistant*\n\nI can assist with payout verification, call earnings, stream stability, and caller safety. Please choose an option above or type your question.";
    } else {
      // USER / CALLER SCENARIOS
      if (lower == '1' || lower.contains('deposit') || lower.contains('recharge') || lower.contains('payment') || lower.contains('utr')) {
        return "*Deposit / Recharge Resolution (Cashfree UPI):*\n\n"
            "• If your account was debited, UPI clearing takes *5 to 15 minutes*.\n"
            "• If failed by your bank, amount will *auto-reverse in 24–48 hours*.\n"
            "• If 15 minutes have passed without coins, please type your *12-digit UTR number* below or tap 'Live Chat with Support Team'.";
      }

      if (lower == '2' || lower.contains('drop') || lower.contains('refund') || lower.contains('15s')) {
        return "*Call Drop & Coin Refund Policy:*\n\n"
            "• Any call ending under 15 seconds is automatically *100% Free*.\n"
            "• For sudden network drops after 15s, type the host name and approximate time below to request a coin refund review.";
      }

      if (lower == '3' || lower.contains('rate') || lower.contains('balance') || lower.contains('price') || lower.contains('coin')) {
        return "*Friendoo Coin Rates & Wallet Info:*\n\n"
            "• *Wallet Rate:* 1 Coin = ₹0.50 (e.g. ₹100 = 100 coins + 10% bonus).\n"
            "• *Audio Call Rate:* Set by each host (displayed on their profile card).\n"
            "• *Minimum Balance:* You need at least 20 coins to initiate an audio call.";
      }

      if (lower == '4' || lower.contains('report') || lower.contains('host') || lower.contains('safety') || lower.contains('abuse')) {
        return "*Safety & Reporting Hosts:*\n\n"
            "• We maintain a safe environment for all callers across India.\n"
            "• You can tap the *Flag / Shield* icon on any host's profile card to block and report them.\n"
            "• Reports are reviewed by human trust & safety officers.";
      }

      if (lower == '5' || lower.contains('admin') || lower.contains('live') || lower.contains('human') || lower.contains('support')) {
        return "*Connecting with 24/7 Support Team:*\n\n"
            "• A representative from our Support Team is being notified on the live support console.\n"
            "• Please describe your recharge or refund issue below; our team will reply directly in this chat.";
      }

      return "🙏 *Friendoo 24/7 Care*\n\nI can resolve failed UPI recharges, coin rates, call drop refunds, and host reporting. Choose an option above or type your question directly.";
    }
  }
}
