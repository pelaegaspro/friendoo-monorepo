import 'package:flutter/material.dart';

import '../../../core/models/friendoo_avatar_config.dart';
import '../../../core/models/friendoo_models.dart';

export '../../../core/models/friendoo_avatar_config.dart';

/// Gender classification for Friendoo Avatar rendering.
enum DesiGender {
  female,
  male;

  String get label => this == DesiGender.female ? 'Female' : 'Male';
}

/// Age categories for Friendoo Avatar maturity & styling (18 to 45+).
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
        return '18–24 yrs';
      case DesiAgeGroup.earlyAdult25_34:
        return '25–34 yrs';
      case DesiAgeGroup.midAdult35_44:
        return '35–44 yrs';
      case DesiAgeGroup.senior45Plus:
        return '45+ yrs';
    }
  }
}

/// Backward compatible Skin Tone Spectrum enum.
enum DesiSkinTone {
  fairWheatish,
  goldenHoney,
  warmDusky,
  deepBronze,
  richCocoa;

  String get label {
    switch (this) {
      case DesiSkinTone.fairWheatish:
        return 'Fair Wheatish';
      case DesiSkinTone.goldenHoney:
        return 'Golden Honey';
      case DesiSkinTone.warmDusky:
        return 'Warm Dusky';
      case DesiSkinTone.deepBronze:
        return 'Deep Bronze';
      case DesiSkinTone.richCocoa:
        return 'Rich Cocoa';
    }
  }

  Color get primarySkin {
    switch (this) {
      case DesiSkinTone.fairWheatish:
        return const Color(0xFFFBD7B8);
      case DesiSkinTone.goldenHoney:
        return const Color(0xFFF1C099);
      case DesiSkinTone.warmDusky:
        return const Color(0xFFE4A478);
      case DesiSkinTone.deepBronze:
        return const Color(0xFFD38B5E);
      case DesiSkinTone.richCocoa:
        return const Color(0xFFBF754A);
    }
  }

  Color get shadowSkin {
    switch (this) {
      case DesiSkinTone.fairWheatish:
        return const Color(0xFFE5B592);
      case DesiSkinTone.goldenHoney:
        return const Color(0xFFD69D75);
      case DesiSkinTone.warmDusky:
        return const Color(0xFFC78358);
      case DesiSkinTone.deepBronze:
        return const Color(0xFFB46C41);
      case DesiSkinTone.richCocoa:
        return const Color(0xFF9E542D);
    }
  }

  Color get highlightSkin {
    switch (this) {
      case DesiSkinTone.fairWheatish:
        return const Color(0xFFFFF1E4);
      case DesiSkinTone.goldenHoney:
        return const Color(0xFFFDE6D2);
      case DesiSkinTone.warmDusky:
        return const Color(0xFFF9D1B5);
      case DesiSkinTone.deepBronze:
        return const Color(0xFFEFBC9B);
      case DesiSkinTone.richCocoa:
        return const Color(0xFFE2A684);
    }
  }
}

/// A curated 3D Desi Avatar Preset definition in the Avatar Pack.
class DesiAvatarPreset {
  const DesiAvatarPreset({
    required this.id,
    required this.name,
    required this.gender,
    required this.age,
    required this.skinTone,
    required this.styleTitle,
    required this.description,
    required this.assetPath,
  });

  final String id;
  final String name;
  final DesiGender gender;
  final int age;
  final DesiSkinTone skinTone;
  final String styleTitle;
  final String description;
  final String assetPath;

  DesiAgeGroup get ageGroup => DesiAgeGroup.fromAge(age);
}

/// Original social-avatar catalog: ten distinct assets for each Friendoo role.
class DesiAvatarPack {
  static const List<DesiAvatarPreset> userAvatars = [
    DesiAvatarPreset(
      id: 'user_01',
      name: 'Arjun',
      gender: DesiGender.male,
      age: 24,
      skinTone: DesiSkinTone.goldenHoney,
      styleTitle: 'Cobalt Overshirt',
      description: 'Adult South Asian man, oval face, short textured black hair, clean-shaven.',
      assetPath: 'assets/avatars/avatar_user_01.jpg',
    ),
    DesiAvatarPreset(
      id: 'user_02',
      name: 'Kabir',
      gender: DesiGender.male,
      age: 27,
      skinTone: DesiSkinTone.richCocoa,
      styleTitle: 'Forest Sweatshirt',
      description: 'Adult South Asian man, round face, tapered curly hair, neat stubble.',
      assetPath: 'assets/avatars/avatar_user_02.jpg',
    ),
    DesiAvatarPreset(
      id: 'user_03',
      name: 'Rohan',
      gender: DesiGender.male,
      age: 29,
      skinTone: DesiSkinTone.goldenHoney,
      styleTitle: 'Burgundy Bomber',
      description:
          'Adult South Asian man, angular face, wavy side part, light beard.',
      assetPath: 'assets/avatars/avatar_user_03.jpg',
    ),
    DesiAvatarPreset(
      id: 'user_04',
      name: 'Vivaan',
      gender: DesiGender.male,
      age: 23,
      skinTone: DesiSkinTone.fairWheatish,
      styleTitle: 'Mustard Crewneck',
      description:
          'Adult South Asian man, heart-shaped face, cropped curls, glasses.',
      assetPath: 'assets/avatars/avatar_user_04.jpg',
    ),
    DesiAvatarPreset(
      id: 'user_05',
      name: 'Ishaan',
      gender: DesiGender.male,
      age: 31,
      skinTone: DesiSkinTone.deepBronze,
      styleTitle: 'Terracotta Polo',
      description:
          'Adult South Asian man, square face, close fade, full short beard.',
      assetPath: 'assets/avatars/avatar_user_05.jpg',
    ),
    DesiAvatarPreset(
      id: 'user_06',
      name: 'Dev',
      gender: DesiGender.male,
      age: 26,
      skinTone: DesiSkinTone.warmDusky,
      styleTitle: 'Indigo Hoodie',
      description: 'Adult South Asian man, long rectangular face, quiff, moustache and beard.',
      assetPath: 'assets/avatars/avatar_user_06.jpg',
    ),
    DesiAvatarPreset(
      id: 'user_07',
      name: 'Reyansh',
      gender: DesiGender.male,
      age: 28,
      skinTone: DesiSkinTone.fairWheatish,
      styleTitle: 'Coral Casual Shirt',
      description: 'Adult South Asian man, broad oval face, swept-back hair, clean-shaven.',
      assetPath: 'assets/avatars/avatar_user_07.jpg',
    ),
    DesiAvatarPreset(
      id: 'user_08',
      name: 'Aarav',
      gender: DesiGender.male,
      age: 25,
      skinTone: DesiSkinTone.deepBronze,
      styleTitle: 'Teal Knit Top',
      description: 'Adult South Asian man, diamond face, curly medium crop, rimless glasses.',
      assetPath: 'assets/avatars/avatar_user_08.jpg',
    ),
    DesiAvatarPreset(
      id: 'user_09',
      name: 'Siddharth',
      gender: DesiGender.male,
      age: 32,
      skinTone: DesiSkinTone.richCocoa,
      styleTitle: 'Charcoal Denim',
      description:
          'Adult South Asian man, soft round face, buzz cut, trimmed beard.',
      assetPath: 'assets/avatars/avatar_user_09.jpg',
    ),
    DesiAvatarPreset(
      id: 'user_10',
      name: 'Advait',
      gender: DesiGender.male,
      age: 30,
      skinTone: DesiSkinTone.goldenHoney,
      styleTitle: 'Plum Jacket',
      description: 'Adult South Asian man, oval face, shoulder-length tied hair, moustache.',
      assetPath: 'assets/avatars/avatar_user_10.jpg',
    ),
  ];

