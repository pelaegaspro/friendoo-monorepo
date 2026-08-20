import 'dart:math' as math;
import 'package:flutter/material.dart';

enum DesiAgeGroup {
  youngAdult18_24,
  earlyAdult25_34,
  midAdult35_44,
  senior45Plus;

  static DesiAgeGroup fromAge(int age) {
    if (age < 25) return DesiAgeGroup.youngAdult18_24;
    if (age < 35) return DesiAgeGroup.earlyAdult25_34;
    if (age < 45) return DesiAgeGroup.midAdult35_44;
    return DesiAgeGroup.senior45Plus;
  }

  String get label {
    switch (this) {
      case DesiAgeGroup.youngAdult18_24:
        return '18–24';
      case DesiAgeGroup.earlyAdult25_34:
        return '25–34';
      case DesiAgeGroup.midAdult35_44:
        return '35–44';
      case DesiAgeGroup.senior45Plus:
        return '45+';
    }
  }
}

/// A privacy-first, 100% vector Desi / Indian female avatar renderer.
///
/// Communicates adult Indian female maturity naturally through facial features,
/// hairstyle, styling, and clothing across the 4 key age brackets:
/// - 18–24: Young adult / chic modern styling, open flowing hair, minimal crystal bindi/studs.
/// - 25–34: Early adult / contemporary ethnic kurti, styled layers, neat ruby bindi, mini jhumkas.
/// - 35–44: Mid adult / classic saree drape with zari border, voluminous bun, vermillion bindi, traditional jhumkas, graceful laugh lines.
/// - 45+: Senior / mature dignified presence, handloom saree/shawl, silver-streaked bun, traditional kumkum, mature character lines.
///
/// Note: Avatars remain completely clean without any age numbers, icons, or badges on the artwork.
class DesiFemaleAvatar extends StatelessWidget {
  const DesiFemaleAvatar({
    super.key,
    required this.seed,
    this.age = 24,
    this.isStar = false,
    this.size = 72,
    this.showPresence = false,
    this.isOnline = false,
    this.semanticLabel,
  });

  final String seed;
  final int age;
  final bool isStar;
  final double size;
  final bool showPresence;
  final bool isOnline;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final ageGroup = DesiAgeGroup.fromAge(age);
    final recipe = DesiAvatarRecipe.fromSeed(seed, ageGroup);

