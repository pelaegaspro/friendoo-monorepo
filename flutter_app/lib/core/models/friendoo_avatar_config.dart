import 'dart:convert';
import 'package:flutter/material.dart';

/// The official structured configuration model for Friendoo Avatars.
///
/// Implements a lightweight, composable layered metadata schema:
/// Avatar Configuration -> Character Base -> Skin -> Face -> Eyes -> Eyebrows
/// -> Hair -> Hair Color -> Outfit -> Outfit Color -> Accessories -> Background -> Effects
class FriendooAvatarConfig {
  const FriendooAvatarConfig({
    this.gender = 'female',
    this.role = 'user',
    this.skin = '02',
    this.face = '01',
    this.eyes = '01',
    this.eyeColor = '#3D2314',
    this.eyebrows = '01',
    this.hair = '01',
    this.hairColor = '#1A1A1A',
    this.outfit = '01',
    this.outfitColor = '#6366F1',
    this.accessory = 'none',
    this.background = 'grad_lavender',
    this.effect = 'none',
    this.vibe = 'chill',
    this.presetId,
  });

  final String gender; // 'male' | 'female'
  final String role; // 'user' | 'host'
  final String skin; // '01' .. '10'
  final String face; // '01' .. '06'
  final String eyes; // '01' .. '06'
  final String eyeColor; // Hex string e.g. '#3D2314'
  final String eyebrows; // '01' .. '04'
  final String hair; // '01' .. '12'
  final String hairColor; // Hex string e.g. '#1A1A1A'
  final String outfit; // '01' .. '10'
  final String outfitColor; // Hex string e.g. '#6366F1'
  final String accessory; // 'none', 'glasses_round', 'headphones', 'gold_chain', etc.
  final String background; // 'grad_lavender', 'grad_rose', 'grad_mint', etc.
  final String effect; // 'none', 'sparkles', 'star_glow', 'neon_ring', 'fire', 'hearts'
  final String vibe; // 'chill', 'fun', 'gaming', 'music', 'social', 'night'
  final String? presetId; // Optional preset asset ID (e.g. 'f_18', 'm_25')

  bool get isFemale => gender.toLowerCase() == 'female';
  bool get isMale => !isFemale;
  bool get isHost => role.toLowerCase() == 'host';

  // ---------------------------------------------------------------------------
  // Curated Color Palettes
  // ---------------------------------------------------------------------------

  /// 10 Curated Melanin Skin Tones (Fair Ivory to Midnight Cocoa)
  static const List<Map<String, dynamic>> skinTones = [
    {'id': '01', 'name': 'Fair Ivory', 'color': Color(0xFFFFF0E5), 'shadow': Color(0xFFE8D0C0)},
    {'id': '02', 'name': 'Fair Wheatish', 'color': Color(0xFFFBD7B8), 'shadow': Color(0xFFE5B592)},
    {'id': '03', 'name': 'Golden Honey', 'color': Color(0xFFF1C099), 'shadow': Color(0xFFD69D75)},
    {'id': '04', 'name': 'Warm Almond', 'color': Color(0xFFEBB48A), 'shadow': Color(0xFFCC9369)},
    {'id': '05', 'name': 'Warm Dusky', 'color': Color(0xFFE4A478), 'shadow': Color(0xFFC78358)},
    {'id': '06', 'name': 'Rich Chestnut', 'color': Color(0xFFD99363), 'shadow': Color(0xFFBA7243)},
    {'id': '07', 'name': 'Deep Bronze', 'color': Color(0xFFD38B5E), 'shadow': Color(0xFFB46C41)},
    {'id': '08', 'name': 'Espresso Gold', 'color': Color(0xFFC47B4E), 'shadow': Color(0xFFA55E32)},
    {'id': '09', 'name': 'Rich Cocoa', 'color': Color(0xFFBF754A), 'shadow': Color(0xFF9E542D)},
    {'id': '10', 'name': 'Midnight Cocoa', 'color': Color(0xFFA65F38), 'shadow': Color(0xFF82411C)},
  ];