  static const List<DesiAvatarPreset> hostAvatars = [
    DesiAvatarPreset(
      id: 'host_01',
      name: 'Aanya',
      gender: DesiGender.female,
      age: 24,
      skinTone: DesiSkinTone.goldenHoney,
      styleTitle: 'Rose Kurti',
      description:
          'Adult South Asian woman, oval face, long loose waves, subtle bindi.',
      assetPath: 'assets/avatars/avatar_host_01.jpg',
    ),
    DesiAvatarPreset(
      id: 'host_02',
      name: 'Diya',
      gender: DesiGender.female,
      age: 26,
      skinTone: DesiSkinTone.goldenHoney,
      styleTitle: 'Turquoise Blouse',
      description: 'Adult South Asian woman, round face, chin-length layered bob, earrings.',
      assetPath: 'assets/avatars/avatar_host_02.jpg',
    ),
    DesiAvatarPreset(
      id: 'host_03',
      name: 'Ira',
      gender: DesiGender.female,
      age: 28,
      skinTone: DesiSkinTone.warmDusky,
      styleTitle: 'Violet Blazer',
      description: 'Adult South Asian woman, heart-shaped face, high curly ponytail, glasses.',
      assetPath: 'assets/avatars/avatar_host_03.jpg',
    ),
    DesiAvatarPreset(
      id: 'host_04',
      name: 'Meera',
      gender: DesiGender.female,
      age: 30,
      skinTone: DesiSkinTone.richCocoa,
      styleTitle: 'Orange Wrap Top',
      description:
          'Adult South Asian woman, square face, braided crown, hoops.',
      assetPath: 'assets/avatars/avatar_host_04.jpg',
    ),
    DesiAvatarPreset(
      id: 'host_05',
      name: 'Nisha',
      gender: DesiGender.female,
      age: 27,
      skinTone: DesiSkinTone.deepBronze,
      styleTitle: 'Emerald Kurti',
      description: 'Adult South Asian woman, diamond face, sleek low bun, fine necklace.',
      assetPath: 'assets/avatars/avatar_host_05.jpg',
    ),
    DesiAvatarPreset(
      id: 'host_06',
      name: 'Riya',
      gender: DesiGender.female,
      age: 25,
      skinTone: DesiSkinTone.fairWheatish,
      styleTitle: 'Cobalt Top',
      description: 'Adult South Asian woman, broad oval face, shoulder-length curls, small nose stud.',
      assetPath: 'assets/avatars/avatar_host_06.jpg',
    ),
    DesiAvatarPreset(
      id: 'host_07',
      name: 'Kavya',
      gender: DesiGender.female,
      age: 29,
      skinTone: DesiSkinTone.goldenHoney,
      styleTitle: 'Coral Blouse',
      description: 'Adult South Asian woman, long face, side-swept straight hair, geometric earrings.',
      assetPath: 'assets/avatars/avatar_host_07.jpg',
    ),
    DesiAvatarPreset(
      id: 'host_08',
      name: 'Tanvi',
      gender: DesiGender.female,
      age: 23,
      skinTone: DesiSkinTone.warmDusky,
      styleTitle: 'Mustard Cardigan',
      description:
          'Adult South Asian woman, round face, short pixie cut, glasses.',
      assetPath: 'assets/avatars/avatar_host_08.jpg',
    ),
    DesiAvatarPreset(
      id: 'host_09',
      name: 'Ananya',
      gender: DesiGender.female,
      age: 31,
      skinTone: DesiSkinTone.deepBronze,
      styleTitle: 'Deep Plum Kurti',
      description: 'Adult South Asian woman, oval face, thick braid over shoulder, jhumka earrings.',
      assetPath: 'assets/avatars/avatar_host_09.jpg',
    ),
    DesiAvatarPreset(
      id: 'host_10',
      name: 'Pooja',
      gender: DesiGender.female,
      age: 33,
      skinTone: DesiSkinTone.richCocoa,
      styleTitle: 'Teal Sari Blouse',
      description: 'Adult South Asian woman, heart-shaped face, soft grey-streaked bun, pendant.',
      assetPath: 'assets/avatars/avatar_host_10.jpg',
    ),
  ];

  /// Legacy gender accessors preserve all existing avatar call sites.
  static const List<DesiAvatarPreset> femaleAvatars = hostAvatars;
  static const List<DesiAvatarPreset> maleAvatars = userAvatars;

  static List<DesiAvatarPreset> get all => [...hostAvatars, ...userAvatars];

  /// Returns the complete role pack without reordering, suited for selection UI.
  static List<DesiAvatarPreset> getAvatarsForRole(String role, [int? age]) {
    return role.toLowerCase() == 'host' ? hostAvatars : userAvatars;
  }

