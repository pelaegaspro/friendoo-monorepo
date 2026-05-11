package com.friendoo.app.presentation.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(20.dp)
)

// Custom shape extensions
val CardShape = RoundedCornerShape(20.dp)
val ButtonShape = RoundedCornerShape(16.dp)
val InputShape = RoundedCornerShape(16.dp)
val ChipShape = RoundedCornerShape(20.dp)
val PillShape = RoundedCornerShape(50)
val BottomSheetShape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
