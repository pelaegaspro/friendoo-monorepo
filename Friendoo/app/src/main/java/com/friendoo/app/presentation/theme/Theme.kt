package com.friendoo.app.presentation.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColors = lightColorScheme(
    primary = Coral,
    onPrimary = PureWhite,
    primaryContainer = CoralLight,
    onPrimaryContainer = PureWhite,
    secondary = Teal,
    onSecondary = PureWhite,
    secondaryContainer = Teal.copy(alpha = 0.15f),
    onSecondaryContainer = TealDark,
    tertiary = SoftYellow,
    onTertiary = DeepNavy,
    tertiaryContainer = SoftYellow.copy(alpha = 0.2f),
    onTertiaryContainer = SoftYellowDark,
    background = WarmWhite,
    onBackground = DeepNavy,
    surface = PureWhite,
    onSurface = DeepNavy,
    surfaceVariant = SurfaceElevated,
    onSurfaceVariant = WarmGray,
    surfaceTint = Coral,
    inverseSurface = Midnight,
    inverseOnSurface = PureWhite,
    error = ErrorRed,
    onError = PureWhite,
    errorContainer = ErrorRed.copy(alpha = 0.1f),
    onErrorContainer = ErrorRed,
    outline = BorderLight,
    outlineVariant = BorderLight.copy(alpha = 0.5f),
    scrim = Midnight.copy(alpha = 0.5f)
)

private val DarkColors = darkColorScheme(
    primary = CoralLight,
    onPrimary = DeepNavy,
    primaryContainer = CoralDark,
    onPrimaryContainer = PureWhite,
    secondary = Teal,
    onSecondary = PureWhite,
    secondaryContainer = Teal.copy(alpha = 0.2f),
    onSecondaryContainer = Teal,
    tertiary = SoftYellow,
    onTertiary = DeepNavy,
    tertiaryContainer = SoftYellow.copy(alpha = 0.15f),
    onTertiaryContainer = SoftYellow,
    background = Midnight,
    onBackground = PureWhite,
    surface = MidnightSurface,
    onSurface = PureWhite,
    surfaceVariant = MidnightDeep,
    onSurfaceVariant = LightGray,
    surfaceTint = CoralLight,
    inverseSurface = PureWhite,
    inverseOnSurface = DeepNavy,
    error = ErrorRed,
    onError = PureWhite,
    errorContainer = ErrorRed.copy(alpha = 0.2f),
    onErrorContainer = ErrorRed,
    outline = MidnightSurface,
    outlineVariant = MidnightDeep,
    scrim = Midnight.copy(alpha = 0.7f)
)

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

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        shapes = AppShapes,
        content = content
    )
}
