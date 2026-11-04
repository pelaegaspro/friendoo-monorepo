import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/friendoo_app.dart';
import '../../../core/supabase/supabase_provider.dart';
import '../../discover/presentation/desi_avatar.dart';
import '../../profile/data/profile_repository.dart';

import 'package:shared_preferences/shared_preferences.dart';


/// Step 1: Profile Creation Page (Name & Date of Birth with live Age calculation).
class NameAndDobSetupPage extends ConsumerStatefulWidget {
  const NameAndDobSetupPage({
    super.key,
    required this.isHostInitial,
    this.initialPhone = '',
    this.onComplete,
  });

  final bool isHostInitial;
  final String initialPhone;
  final VoidCallback? onComplete;

  static Future<void> push(
    BuildContext context, {
    required bool isHostInitial,
    String initialPhone = '',
    VoidCallback? onComplete,
  }) {
    return Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => NameAndDobSetupPage(
          isHostInitial: isHostInitial,
          initialPhone: initialPhone,
          onComplete: onComplete,
        ),
      ),
    );
  }

  @override
  ConsumerState<NameAndDobSetupPage> createState() =>
      _NameAndDobSetupPageState();
}

class _NameAndDobSetupPageState extends ConsumerState<NameAndDobSetupPage> {
  late bool _isHost;
  final _nameController = TextEditingController();
  final _cityController = TextEditingController();
  DateTime? _selectedDob;
  int? _computedAge;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final active = ProfileRepository.currentActiveProfile;
    _isHost = active?.isHost ?? widget.isHostInitial;
    final initialName =
        (active != null &&
            active.displayName.isNotEmpty &&
            active.displayName != 'User' &&
            active.displayName != 'Friendoo User' &&
            active.displayName != 'Friendoo user')
        ? active.displayName
        : '';
    _nameController.text = initialName;
    _cityController.text = active?.city ?? '';
    _selectedDob = DateTime(2002, 5, 15);
    _recalculateAge();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  void _recalculateAge() {
    if (_selectedDob == null) {
      _computedAge = null;
      return;
    }
    final now = DateTime.now();
    int age = now.year - _selectedDob!.year;
    if (now.month < _selectedDob!.month ||
        (now.month == _selectedDob!.month && now.day < _selectedDob!.day)) {
      age--;
    }
    _computedAge = age.clamp(18, 80);
  }

