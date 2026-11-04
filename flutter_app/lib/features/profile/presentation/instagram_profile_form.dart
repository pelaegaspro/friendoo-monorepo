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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
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
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: _isFocused ? widget.accentColor : const Color(0xFF6B7280),
                  letterSpacing: 0.1,
                ),
              ),
              if (widget.maxLength != null)
                Text(
                  '$textLength/${widget.maxLength}',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: textLength >= widget.maxLength!
                        ? const Color(0xFFEF4444)
                        : const Color(0xFF9CA3AF),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),

          // Input field row with bottom divider
          Row(
            crossAxisAlignment: widget.maxLines > 1
                ? CrossAxisAlignment.start
                : CrossAxisAlignment.center,
            children: [
              if (widget.prefixIcon != null) ...[
                Icon(
                  widget.prefixIcon,
                  size: 19,
                  color: _isFocused ? widget.accentColor : const Color(0xFF9CA3AF),
                ),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: TextFormField(
                  controller: widget.controller,
                  focusNode: _focusNode,
                  maxLength: widget.maxLength,
                  maxLines: widget.maxLines,
                  minLines: widget.minLines,
                  keyboardType: widget.keyboardType,
                  textInputAction: widget.textInputAction,
                  textCapitalization: widget.textCapitalization,
                  onChanged: widget.onChanged,
                  validator: widget.validator,
                  style: const TextStyle(
                    fontSize: 15.5,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF0F172A),
                    height: 1.35,
                  ),
                  decoration: InputDecoration(
                    hintText: widget.hintText,
                    hintStyle: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w400,
                      color: Color(0xFF9CA3AF),
                    ),
                    isDense: true,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 8),
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
                        : (hasText && widget.maxLines == 1
                            ? Padding(
                                padding: const EdgeInsets.only(left: 6),
                                child: Icon(
                                  Icons.edit_outlined,
                                  size: 18,
                                  color: widget.accentColor,
                                ),
                              )
                            : null),
                  ),
                ),
              ),
            ],
          ),

          // Instagram clean bottom underline divider
          if (widget.showBottomDivider)
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              height: _isFocused ? 1.6 : 0.8,
              color: _isFocused ? widget.accentColor : const Color(0xFFE5E7EB),
            ),

          if (widget.helperText != null) ...[
            const SizedBox(height: 4),
            Text(
              widget.helperText!,
              style: const TextStyle(
                fontSize: 11.5,
                color: Color(0xFF9CA3AF),
                height: 1.3,
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
                            color: const Color(0xFFEDE9FE),
                          ),
                          child: const Icon(Icons.auto_awesome_rounded, color: Color(0xFF7C3AED), size: 20),
                        ),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'AI Bio Generator',
                                style: TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Type your hobby or vibe (e.g. gamer, late night chats)',
                                style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    TextField(
                      controller: promptController,
                      autofocus: true,
                      style: const TextStyle(fontSize: 14.5, color: Color(0xFF0F172A)),
                      decoration: InputDecoration(
                        hintText: widget.isHost
                            ? 'e.g. friendly host, love music and advice'
                            : 'e.g. I am a gamer person, love casual chats',
                        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13.5),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: UnderlineInputBorder(
                          borderSide: BorderSide(color: const Color(0xFF7C3AED).withValues(alpha: 0.4)),
                        ),
                        focusedBorder: const UnderlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFF7C3AED), width: 2),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 20),
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
                          backgroundColor: const Color(0xFF7C3AED),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        icon: _isGenerating
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Icon(Icons.bolt_rounded, size: 18),
                        label: Text(
                          _isGenerating ? 'Generating Bio...' : 'Generate with AI Bio',
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                widget.label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: _isFocused ? widget.accentColor : const Color(0xFF6B7280),
                  letterSpacing: 0.1,
                ),
              ),
              InkWell(
                onTap: () => _openAiBioSheet(context),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFEDE9FE), Color(0xFFFCE7F3)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF7C3AED).withValues(alpha: 0.3)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.auto_awesome_rounded, size: 12, color: Color(0xFF7C3AED)),
                      SizedBox(width: 4),
                      Text(
                        '✨ AI Bio',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF7C3AED),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),

          TextFormField(
            controller: widget.controller,
            focusNode: _focusNode,
            maxLength: widget.maxLength,
            minLines: 2,
            maxLines: 4,
            onChanged: widget.onChanged,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              color: Color(0xFF0F172A),
              height: 1.4,
            ),
            decoration: InputDecoration(
              hintText: widget.hintText,
              hintStyle: const TextStyle(
                fontSize: 14.5,
                fontWeight: FontWeight.w400,
                color: Color(0xFF9CA3AF),
              ),
              isDense: true,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 6),
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

          // Underline divider
          AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            height: _isFocused ? 1.6 : 0.8,
            color: _isFocused ? widget.accentColor : const Color(0xFFE5E7EB),
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Age',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: _isFocused ? widget.accentColor : const Color(0xFF6B7280),
                  letterSpacing: 0.1,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  '18+ Verified',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF16A34A),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _ageController,
                  focusNode: _focusNode,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(2),
                  ],
                  style: const TextStyle(
                    fontSize: 15.5,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0F172A),
                  ),
                  decoration: const InputDecoration(
                    hintText: 'Enter age (e.g. 24)',
                    hintStyle: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w400,
                      color: Color(0xFF9CA3AF),
                    ),
                    isDense: true,
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 8),
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
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF9CA3AF),
                ),
              ),
            ],
          ),
          AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            height: _isFocused ? 1.6 : 0.8,
            color: _isFocused ? widget.accentColor : const Color(0xFFE5E7EB),
          ),
        ],
      ),
    );
  }
}
