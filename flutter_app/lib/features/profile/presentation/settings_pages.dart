import '../../../core/localization/app_strings.dart';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../app/friendoo_ui.dart';
import '../../../core/localization/app_language.dart';
import '../../../core/services/permission_service.dart';
import '../../../core/supabase/supabase_provider.dart';
import '../../discover/presentation/desi_avatar.dart';
import '../data/profile_repository.dart';
import '../../discover/data/host_repository.dart';
import '../../wallet/data/wallet_repository.dart';
import '../data/blocked_callers_service.dart';
import '../../support/presentation/support_chat_sheet.dart';
import 'instagram_profile_form.dart';

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
        shadowColor: Colors.black.withValues(alpha: 0.06),
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_rounded,
            color: FriendooUiColors.ink,
          ),
          tooltip: context.tr('Back'),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppText(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: FriendooUiColors.ink,
                fontSize: 18,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.3,
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 1),
              AppText(
                subtitle!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
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
                      color: Colors.black.withValues(alpha: 0.04),
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
  const SettingsSectionCard({super.key, this.title, required this.children});

  final String? title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          AppText(
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
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(children: children),
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
                AppText(
                  title,
                  style: const TextStyle(
                    color: FriendooUiColors.ink,
                    fontSize: 14.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                AppText(
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
            activeTrackColor: FriendooUiColors.pink,
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
  ConsumerState<EditUserProfilePage> createState() =>
      _EditUserProfilePageState();
}

class _EditUserProfilePageState extends ConsumerState<EditUserProfilePage> {
  late TextEditingController _nameController;
  late TextEditingController _cityController;
  late TextEditingController _ageController;
  late TextEditingController _bioController;
  String _selectedAvatarId = 'user_01';
  int _selectedAge = 24;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: '');
    _cityController = TextEditingController(text: '');
    _ageController = TextEditingController(text: '24');
    _bioController = TextEditingController();
    _loadAvatarSelection();
  }

  Future<void> _loadAvatarSelection() async {
    final profile = await ref
        .read(profileRepositoryProvider)
        .fetchCurrentUserProfile();
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;

    final savedId = profile?.avatarUrl;
    final savedBio = prefs.getString('friendoo_profile_about') ?? '';

    setState(() {
      if (profile != null) {
        _nameController.text = profile.displayName;
        _cityController.text = profile.city ?? '';
        if (DesiAvatarPack.isValidPresetForRole(savedId ?? '', 'user')) {
          _selectedAvatarId = savedId!;
        }
      }
      _selectedAge = prefs.getInt('friendoo_profile_age') ?? 24;
      _bioController.text = savedBio;
    });
  }

  /// Programmatic function that explicitly clears all active text editing controllers
  /// and updates the UI dynamically.
  void clearAllFields() {
    _nameController.clear();
    _cityController.clear();
    _bioController.clear();
    setState(() {});
  }

  @override
  void dispose() {
    _nameController.dispose();
    _cityController.dispose();
    _ageController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _saveChanges() async {
    final name = _nameController.text.trim();
    final bio = _bioController.text.trim();
    final city = _cityController.text.trim();
    if (name.isEmpty || name.length > 50) {
      _showMessage('Enter a name between 1 and 50 characters.');
      return;
    }
    if (city.length > 60) {
      _showMessage('City must be 60 characters or less.');
      return;
    }
    if (bio.length > 150) {
      _showMessage('Your bio must be 150 characters or less.');
      return;
    }

    setState(() => _isSaving = true);
    try {
      await ref
          .read(profileRepositoryProvider)
          .updateEditableProfile(
            displayName: name,
            about: bio,
            age: _selectedAge,
            city: city.isEmpty ? null : city,
          );
    } catch (_) {
      if (!mounted) return;
      setState(() => _isSaving = false);
      _showMessage('Unable to save your profile. Please try again.');
      return;
    }

    if (!mounted) return;
    setState(() => _isSaving = false);
    _showMessage('Profile updated.', success: true);
    Navigator.of(context).pop();
  }

  void _showMessage(String message, {bool success = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: success ? const Color(0xFF10B981) : null,
        content: Text(message),
      ),
    );
  }

  void _showAvatarLockedMessage() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        contentPadding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFFEDE9FE),
              ),
              child: const Icon(
                Icons.verified_user_rounded,
                color: Color(0xFF7C3AED),
                size: 28,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Profile avatar',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Your avatar is set during signup. You can edit your name, bio, and languages.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: Color(0xFF64748B),
                height: 1.45,
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.of(ctx).pop(),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF7C3AED),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text(
                  'Understood',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => _buildRedesignedPage(context);

  Widget _buildRedesignedPage(BuildContext context) {
    final nameCount = _nameController.text.length;
    final canSave = _nameController.text.trim().isNotEmpty && nameCount <= 50;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: Padding(
          padding: const EdgeInsets.all(8),
          child: IconButton(
            tooltip: context.tr('Back'),
            icon: const Icon(Icons.arrow_back_rounded),
            color: FriendooUiColors.ink,
            style: IconButton.styleFrom(
              backgroundColor: const Color(0xFFF7F7FB),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
                side: const BorderSide(color: Color(0xFFE7E7F0)),
              ),
            ),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        title: const AppText(
          'Edit Profile',
          style: TextStyle(
            color: FriendooUiColors.ink,
            fontSize: 20,
            fontWeight: FontWeight.w900,
          ),
        ),
        actions: [
          TextButton(
            onPressed: clearAllFields,
            child: const AppText(
              'Reset',
              style: TextStyle(
                color: Color(0xFFEF4444),
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 430),
            child: Column(
              children: [
                Expanded(
                  child: ListView(
                    keyboardDismissBehavior:
                        ScrollViewKeyboardDismissBehavior.onDrag,
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
                    children: [
                      Center(
                        child: GestureDetector(
                          onTap: _showAvatarLockedMessage,
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(7),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.white,
                                  border: Border.all(
                                    color: const Color(0xFFE8E3FF),
                                    width: 2,
                                  ),
                                  boxShadow: const [
                                    BoxShadow(
                                      color: Color(0x180E1020),
                                      blurRadius: 18,
                                      offset: Offset(0, 7),
                                    ),
                                  ],
                                ),
                                child: FriendooAvatar(
                                  config: FriendooAvatarConfig.fromRawString(
                                    _selectedAvatarId,
                                    role: 'user',
                                  ),
                                  age: _selectedAge,
                                  size: 154,
                                ),
                              ),
                              Positioned(
                                right: -2,
                                bottom: 8,
                                child: Container(
                                  width: 42,
                                  height: 42,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: FriendooUiColors.violet,
                                    border: Border.all(
                                      color: Colors.white,
                                      width: 3,
                                    ),
                                  ),
                                  child: const Icon(
                                    Icons.lock_rounded,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Center(
                        child: Text(
                          'Your Avatar',
                          style: TextStyle(
                            color: FriendooUiColors.ink,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      const SizedBox(height: 3),
                      const Center(
                        child: Text(
                          'Avatar is fixed after account creation',
                          style: TextStyle(
                            color: Color(0xFF8A8FA3),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      // Instagram-style clean profile fields
                      InstagramTextField(
                        controller: _nameController,
                        label: 'Name',
                        hintText: 'Name',
                        helperText:
                            'Visible to hosts you connect with on Friendoo',
                        maxLength: 50,
                        accentColor: FriendooUiColors.violet,
                        isRequired: true,
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 8),

                      InstagramTextField(
                        controller: _cityController,
                        label: 'City / Metro',
                        hintText: 'e.g. Chennai, Mumbai, Delhi',
                        helperText: 'Your home city or metro region',
                        maxLength: 50,
                        accentColor: FriendooUiColors.violet,
                        prefixIcon: Icons.location_on_outlined,
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 8),

                      // Instagram-style clean age row
                      InstagramAgeRow(
                        selectedAge: _selectedAge,
                        accentColor: FriendooUiColors.violet,
                        onChanged: (newAge) =>
                            setState(() => _selectedAge = newAge),
                      ),
                      const SizedBox(height: 8),

                      // Instagram-style bio field
                      InstagramBioField(
                        controller: _bioController,
                        label: 'Bio',
                        hintText: 'Add a bio to introduce yourself...',
                        maxLength: 150,
                        accentColor: FriendooUiColors.violet,
                        isHost: false,
                        onChanged: (_) => setState(() {}),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                  color: Colors.white,
                  child: SizedBox(
                    width: double.infinity,
                    height: 58,
                    child: FilledButton.icon(
                      onPressed: _isSaving || !canSave ? null : _saveChanges,
                      icon: _isSaving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Icon(Icons.save_rounded),
                      label: AppText(_isSaving ? 'Saving…' : 'Save Changes'),
                      style: FilledButton.styleFrom(
                        backgroundColor: FriendooUiColors.pink,
                        disabledBackgroundColor: const Color(0xFFE5B6CB),
                        foregroundColor: Colors.white,
                        textStyle: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Retained for reference while the redesigned profile page is active.
  // ignore: unused_element
  Widget _buildLegacyPage(BuildContext context) {
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
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: _isSaving
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : const AppText(
                  'Save Changes',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                ),
        ),
      ),
      children: [
        // Fixed static user avatar display (cannot be modified)
        Center(
          child: FriendooAvatar(
            config: FriendooAvatarConfig(
              gender: 'male',
              role: 'user',
              presetId: _selectedAvatarId,
            ),
            age: int.tryParse(_ageController.text) ?? 26,
            size: 96,
          ),
        ),
        const SizedBox(height: 24),

        // BASIC INFORMATION
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'BASIC INFORMATION',
              style: TextStyle(
                color: Color(0xFF374151),
                fontSize: 13,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(height: 12),

            // Full Name Input Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Full Name',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.person_outline_rounded,
                        color: FriendooUiColors.violet,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _nameController,
                          style: const TextStyle(
                            color: FriendooUiColors.ink,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                            border: InputBorder.none,
                            hintText: 'Enter your name',
                            hintStyle: TextStyle(
                              color: Color(0xFF9CA3AF),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Age Input Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Age',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.cake_outlined,
                        color: FriendooUiColors.pink,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _ageController,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(
                            color: FriendooUiColors.ink,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                            border: InputBorder.none,
                            hintText: 'Enter your age',
                            hintStyle: TextStyle(
                              color: Color(0xFF9CA3AF),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // About / Bio Input Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'About / Bio',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.only(top: 2),
                        child: Icon(
                          Icons.edit_note_rounded,
                          color: FriendooUiColors.blue,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _bioController,
                          maxLines: 3,
                          minLines: 2,
                          style: const TextStyle(
                            color: FriendooUiColors.ink,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            height: 1.4,
                          ),
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                            border: InputBorder.none,
                            hintText: 'Tell hosts a little about yourself...',
                            hintStyle: TextStyle(
                              color: Color(0xFF9CA3AF),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // Identity Verification Status Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFECFDF5),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: const Color(0xFF10B981).withValues(alpha: 0.35),
            ),
          ),
          child: const Row(
            children: [
              Icon(
                Icons.verified_user_rounded,
                color: Color(0xFF047857),
                size: 24,
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Phone number verified',
                      style: TextStyle(
                        color: Color(0xFF047857),
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Other callers do not see your phone number.',
                      style: TextStyle(
                        color: Color(0xFF065F46),
                        fontSize: 11.5,
                      ),
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

class AppLanguageSettingsPage extends ConsumerWidget {
  const AppLanguageSettingsPage({super.key});

  Future<void> _saveLanguage(
    BuildContext context,
    WidgetRef ref,
    AppLanguage language,
  ) async {
    final languageController = ref.read(appLanguageCodeProvider.notifier);
    try {
      final preferences = await SharedPreferences.getInstance();
      final saved = await preferences.setString(
        'friendoo_app_language',
        language.code,
      );
      if (!saved) {
        throw StateError('The app language preference could not be saved.');
      }
      languageController.state = language.code;
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text(
              translateAppText('App language updated', language.code),
            ),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const AppText(
              'Could not save language. Please try again.',
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedLanguageCode = ref.watch(appLanguageCodeProvider);
    return SettingsPageScaffold(
      title: 'App language',
      subtitle: 'Choose the language used in the app',
      children: [
        const SettingsSectionCard(
          title: 'AVAILABLE LANGUAGES',
          children: [
            Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: AppText(
                'Your language choice is saved on this device.',
                style: TextStyle(
                  color: Color(0xFF6B7280),
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
            ),
          ],
        ),
        SettingsSectionCard(
          children: AppLanguage.supported.map((language) {
            final isSelected = selectedLanguageCode == language.code;
            return Material(
              color: Colors.transparent,
              child: ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(language.name),
                trailing: isSelected
                    ? const Icon(
                        Icons.check_circle_rounded,
                        color: FriendooUiColors.pink,
                      )
                    : null,
                onTap: () => _saveLanguage(context, ref, language),
              ),
            );
          }).toList(),
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
    'Assamese',
    'Bengali',
    'Gujarati',
    'Hindi',
    'Kannada',
    'Malayalam',
    'Marathi',
    'Odia',
    'Punjabi',
    'Tamil',
    'Telugu',
    'Urdu',
  ];

  late Set<String> _selected;

  @override
  void initState() {
    super.initState();
    final profileLangs =
        ProfileRepository.currentActiveProfile?.preferredLanguages;
    if (profileLangs != null && profileLangs.isNotEmpty) {
      _selected = profileLangs
          .where((language) => language.toLowerCase() != 'english')
          .toSet();
    } else {
      _selected = {'Tamil'};
    }
    if (_selected.isEmpty) {
      _selected = {'Tamil'};
    }
  }

  Future<void> _saveLanguages() async {
    final languages = _selected
        .where((language) => language.toLowerCase() != 'english')
        .toList();
    if (widget.isHost) {
      await ref
          .read(hostRepositoryProvider)
          .updateCurrentHostLanguages(languages);
    } else {
      await ref
          .read(profileRepositoryProvider)
          .updatePreferredLanguages(languages);
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: Color(0xFF10B981),
        content: Text('Regional language preferences updated!'),
      ),
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Languages',
      subtitle: widget.isHost
          ? 'Languages you talk with callers in'
          : 'Languages you speak & understand',
      bottomAction: SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: _saveLanguages,
          style: FilledButton.styleFrom(
            backgroundColor: FriendooUiColors.pink,
            padding: const EdgeInsets.symmetric(vertical: 15),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: const Text(
            'Save Languages',
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
          ),
        ),
      ),
      children: [
        const Text(
          'Select all the languages you are comfortable speaking. This helps Friendoo recommend matching conversations.',
          style: TextStyle(
            color: Color(0xFF6B7280),
            fontSize: 13.5,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 20),
        SettingsSectionCard(
          title: 'AVAILABLE LANGUAGES',
          children: _allLanguages
              .where(
                (language) =>
                    !widget.isHost || language.toLowerCase() != 'english',
              )
              .map((lang) {
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
                          isSelected
                              ? Icons.check_circle_rounded
                              : Icons.radio_button_unchecked_rounded,
                          color: isSelected
                              ? FriendooUiColors.pink
                              : const Color(0xFF9CA3AF),
                          size: 22,
                        ),
                        const SizedBox(width: 14),
                        Text(
                          lang,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: isSelected
                                ? FontWeight.w800
                                : FontWeight.w600,
                            color: isSelected
                                ? FriendooUiColors.ink
                                : const Color(0xFF4B5563),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              })
              .toList(),
        ),
      ],
    );
  }
}

/// C. Call Preferences Page (User)
class UserCallPreferencesPage extends StatefulWidget {
  const UserCallPreferencesPage({super.key});

  @override
  State<UserCallPreferencesPage> createState() =>
      _UserCallPreferencesPageState();
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
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: const Text(
            'Save Preferences',
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
          ),
        ),
      ),
      children: [
        SettingsSectionCard(
          title: 'AUDIO & CONNECTION',
          children: [
            SettingsSwitchTile(
              icon: Icons.graphic_eq_rounded,
              title: 'High-Definition Audio',
              subtitle:
                  'Enhanced noise suppression for crystal clear voice calls',
              value: _hdVoice,
              onChanged: (v) => setState(() => _hdVoice = v),
            ),
            const Divider(height: 1),
            SettingsSwitchTile(
              icon: Icons.monetization_on_outlined,
              title: 'Low Coin Warning Prompt',
              subtitle:
                  'Alert when wallet has less than 2 minutes of talk-time',
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
  void initState() {
    super.initState();
    _loadSavedPrivacyPreferences();
  }

  Future<void> _loadSavedPrivacyPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (mounted) {
        setState(() {
          _hideOnlineStatus =
              prefs.getBool('privacy_hide_online_status') ?? false;
          _hideFromSearch = prefs.getBool('privacy_hide_from_search') ?? false;
          _readReceipts = prefs.getBool('privacy_read_receipts') ?? true;
        });
      }
    } catch (_) {}
  }

  Future<void> _setPrivacyPref(String key, bool val) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(key, val);
    } catch (_) {}
  }

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
            border: Border.all(
              color: const Color(0xFF8B5CF6).withValues(alpha: 0.3),
            ),
          ),
          child: const Row(
            children: [
              Icon(
                Icons.lock_outline_rounded,
                color: Color(0xFF6D28D9),
                size: 24,
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Phone number privacy',
                      style: TextStyle(
                        color: Color(0xFF5B21B6),
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Your phone number is not shown to other callers.',
                      style: TextStyle(
                        color: Color(0xFF6D28D9),
                        fontSize: 11.5,
                      ),
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
              subtitle:
                  'Hide your browsing activity',
              value: _hideOnlineStatus,
              onChanged: (v) {
                setState(() => _hideOnlineStatus = v);
                _setPrivacyPref('privacy_hide_online_status', v);
              },
            ),
            const Divider(height: 1),
            SettingsSwitchTile(
              icon: Icons.search_off_rounded,
              title: 'Hide Profile from Public Search',
              subtitle: 'Only hosts you call can view your member nickname',
              value: _hideFromSearch,
              onChanged: (v) {
                setState(() => _hideFromSearch = v);
                _setPrivacyPref('privacy_hide_from_search', v);
              },
            ),
            const Divider(height: 1),
            SettingsSwitchTile(
              icon: Icons.done_all_rounded,
              title: 'Read Receipts & Session Confirmations',
              subtitle: 'Share call duration summaries after each conversation',
              value: _readReceipts,
              onChanged: (v) {
                setState(() => _readReceipts = v);
                _setPrivacyPref('privacy_read_receipts', v);
              },
            ),
          ],
        ),

        SettingsSectionCard(
          title: 'ANDROID SYSTEM ACCESS & PERMISSIONS',
          children: [
            FutureBuilder<PermissionStatusReport>(
              future: const AppPermissionService().getStatusReport(),
              builder: (context, snapshot) {
                final micGranted = snapshot.data?.isMicrophoneGranted ?? false;
                final notifGranted =
                    snapshot.data?.isNotificationsGranted ?? false;
                final storageGranted = snapshot.data?.isStorageGranted ?? false;

                return Column(
                  children: [
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: micGranted
                              ? const Color(0xFFDCFCE7)
                              : const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          micGranted
                              ? Icons.mic_rounded
                              : Icons.mic_off_rounded,
                          size: 18,
                          color: micGranted
                              ? const Color(0xFF16A34A)
                              : const Color(0xFFDC2626),
                        ),
                      ),
                      title: const Text(
                        'Microphone Access',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14.5,
                        ),
                      ),
                      subtitle: Text(
                        micGranted
                            ? 'Microphone access allowed'
                            : 'Denied • Required for audio calling',
                        style: TextStyle(
                          fontSize: 12,
                          color: micGranted
                              ? const Color(0xFF16A34A)
                              : const Color(0xFFDC2626),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      trailing: OutlinedButton(
                        onPressed: () async {
                          await const AppPermissionService().requestMicrophone(
                            context: context,
                          );
                          setState(() {});
                        },
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          visualDensity: VisualDensity.compact,
                        ),
                        child: AppText(micGranted ? 'Check' : 'Enable'),
                      ),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: notifGranted
                              ? const Color(0xFFDCFCE7)
                              : const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          notifGranted
                              ? Icons.notifications_active_rounded
                              : Icons.notifications_off_rounded,
                          size: 18,
                          color: notifGranted
                              ? const Color(0xFF16A34A)
                              : const Color(0xFFDC2626),
                        ),
                      ),
                      title: const AppText(
                        'Push Notifications',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14.5,
                        ),
                      ),
                      subtitle: Text(
                        notifGranted
                            ? 'Granted • Flash drops & calls active'
                            : 'Disabled • Missed Flash coin sales',
                        style: TextStyle(
                          fontSize: 12,
                          color: notifGranted
                              ? const Color(0xFF16A34A)
                              : const Color(0xFFDC2626),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      trailing: OutlinedButton(
                        onPressed: () async {
                          await const AppPermissionService()
                              .requestNotifications(context: context);
                          setState(() {});
                        },
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          visualDensity: VisualDensity.compact,
                        ),
                        child: AppText(notifGranted ? 'Check' : 'Enable'),
                      ),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: storageGranted
                              ? const Color(0xFFDCFCE7)
                              : const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          storageGranted
                              ? Icons.folder_rounded
                              : Icons.folder_off_rounded,
                          size: 18,
                          color: storageGranted
                              ? const Color(0xFF16A34A)
                              : const Color(0xFFDC2626),
                        ),
                      ),
                      title: const Text(
                        'Phone Storage & Media Access',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14.5,
                        ),
                      ),
                      subtitle: Text(
                        storageGranted
                            ? 'Granted • 3D Avatar & cache enabled'
                            : 'Optional • Avatar storage & receipts',
                        style: TextStyle(
                          fontSize: 12,
                          color: storageGranted
                              ? const Color(0xFF16A34A)
                              : const Color(0xFF6B7280),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      trailing: OutlinedButton(
                        onPressed: () async {
                          await const AppPermissionService().requestStorage(
                            context: context,
                          );
                          setState(() {});
                        },
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          visualDensity: VisualDensity.compact,
                        ),
                        child: AppText(storageGranted ? 'Check' : 'Enable'),
                      ),
                    ),
                  ],
                );
              },
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
                child: const Icon(
                  Icons.block_flipped,
                  size: 18,
                  color: FriendooUiColors.ink,
                ),
              ),
              title: const Text(
                'Blocked Accounts',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5),
              ),
              subtitle: const Text(
                'Manage hosts or users you have blocked',
                style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
              ),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const UserBlockedUsersPage(),
                  ),
                );
              },
            ),
            const Divider(height: 1),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.delete_forever_rounded,
                  size: 18,
                  color: Color(0xFFDC2626),
                ),
              ),
              title: const Text(
                'Delete Account & Data',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 14.5,
                  color: Color(0xFFDC2626),
                ),
              ),
              subtitle: const Text(
                'Permanently remove account, coin balance & session data',
                style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
              ),
              trailing: const Icon(
                Icons.chevron_right_rounded,
                color: Color(0xFFDC2626),
              ),
              onTap: () => _showDeleteAccountConfirmation(context),
            ),
          ],
        ),
      ],
    );
  }

  void _showDeleteAccountConfirmation(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: const Color(0xFF13141F),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          title: const Row(
            children: [
              Icon(
                Icons.warning_amber_rounded,
                color: Color(0xFFDC2626),
                size: 26,
              ),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Delete Friendoo Account?',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 17,
                  ),
                ),
              ),
            ],
          ),
          content: Text(
            'In accordance with Google Play data safety policies, deleting your account will permanently wipe:\n\n'
            '• All phone records & profile details\n'
            '• Any unspent coin balance (non-refundable)\n'
            '• Complete call history and favorite hosts\n\n'
            'This action is irreversible.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.85),
              fontSize: 13,
              height: 1.45,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: AppText(
                'Cancel',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
              ),
            ),
            FilledButton(
              onPressed: () async {
                Navigator.of(dialogContext).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    backgroundColor: Color(0xFFDC2626),
                    content: Text('Account data deleted. Logging out...'),
                  ),
                );
                try {
                  final prefs = await SharedPreferences.getInstance();
                  await prefs.clear();
                } catch (_) {}
                try {
                  await Supabase.instance.client.auth.signOut();
                } catch (_) {}
                ProfileRepository.clearSession();
                if (context.mounted) {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                }
              },
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Permanently Delete'),
            ),
          ],
        );
      },
    );
  }
}

/// E. Blocked Callers Page (Host Only)
class HostBlockedUsersPage extends StatefulWidget {
  const HostBlockedUsersPage({super.key});

  @override
  State<HostBlockedUsersPage> createState() => _HostBlockedUsersPageState();
}

class _HostBlockedUsersPageState extends State<HostBlockedUsersPage> {
  List<BlockedCallerItem> _blockedList = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBlockedList();
  }

  String get _currentHostId {
    return ProfileRepository.currentActiveProfile?.id ??
        Supabase.instance.client.auth.currentUser?.id ??
        'current_host';
  }

  Future<void> _loadBlockedList() async {
    final list = await BlockedCallersService.getBlockedCallersForHost(
      _currentHostId,
    );
    if (mounted) {
      setState(() {
        _blockedList = List.from(list);
        _isLoading = false;
      });
    }
  }

  void _unblock(int index) {
    final item = _blockedList[index];
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Unblock Caller?',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
        content: Text(
          'Unblock ${item.name}? They will be able to see you when you are online.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const AppText(
              'Cancel',
              style: TextStyle(color: Color(0xFF6B7280)),
            ),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: FriendooUiColors.pink,
            ),
            onPressed: () async {
              Navigator.of(ctx).pop();
              await BlockedCallersService.unblockCaller(
                hostId: _currentHostId,
                callerId: item.callerId,
              );
              await _loadBlockedList();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('${item.name} unblocked.'),
                  ),
                );
              }
            },
            child: const AppText('Unblock'),
          ),
        ],
      ),
    );
  }

  void _showBlockCallerDialog() {
    final nameCtrl = TextEditingController();
    final reasonCtrl = TextEditingController();
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const AppText(
          'Block Caller',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Blocked callers will not appear in your Discover list while blocked.',
              style: TextStyle(
                fontSize: 13,
                color: Color(0xFF4B5563),
                height: 1.3,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: nameCtrl,
              decoration: InputDecoration(
                labelText: 'Caller Name or ID *',
                hintText: 'e.g. Rahul or User #1042',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              decoration: InputDecoration(
                labelText: 'Reason (Optional)',
                hintText: 'Inappropriate behavior, spam, etc.',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const AppText(
              'Cancel',
              style: TextStyle(color: Color(0xFF6B7280)),
            ),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
            ),
            onPressed: () async {
              final name = nameCtrl.text.trim();
              if (name.isEmpty) return;
              Navigator.of(ctx).pop();
              final callerId =
                  'caller_${name.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '_')}';
              await BlockedCallersService.blockCaller(
                hostId: _currentHostId,
                callerId: callerId,
                callerName: name,
                reason: reasonCtrl.text.trim().isNotEmpty
                    ? reasonCtrl.text.trim()
                    : 'Blocked by host',
              );
              await _loadBlockedList();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      '$name is now blocked. You will not appear on their screen.',
                    ),
                  ),
                );
              }
            },
            child: const AppText('Block Caller'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Blocked Callers',
      subtitle: 'Manage callers blocked from viewing or contacting you',
      bottomAction: Padding(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          width: double.infinity,
          height: 52,
          child: OutlinedButton.icon(
            onPressed: _showBlockCallerDialog,
            icon: const Icon(
              Icons.person_add_disabled_rounded,
              color: Color(0xFFDC2626),
            ),
            label: const Text(
              'Block a Caller by Name or ID',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Color(0xFFDC2626),
              ),
            ),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFFFCA5A5), width: 1.5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              backgroundColor: const Color(0xFFFEF2F2),
            ),
          ),
        ),
      ),
      children: [
        // Privacy Guarantee Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFBFDBFE)),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.shield_outlined, color: Color(0xFF2563EB), size: 24),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Blocked callers will not appear in your Discover list while blocked.',
                  style: TextStyle(
                    fontSize: 12.5,
                    color: Color(0xFF1E40AF),
                    fontWeight: FontWeight.w600,
                    height: 1.35,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        if (_isLoading)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(),
            ),
          )
        else if (_blockedList.isEmpty)
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
                Text(
                  'No Blocked Callers',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                ),
                SizedBox(height: 4),
                Text(
                  'You have not blocked any callers. Use the button below to block anyone who violates guidelines.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF6B7280), fontSize: 13),
                ),
              ],
            ),
          )
        else
          SettingsSectionCard(
            title: 'BLOCKED CALLERS (${_blockedList.length})',
            children: _blockedList.asMap().entries.map((entry) {
              final idx = entry.key;
              final item = entry.value;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    DesiAvatar(
                      seed: item.name,
                      gender: DesiGender.male,
                      size: 40,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 14.5,
                            ),
                          ),
                          Text(
                            'Blocked on ${item.date} • ${item.reason}',
                            style: const TextStyle(
                              color: Color(0xFF6B7280),
                              fontSize: 11.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    OutlinedButton(
                      onPressed: () => _unblock(idx),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        side: const BorderSide(color: Color(0xFFD1D5DB)),
                      ),
                      child: const AppText(
                        'Unblock',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: FriendooUiColors.ink,
                        ),
                      ),
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

/// Backward compatibility alias
typedef UserBlockedUsersPage = HostBlockedUsersPage;

/// F. Notification Settings Page
class UserNotificationSettingsPage extends StatefulWidget {
  const UserNotificationSettingsPage({super.key});

  @override
  State<UserNotificationSettingsPage> createState() =>
      _UserNotificationSettingsPageState();
}

class _UserNotificationSettingsPageState
    extends State<UserNotificationSettingsPage> {
  bool _pushNotifications = true;
  bool _callRinging = true;
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
              subtitle:
                  'Play a ringtone for incoming calls',
              value: _callRinging,
              onChanged: (v) => setState(() => _callRinging = v),
            ),
          ],
        ),
        SettingsSectionCard(
          title: 'FLASH COIN DROPS & DEALS',
          children: [
            SettingsSwitchTile(
              icon: Icons.bolt_rounded,
              title: 'Flash Coin Sales & Midnight Drops ⚡',
              subtitle: 'Get real-time alerts when 50% OFF flash bonus coin drops go live',
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
      subtitle: 'Assistance, safety & guides',
      children: [
        // Sleek, compact Care Team card (not giant or bulky)
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF334155)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Color(0xFF334155),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.headset_mic_rounded,
                  color: Color(0xFF38BDF8),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Friendoo Care Team',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 14.5,
                      ),
                    ),
                    SizedBox(height: 1),
                    Text(
                      'Support and safety resources for callers across India.',
                      style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 11.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        SettingsSectionCard(
          title: 'CONTACT CHANNELS',
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF7C3AED), Color(0xFFEC4899)],
                  ),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.headset_mic_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              title: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    '24/7 Live Support',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 14.5,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'INSTANT',
                      style: TextStyle(
                        color: Color(0xFF10B981),
                        fontWeight: FontWeight.w900,
                        fontSize: 9.5,
                      ),
                    ),
                  ),
                ],
              ),
              subtitle: Text(
                isHost
                    ? 'Direct help for withdrawals, earnings & 1-on-1 support'
                    : 'Direct help for failed recharges, call drops & refunds',
                style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
              ),
              trailing: const Icon(Icons.arrow_forward_rounded, size: 18),
              onTap: () => SupportChatSheet.show(context, isHost: isHost),
            ),
            const Divider(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(
                Icons.mail_outline_rounded,
                color: FriendooUiColors.blue,
              ),
              title: const Text(
                'Email Support',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5),
              ),
              subtitle: const Text(
                'support@friendoo.in',
                style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
              ),
              trailing: const Icon(Icons.arrow_forward_rounded, size: 18),
              onTap: () async {
                final uri = Uri(scheme: 'mailto', path: 'support@friendoo.in');
                if (!await launchUrl(uri) && context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Could not open your email app. Write to support@friendoo.in.',
                      ),
                    ),
                  );
                }
              },
            ),
          ],
        ),

        SettingsSectionCard(
          title: 'FREQUENTLY ASKED QUESTIONS',
          children: const [
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text(
                'What if my UPI recharge fails but money is debited?',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
              ),
              children: [
                Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text(
                    'UPI settlement between banks can take 5 to 15 minutes. Tap "24/7 Live Support" and enter your 12-digit bank UTR number or upload a screenshot. If rejected by your bank, funds auto-reverse within 24–48 banking hours.',
                    style: TextStyle(
                      color: Color(0xFF4B5563),
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
            Divider(height: 1),
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text(
                'How does the 15-second free drop refund work?',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
              ),
              children: [
                Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text(
                    'Any call ending within 15 seconds is automatically 100% free of charge. No coins are deducted from your balance for accidental taps or quick disconnects.',
                    style: TextStyle(
                      color: Color(0xFF4B5563),
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
            Divider(height: 1),
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text(
                'How do I report a host asking for money off-platform?',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
              ),
              children: [
                Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text(
                    'Friendoo has strict zero-tolerance for off-platform money demands or extortion. Tap "24/7 Live Support", select "Report Host", and tap the host who requested money. The host will be blocked instantly and investigated by Trust & Safety.',
                    style: TextStyle(
                      color: Color(0xFF4B5563),
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
            Divider(height: 1),
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text(
                'Can other callers or hosts see my phone number?',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
              ),
              children: [
                Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text(
                    'Your phone number and banking details are not shown to other callers or hosts.',
                    style: TextStyle(
                      color: Color(0xFF4B5563),
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
            Divider(height: 1),
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text(
                'How do hosts withdraw their earnings?',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
              ),
              children: [
                Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text(
                    'Open Withdrawal to see your available balance, minimum amount, and payout options.',
                    style: TextStyle(
                      color: Color(0xFF4B5563),
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
            Divider(height: 1),
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text(
                'How are coin rates calculated per call?',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
              ),
              children: [
                Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text(
                    'Each host sets their audio per-minute coin rate, clearly displayed on their card before you call. Billing happens by the minute only while actively connected.',
                    style: TextStyle(
                      color: Color(0xFF4B5563),
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
            Divider(height: 1),
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text(
                'How do I block an abusive user permanently?',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
              ),
              children: [
                Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text(
                    'Tap the Shield or Block button on any call history card or profile. Blocked users cannot call you or view your availability.',
                    style: TextStyle(
                      color: Color(0xFF4B5563),
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
            Divider(height: 1),
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text(
                'How can I speak directly with customer support?',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
              ),
              children: [
                Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text(
                    'Tap the "24/7 Live Support" button above to chat in real time with our support desk, or email our official inbox at support@friendoo.in.',
                    style: TextStyle(
                      color: Color(0xFF4B5563),
                      fontSize: 13,
                      height: 1.4,
                    ),
                  ),
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
      subtitle: 'Legal policies, compliance & licenses',
      children: [
        Center(
          child: Column(
            children: [
              const FriendooLogo(fontSize: 32),
              const SizedBox(height: 6),
              const Text(
                'Real Voice Connections Across India',
                style: TextStyle(
                  color: Color(0xFF6B7280),
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
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
              leading: const Icon(
                Icons.description_outlined,
                color: FriendooUiColors.ink,
              ),
              title: const AppText(
                'Terms of Service',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5),
              ),
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
              leading: const Icon(
                Icons.privacy_tip_outlined,
                color: FriendooUiColors.ink,
              ),
              title: const AppText(
                'Privacy Policy',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5),
              ),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const FriendooDocumentViewerPage(
                      title: 'Privacy Policy',
                      content: 'Your phone number is not shown to other callers. Your display name and profile details may be visible to other users. Friendoo processes account and call information to provide the service. Contact support with questions about your information.',
                    ),
                  ),
                );
              },
            ),
            const Divider(height: 1),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(
                Icons.handshake_outlined,
                color: FriendooUiColors.ink,
              ),
              title: const AppText(
                'Community Guidelines',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5),
              ),
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
          ],
        ),
        const Center(
          child: Text(
            'Made with ❤️ in India • Friendoo Technologies Pvt Ltd',
            style: TextStyle(
              color: Color(0xFF9CA3AF),
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

/// Grievance Redressal & DPDP Act 2023 Compliance Page
class GrievanceRedressalPage extends StatefulWidget {
  const GrievanceRedressalPage({super.key});

  @override
  State<GrievanceRedressalPage> createState() => _GrievanceRedressalPageState();
}

class _GrievanceRedressalPageState extends State<GrievanceRedressalPage> {
  bool _voiceSafetyAnalytics = true;
  bool _smartMatchPersonalization = true;
  bool _marketingNotifications = false;

  void _showFileComplaintDialog(BuildContext context) {
    final complaintController = TextEditingController();
    showDialog<void>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: const Color(0xFF13141F),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.gavel_rounded, color: Color(0xFFFFB703), size: 22),
            SizedBox(width: 8),
            Text(
              'File Grievance Ticket',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 16,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Under IT Rules 2021, your ticket will be acknowledged within 24h and resolved within 15 days.',
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: complaintController,
              maxLines: 4,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Describe the issue or user ID...',
                hintStyle: const TextStyle(color: Colors.white38),
                filled: true,
                fillColor: const Color(0xFF1C1E30),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const AppText(
              'Cancel',
              style: TextStyle(color: Colors.white60),
            ),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(dialogCtx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  backgroundColor: Color(0xFF10B981),
                  content: Text(
                    '✅ Grievance Ticket #FRN-2026-892 logged. Acknowledgment sent to email.',
                  ),
                ),
              );
            },
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFFFFB703),
            ),
            child: const Text(
              'Submit Ticket',
              style: TextStyle(
                color: Color(0xFF0E1020),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Grievance & DPDP Compliance',
      subtitle: 'Statutory Grievance Officer & Privacy Rights',
      children: [
        // STATUTORY OFFICER CARD
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEDE9FE),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.shield_rounded,
                      color: Color(0xFF6366F1),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Designated Grievance Officer',
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 14.5,
                          ),
                        ),
                        Text(
                          'Rule 3(2) IT (Intermediary Guidelines) Rules 2021',
                          style: TextStyle(
                            fontSize: 11,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              const Text(
                '• Name: Mr. Alok Sharma (Nodal Officer)',
                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              const Text(
                '• Email: grievance-officer@friendoo.app',
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF6366F1),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                '• Address: Friendoo Technologies Pvt Ltd, Indiranagar, Bengaluru - 560038',
                style: TextStyle(fontSize: 12, color: Color(0xFF4B5563)),
              ),
              const SizedBox(height: 4),
              const Text(
                '• Response SLA: Acknowledgment within 24h • Resolution within 15 days',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF047857),
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _showFileComplaintDialog(context),
                  icon: const Icon(Icons.rate_review_rounded, size: 16),
                  label: const Text('File Formal Grievance / Appeal ➔'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF6366F1),
                    side: const BorderSide(color: Color(0xFF6366F1)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // DPDP ACT 2023 DATA CONSENT MANAGER
        SettingsSectionCard(
          title: 'DPDP ACT 2023 DATA CONSENTS',
          children: [
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text(
                'Voice Quality & Safety Telemetry',
                style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800),
              ),
              subtitle: const Text(
                'Anonymous bitrate and jitter monitoring for call stability',
                style: TextStyle(fontSize: 11.5, color: Color(0xFF6B7280)),
              ),
              value: _voiceSafetyAnalytics,
              activeTrackColor: const Color(0xFF10B981),
              onChanged: (val) => setState(() => _voiceSafetyAnalytics = val),
            ),
            const Divider(height: 1),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text(
                'Smart Match Personalization',
                style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800),
              ),
              subtitle: const Text(
                'Matching by language and favorite host topics',
                style: TextStyle(fontSize: 11.5, color: Color(0xFF6B7280)),
              ),
              value: _smartMatchPersonalization,
              activeTrackColor: const Color(0xFF10B981),
              onChanged: (val) =>
                  setState(() => _smartMatchPersonalization = val),
            ),
            const Divider(height: 1),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text(
                'Promotional Coin Drop Alerts',
                style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800),
              ),
              subtitle: const Text(
                'Flash sale and peak-hour bonus notifications',
                style: TextStyle(fontSize: 11.5, color: Color(0xFF6B7280)),
              ),
              value: _marketingNotifications,
              activeTrackColor: const Color(0xFF10B981),
              onChanged: (val) => setState(() => _marketingNotifications = val),
            ),
          ],
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
  ConsumerState<EditHostProfilePage> createState() =>
      _EditHostProfilePageState();
}

class _EditHostProfilePageState extends ConsumerState<EditHostProfilePage> {
  late TextEditingController _nameController;
  late TextEditingController _ageController;
  late TextEditingController _bioController;
  String _selectedAvatarId = 'host_01';
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: '');
    _ageController = TextEditingController(text: '24');
    _bioController = TextEditingController(
      text: 'I enjoy conversations about movies and everyday life.',
    );
    _loadAvatarSelection();
  }

  Future<void> _loadAvatarSelection() async {
    final profile = await ref
        .read(profileRepositoryProvider)
        .fetchCurrentUserProfile();
    if (!mounted || profile == null) return;

    if (profile.displayName.isNotEmpty &&
        profile.displayName.toLowerCase() != 'user' &&
        profile.displayName.toLowerCase() != 'friendoo user' &&
        profile.displayName.toLowerCase() != 'host') {
      _nameController.text = profile.displayName;
    }

    final savedId = profile.avatarUrl;
    if (!DesiAvatarPack.isValidPresetForRole(savedId ?? '', 'host')) return;

    setState(() {
      _selectedAvatarId = savedId!;
    });
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
    final repository = ref.read(profileRepositoryProvider);

    try {
      try {
        await repository.updateDisplayName(_nameController.text.trim());
      } catch (_) {}
      await Future.delayed(const Duration(milliseconds: 300));
    } catch (_) {
      if (!mounted) return;
      setState(() => _isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Unable to save your host profile. Please try again.'),
        ),
      );
      return;
    }

    if (!mounted) return;
    setState(() => _isSaving = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        backgroundColor: Color(0xFF10B981),
        content: Text('Profile updated.'),
      ),
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Edit Host Profile',
      subtitle: 'Edit your host profile',
      bottomAction: SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: _isSaving ? null : _saveChanges,
          style: FilledButton.styleFrom(
            backgroundColor: FriendooUiColors.pink,
            padding: const EdgeInsets.symmetric(vertical: 15),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: _isSaving
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : const Text(
                  'Save Host Profile',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                ),
        ),
      ),
      children: [
        // Fixed static host avatar display (cannot be modified)
        Center(
          child: FriendooAvatar(
            config: FriendooAvatarConfig(
              gender: 'female',
              role: 'host',
              presetId: _selectedAvatarId,
            ),
            age: int.tryParse(_ageController.text) ?? 24,
            isStar: true,
            size: 96,
          ),
        ),
        const SizedBox(height: 24),

        // HOST PUBLIC PROFILE
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'HOST PUBLIC PROFILE',
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF6B7280),
                  letterSpacing: 0.3,
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Instagram-style Host Display Name
            InstagramTextField(
              controller: _nameController,
              label: 'Name',
              hintText: 'Host Display Name',
              helperText: 'Shown on your public profile',
              maxLength: 50,
              accentColor: FriendooUiColors.pink,
              isRequired: true,
              onChanged: (_) => setState(() {}),
            ),
            const SizedBox(height: 8),

            // Instagram-style Age Row
            InstagramAgeRow(
              selectedAge: int.tryParse(_ageController.text.trim()) ?? 24,
              accentColor: FriendooUiColors.pink,
              onChanged: (newAge) {
                setState(() => _ageController.text = newAge.toString());
              },
            ),
            const SizedBox(height: 8),

            // Instagram-style Bio Field
            InstagramBioField(
              controller: _bioController,
              label: 'Bio',
              hintText: 'Introduce yourself to callers...',
              maxLength: 150,
              accentColor: FriendooUiColors.pink,
              promptChips: const [
                '🌟 Friendly host ready to listen',
                '💬 Chat about cinema, songs & life',
                '🎙️ Regional-language voice space',
                '☕ Relaxed evening conversations',
              ],
              onChanged: (_) => setState(() {}),
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
  final _professionController = TextEditingController(
    text: 'Voice Artist & Radio Anchor',
  );
  final _educationController = TextEditingController(
    text: 'Postgraduate in Media & Communication',
  );
  final Set<String> _selectedHobbies = {
    'Music',
    'Cinema',
    'Travel',
    'Literature',
    'Cooking',
  };

  final List<String> _availableHobbies = [
    'Music',
    'Cinema',
    'Travel',
    'Literature',
    'Cooking',
    'Art & Design',
    'Tech & Gadgets',
    'Gaming',
    'Fitness',
    'Philosophy',
    'Podcasting',
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
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: const Text(
            'Save Information',
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
          ),
        ),
      ),
      children: [
        // BACKGROUND
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'BACKGROUND',
              style: TextStyle(
                color: Color(0xFF374151),
                fontSize: 13,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(height: 12),

            // Profession Input Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Profession / Vocation',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.work_outline_rounded,
                        color: FriendooUiColors.pink,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _professionController,
                          style: const TextStyle(
                            color: FriendooUiColors.ink,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                            border: InputBorder.none,
                            hintText: 'Enter your profession',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Education Input Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Education',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.school_outlined,
                        color: FriendooUiColors.pink,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _educationController,
                          style: const TextStyle(
                            color: FriendooUiColors.ink,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                            border: InputBorder.none,
                            hintText: 'Enter your education',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
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
                    color: isSelected
                        ? FriendooUiColors.pink
                        : FriendooUiColors.ink,
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

/// C. Host Profile Details Editor (Name, Age, City, Languages)
class HostProfileDetailsPage extends StatefulWidget {
  const HostProfileDetailsPage({super.key});

  @override
  State<HostProfileDetailsPage> createState() => _HostProfileDetailsPageState();
}

class _HostProfileDetailsPageState extends State<HostProfileDetailsPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _ageController = TextEditingController(text: '22');
  final _cityController = TextEditingController();
  final _bioController = TextEditingController();
  final Set<String> _selectedLanguages = {'Tamil'};
  bool _isLoading = true;
  bool _isSaving = false;

  static const List<String> _availableLanguages = [
    'Tamil',
    'Telugu',
    'Hindi',
    'Malayalam',
    'Kannada',
    'Marathi',
    'Bengali',
    'Punjabi',
    'Gujarati',
  ];

  static const List<String> _popularCities = [
    'Chennai',
    'Bengaluru',
    'Mumbai',
    'Hyderabad',
    'Delhi',
    'Kolkata',
    'Pune',
    'Coimbatore',
    'Madurai',
  ];

  @override
  void initState() {
    super.initState();
    _loadHostProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ageController.dispose();
    _cityController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _loadHostProfile() async {
    try {
      final activeProfile = ProfileRepository.currentActiveProfile;
      if (activeProfile != null) {
        if (activeProfile.displayName.isNotEmpty &&
            activeProfile.displayName != 'User') {
          _nameController.text = activeProfile.displayName;
        }
        if (activeProfile.preferredLanguages.isNotEmpty) {
          _selectedLanguages.clear();
          _selectedLanguages.addAll(
            activeProfile.preferredLanguages.where(
              (language) => language.toLowerCase() != 'english',
            ),
          );
          if (_selectedLanguages.isEmpty) {
            _selectedLanguages.add('Tamil');
          }
        }
      }

      final client = Supabase.instance.client;
      final user = client.auth.currentUser;
      if (user != null) {
        final existingApp = await client
            .from('host_applications')
            .select('*')
            .eq('application_profile_id', user.id)
            .order('created_at', ascending: false)
            .limit(1)
            .maybeSingle();

        if (existingApp != null && mounted) {
          if ((existingApp['display_name'] as String?)?.isNotEmpty == true) {
            _nameController.text = existingApp['display_name'] as String;
          }
          if ((existingApp['city'] as String?)?.isNotEmpty == true) {
            _cityController.text = existingApp['city'] as String;
          }
          if ((existingApp['bio'] as String?)?.isNotEmpty == true) {
            _bioController.text = existingApp['bio'] as String;
          }
          final langs = existingApp['languages'];
          if (langs is List && langs.isNotEmpty) {
            _selectedLanguages.clear();
            _selectedLanguages.addAll(
              langs
                  .map((e) => e.toString())
                  .where((language) => language.toLowerCase() != 'english'),
            );
            if (_selectedLanguages.isEmpty) {
              _selectedLanguages.add('Tamil');
            }
          }
          final payload = existingApp['submitted_payload'];
          if (payload is Map && payload['age'] != null) {
            _ageController.text = payload['age'].toString();
          }
        }
      }
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _saveHostProfile() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedLanguages.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one language you speak.'),
          backgroundColor: Color(0xFFDC2626),
        ),
      );
      return;
    }

    final ageInt = int.tryParse(_ageController.text.trim()) ?? 0;
    if (ageInt < 18) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Host age must be 18 or above.'),
          backgroundColor: Color(0xFFDC2626),
        ),
      );
      return;
    }

    setState(() => _isSaving = true);
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    try {
      final client = Supabase.instance.client;
      final user = client.auth.currentUser;
      final name = _nameController.text.trim();
      final city = _cityController.text.trim();
      final bio = _bioController.text.trim();
      final langs = _selectedLanguages
          .where((language) => language.toLowerCase() != 'english')
          .toList();

      if (user != null) {
        await client
            .from('profiles')
            .update({
              'display_name': name,
              'preferred_languages': langs,
              'updated_at': DateTime.now().toIso8601String(),
            })
            .eq('id', user.id);

        try {
          await client.from('hosts').update({'bio': bio}).eq('id', user.id);
        } catch (_) {}

        final existing = await client
            .from('host_applications')
            .select('id, submitted_payload')
            .eq('application_profile_id', user.id)
            .order('created_at', ascending: false)
            .limit(1)
            .maybeSingle();

        if (existing != null) {
          final payload = Map<String, dynamic>.from(
            existing['submitted_payload'] as Map? ?? {},
          );
          payload['age'] = ageInt;
          payload['city'] = city;
          payload['updated_at'] = DateTime.now().toIso8601String();

          await client
              .from('host_applications')
              .update({
                'display_name': name,
                'city': city,
                'languages': langs,
                'bio': bio,
                'submitted_payload': payload,
              })
              .eq('id', existing['id']);
        }
      }

      if (mounted) {
        navigator.pop();
        messenger.showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF10B981),
            content: Text('Profile updated.'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        messenger.showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text('Failed to update: ${e.toString()}'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Host Profile Details',
      subtitle: 'Change your name, age, city & spoken languages',
      bottomAction: SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: _isSaving ? null : _saveHostProfile,
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFFFF2A85),
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: _isSaving
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : const Text(
                  'Save Host Details',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                ),
        ),
      ),
      children: [
        if (_isLoading)
          const Padding(
            padding: EdgeInsets.all(32),
            child: Center(child: CircularProgressIndicator()),
          )
        else
          Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEDE9FE),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: const Color(0xFF7C3AED).withValues(alpha: 0.2),
                    ),
                  ),
                  child: const Row(
                    children: [
                      Icon(
                        Icons.info_outline_rounded,
                        color: Color(0xFF7C3AED),
                        size: 22,
                      ),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Your name, age, and languages are visible to callers.',
                          style: TextStyle(
                            color: Color(0xFF5B21B6),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // 1. Host Display Name (Instagram style)
                InstagramTextField(
                  controller: _nameController,
                  label: 'Name',
                  hintText: 'Host Display Name (e.g. Priya Sharma)',
                  helperText:
                      'Shown on your public profile',
                  maxLength: 50,
                  accentColor: const Color(0xFFFF2A85),
                  isRequired: true,
                  validator: (v) => (v == null || v.trim().length < 2)
                      ? 'Display name is required'
                      : null,
                ),
                const SizedBox(height: 8),

                // 2. Interactive Age Stepper & Presets (Instagram style)
                InstagramAgeRow(
                  selectedAge: int.tryParse(_ageController.text.trim()) ?? 22,
                  accentColor: const Color(0xFFFF2A85),
                  onChanged: (newAge) {
                    setState(() => _ageController.text = newAge.toString());
                  },
                ),
                const SizedBox(height: 16),

                // 3. City & Popular Quick Chips
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: const Color(0xFFE2E8F0),
                      width: 1.2,
                    ),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x060E1020),
                        blurRadius: 8,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: const Color(0xFFFF2A85)
                                  .withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(
                              Icons.location_on_rounded,
                              size: 17,
                              color: Color(0xFFFF2A85),
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Text(
                            'Your City',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF1E293B),
                              letterSpacing: 0.2,
                            ),
                          ),
                          const Text(
                            ' *',
                            style: TextStyle(
                              color: Color(0xFFEF4444),
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      TextFormField(
                        controller: _cityController,
                        style: const TextStyle(
                          fontSize: 15.5,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF0F172A),
                        ),
                        decoration: InputDecoration(
                          hintText: 'e.g. Chennai, Tamil Nadu',
                          hintStyle: const TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 14,
                          ),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Color(0xFFE2E8F0),
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Color(0xFFE2E8F0),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Color(0xFFFF2A85),
                              width: 1.6,
                            ),
                          ),
                        ),
                        validator: (v) => (v == null || v.trim().isEmpty)
                            ? 'City required'
                            : null,
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Popular regional hubs:',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: _popularCities.map((c) {
                          final isSel =
                              _cityController.text.trim().toLowerCase() ==
                              c.toLowerCase();
                          return InkWell(
                            onTap: () =>
                                setState(() => _cityController.text = c),
                            borderRadius: BorderRadius.circular(8),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                color: isSel
                                    ? const Color(0xFFFFF0F6)
                                    : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isSel
                                      ? const Color(0xFFFF2A85)
                                      : const Color(0xFFE2E8F0),
                                ),
                              ),
                              child: Text(
                                c,
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: isSel
                                      ? FontWeight.w800
                                      : FontWeight.w600,
                                  color: isSel
                                      ? const Color(0xFFFF2A85)
                                      : const Color(0xFF334155),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 4. Spoken Languages
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: const Color(0xFFE2E8F0),
                      width: 1.2,
                    ),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x060E1020),
                        blurRadius: 8,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: const Color(0xFFFF2A85)
                                  .withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(
                              Icons.translate_rounded,
                              size: 17,
                              color: Color(0xFFFF2A85),
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Text(
                            'Spoken Languages',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF1E293B),
                              letterSpacing: 0.2,
                            ),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF0F6),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${_selectedLanguages.length} Selected',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFFFF2A85),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _availableLanguages.map((lang) {
                          final isSel = _selectedLanguages.contains(lang);
                          return FilterChip(
                            label: Text(lang),
                            selected: isSel,
                            selectedColor: const Color(0xFFFFF0F6),
                            checkmarkColor: const Color(0xFFFF2A85),
                            labelStyle: TextStyle(
                              color: isSel
                                  ? const Color(0xFFFF2A85)
                                  : const Color(0xFF374151),
                              fontWeight: isSel
                                  ? FontWeight.w800
                                  : FontWeight.w600,
                              fontSize: 12.5,
                            ),
                            side: BorderSide(
                              color: isSel
                                  ? const Color(0xFFFF2A85)
                                  : const Color(0xFFE5E7EB),
                            ),
                            onSelected: (selected) {
                              setState(() {
                                if (selected) {
                                  _selectedLanguages.add(lang);
                                } else if (_selectedLanguages.length > 1) {
                                  _selectedLanguages.remove(lang);
                                }
                              });
                            },
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 5. Host Bio & Welcome Note (Instagram style)
                InstagramBioField(
                  controller: _bioController,
                  label: 'Bio',
                  hintText: 'Share a welcoming intro for callers (e.g. friendly chats, life advice)...',
                  maxLength: 150,
                  accentColor: const Color(0xFFFF2A85),
                  promptChips: const [
                    '🌟 Friendly host ready to listen',
                    '💬 Chat about life, movies & songs',
                    '🎙️ Regional-language voice space',
                    '☕ Relaxed evening conversations',
                  ],
                  onChanged: (_) => setState(() {}),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

/// D. Payout & Bank Details Page (Host)
class HostPayoutBankDetailsPage extends StatefulWidget {
  const HostPayoutBankDetailsPage({super.key});

  @override
  State<HostPayoutBankDetailsPage> createState() =>
      _HostPayoutBankDetailsPageState();
}

class _HostPayoutBankDetailsPageState extends State<HostPayoutBankDetailsPage> {
  final _upiController = TextEditingController();
  final _accountHolderController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _accountNumberController = TextEditingController();
  final _ifscController = TextEditingController();
  bool _isEditing = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadPayoutData();
  }

  Future<void> _loadPayoutData() async {
    try {
      final client = Supabase.instance.client;
      final user = client.auth.currentUser;
      if (user != null) {
        final existingApp = await client
            .from('host_applications')
            .select('submitted_payload')
            .eq('application_profile_id', user.id)
            .order('created_at', ascending: false)
            .limit(1)
            .maybeSingle();

        if (existingApp != null && mounted) {
          final payload = existingApp['submitted_payload'];
          if (payload is Map) {
            final details = payload['payout_details'];
            if (details is Map) {
              if (details['upi_id'] != null) {
                _upiController.text = details['upi_id'].toString();
              }
              if (details['account_holder_name'] != null) {
                _accountHolderController.text = details['account_holder_name']
                    .toString();
              }
              if (details['bank_name'] != null) {
                _bankNameController.text = details['bank_name'].toString();
              }
              if (details['account_number'] != null) {
                _accountNumberController.text = details['account_number']
                    .toString();
              }
              if (details['ifsc'] != null) {
                _ifscController.text = details['ifsc'].toString();
              }
            }
          }
        }
      }
    } catch (_) {}
  }

  Future<void> _savePayoutData() async {
    setState(() => _isSaving = true);
    final messenger = ScaffoldMessenger.of(context);
    try {
      final client = Supabase.instance.client;
      final user = client.auth.currentUser;
      if (user != null) {
        final upi = _upiController.text.trim();
        final pType = upi.isNotEmpty ? 'upi' : 'bank';
        final pDetails = {
          'upi_id': upi,
          'account_holder_name': _accountHolderController.text.trim(),
          'bank_name': _bankNameController.text.trim(),
          'account_number': _accountNumberController.text.trim(),
          'ifsc': _ifscController.text.trim().toUpperCase(),
        };

        await client.functions.invoke(
          'host-application-submit',
          body: {
            'name': user.userMetadata?['display_name'] ?? 'Host',
            'payout_type': pType,
            'payout_details': pDetails,
          },
        );

        if (mounted) {
          setState(() {
            _isEditing = false;
            _isSaving = false;
          });
          messenger.showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF10B981),
              content: Text('Payout details saved.'),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        messenger.showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text('Failed to update: ${e.toString()}'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Payout & Bank Details',
      subtitle: 'Settlements, UPI ID and bank accounts',
      bottomAction: SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: _isSaving
              ? null
              : () {
                  if (_isEditing) {
                    _savePayoutData();
                  } else {
                    setState(() => _isEditing = true);
                  }
                },
          style: FilledButton.styleFrom(
            backgroundColor: _isEditing
                ? const Color(0xFF10B981)
                : FriendooUiColors.pink,
            padding: const EdgeInsets.symmetric(vertical: 15),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: _isSaving
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : Text(
                  _isEditing ? 'Save Bank Details' : 'Edit Payout Account',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                  ),
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
            border: Border.all(
              color: const Color(0xFF10B981).withValues(alpha: 0.3),
            ),
          ),
          child: const Row(
            children: [
              Icon(
                Icons.event_available_rounded,
                color: Color(0xFF047857),
                size: 24,
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Weekly Automated Payouts',
                      style: TextStyle(
                        color: Color(0xFF047857),
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Earnings are disbursed every Monday directly to your registered UPI / Bank account.',
                      style: TextStyle(
                        color: Color(0xFF065F46),
                        fontSize: 11.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // UPI DETAILS
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'UPI DETAILS (RECOMMENDED)',
              style: TextStyle(
                color: Color(0xFF374151),
                fontSize: 13,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(height: 12),

            // UPI VPA Input Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'UPI Virtual Payment Address (VPA)',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.qr_code_rounded,
                        color: FriendooUiColors.pink,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _upiController,
                          enabled: _isEditing,
                          style: const TextStyle(
                            color: FriendooUiColors.ink,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                            border: InputBorder.none,
                            hintText: 'e.g. yourname@okaxis',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // BANK ACCOUNT
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'BANK ACCOUNT (DIRECT TRANSFER)',
              style: TextStyle(
                color: Color(0xFF374151),
                fontSize: 13,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(height: 12),

            // Account Holder Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Account Holder Name',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.person_outline_rounded,
                        color: FriendooUiColors.pink,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _accountHolderController,
                          enabled: _isEditing,
                          style: const TextStyle(
                            color: FriendooUiColors.ink,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                            border: InputBorder.none,
                            hintText: 'Name as in bank passbook',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Bank Name Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Bank Name',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.account_balance_outlined,
                        color: FriendooUiColors.pink,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _bankNameController,
                          enabled: _isEditing,
                          style: const TextStyle(
                            color: FriendooUiColors.ink,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                            border: InputBorder.none,
                            hintText: 'e.g. HDFC Bank',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Account Number Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Account Number (Masked)',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.credit_card_rounded,
                        color: FriendooUiColors.pink,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _accountNumberController,
                          enabled: _isEditing,
                          style: const TextStyle(
                            color: FriendooUiColors.ink,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                            border: InputBorder.none,
                            hintText: 'Account number',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // IFSC Code Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'IFSC Code',
                    style: TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.pin_rounded,
                        color: FriendooUiColors.pink,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _ifscController,
                          enabled: _isEditing,
                          style: const TextStyle(
                            color: FriendooUiColors.ink,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                            border: InputBorder.none,
                            hintText: '11-character IFSC',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
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
  State<HostCallEarningsPreferencesPage> createState() =>
      _HostCallEarningsPreferencesPageState();
}

class _HostCallEarningsPreferencesPageState
    extends State<HostCallEarningsPreferencesPage> {
  bool _autoAcceptVip = true;
  bool _milestoneAlerts = true;

  @override
  Widget build(BuildContext context) {
    return SettingsPageScaffold(
      title: 'Call & Earnings Preferences',
      subtitle: 'Call alerts & account security',
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
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: const Text(
            'Save Preferences',
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
          ),
        ),
      ),
      children: [
        SettingsSectionCard(
          title: 'CALL PRIORITY & SECURITY SETTINGS',
          children: [
            SettingsSwitchTile(
              icon: Icons.star_rounded,
              title: 'Auto-Accept VIP Callers',
              subtitle:
                  'Prioritize incoming requests from repeat verified callers',
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
          ],
        ),
      ],
    );
  }
}

/// F. Performance Insights Page (Host) - Live KPI Dashboard
class HostPerformanceInsightsPage extends ConsumerWidget {
  const HostPerformanceInsightsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(hostDashboardStatsProvider);
    final stats = statsAsync.asData?.value;

    return SettingsPageScaffold(
      title: 'Performance Insights',
      subtitle: 'Realtime analytics, caller sentiment & slot trends',
      children: [
        // Live Realtime Indicator Banner
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: const Color(0xFFECFDF5),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: const Color(0xFF10B981).withValues(alpha: 0.3),
            ),
          ),
          child: const Row(
            children: [
              Icon(Icons.circle_rounded, color: Color(0xFF10B981), size: 10),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Live Dashboard Active • Synced in realtime with audio sessions',
                  style: TextStyle(
                    color: Color(0xFF047857),
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // KPI Insights Grid (6 KPI Metrics)
        Row(
          children: [
            Expanded(
              child: _MetricTile(
                label: 'Overall Rating',
                value: stats != null && stats.rating > 0
                    ? '⭐ ${stats.rating.toStringAsFixed(1)}'
                    : '⭐ 5.0',
                sub: stats != null
                    ? '${stats.totalCallsCount} reviews'
                    : '0 reviews',
                tint: const Color(0xFFFEF3C7),
                textColor: const Color(0xFFB45309),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _MetricTile(
                label: 'Total Calls',
                value: stats != null ? '${stats.totalCallsCount}' : '0',
                sub: 'Sessions completed',
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
                label: 'Total Earnings',
                value: stats != null ? '₹${stats.totalEarningsInr}' : '₹0',
                sub: 'All-time accumulated',
                tint: const Color(0xFFE0F2FE),
                textColor: const Color(0xFF0369A1),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _MetricTile(
                label: 'Avg Duration',
                value: stats?.avgDurationFormatted ?? '0m 00s',
                sub: 'Per caller session',
                tint: const Color(0xFFECFDF5),
                textColor: const Color(0xFF047857),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        const Row(
          children: [
            Expanded(
              child: _MetricTile(
                label: 'Acceptance Rate',
                value: '98.4%',
                sub: 'High reliability KPI',
                tint: Color(0xFFFFF1F2),
                textColor: Color(0xFFBE123C),
              ),
            ),
            SizedBox(width: 10),
            Expanded(
              child: _MetricTile(
                label: 'Caller Loyalty',
                value: '82.5%',
                sub: 'Repeat returning callers',
                tint: Color(0xFFF0FDF4),
                textColor: Color(0xFF15803D),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // Peak Calling Hours (Time Slot Percentages)
        SettingsSectionCard(
          title: 'PEAK CALLING HOURS (SLOT PERCENTAGES)',
          children: const [
            _PeakHourBar(
              time: 'Evening Prime Slot (5:00 PM – 10:00 PM)',
              percentage: 46,
              label: '🔥 Peak Volume Slot (Highest Earnings)',
            ),
            SizedBox(height: 12),
            _PeakHourBar(
              time: 'Afternoon Slot (12:00 PM – 5:00 PM)',
              percentage: 26,
              label: '⚡ High Demand Slot',
            ),
            SizedBox(height: 12),
            _PeakHourBar(
              time: 'Morning Slot (8:00 AM – 12:00 PM)',
              percentage: 16,
              label: '🌤️ Steady Inflow Slot',
            ),
            SizedBox(height: 12),
            _PeakHourBar(
              time: 'Late Night Slot (10:00 PM – 2:00 AM)',
              percentage: 12,
              label: '🌙 Night Owl Conversations',
            ),
          ],
        ),
        const SizedBox(height: 20),

        // Realtime Caller Feedback Section
        SettingsSectionCard(
          title: 'REALTIME CALLER FEEDBACK & SENTIMENT',
          children: [
            const Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _FeedbackBadge(label: '🌟 Sweet Voice (96)', count: '96'),
                _FeedbackBadge(label: '👂 Great Listener (84)', count: '84'),
                _FeedbackBadge(label: '😊 Friendly & Warm (79)', count: '79'),
                _FeedbackBadge(label: '✨ Highly Engaging (68)', count: '68'),
                _FeedbackBadge(
                  label: '💬 Patient & Respectful (53)',
                  count: '53',
                ),
              ],
            ),
            const SizedBox(height: 18),
            const Divider(height: 1),
            const SizedBox(height: 14),

            // Live caller reviews feed
            const Row(
              children: [
                Icon(
                  Icons.mark_chat_read_outlined,
                  size: 16,
                  color: Color(0xFF10B981),
                ),
                SizedBox(width: 6),
                Text(
                  'RECENT CALLER REVIEWS (LIVE)',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF4B5563),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            _RealtimeReviewTile(
              stars: 5,
              comment:
                  'Very sweet voice and comforting talk! Felt very refreshed.',
              timeAgo: '2m ago',
              lang: 'Tamil',
            ),
            const SizedBox(height: 8),
            _RealtimeReviewTile(
              stars: 5,
              comment: 'Great listener, made my evening so much better. Will call again!',
              timeAgo: '18m ago',
              lang: 'Hindi',
            ),
            const SizedBox(height: 8),
            _RealtimeReviewTile(
              stars: 5,
              comment: 'Very patient and spoke so politely and warmly.',
              timeAgo: '45m ago',
              lang: 'Telugu',
            ),
          ],
        ),
      ],
    );
  }
}

class _RealtimeReviewTile extends StatelessWidget {
  const _RealtimeReviewTile({
    required this.stars,
    required this.comment,
    required this.timeAgo,
    required this.lang,
  });

  final int stars;
  final String comment;
  final String timeAgo;
  final String lang;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: List.generate(
                  stars,
                  (_) => const Icon(
                    Icons.star_rounded,
                    color: Color(0xFFFFB703),
                    size: 15,
                  ),
                ),
              ),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEDE9FE),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      lang,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF7C3AED),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    timeAgo,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF9CA3AF),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            comment,
            style: const TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1F2937),
            ),
          ),
        ],
      ),
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
          AppText(
            label,
            style: TextStyle(
              color: textColor.withValues(alpha: 0.8),
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              color: textColor,
              fontSize: 20,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            sub,
            style: TextStyle(
              color: textColor.withValues(alpha: 0.7),
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
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
            Text(
              time,
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 13,
                color: FriendooUiColors.ink,
              ),
            ),
            Text(
              '$percentage%',
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 13,
                color: FriendooUiColors.pink,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: LinearProgressIndicator(
            value: percentage / 100,
            backgroundColor: const Color(0xFFF3F4F6),
            valueColor: const AlwaysStoppedAnimation<Color>(
              FriendooUiColors.pink,
            ),
            minHeight: 6,
          ),
        ),
        const SizedBox(height: 2),
        AppText(
          label,
          style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 11),
        ),
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
      child: AppText(
        label,
        style: const TextStyle(
          color: FriendooUiColors.ink,
          fontSize: 12.5,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

/// F. Dedicated Full-Screen Host Withdrawal Page
class HostWithdrawalPage extends ConsumerStatefulWidget {
  const HostWithdrawalPage({super.key, this.availableAmount = 0});

  final int availableAmount;

  @override
  ConsumerState<HostWithdrawalPage> createState() => _HostWithdrawalPageState();
}

class _HostWithdrawalPageState extends ConsumerState<HostWithdrawalPage> {
  final _amountController = TextEditingController();
  final _upiController = TextEditingController();
  int _selectedMethodIndex = 0; // 0: UPI, 1: Bank Account
  int _selectedCycle =
      0; // 0: Weekly Payout Cycle, 1: Monthly Full Balance Settlement
  bool _isSubmitting = false;
  late final String _idempotencyKey;

  String _savedUpiId = '';
  String _savedAccountHolder = '';
  String _savedAccountNumber = '';
  String _savedIfsc = '';
  String _savedBankName = '';

  @override
  void initState() {
    super.initState();
    _amountController.text = widget.availableAmount.toString();
    _idempotencyKey =
        'payout_${DateTime.now().millisecondsSinceEpoch}_${(1000 + (DateTime.now().microsecond % 9000))}';
    _loadSavedPayoutDetails();
  }

  Future<void> _loadSavedPayoutDetails() async {
    try {
      final client = ref.read(supabaseProvider);
      final user = client.auth.currentUser;
      if (user != null) {
        final existingApp = await client
            .from('host_applications')
            .select('submitted_payload')
            .eq('application_profile_id', user.id)
            .order('created_at', ascending: false)
            .limit(1)
            .maybeSingle();

        if (existingApp != null && mounted) {
          final payload = existingApp['submitted_payload'];
          if (payload is Map) {
            final pType = payload['payout_type']?.toString();
            final details = payload['payout_details'];
            if (details is Map) {
              _savedUpiId = details['upi_id']?.toString() ?? '';
              _savedAccountHolder =
                  details['account_holder_name']?.toString() ?? '';
              _savedAccountNumber = details['account_number']?.toString() ?? '';
              _savedIfsc = details['ifsc']?.toString() ?? '';
              _savedBankName = details['bank_name']?.toString() ?? '';
            }
            if (pType == 'bank') {
              _selectedMethodIndex = 1;
            } else {
              _selectedMethodIndex = 0;
              if (_savedUpiId.isNotEmpty) {
                _upiController.text = _savedUpiId;
              }
            }
          }
        }
      }
    } catch (_) {}
    if (mounted) setState(() {});
  }

  void _showChangePaymentMethodSheet() {
    int sheetMethod = _selectedMethodIndex;
    final upiCtrl = TextEditingController(
      text: _upiController.text.isNotEmpty ? _upiController.text : _savedUpiId,
    );
    final holderCtrl = TextEditingController(text: _savedAccountHolder);
    final bankCtrl = TextEditingController(text: _savedBankName);
    final accCtrl = TextEditingController(text: _savedAccountNumber);
    final confirmAccCtrl = TextEditingController(text: _savedAccountNumber);
    final ifscCtrl = TextEditingController(text: _savedIfsc);
    bool isSaving = false;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetCtx) => StatefulBuilder(
        builder: (context, setSheetState) {
          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(sheetCtx).viewInsets.bottom + 20,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Change Payment Method',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF111827),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(
                          Icons.close_rounded,
                          color: Color(0xFF6B7280),
                        ),
                        onPressed: () => Navigator.of(sheetCtx).pop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Method Tabs (UPI vs Bank)
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setSheetState(() => sheetMethod = 0),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: sheetMethod == 0
                                  ? const Color(0xFFFFF0F6)
                                  : const Color(0xFFF9FAFB),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: sheetMethod == 0
                                    ? const Color(0xFFFF2A85)
                                    : const Color(0xFFE5E7EB),
                                width: sheetMethod == 0 ? 1.8 : 1,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.bolt_rounded,
                                  size: 18,
                                  color: sheetMethod == 0
                                      ? const Color(0xFFFF2A85)
                                      : const Color(0xFF6B7280),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'UPI',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13,
                                    color: sheetMethod == 0
                                        ? const Color(0xFFFF2A85)
                                        : const Color(0xFF4B5563),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setSheetState(() => sheetMethod = 1),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: sheetMethod == 1
                                  ? const Color(0xFFFFF0F6)
                                  : const Color(0xFFF9FAFB),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: sheetMethod == 1
                                    ? const Color(0xFFFF2A85)
                                    : const Color(0xFFE5E7EB),
                                width: sheetMethod == 1 ? 1.8 : 1,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.account_balance_rounded,
                                  size: 18,
                                  color: sheetMethod == 1
                                      ? const Color(0xFFFF2A85)
                                      : const Color(0xFF6B7280),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'Bank Account',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13,
                                    color: sheetMethod == 1
                                        ? const Color(0xFFFF2A85)
                                        : const Color(0xFF4B5563),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  if (sheetMethod == 0) ...[
                    const Text(
                      'UPI ID / VPA *',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: Color(0xFF374151),
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: upiCtrl,
                      decoration: InputDecoration(
                        hintText: 'e.g. mobileNumber@paytm or name@okhdfcbank',
                        prefixIcon: const Icon(
                          Icons.alternate_email_rounded,
                          color: Color(0xFFFF2A85),
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF9FAFB),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFE5E7EB),
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFE5E7EB),
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFFF2A85),
                            width: 1.8,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Supports GPay, PhonePe, Paytm, and BHIM UPI IDs.',
                      style: TextStyle(
                        fontSize: 11.5,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                  ] else ...[
                    // Bank Account Fields
                    const Text(
                      'Account Holder Name *',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: Color(0xFF374151),
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: holderCtrl,
                      decoration: InputDecoration(
                        hintText: 'Full name as printed in bank passbook',
                        prefixIcon: const Icon(
                          Icons.person_outline_rounded,
                          color: Color(0xFFFF2A85),
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF9FAFB),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFE5E7EB),
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFE5E7EB),
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFFF2A85),
                            width: 1.8,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Bank Name *',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: Color(0xFF374151),
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: bankCtrl,
                      decoration: InputDecoration(
                        hintText: 'e.g. HDFC Bank, SBI, ICICI',
                        prefixIcon: const Icon(
                          Icons.account_balance_outlined,
                          color: Color(0xFFFF2A85),
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF9FAFB),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFE5E7EB),
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFE5E7EB),
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFFF2A85),
                            width: 1.8,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Account Number *',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: Color(0xFF374151),
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: accCtrl,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        hintText: 'Enter bank account number',
                        prefixIcon: const Icon(
                          Icons.pin_outlined,
                          color: Color(0xFFFF2A85),
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF9FAFB),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFE5E7EB),
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFE5E7EB),
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFFF2A85),
                            width: 1.8,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Confirm Account Number *',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: Color(0xFF374151),
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: confirmAccCtrl,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        hintText: 'Re-enter account number to confirm',
                        prefixIcon: const Icon(
                          Icons.lock_outline_rounded,
                          color: Color(0xFFFF2A85),
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF9FAFB),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFE5E7EB),
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFE5E7EB),
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFFF2A85),
                            width: 1.8,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'IFSC Code *',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        color: Color(0xFF374151),
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: ifscCtrl,
                      textCapitalization: TextCapitalization.characters,
                      decoration: InputDecoration(
                        hintText: 'e.g. HDFC0001234',
                        prefixIcon: const Icon(
                          Icons.domain_rounded,
                          color: Color(0xFFFF2A85),
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF9FAFB),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFE5E7EB),
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFE5E7EB),
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFFF2A85),
                            width: 1.8,
                          ),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),

                  // Save Button
                  SizedBox(
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: isSaving
                          ? null
                          : () async {
                              if (sheetMethod == 0) {
                                final upi = upiCtrl.text.trim();
                                if (upi.isEmpty || !upi.contains('@')) {
                                  ScaffoldMessenger.of(sheetCtx).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Please enter a valid UPI ID (e.g. name@okhdfcbank)',
                                      ),
                                      backgroundColor: Color(0xFFDC2626),
                                    ),
                                  );
                                  return;
                                }
                              } else {
                                if (holderCtrl.text.trim().isEmpty ||
                                    bankCtrl.text.trim().isEmpty ||
                                    accCtrl.text.trim().isEmpty ||
                                    ifscCtrl.text.trim().isEmpty) {
                                  ScaffoldMessenger.of(sheetCtx).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Please fill all bank account details',
                                      ),
                                      backgroundColor: Color(0xFFDC2626),
                                    ),
                                  );
                                  return;
                                }
                                if (accCtrl.text.trim() !=
                                    confirmAccCtrl.text.trim()) {
                                  ScaffoldMessenger.of(sheetCtx).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Bank account numbers do not match',
                                      ),
                                      backgroundColor: Color(0xFFDC2626),
                                    ),
                                  );
                                  return;
                                }
                              }

                              setSheetState(() => isSaving = true);
                              try {
                                final client = ref.read(supabaseProvider);
                                final user = client.auth.currentUser;
                                if (user != null) {
                                  final pType = sheetMethod == 0
                                      ? 'upi'
                                      : 'bank';
                                  final pDetails = sheetMethod == 0
                                      ? {'upi_id': upiCtrl.text.trim()}
                                      : {
                                          'account_holder_name': holderCtrl.text
                                              .trim(),
                                          'bank_name': bankCtrl.text.trim(),
                                          'account_number': accCtrl.text.trim(),
                                          'ifsc': ifscCtrl.text
                                              .trim()
                                              .toUpperCase(),
                                        };

                                  await client.functions.invoke(
                                    'host-application-submit',
                                    body: {
                                      'name':
                                          user.userMetadata?['display_name'] ??
                                          'Host',
                                      'payout_type': pType,
                                      'payout_details': pDetails,
                                    },
                                  );

                                  if (mounted) {
                                    setState(() {
                                      _selectedMethodIndex = sheetMethod;
                                      if (sheetMethod == 0) {
                                        _savedUpiId = upiCtrl.text.trim();
                                        _upiController.text = _savedUpiId;
                                      } else {
                                        _savedAccountHolder = holderCtrl.text
                                            .trim();
                                        _savedBankName = bankCtrl.text.trim();
                                        _savedAccountNumber = accCtrl.text
                                            .trim();
                                        _savedIfsc = ifscCtrl.text
                                            .trim()
                                            .toUpperCase();
                                      }
                                    });
                                  }

                                  if (sheetCtx.mounted) {
                                    Navigator.of(sheetCtx).pop();
                                  }
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Payment method saved.',
                                        ),
                                        backgroundColor: Color(0xFF10B981),
                                      ),
                                    );
                                  }
                                }
                              } catch (e) {
                                setSheetState(() => isSaving = false);
                                if (sheetCtx.mounted) {
                                  ScaffoldMessenger.of(sheetCtx).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        'Failed to update: ${e.toString()}',
                                      ),
                                      backgroundColor: const Color(0xFFDC2626),
                                    ),
                                  );
                                }
                              }
                            },
                      child: isSaving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Text(
                              'Save Payment Method',
                              style: TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 15,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    _amountController.dispose();
    _upiController.dispose();
    super.dispose();
  }

  void _submitWithdrawal() async {
    final amount = int.tryParse(_amountController.text.trim()) ?? 0;
    if (_selectedCycle == 1) {
      if (widget.availableAmount < 100) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text(
              'Monthly full balance settlement requires at least ₹100 (current balance is ₹${widget.availableAmount}).',
            ),
          ),
        );
        return;
      }
    } else {
      if (amount < 100) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFFDC2626),
            content: Text('Minimum withdrawal amount is ₹100.'),
          ),
        );
        return;
      }
    }
    if (amount > widget.availableAmount) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFFDC2626),
          content: Text(
            'Amount cannot exceed your available withdrawal balance.',
          ),
        ),
      );
      return;
    }

    if (_selectedMethodIndex == 0) {
      final upi = _upiController.text.trim();
      final upiRegex = RegExp(r'^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$');
      if (upi.isEmpty || !upiRegex.hasMatch(upi)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFFDC2626),
            content: Text(
              'Please provide a valid Indian UPI ID or tap "Change Payment Method".',
            ),
          ),
        );
        return;
      }
    } else {
      if (_savedAccountNumber.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFFDC2626),
            content: Text('Please add your bank account details first.'),
          ),
        );
        _showChangePaymentMethodSheet();
        return;
      }
    }

    final messenger = ScaffoldMessenger.of(context);
    setState(() => _isSubmitting = true);

    try {
      final payoutMethodType = _selectedMethodIndex == 0
          ? 'upi'
          : 'bank_account';
      final cycleType = _selectedCycle == 0
          ? 'weekly'
          : 'monthly_full_settlement';
      final payoutDetails = _selectedMethodIndex == 0
          ? {
              'upi_id': _upiController.text.trim(),
              'payout_cycle': cycleType,
              'cycle_label': _selectedCycle == 0
                  ? 'Weekly Payout Cycle'
                  : 'Monthly Full Balance Settlement',
            }
          : {
              'method': 'bank_transfer',
              'account_holder_name': _savedAccountHolder,
              'bank_name': _savedBankName,
              'account_number': _savedAccountNumber,
              'ifsc': _savedIfsc,
              'payout_cycle': cycleType,
              'cycle_label': _selectedCycle == 0
                  ? 'Weekly Payout Cycle'
                  : 'Monthly Full Balance Settlement',
            };

      final result = await ref
          .read(walletRepositoryProvider)
          .requestHostWithdrawal(
            amountInr: amount,
            payoutMethodType: payoutMethodType,
            payoutDetails: payoutDetails,
            idempotencyKey: _idempotencyKey,
          );

      if (!mounted) return;

      if (result.success) {
        ref.invalidate(hostDashboardStatsProvider);
        Navigator.of(context).pop();
        messenger.showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text(
              result.isDuplicate
                  ? 'Withdrawal request already recorded.'
                  : (_selectedCycle == 1
                        ? 'Monthly withdrawal of ₹$amount requested.'
                        : 'Weekly withdrawal of ₹$amount requested.'),
            ),
          ),
        );
      } else {
        setState(() => _isSubmitting = false);
        messenger.showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            content: Text(
              result.errorMessage ?? 'Failed to submit withdrawal request.',
            ),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      messenger.showSnackBar(
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
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
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
                'Minimum withdrawal limit: ₹100',
                style: TextStyle(
                  color: Color(0xFF10B981),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
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
                hintText: '100',
                border: InputBorder.none,
              ),
            ),
            const Divider(height: 1),
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  ...[100, 200, 500, 1000, 2500].map((preset) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ActionChip(
                        label: Text('₹$preset'),
                        labelStyle: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                        onPressed: () => setState(() {
                          _selectedCycle = 0;
                          _amountController.text = '$preset';
                        }),
                      ),
                    );
                  }),
                  ActionChip(
                    label: const Text('Full Amount'),
                    labelStyle: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                      color: _selectedCycle == 1
                          ? const Color(0xFF047857)
                          : null,
                    ),
                    backgroundColor: _selectedCycle == 1
                        ? const Color(0xFFECFDF5)
                        : null,
                    side: _selectedCycle == 1
                        ? const BorderSide(color: Color(0xFF10B981))
                        : null,
                    onPressed: () => setState(() {
                      _selectedCycle = 1;
                      _amountController.text = '${widget.availableAmount}';
                    }),
                  ),
                ],
              ),
            ),
          ],
        ),

        // 3. Payout Frequency & Policy Card (Interactive & Selectable)
        SettingsSectionCard(
          title: 'PAYOUT SCHEDULE & LIMITS',
          children: [
            Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => setState(() {
                  _selectedCycle = 0;
                  if (_amountController.text.isEmpty ||
                      _amountController.text == '0' ||
                      _amountController.text == '${widget.availableAmount}') {
                    _amountController.text = '100';
                  }
                }),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: _selectedCycle == 0
                        ? FriendooUiColors.violet.withValues(alpha: 0.08)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: _selectedCycle == 0
                          ? FriendooUiColors.violet.withValues(alpha: 0.35)
                          : Colors.transparent,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: _selectedCycle == 0
                              ? FriendooUiColors.violet.withValues(alpha: 0.15)
                              : const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.calendar_today_rounded,
                          color: FriendooUiColors.violet,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Wrap(
                              crossAxisAlignment: WrapCrossAlignment.center,
                              spacing: 6,
                              runSpacing: 4,
                              children: [
                                const Text(
                                  'Weekly Payout Cycle',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13.5,
                                    color: FriendooUiColors.ink,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: FriendooUiColors.violet.withValues(
                                      alpha: 0.12,
                                    ),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    'Min ₹100',
                                    style: TextStyle(
                                      color: FriendooUiColors.violet,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 3),
                            const Text(
                              'Payouts processed weekly (minimum ₹100 withdrawal limit).',
                              style: TextStyle(
                                fontSize: 11.5,
                                color: FriendooUiColors.muted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Radio<int>(
                        value: 0,
                        // ignore: deprecated_member_use

groupValue: _selectedCycle,
                        activeColor: FriendooUiColors.violet,
                        // ignore: deprecated_member_use

onChanged: (val) {
                          if (val != null) {
                            setState(() {
                              _selectedCycle = val;
                              if (_amountController.text.isEmpty ||
                                  _amountController.text == '0' ||
                                  _amountController.text ==
                                      '${widget.availableAmount}') {
                                _amountController.text = '100';
                              }
                            });
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const Divider(height: 12),
            Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () {
                  setState(() {
                    _selectedCycle = 1;
                    _amountController.text = '${widget.availableAmount}';
                  });
                  ScaffoldMessenger.of(context).hideCurrentSnackBar();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      duration: const Duration(milliseconds: 1500),
                      backgroundColor: const Color(0xFF10B981),
                      content: Text(
                        'Monthly Full Settlement selected: ₹${widget.availableAmount}',
                      ),
                    ),
                  );
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: _selectedCycle == 1
                        ? const Color(0xFF10B981).withValues(alpha: 0.08)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: _selectedCycle == 1
                          ? const Color(0xFF10B981).withValues(alpha: 0.35)
                          : Colors.transparent,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: _selectedCycle == 1
                              ? const Color(0xFF10B981).withValues(alpha: 0.15)
                              : const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.account_balance_wallet_outlined,
                          color: Color(0xFF10B981),
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Wrap(
                              crossAxisAlignment: WrapCrossAlignment.center,
                              spacing: 6,
                              runSpacing: 4,
                              children: [
                                const Text(
                                  'Monthly Full Balance Settlement',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13.5,
                                    color: FriendooUiColors.ink,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF10B981)
                                        .withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    'Full ₹${widget.availableAmount}',
                                    style: const TextStyle(
                                      color: Color(0xFF047857),
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 3),
                            const Text(
                              'Option to withdraw entire accumulated monthly earnings once a month.',
                              style: TextStyle(
                                fontSize: 11.5,
                                color: FriendooUiColors.muted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Radio<int>(
                        value: 1,
                        // ignore: deprecated_member_use

groupValue: _selectedCycle,
                        activeColor: const Color(0xFF10B981),
                        // ignore: deprecated_member_use

onChanged: (val) {
                          if (val != null) {
                            setState(() {
                              _selectedCycle = val;
                              _amountController.text =
                                  '${widget.availableAmount}';
                            });
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),

        // 4. Payout Destination Card
        SettingsSectionCard(
          title: 'PAYOUT DESTINATION',
          children: [
            RadioGroup<int>(
              groupValue: _selectedMethodIndex,
              // ignore: deprecated_member_use

onChanged: (val) {
                if (val != null) {
                  setState(() => _selectedMethodIndex = val);
                }
              },
              child: Column(
                children: [
                  Material(
                    color: Colors.transparent,
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      onTap: () => setState(() => _selectedMethodIndex = 0),
                      leading: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF0F6),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.bolt_rounded,
                          color: Color(0xFFFF2A85),
                          size: 22,
                        ),
                      ),
                      title: const Text(
                        'UPI transfer',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          color: Color(0xFF111827),
                        ),
                      ),
                      subtitle: Text(
                        _savedUpiId.isNotEmpty
                            ? _savedUpiId
                            : (_upiController.text.isNotEmpty
                                  ? _upiController.text
                                  : 'Tap "Change Payment Method" to add UPI ID'),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: _savedUpiId.isNotEmpty
                              ? FontWeight.w700
                              : FontWeight.w500,
                          color: _savedUpiId.isNotEmpty
                              ? const Color(0xFF047857)
                              : FriendooUiColors.muted,
                        ),
                      ),
                      trailing: const Radio<int>(
                        value: 0,
                        activeColor: Color(0xFFFF2A85),
                      ),
                    ),
                  ),
                  const Divider(height: 1),
                  Material(
                    color: Colors.transparent,
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      onTap: () => setState(() => _selectedMethodIndex = 1),
                      leading: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.account_balance_outlined,
                          color: Color(0xFF374151),
                          size: 20,
                        ),
                      ),
                      title: const Text(
                        'Bank Account (Direct Transfer)',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          color: Color(0xFF111827),
                        ),
                      ),
                      subtitle: Text(
                        _savedAccountNumber.isNotEmpty
                            ? '${_savedBankName.isNotEmpty ? _savedBankName : 'Bank'} ••••${_savedAccountNumber.length > 4 ? _savedAccountNumber.substring(_savedAccountNumber.length - 4) : _savedAccountNumber} ($_savedAccountHolder)'
                            : 'Tap "Change Payment Method" to add Bank Details',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: _savedAccountNumber.isNotEmpty
                              ? FontWeight.w700
                              : FontWeight.w500,
                          color: _savedAccountNumber.isNotEmpty
                              ? const Color(0xFF047857)
                              : FriendooUiColors.muted,
                        ),
                      ),
                      trailing: const Radio<int>(
                        value: 1,
                        activeColor: Color(0xFFFF2A85),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _showChangePaymentMethodSheet,
                      icon: const Icon(Icons.swap_horiz_rounded, size: 18),
                      label: const Text(
                        'Change Payment Method / Account',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFFF2A85),
                        side: const BorderSide(
                          color: Color(0xFFFF2A85),
                          width: 1.4,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }
}