    final avatarWidget = SizedBox(
      width: size,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Background Outer Glow if Star Host
          if (isStar)
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFB703), Color(0xFFFFD166), Color(0xFFFB8500)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFFFB703).withOpacity(0.45),
                      blurRadius: 10,
                      spreadRadius: 1,
                    ),
                  ],
                ),
                padding: EdgeInsets.all(size * 0.04),
                child: Container(
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),

          // Main Avatar Body
          Positioned.fill(
            child: Padding(
              padding: EdgeInsets.all(isStar ? size * 0.05 : 0),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: recipe.backgroundColors,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: ClipOval(
                  child: CustomPaint(
                    painter: _DesiAvatarPainter(recipe),
                    child: const SizedBox.expand(),
                  ),
                ),
              ),
            ),
          ),

          // Presence Dot (if enabled)
          if (showPresence)
            Positioned(
              right: size * 0.02,
              bottom: size * 0.02,
              child: Container(
                width: size * 0.22,
                height: size * 0.22,
                decoration: BoxDecoration(
                  color: isOnline ? const Color(0xFF10B981) : const Color(0xFF9CA3AF),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: size * 0.035),
                  boxShadow: [
                    BoxShadow(
                      color: isOnline
                          ? const Color(0xFF10B981).withOpacity(0.5)
                          : Colors.black12,
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );

    return Semantics(
      image: true,
      label: semanticLabel ?? 'Indian female host avatar',
      child: avatarWidget,
    );
  }
}

class DesiAvatarRecipe {
  const DesiAvatarRecipe({
    required this.ageGroup,
    required this.backgroundColors,
    required this.skinTone,
    required this.shadowSkinTone,
    required this.hairColor,
    required this.hairHighlight,
    required this.silverHairStreaks,
    required this.clothingColor,
    required this.clothingBorderColor,
    required this.bindiColor,
    required this.bindiStyle,
    required this.earringColor,
    required this.earringStyle,
    required this.lipstickColor,
  });

  final DesiAgeGroup ageGroup;
  final List<Color> backgroundColors;
  final Color skinTone;
  final Color shadowSkinTone;
  final Color hairColor;
  final Color hairHighlight;
  final bool silverHairStreaks;
  final Color clothingColor;
  final Color clothingBorderColor;
  final Color bindiColor;
  final int bindiStyle;
  final Color earringColor;
  final int earringStyle;
  final Color lipstickColor;

  static DesiAvatarRecipe fromSeed(String seed, DesiAgeGroup ageGroup) {
    var hash = 2166136261;
    for (final codeUnit in seed.codeUnits) {
      hash ^= codeUnit;
      hash = (hash * 16777619) & 0x7fffffff;
    }

    const backgrounds = [
      [Color(0xFFEDE9FE), Color(0xFFDDD6FE)],
      [Color(0xFFFFE4EC), Color(0xFFFBCFE8)],
      [Color(0xFFE0F9FD), Color(0xFFBAE6FD)],
      [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
      [Color(0xFFDCFCE7), Color(0xFFBBF7D0)],
    ];

    final bg = backgrounds[hash % backgrounds.length];

    switch (ageGroup) {
      case DesiAgeGroup.youngAdult18_24:
        const youngSkins = [
          Color(0xFFFCD7B6),
          Color(0xFFF3C29E),
          Color(0xFFE8AD87),
        ];
        const youngShadows = [
          Color(0xFFEAB992),
          Color(0xFFDCA07A),
          Color(0xFFCF8E64),
        ];
        const youngHairs = [
          Color(0xFF1E1A2E),
          Color(0xFF2B1D19),
          Color(0xFF171720),
        ];
        const youngTops = [
          Color(0xFF6366F1),
          Color(0xFFFF2A85),
          Color(0xFF00B4D8),
          Color(0xFF8B5CF6),
        ];

        final skinIdx = (hash ~/ 3) % youngSkins.length;
        final hairIdx = (hash ~/ 7) % youngHairs.length;
        final topIdx = (hash ~/ 11) % youngTops.length;

        return DesiAvatarRecipe(
          ageGroup: ageGroup,
          backgroundColors: bg,
          skinTone: youngSkins[skinIdx],
          shadowSkinTone: youngShadows[skinIdx],
          hairColor: youngHairs[hairIdx],
          hairHighlight: Colors.white.withOpacity(0.18),
          silverHairStreaks: false,
          clothingColor: youngTops[topIdx],
          clothingBorderColor: Colors.white.withOpacity(0.5),
          bindiColor: const Color(0xFF8B5CF6),
          bindiStyle: (hash ~/ 13) % 2,
          earringColor: const Color(0xFFFFD166),
          earringStyle: 0,
          lipstickColor: const Color(0xFFF43F5E),
        );

      case DesiAgeGroup.earlyAdult25_34:
        const earlySkins = [
          Color(0xFFF3C29E),
          Color(0xFFE8AD87),
          Color(0xFFD8956B),
        ];
        const earlyShadows = [
          Color(0xFFDCA07A),
          Color(0xFFCF8E64),
          Color(0xFFBE794F),
        ];
        const earlyHairs = [
          Color(0xFF171720),
          Color(0xFF261916),
          Color(0xFF1F1C2F),
        ];
        const earlyKurtis = [
          Color(0xFF7C3AED),
          Color(0xFFD90429),
          Color(0xFF0284C7),
          Color(0xFFD97706),
        ];

        final skinIdx = (hash ~/ 3) % earlySkins.length;
        final hairIdx = (hash ~/ 7) % earlyHairs.length;
        final topIdx = (hash ~/ 11) % earlyKurtis.length;

        return DesiAvatarRecipe(
          ageGroup: ageGroup,
          backgroundColors: bg,
          skinTone: earlySkins[skinIdx],
          shadowSkinTone: earlyShadows[skinIdx],
          hairColor: earlyHairs[hairIdx],
          hairHighlight: Colors.white.withOpacity(0.14),
          silverHairStreaks: false,
          clothingColor: earlyKurtis[topIdx],
          clothingBorderColor: const Color(0xFFFFD166),
          bindiColor: const Color(0xFF991B1B),
          bindiStyle: 1,
          earringColor: const Color(0xFFFFB703),
          earringStyle: 1,
          lipstickColor: const Color(0xFFE11D48),
        );

      case DesiAgeGroup.midAdult35_44:
        const midSkins = [
          Color(0xFFE4A47E),
          Color(0xFFD28E67),
          Color(0xFFC07B53),
        ];
        const midShadows = [
          Color(0xFFCB8A64),
          Color(0xFFB9734D),
          Color(0xFFA7603B),
        ];
        const midSarees = [
          Color(0xFF0F766E),
          Color(0xFF9E0059),
          Color(0xFF7E22CE),
          Color(0xFFB45309),
        ];

        final skinIdx = (hash ~/ 3) % midSkins.length;
        final topIdx = (hash ~/ 11) % midSarees.length;

        return DesiAvatarRecipe(
          ageGroup: ageGroup,
          backgroundColors: bg,
          skinTone: midSkins[skinIdx],
          shadowSkinTone: midShadows[skinIdx],
          hairColor: const Color(0xFF14121C),
          hairHighlight: Colors.white.withOpacity(0.10),
          silverHairStreaks: false,
          clothingColor: midSarees[topIdx],
          clothingBorderColor: const Color(0xFFFFB703),
          bindiColor: const Color(0xFFB91C1C),
          bindiStyle: 2,
          earringColor: const Color(0xFFFFB703),
          earringStyle: 2,
          lipstickColor: const Color(0xFFBE123C),
        );

      case DesiAgeGroup.senior45Plus:
        const seniorSkins = [
          Color(0xFFDC9A73),
          Color(0xFFC9845D),
          Color(0xFFB67049),
        ];
        const seniorShadows = [
          Color(0xFFC4825C),
          Color(0xFFB06D46),
          Color(0xFF9C5A33),
        ];
        const seniorSarees = [
          Color(0xFF701A75),
          Color(0xFF1E3A8A),
          Color(0xFF78350F),
          Color(0xFF14532D),
        ];

        final skinIdx = (hash ~/ 3) % seniorSkins.length;
        final topIdx = (hash ~/ 11) % seniorSarees.length;

        return DesiAvatarRecipe(
          ageGroup: ageGroup,
          backgroundColors: bg,
          skinTone: seniorSkins[skinIdx],
          shadowSkinTone: seniorShadows[skinIdx],
          hairColor: const Color(0xFF23222B),
          hairHighlight: const Color(0xFFD1D5DB),
          silverHairStreaks: true,
          clothingColor: seniorSarees[topIdx],
          clothingBorderColor: const Color(0xFFFDE68A),
          bindiColor: const Color(0xFF881337),
          bindiStyle: 3,
          earringColor: const Color(0xFFFEF3C7),
          earringStyle: 3,
          lipstickColor: const Color(0xFF9F1239),
        );
    }
  }
}

class _DesiAvatarPainter extends CustomPainter {
  const _DesiAvatarPainter(this.recipe);

  final DesiAvatarRecipe recipe;

  @override
  void paint(Canvas canvas, Size size) {
    final unit = size.shortestSide;
    final center = Offset(size.width / 2, size.height / 2);
    final paint = Paint()..isAntiAlias = true;

    // 1. Base ambient backdrop aura
    paint.color = Colors.white.withOpacity(0.24);
    canvas.drawCircle(Offset(center.dx, center.dy - unit * 0.1), unit * 0.42, paint);

    // 2. Hair Background (for volume, bun, or flowing waves)
    paint.color = recipe.hairColor;
    if (recipe.ageGroup == DesiAgeGroup.youngAdult18_24) {
      final hairPath = Path()
        ..moveTo(center.dx - unit * 0.38, center.dy - unit * 0.05)
        ..quadraticBezierTo(center.dx - unit * 0.42, center.dy + unit * 0.35, center.dx - unit * 0.22, center.dy + unit * 0.45)
        ..lineTo(center.dx + unit * 0.22, center.dy + unit * 0.45)
        ..quadraticBezierTo(center.dx + unit * 0.42, center.dy + unit * 0.35, center.dx + unit * 0.38, center.dy - unit * 0.05)
        ..close();
      canvas.drawPath(hairPath, paint);
    } else if (recipe.ageGroup == DesiAgeGroup.earlyAdult25_34) {
      canvas.drawCircle(Offset(center.dx, center.dy - unit * 0.06), unit * 0.37, paint);
      final lockPath = Path()
        ..moveTo(center.dx - unit * 0.34, center.dy + unit * 0.05)
        ..quadraticBezierTo(center.dx - unit * 0.38, center.dy + unit * 0.38, center.dx - unit * 0.18, center.dy + unit * 0.45)
        ..lineTo(center.dx + unit * 0.18, center.dy + unit * 0.45)
        ..quadraticBezierTo(center.dx + unit * 0.38, center.dy + unit * 0.38, center.dx + unit * 0.34, center.dy + unit * 0.05)
        ..close();
      canvas.drawPath(lockPath, paint);
    } else if (recipe.ageGroup == DesiAgeGroup.midAdult35_44) {
      canvas.drawCircle(Offset(center.dx - unit * 0.08, center.dy - unit * 0.18), unit * 0.26, paint);
      canvas.drawCircle(Offset(center.dx + unit * 0.08, center.dy - unit * 0.18), unit * 0.26, paint);
    } else {
      canvas.drawCircle(Offset(center.dx, center.dy - unit * 0.17), unit * 0.29, paint);
    }

    // 3. Neck & Collarbones
    paint.color = recipe.shadowSkinTone;
    final neckRect = Rect.fromCenter(
      center: Offset(center.dx, center.dy + unit * 0.22),
      width: unit * 0.22,
      height: unit * 0.30,
    );
    canvas.drawRRect(RRect.fromRectAndRadius(neckRect, Radius.circular(unit * 0.08)), paint);

    // 4. Clothing / Saree Drape / Kurti Neckline
    paint.color = recipe.clothingColor;
    final clothingPath = Path()
      ..moveTo(center.dx - unit * 0.48, center.dy + unit * 0.50)
      ..quadraticBezierTo(center.dx - unit * 0.25, center.dy + unit * 0.28, center.dx, center.dy + unit * 0.32)
      ..quadraticBezierTo(center.dx + unit * 0.25, center.dy + unit * 0.28, center.dx + unit * 0.48, center.dy + unit * 0.50)
      ..lineTo(center.dx - unit * 0.48, center.dy + unit * 0.50)
      ..close();
    canvas.drawPath(clothingPath, paint);

    if (recipe.ageGroup == DesiAgeGroup.midAdult35_44 || recipe.ageGroup == DesiAgeGroup.senior45Plus) {
      final sareePallu = Path()
        ..moveTo(center.dx - unit * 0.45, center.dy + unit * 0.50)
        ..lineTo(center.dx - unit * 0.15, center.dy + unit * 0.28)
        ..lineTo(center.dx - unit * 0.02, center.dy + unit * 0.30)
        ..lineTo(center.dx - unit * 0.30, center.dy + unit * 0.50)
        ..close();
      paint.color = recipe.clothingBorderColor.withOpacity(0.95);
      canvas.drawPath(sareePallu, paint);

      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = unit * 0.02;
      paint.color = const Color(0xFFFFD166);
      canvas.drawLine(
        Offset(center.dx - unit * 0.42, center.dy + unit * 0.50),
        Offset(center.dx - unit * 0.13, center.dy + unit * 0.29),
        paint,
      );
      paint.style = PaintingStyle.fill;
    } else if (recipe.ageGroup == DesiAgeGroup.earlyAdult25_34) {
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = unit * 0.022;
      paint.color = recipe.clothingBorderColor.withOpacity(0.85);
      final kurtiNeck = Path()
        ..moveTo(center.dx - unit * 0.15, center.dy + unit * 0.29)
        ..lineTo(center.dx, center.dy + unit * 0.35)
        ..lineTo(center.dx + unit * 0.15, center.dy + unit * 0.29);
      canvas.drawPath(kurtiNeck, paint);
      paint.style = PaintingStyle.fill;
    }

    // 5. Face Oval & Jawline
    paint.color = recipe.skinTone;
    final faceWidth = recipe.ageGroup == DesiAgeGroup.youngAdult18_24
        ? unit * 0.45
        : (recipe.ageGroup == DesiAgeGroup.earlyAdult25_34 ? unit * 0.43 : unit * 0.44);
    final faceHeight = recipe.ageGroup == DesiAgeGroup.youngAdult18_24
        ? unit * 0.52
        : unit * 0.54;

    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(center.dx, center.dy + unit * 0.02),
        width: faceWidth,
        height: faceHeight,
      ),
      paint,
    );

    // 6. Ears
    paint.color = recipe.skinTone;
    canvas.drawOval(
      Rect.fromCenter(center: Offset(center.dx - faceWidth * 0.52, center.dy + unit * 0.03), width: unit * 0.09, height: unit * 0.14),
      paint,
    );
    canvas.drawOval(
      Rect.fromCenter(center: Offset(center.dx + faceWidth * 0.52, center.dy + unit * 0.03), width: unit * 0.09, height: unit * 0.14),
      paint,
    );

    // 7. Earrings (Traditional Indian Jhumkas / Studs)
    paint.color = recipe.earringColor;
    if (recipe.earringStyle == 0) {
      canvas.drawCircle(Offset(center.dx - faceWidth * 0.52, center.dy + unit * 0.07), unit * 0.028, paint);
      canvas.drawCircle(Offset(center.dx + faceWidth * 0.52, center.dy + unit * 0.07), unit * 0.028, paint);
    } else if (recipe.earringStyle == 1) {
      canvas.drawCircle(Offset(center.dx - faceWidth * 0.52, center.dy + unit * 0.06), unit * 0.022, paint);
      canvas.drawCircle(Offset(center.dx + faceWidth * 0.52, center.dy + unit * 0.06), unit * 0.022, paint);
      final jhumkaLeft = Path()
        ..moveTo(center.dx - faceWidth * 0.52 - unit * 0.025, center.dy + unit * 0.11)
        ..lineTo(center.dx - faceWidth * 0.52 + unit * 0.025, center.dy + unit * 0.11)
        ..lineTo(center.dx - faceWidth * 0.52, center.dy + unit * 0.07)
        ..close();
      canvas.drawPath(jhumkaLeft, paint);
      final jhumkaRight = Path()
        ..moveTo(center.dx + faceWidth * 0.52 - unit * 0.025, center.dy + unit * 0.11)
        ..lineTo(center.dx + faceWidth * 0.52 + unit * 0.025, center.dy + unit * 0.11)
        ..lineTo(center.dx + faceWidth * 0.52, center.dy + unit * 0.07)
        ..close();
      canvas.drawPath(jhumkaRight, paint);
    } else if (recipe.earringStyle == 2) {
      canvas.drawCircle(Offset(center.dx - faceWidth * 0.52, center.dy + unit * 0.06), unit * 0.026, paint);
      canvas.drawCircle(Offset(center.dx + faceWidth * 0.52, center.dy + unit * 0.06), unit * 0.026, paint);
      final bellLeft = Path()
        ..moveTo(center.dx - faceWidth * 0.52 - unit * 0.035, center.dy + unit * 0.12)
        ..lineTo(center.dx - faceWidth * 0.52 + unit * 0.035, center.dy + unit * 0.12)
        ..lineTo(center.dx - faceWidth * 0.52, center.dy + unit * 0.07)
        ..close();
      canvas.drawPath(bellLeft, paint);
      canvas.drawCircle(Offset(center.dx - faceWidth * 0.52, center.dy + unit * 0.13), unit * 0.012, paint);

      final bellRight = Path()
        ..moveTo(center.dx + faceWidth * 0.52 - unit * 0.035, center.dy + unit * 0.12)
        ..lineTo(center.dx + faceWidth * 0.52 + unit * 0.035, center.dy + unit * 0.12)
        ..lineTo(center.dx + faceWidth * 0.52, center.dy + unit * 0.07)
        ..close();
      canvas.drawPath(bellRight, paint);
      canvas.drawCircle(Offset(center.dx + faceWidth * 0.52, center.dy + unit * 0.13), unit * 0.012, paint);
    } else {
      canvas.drawCircle(Offset(center.dx - faceWidth * 0.52, center.dy + unit * 0.07), unit * 0.038, paint);
      canvas.drawCircle(Offset(center.dx + faceWidth * 0.52, center.dy + unit * 0.07), unit * 0.038, paint);
      paint.color = Colors.white.withOpacity(0.9);
      canvas.drawCircle(Offset(center.dx - faceWidth * 0.52, center.dy + unit * 0.07), unit * 0.018, paint);
      canvas.drawCircle(Offset(center.dx + faceWidth * 0.52, center.dy + unit * 0.07), unit * 0.018, paint);
    }

    // 8. Front Hairline & Styling
    paint.color = recipe.hairColor;
    if (recipe.ageGroup == DesiAgeGroup.youngAdult18_24) {
      final frontHair = Path()
        ..moveTo(center.dx - faceWidth * 0.54, center.dy - unit * 0.05)
        ..quadraticBezierTo(center.dx - unit * 0.20, center.dy - unit * 0.22, center.dx, center.dy - unit * 0.14)
        ..quadraticBezierTo(center.dx + unit * 0.20, center.dy - unit * 0.22, center.dx + faceWidth * 0.54, center.dy - unit * 0.05)
        ..lineTo(center.dx + faceWidth * 0.54, center.dy - unit * 0.22)
        ..quadraticBezierTo(center.dx, center.dy - unit * 0.32, center.dx - faceWidth * 0.54, center.dy - unit * 0.22)
        ..close();
      canvas.drawPath(frontHair, paint);
    } else if (recipe.ageGroup == DesiAgeGroup.earlyAdult25_34) {
      final frontHair = Path()
        ..moveTo(center.dx - faceWidth * 0.54, center.dy - unit * 0.04)
        ..quadraticBezierTo(center.dx - unit * 0.10, center.dy - unit * 0.20, center.dx + unit * 0.08, center.dy - unit * 0.12)
        ..quadraticBezierTo(center.dx + unit * 0.25, center.dy - unit * 0.18, center.dx + faceWidth * 0.54, center.dy - unit * 0.04)
        ..lineTo(center.dx + faceWidth * 0.54, center.dy - unit * 0.22)
        ..quadraticBezierTo(center.dx, center.dy - unit * 0.32, center.dx - faceWidth * 0.54, center.dy - unit * 0.22)
        ..close();
      canvas.drawPath(frontHair, paint);
    } else if (recipe.ageGroup == DesiAgeGroup.midAdult35_44) {
      final frontHair = Path()
        ..moveTo(center.dx - faceWidth * 0.54, center.dy - unit * 0.02)
        ..quadraticBezierTo(center.dx - unit * 0.15, center.dy - unit * 0.18, center.dx, center.dy - unit * 0.11)
        ..quadraticBezierTo(center.dx + unit * 0.15, center.dy - unit * 0.18, center.dx + faceWidth * 0.54, center.dy - unit * 0.02)
        ..lineTo(center.dx + faceWidth * 0.54, center.dy - unit * 0.22)
        ..quadraticBezierTo(center.dx, center.dy - unit * 0.30, center.dx - faceWidth * 0.54, center.dy - unit * 0.22)
        ..close();
      canvas.drawPath(frontHair, paint);
    } else {
      final frontHair = Path()
        ..moveTo(center.dx - faceWidth * 0.54, center.dy - unit * 0.01)
        ..quadraticBezierTo(center.dx - unit * 0.18, center.dy - unit * 0.16, center.dx, center.dy - unit * 0.09)
        ..quadraticBezierTo(center.dx + unit * 0.18, center.dy - unit * 0.16, center.dx + faceWidth * 0.54, center.dy - unit * 0.01)
        ..lineTo(center.dx + faceWidth * 0.54, center.dy - unit * 0.22)
        ..quadraticBezierTo(center.dx, center.dy - unit * 0.30, center.dx - faceWidth * 0.54, center.dy - unit * 0.22)
        ..close();
      canvas.drawPath(frontHair, paint);

      if (recipe.silverHairStreaks) {
        paint.style = PaintingStyle.stroke;
        paint.strokeWidth = unit * 0.018;
        paint.color = const Color(0xFFCBD5E1).withOpacity(0.75);
        canvas.drawLine(
          Offset(center.dx - unit * 0.14, center.dy - unit * 0.20),
          Offset(center.dx - unit * 0.04, center.dy - unit * 0.11),
          paint,
        );
        canvas.drawLine(
          Offset(center.dx + unit * 0.14, center.dy - unit * 0.20),
          Offset(center.dx + unit * 0.04, center.dy - unit * 0.11),
          paint,
        );
        canvas.drawLine(
          Offset(center.dx - unit * 0.22, center.dy - unit * 0.15),
          Offset(center.dx - unit * 0.15, center.dy - unit * 0.06),
          paint,
        );
        paint.style = PaintingStyle.fill;
      }
    }

    // 9. Eyebrows
    paint.color = const Color(0xFF1E1B29);
    paint.style = PaintingStyle.stroke;
    paint.strokeWidth = unit * 0.022;
    final leftBrow = Path()
      ..moveTo(center.dx - unit * 0.14, center.dy - unit * 0.04)
      ..quadraticBezierTo(center.dx - unit * 0.08, center.dy - unit * 0.06, center.dx - unit * 0.02, center.dy - unit * 0.04);
    canvas.drawPath(leftBrow, paint);
    final rightBrow = Path()
      ..moveTo(center.dx + unit * 0.02, center.dy - unit * 0.04)
      ..quadraticBezierTo(center.dx + unit * 0.08, center.dy - unit * 0.06, center.dx + unit * 0.14, center.dy - unit * 0.04);
    canvas.drawPath(rightBrow, paint);

    // 10. Eyes & Pupils
    paint.style = PaintingStyle.fill;
    paint.color = Colors.white.withOpacity(0.95);
    canvas.drawOval(
      Rect.fromCenter(center: Offset(center.dx - unit * 0.08, center.dy + unit * 0.015), width: unit * 0.09, height: unit * 0.055),
      paint,
    );
    canvas.drawOval(
      Rect.fromCenter(center: Offset(center.dx + unit * 0.08, center.dy + unit * 0.015), width: unit * 0.09, height: unit * 0.055),
      paint,
    );

    paint.color = const Color(0xFF221612);
    canvas.drawCircle(Offset(center.dx - unit * 0.08, center.dy + unit * 0.015), unit * 0.022, paint);
    canvas.drawCircle(Offset(center.dx + unit * 0.08, center.dy + unit * 0.015), unit * 0.022, paint);

    paint.color = Colors.white;
    canvas.drawCircle(Offset(center.dx - unit * 0.088, center.dy + unit * 0.008), unit * 0.007, paint);
    canvas.drawCircle(Offset(center.dx + unit * 0.072, center.dy + unit * 0.008), unit * 0.007, paint);

    paint.style = PaintingStyle.stroke;
    paint.strokeWidth = unit * 0.016;
    paint.color = const Color(0xFF1E1B29);
    final leftLash = Path()
      ..moveTo(center.dx - unit * 0.13, center.dy + unit * 0.012)
      ..quadraticBezierTo(center.dx - unit * 0.08, center.dy - unit * 0.012, center.dx - unit * 0.03, center.dy + unit * 0.012);
    canvas.drawPath(leftLash, paint);
    final rightLash = Path()
      ..moveTo(center.dx + unit * 0.03, center.dy + unit * 0.012)
      ..quadraticBezierTo(center.dx + unit * 0.08, center.dy - unit * 0.012, center.dx + unit * 0.13, center.dy + unit * 0.012);
    canvas.drawPath(rightLash, paint);

    // 11. Bindi
    paint.style = PaintingStyle.fill;
    paint.color = recipe.bindiColor;
    if (recipe.bindiStyle == 0) {
      canvas.drawCircle(Offset(center.dx, center.dy - unit * 0.035), unit * 0.018, paint);
      paint.color = Colors.white.withOpacity(0.8);
      canvas.drawCircle(Offset(center.dx, center.dy - unit * 0.035), unit * 0.008, paint);
    } else if (recipe.bindiStyle == 1) {
      canvas.drawCircle(Offset(center.dx, center.dy - unit * 0.035), unit * 0.024, paint);
    } else if (recipe.bindiStyle == 2) {
      canvas.drawCircle(Offset(center.dx, center.dy - unit * 0.030), unit * 0.030, paint);
    } else {
      canvas.drawCircle(Offset(center.dx, center.dy - unit * 0.025), unit * 0.032, paint);
    }

    // 12. Nose
    paint.style = PaintingStyle.stroke;
    paint.strokeWidth = unit * 0.015;
    paint.color = recipe.shadowSkinTone;
    final nosePath = Path()
      ..moveTo(center.dx, center.dy + unit * 0.03)
      ..lineTo(center.dx - unit * 0.015, center.dy + unit * 0.08)
      ..quadraticBezierTo(center.dx, center.dy + unit * 0.09, center.dx + unit * 0.018, center.dy + unit * 0.08);
    canvas.drawPath(nosePath, paint);

    // 13. Lips / Warm Friendly Smile
    paint.style = PaintingStyle.fill;
    paint.color = recipe.lipstickColor;
    final upperLip = Path()
      ..moveTo(center.dx - unit * 0.075, center.dy + unit * 0.15)
      ..quadraticBezierTo(center.dx - unit * 0.03, center.dy + unit * 0.135, center.dx, center.dy + unit * 0.145)
      ..quadraticBezierTo(center.dx + unit * 0.03, center.dy + unit * 0.135, center.dx + unit * 0.075, center.dy + unit * 0.15)
      ..quadraticBezierTo(center.dx, center.dy + unit * 0.18, center.dx - unit * 0.075, center.dy + unit * 0.15)
      ..close();
    canvas.drawPath(upperLip, paint);

    paint.color = recipe.lipstickColor.withOpacity(0.9);
    final lowerLip = Path()
      ..moveTo(center.dx - unit * 0.065, center.dy + unit * 0.15)
      ..quadraticBezierTo(center.dx, center.dy + unit * 0.20, center.dx + unit * 0.065, center.dy + unit * 0.15)
      ..close();
    canvas.drawPath(lowerLip, paint);

    // 14. Age Maturity Character Lines
    if (recipe.ageGroup == DesiAgeGroup.midAdult35_44) {
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = unit * 0.010;
      paint.color = recipe.shadowSkinTone.withOpacity(0.65);
      canvas.drawLine(
        Offset(center.dx - unit * 0.085, center.dy + unit * 0.12),
        Offset(center.dx - unit * 0.075, center.dy + unit * 0.16),
        paint,
      );
      canvas.drawLine(
        Offset(center.dx + unit * 0.085, center.dy + unit * 0.12),
        Offset(center.dx + unit * 0.075, center.dy + unit * 0.16),
        paint,
      );
    } else if (recipe.ageGroup == DesiAgeGroup.senior45Plus) {
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = unit * 0.011;
      paint.color = recipe.shadowSkinTone.withOpacity(0.75);

      canvas.drawLine(
        Offset(center.dx - unit * 0.09, center.dy + unit * 0.11),
        Offset(center.dx - unit * 0.075, center.dy + unit * 0.17),
        paint,
      );
      canvas.drawLine(
        Offset(center.dx + unit * 0.09, center.dy + unit * 0.11),
        Offset(center.dx + unit * 0.075, center.dy + unit * 0.17),
        paint,
      );

      canvas.drawLine(
        Offset(center.dx - unit * 0.13, center.dy + unit * 0.015),
        Offset(center.dx - unit * 0.16, center.dy + unit * 0.025),
        paint,
      );
      canvas.drawLine(
        Offset(center.dx + unit * 0.13, center.dy + unit * 0.015),
        Offset(center.dx + unit * 0.16, center.dy + unit * 0.025),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _DesiAvatarPainter oldDelegate) =>
      oldDelegate.recipe != recipe;
}

/// A privacy-first, 100% vector Desi / Indian male user avatar renderer.
class DesiMaleAvatar extends StatelessWidget {
  const DesiMaleAvatar({
    super.key,
    required this.seed,
    this.age = 26,
    this.size = 72,
    this.semanticLabel,
  });

  final String seed;
  final int age;
  final double size;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final hashCode = seed.hashCode.abs();
    final skinTones = [
      const Color(0xFFE5A67C),
      const Color(0xFFD49265),
      const Color(0xFFC68052),
      const Color(0xFFB87042),
    ];
    final skin = skinTones[hashCode % skinTones.length];
    final shadowSkin = Color.lerp(skin, const Color(0xFF5A2A18), 0.35)!;
    final bgGradients = [
      [const Color(0xFFE0E7FF), const Color(0xFFC7D2FE)],
      [const Color(0xFFEDE9FE), const Color(0xFFDDD6FE)],
      [const Color(0xFFE0F2FE), const Color(0xFFBAE6FD)],
      [const Color(0xFFF1F5F9), const Color(0xFFE2E8F0)],
      [const Color(0xFFFEF3C7), const Color(0xFFFDE68A)],
    ];
    final bg = bgGradients[hashCode % bgGradients.length];
    final shirtColors = [
      const Color(0xFF1E293B),
      const Color(0xFF3B82F6),
      const Color(0xFF0D9488),
      const Color(0xFF4F46E5),
      const Color(0xFF6366F1),
    ];
    final shirt = shirtColors[hashCode % shirtColors.length];
    final hasBeard = (hashCode % 2) == 0;

    return Semantics(
      image: true,
      label: semanticLabel ?? 'Indian male user avatar',
      child: SizedBox(
        width: size,
        height: size,
        child: DecoratedBox(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: bg,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: ClipOval(
            child: CustomPaint(
              painter: _DesiMaleAvatarPainter(
                skin: skin,
                shadowSkin: shadowSkin,
                shirt: shirt,
                hasBeard: hasBeard,
              ),
              child: const SizedBox.expand(),
            ),
          ),
        ),
      ),
    );
  }
}

class _DesiMaleAvatarPainter extends CustomPainter {
  const _DesiMaleAvatarPainter({
    required this.skin,
    required this.shadowSkin,
    required this.shirt,
    required this.hasBeard,
  });

  final Color skin;
  final Color shadowSkin;
  final Color shirt;
  final bool hasBeard;

  @override
  void paint(Canvas canvas, Size size) {
    final unit = size.width;
    final center = Offset(size.width / 2, size.height / 2);
    final paint = Paint()..isAntiAlias = true;

    // 1. Shoulders & Shirt
    final shirtPath = Path()
      ..moveTo(center.dx - unit * 0.45, size.height)
      ..lineTo(center.dx - unit * 0.42, center.dy + unit * 0.28)
      ..quadraticBezierTo(
        center.dx - unit * 0.25,
        center.dy + unit * 0.20,
        center.dx - unit * 0.12,
        center.dy + unit * 0.24,
      )
      ..lineTo(center.dx, center.dy + unit * 0.32)
      ..lineTo(center.dx + unit * 0.12, center.dy + unit * 0.24)
      ..quadraticBezierTo(
        center.dx + unit * 0.25,
        center.dy + unit * 0.20,
        center.dx + unit * 0.42,
        center.dy + unit * 0.28,
      )
      ..lineTo(center.dx + unit * 0.45, size.height)
      ..close();
    paint.style = PaintingStyle.fill;
    paint.color = shirt;
    canvas.drawPath(shirtPath, paint);

    // Collar / Neckline details
    final collarPath = Path()
      ..moveTo(center.dx - unit * 0.12, center.dy + unit * 0.24)
      ..lineTo(center.dx, center.dy + unit * 0.35)
      ..lineTo(center.dx + unit * 0.12, center.dy + unit * 0.24)
      ..close();
    paint.color = Color.lerp(shirt, Colors.white, 0.2)!;
    canvas.drawPath(collarPath, paint);

    // 2. Neck
    final neckRect = RRect.fromRectAndRadius(
      Rect.fromCenter(
        center: Offset(center.dx, center.dy + unit * 0.18),
        width: unit * 0.22,
        height: unit * 0.24,
      ),
      Radius.circular(unit * 0.04),
    );
    paint.color = shadowSkin;
    canvas.drawRRect(neckRect, paint);

    // 3. Head & Face
    final facePath = Path()
      ..moveTo(center.dx - unit * 0.22, center.dy - unit * 0.05)
      ..quadraticBezierTo(
        center.dx - unit * 0.22,
        center.dy + unit * 0.14,
        center.dx - unit * 0.10,
        center.dy + unit * 0.22,
      )
      ..quadraticBezierTo(
        center.dx,
        center.dy + unit * 0.25,
        center.dx + unit * 0.10,
        center.dy + unit * 0.22,
      )
      ..quadraticBezierTo(
        center.dx + unit * 0.22,
        center.dy + unit * 0.14,
        center.dx + unit * 0.22,
        center.dy - unit * 0.05,
      )
      ..quadraticBezierTo(
        center.dx + unit * 0.22,
        center.dy - unit * 0.24,
        center.dx,
        center.dy - unit * 0.25,
      )
      ..quadraticBezierTo(
        center.dx - unit * 0.22,
        center.dy - unit * 0.24,
        center.dx - unit * 0.22,
        center.dy - unit * 0.05,
      )
      ..close();
    paint.color = skin;
    canvas.drawPath(facePath, paint);

    // 4. Ears
    paint.color = skin;
    canvas.drawCircle(Offset(center.dx - unit * 0.225, center.dy + unit * 0.01), unit * 0.05, paint);
    canvas.drawCircle(Offset(center.dx + unit * 0.225, center.dy + unit * 0.01), unit * 0.05, paint);

    // 5. Hair (Modern textured Indian male hairstyle)
    final hairPath = Path()
      ..moveTo(center.dx - unit * 0.24, center.dy + unit * 0.02)
      ..lineTo(center.dx - unit * 0.23, center.dy - unit * 0.12)
      ..quadraticBezierTo(
        center.dx - unit * 0.22,
        center.dy - unit * 0.32,
        center.dx - unit * 0.05,
        center.dy - unit * 0.33,
      )
      ..quadraticBezierTo(
        center.dx + unit * 0.15,
        center.dy - unit * 0.34,
        center.dx + unit * 0.24,
        center.dy - unit * 0.12,
      )
      ..lineTo(center.dx + unit * 0.24, center.dy + unit * 0.02)
      ..lineTo(center.dx + unit * 0.21, center.dy - unit * 0.02)
      ..quadraticBezierTo(
        center.dx + unit * 0.18,
        center.dy - unit * 0.16,
        center.dx + unit * 0.06,
        center.dy - unit * 0.15,
      )
      ..quadraticBezierTo(
        center.dx - unit * 0.10,
        center.dy - unit * 0.18,
        center.dx - unit * 0.20,
        center.dy - unit * 0.02,
      )
      ..close();
    paint.color = const Color(0xFF181311);
    canvas.drawPath(hairPath, paint);

    // Hair Top Volume
    final crownHair = Path()
      ..moveTo(center.dx - unit * 0.18, center.dy - unit * 0.24)
      ..quadraticBezierTo(center.dx, center.dy - unit * 0.36, center.dx + unit * 0.18, center.dy - unit * 0.24)
      ..close();
    paint.color = const Color(0xFF2C221E);
    canvas.drawPath(crownHair, paint);

    // 6. Eyebrows
    paint.color = const Color(0xFF1A1412);
    paint.style = PaintingStyle.stroke;
    paint.strokeWidth = unit * 0.024;
    paint.strokeCap = StrokeCap.round;

    final leftBrow = Path()
      ..moveTo(center.dx - unit * 0.14, center.dy - unit * 0.045)
      ..quadraticBezierTo(center.dx - unit * 0.09, center.dy - unit * 0.065, center.dx - unit * 0.03, center.dy - unit * 0.04);
    canvas.drawPath(leftBrow, paint);

    final rightBrow = Path()
      ..moveTo(center.dx + unit * 0.03, center.dy - unit * 0.04)
      ..quadraticBezierTo(center.dx + unit * 0.09, center.dy - unit * 0.065, center.dx + unit * 0.14, center.dy - unit * 0.045);
    canvas.drawPath(rightBrow, paint);

    // 7. Eyes
    paint.style = PaintingStyle.fill;
    paint.color = Colors.white;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(center: Offset(center.dx - unit * 0.085, center.dy + unit * 0.005), width: unit * 0.08, height: unit * 0.045),
        Radius.circular(unit * 0.02),
      ),
      paint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(center: Offset(center.dx + unit * 0.085, center.dy + unit * 0.005), width: unit * 0.08, height: unit * 0.045),
        Radius.circular(unit * 0.02),
      ),
      paint,
    );

    // Pupils
    paint.color = const Color(0xFF231815);
    canvas.drawCircle(Offset(center.dx - unit * 0.085, center.dy + unit * 0.005), unit * 0.019, paint);
    canvas.drawCircle(Offset(center.dx + unit * 0.085, center.dy + unit * 0.005), unit * 0.019, paint);

    // Eye catchlights
    paint.color = Colors.white;
    canvas.drawCircle(Offset(center.dx - unit * 0.092, center.dy - unit * 0.002), unit * 0.006, paint);
    canvas.drawCircle(Offset(center.dx + unit * 0.078, center.dy - unit * 0.002), unit * 0.006, paint);

    // 8. Nose
    paint.style = PaintingStyle.stroke;
    paint.strokeWidth = unit * 0.016;
    paint.color = shadowSkin;
    final nosePath = Path()
      ..moveTo(center.dx - unit * 0.01, center.dy - unit * 0.01)
      ..lineTo(center.dx - unit * 0.005, center.dy + unit * 0.07)
      ..quadraticBezierTo(center.dx + unit * 0.03, center.dy + unit * 0.075, center.dx + unit * 0.02, center.dy + unit * 0.06);
    canvas.drawPath(nosePath, paint);

    // 9. Mouth / Smile
    paint.style = PaintingStyle.stroke;
    paint.strokeWidth = unit * 0.018;
    paint.color = const Color(0xFF9E3A3A);
    final mouthPath = Path()
      ..moveTo(center.dx - unit * 0.065, center.dy + unit * 0.125)
      ..quadraticBezierTo(center.dx, center.dy + unit * 0.155, center.dx + unit * 0.065, center.dy + unit * 0.125);
    canvas.drawPath(mouthPath, paint);

    // 10. Neat Beard / Stubble (if enabled)
    if (hasBeard) {
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = unit * 0.018;
      paint.color = const Color(0x701A1412);
      final beardPath = Path()
        ..moveTo(center.dx - unit * 0.18, center.dy + unit * 0.04)
        ..quadraticBezierTo(center.dx - unit * 0.16, center.dy + unit * 0.16, center.dx, center.dy + unit * 0.22)
        ..quadraticBezierTo(center.dx + unit * 0.16, center.dy + unit * 0.16, center.dx + unit * 0.18, center.dy + unit * 0.04);
      canvas.drawPath(beardPath, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _DesiMaleAvatarPainter oldDelegate) =>
      oldDelegate.skin != skin ||
      oldDelegate.shirt != shirt ||
      oldDelegate.hasBeard != hasBeard;
}
