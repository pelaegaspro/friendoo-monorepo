import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Authentic Instagram-Style Edit Profile Form Fields
///
/// Clean, minimal, high-end design:
/// - Label on top (small, subtle, crisp grey #6B7280)
/// - Bottom border only (divider line #E5E7EB, turns accent/blue on focus)
/// - Pure white or transparent background (no bulky card boxes)
/// - Clean font weight and spacing matching iOS & Android Instagram Edit Profile.

class InstagramTextField extends StatefulWidget {
  const InstagramTextField({
    super.key,
    required this.controller,
    required this.label,
    this.hintText,
    this.helperText,
    this.accentColor = const Color(0xFF0095F6), // Instagram signature blue
    this.maxLength,
    this.maxLines = 1,
    this.minLines,
    this.keyboardType,
    this.textInputAction,
    this.textCapitalization = TextCapitalization.words,
    this.validator,
    this.onChanged,
    this.isRequired = false,
    this.prefixIcon,
    this.showBottomDivider = true,
  });

  final TextEditingController controller;
  final String label;
  final String? hintText;
  final String? helperText;
  final Color accentColor;
  final int? maxLength;
  final int maxLines;
  final int? minLines;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final TextCapitalization textCapitalization;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onChanged;
  final bool isRequired;
  final IconData? prefixIcon;
  final bool showBottomDivider;

  @override
  State<InstagramTextField> createState() => _InstagramTextFieldState();
}