  /// 10 Curated Hair Colors
  static const List<Map<String, dynamic>> hairColors = [
    {'id': 'black', 'name': 'Jet Black', 'color': Color(0xFF141218), 'hex': '#141218'},
    {'id': 'dark_brown', 'name': 'Dark Brown', 'color': Color(0xFF382214), 'hex': '#382214'},
    {'id': 'chestnut', 'name': 'Chestnut Brown', 'color': Color(0xFF5C3317), 'hex': '#5C3317'},
    {'id': 'blonde', 'name': 'Golden Blonde', 'color': Color(0xFFD4AF37), 'hex': '#D4AF37'},
    {'id': 'auburn', 'name': 'Auburn Red', 'color': Color(0xFF8B2500), 'hex': '#8B2500'},
    {'id': 'platinum', 'name': 'Platinum White', 'color': Color(0xFFE2E8F0), 'hex': '#E2E8F0'},
    {'id': 'pastel_pink', 'name': 'Pastel Pink', 'color': Color(0xFFF472B6), 'hex': '#F472B6'},
    {'id': 'electric_purple', 'name': 'Electric Purple', 'color': Color(0xFF8B5CF6), 'hex': '#8B5CF6'},
    {'id': 'ocean_blue', 'name': 'Ocean Blue', 'color': Color(0xFF0284C7), 'hex': '#0284C7'},
    {'id': 'neon_green', 'name': 'Neon Green', 'color': Color(0xFF10B981), 'hex': '#10B981'},
  ];

  /// Curated Outfit Colors
  static const List<Map<String, dynamic>> outfitColors = [
    {'name': 'Indigo Blue', 'color': Color(0xFF6366F1), 'hex': '#6366F1'},
    {'name': 'Host Pink', 'color': Color(0xFFFF2A85), 'hex': '#FF2A85'},
    {'name': 'Teal Cyan', 'color': Color(0xFF0D9488), 'hex': '#0D9488'},
    {'name': 'Sunset Amber', 'color': Color(0xFFF59E0B), 'hex': '#F59E0B'},
    {'name': 'Crimson Maroon', 'color': Color(0xFFBE123C), 'hex': '#BE123C'},
    {'name': 'Emerald Green', 'color': Color(0xFF059669), 'hex': '#059669'},
    {'name': 'Slate Charcoal', 'color': Color(0xFF1E293B), 'hex': '#1E293B'},
    {'name': 'Royal Gold', 'color': Color(0xFFD97706), 'hex': '#D97706'},
  ];

