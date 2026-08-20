import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/friendoo_ui.dart';
import '../../discover/presentation/desi_avatar.dart';
import '../data/profile_repository.dart';
import '../../discover/data/host_repository.dart';
import '../../wallet/data/wallet_repository.dart';

/// Clean scaffold wrapper for all dedicated settings & profile child pages
class SettingsPageScaffold extends StatelessWidget {
  const SettingsPageScaffold({
    super.key,
    required this.title,
    this.subtitle,
    required this.children,
    this.bottomAction,
  });

  final String title;
  final String? subtitle;
  final List<Widget> children;
  final Widget? bottomAction;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        shadowColor: Colors.black.withOpacity(0.06),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: FriendooUiColors.ink),
          tooltip: 'Back',
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                color: FriendooUiColors.ink,
                fontSize: 18,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.3,
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 1),
              Text(
                subtitle!,
                style: const TextStyle(
                  color: Color(0xFF6B7280),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                children: children,
              ),
            ),
            if (bottomAction != null)
              Container(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 10,
                      offset: const Offset(0, -3),
                    ),
                  ],
                ),
                child: bottomAction!,
              ),
          ],
        ),
      ),
    );
  }
}

/// Generic Settings Section Card
class SettingsSectionCard extends StatelessWidget {
  const SettingsSectionCard({
    super.key,
    this.title,
    required this.children,
  });

  final String? title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          Text(
            title!,
            style: const TextStyle(
              color: Color(0xFF374151),
              fontSize: 13,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.2,
            ),
          ),
          const SizedBox(height: 10),
        ],
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE5E7EB)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            children: children,
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }
}

