package com.friendoo.app.presentation.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(6.dp),
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(14.dp),
    large = RoundedCornerShape(20.dp),
    extraLarge = RoundedCornerShape(28.dp)
)

// Custom shape extensions
val CardShape = RoundedCornerShape(24.dp)
val ButtonShape = RoundedCornerShape(20.dp)
val InputShape = RoundedCornerShape(16.dp)
val ChipShape = RoundedCornerShape(24.dp)
val PillShape = RoundedCornerShape(50)
val BottomSheetShape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
val HeroCardShape = RoundedCornerShape(28.dp)
