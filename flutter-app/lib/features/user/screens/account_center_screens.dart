import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/call_model.dart';

void _goBack(BuildContext context) {
  if (context.canPop()) {
    context.pop();
    return;
  }
  context.go('/home');
}

class CallHistoryScreen extends StatefulWidget {
  const CallHistoryScreen({super.key});

  @override
  State<CallHistoryScreen> createState() => _CallHistoryScreenState();
}

class _CallHistoryScreenState extends State<CallHistoryScreen> {
  late Future<List<_CallHistoryEntry>> _futureCalls;

  @override
  void initState() {
    super.initState();
    _futureCalls = _loadCalls();
  }

  Future<List<_CallHistoryEntry>> _loadCalls() async {
    final userId = FirebaseAuth.instance.currentUser?.uid;
    if (userId == null) return const [];

    final firestore = FirebaseFirestore.instance;
    final snapshots = await Future.wait([
      firestore
          .collection(AppConstants.callsCollection)
          .where('callerId', isEqualTo: userId)
          .limit(30)
          .get(),
      firestore
          .collection(AppConstants.callsCollection)
          .where('userId', isEqualTo: userId)
          .limit(30)
          .get(),
    ]);

    final callsById = <String, CallModel>{};
    for (final snapshot in snapshots) {
      for (final doc in snapshot.docs) {
        callsById[doc.id] = CallModel.fromJson(doc.id, doc.data());
      }
    }

    final calls = callsById.values.toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    final hostNames = <String, String>{};
    final hostIds = calls
        .map((call) => call.hostId)
        .where((id) => id.isNotEmpty)
        .toSet()
        .toList();

    for (var i = 0; i < hostIds.length; i += 10) {
      final chunk = hostIds.skip(i).take(10).toList();
      if (chunk.isEmpty) continue;
      final hostSnapshot = await firestore
          .collection(AppConstants.hostsCollection)
          .where(FieldPath.documentId, whereIn: chunk)
          .get();
      for (final doc in hostSnapshot.docs) {
        final data = doc.data();
        hostNames[doc.id] = (data['name'] as String?) ?? 'Host';
      }
    }

    return calls
        .map(
          (call) => _CallHistoryEntry(
            call: call,
            hostName: hostNames[call.hostId] ?? 'Host',
          ),
        )
        .toList();
  }

  Future<void> _refresh() async {
    final future = _loadCalls();
    setState(() => _futureCalls = future);
    await future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: const Text('Call History'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () => _goBack(context),
        ),
      ),
      body: FutureBuilder<List<_CallHistoryEntry>>(
        future: _futureCalls,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            );
          }

          if (snapshot.hasError) {
            return _StateMessage(
              icon: Icons.history_toggle_off_rounded,
              title: 'Could not load call history',
              message: '${snapshot.error}',
              actionLabel: 'Retry',
              onAction: _refresh,
            );
          }

          final calls = snapshot.data ?? const [];
          if (calls.isEmpty) {
            return const _StateMessage(
              icon: Icons.call_outlined,
              title: 'No calls yet',
              message: 'Your completed and missed calls will show up here.',
            );
          }

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: _refresh,
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              itemCount: calls.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, index) => _CallHistoryCard(entry: calls[index]),
            ),
          );
        },
      ),
    );
  }
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  static const _notificationsKey = 'settings_notifications';
  static const _callSoundKey = 'settings_call_sound';
  static const _offersKey = 'settings_offers';

  bool _notifications = true;
  bool _callSound = true;
  bool _offers = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _notifications = prefs.getBool(_notificationsKey) ?? true;
      _callSound = prefs.getBool(_callSoundKey) ?? true;
      _offers = prefs.getBool(_offersKey) ?? true;
    });
  }

  Future<void> _save(String key, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: const Text('Settings'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () => _goBack(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          _SwitchTile(
            icon: Icons.notifications_outlined,
            title: 'Push Notifications',
            subtitle: 'Alerts for calls, wallet updates and support replies',
            value: _notifications,
            onChanged: (value) {
              setState(() => _notifications = value);
              _save(_notificationsKey, value);
            },
          ),
          _SwitchTile(
            icon: Icons.volume_up_outlined,
            title: 'Call Sounds',
            subtitle: 'Play ring and connection sounds during calls',
            value: _callSound,
            onChanged: (value) {
              setState(() => _callSound = value);
              _save(_callSoundKey, value);
            },
          ),
          _SwitchTile(
            icon: Icons.local_offer_outlined,
            title: 'Offers & Updates',
            subtitle: 'Receive bonus, wallet and promotion updates',
            value: _offers,
            onChanged: (value) {
              setState(() => _offers = value);
              _save(_offersKey, value);
            },
          ),
          const SizedBox(height: 18),
          const _SectionTitle('Quick Links'),
          const SizedBox(height: 10),
          _LinkTile(
            icon: Icons.help_outline,
            title: 'Help & Support',
            subtitle: 'Get help with calls, payments and your account',
            onTap: () => context.push('/help-support'),
          ),
          _LinkTile(
            icon: Icons.lock_outline,
            title: 'Privacy Policy',
            subtitle: 'See how Friendoo handles your data',
            onTap: () => context.push('/privacy-policy'),
          ),
          _LinkTile(
            icon: Icons.description_outlined,
            title: 'Terms of Service',
            subtitle: 'Review account, payment and usage rules',
            onTap: () => context.push('/terms-of-service'),
          ),
        ],
      ),
    );
  }
}

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: const Text('Help & Support'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () => _goBack(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: const [
          _InfoCard(
            icon: Icons.support_agent_rounded,
            title: 'Support Team',
            body:
                'Need help with a wallet issue, call problem or account question? Reach us at support@friendoo.com and include your phone number for faster help.',
          ),
          SizedBox(height: 12),
          _InfoCard(
            icon: Icons.payments_outlined,
            title: 'Payments',
            body:
                'If a payment succeeds but coins do not show up immediately, wait a minute and refresh the wallet. Successful payments are credited after verification.',
          ),
          SizedBox(height: 12),
          _InfoCard(
            icon: Icons.call_outlined,
            title: 'Call Quality',
            body:
                'Before placing a call, make sure your mic permission is enabled and your internet connection is stable. Low balance can also stop a call from starting.',
          ),
          SizedBox(height: 12),
          _InfoCard(
            icon: Icons.shield_outlined,
            title: 'Safety',
            body:
                'If you face abuse, harassment or suspicious behavior during a call, stop the call and report it from the host dashboard or support.',
          ),
        ],
      ),
    );
  }
}

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const _LongFormScreen(
      title: 'Privacy Policy',
      sections: [
        _LongFormSection(
          title: 'What we collect',
          body:
              'Friendoo stores the account details, wallet activity, call records and profile information needed to run calls, payments and support safely.',
        ),
        _LongFormSection(
          title: 'How it is used',
          body:
              'Your information is used to power calling, show balances, prevent abuse, resolve disputes and improve platform reliability.',
        ),
        _LongFormSection(
          title: 'Safety and moderation',
          body:
              'Call logs, reports and risk signals may be reviewed to investigate fraud, payment disputes, harassment and policy violations.',
        ),
        _LongFormSection(
          title: 'Your controls',
          body:
              'You can update your visible profile details, request support for account issues and review app settings directly from the account section.',
        ),
      ],
    );
  }
}

