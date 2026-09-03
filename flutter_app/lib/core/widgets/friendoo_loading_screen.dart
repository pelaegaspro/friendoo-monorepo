import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../app/friendoo_app.dart';
import '../../app/friendoo_ui.dart';

/// Beautiful, branded Friendoo Loading Screen with smooth animations.
class FriendooLoadingScreen extends StatefulWidget {
  const FriendooLoadingScreen({
    super.key,
    this.message = 'Loading Friendoo...',
    this.showTagline = true,
    this.isOverlay = false,
  });

  final String message;
  final bool showTagline;
  final bool isOverlay;

  @override
  State<FriendooLoadingScreen> createState() => _FriendooLoadingScreenState();
}

class _FriendooLoadingScreenState extends State<FriendooLoadingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _pulseAnimation;
  late Animation<double> _rotateAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();

    _pulseAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(
          begin: 1.0,
          end: 1.08,
        ).chain(CurveTween(curve: Curves.easeInOut)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(
          begin: 1.08,
          end: 1.0,
        ).chain(CurveTween(curve: Curves.easeInOut)),
        weight: 50,
      ),
    ]).animate(_controller);

    _rotateAnimation = Tween<double>(
      begin: 0.0,
      end: 2 * math.pi,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.linear));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final content = Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Animated Logo with glowing backdrop aura
          AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _pulseAnimation.value,
                child: Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [FriendooUiColors.violet, FriendooUiColors.pink],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(26),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFF2A85).withValues(alpha: 0.35),
                        blurRadius: 28,
                        spreadRadius: 6,
                      ),
                      BoxShadow(
                        color: const Color(0xFF6366F1).withValues(alpha: 0.25),
                        blurRadius: 36,
                        spreadRadius: 10,
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.graphic_eq_rounded,
                      color: Colors.white,
                      size: 48,
                    ),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 16),
          const Text(
            'Friendoo',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: FriendooUiColors.ink,
              letterSpacing: -0.6,
            ),
          ),
          const SizedBox(height: 24),

          // Custom Dual-Gradient Rotating Ring
          AnimatedBuilder(
            animation: _rotateAnimation,
            builder: (context, child) {
              return Transform.rotate(
                angle: _rotateAnimation.value,
                child: SizedBox(
                  width: 38,
                  height: 38,
                  child: CircularProgressIndicator(
                    strokeWidth: 3.2,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      Color(0xFFFF2A85),
                    ),
                    backgroundColor: const Color(0xFF6366F1)
                        .withValues(alpha: 0.25),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 22),

          // Message Text
          Text(
            widget.message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1F2937),
              letterSpacing: -0.2,
            ),
          ),

          if (widget.showTagline) ...[
            const SizedBox(height: 6),
            const Text(
              'Private & Friendly Conversations',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w500,
                color: Color(0xFF9CA3AF),
              ),
            ),
          ],
        ],
      ),
    );

    if (widget.isOverlay) {
      return Container(
        color: Colors.white.withValues(alpha: 0.88),
        child: content,
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFC),
      body: SafeArea(child: content),
    );
  }
}
