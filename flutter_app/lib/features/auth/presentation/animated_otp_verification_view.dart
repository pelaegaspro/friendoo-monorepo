import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Exact OTP Animation V15 recreation from @code.xr Instagram Reel
/// Features:
/// 1. Top Circular Lock with live rotating gradient spinner ring (transforms to green check on success, red on error)
/// 2. Clean modern "Verify it's you" header with typewriter/flip transition to "You're verified"
/// 3. 6 Individual elevated rounded OTP boxes:
///    - Bold digit with colored horizontal underline bar below it
///    - Active empty box with animated breathing glowing border and blinking vertical cursor
///    - Inactive boxes with subtle dot
///    - Success state: smooth morph to solid emerald green rounded cards with white text & glow
///    - Error state: horizontal chromatic shake with red border and red underline bars
/// 4. Signature dynamic progress-fill "Verify code" button:
///    - Fills from left to right as digits are typed (0% -> 100%)
///    - Shows "Verifying" with spinner when 6 digits are submitted or isLoading is true
///    - Morphs to Emerald Green "Continue ➔" on verified success
/// 5. Resend countdown with live rotating circular arc spinner
class AnimatedOtpVerificationView extends StatefulWidget {
  const AnimatedOtpVerificationView({
    super.key,
    required this.phoneDigits,
    required this.otpController,
    required this.onVerify,
    required this.onChangePhone,
    required this.onResend,
    this.resendCountdown = 0,
    this.isLoading = false,
    this.errorMessage,
    this.isVerified = false,
    this.onContinue,
  });

  final String phoneDigits;
  final TextEditingController otpController;
  final VoidCallback onVerify;
  final VoidCallback onChangePhone;
  final VoidCallback onResend;
  final int resendCountdown;
  final bool isLoading;
  final String? errorMessage;
  final bool isVerified;
  final VoidCallback? onContinue;

  @override
  State<AnimatedOtpVerificationView> createState() =>
      _AnimatedOtpVerificationViewState();
}