  static bool isValidPresetForRole(String presetId, String role) {
    final normalized = presetId
        .replaceAll('assets/avatars/', '')
        .replaceAll('.jpg', '')
        .replaceAll('avatar_', '')
        .trim();
    return getAvatarsForRole(role)
        .any((preset) => preset.id == presetId || preset.id == normalized);
  }

  static DesiAvatarPreset findById(String id) {
    final normalized = id
        .replaceAll('assets/avatars/', '')
        .replaceAll('.jpg', '')
        .replaceAll('avatar_', '')
        .trim();

    // Map legacy aliases
    String effectiveId = normalized;
    if (effectiveId == 'f_18') effectiveId = 'host_01';
    if (effectiveId == 'f_22') effectiveId = 'host_02';
    if (effectiveId == 'f_28') effectiveId = 'host_03';
    if (effectiveId == 'f_35') effectiveId = 'host_04';
    if (effectiveId == 'f_42') effectiveId = 'host_05';
    if (effectiveId == 'm_19') effectiveId = 'user_01';
    if (effectiveId == 'm_25') effectiveId = 'user_02';
    if (effectiveId == 'm_32') effectiveId = 'user_03';
    if (effectiveId == 'm_38') effectiveId = 'user_04';
    if (effectiveId == 'm_45') effectiveId = 'user_05';

    final isUser =
        effectiveId.startsWith('user_') || effectiveId.startsWith('m_');
    return all.firstWhere(
      (a) => a.id == effectiveId || a.id == id,
      orElse: () => isUser ? userAvatars.first : hostAvatars.first,
    );
  }

  static List<DesiAvatarPreset> getAvatarsForGenderAndAge(
    DesiGender gender,
    int userAge,
  ) {
    final list = List<DesiAvatarPreset>.from(
      gender == DesiGender.female ? femaleAvatars : maleAvatars,
    );
    list.sort((a, b) {
      final diffA = (a.age - userAge).abs();
      final diffB = (b.age - userAge).abs();
      return diffA.compareTo(diffB);
    });
    return list;
  }

  static DesiAvatarPreset findBySeedAndGender(
    String seed,
    DesiGender gender, [
    int? preferredAge,
  ]) {
    final list = gender == DesiGender.female ? femaleAvatars : maleAvatars;
    if (preferredAge != null) {
      DesiAvatarPreset? closest;
      int minDiff = 999;
      for (final p in list) {
        final diff = (p.age - preferredAge).abs();
        if (diff < minDiff) {
          minDiff = diff;
          closest = p;
        }
      }
      if (closest != null) return closest;
    }
    var hash = seed.hashCode.abs();
    return list[hash % list.length];
  }
}

// =============================================================================
// UNIFIED COMPOSABLE LAYERED AVATAR RENDERER
// =============================================================================

/// Unified Friendoo Avatar Engine Widget.
///
/// Implements composable layered rendering:
/// Background -> Effects -> Hair Bg -> Base Body -> Outfit -> Face -> Eyes -> Mouth -> Hair Fg -> Accessories -> Badges
class FriendooAvatar extends StatelessWidget {
  const FriendooAvatar({
    super.key,
    this.config,
    this.seed,
    this.gender = DesiGender.female,
    this.role = 'user',
    this.age = 24,
    this.skinTone,
    this.isStar = false,
    this.size = 72,
    this.showPresence = false,
    this.isOnline = false,
    this.status,
    this.onTap,
    this.semanticLabel,
  });

  final FriendooAvatarConfig? config;
  final String? seed;
  final DesiGender gender;
  final String role;
  final int age;
  final DesiSkinTone? skinTone;
  final bool isStar;
  final double size;
  final bool showPresence;
  final bool isOnline;
  final HostStatus? status;
  final VoidCallback? onTap;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    // Resolve configuration
    final effectiveConfig =
        config ??
        (seed != null && seed!.isNotEmpty
            ? FriendooAvatarConfig.fromSeed(
                seed: seed!,
                gender: gender == DesiGender.female ? 'female' : 'male',
                role: isStar ? 'host' : role,
                age: age,
              )
            : (gender == DesiGender.female || role == 'host'
                  ? FriendooAvatarConfig.defaultHost(age: age)
                  : FriendooAvatarConfig.defaultUser(
                      gender: gender.name,
                      age: age,
                    )));

    // Check if preset image exists
    final preset = effectiveConfig.presetId != null
        ? DesiAvatarPack.findById(effectiveConfig.presetId!)
        : (seed != null
              ? DesiAvatarPack.findBySeedAndGender(seed!, gender, age)
              : null);