/// Setting Switch Tile
class SettingsSwitchTile extends StatelessWidget {
  const SettingsSwitchTile({
    super.key,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
    this.icon,
  });

  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (icon != null) ...[
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFF3F4F6),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, size: 18, color: FriendooUiColors.ink),
            ),
            const SizedBox(width: 14),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: FriendooUiColors.ink,
                    fontSize: 14.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Color(0xFF6B7280),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          Switch.adaptive(
            value: value,
            activeColor: FriendooUiColors.pink,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// 1. MALE USER — DEDICATED PAGES
// ============================================================================

/// A. Edit Profile Page (Male User)
class EditUserProfilePage extends ConsumerStatefulWidget {
  const EditUserProfilePage({super.key});

  @override
  ConsumerState<EditUserProfilePage> createState() => _EditUserProfilePageState();
}

class _EditUserProfilePageState extends ConsumerState<EditUserProfilePage> {
  late TextEditingController _nameController;
  late TextEditingController _ageController;
  late TextEditingController _bioController;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: 'Rahul Sharma');
    _ageController = TextEditingController(text: '26');
    _bioController = TextEditingController(text: 'Voice caller on Friendoo. Enjoying casual chats and good discussions.');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ageController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _saveChanges() async {
    setState(() => _isSaving = true);
    await ref.read(profileRepositoryProvider).updateDisplayName(_nameController.text.trim());
    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;
    setState(() => _isSaving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: Color(0xFF10B981),
        content: Text('Profile details updated successfully!'),
      ),
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Edit Profile',
      subtitle: 'Personalize your male user profile',
      bottomAction: SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: _isSaving ? null : _saveChanges,
          style: FilledButton.styleFrom(
            backgroundColor: FriendooUiColors.pink,
            padding: const EdgeInsets.symmetric(vertical: 15),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: _isSaving
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                )
              : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
        ),
      ),
      children: [
        // Male Avatar Preview
        Center(
          child: Column(
            children: [
              Stack(
                children: [
                  DesiMaleAvatar(seed: _nameController.text, age: 26, size: 96),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(
                        color: FriendooUiColors.pink,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 16),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Text(
                'Indian Male User Avatar',
                style: TextStyle(color: Color(0xFF6B7280), fontSize: 12.5, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Text Fields
        SettingsSectionCard(
          title: 'BASIC INFORMATION',
          children: [
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Full Name',
                prefixIcon: Icon(Icons.person_outline_rounded),
                border: InputBorder.none,
              ),
            ),
            const Divider(height: 1),
            TextField(
              controller: _ageController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Age',
                prefixIcon: Icon(Icons.cake_outlined),
                border: InputBorder.none,
              ),
            ),
            const Divider(height: 1),
            TextField(
              controller: _bioController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'About / Bio',
                prefixIcon: Icon(Icons.edit_note_rounded),
                border: InputBorder.none,
              ),
            ),
          ],
        ),

        // Identity Verification Status Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFECFDF5),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFF10B981).withOpacity(0.35)),
          ),
          child: const Row(
            children: [
              Icon(Icons.verified_user_rounded, color: Color(0xFF047857), size: 24),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Verified Member Identity',
                      style: TextStyle(
                        color: Color(0xFF047857),
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Your phone number is authenticated. Voice calls stay 100% private.',
                      style: TextStyle(color: Color(0xFF065F46), fontSize: 11.5),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// B. Languages Page
class UserLanguagesPage extends ConsumerStatefulWidget {
  const UserLanguagesPage({super.key, this.isHost = false});

  final bool isHost;

  @override
  ConsumerState<UserLanguagesPage> createState() => _UserLanguagesPageState();
}

class _UserLanguagesPageState extends ConsumerState<UserLanguagesPage> {
  final List<String> _allLanguages = [
    'Hindi',
    'Tamil',
    'Telugu',
    'Kannada',
    'Malayalam',
    'English',
    'Bengali',
    'Marathi',
    'Gujarati',
    'Punjabi',
    'Odia',
  ];

  late Set<String> _selected;

  @override
  void initState() {
    super.initState();
    _selected = {'Hindi', 'Tamil', 'English'};
  }

  Future<void> _saveLanguages() async {
    if (widget.isHost) {
      await ref.read(hostRepositoryProvider).updateCurrentHostLanguages(_selected.toList());
    } else {
      await ref.read(profileRepositoryProvider).updatePreferredLanguages(_selected.toList());
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: Color(0xFF10B981),
        content: Text('Language preferences updated!'),
      ),
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Languages',
      subtitle: widget.isHost ? 'Languages you talk with callers in' : 'Languages you speak & understand',
      bottomAction: SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: _saveLanguages,
          style: FilledButton.styleFrom(
            backgroundColor: FriendooUiColors.pink,
            padding: const EdgeInsets.symmetric(vertical: 15),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: const Text('Save Languages', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
        ),
      ),
      children: [
        const Text(
          'Select all the languages you are comfortable speaking. This helps Friendoo recommend matching conversations.',
          style: TextStyle(color: Color(0xFF6B7280), fontSize: 13.5, height: 1.4),
        ),
        const SizedBox(height: 20),
        SettingsSectionCard(
          title: 'AVAILABLE LANGUAGES',
          children: _allLanguages.map((lang) {
            final isSelected = _selected.contains(lang);
            return InkWell(
              onTap: () {
                setState(() {
                  if (isSelected) {
                    if (_selected.length > 1) _selected.remove(lang);
                  } else {
                    _selected.add(lang);
                  }
                });
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Row(
                  children: [
                    Icon(
                      isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                      color: isSelected ? FriendooUiColors.pink : const Color(0xFF9CA3AF),
                      size: 22,
                    ),
                    const SizedBox(width: 14),
                    Text(
                      lang,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                        color: isSelected ? FriendooUiColors.ink : const Color(0xFF4B5563),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

/// C. Call Preferences Page (User)
class UserCallPreferencesPage extends StatefulWidget {
  const UserCallPreferencesPage({super.key});

  @override
  State<UserCallPreferencesPage> createState() => _UserCallPreferencesPageState();
}

class _UserCallPreferencesPageState extends State<UserCallPreferencesPage> {
  bool _lowCoinAlert = true;
  bool _hdVoice = true;
  bool _autoFilterOffline = true;
  bool _doNotDisturb = false;

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Call Preferences',
      subtitle: 'Audio quality & call filters',
      bottomAction: SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                backgroundColor: Color(0xFF10B981),
                content: Text('Call preferences saved!'),
              ),
            );
            Navigator.of(context).pop();
          },
          style: FilledButton.styleFrom(
            backgroundColor: FriendooUiColors.pink,
            padding: const EdgeInsets.symmetric(vertical: 15),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: const Text('Save Preferences', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
        ),
      ),
      children: [
        SettingsSectionCard(
          title: 'AUDIO & CONNECTION',
          children: [
            SettingsSwitchTile(
              icon: Icons.graphic_eq_rounded,
              title: 'High-Definition Audio',
              subtitle: 'Enhanced noise suppression for crystal clear voice calls',
              value: _hdVoice,
              onChanged: (v) => setState(() => _hdVoice = v),
            ),
            const Divider(height: 1),
            SettingsSwitchTile(
              icon: Icons.monetization_on_outlined,
              title: 'Low Coin Warning Prompt',
              subtitle: 'Alert when wallet has less than 2 minutes of talk-time',
              value: _lowCoinAlert,
              onChanged: (v) => setState(() => _lowCoinAlert = v),
            ),
          ],
        ),
        SettingsSectionCard(
          title: 'DISCOVERY & MATCHING',
          children: [
            SettingsSwitchTile(
              icon: Icons.filter_alt_outlined,
              title: 'Auto-prioritize Online Hosts',
              subtitle: 'Automatically place active verified hosts at the top of Discover',
              value: _autoFilterOffline,
              onChanged: (v) => setState(() => _autoFilterOffline = v),
            ),
            const Divider(height: 1),
            SettingsSwitchTile(
              icon: Icons.do_not_disturb_on_outlined,
              title: 'Do Not Disturb Mode',
              subtitle: 'Silence incoming call rings during quiet hours',
              value: _doNotDisturb,
              onChanged: (v) => setState(() => _doNotDisturb = v),
            ),
          ],
        ),
      ],
    );
  }
}

/// D. Privacy & Safety Page (User)
class UserPrivacySafetyPage extends StatefulWidget {
  const UserPrivacySafetyPage({super.key});

  @override
  State<UserPrivacySafetyPage> createState() => _UserPrivacySafetyPageState();
}

class _UserPrivacySafetyPageState extends State<UserPrivacySafetyPage> {
  bool _hideOnlineStatus = false;
  bool _hideFromSearch = false;
  bool _readReceipts = true;

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Privacy & Safety',
      subtitle: 'Manage your visibility and caller security',
      children: [
        // Security Guarantee Banner
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFEDE9FE),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.3)),
          ),
          child: const Row(
            children: [
              Icon(Icons.lock_outline_rounded, color: Color(0xFF6D28D9), size: 24),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '100% Anonymous Voice Encryption',
                      style: TextStyle(
                        color: Color(0xFF5B21B6),
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Your real phone number is never shared with hosts or third parties.',
                      style: TextStyle(color: Color(0xFF6D28D9), fontSize: 11.5),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        SettingsSectionCard(
          title: 'VISIBILITY CONTROLS',
          children: [
            SettingsSwitchTile(
              icon: Icons.visibility_off_outlined,
              title: 'Incognito Mode (Hide Online Status)',
              subtitle: 'Do not broadcast when you are browsing the Discover lounge',
              value: _hideOnlineStatus,
              onChanged: (v) => setState(() => _hideOnlineStatus = v),
            ),
            const Divider(height: 1),
            SettingsSwitchTile(
              icon: Icons.search_off_rounded,
              title: 'Hide Profile from Public Search',
              subtitle: 'Only hosts you call can view your member nickname',
              value: _hideFromSearch,
              onChanged: (v) => setState(() => _hideFromSearch = v),
            ),
            const Divider(height: 1),
            SettingsSwitchTile(
              icon: Icons.done_all_rounded,
              title: 'Read Receipts & Session Confirmations',
              subtitle: 'Share call duration summaries after each conversation',
              value: _readReceipts,
              onChanged: (v) => setState(() => _readReceipts = v),
            ),
          ],
        ),

        SettingsSectionCard(
          title: 'ACCOUNT ACTIONS',
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.block_flipped, size: 18, color: FriendooUiColors.ink),
              ),
              title: const Text('Blocked Accounts', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5)),
              subtitle: const Text('Manage hosts or users you have blocked', style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(builder: (_) => const UserBlockedUsersPage()),
                );
              },
            ),
          ],
        ),
      ],
    );
  }
}

/// E. Blocked Users Page
class UserBlockedUsersPage extends StatefulWidget {
  const UserBlockedUsersPage({super.key});

  @override
  State<UserBlockedUsersPage> createState() => _UserBlockedUsersPageState();
}

class _UserBlockedUsersPageState extends State<UserBlockedUsersPage> {
  final List<Map<String, String>> _blockedList = [
    {'name': 'Rhea K', 'city': 'Mumbai', 'date': '12 May 2026'},
    {'name': 'Sneha M', 'city': 'Pune', 'date': '28 Apr 2026'},
  ];

  void _unblock(int index) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Unblock User?', style: TextStyle(fontWeight: FontWeight.w900)),
        content: Text('Are you sure you want to unblock ${_blockedList[index]['name']}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF6B7280))),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: FriendooUiColors.pink),
            onPressed: () {
              setState(() => _blockedList.removeAt(index));
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('User unblocked successfully.')),
              );
            },
            child: const Text('Unblock'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Blocked Users',
      subtitle: 'Accounts prevented from calling or contacting you',
      children: [
        if (_blockedList.isEmpty)
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: const Column(
              children: [
                Icon(Icons.shield_outlined, size: 48, color: Color(0xFF10B981)),
                SizedBox(height: 12),
                Text('No Blocked Accounts', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                SizedBox(height: 4),
                Text('You have not blocked any users. Your blocklist is clear.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF6B7280), fontSize: 13)),
              ],
            ),
          )
        else
          SettingsSectionCard(
            title: 'BLOCKED ACCOUNTS (${_blockedList.length})',
            children: _blockedList.asMap().entries.map((entry) {
              final idx = entry.key;
              final item = entry.value;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: const Color(0xFFF3F4F6),
                      child: Text(item['name']![0], style: const TextStyle(fontWeight: FontWeight.w900, color: FriendooUiColors.ink)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item['name']!, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5)),
                          Text('Blocked on ${item['date']} • ${item['city']}', style: const TextStyle(color: Color(0xFF6B7280), fontSize: 11.5)),
                        ],
                      ),
                    ),
                    OutlinedButton(
                      onPressed: () => _unblock(idx),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        side: const BorderSide(color: Color(0xFFD1D5DB)),
                      ),
                      child: const Text('Unblock', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: FriendooUiColors.ink)),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
      ],
    );
  }
}

