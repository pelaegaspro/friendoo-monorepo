import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const Color primary = Color(0xFF007AFF); // A vibrant blue, common in professional apps
  static const Color primaryDark = Color(0xFF0056B3);
  static const Color accent = Color(0xFF5AC8FA); // A lighter blue for accents
  static const Color background = Color(0xFFF2F2F7); // Light grey background
  static const Color card = Color(0xFFFFFFFF); // White cards
  static const Color textPrimary = Color(0xFF1C1C1E); // Dark text for readability
  static const Color textSecondary = Color(0xFF8E8E93); // Lighter text for secondary info
  static const Color success = Color(0xFF34C759); // Green for success
  static const Color error = Color(0xFFFF3B30); // Red for errors
  static const Color warning = Color(0xFFFFCC00); // Yellow for warnings
  static const Color divider = Color(0xFFE5E5EA); // Light divider color
  static const Color onlineDot = Color(0xFF34C759);

  // Gradients can be defined if needed for specific components, but for a clean MNC look, solid colors are often preferred.
  // static const LinearGradient primaryGradient = LinearGradient(
  //   colors: [primary, primaryDark],
  //   begin: Alignment.topLeft,
  //   end: Alignment.bottomRight,
  // );
}

class AppTheme {
  static ThemeData get lightTheme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        scaffoldBackgroundColor: AppColors.background,
        primaryColor: AppColors.primary,
        colorScheme: const ColorScheme.light(
          primary: AppColors.primary,
          secondary: AppColors.accent,
          surface: AppColors.card,
          background: AppColors.background,
          error: AppColors.error,
          onPrimary: Colors.white,
          onSecondary: Colors.white,
          onSurface: AppColors.textPrimary,
          onBackground: AppColors.textPrimary,
          onError: Colors.white,
        ),
        textTheme: GoogleFonts.interTextTheme(ThemeData.light().textTheme).apply(
          bodyColor: AppColors.textPrimary,
          displayColor: AppColors.textPrimary,
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: AppColors.card,
          elevation: 0.5, // Subtle shadow for depth
          centerTitle: true,
          titleTextStyle: GoogleFonts.inter(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
          iconTheme: const IconThemeData(color: AppColors.primary),
        ),
        cardTheme: CardTheme(
          color: AppColors.card,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: EdgeInsets.zero, // Default to no margin, components will add as needed
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16),
            elevation: 0, // Flat design
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.primary,
            side: const BorderSide(color: AppColors.primary, width: 1),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: AppColors.primary,
            textStyle: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 16),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.background, // Input fields background
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide.none, // No border by default
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppColors.primary, width: 2), // Highlight on focus
          ),
          hintStyle: const TextStyle(color: AppColors.textSecondary),
          labelStyle: const TextStyle(color: AppColors.textSecondary),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
        chipTheme: ChipThemeData(
          backgroundColor: AppColors.background,
          selectedColor: AppColors.primary,
          labelStyle: GoogleFonts.inter(color: AppColors.textPrimary, fontSize: 13),
          side: BorderSide.none,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
        dividerTheme: const DividerThemeData(color: AppColors.divider, thickness: 1),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: AppColors.card,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textSecondary,
          elevation: 8, // Subtle shadow for bottom nav
          type: BottomNavigationBarType.fixed,
          selectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
          unselectedLabelStyle: TextStyle(fontSize: 12),
        ),
        snackBarTheme: SnackBarThemeData(
          backgroundColor: AppColors.textPrimary, // Darker background for snackbar
          contentTextStyle: GoogleFonts.inter(color: Colors.white),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          behavior: SnackBarBehavior.floating,
        ),
      );

  // For a professional MNC app, often a single, well-defined theme (light or dark) is preferred.
  // If a dark theme is required, it would be a separate, equally detailed definition.
  static ThemeData get darkTheme => lightTheme; // Placeholder, implement a proper dark theme if needed.
}