class _AnimatedOtpVerificationViewState
    extends State<AnimatedOtpVerificationView>
    with TickerProviderStateMixin {
  late final AnimationController _spinnerController;
  late final AnimationController _cursorController;
  late final AnimationController _shakeController;
  late final AnimationController _pulseController;
  final List<AnimationController> _digitBounceControllers = [];

  final FocusNode _inputFocusNode = FocusNode();
  String _currentOtp = '';
  Timer? _autoSubmitTimer;

  @override
  void initState() {
    super.initState();

    // Live continuous spinner for top lock ring and resend indicator
    _spinnerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();

    // Blinking cursor
    _cursorController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 550),
    )..repeat(reverse: true);

    // Glowing border pulse
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    // Shake controller for invalid code
    _shakeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    // 6 digit pop bounce controllers
    for (int i = 0; i < 6; i++) {
      final ctrl = AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 260),
      );
      _digitBounceControllers.add(ctrl);
    }

    _currentOtp = widget.otpController.text;
    widget.otpController.addListener(_onOtpChanged);

    // Request keyboard focus smoothly after build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _inputFocusNode.requestFocus();
      }
    });
  }

  @override
  void didUpdateWidget(covariant AnimatedOtpVerificationView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.errorMessage != null &&
        widget.errorMessage != oldWidget.errorMessage) {
      _shakeController.forward(from: 0.0);
      HapticFeedback.heavyImpact();
    }
  }

  void _onOtpChanged() {
    final text = widget.otpController.text;
    final newLength = text.length;
    final oldLength = _currentOtp.length;

    setState(() {
      _currentOtp = text;
    });

    if (newLength > oldLength) {
      for (int i = oldLength; i < newLength && i < 6; i++) {
        _digitBounceControllers[i].forward(from: 0.0);
      }
      HapticFeedback.lightImpact();

      // Auto submit when all 6 digits are entered
      if (newLength == 6 && !widget.isLoading) {
        _autoSubmitTimer?.cancel();
        _autoSubmitTimer = Timer(const Duration(milliseconds: 220), () {
          if (mounted && widget.otpController.text.length == 6) {
            widget.onVerify();
          }
        });
      }
    } else if (newLength < oldLength) {
      for (int i = newLength; i < oldLength && i < 6; i++) {
        _digitBounceControllers[i].reset();
      }
      HapticFeedback.selectionClick();
    }
  }

  @override
  void dispose() {
    _autoSubmitTimer?.cancel();
    widget.otpController.removeListener(_onOtpChanged);
    _spinnerController.dispose();
    _cursorController.dispose();
    _pulseController.dispose();
    _shakeController.dispose();
    for (final ctrl in _digitBounceControllers) {
      ctrl.dispose();
    }
    _inputFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasError = widget.errorMessage != null;
    final isSuccess = widget.isVerified;

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF6366F1).withOpacity(0.08),
                blurRadius: 36,
                offset: const Offset(0, 14),
              ),
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 26),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Top Circular Lock with live spinning arc ring
              _buildTopLockIcon(hasError, isSuccess),

              const SizedBox(height: 18),

              // Title: "Verify it's you" or "You're verified"
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 350),
                transitionBuilder: (child, anim) => FadeTransition(
                  opacity: anim,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.15),
                      end: Offset.zero,
                    ).animate(anim),
                    child: child,
                  ),
                ),
                child: Text(
                  isSuccess ? "You're verified" : "Verify it's you",
                  key: ValueKey(isSuccess),
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.6,
                  ),
                ),
              ),

              const SizedBox(height: 8),

              // Subtitle with phone number & click-to-change pencil
              _buildPhoneSubtitle(isSuccess),

              const SizedBox(height: 24),

              // 6 OTP boxes with Underlines, Cursor, and Shake
              AnimatedBuilder(
                animation: _shakeController,
                builder: (context, child) {
                  final offset = math.sin(_shakeController.value * math.pi * 5) *
                      10 *
                      (1.0 - _shakeController.value);
                  return Transform.translate(
                    offset: Offset(offset, 0),
                    child: child,
                  );
                },
                child: _buildOtpInputRow(hasError, isSuccess),
              ),

              // Error banner if any
              if (hasError && !isSuccess) ...[
                const SizedBox(height: 14),
                _buildErrorBanner(widget.errorMessage!),
              ],

              const SizedBox(height: 24),

              // Signature Progress Fill "Verify code" Button
              _buildProgressVerifyButton(isSuccess),

              const SizedBox(height: 18),

              // Live resend row with spinning indicator
              if (!isSuccess) _buildResendRow(),
            ],
          ),
        ),
      ),
    );
  }

  /// Top circular Lock with live rotating gradient spinner ring
  Widget _buildTopLockIcon(bool hasError, bool isSuccess) {
    Color iconColor;
    Color circleBg;
    Color ringColor;

    if (isSuccess) {
      iconColor = const Color(0xFF10B981);
      circleBg = const Color(0xFFECFDF5);
      ringColor = const Color(0xFF10B981);
    } else if (hasError) {
      iconColor = const Color(0xFFEF4444);
      circleBg = const Color(0xFFFEF2F2);
      ringColor = const Color(0xFFEF4444);
    } else {
      iconColor = const Color(0xFF4F46E5);
      circleBg = const Color(0xFFEEF2FF);
      ringColor = const Color(0xFF6366F1);
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 350),
      width: 78,
      height: 78,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Live spinning animated arc ring
          AnimatedBuilder(
            animation: _spinnerController,
            builder: (context, child) {
              return Transform.rotate(
                angle: _spinnerController.value * 2 * math.pi,
                child: CustomPaint(
                  size: const Size(78, 78),
                  painter: _SpinnerArcPainter(
                    color: ringColor,
                    strokeWidth: 2.8,
                  ),
                ),
              );
            },
          ),

          // Central circular badge
          Container(
            width: 62,
            height: 62,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: circleBg,
              boxShadow: [
                BoxShadow(
                  color: ringColor.withOpacity(0.18),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Center(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: Icon(
                  isSuccess
                      ? Icons.check_circle_rounded
                      : Icons.lock_outline_rounded,
                  key: ValueKey(isSuccess),
                  color: iconColor,
                  size: 26,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Subtitle displaying masked or full phone number with edit pencil
  Widget _buildPhoneSubtitle(bool isSuccess) {
    if (isSuccess) {
      return const Text(
        'Identity confirmed successfully',
        style: TextStyle(
          color: Color(0xFF10B981),
          fontSize: 13.5,
          fontWeight: FontWeight.w700,
        ),
      );
    }


    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        const Text(
          'Enter the 6-digit code we just sent to ',
          style: TextStyle(
            color: Color(0xFF64748B),
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        InkWell(
          onTap: widget.isLoading ? null : widget.onChangePhone,
          borderRadius: BorderRadius.circular(6),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 1),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  widget.phoneDigits.trim().startsWith('+')
                      ? widget.phoneDigits.trim()
                      : '+91 ${widget.phoneDigits.trim()}',
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(width: 3),
                const Icon(
                  Icons.edit_rounded,
                  size: 13,
                  color: Color(0xFF4F46E5),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// 6 individual boxes with underline bar and blinking cursor
  Widget _buildOtpInputRow(bool hasError, bool isSuccess) {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Invisible native input for keyboard, autofill and paste
        Opacity(
          opacity: 0.0,
          child: SizedBox(
            height: 56,
            child: TextField(
              controller: widget.otpController,
              focusNode: _inputFocusNode,
              keyboardType: TextInputType.number,
              autofocus: true,
              maxLength: 6,
              autofillHints: const [AutofillHints.oneTimeCode],
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              onSubmitted: (_) {
                if (_currentOtp.length == 6 && !widget.isLoading) {
                  widget.onVerify();
                }
              },
            ),
          ),
        ),

        // Visual presentation of 6 modern animated boxes
        GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () {
            _inputFocusNode.requestFocus();
          },
          child: LayoutBuilder(
            builder: (context, constraints) {
              final totalWidth = constraints.maxWidth;
              final boxWidth = ((totalWidth - 36) / 6).clamp(36.0, 44.0);
              final boxHeight = (boxWidth * 1.30).clamp(48.0, 58.0);

              return Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (index) {
                  return _buildSingleOtpBox(
                    index,
                    hasError,
                    isSuccess,
                    boxWidth,
                    boxHeight,
                  );
                }),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSingleOtpBox(
    int index,
    bool hasError,
    bool isSuccess,
    double boxWidth,
    double boxHeight,
  ) {
    final isFilled = index < _currentOtp.length;
    final isFocused = index == _currentOtp.length && !isSuccess;
    final char = isFilled ? _currentOtp[index] : '';

    return AnimatedBuilder(
      animation: Listenable.merge([
        _cursorController,
        _pulseController,
        _digitBounceControllers[index],
      ]),
      builder: (context, child) {
        final bounceValue = _digitBounceControllers[index].value;
        final scale = isFilled
            ? (0.7 + 0.3 * Curves.elasticOut.transform(bounceValue.clamp(0.0, 1.0)))
            : (isFocused ? 1.03 : 1.0);

        Color borderColor;
        Color bgColor;
        Color textColor;
        Color underlineColor;
        List<BoxShadow> shadows;

        if (isSuccess) {
          borderColor = const Color(0xFF10B981);
          bgColor = const Color(0xFF10B981);
          textColor = Colors.white;
          underlineColor = Colors.white;
          shadows = [
            BoxShadow(
              color: const Color(0xFF10B981).withOpacity(0.35),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ];
        } else if (hasError) {
          borderColor = const Color(0xFFEF4444);
          bgColor = const Color(0xFFFEF2F2);
          textColor = const Color(0xFFEF4444);
          underlineColor = const Color(0xFFEF4444);
          shadows = [
            BoxShadow(
              color: const Color(0xFFEF4444).withOpacity(0.18),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ];
        } else if (isFocused) {
          final glowOpacity = 0.25 + 0.15 * _pulseController.value;
          borderColor = const Color(0xFF4F46E5);
          bgColor = Colors.white;
          textColor = const Color(0xFF0F172A);
          underlineColor = const Color(0xFF4F46E5);
          shadows = [
            BoxShadow(
              color: const Color(0xFF4F46E5).withOpacity(glowOpacity),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ];
        } else if (isFilled) {
          borderColor = const Color(0xFF4F46E5).withOpacity(0.7);
          bgColor = Colors.white;
          textColor = const Color(0xFF0F172A);
          underlineColor = const Color(0xFF4F46E5);
          shadows = [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ];
        } else {
          borderColor = const Color(0xFFE2E8F0);
          bgColor = const Color(0xFFF8FAFC);
          textColor = const Color(0xFF94A3B8);
          underlineColor = const Color(0xFFCBD5E1);
          shadows = [];
        }

        return Transform.scale(
          scale: scale,
          child: Container(
            width: 46,
            height: 58,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: borderColor,
                width: isFocused || hasError || isSuccess ? 2.0 : 1.4,
              ),
              boxShadow: shadows,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Expanded(
                  child: Center(
                    child: isFilled
                        ? Text(
                            char,
                            style: TextStyle(
                              color: textColor,
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'monospace',
                            ),
                          )
                        : (isFocused
                            ? Opacity(
                                opacity: _cursorController.value,
                                child: Container(
                                  width: 2.2,
                                  height: 22,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF4F46E5),
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                              )
                            : Container(
                                width: 5,
                                height: 5,
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Color(0xFFCBD5E1),
                                ),
                              )),
                  ),
                ),

                // Signature horizontal underline bar from the reel
                if (isFilled && !isSuccess)
                  Container(
                    margin: const EdgeInsets.only(bottom: 7),
                    width: 14,
                    height: 2.5,
                    decoration: BoxDecoration(
                      color: underlineColor,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  )
                else
                  const SizedBox(height: 7),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Signature dynamic progress-fill "Verify code" button
  Widget _buildProgressVerifyButton(bool isSuccess) {
    if (isSuccess) {
      return Container(
        height: 52,
        width: double.infinity,
        decoration: BoxDecoration(
          color: const Color(0xFF10B981),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF10B981).withOpacity(0.35),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: InkWell(
          onTap: widget.onContinue ?? () {},
          borderRadius: BorderRadius.circular(16),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Continue',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.3,
                ),
              ),
              SizedBox(width: 8),
              Icon(
                Icons.arrow_forward_rounded,
                color: Colors.white,
                size: 18,
              ),
            ],
          ),
        ),
      );
    }

    final progress = (_currentOtp.length / 6.0).clamp(0.0, 1.0);
    final isFull = _currentOtp.length == 6;
    final isVerifying = widget.isLoading || (isFull && !widget.isVerified);

    return Container(
      height: 52,
      width: double.infinity,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: const Color(0xFFEEF2F6), // Track background
        borderRadius: BorderRadius.circular(16),
        boxShadow: isFull
            ? [
                BoxShadow(
                  color: const Color(0xFF4F46E5).withOpacity(0.35),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ]
            : [],
      ),
      child: Stack(
        children: [
          // Dynamic animated progress fill
          AnimatedFractionallySizedBox(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            alignment: Alignment.centerLeft,
            widthFactor: progress,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                ),
              ),
            ),
          ),

          // Button content
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: (widget.isLoading || _currentOtp.length < 6)
                  ? null
                  : widget.onVerify,
              borderRadius: BorderRadius.circular(16),
              child: Center(
                child: isVerifying
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          AnimatedBuilder(
                            animation: _spinnerController,
                            builder: (context, child) {
                              return Transform.rotate(
                                angle: _spinnerController.value * 2 * math.pi,
                                child: CustomPaint(
                                  size: const Size(18, 18),
                                  painter: _SpinnerArcPainter(
                                    color: Colors.white,
                                    strokeWidth: 2.2,
                                  ),
                                ),
                              );
                            },
                          ),
                          const SizedBox(width: 10),
                          const Text(
                            'Verifying',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 15.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ],
                      )
                    : Text(
                        'Verify code',
                        style: TextStyle(
                          color: progress > 0.45 ? Colors.white : const Color(0xFF64748B),
                          fontSize: 15.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.3,
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Error banner matching reel frame 10: "That code didn't match. Try again."
  Widget _buildErrorBanner(String message) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFCA5A5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.error_rounded,
            color: Color(0xFFEF4444),
            size: 16,
          ),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              message,
              style: const TextStyle(
                color: Color(0xFFDC2626),
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Live Resend row matching reel: "Didn't get a code? [spinner] Resend in 0:28"
  Widget _buildResendRow() {
    final minutes = (widget.resendCountdown ~/ 60).toString();
    final seconds = (widget.resendCountdown % 60).toString().padLeft(2, '0');

    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 4,
      runSpacing: 4,
      children: [
        const Text(
          "Didn't get a code? ",
          style: TextStyle(
            color: Color(0xFF64748B),
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        if (widget.resendCountdown > 0) ...[
          // Rotating arc beside timer
          AnimatedBuilder(
            animation: _spinnerController,
            builder: (context, child) {
              return Transform.rotate(
                angle: _spinnerController.value * 2 * math.pi,
                child: CustomPaint(
                  size: const Size(12, 12),
                  painter: _SpinnerArcPainter(
                    color: const Color(0xFF4F46E5),
                    strokeWidth: 1.8,
                  ),
                ),
              );
            },
          ),
          const SizedBox(width: 5),
          Text(
            'Resend in $minutes:$seconds',
            style: const TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 13,
              fontWeight: FontWeight.w800,
            ),
          ),
        ] else
          InkWell(
            onTap: widget.isLoading ? null : widget.onResend,
            borderRadius: BorderRadius.circular(6),
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              child: Text(
                'Resend',
                style: TextStyle(
                  color: Color(0xFF4F46E5),
                  fontSize: 13.5,
                  fontWeight: FontWeight.w900,
                  decoration: TextDecoration.underline,
                  decorationColor: Color(0xFF4F46E5),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// Custom painter for spinning gradient arc ring
class _SpinnerArcPainter extends CustomPainter {
  const _SpinnerArcPainter({
    required this.color,
    required this.strokeWidth,
  });

  final Color color;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Track arc (faint)
    final trackPaint = Paint()
      ..color = color.withOpacity(0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(center, radius, trackPaint);

    // Active arc (270 degrees sweep)
    final arcPaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = strokeWidth;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      math.pi * 1.5,
      false,
      arcPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _SpinnerArcPainter oldDelegate) {
    return oldDelegate.color != color || oldDelegate.strokeWidth != strokeWidth;
  }
}
