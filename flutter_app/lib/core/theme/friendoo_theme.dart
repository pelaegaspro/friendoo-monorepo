import 'package:flutter/material.dart';

@immutable
class FriendooDesignTokens extends ThemeExtension<FriendooDesignTokens> {
  const FriendooDesignTokens({
    required this.heroGradient,
    required this.sectionGradient,
    required this.profileGradients,
    required this.goldGradient,
    required this.aquaGradient,
    required this.pinkGradient,
    required this.tintedCardColor,
    required this.softShadow,
    required this.glowShadow,
  });

  final LinearGradient heroGradient;
  final LinearGradient sectionGradient;
  final List<LinearGradient> profileGradients;
  final LinearGradient goldGradient;
  final LinearGradient aquaGradient;
  final LinearGradient pinkGradient;
  final Color tintedCardColor;
  final BoxShadow softShadow;
  final BoxShadow glowShadow;

  @override
  FriendooDesignTokens copyWith({
    LinearGradient? heroGradient,
    LinearGradient? sectionGradient,
    List<LinearGradient>? profileGradients,
    LinearGradient? goldGradient,
    LinearGradient? aquaGradient,
    LinearGradient? pinkGradient,
    Color? tintedCardColor,
    BoxShadow? softShadow,
    BoxShadow? glowShadow,
  }) {
    return FriendooDesignTokens(
      heroGradient: heroGradient ?? this.heroGradient,
      sectionGradient: sectionGradient ?? this.sectionGradient,
      profileGradients: profileGradients ?? this.profileGradients,
      goldGradient: goldGradient ?? this.goldGradient,
      aquaGradient: aquaGradient ?? this.aquaGradient,
      pinkGradient: pinkGradient ?? this.pinkGradient,
      tintedCardColor: tintedCardColor ?? this.tintedCardColor,
      softShadow: softShadow ?? this.softShadow,
      glowShadow: glowShadow ?? this.glowShadow,
    );
  }

  @override
  FriendooDesignTokens lerp(
    covariant ThemeExtension<FriendooDesignTokens>? other,
    double t,
  ) {
    if (other is! FriendooDesignTokens) return this;
    return FriendooDesignTokens(
      heroGradient:
          LinearGradient.lerp(heroGradient, other.heroGradient, t) ??
          heroGradient,
      sectionGradient:
          LinearGradient.lerp(sectionGradient, other.sectionGradient, t) ??
          sectionGradient,
      profileGradients: t < 0.5 ? profileGradients : other.profileGradients,
      goldGradient:
          LinearGradient.lerp(goldGradient, other.goldGradient, t) ??
          goldGradient,
      aquaGradient:
          LinearGradient.lerp(aquaGradient, other.aquaGradient, t) ??
          aquaGradient,
      pinkGradient:
          LinearGradient.lerp(pinkGradient, other.pinkGradient, t) ??
          pinkGradient,
      tintedCardColor:
          Color.lerp(tintedCardColor, other.tintedCardColor, t) ??
          tintedCardColor,
      softShadow: BoxShadow.lerp(softShadow, other.softShadow, t) ?? softShadow,
      glowShadow: BoxShadow.lerp(glowShadow, other.glowShadow, t) ?? glowShadow,
    );
  }
}

