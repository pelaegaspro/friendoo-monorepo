package com.friendoo.app.core.utils

import androidx.compose.ui.graphics.Color

object AnonymityUtils {
    private val colors = listOf(
        "#F44336", "#E91E63", "#9C27B0", "#673AB7", 
        "#3F51B5", "#2196F3", "#03A9F4", "#00BCD4", 
        "#009688", "#4CAF50", "#8BC34A", "#CDDC39", 
        "#FFEB3B", "#FFC107", "#FF9800", "#FF5722"
    )
    
    private val colorAnimals = listOf("Tiger", "Lion", "Eagle", "Shark", "Wolf", "Bear", "Fox", "Hawk", "Panda", "Deer")
    private val colorPrefixes = listOf("Red", "Blue", "Green", "Gold", "Silver", "Black", "White", "Purple", "Cyan", "Magenta")

    fun generateAnonymousAlias(): String {
        return "${colorPrefixes.random()}${colorAnimals.random()}${(10..99).random()}"
    }

    fun getRandomColorHex(): String {
        return colors.random()
    }

    fun hexToColor(hex: String): Color {
        return try {
            Color(android.graphics.Color.parseColor(hex))
        } catch (e: Exception) {
            Color(0xFF6200EE)
        }
    }
}
