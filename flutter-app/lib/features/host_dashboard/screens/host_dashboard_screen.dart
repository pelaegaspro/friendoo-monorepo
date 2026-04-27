import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/call_model.dart';

class HostDashboardScreen extends StatefulWidget {
  const HostDashboardScreen({super.key});

  @override
  State<HostDashboardScreen> createState() => _HostDashboardScreenState();
}

class _HostDashboardScreenState extends State<HostDashboardScreen> {
  int _currentTab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: IndexedStack(
        index: _currentTab,
        children: const [
          _DashboardTab(),
          _EarningsTab(),
          _ProfileTab(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.card,
          border: Border(top: BorderSide(color: AppColors.divider)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentTab,
          onTap: (i) => setState(() => _currentTab = i),
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textSecondary,
          items: const [
            BottomNavigationBarItem(
                icon: Icon(Icons.home_outlined),
                activeIcon: Icon(Icons.home),
                label: 'Dashboard'),
            BottomNavigationBarItem(
                icon: Icon(Icons.bar_chart_outlined),
                activeIcon: Icon(Icons.bar_chart),
                label: 'Earnings'),
            BottomNavigationBarItem(
                icon: Icon(Icons.person_outline),
                activeIcon: Icon(Icons.person),
                label: 'Profile'),
          ],
        ),
      ),
    );
  }
}