    final avatarContent = SizedBox(
      width: size,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // 1. Host Star Glow / Ambient Aura
          if (isStar || effectiveConfig.isHost)
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const RadialGradient(
                    colors: [
                      Color(0xFFFFD166),
                      Color(0xFFFFB703),
                      Color(0xFFFB8500),
                    ],
                    radius: 0.85,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFFFB703).withValues(alpha: 0.50),
                      blurRadius: size * 0.22,
                      spreadRadius: size * 0.03,
                    ),
                  ],
                ),
                padding: EdgeInsets.all(size * 0.045),
                child: Container(
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),

          // 2. Layered Avatar Canvas / High-Res Asset
          Positioned.fill(
            child: Padding(
              padding: EdgeInsets.all(
                isStar || effectiveConfig.isHost ? size * 0.055 : 0,
              ),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.85),
                    width: size * 0.032,
                  ),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: effectiveConfig.parsedBackgroundGradient,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: size * 0.16,
                      offset: Offset(0, size * 0.04),
                    ),
                    BoxShadow(
                      color: (effectiveConfig.parsedBackgroundGradient.first)
                          .withValues(alpha: 0.35),
                      blurRadius: size * 0.12,
                      offset: Offset(0, size * 0.02),
                    ),
                  ],
                ),
                child: ClipOval(
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      preset != null
                          ? Image.asset(
                              preset.assetPath,
                              fit: BoxFit.cover,
                              alignment: Alignment.topCenter,
                              gaplessPlayback: true,
                              errorBuilder: (context, error, stackTrace) =>
                                  CustomPaint(
                                    painter: _FriendooLayeredAvatarPainter(
                                      effectiveConfig,
                                    ),
                                    child: const SizedBox.expand(),
                                  ),
                            )
                          : CustomPaint(
                              painter: _FriendooLayeredAvatarPainter(
                                effectiveConfig,
                              ),
                              child: const SizedBox.expand(),
                            ),
                      // 3D Studio Specular Lighting & Depth Vignette (Snapchat 3D Bitmoji look)
                      Positioned.fill(
                        child: IgnorePointer(
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: RadialGradient(
                                center: const Alignment(-0.35, -0.45),
                                radius: 0.9,
                                colors: [
                                  Colors.white.withValues(alpha: 0.18),
                                  Colors.transparent,
                                  Colors.black.withValues(alpha: 0.14),
                                ],
                                stops: const [0.0, 0.55, 1.0],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // 3. Online / Busy / Offline Presence Dot
          if (showPresence)
            Positioned(
              right: size * 0.015,
              bottom: size * 0.015,
              child: Container(
                width: size * 0.23,
                height: size * 0.23,
                decoration: BoxDecoration(
                  color: status != null
                      ? Color(status!.colorHex)
                      : (isOnline
                            ? const Color(0xFF10B981)
                            : const Color(0xFF9CA3AF)),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: size * 0.035),
                  boxShadow: [
                    BoxShadow(
                      color:
                          (status != null
                                  ? Color(status!.colorHex)
                                  : (isOnline
                                        ? const Color(0xFF10B981)
                                        : Colors.black26))
                              .withValues(alpha: 0.55),
                      blurRadius: 5,
                      offset: const Offset(0, 1.5),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: Semantics(label: semanticLabel, child: avatarContent),
      );
    }

    return Semantics(label: semanticLabel, child: avatarContent);
  }
}

/// Backward compatible drop-in replacement for DesiAvatar.
class DesiAvatar extends StatelessWidget {
  const DesiAvatar({
    super.key,
    required this.seed,
    this.gender = DesiGender.female,
    this.age = 24,
    this.skinTone,
    this.isStar = false,
    this.size = 72,
    this.showPresence = false,
    this.isOnline = false,
    this.semanticLabel,
  });

  final String seed;
  final DesiGender gender;
  final int age;
  final DesiSkinTone? skinTone;
  final bool isStar;
  final double size;
  final bool showPresence;
  final bool isOnline;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    return FriendooAvatar(
      seed: seed,
      gender: gender,
      age: age,
      skinTone: skinTone,
      isStar: isStar,
      size: size,
      showPresence: showPresence,
      isOnline: isOnline,
      semanticLabel: semanticLabel,
    );
  }
}

/// Backward compatible alias for female avatar renderer.
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
    return FriendooAvatar(
      seed: seed,
      gender: DesiGender.female,
      age: age,
      isStar: isStar,
      size: size,
      showPresence: showPresence,
      isOnline: isOnline,
      semanticLabel: semanticLabel,
    );
  }
}

/// Backward compatible alias for male avatar renderer.
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
    return FriendooAvatar(
      seed: seed,
      gender: DesiGender.male,
      age: age,
      size: size,
      semanticLabel: semanticLabel,
    );
  }
}

// =============================================================================
// COMPOSABLE LAYERED VECTOR CANVAS PAINTER
// =============================================================================

/// Multi-layered vector canvas painter rendering full composable avatars.
class _FriendooLayeredAvatarPainter extends CustomPainter {
  const _FriendooLayeredAvatarPainter(this.config);

  final FriendooAvatarConfig config;

  @override
  void paint(Canvas canvas, Size size) {
    final unit = size.shortestSide;
    final center = Offset(size.width / 2, size.height / 2);

    final skinColor = config.parsedSkinColor;
    final shadowSkinColor = config.parsedSkinShadowColor;
    final hairColor = config.parsedHairColor;
    final outfitColor = config.parsedOutfitColor;
    final eyeColor = config.parsedEyeColor;

    // Layer 1: Background Aura Glow
    final auraPaint = Paint()
      ..shader =
          RadialGradient(
            colors: [
              Colors.white.withValues(alpha: 0.35),
              Colors.white.withValues(alpha: 0.0),
            ],
          ).createShader(
            Rect.fromCircle(
              center: Offset(center.dx, center.dy - unit * 0.1),
              radius: unit * 0.45,
            ),
          );
    canvas.drawCircle(
      Offset(center.dx, center.dy - unit * 0.1),
      unit * 0.45,
      auraPaint,
    );

    // Layer 2: Background Hair Volume (if long hair/bun)
    if (config.isFemale) {
      final hairBgPaint = Paint()
        ..shader =
            RadialGradient(
              center: const Alignment(0, -0.3),
              colors: [
                Color.lerp(hairColor, Colors.white, 0.12)!,
                hairColor,
                Color.lerp(hairColor, Colors.black, 0.4)!,
              ],
            ).createShader(
              Rect.fromCircle(
                center: Offset(center.dx, center.dy - unit * 0.08),
                radius: unit * 0.42,
              ),
            );

      final hairPath = Path()
        ..moveTo(center.dx - unit * 0.40, center.dy - unit * 0.05)
        ..quadraticBezierTo(
          center.dx - unit * 0.44,
          center.dy + unit * 0.36,
          center.dx - unit * 0.20,
          center.dy + unit * 0.48,
        )
        ..lineTo(center.dx + unit * 0.20, center.dy + unit * 0.48)
        ..quadraticBezierTo(
          center.dx + unit * 0.44,
          center.dy + unit * 0.36,
          center.dx + unit * 0.40,
          center.dy - unit * 0.05,
        )
        ..close();
      canvas.drawPath(hairPath, hairBgPaint);
    }

    // Layer 3: Base Neck & Collarbone
    final neckPaint = Paint()
      ..shader =
          LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [shadowSkinColor, skinColor],
          ).createShader(
            Rect.fromLTWH(
              center.dx - unit * 0.12,
              center.dy + unit * 0.12,
              unit * 0.24,
              unit * 0.25,
            ),
          );

    final neckPath = Path()
      ..moveTo(center.dx - unit * 0.11, center.dy + unit * 0.12)
      ..lineTo(center.dx - unit * 0.15, center.dy + unit * 0.40)
      ..lineTo(center.dx + unit * 0.15, center.dy + unit * 0.40)
      ..lineTo(center.dx + unit * 0.11, center.dy + unit * 0.12)
      ..close();
    canvas.drawPath(neckPath, neckPaint);

