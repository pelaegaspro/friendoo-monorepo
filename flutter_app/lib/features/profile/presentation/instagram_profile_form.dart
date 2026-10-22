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
                  ),
                ),
              ),
              if (hasText && widget.maxLines == 1)
                GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    widget.controller.clear();
                    widget.onChanged?.call('');
                  },
                  child: const Padding(
                    padding: EdgeInsets.only(left: 6),
                    child: Icon(
                      Icons.cancel,
                      size: 18,
                      color: Color(0xFF9CA3AF),
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

/// Instagram-Style Bio Multi-line Field with Starter Chips
class InstagramBioField extends StatefulWidget {
  const InstagramBioField({
    super.key,
    required this.controller,
    this.label = 'Bio',
    this.hintText = 'Add a bio to your profile...',
    this.maxLength = 150,
    this.accentColor = const Color(0xFF0095F6),
    this.promptChips = const [
      '👋 Love casual chats',
      '🎵 Music & Movies',
      '☕ Friendly listener',
      '🎧 Night owl',
      '✨ Good vibes only',
    ],
    this.onChanged,
  });

  final TextEditingController controller;
  final String label;
  final String hintText;
  final int maxLength;
  final Color accentColor;
  final List<String> promptChips;
  final ValueChanged<String>? onChanged;

  @override
  State<InstagramBioField> createState() => _InstagramBioFieldState();
}

class _InstagramBioFieldState extends State<InstagramBioField> {
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

  void _appendPrompt(String prompt) {
    HapticFeedback.lightImpact();
    final current = widget.controller.text.trim();
    String next;
    if (current.isEmpty) {
      next = prompt;
    } else if (current.contains(prompt)) {
      return;
    } else {
      next = '$current • $prompt';
    }
    if (next.length > widget.maxLength) {
      next = next.substring(0, widget.maxLength);
    }
    widget.controller.text = next;
    widget.controller.selection = TextSelection.fromPosition(
      TextPosition(offset: next.length),
    );
    widget.onChanged?.call(next);
  }

  @override
  Widget build(BuildContext context) {
    final textLength = widget.controller.text.length;

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
              Text(
                '$textLength/${widget.maxLength}',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: textLength >= widget.maxLength
                      ? const Color(0xFFEF4444)
                      : const Color(0xFF9CA3AF),
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
            ),
          ),

          // Underline divider
          AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            height: _isFocused ? 1.6 : 0.8,
            color: _isFocused ? widget.accentColor : const Color(0xFFE5E7EB),
          ),
          const SizedBox(height: 8),

          // Quick prompt suggestion pills
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: widget.promptChips.map((chip) {
                final isPresent = widget.controller.text.contains(chip);
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: InkWell(
                    onTap: isPresent ? null : () => _appendPrompt(chip),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                      decoration: BoxDecoration(
                        color: isPresent
                            ? const Color(0xFFF1F5F9)
                            : const Color(0xFFFAFAFA),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isPresent
                              ? const Color(0xFFE2E8F0)
                              : const Color(0xFFE5E7EB),
                        ),
                      ),
                      child: Text(
                        chip,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isPresent ? FontWeight.w500 : FontWeight.w600,
                          color: isPresent
                              ? const Color(0xFF9CA3AF)
                              : const Color(0xFF374151),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

/// Instagram-Style Age Row with Tappable Pill / Selector
class InstagramAgeRow extends StatelessWidget {
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

  static const List<int> _quickPresets = [18, 20, 22, 24, 26, 28, 30, 35];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Age (Years)',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF6B7280),
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
          const SizedBox(height: 8),

          Row(
            children: [
              // Stepper controls
              InkWell(
                onTap: selectedAge > minAge ? () => onChanged(selectedAge - 1) : null,
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: selectedAge > minAge ? const Color(0xFFF3F4F6) : const Color(0xFFF9FAFB),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: const Icon(Icons.remove, size: 16, color: Color(0xFF374151)),
                ),
              ),
              const SizedBox(width: 14),
              Text(
                '$selectedAge yrs',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: accentColor,
                ),
              ),
              const SizedBox(width: 14),
              InkWell(
                onTap: selectedAge < maxAge ? () => onChanged(selectedAge + 1) : null,
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: selectedAge < maxAge ? const Color(0xFFF3F4F6) : const Color(0xFFF9FAFB),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: const Icon(Icons.add, size: 16, color: Color(0xFF374151)),
                ),
              ),
              const SizedBox(width: 16),

              // Horizontal Presets
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _quickPresets.map((preset) {
                      final isSelected = selectedAge == preset;
                      return Padding(
                        padding: const EdgeInsets.only(right: 5),
                        child: InkWell(
                          onTap: () {
                            HapticFeedback.selectionClick();
                            onChanged(preset);
                          },
                          borderRadius: BorderRadius.circular(14),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                            decoration: BoxDecoration(
                              color: isSelected ? accentColor : const Color(0xFFF3F4F6),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Text(
                              '$preset',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                color: isSelected ? Colors.white : const Color(0xFF4B5563),
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Underline divider
          Container(
            height: 0.8,
            color: const Color(0xFFE5E7EB),
          ),
        ],
      ),
    );
  }
}

