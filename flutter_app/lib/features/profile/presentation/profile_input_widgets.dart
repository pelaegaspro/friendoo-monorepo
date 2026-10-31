import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// Modern Form Section Header with Badge & Supporting Subtitle
class ModernFormSectionHeader extends StatelessWidget {
  const ModernFormSectionHeader({
    super.key,
    required this.title,
    required this.icon,
    this.badgeText,
    this.subtitle,
    this.accentColor = const Color(0xFF6366F1),
  });

  final String title;
  final IconData icon;
  final String? badgeText;
  final String? subtitle;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: accentColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 16, color: accentColor),
            ),
            const SizedBox(width: 10),
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0F172A),
                letterSpacing: 0.3,
              ),
            ),
            if (badgeText != null) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 2.5,
                ),
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: accentColor.withValues(alpha: 0.25),
                  ),
                ),
                child: Text(
                  badgeText!,
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    color: accentColor,
                  ),
                ),
              ),
            ],
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.only(left: 33),
            child: Text(
              subtitle!,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

/// Top-Class Design: Premium Rounded Input Card with Focus Glow & Clear Button
class PremiumProfileTextField extends StatefulWidget {
  const PremiumProfileTextField({
    super.key,
    required this.controller,
    required this.label,
    required this.icon,
    this.hintText,
    this.helperText,
    this.accentColor = const Color(0xFFFF2A85),
    this.maxLength,
    this.maxLines = 1,
    this.minLines,
    this.keyboardType,
    this.textInputAction,
    this.textCapitalization = TextCapitalization.words,
    this.validator,
    this.onChanged,
    this.isRequired = false,
  });

  final TextEditingController controller;
  final String label;
  final IconData icon;
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

  @override
  State<PremiumProfileTextField> createState() =>
      _PremiumProfileTextFieldState();
}

class _PremiumProfileTextFieldState extends State<PremiumProfileTextField> {
  final FocusNode _focusNode = FocusNode();
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      setState(() => _isFocused = _focusNode.hasFocus);
    });
    widget.controller.addListener(_onControllerChange);
  }

  @override
  void dispose() {
    _focusNode.dispose();
    widget.controller.removeListener(_onControllerChange);
    super.dispose();
  }

  void _onControllerChange() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final textLength = widget.controller.text.length;
    final hasText = widget.controller.text.isNotEmpty;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOutCubic,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: _isFocused ? widget.accentColor : const Color(0xFFE2E8F0),
          width: _isFocused ? 1.8 : 1.2,
        ),
        boxShadow: [
          if (_isFocused)
            BoxShadow(
              color: widget.accentColor.withValues(alpha: 0.12),
              blurRadius: 14,
              offset: const Offset(0, 4),
            )
          else
            const BoxShadow(
              color: Color(0x060E1020),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Icon badge + Label + Counter
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: widget.accentColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(widget.icon, size: 17, color: widget.accentColor),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Row(
                  children: [
                    Text(
                      widget.label,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF1E293B),
                        letterSpacing: 0.2,
                      ),
                    ),
                    if (widget.isRequired)
                      const Text(
                        ' *',
                        style: TextStyle(
                          color: Color(0xFFEF4444),
                          fontWeight: FontWeight.w900,
                          fontSize: 14,
                        ),
                      ),
                  ],
                ),
              ),
              if (widget.maxLength != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 7,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: textLength >= widget.maxLength!
                        ? const Color(0xFFFEE2E2)
                        : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '$textLength/${widget.maxLength}',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: textLength >= widget.maxLength!
                          ? const Color(0xFFDC2626)
                          : const Color(0xFF64748B),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),

          // Input field row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: _isFocused
                    ? widget.accentColor.withValues(alpha: 0.35)
                    : const Color(0xFFE2E8F0),
              ),
            ),
            child: Row(
              crossAxisAlignment: widget.maxLines > 1
                  ? CrossAxisAlignment.start
                  : CrossAxisAlignment.center,
              children: [
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
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0F172A),
                      height: 1.35,
                    ),
                    decoration: InputDecoration(
                      hintText: widget.hintText,
                      hintStyle: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w400,
                        color: Color(0xFF94A3B8),
                      ),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.zero,
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
                    child: Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: Container(
                        width: 22,
                        height: 22,
                        decoration: const BoxDecoration(
                          color: Color(0xFFE2E8F0),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close_rounded,
                          size: 14,
                          color: Color(0xFF475569),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          if (widget.helperText != null) ...[
            const SizedBox(height: 5),
            Row(
              children: [
                const Icon(
                  Icons.info_outline_rounded,
                  size: 12,
                  color: Color(0xFF94A3B8),
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    widget.helperText!,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

/// Top-Class Design: Interactive Age Selector with Stepper & Quick Preset Chips
class PremiumAgeSelector extends StatelessWidget {
  const PremiumAgeSelector({
    super.key,
    required this.selectedAge,
    required this.onChanged,
    this.accentColor = const Color(0xFFFF2A85),
    this.minAge = 18,
    this.maxAge = 99,
  });

  final int selectedAge;
  final ValueChanged<int> onChanged;
  final Color accentColor;
  final int minAge;
  final int maxAge;

  static const List<int> _quickPresets = [18, 20, 22, 24, 26, 28, 32, 38];

  void _step(int delta) {
    final next = (selectedAge + delta).clamp(minAge, maxAge);
    if (next != selectedAge) {
      HapticFeedback.selectionClick();
      onChanged(next);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
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
          // Header row: Icon + Label + Verified badge
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.cake_rounded, size: 17, color: accentColor),
              ),
              const SizedBox(width: 10),
              const Text(
                'Age (Years)',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E293B),
                  letterSpacing: 0.2,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.verified_rounded,
                      size: 12,
                      color: Color(0xFF059669),
                    ),
                    SizedBox(width: 4),
                    Text(
                      '18+ Verified',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF065F46),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Center Interactive Stepper Row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Decrement Button
                _StepperButton(
                  icon: Icons.remove_rounded,
                  onTap: selectedAge > minAge ? () => _step(-1) : null,
                ),

                // Center Display
                Row(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      '$selectedAge',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: accentColor,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      'years old',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),

                // Increment Button
                _StepperButton(
                  icon: Icons.add_rounded,
                  onTap: selectedAge < maxAge ? () => _step(1) : null,
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Quick Presets Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _quickPresets.map((preset) {
                final isSelected = selectedAge == preset;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: InkWell(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      onChanged(preset);
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 11,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? accentColor
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '$preset',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isSelected
                              ? FontWeight.w900
                              : FontWeight.w600,
                          color: isSelected
                              ? Colors.white
                              : const Color(0xFF475569),
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

class _StepperButton extends StatelessWidget {
  const _StepperButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: enabled ? Colors.white : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: enabled
                  ? const Color(0xFFCBD5E1)
                  : const Color(0xFFE2E8F0),
            ),
            boxShadow: [
              if (enabled)
                const BoxShadow(
                  color: Color(0x0A000000),
                  blurRadius: 4,
                  offset: Offset(0, 1),
                ),
            ],
          ),
          child: Icon(
            icon,
            size: 20,
            color: enabled ? const Color(0xFF1E293B) : const Color(0xFF94A3B8),
          ),
        ),
      ),
    );
  }
}

/// Top-Class Design: Inviting Bio Text Area with Quick Idea Starter Chips
class PremiumBioTextArea extends StatefulWidget {
  const PremiumBioTextArea({
    super.key,
    required this.controller,
    required this.label,
    this.hintText = 'Tell people about yourself, hobbies, topics you love...',
    this.maxLength = 150,
    this.accentColor = const Color(0xFFFF2A85),
    this.promptChips = const [
      '👋 Love friendly chats',
      '🎵 Music & Movies',
      '☕ Casual listener',
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
  State<PremiumBioTextArea> createState() => _PremiumBioTextAreaState();
}

class _PremiumBioTextAreaState extends State<PremiumBioTextArea> {
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

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOutCubic,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: _isFocused ? widget.accentColor : const Color(0xFFE2E8F0),
          width: _isFocused ? 1.8 : 1.2,
        ),
        boxShadow: [
          if (_isFocused)
            BoxShadow(
              color: widget.accentColor.withValues(alpha: 0.12),
              blurRadius: 14,
              offset: const Offset(0, 4),
            )
          else
            const BoxShadow(
              color: Color(0x060E1020),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Icon + Label + Counter
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: widget.accentColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.edit_note_rounded,
                  size: 20,
                  color: widget.accentColor,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  widget.label,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1E293B),
                    letterSpacing: 0.2,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: textLength >= widget.maxLength
                      ? const Color(0xFFFEE2E2)
                      : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$textLength/${widget.maxLength}',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: textLength >= widget.maxLength
                        ? const Color(0xFFDC2626)
                        : const Color(0xFF64748B),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Text Field
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: _isFocused
                    ? widget.accentColor.withValues(alpha: 0.3)
                    : const Color(0xFFE2E8F0),
              ),
            ),
            child: TextFormField(
              controller: widget.controller,
              focusNode: _focusNode,
              maxLength: widget.maxLength,
              minLines: 3,
              maxLines: 5,
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
                  fontSize: 13.5,
                  fontWeight: FontWeight.w400,
                  color: Color(0xFF94A3B8),
                  height: 1.4,
                ),
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.zero,
                counterText: '',
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Starter Ideas Prompt Chips
          Row(
            children: [
              const Icon(
                Icons.auto_awesome_rounded,
                size: 13,
                color: Color(0xFFF59E0B),
              ),
              const SizedBox(width: 4),
              const Text(
                'Quick ideas (tap to add):',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF64748B),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: widget.promptChips.map((chip) {
              final isPresent = widget.controller.text.contains(chip);
              return InkWell(
                onTap: isPresent ? null : () => _appendPrompt(chip),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: isPresent
                        ? const Color(0xFFE2E8F0)
                        : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isPresent
                          ? const Color(0xFFCBD5E1)
                          : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (!isPresent)
                        const Icon(
                          Icons.add_rounded,
                          size: 12,
                          color: Color(0xFF64748B),
                        ),
                      if (!isPresent) const SizedBox(width: 3),
                      Text(
                        chip,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                          color: isPresent
                              ? const Color(0xFF94A3B8)
                              : const Color(0xFF334155),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