    // Layer 4: Outfit / Clothing Base
    final outfitPaint = Paint()
      ..shader =
          LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color.lerp(outfitColor, Colors.white, 0.15)!,
              outfitColor,
              Color.lerp(outfitColor, Colors.black, 0.3)!,
            ],
          ).createShader(
            Rect.fromLTWH(0, center.dy + unit * 0.25, size.width, unit * 0.4),
          );

    final outfitPath = Path()
      ..moveTo(center.dx - unit * 0.45, center.dy + unit * 0.50)
      ..quadraticBezierTo(
        center.dx - unit * 0.32,
        center.dy + unit * 0.28,
        center.dx - unit * 0.14,
        center.dy + unit * 0.34,
      )
      ..quadraticBezierTo(
        center.dx,
        center.dy + unit * 0.38,
        center.dx + unit * 0.14,
        center.dy + unit * 0.34,
      )
      ..quadraticBezierTo(
        center.dx + unit * 0.32,
        center.dy + unit * 0.28,
        center.dx + unit * 0.45,
        center.dy + unit * 0.50,
      )
      ..lineTo(center.dx + unit * 0.50, size.height)
      ..lineTo(center.dx - unit * 0.50, size.height)
      ..close();
    canvas.drawPath(outfitPath, outfitPaint);

    // Outfit Collar Accents / Gold Stitch
    final borderPaint = Paint()
      ..color = const Color(0xFFFFD166)
      ..style = PaintingStyle.stroke
      ..strokeWidth = unit * 0.025;
    canvas.drawPath(
      Path()
        ..moveTo(center.dx - unit * 0.14, center.dy + unit * 0.34)
        ..quadraticBezierTo(
          center.dx,
          center.dy + unit * 0.38,
          center.dx + unit * 0.14,
          center.dy + unit * 0.34,
        ),
      borderPaint,
    );

    // Layer 5: Face Base & Cheek Volumetric Shading
    final faceRect = Rect.fromCenter(
      center: Offset(center.dx, center.dy - unit * 0.04),
      width: unit * 0.48,
      height: unit * 0.56,
    );

    final facePaint = Paint()
      ..shader = RadialGradient(
        center: const Alignment(0, -0.2),
        colors: [
          Color.lerp(skinColor, Colors.white, 0.18)!,
          skinColor,
          shadowSkinColor,
        ],
        radius: 0.75,
      ).createShader(faceRect);

    canvas.drawRRect(
      RRect.fromRectAndRadius(faceRect, Radius.circular(unit * 0.24)),
      facePaint,
    );

    // Rosy Blush Cheeks
    final blushPaint = Paint()
      ..color = const Color(0xFFFB7185).withValues(alpha: 0.22)
      ..maskFilter = MaskFilter.blur(BlurStyle.normal, unit * 0.035);
    canvas.drawCircle(
      Offset(center.dx - unit * 0.15, center.dy + unit * 0.06),
      unit * 0.055,
      blushPaint,
    );
    canvas.drawCircle(
      Offset(center.dx + unit * 0.15, center.dy + unit * 0.06),
      unit * 0.055,
      blushPaint,
    );

    // Layer 6: Stylized Eyebrows
    final browPaint = Paint()
      ..color = hairColor
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = unit * 0.024;

    canvas.drawPath(
      Path()
        ..moveTo(center.dx - unit * 0.18, center.dy - unit * 0.09)
        ..quadraticBezierTo(
          center.dx - unit * 0.12,
          center.dy - unit * 0.12,
          center.dx - unit * 0.04,
          center.dy - unit * 0.09,
        ),
      browPaint,
    );
    canvas.drawPath(
      Path()
        ..moveTo(center.dx + unit * 0.04, center.dy - unit * 0.09)
        ..quadraticBezierTo(
          center.dx + unit * 0.12,
          center.dy - unit * 0.12,
          center.dx + unit * 0.18,
          center.dy - unit * 0.09,
        ),
      browPaint,
    );

    // Layer 7: Eyes & Large Glossy Pupils
    _paintEye(
      canvas,
      Offset(center.dx - unit * 0.11, center.dy - unit * 0.02),
      unit,
      eyeColor,
    );
    _paintEye(
      canvas,
      Offset(center.dx + unit * 0.11, center.dy - unit * 0.02),
      unit,
      eyeColor,
    );

    // Layer 8: Nose Bridge
    final nosePaint = Paint()
      ..color = shadowSkinColor
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = unit * 0.016;
    canvas.drawPath(
      Path()
        ..moveTo(center.dx, center.dy - unit * 0.04)
        ..lineTo(center.dx, center.dy + unit * 0.08)
        ..quadraticBezierTo(
          center.dx + unit * 0.03,
          center.dy + unit * 0.085,
          center.dx + unit * 0.035,
          center.dy + unit * 0.07,
        ),
      nosePaint,
    );

    // Layer 9: Confident Smile / Lips
    final lipColor = config.isFemale
        ? const Color(0xFFE11D48)
        : Color.lerp(skinColor, const Color(0xFF991B1B), 0.4)!;
    final mouthPaint = Paint()
      ..color = lipColor
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = unit * (config.isFemale ? 0.025 : 0.020);

    canvas.drawPath(
      Path()
        ..moveTo(center.dx - unit * 0.09, center.dy + unit * 0.14)
        ..quadraticBezierTo(
          center.dx,
          center.dy + unit * 0.20,
          center.dx + unit * 0.09,
          center.dy + unit * 0.14,
        ),
      mouthPaint,
    );

    // Layer 10: Hair Foreground Layer (Quiff/Bangs/Waves)
    final hairFgPaint = Paint()
      ..shader =
          RadialGradient(
            center: const Alignment(0, -0.4),
            colors: [
              Color.lerp(hairColor, Colors.white, 0.25)!,
              hairColor,
              Color.lerp(hairColor, Colors.black, 0.5)!,
            ],
            radius: 0.8,
          ).createShader(
            Rect.fromCircle(
              center: Offset(center.dx, center.dy - unit * 0.18),
              radius: unit * 0.35,
            ),
          );

    final hairFgPath = Path()
      ..moveTo(center.dx - unit * 0.26, center.dy - unit * 0.05)
      ..quadraticBezierTo(
        center.dx - unit * 0.22,
        center.dy - unit * 0.32,
        center.dx,
        center.dy - unit * 0.32,
      )
      ..quadraticBezierTo(
        center.dx + unit * 0.22,
        center.dy - unit * 0.32,
        center.dx + unit * 0.26,
        center.dy - unit * 0.05,
      )
      ..quadraticBezierTo(
        center.dx + unit * 0.12,
        center.dy - unit * 0.22,
        center.dx,
        center.dy - unit * 0.22,
      )
      ..quadraticBezierTo(
        center.dx - unit * 0.12,
        center.dy - unit * 0.22,
        center.dx - unit * 0.26,
        center.dy - unit * 0.05,
      )
      ..close();
    canvas.drawPath(hairFgPath, hairFgPaint);

    // Layer 11: Accessories (Bindis, Earrings, Beard, Glasses)
    if (config.accessory == 'bindi_ruby' ||
        (config.isFemale && config.isHost)) {
      final bindiPaint = Paint()..color = const Color(0xFFBE123C);
      canvas.drawCircle(
        Offset(center.dx, center.dy - unit * 0.075),
        unit * 0.022,
        bindiPaint,
      );
      canvas.drawCircle(
        Offset(center.dx - unit * 0.005, center.dy - unit * 0.08),
        unit * 0.008,
        Paint()..color = Colors.white.withValues(alpha: 0.6),
      );
    } else if (config.accessory == 'bindi_crystal') {
      final bindiPaint = Paint()..color = const Color(0xFFFFD166);
      canvas.drawCircle(
        Offset(center.dx, center.dy - unit * 0.075),
        unit * 0.020,
        bindiPaint,
      );
    }

    if (config.accessory == 'glasses_round') {
      final glassPaint = Paint()
        ..color = const Color(0xFF1E293B)
        ..style = PaintingStyle.stroke
        ..strokeWidth = unit * 0.02;
      canvas.drawCircle(
        Offset(center.dx - unit * 0.11, center.dy - unit * 0.02),
        unit * 0.075,
        glassPaint,
      );
      canvas.drawCircle(
        Offset(center.dx + unit * 0.11, center.dy - unit * 0.02),
        unit * 0.075,
        glassPaint,
      );
      canvas.drawLine(
        Offset(center.dx - unit * 0.035, center.dy - unit * 0.02),
        Offset(center.dx + unit * 0.035, center.dy - unit * 0.02),
        glassPaint,
      );
    }

    if (config.accessory == 'gold_chain' || config.isMale) {
      final chainPaint = Paint()
        ..color = const Color(0xFFFFD166)
        ..style = PaintingStyle.stroke
        ..strokeWidth = unit * 0.015;
      canvas.drawPath(
        Path()
          ..moveTo(center.dx - unit * 0.10, center.dy + unit * 0.35)
          ..quadraticBezierTo(
            center.dx,
            center.dy + unit * 0.42,
            center.dx + unit * 0.10,
            center.dy + unit * 0.35,
          ),
        chainPaint,
      );
    }
  }

  void _paintEye(Canvas canvas, Offset eyeCenter, double unit, Color eyeColor) {
    // Sclera (Eye White)
    final scleraPaint = Paint()..color = Colors.white;
    final eyeRect = Rect.fromCenter(
      center: eyeCenter,
      width: unit * 0.12,
      height: unit * 0.09,
    );
    canvas.drawOval(eyeRect, scleraPaint);

    // Colored Iris
    final irisPaint = Paint()
      ..shader = RadialGradient(
        colors: [eyeColor, Color.lerp(eyeColor, Colors.black, 0.4)!],
      ).createShader(Rect.fromCircle(center: eyeCenter, radius: unit * 0.04));
    canvas.drawCircle(eyeCenter, unit * 0.038, irisPaint);

    // Pupil
    canvas.drawCircle(
      eyeCenter,
      unit * 0.022,
      Paint()..color = const Color(0xFF0F0E14),
    );

    // Double Specular Catchlights (Snapchat 3D Bitmoji signature)
    canvas.drawCircle(
      Offset(eyeCenter.dx - unit * 0.012, eyeCenter.dy - unit * 0.012),
      unit * 0.010,
      Paint()..color = Colors.white,
    );
    canvas.drawCircle(
      Offset(eyeCenter.dx + unit * 0.012, eyeCenter.dy + unit * 0.010),
      unit * 0.005,
      Paint()..color = Colors.white.withValues(alpha: 0.75),
    );
  }

  @override
  bool shouldRepaint(covariant _FriendooLayeredAvatarPainter oldDelegate) {
    return oldDelegate.config != config;
  }
}

