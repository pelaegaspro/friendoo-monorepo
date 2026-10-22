import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/supabase/supabase_provider.dart';
import '../data/profile_repository.dart';
import 'profile_input_widgets.dart';

class HostApplicationPage extends ConsumerStatefulWidget {
  const HostApplicationPage({super.key, this.isEditingExisting = false});

  final bool isEditingExisting;

  static Future<bool?> push(
    BuildContext context, {
    bool isEditingExisting = false,
  }) {
    return Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) =>
            HostApplicationPage(isEditingExisting: isEditingExisting),
      ),
    );
  }

  @override
  ConsumerState<HostApplicationPage> createState() =>
      _HostApplicationPageState();
}

class _HostApplicationPageState extends ConsumerState<HostApplicationPage> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _ageController = TextEditingController(text: '22');
  final _cityController = TextEditingController();
  final _bioController = TextEditingController();

  // Payout Details
  String _payoutType = 'upi'; // 'upi' or 'bank'
  final _upiIdController = TextEditingController();
  final _accountHolderController = TextEditingController();
  final _accountNumberController = TextEditingController();
  final _confirmAccountController = TextEditingController();
  final _ifscController = TextEditingController();
  final _bankNameController = TextEditingController();

  final Set<String> _selectedLanguages = {'Tamil'};

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

  bool _isSubmitting = false;
  bool _isLoadingInitial = true;
  String? _existingStatus;

  @override
  void initState() {
    super.initState();
    _loadExistingDetails();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ageController.dispose();
    _cityController.dispose();
    _bioController.dispose();
    _upiIdController.dispose();
    _accountHolderController.dispose();
    _accountNumberController.dispose();
    _confirmAccountController.dispose();
    _ifscController.dispose();
    _bankNameController.dispose();
    super.dispose();
  }

  Future<void> _loadExistingDetails() async {
    final client = ref.read(supabaseProvider);
    final user = client.auth.currentUser;
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

    if (user != null) {
      try {
        final existingApp = await client
            .from('host_applications')
            .select('*')
            .eq('application_profile_id', user.id)
            .order('created_at', ascending: false)
            .limit(1)
            .maybeSingle();

        if (existingApp != null && mounted) {
          _existingStatus = existingApp['status'] as String?;
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
          if (payload is Map) {
            if (payload['age'] != null) {
              _ageController.text = payload['age'].toString();
            }
            if (payload['payout_type'] != null) {
              _payoutType = payload['payout_type'].toString();
            }
            final details = payload['payout_details'];
            if (details is Map) {
              if (details['upi_id'] != null) {
                _upiIdController.text = details['upi_id'].toString();
              }
              if (details['account_holder_name'] != null) {
                _accountHolderController.text = details['account_holder_name']
                    .toString();
              }
              if (details['account_number'] != null) {
                _accountNumberController.text = details['account_number']
                    .toString();
                _confirmAccountController.text = details['account_number']
                    .toString();
              }
              if (details['ifsc'] != null) {
                _ifscController.text = details['ifsc'].toString();
              }
              if (details['bank_name'] != null) {
                _bankNameController.text = details['bank_name'].toString();
              }
            }
          }
        }
      } catch (_) {}
    }

    if (mounted) {
      setState(() => _isLoadingInitial = false);
    }
  }

  Future<void> _submitHostDetails() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedLanguages.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one language you can speak.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    final ageInt = int.tryParse(_ageController.text.trim()) ?? 0;
    if (ageInt < 18) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'You must be at least 18 years old to register as a host.',
          ),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    if (_payoutType == 'bank') {
      if (_accountNumberController.text.trim() !=
          _confirmAccountController.text.trim()) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Bank account numbers do not match.'),
            backgroundColor: Color(0xFFEF4444),
          ),
        );
        return;
      }
    }

    setState(() => _isSubmitting = true);

    try {
      final client = ref.read(supabaseProvider);

      final Map<String, dynamic> payoutDetails = _payoutType == 'upi'
          ? {'upi_id': _upiIdController.text.trim()}
          : {
              'account_holder_name': _accountHolderController.text.trim(),
              'account_number': _accountNumberController.text.trim(),
              'ifsc': _ifscController.text.trim().toUpperCase(),
              'bank_name': _bankNameController.text.trim(),
            };

      final response = await client.functions.invoke(
        'host-application-submit',
        body: {
          'name': _nameController.text.trim(),
          'age': ageInt,
          'city': _cityController.text.trim(),
          'languages': _selectedLanguages
              .where((language) => language.toLowerCase() != 'english')
              .toList(),
          'bio': _bioController.text.trim(),
          'payout_type': _payoutType,
          'payout_details': payoutDetails,
        },
      );

      if (response.status == 200) {
        if (!mounted) return;
        _showSuccessDialog();
      } else {
        final err = response.data is Map
            ? (response.data['error'] ?? 'Submission failed')
            : 'Failed to submit application';
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(err.toString()),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showSuccessDialog() {
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [Color(0xFF10B981), Color(0xFF059669)],
                ),
              ),
              child: const Icon(
                Icons.check_rounded,
                color: Colors.white,
                size: 36,
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'Details Saved Successfully!',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              widget.isEditingExisting
                  ? 'Your host profile and payout details are updated.'
                  : 'Your application has been submitted for review.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13.5,
                color: Color(0xFF4B5563),
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  Navigator.of(context).pop(true);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF2A85),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text(
                  'Done',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        shadowColor: Colors.black.withValues(alpha: 0.05),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF111827)),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          widget.isEditingExisting ? 'Host Profile & Payout' : 'Become a Host',
          style: const TextStyle(
            color: Color(0xFF111827),
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
      body: _isLoadingInitial
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
                children: [
                  // Status Banner if existing
                  if (_existingStatus != null && !widget.isEditingExisting) ...[
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: _existingStatus == 'approved'
                            ? const Color(0xFFECFDF5)
                            : const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: _existingStatus == 'approved'
                              ? const Color(0xFF10B981)
                              : const Color(0xFFF59E0B),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _existingStatus == 'approved'
                                ? Icons.verified_rounded
                                : Icons.hourglass_top_rounded,
                            color: _existingStatus == 'approved'
                                ? const Color(0xFF059669)
                                : const Color(0xFFD97706),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _existingStatus == 'approved'
                                  ? 'Your host account is approved. Update your details below.'
                                  : 'Your application is under review. You can update your details below.',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: _existingStatus == 'approved'
                                    ? const Color(0xFF065F46)
                                    : const Color(0xFF92400E),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Header Hero Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFF2A85), Color(0xFF7C3AED)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFFF2A85)
                              .withValues(alpha: 0.25),
                          blurRadius: 16,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.star_rounded,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 10),
                            const Text(
                              'Host Onboarding',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 19,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Add your profile and payout details to apply as a host.',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ==============================
                  // SECTION 1: PERSONAL DETAILS
                  // ==============================
                  _buildSectionHeader(
                    '1. PERSONAL DETAILS',
                    Icons.person_rounded,
                  ),
                  const SizedBox(height: 12),

                  _buildCardWrapper(
                    children: [
                      // Name
                      PremiumProfileTextField(
                        controller: _nameController,
                        label: 'Full Name / Host Display Name',
                        icon: Icons.badge_rounded,
                        hintText: 'e.g. Priya Sharma',
                        helperText:
                            'Your public name shown to callers on the lounge',
                        maxLength: 50,
                        accentColor: const Color(0xFFFF2A85),
                        isRequired: true,
                        validator: (v) => (v == null || v.trim().length < 2)
                            ? 'Please enter your full name'
                            : null,
                      ),
                      const SizedBox(height: 16),

                      // Age
                      PremiumAgeSelector(
                        selectedAge:
                            int.tryParse(_ageController.text.trim()) ?? 22,
                        accentColor: const Color(0xFFFF2A85),
                        onChanged: (newAge) {
                          setState(
                            () => _ageController.text = newAge.toString(),
                          );
                        },
                      ),
                      const SizedBox(height: 16),

                      // City
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
                              decoration: _inputDecoration(
                                hintText: 'e.g. Chennai, Tamil Nadu',
                                prefixIcon: Icons.location_city_rounded,
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
                                final isSelected =
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
                                      color: isSelected
                                          ? const Color(0xFFFFF0F6)
                                          : const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: isSelected
                                            ? const Color(0xFFFF2A85)
                                            : const Color(0xFFE2E8F0),
                                      ),
                                    ),
                                    child: Text(
                                      c,
                                      style: TextStyle(
                                        fontSize: 11.5,
                                        fontWeight: isSelected
                                            ? FontWeight.w800
                                            : FontWeight.w600,
                                        color: isSelected
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
                      const SizedBox(height: 20),

                      // Languages Spoken
                      const Text(
                        'Languages Spoken (Select all that apply) *',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                          color: Color(0xFF374151),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _availableLanguages.map((lang) {
                          final isSelected = _selectedLanguages.contains(lang);
                          return FilterChip(
                            label: Text(lang),
                            selected: isSelected,
                            selectedColor: const Color(0xFFFFF0F6),
                            checkmarkColor: const Color(0xFFFF2A85),
                            labelStyle: TextStyle(
                              color: isSelected
                                  ? const Color(0xFFFF2A85)
                                  : const Color(0xFF374151),
                              fontWeight: isSelected
                                  ? FontWeight.w800
                                  : FontWeight.w600,
                              fontSize: 12.5,
                            ),
                            side: BorderSide(
                              color: isSelected
                                  ? const Color(0xFFFF2A85)
                                  : const Color(0xFFE5E7EB),
                            ),
                            onSelected: (selected) {
                              setState(() {
                                if (selected) {
                                  _selectedLanguages.add(lang);
                                } else {
                                  if (_selectedLanguages.length > 1) {
                                    _selectedLanguages.remove(lang);
                                  }
                                }
                              });
                            },
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 16),

                      // Bio / Welcome Message with Quick Prompts
                      PremiumBioTextArea(
                        controller: _bioController,
                        label: 'Short Bio / Intro',
                        hintText: 'Share a welcoming intro for callers (e.g. friendly chats, movies, music)...',
                        maxLength: 150,
                        accentColor: const Color(0xFFFF2A85),
                        promptChips: const [
                          '🌟 Friendly host ready to chat',
                          '💬 Life talks & casual chat',
                          '🎙️ Regional-language voice lounge',
                          '☕ Relaxed evening conversations',
                        ],
                        onChanged: (_) => setState(() {}),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // ==============================
                  // SECTION 2: PAYOUT DETAILS (UPI / BANK)
                  // ==============================
                  _buildSectionHeader(
                    '2. PAYOUT & WITHDRAWAL ACCOUNT',
                    Icons.account_balance_wallet_rounded,
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Host call earnings are transferred directly to this account upon withdrawal.',
                    style: TextStyle(fontSize: 12.5, color: Color(0xFF6B7280)),
                  ),
                  const SizedBox(height: 12),

                  _buildCardWrapper(
                    children: [
                      // Payout Type Selector (UPI vs Bank)
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _payoutType = 'upi'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 12,
                                ),
                                decoration: BoxDecoration(
                                  color: _payoutType == 'upi'
                                      ? const Color(0xFFFFF0F6)
                                      : const Color(0xFFF9FAFB),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: _payoutType == 'upi'
                                        ? const Color(0xFFFF2A85)
                                        : const Color(0xFFE5E7EB),
                                    width: _payoutType == 'upi' ? 1.8 : 1,
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.bolt_rounded,
                                      size: 18,
                                      color: _payoutType == 'upi'
                                          ? const Color(0xFFFF2A85)
                                          : const Color(0xFF6B7280),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'UPI (Instant)',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13,
                                        color: _payoutType == 'upi'
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
                              onTap: () => setState(() => _payoutType = 'bank'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 12,
                                ),
                                decoration: BoxDecoration(
                                  color: _payoutType == 'bank'
                                      ? const Color(0xFFFFF0F6)
                                      : const Color(0xFFF9FAFB),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: _payoutType == 'bank'
                                        ? const Color(0xFFFF2A85)
                                        : const Color(0xFFE5E7EB),
                                    width: _payoutType == 'bank' ? 1.8 : 1,
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.account_balance_rounded,
                                      size: 18,
                                      color: _payoutType == 'bank'
                                          ? const Color(0xFFFF2A85)
                                          : const Color(0xFF6B7280),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Bank Account',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13,
                                        color: _payoutType == 'bank'
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

                      if (_payoutType == 'upi') ...[
                        const Text(
                          'UPI ID / VPA *',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            color: Color(0xFF374151),
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _upiIdController,
                          decoration: _inputDecoration(
                            hintText:
                                'e.g. mobileNumber@paytm or name@okhdfcbank',
                            prefixIcon: Icons.alternate_email_rounded,
                          ),
                          validator: (v) {
                            if (_payoutType != 'upi') return null;
                            if (v == null ||
                                v.trim().isEmpty ||
                                !v.contains('@')) {
                              return 'Please enter a valid UPI ID with @';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Supports GPay, PhonePe, Paytm, and BHIM UPI IDs.',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: Color(0xFF9CA3AF),
                          ),
                        ),
                      ] else ...[
                        // Bank Account Holder
                        const Text(
                          'Account Holder Name *',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            color: Color(0xFF374151),
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _accountHolderController,
                          decoration: _inputDecoration(
                            hintText: 'Full name as printed in passbook',
                            prefixIcon: Icons.person_outline_rounded,
                          ),
                          validator: (v) {
                            if (_payoutType != 'bank') return null;
                            if (v == null || v.trim().isEmpty)
                              return 'Enter account holder name';
                            return null;
                          },
                        ),
                        const SizedBox(height: 14),

                        // Account Number
                        const Text(
                          'Bank Account Number *',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            color: Color(0xFF374151),
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _accountNumberController,
                          keyboardType: TextInputType.number,
                          obscureText: true,
                          decoration: _inputDecoration(
                            hintText: 'Enter bank account number',
                            prefixIcon: Icons.pin_outlined,
                          ),
                          validator: (v) {
                            if (_payoutType != 'bank') return null;
                            if (v == null || v.trim().length < 6)
                              return 'Enter valid account number';
                            return null;
                          },
                        ),
                        const SizedBox(height: 14),

                        // Confirm Account Number
                        const Text(
                          'Confirm Bank Account Number *',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            color: Color(0xFF374151),
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _confirmAccountController,
                          keyboardType: TextInputType.number,
                          decoration: _inputDecoration(
                            hintText: 'Re-enter account number to confirm',
                            prefixIcon: Icons.lock_outline_rounded,
                          ),
                          validator: (v) {
                            if (_payoutType != 'bank') return null;
                            if (v != _accountNumberController.text.trim()) {
                              return 'Account numbers do not match';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 14),

                        // IFSC & Bank Name
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'IFSC Code *',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 13,
                                      color: Color(0xFF374151),
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  TextFormField(
                                    controller: _ifscController,
                                    textCapitalization:
                                        TextCapitalization.characters,
                                    decoration: _inputDecoration(
                                      hintText: 'e.g. HDFC0001234',
                                      prefixIcon: Icons.domain_rounded,
                                    ),
                                    validator: (v) {
                                      if (_payoutType != 'bank') return null;
                                      if (v == null || v.trim().length < 8)
                                        return 'Invalid IFSC';
                                      return null;
                                    },
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Bank Name',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 13,
                                      color: Color(0xFF374151),
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  TextFormField(
                                    controller: _bankNameController,
                                    decoration: _inputDecoration(
                                      hintText: 'e.g. HDFC Bank',
                                      prefixIcon:
                                          Icons.account_balance_outlined,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Submit Action Button
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitHostDetails,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFF2A85),
                        foregroundColor: Colors.white,
                        elevation: 4,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: _isSubmitting
                          ? const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2.2,
                                  ),
                                ),
                                SizedBox(width: 12),
                                Text(
                                  'Submitting Details…',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 15,
                                  ),
                                ),
                              ],
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.verified_user_rounded,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                const Text(
                                  'Complete Host Onboarding',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 16,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: const Color(0xFFFF2A85)),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w900,
            letterSpacing: 0.5,
            color: Color(0xFF1F2937),
          ),
        ),
      ],
    );
  }

  Widget _buildCardWrapper({required List<Widget> children}) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String hintText,
    required IconData prefixIcon,
  }) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: const TextStyle(
        color: Color(0xFF94A3B8),
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
      prefixIcon: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: Icon(prefixIcon, color: const Color(0xFFFF2A85), size: 20),
      ),
      prefixIconConstraints: const BoxConstraints(minWidth: 48, minHeight: 48),
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.2),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFFF2A85), width: 1.8),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.2),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.8),
      ),
    );
  }
}
