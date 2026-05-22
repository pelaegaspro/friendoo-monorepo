package com.friendoo.app.presentation.theme

import android.app.Activity
import android.os.Build
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

@Composable
private fun isSystemInDarkTheme(): Boolean = false

private val LightColors = lightColorScheme(
    primary = SoftPurple,
    onPrimary = Color.White,
    primaryContainer = SoftPurple.copy(alpha = 0.08f),
    onPrimaryContainer = SoftPurple,
    secondary = WarmCoral,
    onSecondary = Color.White,
    secondaryContainer = WarmCoral.copy(alpha = 0.08f),
    onSecondaryContainer = WarmCoral,
    tertiary = RosePink,
    onTertiary = Color.White,
    tertiaryContainer = RosePink.copy(alpha = 0.08f),
    onTertiaryContainer = RosePink,
    background = LightBackground,
    onBackground = LightTextPrimary,
    surface = LightSurface,
    onSurface = LightTextPrimary,
    surfaceVariant = LightCard,
    onSurfaceVariant = LightTextSecondary,
    surfaceTint = SoftPurple,
    inverseSurface = LightTextPrimary,
    inverseOnSurface = Color.White,
    error = ErrorRed,
    onError = Color.White,
    errorContainer = ErrorRed.copy(alpha = 0.1f),
    onErrorContainer = ErrorRed,
    outline = LightDivider,
    outlineVariant = LightDivider.copy(alpha = 0.5f),
    scrim = LightTextPrimary.copy(alpha = 0.3f)
)

private val DarkColors = darkColorScheme(
    primary = SoftPurple,
    onPrimary = DarkBackground,
    primaryContainer = SoftPurple.copy(alpha = 0.15f),
    onPrimaryContainer = SoftPurple,
    secondary = WarmCoral,
    onSecondary = DarkBackground,
    secondaryContainer = WarmCoral.copy(alpha = 0.12f),
    onSecondaryContainer = WarmCoral,
    tertiary = RosePink,
    onTertiary = DarkBackground,
    tertiaryContainer = RosePink.copy(alpha = 0.12f),
    onTertiaryContainer = RosePink,
    background = DarkBackground,
    onBackground = DarkTextPrimary,
    surface = DarkSurface,
    onSurface = DarkTextPrimary,
    surfaceVariant = DarkCard,
    onSurfaceVariant = DarkTextSecondary,
    surfaceTint = SoftPurple,
    inverseSurface = DarkTextPrimary,
    inverseOnSurface = DarkBackground,
    error = ErrorRed,
    onError = Color.White,
    errorContainer = ErrorRed.copy(alpha = 0.2f),
    onErrorContainer = ErrorRed,
    outline = DarkDivider,
    outlineVariant = DarkDivider.copy(alpha = 0.5f),
    scrim = DarkBackground.copy(alpha = 0.6f)
)

// Gradient brushes for reuse (Friendoo Identity)
object FriendooGradients {
    val primary: Brush
        @Composable get() = Brush.linearGradient(
            colors = listOf(SoftPurple, RosePink, WarmCoral)
        )

    val primaryHorizontal: Brush
        @Composable get() = Brush.horizontalGradient(
            colors = listOf(SoftPurple, RosePink, WarmCoral)
        )

    val surface: Brush
        @Composable get() = Brush.verticalGradient(
            colors = if (isSystemInDarkTheme()) listOf(DarkSurface, DarkBackground)
            else listOf(LightSurface, LightBackground)
        )

    val darkOverlay: Brush
        @Composable get() = Brush.verticalGradient(
            colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.6f))
        )
}

// Local provider for easy access to theme-aware colors
data class FriendooColors(
    val textPrimary: Color,
    val textSecondary: Color,
    val textHint: Color,
    val gradientStart: Color,
    val gradientEnd: Color,
    val border: Color = Color.Unspecified,
    val cardBackground: Color = Color.Unspecified
)

val LocalFriendooColors = staticCompositionLocalOf {
    FriendooColors(
        textPrimary = LightTextPrimary,
        textSecondary = LightTextSecondary,
        textHint = LightTextSecondary.copy(alpha = 0.6f),
        gradientStart = GradientStart,
        gradientEnd = GradientEnd,
        border = LightDivider,
        cardBackground = LightCard
    )
}

@Composable
fun FriendooTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColors
        else -> LightColors
    }

    val friendooColors = if (darkTheme) {
        FriendooColors(
            textPrimary = DarkTextPrimary,
            textSecondary = DarkTextSecondary,
            textHint = DarkTextSecondary.copy(alpha = 0.6f),
            gradientStart = GradientStartDark,
            gradientEnd = GradientEndDark,
            border = DarkDivider,
            cardBackground = DarkCard
        )
    } else {
        FriendooColors(
            textPrimary = LightTextPrimary,
            textSecondary = LightTextSecondary,
            textHint = LightTextSecondary.copy(alpha = 0.6f),
            gradientStart = GradientStart,
            gradientEnd = GradientEnd,
            border = LightDivider,
            cardBackground = LightCard
        )
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    androidx.compose.runtime.CompositionLocalProvider(LocalFriendooColors provides friendooColors) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = AppTypography,
            shapes = AppShapes,
            content = content
        )
    }
}