// =============================================================================
// INTERACTIVE AVATAR CUSTOMIZER COMPONENT
// =============================================================================

/// Full-screen Avatar Customization Editor Page.
class FriendooAvatarEditorPage extends StatefulWidget {
  const FriendooAvatarEditorPage({
    super.key,
    required this.initialConfig,
    required this.onSave,
  });

  final FriendooAvatarConfig initialConfig;
  final ValueChanged<FriendooAvatarConfig> onSave;

  static Future<void> push(
    BuildContext context, {
    required FriendooAvatarConfig initialConfig,
    required ValueChanged<FriendooAvatarConfig> onSave,
  }) {
    return Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => FriendooAvatarEditorPage(
          initialConfig: initialConfig,
          onSave: onSave,
        ),
      ),
    );
  }

  @override
  State<FriendooAvatarEditorPage> createState() =>
      _FriendooAvatarEditorPageState();
}

class _FriendooAvatarEditorPageState extends State<FriendooAvatarEditorPage> {
  late FriendooAvatarConfig _currentConfig;
  int _activeCategoryIndex = 0;

  @override
  void initState() {
    super.initState();
    _currentConfig = widget.initialConfig;
  }

  void _resetToDefault() {
    setState(() {
      _currentConfig = _currentConfig.isHost
          ? FriendooAvatarConfig.defaultHost()
          : FriendooAvatarConfig.defaultUser(gender: _currentConfig.gender);
    });
  }

