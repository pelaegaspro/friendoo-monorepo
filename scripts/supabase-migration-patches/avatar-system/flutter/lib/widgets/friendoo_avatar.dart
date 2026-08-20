import 'dart:math' as math;

import 'package:flutter/material.dart';

/// A privacy-first Friendoo identity renderer.
///
/// Display precedence is enforced by the caller's server-authoritative profile
/// fields: a host image is rendered only when [avatarKind] is `uploaded` and
/// [avatarStatus] is `approved`. All other identities fall back to a stable,
/// deterministic illustrated avatar based on [avatarSeed].
class FriendooAvatar extends StatelessWidget {
  const FriendooAvatar({
    super.key,
    required this.avatarSeed,
    this.avatarKind = 'generated',
    this.avatarStatus = 'generated',
    this.approvedAvatarUrl,
    this.size = 56,
    this.showPresence = false,
    this.isOnline = false,
    this.audioOrb = false,
    this.semanticLabel,
  });

  final String avatarSeed;
  final String avatarKind;
  final String avatarStatus;
  final String? approvedAvatarUrl;
  final double size;
  final bool showPresence;
  final bool isOnline;
  final bool audioOrb;
  final String? semanticLabel;

  bool get _mayUseUploadedAvatar =>
      avatarKind == 'uploaded' &&
      avatarStatus == 'approved' &&
      approvedAvatarUrl != null &&
      approvedAvatarUrl!.isNotEmpty;

