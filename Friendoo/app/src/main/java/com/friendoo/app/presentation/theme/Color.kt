package com.friendoo.app.presentation.theme

import androidx.compose.ui.graphics.Color

// ==========================================
// FRIENDOO PREMIUM DESIGN SYSTEM (2026)
// ==========================================

// --- LIGHT THEME NEUTRALS ---
val LightBackground = Color(0xFFFFFFFF)
val LightSurface = Color(0xFFF7F7F8)
val LightCard = Color(0xFFFAFAFA)
val LightTextPrimary = Color(0xFF121212)
val LightTextSecondary = Color(0xFF777777)
val LightDivider = Color(0xFFE8E8E8)

// --- DARK THEME NEUTRALS ---
val DarkBackground = Color(0xFF0E0F11)
val DarkSurface = Color(0xFF18191C)
val DarkCard = Color(0xFF1F2024)
val DarkTextPrimary = Color(0xFFFFFFFF)
val DarkTextSecondary = Color(0xFFA7A7A7)
val DarkDivider = Color(0xFF2A2C31)

// --- CALM PREMIUM ACCENT COLORS ---
val RosePink = Color(0xFFFF5C8A)
val WarmCoral = Color(0xFFFF8B5E)
val SoftPurple = Color(0xFF7C6BFF)

// --- GRADIENT BLENDS ---
val GradientStart = SoftPurple
val GradientMid = RosePink
val GradientEnd = WarmCoral

val GradientStartDark = SoftPurple
val GradientEndDark = WarmCoral

// ==========================================
// BACKWARD COMPATIBILITY & LEGACY ALIASES
// ==========================================

// Primary Accent
val Violet = SoftPurple
val VioletDark = Color(0xFF6251E6)
val VioletLight = Color(0xFF9889FF)
val VioletMuted = Color(0xFF8A7CFF)

// Secondary Accent
val Mint = WarmCoral
val MintDark = Color(0xFFE67345)
val MintLight = Color(0xFFFF9E78)

// Tertiary Accent
val Cyan = RosePink
val CyanDark = Color(0xFFE64371)

// Legacy Neutrals (Mapped to Light Specs)
val LavenderWhite = LightBackground
val PureWhite = Color.White
val SurfaceLight = LightSurface
val BorderLight = LightDivider

// Legacy Neutrals (Mapped to Dark Specs)
val MidnightPlum = DarkBackground
val DeepIndigo = DarkSurface
val SurfaceDark = DarkCard
val BorderDark = DarkDivider

// Legacy Text System
val DeepPlum = LightTextPrimary
val MutedPurple = LightTextSecondary
val HintPurple = Color(0xFF999999)
val NearWhite = DarkTextPrimary
val LavenderGray = DarkTextSecondary
val DimLavender = Color(0xFF777777)

// Semantic Colors (Clean and Soft)
val SuccessGreen = Color(0xFF2EC4B6)
val WarningAmber = Color(0xFFFFB830)
val ErrorRed = Color(0xFFFF4D6A)
val InfoBlue = Color(0xFF4DA6FF)

// Badge Colors
val Gold = Color(0xFFFFD700)
val Silver = Color(0xFFC0C0C0)
val Bronze = Color(0xFFCD7F32)

// Core Semantic Tokens
val Coral = SoftPurple
val CoralDark = VioletDark
val CoralLight = VioletLight
val CoralGradientStart = GradientStart
val CoralGradientEnd = GradientEnd
val Teal = WarmCoral
val TealDark = Color(0xFFE67345)
val SoftYellow = WarningAmber
val SoftYellowDark = Color(0xFFE6A800)
val WarmWhite = LavenderWhite
val SurfaceElevated = SurfaceLight
val DeepNavy = DeepPlum
val WarmGray = MutedPurple
val LightGray = HintPurple
val HintGray = HintPurple
val Midnight = MidnightPlum
val MidnightDeep = DeepIndigo
val MidnightSurface = SurfaceDark

// App Level Mappings
val Primary = SoftPurple
val PrimaryVariant = VioletDark
val Secondary = WarmCoral
val Background = LightBackground
val Surface = LightSurface
val TextPrimary = LightTextPrimary
val TextSecondary = LightTextSecondary
val ErrorColor = ErrorRed