  /// Predefined Friendoo Background Gradients
  static const Map<String, List<Color>> backgroundGradients = {
    'grad_lavender': [Color(0xFFEDE9FE), Color(0xFFDDD6FE)],
    'grad_rose': [Color(0xFFFFE4EC), Color(0xFFFBCFE8)],
    'grad_mint': [Color(0xFFDCFCE7), Color(0xFFBBF7D0)],
    'grad_sky': [Color(0xFFE0F2FE), Color(0xFFBAE6FD)],
    'grad_honey': [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
    'grad_indigo': [Color(0xFFEEF2FF), Color(0xFFC7D2FE)],
    'grad_midnight': [Color(0xFF0F172A), Color(0xFF1E1B4B)],
    'grad_sunset': [Color(0xFFFFF1F2), Color(0xFFFFE4E6)],
    'grad_royal': [Color(0xFFFEF9C3), Color(0xFFFDE047)],
    'solid_white': [Color(0xFFFFFFFF), Color(0xFFF9FAFB)],
    'solid_dark': [Color(0xFF18181B), Color(0xFF18181B)],
  };

  // ---------------------------------------------------------------------------
  // Defaults & Factory Constructors
  // ---------------------------------------------------------------------------

  static FriendooAvatarConfig defaultUser({String gender = 'male', int age = 24}) {
    final isFem = gender.toLowerCase() == 'female';
    return FriendooAvatarConfig(
      gender: isFem ? 'female' : 'male',
      role: 'user',
      skin: '03',
      face: '01',
      eyes: '01',
      hair: isFem ? '03' : '01',
      hairColor: '#141218',
      outfit: isFem ? '02' : '01',
      outfitColor: isFem ? '#FF2A85' : '#6366F1',
      accessory: 'none',
      background: isFem ? 'grad_rose' : 'grad_indigo',
      vibe: 'chill',
      presetId: isFem ? 'host_01' : 'user_01',
    );
  }

  static FriendooAvatarConfig defaultHost({int age = 22}) {
    return const FriendooAvatarConfig(
      gender: 'female',
      role: 'host',
      skin: '02',
      face: '01',
      eyes: '02',
      hair: '02',
      hairColor: '#141218',
      outfit: '07',
      outfitColor: '#FF2A85',
      accessory: 'bindi_ruby',
      background: 'grad_rose',
      effect: 'star_glow',
      vibe: 'social',
      presetId: 'host_01',
    );
  }

  /// Deterministic config generator from string seed (user name, id, or phone)
  static FriendooAvatarConfig fromSeed({
    required String seed,
    String gender = 'female',
    String role = 'user',
    int age = 24,
  }) {
    var hash = 2166136261;
    for (final codeUnit in seed.codeUnits) {
      hash ^= codeUnit;
      hash = (hash * 16777619) & 0x7fffffff;
    }

    final isFem = gender.toLowerCase() == 'female';
    final isHst = role.toLowerCase() == 'host';

    final skinIndex = (hash % skinTones.length) + 1;
    final skinId = skinIndex.toString().padLeft(2, '0');

    final bgKeys = backgroundGradients.keys.toList();
    final bgKey = bgKeys[hash % bgKeys.length];

    final hairColorKey = hairColors[(hash ~/ 3) % hairColors.length]['hex'] as String;
    final outfitColorKey = outfitColors[(hash ~/ 5) % outfitColors.length]['hex'] as String;

    final hairId = ((hash ~/ 7) % 12 + 1).toString().padLeft(2, '0');
    final outfitId = ((hash ~/ 11) % 10 + 1).toString().padLeft(2, '0');

    const hostPresets = [
      'host_01', 'host_02', 'host_03', 'host_04', 'host_05',
      'host_06', 'host_07', 'host_08', 'host_09', 'host_10',
    ];
    const userPresets = [
      'user_01', 'user_02', 'user_03', 'user_04', 'user_05',
      'user_06', 'user_07', 'user_08', 'user_09', 'user_10',
    ];
    final presetKey = isHst || isFem
        ? hostPresets[hash % hostPresets.length]
        : userPresets[hash % userPresets.length];

    return FriendooAvatarConfig(
      gender: isFem ? 'female' : 'male',
      role: isHst ? 'host' : 'user',
      skin: skinId,
      face: '01',
      eyes: '01',
      hair: hairId,
      hairColor: hairColorKey,
      outfit: outfitId,
      outfitColor: outfitColorKey,
      accessory: isHst ? 'bindi_ruby' : 'none',
      background: bgKey,
      effect: isHst ? 'star_glow' : 'none',
      vibe: 'chill',
      presetId: presetKey,
    );
  }

  // ---------------------------------------------------------------------------
  // Serialization & Migration
  // ---------------------------------------------------------------------------

  Map<String, dynamic> toMap() {
    return {
      'gender': gender,
      'role': role,
      'skin': skin,
      'face': face,
      'eyes': eyes,
      'eye_color': eyeColor,
      'eyebrows': eyebrows,
      'hair': hair,
      'hair_color': hairColor,
      'outfit': outfit,
      'outfit_color': outfitColor,
      'accessory': accessory,
      'background': background,
      'effect': effect,
      'vibe': vibe,
      if (presetId != null) 'preset_id': presetId,
    };
  }

  String toJson() => jsonEncode(toMap());

  factory FriendooAvatarConfig.fromMap(Map<String, dynamic>? map) {
    if (map == null || map.isEmpty) return defaultUser();

    final gen = map['gender']?.toString() ?? 'female';
    final isFem = gen.toLowerCase() == 'female';

    return FriendooAvatarConfig(
      gender: gen,
      role: map['role']?.toString() ?? 'user',
      skin: map['skin']?.toString() ?? '02',
      face: map['face']?.toString() ?? '01',
      eyes: map['eyes']?.toString() ?? '01',
      eyeColor: map['eye_color']?.toString() ?? '#3D2314',
      eyebrows: map['eyebrows']?.toString() ?? '01',
      hair: map['hair']?.toString() ?? '01',
      hairColor: map['hair_color']?.toString() ?? '#1A1A1A',
      outfit: map['outfit']?.toString() ?? '01',
      outfitColor: map['outfit_color']?.toString() ?? '#6366F1',
      accessory: map['accessory']?.toString() ?? 'none',
      background: map['background']?.toString() ?? 'grad_lavender',
      effect: map['effect']?.toString() ?? 'none',
      vibe: map['vibe']?.toString() ?? 'chill',
      presetId: map['preset_id']?.toString() ?? (map['role']?.toString() == 'host' || isFem ? 'host_01' : 'user_01'),
    );
  }

  /// Parse from raw string (supports JSON string or legacy preset IDs like 'f_18', 'm_25')
  factory FriendooAvatarConfig.fromRawString(String? raw, {String gender = 'female', String role = 'user'}) {
    if (raw == null || raw.isEmpty) {
      return role == 'host' ? defaultHost() : defaultUser(gender: gender);
    }

    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        final decoded = jsonDecode(raw) as Map<String, dynamic>;
        return FriendooAvatarConfig.fromMap(decoded);
      } catch (_) {}
    }