  @override
  Widget build(BuildContext context) {
    final child = audioOrb
        ? _AudioOrb(seed: avatarSeed, size: size)
        : _mayUseUploadedAvatar
            ? ClipOval(
                child: Image.network(
                  approvedAvatarUrl!,
                  width: size,
                  height: size,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _GeneratedAvatar(seed: avatarSeed),
                ),
              )
            : _GeneratedAvatar(seed: avatarSeed);

    return Semantics(
      image: true,
      label: semanticLabel ?? 'Friendoo avatar',
      child: SizedBox(
        width: size,
        height: size,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned.fill(child: child),
            if (showPresence)
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: size * 0.24,
                  height: size * 0.24,
                  decoration: BoxDecoration(
                    color: isOnline ? const Color(0xFF16A34A) : const Color(0xFFF97316),
                    border: Border.all(color: Theme.of(context).colorScheme.surface, width: 2),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _GeneratedAvatar extends StatelessWidget {
  const _GeneratedAvatar({required this.seed});

  final String seed;

  @override
  Widget build(BuildContext context) {
    final recipe = AvatarRecipe.fromSeed(seed);
    return DecoratedBox(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: recipe.background,
        ),
      ),
      child: ClipOval(
        child: CustomPaint(
          painter: _GeneratedAvatarPainter(recipe),
          child: const SizedBox.expand(),
        ),
      ),
    );
  }
}

class _AudioOrb extends StatelessWidget {
  const _AudioOrb({required this.seed, required this.size});

  final String seed;
  final double size;

  @override
  Widget build(BuildContext context) {
    final recipe = AvatarRecipe.fromSeed(seed);
    return DecoratedBox(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(colors: recipe.background),
        boxShadow: [
          BoxShadow(color: recipe.accent.withOpacity(0.42), blurRadius: 16, spreadRadius: 1),
        ],
      ),
      child: Center(
        child: Icon(Icons.graphic_eq_rounded, color: Colors.white, size: size * 0.52),
      ),
    );
  }
}

class AvatarRecipe {
  const AvatarRecipe({
    required this.background,
    required this.accent,
    required this.hair,
    required this.face,
    required this.accessory,
  });

  final List<Color> background;
  final Color accent;
  final Color hair;
  final Color face;
  final int accessory;

  static AvatarRecipe fromSeed(String seed) {
    final value = _stableHash(seed);
    const gradients = <List<Color>>[
      [Color(0xFFC026D3), Color(0xFF7C3AED)], // Gulabi to purple
      [Color(0xFF172554), Color(0xFFF59E0B)], // Indigo to marigold
      [Color(0xFF0F766E), Color(0xFF7C3AED)], // Peacock teal to purple
      [Color(0xFFF59E0B), Color(0xFF7E22CE)], // Turmeric to plum
      [Color(0xFF111827), Color(0xFF6D28D9)], // Charcoal night to violet
    ];
    const accents = <Color>[
      Color(0xFFA78BFA),
      Color(0xFFDB2777),
      Color(0xFF14B8A6),
      Color(0xFFF59E0B),
      Color(0xFFE9D5FF),
    ];
    const faceTones = <Color>[
      Color(0xFFF8C8A9),
      Color(0xFFE9B18B),
      Color(0xFFC98963),
      Color(0xFFA86F52),
      Color(0xFF7B4B3A),
    ];
    const hairTones = <Color>[
      Color(0xFF25213B),
      Color(0xFF3B2A24),
      Color(0xFF5B3A2E),
      Color(0xFF1C2938),
      Color(0xFF2F254D),
    ];

    return AvatarRecipe(
      background: gradients[value % gradients.length],
      accent: accents[value % accents.length],
      hair: hairTones[(value ~/ 7) % hairTones.length],
      face: faceTones[(value ~/ 13) % faceTones.length],
      accessory: (value ~/ 19) % 4,
    );
  }

  static int _stableHash(String value) {
    var hash = 2166136261;
    for (final codeUnit in value.codeUnits) {
      hash ^= codeUnit;
      hash = (hash * 16777619) & 0x7fffffff;
    }
    return hash;
  }
}

class _GeneratedAvatarPainter extends CustomPainter {
  const _GeneratedAvatarPainter(this.recipe);

  final AvatarRecipe recipe;

  @override
  void paint(Canvas canvas, Size size) {
    final unit = size.shortestSide;
    final center = Offset(size.width / 2, size.height / 2);
    final paint = Paint()..isAntiAlias = true;

    paint.color = Colors.white.withOpacity(0.18);
    canvas.drawCircle(Offset(center.dx - unit * 0.18, center.dy - unit * 0.22), unit * 0.33, paint);

    paint.color = recipe.hair;
    canvas.drawCircle(Offset(center.dx, center.dy - unit * 0.05), unit * 0.31, paint);

    paint.color = recipe.face;
    canvas.drawOval(
      Rect.fromCenter(center: Offset(center.dx, center.dy + unit * 0.03), width: unit * 0.44, height: unit * 0.55),
      paint,
    );

    paint.color = recipe.hair;
    canvas.drawArc(
      Rect.fromCenter(center: Offset(center.dx, center.dy - unit * 0.07), width: unit * 0.5, height: unit * 0.37),
      math.pi,
      math.pi,
      true,
      paint,
    );

    paint.color = recipe.accent.withOpacity(0.90);
    canvas.drawArc(
      Rect.fromCenter(center: center, width: unit * 0.78, height: unit * 0.78),
      math.pi * 1.12,
      math.pi * 0.76,
      false,
      paint..style = PaintingStyle.stroke..strokeWidth = unit * 0.045,
    );

    paint.style = PaintingStyle.fill;
    paint.color = const Color(0xFF25213B);
    canvas.drawCircle(Offset(center.dx - unit * 0.075, center.dy + unit * 0.02), unit * 0.026, paint);
    canvas.drawCircle(Offset(center.dx + unit * 0.075, center.dy + unit * 0.02), unit * 0.026, paint);

    paint.color = const Color(0xFF603C44);
    canvas.drawArc(
      Rect.fromCenter(center: Offset(center.dx, center.dy + unit * 0.14), width: unit * 0.15, height: unit * 0.08),
      0,
      math.pi,
      false,
      paint..style = PaintingStyle.stroke..strokeWidth = unit * 0.018,
    );

    paint.style = PaintingStyle.fill;
    if (recipe.accessory == 0) {
      paint.color = recipe.accent;
      canvas.drawCircle(Offset(center.dx + unit * 0.19, center.dy - unit * 0.2), unit * 0.048, paint);
    } else if (recipe.accessory == 1) {
      paint.color = Colors.white.withOpacity(0.75);
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = unit * 0.022;
      canvas.drawCircle(Offset(center.dx - unit * 0.074, center.dy + unit * 0.015), unit * 0.062, paint);
      canvas.drawCircle(Offset(center.dx + unit * 0.074, center.dy + unit * 0.015), unit * 0.062, paint);
      canvas.drawLine(Offset(center.dx - unit * 0.012, center.dy + unit * 0.015), Offset(center.dx + unit * 0.012, center.dy + unit * 0.015), paint);
    } else if (recipe.accessory == 2) {
      paint.style = PaintingStyle.fill;
      paint.color = recipe.accent;
      canvas.drawCircle(Offset(center.dx, center.dy + unit * 0.33), unit * 0.042, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _GeneratedAvatarPainter oldDelegate) => oldDelegate.recipe != recipe;
}