abstract final class FriendooTheme {
  static ThemeData light() {
    // UI Maximalism: High-Energy Color System
    const electricViolet = Color(0xFF6366F1);
    const vividOrchid = Color(0xFF8B5CF6);
    const cyberAqua = Color(0xFF00D2E0);
    const hotPink = Color(0xFFFF2A85);
    const radiantGold = Color(0xFFFFB703);
    const deepObsidian = Color(0xFF0E1020);
    const canvas = Color(0xFFF7F7FB);
    const card = Color(0xFFFFFFFF);
    const mutedInk = Color(0xFF6B7280);

    final colorScheme = ColorScheme.fromSeed(
      seedColor: electricViolet,
      brightness: Brightness.light,
      primary: deepObsidian,
      onPrimary: card,
      primaryContainer: const Color(0xFFEDE9FE),
      onPrimaryContainer: const Color(0xFF3730A3),
      secondary: cyberAqua,
      onSecondary: card,
      secondaryContainer: const Color(0xFFE0F9FD),
      onSecondaryContainer: const Color(0xFF0E7490),
      tertiary: radiantGold,
      onTertiary: deepObsidian,
      tertiaryContainer: const Color(0xFFFEF3C7),
      onTertiaryContainer: const Color(0xFF92400E),
      surface: card,
      onSurface: deepObsidian,
      surfaceContainerHighest: const Color(0xFFF1F1F7),
      onSurfaceVariant: mutedInk,
      outline: const Color(0xFFE2E4ED),
      error: const Color(0xFFEF4444),
      onError: card,
    );

    final tokens = FriendooDesignTokens(
      heroGradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Color(0xFF161938),
          Color(0xFF6366F1),
          Color(0xFFFF2A85),
          Color(0xFF00D2E0),
        ],
        stops: [0.0, 0.45, 0.8, 1.0],
      ),
      sectionGradient: const LinearGradient(
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
        colors: [
          Color(0xFFEDE9FE),
          Color(0xFFFFE4EC),
          Color(0xFFE0F9FD),
        ],
      ),
      goldGradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Color(0xFFFFB703),
          Color(0xFFFFD166),
          Color(0xFFFFE89E),
          Color(0xFFFB8500),
        ],
      ),
      aquaGradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Color(0xFF00D2E0),
          Color(0xFF06D6A0),
          Color(0xFF00F5D4),
        ],
      ),
      pinkGradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Color(0xFFFF2A85),
          Color(0xFFFF6584),
          Color(0xFFC72FF8),
        ],
      ),
      profileGradients: const [
        LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF6366F1), Color(0xFFA855F7), Color(0xFFFF2A85)],
        ),
        LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF00D2E0), Color(0xFF06D6A0), Color(0xFF38BDF8)],
        ),
        LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFF2A85), Color(0xFFFF758C), Color(0xFFFFB703)],
        ),
        LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFFB703), Color(0xFFFF9F1C), Color(0xFFFF5400)],
        ),
      ],
      tintedCardColor: const Color(0xFFF3F0FF),
      softShadow: const BoxShadow(
        color: Color(0x18161938),
        blurRadius: 24,
        offset: Offset(0, 8),
      ),
      glowShadow: const BoxShadow(
        color: Color(0x356366F1),
        blurRadius: 28,
        offset: Offset(0, 10),
      ),
    );

    final textTheme = TextTheme(
      displaySmall: const TextStyle(
        color: deepObsidian,
        fontSize: 32,
        height: 1.1,
        fontWeight: FontWeight.w900,
        letterSpacing: -0.8,
      ),
      headlineSmall: const TextStyle(
        color: deepObsidian,
        fontSize: 24,
        height: 1.2,
        fontWeight: FontWeight.w900,
        letterSpacing: -0.4,
      ),
      titleLarge: const TextStyle(
        color: deepObsidian,
        fontSize: 19,
        height: 1.25,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.2,
      ),
      titleMedium: const TextStyle(
        color: deepObsidian,
        fontSize: 16,
        height: 1.25,
        fontWeight: FontWeight.w800,
      ),
      bodyLarge: const TextStyle(
        color: deepObsidian,
        fontSize: 16,
        height: 1.45,
        fontWeight: FontWeight.w600,
      ),
      bodyMedium: const TextStyle(
        color: mutedInk,
        fontSize: 14,
        height: 1.4,
        fontWeight: FontWeight.w500,
      ),
      labelLarge: const TextStyle(
        color: deepObsidian,
        fontSize: 14,
        height: 1.2,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.2,
      ),
      labelMedium: const TextStyle(
        color: mutedInk,
        fontSize: 12,
        height: 1.2,
        fontWeight: FontWeight.w700,
      ),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: canvas,
      textTheme: textTheme,
      extensions: [tokens],
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: deepObsidian,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: Color(0xFFECEEF5), width: 1.2),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 74,
        backgroundColor: card,
        indicatorColor: const Color(0xFFEDE9FE),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => textTheme.labelMedium?.copyWith(
            fontWeight: FontWeight.w800,
            color: states.contains(WidgetState.selected)
                ? electricViolet
                : mutedInk,
          ),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            color: states.contains(WidgetState.selected)
                ? electricViolet
                : mutedInk,
            size: 24,
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: colorScheme.surface,
        selectedColor: electricViolet,
        secondarySelectedColor: electricViolet,
        side: const BorderSide(color: Color(0xFFE2E4ED), width: 1.2),
        labelStyle: textTheme.labelMedium!,
        secondaryLabelStyle: textTheme.labelMedium!.copyWith(
          color: Colors.white,
          fontWeight: FontWeight.w800,
        ),
        shape: const StadiumBorder(),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: card,
        hintStyle: textTheme.bodyMedium,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: Color(0xFFE2E4ED), width: 1.2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: Color(0xFFE2E4ED), width: 1.2),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: electricViolet, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 18,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: deepObsidian,
          foregroundColor: Colors.white,
          textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w900),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
          shape: const StadiumBorder(),
          elevation: 4,
          shadowColor: const Color(0x33161938),
        ),
      ),
    );
  }
}

