import 'package:flutter/material.dart';

@immutable
class FriendooDesignTokens extends ThemeExtension<FriendooDesignTokens> {
  const FriendooDesignTokens({
    required this.heroGradient,
    required this.sectionGradient,
    required this.profileGradients,
    required this.tintedCardColor,
    required this.softShadow,
  });

  final LinearGradient heroGradient;
  final LinearGradient sectionGradient;
  final List<LinearGradient> profileGradients;
  final Color tintedCardColor;
  final BoxShadow softShadow;

  @override
  FriendooDesignTokens copyWith({
    LinearGradient? heroGradient,
    LinearGradient? sectionGradient,
    List<LinearGradient>? profileGradients,
    Color? tintedCardColor,
    BoxShadow? softShadow,
  }) {
    return FriendooDesignTokens(
      heroGradient: heroGradient ?? this.heroGradient,
      sectionGradient: sectionGradient ?? this.sectionGradient,
      profileGradients: profileGradients ?? this.profileGradients,
      tintedCardColor: tintedCardColor ?? this.tintedCardColor,
      softShadow: softShadow ?? this.softShadow,
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
      tintedCardColor:
          Color.lerp(tintedCardColor, other.tintedCardColor, t) ??
          tintedCardColor,
      softShadow: BoxShadow.lerp(softShadow, other.softShadow, t) ?? softShadow,
    );
  }
}

abstract final class FriendooTheme {
  static ThemeData light() {
    const orchid = Color(0xFF4960F9);
    const indigo = Color(0xFF17171F);
    const aqua = Color(0xFF46D4E8);
    const mango = Color(0xFFFFC857);
    const rose = Color(0xFFC72FF8);
    const ink = Color(0xFF17171F);
    const canvas = Color(0xFFF6F6F3);
    const card = Color(0xFFFFFFFF);
    const mutedInk = Color(0xFF777780);

    final colorScheme = ColorScheme.fromSeed(
      seedColor: orchid,
      brightness: Brightness.light,
      primary: indigo,
      onPrimary: card,
      primaryContainer: const Color(0xFFE9E9E6),
      onPrimaryContainer: ink,
      secondary: aqua,
      onSecondary: card,
      secondaryContainer: const Color(0xFFEAFBFD),
      onSecondaryContainer: const Color(0xFF0B7276),
      tertiary: mango,
      onTertiary: ink,
      tertiaryContainer: const Color(0xFFFFE9BF),
      onTertiaryContainer: const Color(0xFF5B3A00),
      surface: card,
      onSurface: ink,
      surfaceContainerHighest: const Color(0xFFECECE8),
      onSurfaceVariant: mutedInk,
      outline: const Color(0xFFD2D2CD),
      error: const Color(0xFFB3261E),
      onError: card,
    );

    final tokens = FriendooDesignTokens(
      heroGradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [indigo, orchid, rose],
      ),
      sectionGradient: const LinearGradient(
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
        colors: [Color(0xFFEDE8FF), Color(0xFFDDF9F5)],
      ),
      profileGradients: const [
        LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [orchid, Color(0xFFAA75FF)],
        ),
        LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [aqua, Color(0xFF63D6CF)],
        ),
        LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [rose, Color(0xFFFFA0B3)],
        ),
        LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [mango, Color(0xFFFFD47A)],
        ),
      ],
      tintedCardColor: const Color(0xFFEFF2FF),
      softShadow: const BoxShadow(
        color: Color(0x1A231A54),
        blurRadius: 24,
        offset: Offset(0, 10),
      ),
    );

    final textTheme = TextTheme(
      displaySmall: const TextStyle(
        color: ink,
        fontSize: 32,
        height: 1.08,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.7,
      ),
      headlineSmall: const TextStyle(
        color: ink,
        fontSize: 22,
        height: 1.2,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.35,
      ),
      titleLarge: const TextStyle(
        color: ink,
        fontSize: 18,
        height: 1.25,
        fontWeight: FontWeight.w800,
      ),
      titleMedium: const TextStyle(
        color: ink,
        fontSize: 16,
        height: 1.25,
        fontWeight: FontWeight.w700,
      ),
      bodyLarge: const TextStyle(
        color: ink,
        fontSize: 16,
        height: 1.45,
        fontWeight: FontWeight.w500,
      ),
      bodyMedium: const TextStyle(
        color: mutedInk,
        fontSize: 14,
        height: 1.4,
        fontWeight: FontWeight.w500,
      ),
      labelLarge: const TextStyle(
        color: ink,
        fontSize: 14,
        height: 1.2,
        fontWeight: FontWeight.w800,
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
        foregroundColor: ink,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 72,
        backgroundColor: card,
        indicatorColor: const Color(0xFFE9E9E6),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => textTheme.labelMedium?.copyWith(
            color: states.contains(WidgetState.selected)
                ? colorScheme.primary
                : colorScheme.onSurfaceVariant,
          ),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            color: states.contains(WidgetState.selected)
                ? colorScheme.primary
                : colorScheme.onSurfaceVariant,
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: colorScheme.surface,
        selectedColor: colorScheme.primary,
        secondarySelectedColor: colorScheme.primary,
        side: BorderSide(color: colorScheme.outline.withValues(alpha: 0.55)),
        labelStyle: textTheme.labelMedium!,
        secondaryLabelStyle: textTheme.labelMedium!.copyWith(
          color: colorScheme.onPrimary,
        ),
        shape: const StadiumBorder(),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: card,
        hintStyle: textTheme.bodyMedium,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: colorScheme.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 16,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          textStyle: textTheme.labelLarge,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          shape: const StadiumBorder(),
        ),
      ),
    );
  }
}