  void _handleSave() {
    widget.onSave(_currentConfig);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final themeColor = _currentConfig.isHost
        ? const Color(0xFFFF2A85)
        : const Color(0xFF6366F1);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: Color(0xFF111827)),
          onPressed: () => Navigator.of(context).pop(), // Cancel discards edits
        ),
        title: const Text(
          'Customize Avatar',
          style: TextStyle(
            color: Color(0xFF111827),
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
        actions: [
          TextButton.icon(
            onPressed: _resetToDefault,
            icon: const Icon(Icons.restart_alt_rounded, size: 18),
            label: const Text(
              'Reset',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
            style: TextButton.styleFrom(
              foregroundColor: const Color(0xFF6B7280),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Top Live Avatar Preview Stage
            Builder(
              builder: (context) {
                final activePreset = _currentConfig.presetId != null
                    ? DesiAvatarPack.findById(_currentConfig.presetId!)
                    : (_currentConfig.isFemale
                          ? DesiAvatarPack.femaleAvatars.first
                          : DesiAvatarPack.maleAvatars.first);

                return Container(
                  margin: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                  padding: const EdgeInsets.symmetric(
                    vertical: 14,
                    horizontal: 20,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                    boxShadow: const [
                      BoxShadow(
                        color: Colors.black12,
                        blurRadius: 8,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Center(
                        child: FriendooAvatar(
                          config: _currentConfig,
                          size: 104,
                          isStar: _currentConfig.isHost,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            activePreset.name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF111827),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF3F4F6),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '${activePreset.age} yrs',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF4B5563),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        activePreset.styleTitle,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),

            // Category Tabs Bar
            SizedBox(
              height: 46,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _buildTab(0, '🎭 3D Models', themeColor),
                  _buildTab(1, '🎨 Skin Tone', themeColor),
                  _buildTab(2, '👗 3D Outfits', themeColor),
                  _buildTab(3, '💇 Hairstyles', themeColor),
                  _buildTab(4, '🌈 Backdrops', themeColor),
                  _buildTab(5, '✨ Accents', themeColor),
                ],
              ),
            ),

            // Tab Panels
            Expanded(
              child: IndexedStack(
                index: _activeCategoryIndex,
                children: [
                  // Tab 0: 3D Character Models Grid
                  _buildModelsPanel(themeColor),
                  // Tab 1: Melanin Skin Tones
                  _buildSkinPanel(themeColor),
                  // Tab 2: 3D Outfits & Styles
                  _buildOutfitPanel(themeColor),
                  // Tab 3: 3D Hairstyles
                  _buildHairPanel(themeColor),
                  // Tab 4: Studio Backgrounds
                  _buildBackgroundPanel(themeColor),
                  // Tab 5: Accessories & Accents
                  _buildAccessoryPanel(themeColor),
                ],
              ),
            ),

            // Save CTA
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _handleSave,
                  style: FilledButton.styleFrom(
                    backgroundColor: themeColor,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'Save Changes ➔',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTab(int index, String title, Color themeColor) {
    final isSelected = _activeCategoryIndex == index;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(
          title,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: isSelected ? Colors.white : const Color(0xFF374151),
          ),
        ),
        selected: isSelected,
        selectedColor: themeColor,
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(99),
          side: BorderSide(
            color: isSelected ? themeColor : const Color(0xFFE5E7EB),
          ),
        ),
        onSelected: (_) => setState(() => _activeCategoryIndex = index),
      ),
    );
  }

  /// Tab 0: Full Grid of 10 Photorealistic 3D Character Models
  Widget _buildModelsPanel(Color themeColor) {
    final gender = _currentConfig.isFemale
        ? DesiGender.female
        : DesiGender.male;
    final presets = gender == DesiGender.female
        ? DesiAvatarPack.femaleAvatars
        : DesiAvatarPack.maleAvatars;

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
        childAspectRatio: 0.82,
      ),
      itemCount: presets.length,
      itemBuilder: (context, index) {
        final preset = presets[index];
        final isSelected = _currentConfig.presetId == preset.id;

        return InkWell(
          onTap: () {
            setState(() {
              _currentConfig = _currentConfig.copyWith(
                presetId: preset.id,
                skin: (preset.age % 10 + 1).toString().padLeft(2, '0'),
              );
            });
          },
          borderRadius: BorderRadius.circular(20),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected ? themeColor : const Color(0xFFE5E7EB),
                width: isSelected ? 2.5 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: isSelected
                      ? themeColor.withValues(alpha: 0.15)
                      : Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            padding: const EdgeInsets.all(10),
            child: Column(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: _currentConfig.parsedBackgroundGradient,
                      ),
                    ),
                    child: ClipOval(
                      child: Image.asset(
                        preset.assetPath,
                        fit: BoxFit.cover,
                        alignment: Alignment.topCenter,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      preset.name,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: isSelected
                            ? themeColor
                            : const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 5,
                        vertical: 1.5,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '${preset.age}y',
                        style: const TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF4B5563),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  preset.styleTitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF6B7280),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Tab 1: Melanin Skin Tones
  Widget _buildSkinPanel(Color themeColor) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: FriendooAvatarConfig.skinTones.length,
      itemBuilder: (context, index) {
        final item = FriendooAvatarConfig.skinTones[index];
        final id = item['id'] as String;
        final color = item['color'] as Color;
        final name = item['name'] as String;
        final isSelected = _currentConfig.skin == id;

        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: InkWell(
            onTap: () {
              final skinNum = int.tryParse(id) ?? 2;
              final isFem = _currentConfig.isFemale;
              String preset;
              if (isFem) {
                if (skinNum <= 2) {
                  preset = 'f_18';
                } else if (skinNum <= 4) {
                  preset = 'f_22';
                } else if (skinNum <= 6) {
                  preset = 'f_28';
                } else if (skinNum <= 8) {
                  preset = 'f_35';
                } else {
                  preset = 'f_42';
                }
              } else {
                if (skinNum <= 2) {
                  preset = 'm_19';
                } else if (skinNum <= 4) {
                  preset = 'm_25';
                } else if (skinNum <= 6) {
                  preset = 'm_32';
                } else if (skinNum <= 8) {
                  preset = 'm_38';
                } else {
                  preset = 'm_45';
                }
              }
              setState(
                () => _currentConfig = _currentConfig.copyWith(
                  skin: id,
                  presetId: preset,
                ),
              );
            },
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isSelected
                    ? themeColor.withValues(alpha: 0.08)
                    : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected ? themeColor : const Color(0xFFE5E7EB),
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.black12),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      name,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: isSelected
                            ? themeColor
                            : const Color(0xFF111827),
                      ),
                    ),
                  ),
                  if (isSelected)
                    Icon(Icons.check_circle_rounded, color: themeColor),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  /// Tab 2: 3D Outfits & Styles
  Widget _buildOutfitPanel(Color themeColor) {
    final gender = _currentConfig.isFemale
        ? DesiGender.female
        : DesiGender.male;
    final presets = gender == DesiGender.female
        ? DesiAvatarPack.femaleAvatars
        : DesiAvatarPack.maleAvatars;

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: presets.length,
      itemBuilder: (context, index) {
        final preset = presets[index];
        final isSelected = _currentConfig.presetId == preset.id;

        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: InkWell(
            onTap: () {
              setState(() {
                _currentConfig = _currentConfig.copyWith(presetId: preset.id);
              });
            },
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected
                    ? themeColor.withValues(alpha: 0.08)
                    : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected ? themeColor : const Color(0xFFE5E7EB),
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: const BoxDecoration(shape: BoxShape.circle),
                    child: ClipOval(
                      child: Image.asset(
                        preset.assetPath,
                        fit: BoxFit.cover,
                        alignment: Alignment.topCenter,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          preset.styleTitle,
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                            color: isSelected
                                ? themeColor
                                : const Color(0xFF111827),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          preset.description,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isSelected)
                    Icon(Icons.check_circle_rounded, color: themeColor),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  /// Tab 3: 3D Hairstyles
  Widget _buildHairPanel(Color themeColor) {
    final gender = _currentConfig.isFemale
        ? DesiGender.female
        : DesiGender.male;
    final presets = gender == DesiGender.female
        ? DesiAvatarPack.femaleAvatars
        : DesiAvatarPack.maleAvatars;

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: presets.length,
      itemBuilder: (context, index) {
        final preset = presets[index];
        final isSelected = _currentConfig.presetId == preset.id;

        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: InkWell(
            onTap: () {
              setState(() {
                _currentConfig = _currentConfig.copyWith(presetId: preset.id);
              });
            },
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected
                    ? themeColor.withValues(alpha: 0.08)
                    : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected ? themeColor : const Color(0xFFE5E7EB),
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: const BoxDecoration(shape: BoxShape.circle),
                    child: ClipOval(
                      child: Image.asset(
                        preset.assetPath,
                        fit: BoxFit.cover,
                        alignment: Alignment.topCenter,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          preset.name,
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                            color: isSelected
                                ? themeColor
                                : const Color(0xFF111827),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          preset.styleTitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isSelected)
                    Icon(Icons.check_circle_rounded, color: themeColor),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  /// Tab 4: Studio Backgrounds
  Widget _buildBackgroundPanel(Color themeColor) {
    final keys = FriendooAvatarConfig.backgroundGradients.keys.toList();

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.0,
      ),
      itemCount: keys.length,
      itemBuilder: (context, index) {
        final key = keys[index];
        final grad = FriendooAvatarConfig.backgroundGradients[key]!;
        final isSelected = _currentConfig.background == key;

        return InkWell(
          onTap: () => setState(
            () => _currentConfig = _currentConfig.copyWith(background: key),
          ),
          borderRadius: BorderRadius.circular(18),
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: grad,
              ),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: isSelected ? themeColor : Colors.black12,
                width: isSelected ? 3 : 1,
              ),
            ),
            child: isSelected
                ? Center(
                    child: Container(
                      padding: const EdgeInsets.all(5),
                      decoration: BoxDecoration(
                        color: themeColor,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.check_rounded,
                        color: Colors.white,
                        size: 14,
                      ),
                    ),
                  )
                : null,
          ),
        );
      },
    );
  }

  /// Tab 5: Accessories & Accents
  Widget _buildAccessoryPanel(Color themeColor) {
    final accessories = _currentConfig.isHost
        ? [
            {
              'id': 'none',
              'name': 'Standard Host Accents',
              'icon': Icons.auto_awesome_rounded,
            },
            {
              'id': 'bindi_ruby',
              'name': 'Ruby Bindi & Glow',
              'icon': Icons.flare_rounded,
            },
            {
              'id': 'bindi_crystal',
              'name': 'Crystal Bindi',
              'icon': Icons.diamond_outlined,
            },
            {
              'id': 'glasses_round',
              'name': 'Studio Glasses',
              'icon': Icons.visibility_outlined,
            },
          ]
        : [
            {
              'id': 'none',
              'name': 'Standard Casual',
              'icon': Icons.person_outline_rounded,
            },
            {
              'id': 'gold_chain',
              'name': 'Gold Chain & Accents',
              'icon': Icons.star_border_rounded,
            },
            {
              'id': 'glasses_round',
              'name': 'Studio Glasses',
              'icon': Icons.visibility_outlined,
            },
          ];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: accessories.length,
      itemBuilder: (context, index) {
        final acc = accessories[index];
        final id = acc['id'] as String;
        final name = acc['name'] as String;
        final icon = acc['icon'] as IconData;
        final isSelected = _currentConfig.accessory == id;

        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: InkWell(
            onTap: () => setState(
              () => _currentConfig = _currentConfig.copyWith(accessory: id),
            ),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isSelected
                    ? themeColor.withValues(alpha: 0.08)
                    : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected ? themeColor : const Color(0xFFE5E7EB),
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    icon,
                    color: isSelected ? themeColor : const Color(0xFF6B7280),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      name,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: isSelected
                            ? themeColor
                            : const Color(0xFF111827),
                      ),
                    ),
                  ),
                  if (isSelected)
                    Icon(Icons.check_circle_rounded, color: themeColor),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Backward compatible Avatar Picker Bottom Sheet.
class DesiAvatarPickerSheet {
  static void show(
    BuildContext context, {
    required String initialSeed,
    required DesiGender initialGender,
    int initialAge = 24,
    required ValueChanged<DesiAvatarPreset> onAvatarSelected,
  }) {
    final defaultPreset = DesiAvatarPack.findBySeedAndGender(
      initialSeed,
      initialGender,
      initialAge,
    );
    final initialConfig = FriendooAvatarConfig.fromSeed(
      seed: initialSeed,
      gender: initialGender.name,
      age: initialAge,
    );

    FriendooAvatarEditorPage.push(
      context,
      initialConfig: initialConfig,
      onSave: (config) {
        final preset = DesiAvatarPack.findById(
          config.presetId ?? defaultPreset.id,
        );
        onAvatarSelected(preset);
      },
    );
  }
}
