import 'dart:math' as math;

import 'package:flutter/material.dart';

/// A short, branded opening screen shown while Friendoo prepares the app.
class FriendooLoadingScreen extends StatefulWidget {
  const FriendooLoadingScreen({super.key, this.isOverlay = false});

  final bool isOverlay;

  @override
  State<FriendooLoadingScreen> createState() => _FriendooLoadingScreenState();
}

class _FriendooLoadingScreenState extends State<FriendooLoadingScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final content = AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final wave = Curves.easeInOut.transform(
          (math.sin(_controller.value * math.pi * 2) + 1) / 2,
        );
        return Stack(
          fit: StackFit.expand,
          children: [
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF101426),
                    Color(0xFF26215C),
                    Color(0xFF4A227B),
                  ],
                ),
              ),
            ),
            _GlowOrb(
              alignment: const Alignment(-1.12, -0.76),
              color: const Color(0xFF3B82F6),
              size: 260,
              opacity: 0.16 + (wave * 0.08),
            ),
            _GlowOrb(
              alignment: const Alignment(1.1, 0.68),
              color: const Color(0xFFF43F9D),
              size: 310,
              opacity: 0.13 + ((1 - wave) * 0.09),
            ),
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 204,
                    height: 204,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        _SoundRing(
                          scale: 1.0 + (wave * 0.16),
                          opacity: 0.22 - (wave * 0.1),
                        ),
                        _SoundRing(
                          scale: 0.72 + (wave * 0.1),
                          opacity: 0.2 - (wave * 0.08),
                        ),
                        Transform.scale(
                          scale: 0.96 + (wave * 0.07),
                          child: Container(
                            width: 94,
                            height: 94,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(30),
                              gradient: const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  Color(0xFFA78BFA),
                                  Color(0xFF6D5DFB),
                                  Color(0xFFD946EF),
                                ],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFD946EF)
                                      .withValues(alpha: 0.32 + (wave * 0.16)),
                                  blurRadius: 34,
                                  spreadRadius: 5,
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.graphic_eq_rounded,
                              color: Colors.white,
                              size: 50,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),
                  const Text(
                    'Friendoo',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 31,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -1.1,
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );

    if (widget.isOverlay) return content;
    return Scaffold(body: SafeArea(child: content));
  }
}

class _GlowOrb extends StatelessWidget {
  const _GlowOrb({
    required this.alignment,
    required this.color,
    required this.size,
    required this.opacity,
  });

  final Alignment alignment;
  final Color color;
  final double size;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: alignment,
      child: IgnorePointer(
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color.withValues(alpha: opacity),
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: opacity),
                blurRadius: 90,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SoundRing extends StatelessWidget {
  const _SoundRing({required this.scale, required this.opacity});

  final double scale;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return Transform.scale(
      scale: scale,
      child: Container(
        width: 158,
        height: 158,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: Colors.white.withValues(alpha: opacity),
            width: 1.2,
          ),
        ),
      ),
    );
  }
}