  Future<void> _pickDateOfBirth() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDob ?? DateTime(2002, 5, 15),
      firstDate: DateTime(1940),
      lastDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
      helpText: 'Select Date of Birth',
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: _isHost
                  ? const Color(0xFFFF2A85)
                  : const Color(0xFF6366F1),
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: const Color(0xFF111827),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _selectedDob = picked;
        _recalculateAge();
      });
    }
  }

  String _formatDob(DateTime dt) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${dt.day.toString().padLeft(2, '0')} ${months[dt.month - 1]} ${dt.year}';
  }

  Future<void> _createProfileAndProceed() async {
    if (_isSubmitting) return;

    final name = _nameController.text.trim();
    final city = _cityController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please enter your name.')));
      return;
    }

    if (city.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please enter or select your city.')));
      return;
    }

    if (_selectedDob == null || _computedAge == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select your date of birth.')),
      );
      return;
    }

    final verifiedProfile = ProfileRepository.currentActiveProfile;
    if (verifiedProfile != null && verifiedProfile.isHost != _isHost) {
      setState(() => _isHost = verifiedProfile.isHost);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Your profile type is verified by Friendoo and cannot be changed here.',
          ),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final defaultPreset = _isHost ? 'host_01' : 'user_01';
      final avatarConfig = FriendooAvatarConfig(
        gender: 'male',
        role: _isHost ? 'host' : 'user',
        presetId: defaultPreset,
      );

      // Immediately write name, city, and default avatar to Supabase
      await ref.read(profileRepositoryProvider).completeInitialProfile(
        avatarConfig: avatarConfig,
        displayName: name,
        city: city,
      );

      // Persist to local SharedPreferences for immediate cold-start hydration
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('friendoo_profile_name', name);
        await prefs.setString('friendoo_profile_city', city);
        await prefs.setInt('friendoo_profile_age', _computedAge!);
        await prefs.setString('friendoo_profile_avatar_id', defaultPreset);
        await prefs.setBool('friendoo_saved_is_host', _isHost);
      } catch (_) {}

      if (!mounted) return;

      // Navigate to avatar selection page where user can optionally customize
      Navigator.of(context).push<void>(
        MaterialPageRoute(
          builder: (_) => StandaloneAvatarSelectionPage(
            displayName: name,
            city: city,
            isHost: _isHost,
            dateOfBirth: _selectedDob!,
            userAge: _computedAge!,
            onComplete: widget.onComplete,
          ),
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save profile: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _handleExitOrBack() {
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    } else {
      SystemNavigator.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeColor = _isHost
        ? const Color(0xFFFF2A85)
        : const Color(0xFF6366F1);

    return PopScope(
      canPop: Navigator.of(context).canPop(),
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          _handleExitOrBack();
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF9FAFB),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(
              Icons.arrow_back_rounded,
              color: Color(0xFF111827),
            ),
            onPressed: _handleExitOrBack,
          ),
          title: Text(
            _isHost ? 'Host Profile Setup' : 'User Profile Setup',
            style: const TextStyle(
              color: Color(0xFF111827),
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  _isHost ? 'Host Details' : 'Enter your details',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF111827),
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _isHost
                      ? 'Complete your verified host profile to receive calls and earn.'
                      : 'Please enter your name and date of birth to continue.',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF6B7280),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 28),

                // Name Field
                const Text(
                  'Name',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF374151),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _nameController,
                  cursorColor: themeColor,
                  textCapitalization: TextCapitalization.words,
                  style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                  decoration: InputDecoration(
                    hintText: 'Enter your full name',
                    hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14.5),
                    prefixIcon: Icon(
                      Icons.person_outline_rounded,
                      color: themeColor,
                      size: 20,
                    ),
                    suffixIcon: const Icon(
                      Icons.edit_outlined,
                      color: Color(0xFF94A3B8),
                      size: 18,
                    ),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: themeColor, width: 1.5),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
                const SizedBox(height: 22),

                // City Field
                const Text(
                  'City / Metro',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF374151),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _cityController,
                  cursorColor: themeColor,
                  textCapitalization: TextCapitalization.words,
                  style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                  decoration: InputDecoration(
                    hintText: 'Enter your city (e.g. Chennai, Mumbai)',
                    hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14.5),
                    prefixIcon: Icon(
                      Icons.location_on_outlined,
                      color: themeColor,
                      size: 20,
                    ),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: themeColor, width: 1.5),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
                const SizedBox(height: 10),
                // Popular Indian Cities Quick-Select Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      'Chennai',
                      'Mumbai',
                      'Delhi',
                      'Bengaluru',
                      'Hyderabad',
                      'Kolkata',
                      'Pune',
                      'Ahmedabad',
                      'Coimbatore',
                      'Madurai',
                    ].map((cityName) {
                      final isSelected =
                          _cityController.text.trim().toLowerCase() ==
                          cityName.toLowerCase();
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(cityName),
                          selected: isSelected,
                          selectedColor: themeColor.withValues(alpha: 0.15),
                          labelStyle: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color:
                                isSelected
                                    ? themeColor
                                    : const Color(0xFF4B5563),
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                            side: BorderSide(
                              color:
                                  isSelected
                                      ? themeColor
                                      : const Color(0xFFE5E7EB),
                            ),
                          ),
                          backgroundColor: Colors.white,
                          onSelected: (_) {
                            setState(() {
                              _cityController.text = cityName;
                            });
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 22),

                // Date of Birth Field
                const Text(
                  'Date of Birth',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF374151),
                  ),
                ),
                const SizedBox(height: 8),
                InkWell(
                  onTap: _pickDateOfBirth,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.calendar_today_rounded,
                              color: themeColor,
                              size: 22,
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Text(
                                _selectedDob != null
                                    ? _formatDob(_selectedDob!)
                                    : 'Select date of birth',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: _selectedDob != null
                                      ? const Color(0xFF111827)
                                      : const Color(0xFF9CA3AF),
                                ),
                              ),
                            ),
                            const Icon(
                              Icons.edit_outlined,
                              size: 18,
                              color: Color(0xFF9CA3AF),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Container(height: 0.8, color: const Color(0xFFE5E7EB)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Live Current Age Display
                if (_computedAge != null && _selectedDob != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.cake_outlined,
                          color: Color(0xFF4B5563),
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Age: $_computedAge years',
                          style: const TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF1F2937),
                          ),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 36),

                // Continue Button
                FilledButton(
                  onPressed: _isSubmitting ? null : _createProfileAndProceed,
                  style: FilledButton.styleFrom(
                    backgroundColor: themeColor,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 2,
                  ),
                  child: _isSubmitting
                      ? const SizedBox.square(
                          dimension: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.5,
                          ),
                        )
                      : const Text(
                          'Continue ➔',
                          style: TextStyle(
                            fontSize: 15.5,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
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
}

/// Step 2: Snapchat-style 3D Bitmoji Avatar Customizer Page.
/// Features:
/// - Live 3D Avatar Stage with real-time updates.
/// - 10 Base Avatar Model Selection (Gender & Age matched).
/// - Interactive Skin Tone Palette (5 Authentic Indian Melanin Tones).
/// - Backdrop Aura Gradient Selector.
/// - Style & Accessory Controls (Bindis, Earrings, Facial Hair).
class StandaloneAvatarSelectionPage extends ConsumerStatefulWidget {
  const StandaloneAvatarSelectionPage({
    super.key,
    required this.displayName,
    this.city,
    required this.isHost,
    required this.dateOfBirth,
    required this.userAge,
    this.onComplete,
  });

  final String displayName;
  final String? city;
  final bool isHost;
  final DateTime dateOfBirth;
  final int userAge;
  final VoidCallback? onComplete;

  @override
  ConsumerState<StandaloneAvatarSelectionPage> createState() =>
      _StandaloneAvatarSelectionPageState();
}

class _StandaloneAvatarSelectionPageState
    extends ConsumerState<StandaloneAvatarSelectionPage> {
  late String _selectedAvatarId;
  late List<DesiAvatarPreset> _genderAvatars;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _genderAvatars = DesiAvatarPack.getAvatarsForRole(
      widget.isHost ? 'host' : 'user',
      widget.userAge,
    );
    _selectedAvatarId = _genderAvatars.first.id;
  }

  Future<void> _confirmAvatarAndGoToDiscover() async {
    if (_isSaving) return;

    final selectedPreset = DesiAvatarPack.findById(_selectedAvatarId);
    final avatarConfig = FriendooAvatarConfig(
      gender: selectedPreset.gender.name,
      role: widget.isHost ? 'host' : 'user',
      presetId: selectedPreset.id,
    );

    final isDebugMock = ref.read(supabaseProvider).auth.currentUser == null;
    setState(() => _isSaving = true);
    try {
      await ref
          .read(profileRepositoryProvider)
          .completeInitialProfile(
            avatarConfig: avatarConfig,
            displayName: widget.displayName,
            city: widget.city,
          );
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to save profile: $e')));
      }
      return;
    }

    if (!mounted) return;
    final savedProfile = ProfileRepository.currentActiveProfile;
    final resolvedIsHost = savedProfile?.isHost ?? widget.isHost;
    ref.read(isHostModeProvider.notifier).state = resolvedIsHost;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('friendoo_saved_is_host', resolvedIsHost);
    } catch (_) {}
    ref.invalidate(currentUserProfileStreamProvider);

    if (isDebugMock) {
      ref.read(debugMockSessionProvider.notifier).state = true;
    }

    if (widget.onComplete != null) {
      widget.onComplete!();
    }
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedPreset = DesiAvatarPack.findById(_selectedAvatarId);
    final themeColor = widget.isHost
        ? const Color(0xFFFF2A85)
        : const Color(0xFF6366F1);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF111827)),
          onPressed: () {
            if (widget.onComplete != null) {
              widget.onComplete!();
            }
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            }
          },
        ),
        title: Text(
          widget.isHost ? 'Choose Host Avatar' : 'Choose Your Avatar',
          style: const TextStyle(
            color: Color(0xFF111827),
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
        actions: [
          TextButton(
            onPressed: _isSaving
                ? null
                : () {
                    if (widget.onComplete != null) {
                      widget.onComplete!();
                    }
                    if (Navigator.of(context).canPop()) {
                      Navigator.of(context).pop();
                    }
                  },
            child: Text(
              'Skip',
              style: TextStyle(
                color: themeColor,
                fontWeight: FontWeight.w800,
                fontSize: 15,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Top Preview Stage with User's own Name and Age
            Container(
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 6,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: themeColor, width: 3),
                    ),
                    child: ClipOval(
                      child: Image.asset(
                        selectedPreset.assetPath,
                        fit: BoxFit.cover,
                        alignment: Alignment.topCenter,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.displayName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF111827),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF3F4F6),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${widget.userAge} yrs',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF374151),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Clean 10-Avatar Grid View without dummy names or customization tabs
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 14,
                  mainAxisSpacing: 14,
                  childAspectRatio: 0.95,
                ),
                itemCount: _genderAvatars.length,
                itemBuilder: (context, index) {
                  final preset = _genderAvatars[index];
                  final isChosen = preset.id == _selectedAvatarId;

                  return InkWell(
                    onTap: () {
                      setState(() {
                        _selectedAvatarId = preset.id;
                      });
                    },
                    borderRadius: BorderRadius.circular(20),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      decoration: BoxDecoration(
                        color: isChosen
                            ? (widget.isHost
                                  ? const Color(0xFFFDF2F8)
                                  : const Color(0xFFEEF2FF))
                            : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isChosen
                              ? themeColor
                              : const Color(0xFFE5E7EB),
                          width: isChosen ? 3.0 : 1.0,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: isChosen
                                ? themeColor.withValues(alpha: 0.25)
                                : Colors.black.withValues(alpha: 0.04),
                            blurRadius: isChosen ? 8 : 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(12),
                      child: Center(
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Container(
                              width: 90,
                              height: 90,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                              ),
                              child: ClipOval(
                                child: Image.asset(
                                  preset.assetPath,
                                  fit: BoxFit.cover,
                                  alignment: Alignment.topCenter,
                                ),
                              ),
                            ),
                            if (isChosen)
                              Positioned(
                                right: 0,
                                bottom: 0,
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: themeColor,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: Colors.white,
                                      width: 2,
                                    ),
                                  ),
                                  child: const Icon(
                                    Icons.check_rounded,
                                    color: Colors.white,
                                    size: 16,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            // Bottom Save & Continue CTA Button
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _isSaving ? null : _confirmAvatarAndGoToDiscover,
                  style: FilledButton.styleFrom(
                    backgroundColor: themeColor,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 2,
                  ),
                  child: _isSaving
                      ? const SizedBox.square(
                          dimension: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.5,
                          ),
                        )
                      : const Text(
                          'Save & Continue ➔',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