// â”€â”€â”€ TAB 1: DASHBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _DashboardTab extends StatefulWidget {
  const _DashboardTab();

  @override
  State<_DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<_DashboardTab> {
  final _uid = FirebaseAuth.instance.currentUser?.uid ?? '';
  bool _isOnline = false;
  bool _isDnd = false;
  bool _autoAccept = false;
  String _callerFilter = 'anyone';
  String _hostName = 'Host';
  List<CallModel> _recentCalls = const [];
  int _todayCalls = 0;
  int _todayMinutes = 0;
  int _todayEarnings = 0;
  int _totalReports = 0;
  int _silenceWarnings = 0;
  int _availableBalance = 0;
  String _status = 'pending';
  double _rating = 0;
  int _reviewCount = 0;
  int _responseTimeSeconds = 60;
  bool _loading = true;

  static const _filterOptions = [
    ('anyone', 'Anyone'),
    ('males_only', 'Males Only'),
    ('females_only', 'Females Only'),
    ('premium_only', 'Premium Users Only'),
  ];

  @override
  void initState() {
    super.initState();
    _loadHostData();
  }

  Future<void> _loadHostData() async {
    final doc =
        await FirebaseFirestore.instance.collection('hosts').doc(_uid).get();
    final callsSnapshot = await FirebaseFirestore.instance
        .collection(AppConstants.callsCollection)
        .where('hostId', isEqualTo: _uid)
        .limit(12)
        .get();
    final recentCalls = callsSnapshot.docs
        .map((callDoc) => CallModel.fromJson(callDoc.id, callDoc.data()))
        .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    final now = DateTime.now();
    final todayCalls = recentCalls
        .where((call) =>
            call.createdAt.year == now.year &&
            call.createdAt.month == now.month &&
            call.createdAt.day == now.day)
        .toList();

    if (doc.exists && mounted) {
      final d = doc.data()!;
      setState(() {
        _isOnline = d['isOnline'] as bool? ?? false;
        _isDnd = d['isDnd'] as bool? ?? false;
        _autoAccept = d['autoAccept'] as bool? ?? false;
        _callerFilter = d['callerFilter'] as String? ?? 'anyone';
        _hostName = d['name'] as String? ?? 'Host';
        _recentCalls = recentCalls;
        _todayCalls = todayCalls.length;
        _todayMinutes = todayCalls.fold<int>(
          0,
          (sum, call) => sum + ((call.durationSeconds / 60).ceil()),
        );
        _todayEarnings = todayCalls.fold<int>(
          0,
          (sum, call) => sum + call.hostCoinsEarned,
        );
        _totalReports = (d['totalReports'] as num?)?.toInt() ?? 0;
        _silenceWarnings = (d['silenceWarnings'] as num?)?.toInt() ?? 0;
        _availableBalance = (d['availableBalance'] as num?)?.toInt() ?? 0;
        _status = d['status'] as String? ?? 'pending';
        _rating = (d['rating'] as num?)?.toDouble() ?? 0;
        _reviewCount = (d['reviewCount'] as num?)?.toInt() ?? 0;
        _responseTimeSeconds =
            (d['responseTimeSeconds'] as num?)?.toInt() ?? 60;
        _loading = false;
      });
    } else {
      setState(() {
        _recentCalls = recentCalls;
        _todayCalls = todayCalls.length;
        _todayMinutes = todayCalls.fold<int>(
          0,
          (sum, call) => sum + ((call.durationSeconds / 60).ceil()),
        );
        _todayEarnings = todayCalls.fold<int>(
          0,
          (sum, call) => sum + call.hostCoinsEarned,
        );
        _loading = false;
      });
    }
  }

  Future<void> _updateField(String field, dynamic value) async {
    await FirebaseFirestore.instance
        .collection('hosts')
        .doc(_uid)
        .update({field: value});
  }

  Future<void> _reportCaller(CallModel call) async {
    if (call.userId.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No caller details found for this call')),
      );
      return;
    }

    final reason = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        const reasons = [
          'Abusive behavior',
          'Payment fraud',
          'Spam or harassment',
          'Inappropriate request',
        ];
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Report caller',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                ...reasons.map(
                  (item) => ListTile(
                    onTap: () => Navigator.of(context).pop(item),
                    leading:
                        const Icon(Icons.flag_outlined, color: AppColors.error),
                    title: Text(
                      item,
                      style: const TextStyle(color: AppColors.textPrimary),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );

    if (reason == null) return;

    await FirebaseFirestore.instance
        .collection(AppConstants.reportsCollection)
        .add({
      'reporterId': _uid,
      'reporterRole': AppConstants.userTypeHost,
      'reportedUserId': call.userId,
      'hostId': _uid,
      'callId': call.id,
      'reason': reason,
      'status': 'pending',
      'createdAt': FieldValue.serverTimestamp(),
    });

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Report submitted. We will review it shortly.'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.primary));
    }

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Greeting
          Text(
            '${_greeting()}, $_hostName',
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Manage your availability below',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
          ),
          const SizedBox(height: 20),

          // Online status card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.purpleGradient,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('You are',
                        style: TextStyle(color: Colors.white70, fontSize: 12)),
                    const SizedBox(height: 4),
                    Text(
                      _isOnline ? 'Online' : 'Offline',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                Switch(
                  value: _isOnline,
                  onChanged: (v) {
                    setState(() => _isOnline = v);
                    _updateField('isOnline', v);
                  },
                  activeThumbColor: Colors.white,
                  activeTrackColor: Colors.white.withValues(alpha: 0.4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // DND card
          _ToggleCard(
            icon: Icons.do_not_disturb_on_outlined,
            iconColor: AppColors.primary,
            title: 'Do Not Disturb',
            subtitle: 'No calls when DND is on',
            value: _isDnd,
            activeColor: AppColors.primary,
            onChanged: (v) {
              setState(() => _isDnd = v);
              _updateField('isDnd', v);
            },
          ),
          const SizedBox(height: 12),

          // Auto accept card
          _ToggleCard(
            icon: Icons.bolt,
            iconColor: AppColors.warning,
            title: 'Auto Accept Calls',
            subtitle: 'Calls connect instantly',
            value: _autoAccept,
            activeColor: AppColors.warning,
            onChanged: (v) {
              setState(() => _autoAccept = v);
              _updateField('autoAccept', v);
            },
          ),
          const SizedBox(height: 12),

          // Caller filter
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.divider),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Who can call me?',
                    style: TextStyle(
                        color: AppColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: _callerFilter,
                  dropdownColor: AppColors.cardLight,
                  style: const TextStyle(
                      color: AppColors.textPrimary, fontSize: 14),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: AppColors.primary),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: AppColors.primary),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 10),
                  ),
                  items: _filterOptions
                      .map((o) => DropdownMenuItem(
                            value: o.$1,
                            child: Text(o.$2),
                          ))
                      .toList(),
                  onChanged: (v) {
                    if (v == null) return;
                    setState(() => _callerFilter = v);
                    _updateField('callerFilter', v);
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Today's stats
          const Text("Today's Stats",
              style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Row(
            children: [
              _StatMini(icon: 'C', label: 'Calls', value: '$_todayCalls'),
              const SizedBox(width: 10),
              _StatMini(icon: 'M', label: 'Mins', value: '$_todayMinutes'),
              const SizedBox(width: 10),
              _StatMini(
                icon: 'Rs',
                label: 'Today',
                value: 'Rs. $_todayEarnings',
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Recent calls
          const Text('Recent Calls',
              style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          if (_recentCalls.isEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.divider),
              ),
              child: const Center(
                child: Text('No calls yet',
                    style: TextStyle(color: AppColors.textSecondary)),
              ),
            )
          else
            Column(
              children: _recentCalls
                  .take(4)
                  .map((call) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _RecentCallTile(
                          call: call,
                          onReport: () => _reportCaller(call),
                        ),
                      ))
                  .toList(),
            ),
          const SizedBox(height: 20),
          const Text('Safety & Account',
              style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.divider),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _SafetyPill(
                        label: 'Reports',
                        value: '$_totalReports',
                        tone: _totalReports > 0
                            ? AppColors.warning
                            : AppColors.success,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _SafetyPill(
                        label: 'Warnings',
                        value: '$_silenceWarnings',
                        tone: _silenceWarnings > 0
                            ? AppColors.warning
                            : AppColors.success,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _SafetyPill(
                        label: 'Rating',
                        value: _rating > 0
                            ? '${_rating.toStringAsFixed(1)} ($_reviewCount)'
                            : 'New',
                        tone: AppColors.accent,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _SafetyPill(
                        label: 'Response',
                        value: _responseTimeSeconds <= 60
                            ? '<1m'
                            : '${(_responseTimeSeconds / 60).ceil()}m',
                        tone: AppColors.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.account_balance_wallet_outlined,
                          color: AppColors.primary),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Available balance: Rs. $_availableBalance',
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: _status == 'approved'
                              ? AppColors.success.withValues(alpha: 0.12)
                              : AppColors.warning.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          _status.toUpperCase(),
                          style: TextStyle(
                            color: _status == 'approved'
                                ? AppColors.success
                                : AppColors.warning,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// â”€â”€â”€ TAB 2: EARNINGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _EarningsTab extends StatelessWidget {
  const _EarningsTab();

  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
    if (uid.isEmpty) {
      return const Center(
        child: Text(
          'Host account unavailable',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }

    return StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance
          .collection(AppConstants.hostsCollection)
          .doc(uid)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          );
        }

        final data = snapshot.data?.data() ?? <String, dynamic>{};
        final totalEarnings = (data['totalEarnings'] as num?)?.toInt() ?? 0;
        final availableBalance =
            (data['availableBalance'] as num?)?.toInt() ?? 0;
        final totalWithdrawn = (data['totalWithdrawn'] as num?)?.toInt() ?? 0;
        final totalCalls = (data['totalCalls'] as num?)?.toInt() ?? 0;
        final rating = (data['rating'] as num?)?.toDouble() ?? 0;
        final reviewCount = (data['reviewCount'] as num?)?.toInt() ?? 0;
        final upiVerified = data['upiVerified'] as bool? ?? false;

        return SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: AppColors.purpleGradient,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Total Earnings',
                        style: TextStyle(color: Colors.white70, fontSize: 14)),
                    const SizedBox(height: 8),
                    Text('Rs. $totalEarnings',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 40,
                            fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(
                      'Available balance: Rs. $availableBalance',
                      style:
                          const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.6,
                children: [
                  _EarningStatCard(label: 'Total Calls', value: '$totalCalls'),
                  _EarningStatCard(
                      label: 'Withdrawn', value: 'Rs. $totalWithdrawn'),
                  _EarningStatCard(
                    label: 'Avg Rating',
                    value: rating > 0 ? rating.toStringAsFixed(1) : 'New',
                  ),
                  _EarningStatCard(
                    label: 'Reviews',
                    value: '$reviewCount',
                  ),
                ],
              ),
              const SizedBox(height: 20),
              OutlinedButton(
                onPressed:
                    availableBalance >= AppConstants.minWithdrawalAmountINR
                        ? () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                    'Payout request flow can be connected next.'),
                              ),
                            );
                          }
                        : null,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary),
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: Text(
                  upiVerified ? 'Withdraw to UPI' : 'Verify UPI to withdraw',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.divider),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.verified_user_outlined,
                        color: AppColors.accent),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        upiVerified
                            ? 'UPI is verified. Withdrawals can be connected from this panel.'
                            : 'Set up and verify a UPI ID before enabling withdrawals.',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// â”€â”€â”€ TAB 3: PROFILE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _ProfileTab extends StatefulWidget {
  const _ProfileTab();

  @override
  State<_ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<_ProfileTab> {
  final _uid = FirebaseAuth.instance.currentUser?.uid ?? '';
  final _nameController = TextEditingController();
  final _bioController = TextEditingController();
  int _coinsPerMinute = 5;
  List<String> _languages = [];
  bool _loading = true;
  bool _saving = false;

  static const _allLanguages = [
    'Hindi',
    'Tamil',
    'Telugu',
    'Kannada',
    'Malayalam',
    'English',
    'Bengali',
    'Marathi',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final doc =
        await FirebaseFirestore.instance.collection('hosts').doc(_uid).get();
    if (doc.exists && mounted) {
      final d = doc.data()!;
      _nameController.text = d['name'] as String? ?? '';
      _bioController.text = d['bio'] as String? ?? '';
      setState(() {
        _coinsPerMinute = (d['coinsPerMinute'] as num?)?.toInt() ?? 5;
        _languages = (d['languages'] as List<dynamic>? ?? const [])
            .where((item) => item != null)
            .map((item) => item.toString())
            .where((item) => item.isNotEmpty)
            .toList();
        if (_languages.isEmpty &&
            (d['language'] as String?)?.isNotEmpty == true) {
          _languages = [(d['language'] as String?)!];
        }
        _loading = false;
      });
    } else {
      setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    await FirebaseFirestore.instance.collection('hosts').doc(_uid).update({
      'name': _nameController.text.trim(),
      'bio': _bioController.text.trim(),
      'coinsPerMinute': _coinsPerMinute,
      'languages': _languages,
      'language': _languages.isNotEmpty ? _languages.first : 'Hindi',
      'updatedAt': FieldValue.serverTimestamp(),
    });
    // Also update user doc name
    await FirebaseFirestore.instance.collection('users').doc(_uid).update({
      'name': _nameController.text.trim(),
    });
    if (mounted) {
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile saved!'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.primary));
    }

    final initials = _nameController.text.isNotEmpty
        ? _nameController.text[0].toUpperCase()
        : 'H';

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          // Avatar
          Center(
            child: Column(
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppColors.purpleGradient,
                    border: Border.all(color: AppColors.primary, width: 2.5),
                  ),
                  child: Center(
                    child: Text(
                      initials,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 36,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                const Text('Edit Photo',
                    style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 13,
                        fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Name
          const Text('Name',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          const SizedBox(height: 8),
          _DarkTextField(controller: _nameController, hint: 'Your name'),
          const SizedBox(height: 20),

          // Bio
          const Text('Bio',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          const SizedBox(height: 8),
          _DarkTextField(
              controller: _bioController,
              hint: 'Tell callers about yourself...',
              maxLines: 3),
          const SizedBox(height: 20),

          // Coins per minute
          const Text('Coins per minute',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          const SizedBox(height: 4),
          const Text(
            'Changing rate applies to new calls only',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _CircleButton(
                icon: Icons.remove,
                onTap: () {
                  if (_coinsPerMinute > 1) {
                    setState(() => _coinsPerMinute--);
                  }
                },
              ),
              const SizedBox(width: 24),
              Text(
                '$_coinsPerMinute',
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(width: 24),
              _CircleButton(
                icon: Icons.add,
                onTap: () {
                  if (_coinsPerMinute < 20) {
                    setState(() => _coinsPerMinute++);
                  }
                },
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Languages
          const Text('Languages',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _allLanguages.map((lang) {
              final selected = _languages.contains(lang);
              return GestureDetector(
                onTap: () {
                  setState(() {
                    if (selected) {
                      _languages.remove(lang);
                    } else {
                      _languages.add(lang);
                    }
                  });
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary : AppColors.card,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: selected ? AppColors.primary : AppColors.divider,
                    ),
                  ),
                  child: Text(
                    lang,
                    style: TextStyle(
                      color: selected ? Colors.white : AppColors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 32),

          // Save button
          GestureDetector(
            onTap: _saving ? null : _save,
            child: Container(
              width: double.infinity,
              height: 54,
              decoration: BoxDecoration(
                gradient: AppColors.purpleGradient,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(
                child: _saving
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2.5),
                      )
                    : const Text(
                        'Save Profile',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Logout
          TextButton(
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
              if (context.mounted) context.go('/login');
            },
            child: const Text('Logout',
                style: TextStyle(
                    color: AppColors.error, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }
}

// â”€â”€â”€ SHARED WIDGETS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _RecentCallTile extends StatelessWidget {
  final CallModel call;
  final VoidCallback onReport;

  const _RecentCallTile({
    required this.call,
    required this.onReport,
  });

  @override
  Widget build(BuildContext context) {
    final status = call.status.isEmpty ? 'completed' : call.status;
    final statusColor =
        status == AppConstants.callStatusEnded || status == 'completed'
            ? AppColors.success
            : status == AppConstants.callStatusFailed
                ? AppColors.error
                : AppColors.warning;
    final displayLength = call.userId.length > 6 ? 6 : call.userId.length;
    final displayUserId = call.userId.isNotEmpty
        ? call.userId.substring(0, displayLength)
        : 'User';

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
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              call.type == 'video' ? Icons.videocam_outlined : Icons.call,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Caller $displayUserId',
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${(call.durationSeconds / 60).ceil()} min - ${call.hostCoinsEarned} coins',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
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
                  status.toUpperCase(),
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              GestureDetector(
                onTap: onReport,
                child: const Icon(
                  Icons.flag_outlined,
                  color: AppColors.error,
                  size: 20,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SafetyPill extends StatelessWidget {
  final String label;
  final String value;
  final Color tone;

  const _SafetyPill({
    required this.label,
    required this.value,
    required this.tone,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              color: tone,
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _ToggleCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final bool value;
  final Color activeColor;
  final ValueChanged<bool> onChanged;

  const _ToggleCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.activeColor,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 24),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.bold)),
                Text(subtitle,
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: activeColor,
          ),
        ],
      ),
    );
  }
}

class _StatMini extends StatelessWidget {
  final String icon;
  final String label;
  final String value;

  const _StatMini(
      {required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.divider),
        ),
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 20)),
            const SizedBox(height: 4),
            Text(value,
                style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.bold)),
            Text(label,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

class _EarningStatCard extends StatelessWidget {
  final String label;
  final String value;

  const _EarningStatCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 12)),
          const SizedBox(height: 6),
          Text(value,
              style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}

class _DarkTextField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final int maxLines;

  const _DarkTextField({
    required this.controller,
    required this.hint,
    this.maxLines = 1,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      style: const TextStyle(color: AppColors.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.textSecondary),
        filled: true,
        fillColor: AppColors.card,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
      ),
    );
  }
}

class _CircleButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _CircleButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: AppColors.card,
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.primary),
        ),
        child: Icon(icon, color: AppColors.primary, size: 20),
      ),
    );
  }
}