    // Legacy preset ID mapping (e.g. 'f_18', 'm_25', 'avatar_f_22.jpg')
    final isMale = raw.startsWith('m_') || raw.startsWith('user_') || raw.contains('male') || gender == 'male';
    String cleanPreset = raw.replaceAll('assets/avatars/', '').replaceAll('.jpg', '').replaceAll('avatar_', '');
    if (cleanPreset == 'f_18') cleanPreset = 'host_01';
    if (cleanPreset == 'f_22') cleanPreset = 'host_02';
    if (cleanPreset == 'f_28') cleanPreset = 'host_03';
    if (cleanPreset == 'f_35') cleanPreset = 'host_04';
    if (cleanPreset == 'f_42') cleanPreset = 'host_05';
    if (cleanPreset == 'm_19') cleanPreset = 'user_01';
    if (cleanPreset == 'm_25') cleanPreset = 'user_02';
    if (cleanPreset == 'm_32') cleanPreset = 'user_03';
    if (cleanPreset == 'm_38') cleanPreset = 'user_04';
    if (cleanPreset == 'm_45') cleanPreset = 'user_05';

    return FriendooAvatarConfig(
      gender: isMale ? 'male' : 'female',
      role: role,
      skin: isMale ? '03' : '02',
      presetId: cleanPreset,
      background: isMale ? 'grad_indigo' : 'grad_rose',
    );
  }

  FriendooAvatarConfig copyWith({
    String? gender,
    String? role,
    String? skin,
    String? face,
    String? eyes,
    String? eyeColor,
    String? eyebrows,
    String? hair,
    String? hairColor,
    String? outfit,
    String? outfitColor,
    String? accessory,
    String? background,
    String? effect,
    String? vibe,
    String? presetId,
  }) {
    return FriendooAvatarConfig(
      gender: gender ?? this.gender,
      role: role ?? this.role,
      skin: skin ?? this.skin,
      face: face ?? this.face,
      eyes: eyes ?? this.eyes,
      eyeColor: eyeColor ?? this.eyeColor,
      eyebrows: eyebrows ?? this.eyebrows,
      hair: hair ?? this.hair,
      hairColor: hairColor ?? this.hairColor,
      outfit: outfit ?? this.outfit,
      outfitColor: outfitColor ?? this.outfitColor,
      accessory: accessory ?? this.accessory,
      background: background ?? this.background,
      effect: effect ?? this.effect,
      vibe: vibe ?? this.vibe,
      presetId: presetId ?? this.presetId,
    );
  }

  // ---------------------------------------------------------------------------
  // Helper getters for colors & assets
  // ---------------------------------------------------------------------------

  Color get parsedSkinColor {
    final match = skinTones.firstWhere(
      (s) => s['id'] == skin,
      orElse: () => skinTones[1],
    );
    return match['color'] as Color;
  }

  Color get parsedSkinShadowColor {
    final match = skinTones.firstWhere(
      (s) => s['id'] == skin,
      orElse: () => skinTones[1],
    );
    return match['shadow'] as Color;
  }

  Color get parsedHairColor => _parseHexColor(hairColor, const Color(0xFF141218));
  Color get parsedOutfitColor => _parseHexColor(outfitColor, isFemale ? const Color(0xFFFF2A85) : const Color(0xFF6366F1));
  Color get parsedEyeColor => _parseHexColor(eyeColor, const Color(0xFF3D2314));

  List<Color> get parsedBackgroundGradient {
    return backgroundGradients[background] ??
        (isFemale
            ? const [Color(0xFFFFE4EC), Color(0xFFFBCFE8)]
            : const [Color(0xFFEEF2FF), Color(0xFFC7D2FE)]);
  }

  static Color _parseHexColor(String hex, Color fallback) {
    try {
      final clean = hex.replaceAll('#', '').trim();
      if (clean.length == 6) {
        return Color(int.parse('FF$clean', radix: 16));
      } else if (clean.length == 8) {
        return Color(int.parse(clean, radix: 16));
      }
    } catch (_) {}
    return fallback;
  }
}