/// F. Notification Settings Page
class UserNotificationSettingsPage extends StatefulWidget {
  const UserNotificationSettingsPage({super.key});

  @override
  State<UserNotificationSettingsPage> createState() => _UserNotificationSettingsPageState();
}

class _UserNotificationSettingsPageState extends State<UserNotificationSettingsPage> {
  bool _pushNotifications = true;
  bool _callRinging = true;
  bool _coinAlerts = true;
  bool _promotionalOffers = false;

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Notification Settings',
      subtitle: 'Customize push notifications and alert sounds',
      children: [
        SettingsSectionCard(
          title: 'CALL & MESSAGE ALERTS',
          children: [
            SettingsSwitchTile(
              icon: Icons.notifications_active_outlined,
              title: 'Push Notifications',
              subtitle: 'Receive alerts when hosts become available',
              value: _pushNotifications,
              onChanged: (v) => setState(() => _pushNotifications = v),
            ),
            const Divider(height: 1),
            SettingsSwitchTile(
              icon: Icons.ring_volume_outlined,
              title: 'Incoming Call Ringtone & Vibration',
              subtitle: 'Sound audio ring when a direct voice lounge session starts',
              value: _callRinging,
              onChanged: (v) => setState(() => _callRinging = v),
            ),
          ],
        ),
        SettingsSectionCard(
          title: 'ACCOUNT & PROMOTIONS',
          children: [
            SettingsSwitchTile(
              icon: Icons.account_balance_wallet_outlined,
              title: 'Coin & Wallet Low Balance Alerts',
              subtitle: 'Get notified when your coin balance drops below 20 coins',
              value: _coinAlerts,
              onChanged: (v) => setState(() => _coinAlerts = v),
            ),
            const Divider(height: 1),
            SettingsSwitchTile(
              icon: Icons.local_offer_outlined,
              title: 'Discount Offers & Free Bonus Coins',
              subtitle: 'Occasional promotional alerts for coin recharge packages',
              value: _promotionalOffers,
              onChanged: (v) => setState(() => _promotionalOffers = v),
            ),
          ],
        ),
      ],
    );
  }
}