class TermsOfServiceScreen extends StatelessWidget {
  const TermsOfServiceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const _LongFormScreen(
      title: 'Terms of Service',
      sections: [
        _LongFormSection(
          title: 'Account use',
          body:
              'Use Friendoo only with accurate profile information and in compliance with platform rules, payment rules and applicable law.',
        ),
        _LongFormSection(
          title: 'Payments and coins',
          body:
              'Coins are used inside the app for supported features. Purchases, deductions and bonuses are recorded in your wallet history.',
        ),
        _LongFormSection(
          title: 'Calls and conduct',
          body:
              'Abuse, fraud, impersonation, harassment and misuse of calls or payments can lead to restrictions, suspension or permanent removal.',
        ),
        _LongFormSection(
          title: 'Host responsibilities',
          body:
              'Hosts are expected to maintain accurate profiles, respectful conduct, timely responses and safe call behavior while using the dashboard and earnings features.',
        ),
      ],
    );
  }
}

class _LongFormScreen extends StatelessWidget {
  final String title;
  final List<_LongFormSection> sections;

  const _LongFormScreen({
    required this.title,
    required this.sections,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: Text(title),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () => _goBack(context),
        ),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        itemCount: sections.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, index) {
          final section = sections[index];
          return _InfoCard(
            icon: Icons.article_outlined,
            title: section.title,
            body: section.body,
          );
        },
      ),
    );
  }
}

class _LongFormSection {
  final String title;
  final String body;

  const _LongFormSection({
    required this.title,
    required this.body,
  });
}

class _CallHistoryEntry {
  final CallModel call;
  final String hostName;

  const _CallHistoryEntry({
    required this.call,
    required this.hostName,
  });
}

class _CallHistoryCard extends StatelessWidget {
  final _CallHistoryEntry entry;

  const _CallHistoryCard({required this.entry});

  @override
  Widget build(BuildContext context) {
    final call = entry.call;
    final isVideo = call.type == 'video';
    final status = call.status.isEmpty ? 'completed' : call.status;
    final statusLabel = status[0].toUpperCase() + status.substring(1);
    final statusColor = status == 'completed'
        ? AppColors.success
        : status == 'failed'
            ? AppColors.error
            : AppColors.warning;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: (isVideo ? AppColors.accent : AppColors.primary)
                  .withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isVideo ? Icons.videocam_outlined : Icons.call_outlined,
              color: isVideo ? AppColors.accent : AppColors.primary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.hostName,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${isVideo ? 'Video' : 'Audio'} call - ${_formatDuration(call.durationSeconds)}',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _formatDateTime(call.createdAt),
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  statusLabel,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '-${call.coinsDeducted} coins',
                style: const TextStyle(
                  color: AppColors.error,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SwitchTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SwitchTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            activeColor: AppColors.primary,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}

class _LinkTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _LinkTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
      ),
      child: ListTile(
        onTap: onTap,
        leading: Icon(icon, color: AppColors.primary),
        title: Text(
          title,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 12,
          ),
        ),
        trailing: const Icon(
          Icons.chevron_right,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String body;

  const _InfoCard({
    required this.icon,
    required this.title,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppColors.primary),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            body,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        color: AppColors.textPrimary,
        fontSize: 16,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

class _StateMessage extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final Future<void> Function()? onAction;

  const _StateMessage({
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: AppColors.textSecondary, size: 48),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              message,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => onAction!.call(),
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

String _formatDateTime(DateTime value) {
  final now = DateTime.now();
  final isToday = now.year == value.year &&
      now.month == value.month &&
      now.day == value.day;
  if (isToday) {
    return 'Today ${value.hour}:${value.minute.toString().padLeft(2, '0')}';
  }
  return '${value.day}/${value.month}/${value.year}';
}

String _formatDuration(int seconds) {
  if (seconds <= 0) return '<1 min';
  final minutes = seconds ~/ 60;
  final remaining = seconds % 60;
  if (minutes == 0) return '${remaining}s';
  if (remaining == 0) return '${minutes}m';
  return '${minutes}m ${remaining}s';
}