class _InstagramTextFieldState extends State<InstagramTextField> {
  final FocusNode _focusNode = FocusNode();
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      setState(() => _isFocused = _focusNode.hasFocus);
    });
    widget.controller.addListener(_rebuild);
  }

  @override
  void dispose() {
    _focusNode.dispose();
    widget.controller.removeListener(_rebuild);
    super.dispose();
  }

  void _rebuild() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final hasText = widget.controller.text.isNotEmpty;
    final textLength = widget.controller.text.length;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row with Label & Optional Counter
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                widget.label,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: _isFocused ? widget.accentColor : const Color(0xFF475569),
                  letterSpacing: 0.1,
                ),
              ),
              if (widget.maxLength != null)
                Text(
                  '$textLength/${widget.maxLength}',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: textLength >= widget.maxLength!
                        ? const Color(0xFFEF4444)
                        : const Color(0xFF9CA3AF),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),

          // Apple-style rounded frosted card input (Zero harsh black boxes)
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            decoration: BoxDecoration(
              color: _isFocused ? Colors.white : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _isFocused ? widget.accentColor : const Color(0xFFE2E8F0),
                width: _isFocused ? 1.5 : 1.0,
              ),
              boxShadow: _isFocused
                  ? [
                      BoxShadow(
                        color: widget.accentColor.withValues(alpha: 0.12),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ]
                  : const [
                      BoxShadow(
                        color: Color(0x060E1020),
                        blurRadius: 4,
                        offset: Offset(0, 1),
                      ),
                    ],
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
            child: Row(
              crossAxisAlignment: widget.maxLines > 1
                  ? CrossAxisAlignment.start
                  : CrossAxisAlignment.center,
              children: [
                if (widget.prefixIcon != null) ...[
                  Padding(
                    padding: EdgeInsets.only(top: widget.maxLines > 1 ? 8 : 0),
                    child: Icon(
                      widget.prefixIcon,
                      size: 20,
                      color: _isFocused ? widget.accentColor : const Color(0xFF94A3B8),
                    ),
                  ),
                  const SizedBox(width: 10),
                ],
                Expanded(
                  child: TextFormField(
                    controller: widget.controller,
                    focusNode: _focusNode,
                    cursorColor: widget.accentColor,
                    maxLength: widget.maxLength,
                    maxLines: widget.maxLines,
                    minLines: widget.minLines,
                    keyboardType: widget.keyboardType,
                    textInputAction: widget.textInputAction,
                    textCapitalization: widget.textCapitalization,
                    onChanged: widget.onChanged,
                    validator: widget.validator,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0F172A),
                      height: 1.35,
                    ),
                    decoration: InputDecoration(
                      hintText: widget.hintText,
                      hintStyle: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w400,
                        color: Color(0xFF94A3B8),
                      ),
                      isDense: true,
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                      counterText: '',
                      suffixIconConstraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                      suffixIcon: (_isFocused && hasText)
                          ? IconButton(
                              tooltip: 'Clear',
                              icon: const Icon(Icons.clear_rounded, size: 18, color: Color(0xFF64748B)),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              splashRadius: 18,
                              onPressed: () {
                                widget.controller.clear();
                                widget.onChanged?.call('');
                                if (mounted) setState(() {});
                              },
                            )
                          : null,
                    ),
                  ),
                ),
              ],
            ),
          ),

          if (widget.helperText != null) ...[
            const SizedBox(height: 5),
            Padding(
              padding: const EdgeInsets.only(left: 4),
              child: Text(
                widget.helperText!,
                style: const TextStyle(
                  fontSize: 11.5,
                  color: Color(0xFF94A3B8),
                  height: 1.3,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Instagram-Style Bio Multi-line Field with AI Generator
class InstagramBioField extends StatefulWidget {
  const InstagramBioField({
    super.key,
    required this.controller,
    this.label = 'Bio',
    this.hintText = 'Add a bio to introduce yourself...',
    this.maxLength = 150,
    this.accentColor = const Color(0xFF7C3AED),
    this.promptChips = const [],
    this.onChanged,
    this.isHost = false,
  });

  final TextEditingController controller;
  final String label;
  final String hintText;
  final int maxLength;
  final Color accentColor;
  final List<String> promptChips;
  final ValueChanged<String>? onChanged;
  final bool isHost;

  @override
  State<InstagramBioField> createState() => _InstagramBioFieldState();
}

class _InstagramBioFieldState extends State<InstagramBioField> {
  final FocusNode _focusNode = FocusNode();
  bool _isFocused = false;
  bool _isGenerating = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      setState(() => _isFocused = _focusNode.hasFocus);
    });
    widget.controller.addListener(_rebuild);
  }

  @override
  void dispose() {
    _focusNode.dispose();
    widget.controller.removeListener(_rebuild);
    super.dispose();
  }

  void _rebuild() {
    if (mounted) setState(() {});
  }

  Future<void> _openAiBioSheet(BuildContext context) async {
    HapticFeedback.lightImpact();
    final promptController = TextEditingController();

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (dialogCtx, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(dialogCtx).viewInsets.bottom,
              ),
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                  boxShadow: [
                    BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, -4)),
                  ],
                ),
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFFF1F5F9),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: const Icon(Icons.auto_fix_high_rounded, color: Color(0xFF334155), size: 18),
                        ),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Smart Bio Suggestion',
                                style: TextStyle(
                                  fontSize: 16.5,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF0F172A),
                                  letterSpacing: -0.2,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Enter a hobby, vibe, or interest to draft your profile bio',
                                style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: promptController,
                      autofocus: true,
                      style: const TextStyle(fontSize: 14.5, color: Color(0xFF0F172A)),
                      decoration: InputDecoration(
                        hintText: widget.isHost
                            ? 'e.g. friendly host, love music and late night advice'
                            : 'e.g. passionate gamer, love casual conversations',
                        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13.5),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: widget.accentColor, width: 1.5),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 18),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: FilledButton.icon(
                        onPressed: _isGenerating
                            ? null
                            : () async {
                                final userVibe = promptController.text.trim();
                                if (userVibe.isEmpty) return;
                                setSheetState(() => _isGenerating = true);
                                try {
                                  final bio = await _callAiBioApi(userVibe, widget.isHost);
                                  widget.controller.text = bio;
                                  widget.onChanged?.call(bio);
                                  if (ctx.mounted) Navigator.of(ctx).pop();
                                  HapticFeedback.mediumImpact();
                                } catch (_) {
                                  // Fallback locally
                                  final fallback = widget.isHost
                                      ? 'Warm host passionate about meaningful conversations. Always ready for a great chat!'
                                      : 'Into $userVibe and always up for good conversations and positive vibes.';
                                  widget.controller.text = fallback;
                                  widget.onChanged?.call(fallback);
                                  if (ctx.mounted) Navigator.of(ctx).pop();
                                } finally {
                                  if (mounted) setState(() => _isGenerating = false);
                                }
                              },
                        style: FilledButton.styleFrom(
                          backgroundColor: widget.accentColor,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        icon: _isGenerating
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Icon(Icons.check_rounded, size: 18),
                        label: Text(
                          _isGenerating ? 'Drafting Bio...' : 'Apply Suggestion',
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<String> _callAiBioApi(String userPrompt, bool isHost) async {
    final candidateEndpoints = [
      'https://friendoo-admin.netlify.app/api/profile/generate-bio',
      'http://10.0.2.2:3000/api/profile/generate-bio',
      'http://127.0.0.1:3000/api/profile/generate-bio',
      'http://localhost:3000/api/profile/generate-bio',
    ];

    for (final endpoint in candidateEndpoints) {
      try {
        final client = HttpClient()..connectionTimeout = const Duration(seconds: 4);
        final request = await client.postUrl(Uri.parse(endpoint));
        request.headers.set('content-type', 'application/json');
        request.add(utf8.encode(jsonEncode({
          'prompt': userPrompt,
          'role': isHost ? 'host' : 'user',
        })));
        final response = await request.close();
        if (response.statusCode == 200) {
          final reply = await response.transform(utf8.decoder).join();
          final map = jsonDecode(reply) as Map<String, dynamic>;
          final bio = map['bio']?.toString().trim();
          if (bio != null && bio.isNotEmpty) return bio;
        }
      } catch (_) {}
    }

    // Instant smart template fallback matching user prompt
    final lower = userPrompt.toLowerCase();
    if (lower.contains('game') || lower.contains('gaming')) {
      return isHost
        ? 'Passionate gamer host who loves teaming up and chatting about games, anime, and great vibes.'
        : 'Casual gamer looking for good company and fun conversations while leveling up!';
    } else if (lower.contains('music') || lower.contains('movie') || lower.contains('song')) {
      return "Melody and cinema lover with a soundtrack for every mood. Let's talk favorites!";
    } else if (lower.contains('night') || lower.contains('owl')) {
      return 'Night owl always up for deep late-night chats, stories, and relaxing banter.';
    }
    return isHost
      ? 'Passionate about $userPrompt. Warm conversationalist always ready for a great chat!'
      : 'Into $userPrompt and always up for genuine conversations and positive energy.';
  }

  @override
  Widget build(BuildContext context) {
    final hasText = widget.controller.text.isNotEmpty;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                widget.label,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: _isFocused ? widget.accentColor : const Color(0xFF475569),
                  letterSpacing: 0.1,
                ),
              ),
              InkWell(
                onTap: () => _openAiBioSheet(context),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEEF2FF),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFC7D2FE)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.auto_fix_high_rounded, size: 13, color: widget.accentColor),
                      const SizedBox(width: 4),
                      Text(
                        'Smart Bio',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: widget.accentColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),

          // Apple-style rounded frosted bio card
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            decoration: BoxDecoration(
              color: _isFocused ? Colors.white : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _isFocused ? widget.accentColor : const Color(0xFFE2E8F0),
                width: _isFocused ? 1.5 : 1.0,
              ),
              boxShadow: _isFocused
                  ? [
                      BoxShadow(
                        color: widget.accentColor.withValues(alpha: 0.12),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ]
                  : const [
                      BoxShadow(
                        color: Color(0x060E1020),
                        blurRadius: 4,
                        offset: Offset(0, 1),
                      ),
                    ],
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: TextFormField(
              controller: widget.controller,
              focusNode: _focusNode,
              cursorColor: widget.accentColor,
              maxLength: widget.maxLength,
              minLines: 2,
              maxLines: 4,
              onChanged: widget.onChanged,
              style: const TextStyle(
                fontSize: 14.5,
                fontWeight: FontWeight.w500,
                color: Color(0xFF0F172A),
                height: 1.4,
              ),
              decoration: InputDecoration(
                hintText: widget.hintText,
                hintStyle: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                  color: Color(0xFF9CA3AF),
                ),
                isDense: true,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 4),
                counterText: '',
                suffixIconConstraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                suffixIcon: (_isFocused && hasText)
                    ? IconButton(
                        tooltip: 'Clear Bio',
                        icon: const Icon(Icons.clear_rounded, size: 18, color: Color(0xFF64748B)),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        splashRadius: 18,
                        onPressed: () {
                          widget.controller.clear();
                          widget.onChanged?.call('');
                          if (mounted) setState(() {});
                        },
                      )
                    : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Instagram-Style Clean Direct Age Input
class InstagramAgeRow extends StatefulWidget {
  const InstagramAgeRow({
    super.key,
    required this.selectedAge,
    required this.onChanged,
    this.accentColor = const Color(0xFF0095F6),
    this.minAge = 18,
    this.maxAge = 99,
  });

  final int selectedAge;
  final ValueChanged<int> onChanged;
  final Color accentColor;
  final int minAge;
  final int maxAge;

  @override
  State<InstagramAgeRow> createState() => _InstagramAgeRowState();
}

class _InstagramAgeRowState extends State<InstagramAgeRow> {
  late TextEditingController _ageController;
  final FocusNode _focusNode = FocusNode();
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _ageController = TextEditingController(text: '${widget.selectedAge}');
    _focusNode.addListener(() {
      setState(() => _isFocused = _focusNode.hasFocus);
    });
  }

  @override
  void didUpdateWidget(InstagramAgeRow oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedAge != widget.selectedAge &&
        _ageController.text != '${widget.selectedAge}') {
      _ageController.text = '${widget.selectedAge}';
    }
  }

  @override
  void dispose() {
    _ageController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Age',
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: _isFocused ? widget.accentColor : const Color(0xFF475569),
                  letterSpacing: 0.1,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.verified_rounded, size: 12, color: Color(0xFF10B981)),
                    SizedBox(width: 3),
                    Text(
                      '18+ Verified',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF047857),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            decoration: BoxDecoration(
              color: _isFocused ? Colors.white : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _isFocused ? widget.accentColor : const Color(0xFFE2E8F0),
                width: _isFocused ? 1.5 : 1.0,
              ),
              boxShadow: _isFocused
                  ? [
                      BoxShadow(
                        color: widget.accentColor.withValues(alpha: 0.12),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ]
                  : const [
                      BoxShadow(
                        color: Color(0x060E1020),
                        blurRadius: 4,
                        offset: Offset(0, 1),
                      ),
                    ],
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            child: Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _ageController,
                    focusNode: _focusNode,
                    cursorColor: widget.accentColor,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(2),
                    ],
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0F172A),
                    ),
                    decoration: const InputDecoration(
                      hintText: 'Enter age (e.g. 24)',
                      hintStyle: TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w400,
                        color: Color(0xFF9CA3AF),
                      ),
                      isDense: true,
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 10),
                    ),
                    onChanged: (val) {
                      final parsed = int.tryParse(val);
                      if (parsed != null && parsed >= widget.minAge && parsed <= widget.maxAge) {
                        widget.onChanged(parsed);
                      }
                    },
                  ),
                ),
                const Text(
                  'years',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF94A3B8),
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