/// G. Help & Support Page
class HelpSupportPage extends StatelessWidget {
  const HelpSupportPage({super.key, this.isHost = false});

  final bool isHost;

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Help & Support',
      subtitle: '24/7 Assistance, Safety & Guides',
      children: [
        // 24/7 Support Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
            ),
            borderRadius: BorderRadius.circular(22),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.support_agent_rounded, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Friendoo Care Team', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
                    SizedBox(height: 2),
                    Text('Dedicated 24/7 caller safety and support assistance across India.', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        SettingsSectionCard(
          title: 'CONTACT CHANNELS',
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF25D366)),
              title: const Text('WhatsApp Support (Fastest)', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5)),
              subtitle: const Text('Connect with a live support agent in < 2 mins', style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
              trailing: const Icon(Icons.arrow_forward_rounded, size: 18),
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Opening WhatsApp Support...')),
                );
              },
            ),
            const Divider(height: 1),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.mail_outline_rounded, color: FriendooUiColors.blue),
              title: const Text('Email Support', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5)),
              subtitle: const Text('support@friendoo.app (Replies in 4 hours)', style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
              trailing: const Icon(Icons.arrow_forward_rounded, size: 18),
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Email support: support@friendoo.app')),
                );
              },
            ),
          ],
        ),

        SettingsSectionCard(
          title: 'FREQUENTLY ASKED QUESTIONS',
          children: const [
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text('Are voice calls anonymous?', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
              children: [
                Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text('Yes, 100%. Calls are routed through encrypted WebRTC audio streams without exposing your real phone number or SIM details.', style: TextStyle(color: Color(0xFF4B5563), fontSize: 13, height: 1.4)),
                ),
              ],
            ),
            Divider(height: 1),
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text('How do coin deductions work?', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
              children: [
                Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text('Coins are billed strictly by the minute while connected. If a call drops or fails, unspent coins remain safely in your vault balance.', style: TextStyle(color: Color(0xFF4B5563), fontSize: 13, height: 1.4)),
                ),
              ],
            ),
            Divider(height: 1),
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text('How to report harassment or abuse?', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
              children: [
                Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text('You can click the Report button on any call history card or contact our 24/7 trust & safety team directly. Reported accounts are reviewed within 15 minutes.', style: TextStyle(color: Color(0xFF4B5563), fontSize: 13, height: 1.4)),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }
}

/// H. About Friendoo Page
class AboutFriendooPage extends StatelessWidget {
  const AboutFriendooPage({super.key, this.isHost = false});

  final bool isHost;

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'About Friendoo',
      subtitle: 'App version, legal policies & licenses',
      children: [
        Center(
          child: Column(
            children: [
              const FriendooLogo(fontSize: 32),
              const SizedBox(height: 6),
              const Text(
                'Real Voice Connections Across India',
                style: TextStyle(color: Color(0xFF6B7280), fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(99),
                ),
                child: const Text(
                  'Version 1.4.2 (Build 240)',
                  style: TextStyle(color: FriendooUiColors.ink, fontSize: 11.5, fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        SettingsSectionCard(
          title: 'LEGAL & COMPLIANCE',
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.description_outlined, color: FriendooUiColors.ink),
              title: const Text('Terms of Service', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5)),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const FriendooDocumentViewerPage(
                      title: 'Terms of Service',
                      content: 'Welcome to Friendoo. By accessing or using our voice connection platform, you agree to comply with our Terms of Service, user safety policies, and anti-harassment rules. Coin balances are non-transferable outside the app and valid for active audio calling sessions with verified hosts.',
                    ),
                  ),
                );
              },
            ),
            const Divider(height: 1),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.privacy_tip_outlined, color: FriendooUiColors.ink),
              title: const Text('Privacy Policy', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5)),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const FriendooDocumentViewerPage(
                      title: 'Privacy Policy',
                      content: 'Friendoo values caller privacy above all else. We do not record private 1-on-1 audio calls unless flagged for severe safety investigations. Personal identifiers and phone numbers are encrypted end-to-end and never disclosed to other users.',
                    ),
                  ),
                );
              },
            ),
            const Divider(height: 1),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.handshake_outlined, color: FriendooUiColors.ink),
              title: const Text('Community Guidelines', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5)),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const FriendooDocumentViewerPage(
                      title: 'Community Guidelines',
                      content: '1. Treat everyone with dignity and respect.\n2. No harassment, hate speech, or inappropriate solicitation.\n3. Keep transactions strictly on Friendoo.\n4. Protect personal privacy—do not share bank numbers, home addresses, or credentials.',
                    ),
                  ),
                );
              },
            ),
            const Divider(height: 1),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.code_rounded, color: FriendooUiColors.ink),
              title: const Text('Open Source Licenses', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5)),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => showLicensePage(context: context),
            ),
          ],
        ),
        const Center(
          child: Text(
            'Made with ❤️ in India • Friendoo Technologies Pvt Ltd',
            style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11.5, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

/// Generic Document Viewer Page
class FriendooDocumentViewerPage extends StatelessWidget {
  const FriendooDocumentViewerPage({
    super.key,
    required this.title,
    required this.content,
  });

  final String title;
  final String content;

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: title,
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Text(
            content,
            style: const TextStyle(
              color: Color(0xFF374151),
              fontSize: 14.5,
              height: 1.6,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}

// ============================================================================
// 2. FEMALE HOST — DEDICATED PAGES
// ============================================================================

/// A. Edit Host Profile Page (Female Host)
class EditHostProfilePage extends ConsumerStatefulWidget {
  const EditHostProfilePage({super.key});

  @override
  ConsumerState<EditHostProfilePage> createState() => _EditHostProfilePageState();
}

class _EditHostProfilePageState extends ConsumerState<EditHostProfilePage> {
  late TextEditingController _nameController;
  late TextEditingController _ageController;
  late TextEditingController _bioController;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: 'Priya Sharma');
    _ageController = TextEditingController(text: '24');
    _bioController = TextEditingController(
      text: 'Verified Star Host on Friendoo. Always happy to talk about cinema, everyday life, and listen with an open heart.',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ageController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _saveChanges() async {
    setState(() => _isSaving = true);
    await ref.read(profileRepositoryProvider).updateDisplayName(_nameController.text.trim());
    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;
    setState(() => _isSaving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: Color(0xFF10B981),
        content: Text('Host profile updated successfully!'),
      ),
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Edit Host Profile',
      subtitle: 'Update your verified female host identity',
      bottomAction: SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: _isSaving ? null : _saveChanges,
          style: FilledButton.styleFrom(
            backgroundColor: FriendooUiColors.pink,
            padding: const EdgeInsets.symmetric(vertical: 15),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: _isSaving
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                )
              : const Text('Save Host Profile', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
        ),
      ),
      children: [
        // Female Avatar Preview
        Center(
          child: Column(
            children: [
              Stack(
                children: [
                  DesiFemaleAvatar(seed: _nameController.text, age: 24, isStar: true, size: 96),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(
                        color: FriendooUiColors.pink,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 16),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Text(
                'Indian Female Host Avatar (Star Verified)',
                style: TextStyle(color: Color(0xFF6B7280), fontSize: 12.5, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        SettingsSectionCard(
          title: 'HOST PUBLIC PROFILE',
          children: [
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Host Display Name',
                prefixIcon: Icon(Icons.person_outline_rounded),
                border: InputBorder.none,
              ),
            ),
            const Divider(height: 1),
            TextField(
              controller: _ageController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Age',
                prefixIcon: Icon(Icons.cake_outlined),
                border: InputBorder.none,
              ),
            ),
            const Divider(height: 1),
            TextField(
              controller: _bioController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Voice Lounge Introduction',
                prefixIcon: Icon(Icons.record_voice_over_outlined),
                border: InputBorder.none,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// C. Host Information Page
class HostInformationPage extends StatefulWidget {
  const HostInformationPage({super.key});

  @override
  State<HostInformationPage> createState() => _HostInformationPageState();
}

class _HostInformationPageState extends State<HostInformationPage> {
  final _professionController = TextEditingController(text: 'Voice Artist & Radio Anchor');
  final _educationController = TextEditingController(text: 'Postgraduate in Media & Communication');
  final Set<String> _selectedHobbies = {'Music', 'Cinema', 'Travel', 'Literature', 'Cooking'};

  final List<String> _availableHobbies = [
    'Music', 'Cinema', 'Travel', 'Literature', 'Cooking', 'Art & Design',
    'Tech & Gadgets', 'Gaming', 'Fitness', 'Philosophy', 'Podcasting'
  ];

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Host Information',
      subtitle: 'Profession, education & interests',
      bottomAction: SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                backgroundColor: Color(0xFF10B981),
                content: Text('Host information saved!'),
              ),
            );
            Navigator.of(context).pop();
          },
          style: FilledButton.styleFrom(
            backgroundColor: FriendooUiColors.pink,
            padding: const EdgeInsets.symmetric(vertical: 15),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: const Text('Save Information', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
        ),
      ),
      children: [
        SettingsSectionCard(
          title: 'BACKGROUND',
          children: [
            TextField(
              controller: _professionController,
              decoration: const InputDecoration(
                labelText: 'Profession / Vocation',
                prefixIcon: Icon(Icons.work_outline_rounded),
                border: InputBorder.none,
              ),
            ),
            const Divider(height: 1),
            TextField(
              controller: _educationController,
              decoration: const InputDecoration(
                labelText: 'Education',
                prefixIcon: Icon(Icons.school_outlined),
                border: InputBorder.none,
              ),
            ),
          ],
        ),

        SettingsSectionCard(
          title: 'INTERESTS & TOPICS',
          children: [
            const Text(
              'Select the topics callers love discussing with you:',
              style: TextStyle(color: Color(0xFF6B7280), fontSize: 13),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _availableHobbies.map((hobby) {
                final isSelected = _selectedHobbies.contains(hobby);
                return FilterChip(
                  label: Text(hobby),
                  selected: isSelected,
                  selectedColor: FriendooUiColors.softPink,
                  labelStyle: TextStyle(
                    color: isSelected ? FriendooUiColors.pink : FriendooUiColors.ink,
                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  ),
                  onSelected: (val) {
                    setState(() {
                      if (val) {
                        _selectedHobbies.add(hobby);
                      } else {
                        _selectedHobbies.remove(hobby);
                      }
                    });
                  },
                );
              }).toList(),
            ),
          ],
        ),
      ],
    );
  }
}

/// D. Payout & Bank Details Page (Host)
class HostPayoutBankDetailsPage extends StatefulWidget {
  const HostPayoutBankDetailsPage({super.key});

  @override
  State<HostPayoutBankDetailsPage> createState() => _HostPayoutBankDetailsPageState();
}

class _HostPayoutBankDetailsPageState extends State<HostPayoutBankDetailsPage> {
  final _upiController = TextEditingController(text: 'priya.sharma@okaxis');
  final _accountHolderController = TextEditingController(text: 'Priya Sharma');
  final _bankNameController = TextEditingController(text: 'HDFC Bank');
  final _accountNumberController = TextEditingController(text: '•••• •••• 4829');
  final _ifscController = TextEditingController(text: 'HDFC0001234');
  bool _isEditing = false;

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Payout & Bank Details',
      subtitle: 'Settlements, UPI ID and bank accounts',
      bottomAction: SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: () {
            setState(() => _isEditing = !_isEditing);
            if (!_isEditing) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  backgroundColor: Color(0xFF10B981),
                  content: Text('Payout information updated!'),
                ),
              );
            }
          },
          style: FilledButton.styleFrom(
            backgroundColor: _isEditing ? const Color(0xFF10B981) : FriendooUiColors.pink,
            padding: const EdgeInsets.symmetric(vertical: 15),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: Text(
            _isEditing ? 'Save Bank Details' : 'Edit Payout Account',
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
          ),
        ),
      ),
      children: [
        // Payout Cycle Notice
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFECFDF5),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
          ),
          child: const Row(
            children: [
              Icon(Icons.event_available_rounded, color: Color(0xFF047857), size: 24),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Weekly Automated Payouts', style: TextStyle(color: Color(0xFF047857), fontWeight: FontWeight.w900, fontSize: 14)),
                    SizedBox(height: 2),
                    Text('Earnings are disbursed every Monday directly to your registered UPI / Bank account.', style: TextStyle(color: Color(0xFF065F46), fontSize: 11.5)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        SettingsSectionCard(
          title: 'UPI DETAILS (RECOMMENDED)',
          children: [
            TextField(
              controller: _upiController,
              enabled: _isEditing,
              decoration: const InputDecoration(
                labelText: 'UPI Virtual Payment Address (VPA)',
                prefixIcon: Icon(Icons.qr_code_rounded),
                helperText: 'Instant direct deposits to GPay, PhonePe or Paytm',
                border: InputBorder.none,
              ),
            ),
          ],
        ),

        SettingsSectionCard(
          title: 'BANK ACCOUNT (DIRECT TRANSFER)',
          children: [
            TextField(
              controller: _accountHolderController,
              enabled: _isEditing,
              decoration: const InputDecoration(
                labelText: 'Account Holder Name',
                prefixIcon: Icon(Icons.person_outline_rounded),
                border: InputBorder.none,
              ),
            ),
            const Divider(height: 1),
            TextField(
              controller: _bankNameController,
              enabled: _isEditing,
              decoration: const InputDecoration(
                labelText: 'Bank Name',
                prefixIcon: Icon(Icons.account_balance_outlined),
                border: InputBorder.none,
              ),
            ),
            const Divider(height: 1),
            TextField(
              controller: _accountNumberController,
              enabled: _isEditing,
              decoration: const InputDecoration(
                labelText: 'Account Number (Masked)',
                prefixIcon: Icon(Icons.credit_card_rounded),
                border: InputBorder.none,
              ),
            ),
            const Divider(height: 1),
            TextField(
              controller: _ifscController,
              enabled: _isEditing,
              decoration: const InputDecoration(
                labelText: 'IFSC Code',
                prefixIcon: Icon(Icons.pin_rounded),
                border: InputBorder.none,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// E. Call & Earnings Preferences Page (Host)
class HostCallEarningsPreferencesPage extends StatefulWidget {
  const HostCallEarningsPreferencesPage({super.key});

  @override
  State<HostCallEarningsPreferencesPage> createState() => _HostCallEarningsPreferencesPageState();
}

class _HostCallEarningsPreferencesPageState extends State<HostCallEarningsPreferencesPage> {
  int _ratePerMinute = 5;
  bool _autoAcceptVip = true;
  bool _milestoneAlerts = true;
  bool _shortCallProtection = true;

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Call & Earnings Preferences',
      subtitle: 'Audio call rates & priority settings',
      bottomAction: SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                backgroundColor: Color(0xFF10B981),
                content: Text('Host call preferences saved!'),
              ),
            );
            Navigator.of(context).pop();
          },
          style: FilledButton.styleFrom(
            backgroundColor: FriendooUiColors.pink,
            padding: const EdgeInsets.symmetric(vertical: 15),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: const Text('Save Preferences', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
        ),
      ),
      children: [
        SettingsSectionCard(
          title: 'AUDIO CALL RATE',
          children: [
            const Text(
              'Set your earning rate per voice minute. Verified Star Hosts can adjust rates based on caller demand:',
              style: TextStyle(color: Color(0xFF6B7280), fontSize: 13),
            ),
            const SizedBox(height: 14),
            Row(
              children: [5, 7, 10].map((rate) {
                final isSelected = _ratePerMinute == rate;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: InkWell(
                      onTap: () => setState(() => _ratePerMinute = rate),
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: isSelected ? FriendooUiColors.ink : const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isSelected ? FriendooUiColors.ink : const Color(0xFFE5E7EB),
                          ),
                        ),
                        child: Column(
                          children: [
                            Text(
                              '₹$rate / min',
                              style: TextStyle(
                                color: isSelected ? Colors.white : FriendooUiColors.ink,
                                fontWeight: FontWeight.w900,
                                fontSize: 15,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              rate == 5 ? 'Standard' : (rate == 7 ? 'Popular' : 'VIP Star'),
                              style: TextStyle(
                                color: isSelected ? const Color(0xFFFFD166) : const Color(0xFF6B7280),
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),

        SettingsSectionCard(
          title: 'EARNINGS & SECURITY PREFERENCES',
          children: [
            SettingsSwitchTile(
              icon: Icons.star_rounded,
              title: 'Auto-Accept VIP Callers',
              subtitle: 'Prioritize incoming requests from repeat verified callers',
              value: _autoAcceptVip,
              onChanged: (v) => setState(() => _autoAcceptVip = v),
            ),
            const Divider(height: 1),
            SettingsSwitchTile(
              icon: Icons.trending_up_rounded,
              title: 'Earnings Milestone Alerts',
              subtitle: 'Celebratory notification when reaching ₹500, ₹1000 daily milestones',
              value: _milestoneAlerts,
              onChanged: (v) => setState(() => _milestoneAlerts = v),
            ),
            const Divider(height: 1),
            SettingsSwitchTile(
              icon: Icons.shield_outlined,
              title: 'Short Call Protection',
              subtitle: 'Automatically flag and credit calls disconnected under 15 seconds due to network glitches',
              value: _shortCallProtection,
              onChanged: (v) => setState(() => _shortCallProtection = v),
            ),
          ],
        ),
      ],
    );
  }
}

/// F. Performance Insights Page (Host)
class HostPerformanceInsightsPage extends StatelessWidget {
  const HostPerformanceInsightsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Performance Insights',
      subtitle: 'Analytics, caller ratings & duration trends',
      children: [
        // Top 4 High-Level Metrics
        Row(
          children: [
            Expanded(
              child: _MetricTile(
                label: 'Overall Rating',
                value: '⭐ 4.9',
                sub: '142 reviews',
                tint: const Color(0xFFFEF3C7),
                textColor: const Color(0xFFB45309),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _MetricTile(
                label: 'Total Calls',
                value: '150+',
                sub: 'Sessions done',
                tint: const Color(0xFFEDE9FE),
                textColor: const Color(0xFF6D28D9),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _MetricTile(
                label: 'Profile Views',
                value: '1,420',
                sub: 'This month',
                tint: const Color(0xFFE0F2FE),
                textColor: const Color(0xFF0369A1),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _MetricTile(
                label: 'Avg Duration',
                value: '11m 45s',
                sub: 'Per caller',
                tint: const Color(0xFFECFDF5),
                textColor: const Color(0xFF047857),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        SettingsSectionCard(
          title: 'PEAK CALLING HOURS',
          children: const [
            _PeakHourBar(time: '7:00 PM – 11:00 PM', percentage: 65, label: 'Highest Traffic (Prime Time)'),
            SizedBox(height: 10),
            _PeakHourBar(time: '2:00 PM – 6:00 PM', percentage: 22, label: 'Moderate Traffic'),
            SizedBox(height: 10),
            _PeakHourBar(time: '10:00 AM – 1:00 PM', percentage: 13, label: 'Morning Calls'),
          ],
        ),

        SettingsSectionCard(
          title: 'CALLER FEEDBACK HIGHLIGHTS',
          children: const [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _FeedbackBadge(label: '🌟 Sweet Voice (89)', count: '89'),
                _FeedbackBadge(label: '👂 Great Listener (74)', count: '74'),
                _FeedbackBadge(label: '😊 Friendly & Warm (68)', count: '68'),
                _FeedbackBadge(label: '✨ Highly Engaging (52)', count: '52'),
              ],
            ),
          ],
        ),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.label,
    required this.value,
    required this.sub,
    required this.tint,
    required this.textColor,
  });

  final String label;
  final String value;
  final String sub;
  final Color tint;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: tint,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: textColor.withOpacity(0.8), fontSize: 11.5, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(color: textColor, fontSize: 20, fontWeight: FontWeight.w900)),
          const SizedBox(height: 2),
          Text(sub, style: TextStyle(color: textColor.withOpacity(0.7), fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _PeakHourBar extends StatelessWidget {
  const _PeakHourBar({
    required this.time,
    required this.percentage,
    required this.label,
  });

  final String time;
  final int percentage;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(time, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: FriendooUiColors.ink)),
            Text('$percentage%', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: FriendooUiColors.pink)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: LinearProgressIndicator(
            value: percentage / 100,
            backgroundColor: const Color(0xFFF3F4F6),
            valueColor: const AlwaysStoppedAnimation<Color>(FriendooUiColors.pink),
            minHeight: 6,
          ),
        ),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 11)),
      ],
    );
  }
}

class _FeedbackBadge extends StatelessWidget {
  const _FeedbackBadge({required this.label, required this.count});

  final String label;
  final String count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Text(
        label,
        style: const TextStyle(color: FriendooUiColors.ink, fontSize: 12.5, fontWeight: FontWeight.w800),
      ),
    );
  }
}

/// F. Dedicated Full-Screen Host Withdrawal Page
class HostWithdrawalPage extends ConsumerStatefulWidget {
  const HostWithdrawalPage({
    super.key,
    this.availableAmount = 5240,
  });

  final int availableAmount;

  @override
  ConsumerState<HostWithdrawalPage> createState() => _HostWithdrawalPageState();
}

class _HostWithdrawalPageState extends ConsumerState<HostWithdrawalPage> {
  final _amountController = TextEditingController();
  final _upiController = TextEditingController(text: 'priya.sharma@okaxis');
  int _selectedMethodIndex = 0; // 0: UPI, 1: Bank Account
  bool _isSubmitting = false;
  late final String _idempotencyKey;

  @override
  void initState() {
    super.initState();
    _amountController.text = widget.availableAmount.toString();
    _idempotencyKey = 'payout_${DateTime.now().millisecondsSinceEpoch}_${(1000 + (DateTime.now().microsecond % 9000))}';
  }

  @override
  void dispose() {
    _amountController.dispose();
    _upiController.dispose();
    super.dispose();
  }

  void _submitWithdrawal() async {
    final amount = int.tryParse(_amountController.text.trim()) ?? 0;
    if (amount < 500) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFFDC2626),
          content: Text('Minimum withdrawal amount is ₹500.'),
        ),
      );
      return;
    }
    if (amount > widget.availableAmount) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFFDC2626),
          content: Text('Amount cannot exceed your available withdrawal balance.'),
        ),
      );
      return;
    }

    if (_selectedMethodIndex == 0 && _upiController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFFDC2626),
          content: Text('Please provide a valid UPI ID for payout.'),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final payoutMethodType = _selectedMethodIndex == 0 ? 'upi' : 'bank_account';
      final payoutDetails = _selectedMethodIndex == 0
          ? {'upi_id': _upiController.text.trim()}
          : {
              'bank_name': 'HDFC Bank',
              'account_number_masked': '•••• •••• 4829',
              'ifsc_code': 'HDFC0001234',
            };

      final result = await ref.read(walletRepositoryProvider).requestHostWithdrawal(
            amountInr: amount,
            payoutMethodType: payoutMethodType,
            payoutDetails: payoutDetails,
            idempotencyKey: _idempotencyKey,
          );

      if (!mounted) return;

      if (result.success) {
        ref.invalidate(hostDashboardStatsProvider);
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text(
              result.isDuplicate
                  ? 'Withdrawal request already recorded.'
                  : 'Withdrawal request for ₹$amount submitted successfully.',
            ),
          ),
        );
      } else {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text(result.errorMessage ?? 'Failed to submit withdrawal request.'),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFFDC2626),
          content: Text('An unexpected error occurred: ${e.toString()}'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Withdraw Earnings',
      subtitle: 'Transfer funds to your registered payout account',
      bottomAction: SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: _isSubmitting ? null : _submitWithdrawal,
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFF10B981),
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: _isSubmitting
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2.5,
                  ),
                )
              : const Text(
                  'Confirm Withdrawal',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                  ),
                ),
        ),
      ),
      children: [
        // 1. Available Balance Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFFE5E7EB)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'AVAILABLE FOR WITHDRAWAL',
                style: TextStyle(
                  color: FriendooUiColors.muted,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '₹${widget.availableAmount.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}',
                style: const TextStyle(
                  color: FriendooUiColors.ink,
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.6,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Minimum withdrawal limit: ₹500',
                style: TextStyle(
                  color: FriendooUiColors.muted,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // 2. Withdrawal Amount Card
        SettingsSectionCard(
          title: 'ENTER WITHDRAWAL AMOUNT',
          children: [
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 22,
                color: FriendooUiColors.ink,
              ),
              decoration: const InputDecoration(
                prefixText: '₹ ',
                prefixStyle: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 22,
                  color: FriendooUiColors.ink,
                ),
                hintText: '500',
                border: InputBorder.none,
              ),
            ),
            const Divider(height: 1),
            const SizedBox(height: 12),
            Row(
              children: [
                ...[500, 1000, 2500].map((preset) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ActionChip(
                      label: Text('₹$preset'),
                      labelStyle: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                      ),
                      onPressed: () =>
                          setState(() => _amountController.text = '$preset'),
                    ),
                  );
                }),
                ActionChip(
                  label: const Text('All'),
                  labelStyle: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                  ),
                  onPressed: () => setState(
                    () => _amountController.text = '${widget.availableAmount}',
                  ),
                ),
              ],
            ),
          ],
        ),

        // 3. Payout Destination Card
        SettingsSectionCard(
          title: 'PAYOUT DESTINATION',
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(
                Icons.qr_code_rounded,
                color: FriendooUiColors.blue,
              ),
              title: const Text(
                'UPI Virtual Payment Address',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
              ),
              subtitle: Text(
                _upiController.text,
                style: const TextStyle(fontSize: 12, color: FriendooUiColors.muted),
              ),
              trailing: Radio<int>(
                value: 0,
                groupValue: _selectedMethodIndex,
                activeColor: FriendooUiColors.blue,
                onChanged: (val) =>
                    setState(() => _selectedMethodIndex = val ?? 0),
              ),
            ),
            const Divider(height: 1),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(
                Icons.account_balance_outlined,
                color: FriendooUiColors.ink,
              ),
              title: const Text(
                'Bank Account (Direct Transfer)',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
              ),
              subtitle: const Text(
                'HDFC Bank •••• 4829',
                style: TextStyle(fontSize: 12, color: FriendooUiColors.muted),
              ),
              trailing: Radio<int>(
                value: 1,
                groupValue: _selectedMethodIndex,
                activeColor: FriendooUiColors.blue,
                onChanged: (val) =>
                    setState(() => _selectedMethodIndex = val ?? 1),
              ),
            ),
          ],
        ),

        // Link to manage bank accounts
        TextButton.icon(
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const HostPayoutBankDetailsPage(),
              ),
            );
          },
          icon: const Icon(Icons.settings_outlined, size: 16),
          label: const Text(
            'Edit Payout & Bank Details',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
          ),
          style: TextButton.styleFrom(
            foregroundColor: FriendooUiColors.blue,
          ),
        ),
      ],
    );
  }
}

